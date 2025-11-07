import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eye, Shield, Zap, AlertCircle } from "lucide-react";

const Help = () => {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Help & About</h1>
          <p className="text-muted-foreground">Learn how DrowsyVision keeps you alert and safe</p>
        </div>

        {/* How It Works */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              How Detection Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-muted-foreground">
            <p>
              DrowsyVision uses advanced facial recognition technology powered by MediaPipe FaceMesh 
              and computer vision algorithms to monitor your eye openness in real-time.
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-1">1. Calibration Phase</h4>
                <p className="text-sm">
                  When you start detection, the system calibrates for 2 seconds to establish your 
                  baseline eye openness. This adapts to your unique facial features and lighting conditions.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">2. Adaptive Thresholds</h4>
                <p className="text-sm">
                  The algorithm calculates dynamic thresholds (TH_LOW and TH_HIGH) based on your baseline. 
                  This ensures accurate detection regardless of individual differences.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">3. Real-Time Monitoring</h4>
                <p className="text-sm">
                  Your eye openness is continuously measured and smoothed to reduce noise. When your eyes 
                  remain closed beyond the threshold (default 1.2 seconds), an alarm is triggered.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">4. Smart Alerts</h4>
                <p className="text-sm">
                  Multi-modal alerts include visual (fullscreen overlay), audio (alarm sound), and 
                  haptic feedback (vibration on mobile devices) to ensure you wake up.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Your privacy is our top priority. Here's how we protect your data:
            </p>
            <ul className="space-y-2 text-sm">
              <li>✓ Video frames are processed temporarily and never stored</li>
              <li>✓ No video or image data is saved to any server</li>
              <li>✓ Only aggregate session metadata (timestamps, alarm counts) is logged</li>
              <li>✓ All processing can be done client-side for maximum privacy</li>
              <li>✓ No personally identifiable information is collected</li>
            </ul>
          </CardContent>
        </Card>

        {/* Calibration Tips */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Calibration Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>For best results, follow these guidelines:</p>
            <ul className="space-y-2 text-sm">
              <li>✓ Ensure good, consistent lighting on your face</li>
              <li>✓ Position your camera at eye level</li>
              <li>✓ Look directly at the camera during calibration</li>
              <li>✓ Keep your eyes naturally open (don't force them wide)</li>
              <li>✓ Avoid wearing sunglasses or heavy eye makeup</li>
              <li>✓ Recalibrate if lighting conditions change significantly</li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>What happens if my camera access is denied?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  You won't be able to use live detection without camera access. However, you can 
                  enable camera permissions in your browser settings. Look for the camera icon in 
                  your browser's address bar or check your site permissions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Can I adjust the sensitivity?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Go to the Settings page to adjust the closed eyes threshold, refractory period, 
                  and signal smoothing. Lower thresholds make the system more sensitive.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Does this work in low light?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  The system works best with adequate lighting. Very low light may reduce accuracy. 
                  If you're using the app at night, ensure you have some ambient light on your face.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Why do I need to recalibrate?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Recalibration is needed when lighting conditions change, if you adjust your camera 
                  position, or if detection becomes less accurate. Click the Recalibrate button on 
                  the detection page to establish a new baseline.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Is my data being sent to external servers?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  By default, frames are sent to our backend for processing, but they are not stored. 
                  For maximum privacy, you can enable client-side processing in Settings (when available), 
                  which processes everything in your browser.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
            <CardDescription>For developers and technical users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Frontend:</strong> React with WebSocket 
              communication for low-latency real-time updates.
            </p>
            <p>
              <strong className="text-foreground">Backend:</strong> FastAPI server with 
              MediaPipe FaceMesh for facial landmark detection and OpenCV for eye aspect 
              ratio calculations.
            </p>
            <p>
              <strong className="text-foreground">Algorithm:</strong> Adaptive threshold-based 
              state machine with exponential smoothing and refractory period to prevent alarm fatigue.
            </p>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Need More Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>
              For technical support, bug reports, or feature requests, please visit our 
              GitHub repository or contact our support team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;
