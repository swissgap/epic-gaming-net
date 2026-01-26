import { useState, useEffect } from "react";
import { Play, Pause, RotateCw, Wifi, WifiOff, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ScannerStatus {
  isRunning: boolean;
  lastScan: Date | null;
  devicesFound: number;
  currentSubnet: string | null;
  scanProgress: number;
  errorCount: number;
}

interface ScannerStatusPanelProps {
  status: ScannerStatus;
  onStart: () => void;
  onStop: () => void;
  onManualScan: () => void;
}

export function ScannerStatusPanel({
  status,
  onStart,
  onStop,
  onManualScan,
}: ScannerStatusPanelProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!status.lastScan) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - status.lastScan!.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [status.lastScan]);

  const formatElapsedTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <Card className="glass-card border-success/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-success flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.isRunning ? (
              <Wifi className="w-5 h-5 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5" />
            )}
            Scanner Status
          </div>
          <Badge
            variant={status.isRunning ? "default" : "secondary"}
            className={status.isRunning ? "bg-success text-success-foreground" : ""}
          >
            {status.isRunning ? "Aktiv" : "Gestoppt"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scan Progress */}
        {status.isRunning && status.scanProgress > 0 && status.scanProgress < 100 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Scanne: {status.currentSubnet || "..."}</span>
              <span>{status.scanProgress}%</span>
            </div>
            <Progress value={status.scanProgress} className="h-2" />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{status.devicesFound}</div>
            <div className="text-xs text-muted-foreground">Geräte</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-accent">
              {status.lastScan ? formatElapsedTime(elapsedTime) : "--"}
            </div>
            <div className="text-xs text-muted-foreground">Seit letztem Scan</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className={`text-2xl font-bold ${status.errorCount > 0 ? "text-destructive" : "text-success"}`}>
              {status.errorCount}
            </div>
            <div className="text-xs text-muted-foreground">Fehler</div>
          </div>
        </div>

        {/* Last Scan Info */}
        {status.lastScan && (
          <div className="text-xs text-muted-foreground text-center">
            Letzter Scan: {status.lastScan.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-2">
          {status.isRunning ? (
            <Button
              onClick={onStop}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Stoppen
            </Button>
          ) : (
            <Button
              onClick={onStart}
              size="sm"
              className="flex-1 bg-success hover:bg-success/80 text-success-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              Starten
            </Button>
          )}
          
          <Button
            onClick={onManualScan}
            variant="outline"
            size="sm"
            className="border-primary/50 text-primary hover:bg-primary/10"
            disabled={status.isRunning && status.scanProgress > 0 && status.scanProgress < 100}
          >
            <RotateCw className={`w-4 h-4 mr-2 ${status.isRunning && status.scanProgress > 0 && status.scanProgress < 100 ? "animate-spin" : ""}`} />
            Manuell Scannen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
