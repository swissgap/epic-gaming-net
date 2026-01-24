import { Zap, RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  isLive: boolean;
  lastUpdate: Date | null;
}

export function DashboardHeader({ isLive, lastUpdate }: DashboardHeaderProps) {
  return (
    <div className="mb-8 border-b border-primary/30 pb-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse" />
            <span className="gradient-text">
              GAMING NETWORK COMMAND CENTER
            </span>
          </h1>
          <p className="text-primary/80 text-sm md:text-base">
            16x Nintendo Switch 2 | 16x PlayStation 5 | 10 Gbps Upstream | Real-Time Monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                isLive ? "bg-success animate-pulse" : "bg-destructive"
              }`}
            />
            <span className={isLive ? "text-success" : "text-destructive"}>
              {isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {lastUpdate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="w-3 h-3" />
              {lastUpdate.toLocaleTimeString("de-DE")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
