import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EndpointStatus {
  name: string;
  endpoint: string;
  status: "connected" | "error" | "unknown";
  lastCheck: Date | null;
  responseTime?: number;
}

interface ApiConnectionStatusProps {
  apiUrl: string;
  apiKey: string;
}

export function ApiConnectionStatus({ apiUrl, apiKey }: ApiConnectionStatusProps) {
  const [endpoints, setEndpoints] = useState<EndpointStatus[]>([
    { name: "Bandwidth", endpoint: "bandwidth", status: "unknown", lastCheck: null },
    { name: "Network Infrastructure", endpoint: "network-infrastructure", status: "unknown", lastCheck: null },
    { name: "Alerts", endpoint: "alerts", status: "unknown", lastCheck: null },
    { name: "Gaming Devices", endpoint: "gaming-devices", status: "unknown", lastCheck: null },
    { name: "Dashboard Summary", endpoint: "dashboard-summary", status: "unknown", lastCheck: null },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkEndpoint = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${apiUrl}/${endpoint.endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": apiKey,
        },
      });

      const responseTime = Date.now() - startTime;

      return {
        ...endpoint,
        status: response.ok ? "connected" : "error",
        lastCheck: new Date(),
        responseTime,
      };
    } catch (error) {
      return {
        ...endpoint,
        status: "error",
        lastCheck: new Date(),
        responseTime: undefined,
      };
    }
  };

  const checkAllEndpoints = async () => {
    setIsChecking(true);
    
    const results = await Promise.all(
      endpoints.map(endpoint => checkEndpoint(endpoint))
    );
    
    setEndpoints(results);
    setIsChecking(false);
  };

  useEffect(() => {
    checkAllEndpoints();
    // Recheck every 60 seconds
    const interval = setInterval(checkAllEndpoints, 60000);
    return () => clearInterval(interval);
  }, [apiUrl, apiKey]);

  const connectedCount = endpoints.filter(e => e.status === "connected").length;
  const isAllConnected = connectedCount === endpoints.length;

  return (
    <Card className="glass-card border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-cyan-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAllConnected ? (
              <Cloud className="w-5 h-5" />
            ) : (
              <CloudOff className="w-5 h-5" />
            )}
            API Verbindung
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isAllConnected ? "default" : "destructive"}
              className={cn(
                isAllConnected ? "bg-success text-success-foreground" : ""
              )}
            >
              {connectedCount}/{endpoints.length} Verbunden
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkAllEndpoints}
              disabled={isChecking}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("w-4 h-4", isChecking && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {endpoints.map((endpoint) => (
          <div
            key={endpoint.endpoint}
            className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg"
          >
            <div className="flex items-center gap-2">
              {endpoint.status === "connected" ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : endpoint.status === "error" ? (
                <XCircle className="w-4 h-4 text-destructive" />
              ) : (
                <Clock className="w-4 h-4 text-muted-foreground animate-pulse" />
              )}
              <span className="text-sm">{endpoint.name}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {endpoint.responseTime !== undefined && (
                <span className={cn(
                  "text-xs font-mono",
                  endpoint.responseTime < 200 ? "text-success" :
                  endpoint.responseTime < 500 ? "text-accent" : "text-destructive"
                )}>
                  {endpoint.responseTime}ms
                </span>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-xs",
                  endpoint.status === "connected" ? "border-success/50 text-success" :
                  endpoint.status === "error" ? "border-destructive/50 text-destructive" :
                  "border-muted-foreground/50 text-muted-foreground"
                )}
              >
                {endpoint.status === "connected" ? "OK" :
                 endpoint.status === "error" ? "Fehler" : "Prüfe..."}
              </Badge>
            </div>
          </div>
        ))}
        
        {endpoints[0]?.lastCheck && (
          <div className="text-xs text-center text-muted-foreground pt-2">
            Letzte Prüfung: {endpoints[0].lastCheck.toLocaleTimeString("de-DE")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
