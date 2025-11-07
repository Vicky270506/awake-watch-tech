# DrowsyVision Backend Setup

This document provides complete instructions for setting up and deploying the DrowsyVision backend with FastAPI, MediaPipe, and WebSocket support.

## 🏗️ Architecture Overview

```
Frontend (React)  ←→  WebSocket  ←→  FastAPI Backend  ←→  MediaPipe + OpenCV
```

- **Frontend**: Captures webcam frames and sends via WebSocket
- **Backend**: Processes frames with MediaPipe FaceMesh, detects drowsiness, returns state
- **Protocol**: JSON over WebSocket for low-latency communication

## 📋 Prerequisites

- Python 3.9+
- pip or conda
- Docker (for containerized deployment)
- Git

## 🚀 Quick Start (Local Development)

### Step 1: Clone and Setup

```bash
# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install fastapi uvicorn websockets opencv-python mediapipe numpy python-multipart
```

### Step 2: Create the Detector Module

Create `backend/detector.py`:

```python
import cv2
import mediapipe as mp
import numpy as np
from typing import Dict, Optional
from dataclasses import dataclass
import time

@dataclass
class DetectorState:
    state: str  # "OPEN" or "CLOSED"
    eye_openness: float
    th_low: float
    th_high: float
    baseline_ready: bool
    closed_for: float
    alarm: bool
    detected: bool

class DrowsinessDetector:
    def __init__(
        self,
        closed_seconds: float = 1.2,
        refractory: float = 2.5,
        smoothing_factor: float = 0.7,
        baseline_frames: int = 60,
        frames_required: int = 5
    ):
        self.CLOSED_SECONDS = closed_seconds
        self.REFRACTORY = refractory
        self.SMOOTHING_FACTOR = smoothing_factor
        self.BASELINE_FRAMES = baseline_frames
        self.FRAMES_REQUIRED = frames_required
        
        # MediaPipe setup
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # State variables
        self.baseline_buffer = []
        self.TH_LOW = None
        self.TH_HIGH = None
        self.smoothed_eye = None
        self.current_state = "OPEN"
        self.closed_start = None
        self.last_alarm_time = None
        self.consecutive_detections = 0
        
    def calculate_eye_openness(self, landmarks, img_h, img_w) -> Optional[float]:
        """Calculate eye aspect ratio (EAR) from facial landmarks."""
        # Left eye indices
        LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
        # Right eye indices  
        RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
        
        def get_eye_ear(eye_indices):
            points = []
            for idx in eye_indices:
                x = int(landmarks[idx].x * img_w)
                y = int(landmarks[idx].y * img_h)
                points.append((x, y))
            
            # Calculate EAR
            vertical_1 = np.linalg.norm(np.array(points[1]) - np.array(points[5]))
            vertical_2 = np.linalg.norm(np.array(points[2]) - np.array(points[4]))
            horizontal = np.linalg.norm(np.array(points[0]) - np.array(points[3]))
            
            ear = (vertical_1 + vertical_2) / (2.0 * horizontal)
            return ear
        
        left_ear = get_eye_ear(LEFT_EYE_INDICES)
        right_ear = get_eye_ear(RIGHT_EYE_INDICES)
        
        return (left_ear + right_ear) / 2.0
    
    def process_frame(self, frame: np.ndarray) -> DetectorState:
        """Process a single frame and return detector state."""
        img_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(img_rgb)
        
        if not results.multi_face_landmarks:
            return DetectorState(
                state=self.current_state,
                eye_openness=self.smoothed_eye or 0.0,
                th_low=self.TH_LOW or 0.0,
                th_high=self.TH_HIGH or 0.0,
                baseline_ready=self.TH_LOW is not None,
                closed_for=0.0,
                alarm=False,
                detected=False
            )
        
        landmarks = results.multi_face_landmarks[0].landmark
        img_h, img_w = frame.shape[:2]
        
        raw_eye = self.calculate_eye_openness(landmarks, img_h, img_w)
        if raw_eye is None:
            return self._get_current_state(detected=False)
        
        # Smoothing
        if self.smoothed_eye is None:
            self.smoothed_eye = raw_eye
        else:
            self.smoothed_eye = (self.SMOOTHING_FACTOR * self.smoothed_eye + 
                               (1 - self.SMOOTHING_FACTOR) * raw_eye)
        
        # Baseline calibration
        if self.TH_LOW is None:
            self.baseline_buffer.append(self.smoothed_eye)
            if len(self.baseline_buffer) >= self.BASELINE_FRAMES:
                median = np.median(self.baseline_buffer)
                self.TH_LOW = median * 0.75
                self.TH_HIGH = median * 0.85
                print(f"Baseline complete: TH_LOW={self.TH_LOW:.4f}, TH_HIGH={self.TH_HIGH:.4f}")
            
            return self._get_current_state(detected=True)
        
        # State machine
        if self.smoothed_eye < self.TH_LOW:
            if self.current_state == "OPEN":
                self.current_state = "CLOSED"
                self.closed_start = time.time()
                self.consecutive_detections = 1
            else:
                self.consecutive_detections += 1
        elif self.smoothed_eye > self.TH_HIGH:
            self.current_state = "OPEN"
            self.closed_start = None
            self.consecutive_detections = 0
        
        # Check for alarm
        alarm = False
        closed_for = 0.0
        
        if (self.current_state == "CLOSED" and 
            self.closed_start and 
            self.consecutive_detections >= self.FRAMES_REQUIRED):
            
            closed_for = time.time() - self.closed_start
            
            # Check if we should trigger alarm
            if closed_for >= self.CLOSED_SECONDS:
                current_time = time.time()
                if (self.last_alarm_time is None or 
                    current_time - self.last_alarm_time >= self.REFRACTORY):
                    alarm = True
                    self.last_alarm_time = current_time
                    print(f"⚠️ ALARM! Eyes closed for {closed_for:.2f}s")
        
        return DetectorState(
            state=self.current_state,
            eye_openness=self.smoothed_eye,
            th_low=self.TH_LOW,
            th_high=self.TH_HIGH,
            baseline_ready=True,
            closed_for=closed_for,
            alarm=alarm,
            detected=True
        )
    
    def _get_current_state(self, detected: bool) -> DetectorState:
        return DetectorState(
            state=self.current_state,
            eye_openness=self.smoothed_eye or 0.0,
            th_low=self.TH_LOW or 0.0,
            th_high=self.TH_HIGH or 0.0,
            baseline_ready=self.TH_LOW is not None,
            closed_for=0.0,
            alarm=False,
            detected=detected
        )
    
    def reset_baseline(self):
        """Reset baseline calibration."""
        self.baseline_buffer = []
        self.TH_LOW = None
        self.TH_HIGH = None
        self.current_state = "OPEN"
        self.closed_start = None
        print("Baseline reset")
    
    def update_params(self, closed_seconds=None, refractory=None, smoothing_factor=None):
        """Update detection parameters."""
        if closed_seconds is not None:
            self.CLOSED_SECONDS = closed_seconds
        if refractory is not None:
            self.REFRACTORY = refractory
        if smoothing_factor is not None:
            self.SMOOTHING_FACTOR = smoothing_factor
```

