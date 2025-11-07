import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Shield, Zap, Activity } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary mb-4">
              <Zap className="w-4 h-4" />
              <span>AI-Powered Drowsiness Detection</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                DrowsyVision
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-3xl mx-auto">
              Stay alert. Drive safe.
            </p>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time drowsiness detection using advanced eye-tracking technology. 
              Get instant alerts when your eyes remain closed for too long.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                asChild 
                size="lg"
                className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all"
              >
                <Link to="/detect">
                  <Eye className="w-5 h-5 mr-2" />
                  Start Detection
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <Link to="/help">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-xl space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Continuous eye-tracking with instant feedback and adaptive thresholds for accurate detection.
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Privacy First</h3>
              <p className="text-muted-foreground">
                Video frames are processed temporarily on the server and never stored. Your privacy is guaranteed.
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl space-y-4 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Instant Alerts</h3>
              <p className="text-muted-foreground">
                Multi-modal alerts with visual, audio, and haptic feedback to ensure you stay awake and alert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl font-bold">How It Works</h2>
          <div className="space-y-6 text-left glass-card p-8 rounded-xl">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-2">Calibration Phase</h4>
                <p className="text-muted-foreground">
                  The system calibrates for 2 seconds to establish your baseline eye openness levels.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-2">Continuous Monitoring</h4>
                <p className="text-muted-foreground">
                  Advanced facial recognition tracks your eye openness in real-time with adaptive thresholds.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-2">Smart Alerts</h4>
                <p className="text-muted-foreground">
                  When your eyes remain closed beyond the threshold (default 1.2s), you'll receive an immediate alert.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl font-bold">Ready to Stay Alert?</h2>
          <p className="text-xl text-muted-foreground">
            Start monitoring your drowsiness levels now with our advanced detection system.
          </p>
          <Button 
            asChild 
            size="lg"
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all"
          >
            <Link to="/detect">
              <Eye className="w-5 h-5 mr-2" />
              Launch Detection
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
