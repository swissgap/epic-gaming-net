import { AlertCircle, AlertTriangle, Info, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: number;
  device: string;
  level: "critical" | "warning" | "info";
  msg: string;
  time: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const levelConfig = {
  critical: {
    icon: AlertCircle,
    border: "border-l-destructive",
    bg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-accent",
    bg: "bg-accent/10",
    iconColor: "text-accent",
  },
  info: {
    icon: Info,
    border: "border-l-primary",
    bg: "bg-primary/10",
    iconColor: "text-primary",
  },
};

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <div className="glass-card p-6 border-accent/20">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-accent" />
        <h2 className="text-xl font-bold text-accent">
          🔔 Live Alerts & Events
        </h2>
        {alerts.length > 0 && (
          <span className="ml-auto text-xs bg-accent/20 text-accent px-2 py-1 rounded-full animate-pulse">
            {alerts.length} aktiv
          </span>
        )}
      </div>
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success/50" />
            <p>Keine aktiven Alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const config = levelConfig[alert.level];
            const Icon = config.icon;
            return (
              <div
                key={alert.id}
                className={cn(
                  "bg-muted/30 rounded-lg p-3 border-l-4 flex justify-between items-start",
                  config.border,
                  config.bg
                )}
              >
                <div className="flex gap-3">
                  <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", config.iconColor)} />
                  <div>
                    <div className="font-semibold text-sm text-foreground">{alert.device}</div>
                    <div className="text-xs text-muted-foreground mt-1">{alert.msg}</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CheckCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  );
}