### Step 3: Create the FastAPI Server

Create `backend/main.py`:

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import base64
import json
from detector import DrowsinessDetector

app = FastAPI(title="DrowsyVision API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "DrowsyVision API", "status": "running"}

@app.get("/healthz")
async def health():
    return {"status": "healthy"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    detector = DrowsinessDetector()
    
    try:
        await websocket.send_json({
            "type": "info",
            "message": "Connected to DrowsyVision detector"
        })
        
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            if data["type"] == "frame":
                # Decode base64 frame
                frame_data = data["data"].split(",")[1]  # Remove data:image/jpeg;base64,
                frame_bytes = base64.b64decode(frame_data)
                frame_array = np.frombuffer(frame_bytes, dtype=np.uint8)
                frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
                
                # Process frame
                state = detector.process_frame(frame)
                
                # Send state back to client
                await websocket.send_json({
                    "type": "state",
                    "payload": {
                        "state": state.state,
                        "eye": state.eye_openness,
                        "TH_LOW": state.th_low,
                        "TH_HIGH": state.th_high,
                        "baseline_ready": state.baseline_ready,
                        "closed_for": state.closed_for,
                        "alarm": state.alarm,
                        "detected": state.detected
                    }
                })
            
            elif data["type"] == "cmd":
                cmd = data["cmd"]
                
                if cmd == "begin_baseline":
                    detector.reset_baseline()
                    await websocket.send_json({
                        "type": "info",
                        "message": "baseline_started"
                    })
                
                elif cmd == "set_params":
                    params = data.get("params", {})
                    detector.update_params(
                        closed_seconds=params.get("CLOSED_SECONDS"),
                        refractory=params.get("REFRACTORY"),
                        smoothing_factor=params.get("SMOOTHING_FACTOR")
                    )
                    await websocket.send_json({
                        "type": "info",
                        "message": "parameters_updated"
                    })
    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Step 4: Run the Backend

```bash
# Make sure you're in the backend directory with venv activated
python main.py

# Server will start on http://localhost:8000
# WebSocket endpoint: ws://localhost:8000/ws
```

## 🐳 Docker Deployment

### Create Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Create requirements.txt

Create `backend/requirements.txt`:

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
websockets==12.0
opencv-python-headless==4.9.0.80
mediapipe==0.10.9
numpy==1.24.3
python-multipart==0.0.6
```

### Build and Run

```bash
# Build Docker image
docker build -t drowsyvision-backend .

# Run container
docker run -p 8000:8000 drowsyvision-backend
```

## ☁️ Deployment Options

### Option 1: Render.com

1. Create `render.yaml`:

```yaml
services:
  - type: web
    name: drowsyvision-backend
    env: docker
    region: oregon
    plan: starter
    dockerfilePath: ./Dockerfile
    envVars:
      - key: PORT
        value: 8000
```

2. Deploy:
   - Push code to GitHub
   - Connect repository to Render
   - Render will auto-deploy

### Option 2: Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 3: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

## 🔌 Frontend Integration

Update your frontend WebSocket connection:

```typescript
// In src/pages/Detect.tsx
const ws = new WebSocket('ws://localhost:8000/ws');  // Local
// or
const ws = new WebSocket('wss://your-backend.onrender.com/ws');  // Production

ws.onopen = () => {
  console.log('Connected to backend');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'state') {
    const { state, eye, closed_for, alarm } = data.payload;
    setEyeState(state);
    setEyeOpenness(eye);
    setClosedFor(closed_for);
    
    if (alarm) {
      triggerAlarm();
    }
  }
};

// Send frames
const sendFrame = (videoElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);
  
  const frameData = canvas.toDataURL('image/jpeg', 0.8);
  
  ws.send(JSON.stringify({
    type: 'frame',
    data: frameData
  }));
};

