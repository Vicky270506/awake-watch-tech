import { Badge } from "@/components/ui/badge";
import { Activity, Clock, AlertTriangle, TrendingDown } from "lucide-react";

const Dashboard = () => {
  // Mock data for demonstration
  const sessions = [
    { id: 1, date: "2025-01-10 14:30", duration: "45 min", alarms: 3 },
    { id: 2, date: "2025-01-10 10:15", duration: "1h 20min", alarms: 5 },
    { id: 3, date: "2025-01-09 16:45", duration: "30 min", alarms: 1 },
    { id: 4, date: "2025-01-09 09:00", duration: "2h 15min", alarms: 8 },
  ];

  const stats = {
    totalSessions: 24,
    totalAlarms: 67,
    avgClosedDuration: 1.4,
    longestSession: "2h 45min",
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Track your detection history and metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">All time</Badge>
            </div>
            <div className="text-3xl font-bold">{stats.totalSessions}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <Badge variant="outline" className="text-xs">All time</Badge>
            </div>
            <div className="text-3xl font-bold">{stats.totalAlarms}</div>
            <div className="text-sm text-muted-foreground">Total Alarms</div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">Average</Badge>
            </div>
            <div className="text-3xl font-bold">{stats.avgClosedDuration}s</div>
            <div className="text-sm text-muted-foreground">Avg Closed Duration</div>
          </div>

          <div className="glass-card p-6 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">Record</Badge>
            </div>
            <div className="text-2xl font-bold">{stats.longestSession}</div>
            <div className="text-sm text-muted-foreground">Longest Session</div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-2xl font-bold">Recent Sessions</h2>
          </div>
          
          <div className="divide-y divide-border/50">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="p-6 hover:bg-muted/20 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold">{session.date}</div>
                    <div className="text-sm text-muted-foreground">
                      Duration: {session.duration}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{session.alarms}</div>
                      <div className="text-xs text-muted-foreground">Alarms</div>
                    </div>
                    
                    <Badge 
                      variant={session.alarms > 5 ? "destructive" : session.alarms > 2 ? "secondary" : "default"}
                    >
                      {session.alarms > 5 ? "High" : session.alarms > 2 ? "Medium" : "Low"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="glass-card p-8 rounded-xl">
          <h2 className="text-2xl font-bold mb-6">Eye Openness Timeline</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-border/30 rounded-lg">
            <p className="text-muted-foreground">
              Chart visualization will appear here during active sessions
            </p>
          </div>
        </div>

        {/* Export Section */}
        <div className="glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Export Session Data</h3>
              <p className="text-sm text-muted-foreground">
                Download your detection history as CSV for analysis
              </p>
            </div>
            <Badge variant="outline" className="cursor-not-allowed opacity-50">
              Coming Soon
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
