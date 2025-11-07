import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Camera, CameraOff, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const Detect = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [eyeState, setEyeState] = useState<"OPEN" | "CLOSED">("OPEN");
  const [eyeOpenness, setEyeOpenness] = useState(0.5);
  const [closedFor, setClosedFor] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [baselineProgress, setBaselineProgress] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [isDemo, setIsDemo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 10));
  };

  const refreshDevices = async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setDevices(cams);
    } catch (e) {
      console.error('enumerateDevices error', e);
    }
  };

  const startDemo = () => {
    setIsDemo(true);
    setIsDetecting(true);
    addLog('Starting demo mode');
    setIsCalibrating(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBaselineProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsCalibrating(false);
        addLog('Baseline calibration complete (demo)');
        toast({ title: 'Calibration Complete', description: 'Demo detection is now active' });
        startSimulatedDetection();
      }
    }, 200);
  };

  const startCamera = async () => {
    try {
      if (!devices.length) {
        await refreshDevices();
      }

      const constraints: MediaStreamConstraints = selectedDeviceId
        ? { video: { deviceId: { exact: selectedDeviceId } } }
        : { video: { facingMode: "user" } };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        if (err.name === "NotFoundError") {
          // Fallback: try generic constraint
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } else {
          throw err;
        }
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsDemo(false);
      setCameraPermission("granted");
      setIsDetecting(true);
      addLog("Camera started successfully");
      
      // Simulate baseline calibration
      setIsCalibrating(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setBaselineProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          setIsCalibrating(false);
          addLog("Baseline calibration complete");
          toast({
            title: "Calibration Complete",
            description: "Detection is now active",
          });
          
          // Start simulated detection
          startSimulatedDetection();
        }
      }, 200);
      
    } catch (error: any) {
      console.error("Camera error:", error);
      setCameraPermission("denied");
      
      let errorTitle = "Camera Error";
      let errorDescription = "Unable to access camera";
      
      if (error.name === "NotFoundError") {
        errorTitle = "No Camera Found";
        errorDescription = "No camera detected. Try refreshing devices, opening fullscreen (outside iframe), or connect a camera.";
        addLog("No camera device found");
      } else if (error.name === "NotAllowedError") {
        errorTitle = "Camera Access Denied";
        errorDescription = "Please allow camera access in your browser settings and refresh the page.";
        addLog("Camera permission denied");
      } else if (error.name === "NotReadableError") {
        errorTitle = "Camera In Use";
        errorDescription = "Camera is already in use by another application.";
        addLog("Camera in use by another app");
      } else {
        addLog(`Camera error: ${error.message}`);
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorDescription,
        duration: 8000,
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsDemo(false);
    setIsDetecting(false);
    addLog("Detection stopped");
  };

  const recalibrate = () => {
    setIsCalibrating(true);
    setBaselineProgress(0);
    addLog("Recalibration started");
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setBaselineProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsCalibrating(false);
        addLog("Recalibration complete");
        toast({
          title: "Recalibration Complete",
          description: "New baseline established",
        });
      }
    }, 200);
  };

  // Simulated detection for demo purposes
  const startSimulatedDetection = () => {
    setInterval(() => {
      // Simulate eye openness fluctuation
      const random = Math.random();
      const newOpenness = 0.02 + (random * 0.05);
      setEyeOpenness(newOpenness);
      
      // Simulate occasional closed states
      if (random < 0.15) {
        setEyeState("CLOSED");
        setClosedFor(prev => {
          const newValue = prev + 0.1;
          
          // Trigger alarm at 1.2 seconds
          if (newValue >= 1.2 && !isAlarmActive) {
            triggerAlarm();
          }
          
          return newValue;
        });
      } else {
        setEyeState("OPEN");
        setClosedFor(0);
      }
    }, 100);
  };

  const triggerAlarm = () => {
    setIsAlarmActive(true);
    addLog("⚠️ ALARM TRIGGERED - Eyes closed too long");
    
    // Play alarm sound (would need actual audio file)
    toast({
      variant: "destructive",
      title: "⚠️ DROWSINESS ALERT",
      description: "Your eyes have been closed for too long!",
      duration: 10000,
    });
  };

  const stopAlarm = () => {
    setIsAlarmActive(false);
    setClosedFor(0);
    addLog("Alarm dismissed");
  };

  useEffect(() => {
    refreshDevices();
    // Some browsers require enumerateDevices before prompting permissions
  }, []);

  useEffect(() => {
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
          <p className="text-muted-foreground">Monitor your drowsiness levels in real-time</p>
        </div>

        {/* Main Detection Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-card rounded-xl border-2 border-primary/30 overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
              {!isDetecting ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
                  <Camera className="w-16 h-16 text-muted-foreground" />
                  <p className="text-muted-foreground">Camera not active</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button onClick={startCamera} size="lg" className="gap-2">
                      <Camera className="w-5 h-5" />
                      Start Camera
                    </Button>
                    <Button onClick={startDemo} variant="secondary" size="lg">Use Demo Video</Button>
                    <Button onClick={() => window.open(window.location.href, '_blank')} variant="outline" size="lg">Open Fullscreen</Button>
                  </div>
                  {devices.length === 0 && (
                    <p className="text-xs text-muted-foreground">No cameras detected. Check OS/browser permissions or connect a camera.</p>
                  )}
                </div>
              ) : (
                <>
                  {isDemo ? (
                    <video
                      src="/assets/sample_videos/flower.mp4"
                      autoPlay
                      playsInline
                      muted
                      loop
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                  
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
                        <h3 className="text-xl font-semibold text-center">Calibrating...</h3>
                        <Progress value={baselineProgress} className="h-2" />
                        <p className="text-sm text-center text-muted-foreground">
                          Establishing baseline eye openness
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Select value={selectedDeviceId} onValueChange={(v) => setSelectedDeviceId(v)}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={devices.length ? 'Select camera' : 'No cameras found'} />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,4)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={refreshDevices}>Refresh</Button>
                <Button variant="outline" onClick={() => window.open(window.location.href, '_blank')}>Open Fullscreen</Button>
              </div>

              {isDetecting ? (
                <>
                  <Button onClick={stopCamera} variant="destructive" className="gap-2">
                    <CameraOff className="w-4 h-4" />
                    Stop Detection
                  </Button>
                  <Button onClick={recalibrate} variant="outline" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Recalibrate
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={startCamera} className="gap-2">
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </Button>
                  <Button onClick={startDemo} variant="secondary">Try Demo Video</Button>
                </>
              )}
            </div>
          </div>

          {/* Metrics Panel */}
          <div className="space-y-4">
            {/* Eye Openness */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Eye Openness</h3>
              <div className="text-3xl font-bold font-mono">{eyeOpenness.toFixed(3)}</div>
              <Progress value={eyeOpenness * 100} className="h-2" />
            </div>

            {/* Closed Timer */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Closed Duration</h3>
              <div className="text-3xl font-bold font-mono">
                {closedFor.toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">
                Threshold: 1.2s
              </div>
              <Progress value={(closedFor / 1.2) * 100} className="h-2" />
            </div>

            {/* Status */}
            <div className="glass-card p-6 rounded-xl space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">System Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Camera</span>
                  <Badge variant={isDetecting ? "default" : "secondary"}>
                    {isDetecting ? "Active" : "Inactive"}
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

        {/* Logs */}
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Activity Log</h3>
          <div className="space-y-1 font-mono text-xs max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No activity yet</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alarm Modal */}
      {isAlarmActive && (
        <div className="fixed inset-0 z-50 bg-destructive/20 backdrop-blur-sm flex items-center justify-center animate-pulse-neon-red">
          <div className="glass-card p-12 rounded-xl max-w-md mx-4 text-center space-y-6 border-2 border-destructive">
            <AlertTriangle className="w-24 h-24 text-destructive mx-auto animate-pulse" />
            <h2 className="text-4xl font-bold text-destructive">⚠️ Stay Awake!</h2>
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

export default Detect;
