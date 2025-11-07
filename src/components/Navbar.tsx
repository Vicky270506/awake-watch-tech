import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Eye, Settings, BarChart3, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl group">
            <Eye className="w-6 h-6 text-primary group-hover:animate-pulse-neon" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              DrowsyVision
            </span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                isActive("/detect") && "bg-primary/10 text-primary"
              )}
            >
              <Link to="/detect">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Detect</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                isActive("/dashboard") && "bg-primary/10 text-primary"
              )}
            >
              <Link to="/dashboard">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                isActive("/settings") && "bg-primary/10 text-primary"
              )}
            >
              <Link to="/settings">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2",
                isActive("/help") && "bg-primary/10 text-primary"
              )}
            >
              <Link to="/help">
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Help</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
