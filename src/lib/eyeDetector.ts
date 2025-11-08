import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Eye landmark indices for MediaPipe Face Mesh
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export class EyeDetector {
  private faceLandmarker: FaceLandmarker | null = null;
  private baseline: number[] = [];
  private isCalibrating = false;
  private TH_LOW = 0.015;
  private TH_HIGH = 0.02;
  private smoothedEye = 0.03;
  private smoothingFactor = 0.7;
  private closedFrames = 0;
  private openFrames = 0;
  private FRAMES_REQUIRED = 5;
  private eyeState: "OPEN" | "CLOSED" = "OPEN";
  private closedStartTime = 0;
  private refractoryUntil = 0;
  private CLOSED_SECONDS = 1.2;
  private REFRACTORY = 2.5;

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    
    this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      numFaces: 1,
      runningMode: "VIDEO",
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }

  private calculateEAR(landmarks: any[], indices: number[]): number {
    const points = indices.map(i => landmarks[i]);
    
    // Vertical distances
    const v1 = Math.sqrt(
      Math.pow(points[1].x - points[5].x, 2) +
      Math.pow(points[1].y - points[5].y, 2)
    );
    const v2 = Math.sqrt(
      Math.pow(points[2].x - points[4].x, 2) +
      Math.pow(points[2].y - points[4].y, 2)
    );
    
    // Horizontal distance
    const h = Math.sqrt(
      Math.pow(points[0].x - points[3].x, 2) +
      Math.pow(points[0].y - points[3].y, 2)
    );
    
    return (v1 + v2) / (2.0 * h);
  }

  processFrame(video: HTMLVideoElement, timestamp: number) {
    if (!this.faceLandmarker) {
      return null;
    }

    const results = this.faceLandmarker.detectForVideo(video, timestamp);
    
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      return {
        detected: false,
        state: this.eyeState,
        eye: this.smoothedEye,
        TH_LOW: this.TH_LOW,
        TH_HIGH: this.TH_HIGH,
        baseline_ready: this.baseline.length >= 20,
        closed_for: 0,
        alarm: false
      };
    }

    const landmarks = results.faceLandmarks[0];
    const leftEAR = this.calculateEAR(landmarks, LEFT_EYE_INDICES);
    const rightEAR = this.calculateEAR(landmarks, RIGHT_EYE_INDICES);
    const rawEye = (leftEAR + rightEAR) / 2.0;

    // Smooth the signal
    this.smoothedEye = this.smoothingFactor * this.smoothedEye + (1 - this.smoothingFactor) * rawEye;

    // Baseline calibration
    if (this.isCalibrating) {
      this.baseline.push(this.smoothedEye);
      if (this.baseline.length >= 20) {
        const sorted = [...this.baseline].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        this.TH_LOW = median * 0.75;
        this.TH_HIGH = median * 0.85;
        this.isCalibrating = false;
      }
    }

    const now = Date.now() / 1000;
    
    // State machine
    if (this.smoothedEye < this.TH_LOW) {
      this.closedFrames++;
      this.openFrames = 0;
      
      if (this.closedFrames >= this.FRAMES_REQUIRED && this.eyeState === "OPEN") {
        this.eyeState = "CLOSED";
        this.closedStartTime = now;
      }
    } else if (this.smoothedEye > this.TH_HIGH) {
      this.openFrames++;
      this.closedFrames = 0;
      
      if (this.openFrames >= this.FRAMES_REQUIRED && this.eyeState === "CLOSED") {
        this.eyeState = "OPEN";
        this.closedStartTime = 0;
      }
    }

    let closedFor = 0;
    let alarm = false;

    if (this.eyeState === "CLOSED" && this.closedStartTime > 0) {
      closedFor = now - this.closedStartTime;
      
      if (closedFor >= this.CLOSED_SECONDS && now > this.refractoryUntil) {
        alarm = true;
        this.refractoryUntil = now + this.REFRACTORY;
      }
    }

    return {
      detected: true,
      state: this.eyeState,
      eye: this.smoothedEye,
      TH_LOW: this.TH_LOW,
      TH_HIGH: this.TH_HIGH,
      baseline_ready: this.baseline.length >= 20,
      closed_for: closedFor,
      alarm
    };
  }

  startCalibration() {
    this.baseline = [];
    this.isCalibrating = true;
  }

  isCalibrationInProgress() {
    return this.isCalibrating;
  }

  getCalibrationProgress() {
    return Math.min((this.baseline.length / 20) * 100, 100);
  }

  updateSettings(settings: { closedSeconds?: number; refractory?: number; smoothingFactor?: number }) {
    if (settings.closedSeconds !== undefined) this.CLOSED_SECONDS = settings.closedSeconds;
    if (settings.refractory !== undefined) this.REFRACTORY = settings.refractory;
    if (settings.smoothingFactor !== undefined) this.smoothingFactor = settings.smoothingFactor;
  }
}
