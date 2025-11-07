import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw, Save } from "lucide-react";

interface SettingsState {
  closedSeconds: number;
  refractory: number;
  smoothingFactor: number;
}

const defaultSettings: SettingsState = {
  closedSeconds: 1.2,
  refractory: 2.5,
  smoothingFactor: 0.7,
};

const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("drowsyvision-settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem("drowsyvision-settings", JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been saved successfully",
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem("drowsyvision-settings");
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize detection parameters</p>
        </div>

        {/* Settings Panel */}
        <div className="glass-card p-8 rounded-xl space-y-8">
          {/* Closed Seconds Threshold */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="closed-seconds" className="text-base font-semibold">
                Closed Eyes Threshold
              </Label>
              <span className="text-2xl font-mono font-bold text-primary">
                {settings.closedSeconds.toFixed(1)}s
              </span>
            </div>
            <Slider
              id="closed-seconds"
              min={0.6}
              max={5.0}
              step={0.1}
              value={[settings.closedSeconds]}
              onValueChange={([value]) => 
                setSettings(prev => ({ ...prev, closedSeconds: value }))
              }
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              Time threshold before triggering the drowsiness alarm. Lower values are more sensitive.
            </p>
          </div>

          {/* Refractory Period */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="refractory" className="text-base font-semibold">
                Refractory Period
              </Label>
              <span className="text-2xl font-mono font-bold text-primary">
                {settings.refractory.toFixed(1)}s
              </span>
            </div>
            <Slider
              id="refractory"
              min={1}
              max={10}
              step={0.5}
              value={[settings.refractory]}
              onValueChange={([value]) => 
                setSettings(prev => ({ ...prev, refractory: value }))
              }
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              Minimum time between consecutive alarms to prevent alarm fatigue.
            </p>
          </div>

          {/* Smoothing Factor */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="smoothing" className="text-base font-semibold">
                Signal Smoothing
              </Label>
              <span className="text-2xl font-mono font-bold text-primary">
                {settings.smoothingFactor.toFixed(2)}
              </span>
            </div>
            <Slider
              id="smoothing"
              min={0}
              max={0.99}
              step={0.01}
              value={[settings.smoothingFactor]}
              onValueChange={([value]) => 
                setSettings(prev => ({ ...prev, smoothingFactor: value }))
              }
              className="py-4"
            />
            <p className="text-sm text-muted-foreground">
              Controls how much previous measurements affect current readings. Higher values produce smoother but less responsive detection.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            onClick={saveSettings}
            size="lg"
            className="flex-1 gap-2 bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
          
          <Button 
            onClick={resetSettings}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>

        {/* Info Section */}
        <div className="glass-card p-6 rounded-xl space-y-3 border-primary/20">
          <h3 className="font-semibold text-primary">💡 Configuration Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Start with default settings and adjust based on your experience</li>
            <li>• Lower closed seconds threshold for more sensitive detection</li>
            <li>• Increase refractory period if alarms are too frequent</li>
            <li>• Higher smoothing reduces false positives but may delay detection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