// Send every 100-200ms
setInterval(() => sendFrame(videoRef.current), 150);
```

## 🧪 Testing

### Test with curl

```bash
# Health check
curl http://localhost:8000/healthz
```

### Test WebSocket

Use a WebSocket testing tool like `wscat`:

```bash
npm install -g wscat
wscat -c ws://localhost:8000/ws
```

## 📊 Session Tracking (Optional)

Add session endpoints to `main.py`:

```python
from datetime import datetime
from typing import List
from pydantic import BaseModel

class SessionEvent(BaseModel):
    timestamp: str
    event_type: str
    details: dict

sessions = []

@app.post("/session/start")
async def start_session():
    session = {
        "id": len(sessions) + 1,
        "start": datetime.now().isoformat(),
        "events": []
    }
    sessions.append(session)
    return session

@app.post("/session/event")
async def log_event(event: SessionEvent):
    if sessions:
        sessions[-1]["events"].append(event.dict())
    return {"status": "logged"}

@app.get("/session/list")
async def list_sessions():
    return sessions
```

## 🔒 Security Considerations

1. **CORS**: Update `allow_origins` to your frontend URL only
2. **Rate Limiting**: Add rate limiting middleware
3. **Authentication**: Add JWT or API key authentication
4. **HTTPS**: Always use WSS (secure WebSocket) in production

## 📝 Environment Variables

Create `.env` file:

```env
PORT=8000
CORS_ORIGINS=http://localhost:5173,https://your-frontend.com
```

## 🐛 Troubleshooting

### MediaPipe not detecting faces
- Ensure good lighting
- Check camera resolution (recommended: 640x480)
- Verify frame is not corrupted

### WebSocket disconnects
- Implement reconnection logic in frontend
- Add heartbeat/ping-pong messages
- Check network stability

### High CPU usage
- Reduce frame rate (send frames less frequently)
- Lower video resolution
- Use `opencv-python-headless` instead of `opencv-python`

## 📚 Additional Resources

- [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh)
- [FastAPI WebSockets](https://fastapi.tiangolo.com/advanced/websockets/)
- [OpenCV Python Tutorials](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)

## 🎯 Next Steps

1. Set up the backend locally
2. Test with sample images/video
3. Integrate with frontend
4. Deploy to cloud platform
5. Add session tracking and analytics
6. Implement proper error handling and logging
