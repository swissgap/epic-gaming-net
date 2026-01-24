import { Server, Cpu, HardDrive, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkDevice {
  id: string;
  type: "Gateway" | "Switch" | "Access Point";
  status: "active" | "inactive" | "warning";
  cpu: number;
  memory: number;
  ports: number;
}

interface NetworkInfrastructurePanelProps {
  devices: NetworkDevice[];
}

const typeIcons = {
  Gateway: "🌐",
  Switch: "🔀",
  "Access Point": "📡",
};

export function NetworkInfrastructurePanel({ devices }: NetworkInfrastructurePanelProps) {
  return (
    <div className="glass-card p-6 border-accent/20">
      <h2 className="text-xl font-bold mb-4 text-accent flex items-center gap-2">
        <Server className="w-5 h-5" />
        Netzwerk-Infrastruktur
      </h2>
      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-gaming pr-2">
        {devices.map((device) => (
          <div
            key={device.id}
            className="bg-muted/30 rounded-lg p-3 border border-accent/10 hover:border-accent/30 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span>{typeIcons[device.type]}</span>
                  {device.id}
                </div>
                <div className="text-xs text-accent/70">{device.type}</div>
              </div>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded",
                  device.status === "active"
                    ? "bg-success/20 text-success"
                    : device.status === "warning"
                    ? "bg-accent/20 text-accent"
                    : "bg-destructive/20 text-destructive"
                )}
              >
                {device.status === "active" ? "Aktiv" : device.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                CPU: <span className={cn("font-bold", device.cpu > 80 ? "text-destructive" : "text-foreground")}>{device.cpu}%</span>
              </div>
              <div className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                RAM: <span className={cn("font-bold", device.memory > 80 ? "text-destructive" : "text-foreground")}>{device.memory}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
