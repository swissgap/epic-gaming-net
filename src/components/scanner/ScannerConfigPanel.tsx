import { useState } from "react";
import { Settings, Save, Plus, Trash2, Globe, Key, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ScannerConfig {
  apiUrl: string;
  apiKey: string;
  snmpCommunity: string;
  scanInterval: number;
  subnets: string[];
}

interface ScannerConfigPanelProps {
  config: ScannerConfig;
  onConfigChange: (config: ScannerConfig) => void;
}

export function ScannerConfigPanel({ config, onConfigChange }: ScannerConfigPanelProps) {
  const [newSubnet, setNewSubnet] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState(config);
  const { toast } = useToast();

  const validateSubnet = (subnet: string): boolean => {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(subnet)) return false;
    
    const [ip, prefix] = subnet.split("/");
    const parts = ip.split(".").map(Number);
    const prefixNum = parseInt(prefix);
    
    return (
      parts.every(p => p >= 0 && p <= 255) &&
      prefixNum >= 8 && prefixNum <= 32
    );
  };

  const addSubnet = () => {
    if (!newSubnet.trim()) return;
    
    if (!validateSubnet(newSubnet)) {
      toast({
        title: "Ungültiges Subnet",
        description: "Bitte gib ein gültiges CIDR-Format ein (z.B. 192.168.1.0/24)",
        variant: "destructive",
      });
      return;
    }

    if (localConfig.subnets.includes(newSubnet)) {
      toast({
        title: "Subnet bereits vorhanden",
        description: "Dieses Subnet ist bereits in der Liste",
        variant: "destructive",
      });
      return;
    }

    setLocalConfig(prev => ({
      ...prev,
      subnets: [...prev.subnets, newSubnet]
    }));
    setNewSubnet("");
    toast({
      title: "Subnet hinzugefügt",
      description: `${newSubnet} wurde zur Scan-Liste hinzugefügt`,
    });
  };

  const removeSubnet = (subnet: string) => {
    setLocalConfig(prev => ({
      ...prev,
      subnets: prev.subnets.filter(s => s !== subnet)
    }));
    toast({
      title: "Subnet entfernt",
      description: `${subnet} wurde aus der Scan-Liste entfernt`,
    });
  };

  const saveConfig = () => {
    onConfigChange(localConfig);
    setIsEditing(false);
    toast({
      title: "Konfiguration gespeichert",
      description: "Die Scanner-Einstellungen wurden aktualisiert",
    });
  };

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-primary flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Scanner Konfiguration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Konfiguration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Globe className="w-4 h-4" />
            API Einstellungen
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiUrl" className="text-xs text-muted-foreground">API URL</Label>
            <Input
              id="apiUrl"
              value={localConfig.apiUrl}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
              disabled={!isEditing}
              className="bg-muted/30 border-border/50 text-sm font-mono"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-xs text-muted-foreground">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type={isEditing ? "text" : "password"}
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                disabled={!isEditing}
                className="bg-muted/30 border-border/50 text-sm font-mono"
                placeholder="eyJhbGc..."
              />
              <Key className="w-4 h-4 text-muted-foreground self-center" />
            </div>
          </div>
        </div>

        {/* SNMP & Scan Settings */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="snmpCommunity" className="text-xs text-muted-foreground">SNMP Community</Label>
            <Input
              id="snmpCommunity"
              value={localConfig.snmpCommunity}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, snmpCommunity: e.target.value }))}
              disabled={!isEditing}
              className="bg-muted/30 border-border/50 text-sm"
              placeholder="public"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scanInterval" className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Intervall (Sek.)
            </Label>
            <Input
              id="scanInterval"
              type="number"
              min={5}
              max={300}
              value={localConfig.scanInterval}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, scanInterval: parseInt(e.target.value) || 30 }))}
              disabled={!isEditing}
              className="bg-muted/30 border-border/50 text-sm"
            />
          </div>
        </div>

        {/* Subnets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Zu scannende Subnetze</span>
            <Badge variant="secondary" className="text-xs">
              {localConfig.subnets.length} Subnetze
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {localConfig.subnets.map((subnet) => (
              <Badge
                key={subnet}
                variant="outline"
                className="bg-muted/30 border-primary/30 px-3 py-1 flex items-center gap-2"
              >
                <span className="font-mono text-xs">{subnet}</span>
                {isEditing && (
                  <button
                    onClick={() => removeSubnet(subnet)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newSubnet}
                onChange={(e) => setNewSubnet(e.target.value)}
                placeholder="192.168.10.0/24"
                className="bg-muted/30 border-border/50 text-sm font-mono flex-1"
                onKeyDown={(e) => e.key === "Enter" && addSubnet()}
              />
              <Button
                onClick={addSubnet}
                size="sm"
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                onClick={saveConfig}
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/80"
              >
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button
                onClick={() => {
                  setLocalConfig(config);
                  setIsEditing(false);
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="outline"
              className="flex-1 border-primary/50 text-primary hover:bg-primary/10"
            >
              <Settings className="w-4 h-4 mr-2" />
              Bearbeiten
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
