import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DETECT = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<
    "granted" | "denied" | "prompt"
  >("prompt");
  const [eyeState, setEyeState] = useState<"OPEN" | "CLOSED">("OPEN");
  const [eyeOpenness, setEyeOpenness] = useState(0);
  const [closedFor, setClosedFor] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const [lowThreshold, setLowThreshold] = useState(0); // For debugging
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null); // WebSocket reference
  const frameTimer = useRef<NodeJS.Timeout | null>(null); // Frame sending timer

  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  // This function sends a single frame to the backend
  const sendFrame = () => {
    try {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 3 && // Wait for HAVE_FUTURE_DATA or more
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Flip the video horizontally so it's a "mirror"
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          // Get frame data as JPEG
          const frameData = canvas.toDataURL("image/jpeg", 0.8);

          // Send to backend
          wsRef.current.send(
            JSON.stringify({
              type: "frame",
              data: frameData,
            })
          );
        }
      } else if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log(
          `Skipping frame: video readyState is ${videoRef.current?.readyState}`
        );
      }
    } catch (error) {
      console.error("Error sending frame:", error);
      addLog("Error sending frame. Stopping detection.");
      stopCamera(); // Stop if sending frames fails
    }
  };

  // New function to handle WebSocket connection
  // This is now called by the video's 'onCanPlay' event
  const connectToBackend = () => {
    // Prevent multiple connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    addLog("Video ready. Connecting to backend...");
    wsRef.current = new WebSocket("ws://localhost:8000/ws");

    wsRef.current.onopen = () => {
      addLog("Connected to backend server");
      setIsCalibrating(true);
      addLog("Calibration started. Look straight at camera.");

      // Start sending frames
      frameTimer.current = setInterval(sendFrame, 150);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "state") {
        const {
          state,
          eye,
          TH_LOW,
          baseline_ready,
          closed_for,
          alarm,
          detected,
        } = data.payload;

        if (detected) {
          // Update all our UI states with REAL data
          setEyeState(state);
          setEyeOpenness(eye);
          setLowThreshold(TH_LOW); // For debugging
          setClosedFor(closed_for);
          setIsAlarmActive(alarm); // Controls the alarm modal

          // Update calibration state
          if (isCalibrating && baseline_ready) {
            addLog("Calibration complete");
            toast({
              title: "Calibration Complete",
              description: "Detection is now active",
            });
          }
          setIsCalibrating(!baseline_ready);
        }
      } else if (data.type === "info") {
        addLog(`Backend: ${data.message}`);
      }
    };

    wsRef.current.onclose = () => {
      addLog("Disconnected from backend server");
      // Don't call stopCamera() here to prevent loops, 
      // it will be handled by the user stopping or an error.
    };

    wsRef.current.onerror = (err) => {
      console.error("WebSocket Error:", err);
      addLog("Connection error. Is backend running?");
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Could not connect to the backend server.",
      });
      stopCamera();
    };
  };

  // This function is now the REAL start function
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play(); // Explicitly play the video
      }

      setCameraPermission("granted");
      setIsDetecting(true);
      addLog("Camera started successfully");
      // Note: Connection to backend now happens 'onCanPlay'
    } catch (error) {
      console.error("Camera error:", error);
      setCameraPermission("denied");
      addLog("Camera access denied");
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please allow camera access to use detection",
      });
    }
  };

  // This function now also stops the WebSocket connection
  const stopCamera = () => {
    // Stop sending frames
    if (frameTimer.current) {
      clearInterval(frameTimer.current);
      frameTimer.current = null;
    }

    // Close WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsDetecting(false);
    setIsCalibrating(false);
    setEyeOpenness(0);
    setClosedFor(0);
    setLowThreshold(0);
    setIsAlarmActive(false);
    addLog("Detection stopped");
  };

  // This now sends a REAL command to the backend
  const recalibrate = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "cmd",
          cmd: "begin_baseline",
        })
      );
      addLog("Recalibration command sent");
      setIsCalibrating(true);
    } else {
      addLog("Cannot recalibrate: Not connected");
    }
  };

  // This is now controlled by the backend 'alarm' state
  const stopAlarm = () => {
    setIsAlarmActive(false);
    setClosedFor(0);
    addLog("Alarm dismissed");
  };

  useEffect(() => {
    // This cleanup runs when the component is unmounted
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Live Detection</h1>
          <p className="text-muted-foreground">
            Monitor your drowsiness levels in real-time
          </p>
        </div>

        {/* Main Detection Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-card rounded-xl border-2 border-primary/30 overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
              {!isDetecting ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera not active</p>
                  <Button onClick={startCamera} size="lg" className="gap-2">
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)" }}
                    // --- THIS IS THE FIX ---
                    // This function will run ONLY when the video is ready
                    onCanPlay={connectToBackend}
                    // --- END THE FIX ---
                  />

                  {/* Overlays */}
                  <div className="absolute top-4 left-4">
                    <Badge
                      variant={eyeState === "OPEN" ? "default" : "destructive"}
                      className={`text-lg px-4 py-2 ${
                        eyeState === "OPEN"
                          ? "bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.6)]"
                          : "bg-destructive shadow-[0_0_15px_hsl(var(--destructive)/0.6)] animate-pulse-neon-red"
                      }`}
                    >
                      {eyeState}
                    </Badge>
                  </div>

                  {isCalibrating && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="glass-card p-8 rounded-xl space-y-4 max-w-md w-full mx-4">
                        <h3 className="text-xl font-semibold text-center">
                          Calibrating...
                        </h3>
                        {/* We don't get progress % from backend, so show an indeterminate-style bar */}
                        <Progress value={undefined} className="h-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Establishing baseline. Please look straight at the
                          camera with your eyes open.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex gap-3">
              {isDetecting ? (
                <>
                  <Button
                    onClick={stopCamera}
                    variant="destructive"
                    className="gap-2"
                  >
                    <CameraOff className="w-4 h-4" />
                    Stop Detection
                  </Button>
                  <Button
                    onClick={recalibrate}
                    variant="outline"
                    className="gap-2"
                    disabled={isCalibrating}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recalibrate
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-4">
            {/* --- ADDED DEBUG PANEL --- */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Debug Info
              </h3>
              <div className="text-sm space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Current EAR:</span>
                  <span className="font-bold">{eyeOpenness.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drowsy Threshold:</span>
                  <span className="font-bold">{lowThreshold.toFixed(3)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  Alarm triggers when 'Current EAR' drops below 'Drowsy
                  Threshold'.
                </p>
              </div>
            </div>
            {/* --- END ADDED DEBUG PANEL --- */}

            {/* Eye Openness (Kept for visual) */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Eye Openness
              </h3>
              <div className="text-3xl font-bold font-mono">
                {eyeOpenness.toFixed(3)}
              </div>
              <Progress
                value={(eyeOpenness / (lowThreshold * 1.5 || 1)) * 100}
                className="h-2"
              />
            </div>

            {/* Closed Timer */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Closed Duration
              </h3>
              <div className="text-3xl font-bold font-mono">
                {closedFor.toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">
                Threshold: 1.2s
              </div>
              <Progress value={(closedFor / 1.2) * 100} className="h-2" />
            </div>

            {/* Status (This will now work correctly) */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                System Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Backend</span>
                  <Badge variant={isDetecting ? "default" : "secondary"}>
                    {isDetecting ? "Connected" : "Offline"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Calibration</span>
                  <Badge variant={isCalibrating ? "secondary" : "default"}>
                    {isCalibrating ? "In Progress" : "Ready"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logs (This will now show backend logs) */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Activity Log
          </h3>
          <div className="space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alarm Modal (This will now work correctly) */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-50 bg-destructive/20 backdrop-blur-sm flex items-center justify-center animate-pulse-neon-red">
          <div className="glass-card p-12 rounded-xl max-w-md mx-4 text-center space-y-6 border-2 border-destructive">
            <AlertTriangle className="w-24 h-24 text-destructive mx-auto animate-pulse" />
            <h2 className="text-4xl font-bold text-destructive">
              ⚠️ Stay Awake!
            </h2>
            <p className="text-lg">Your eyes have been closed for too long</p>
            <Button
              onClick={stopAlarm}
              size="lg"
              variant="destructive"
              className="w-full text-lg py-6"
            >
              Stop Alarm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DETECT;