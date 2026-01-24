import { Gamepad2, Signal, RotateCw, CheckCircle2 } from "lucide-react";

interface DeviceCluster {
  name: string;
  count: number;
  ping: number;
  packetLoss: number;
  status: "optimal" | "warning" | "critical";
}

interface GamingDevicesPanelProps {
  devices: DeviceCluster[];
}

const statusColors = {
  optimal: "text-success",
  warning: "text-accent",
  critical: "text-destructive",
};

export function GamingDevicesPanel({ devices }: GamingDevicesPanelProps) {
  return (
    <div className="glass-card p-6 border-success/20">
      <h2 className="text-xl font-bold mb-4 text-success flex items-center gap-2">
        <Gamepad2 className="w-5 h-5" />
        Gaming Geräte Status
      </h2>
      <div className="space-y-3">
        {devices.map((device, idx) => (
          <div
            key={idx}
            className="bg-muted/30 rounded-lg p-4 border border-success/10 hover:border-success/30 transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm text-foreground">{device.name}</span>
              <span className="text-xs bg-success/20 text-success px-2 py-1 rounded">
                {device.count} Geräte
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Signal className="w-3 h-3 text-primary" />
                Ping: <span className="font-bold text-primary">{device.ping}ms</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <RotateCw className="w-3 h-3 text-primary" />
                PL: <span className="font-bold text-primary">{device.packetLoss}%</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className={`w-3 h-3 ${statusColors[device.status]}`} />
                <span className={`font-bold ${statusColors[device.status]}`}>
                  {device.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
