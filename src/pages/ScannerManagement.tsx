import { ArrowLeft, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScannerConfigPanel } from "@/components/scanner/ScannerConfigPanel";
import { ScannerStatusPanel } from "@/components/scanner/ScannerStatusPanel";
import { HostsTable } from "@/components/scanner/HostsTable";
import { ApiConnectionStatus } from "@/components/scanner/ApiConnectionStatus";
import { useScannerManagement } from "@/hooks/useScannerManagement";

const ScannerManagement = () => {
  const {
    config,
    updateConfig,
    status,
    hosts,
    isLoading,
    startScanner,
    stopScanner,
    manualScan,
  } = useScannerManagement();

  return (
    <div className="min-h-screen bg-gradient-gaming p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm" className="border-primary/50 text-primary hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-primary" />
                Scanner Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Netzwerk-Scanner verwalten, API-Verbindung prüfen und gescannte Hosts überwachen
              </p>
            </div>
          </div>
        </div>

        {/* Top Grid: Status, Config, API Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ScannerStatusPanel
            status={status}
            onStart={startScanner}
            onStop={stopScanner}
            onManualScan={manualScan}
          />
          
          <ScannerConfigPanel
            config={config}
            onConfigChange={updateConfig}
          />
          
          <ApiConnectionStatus
            apiUrl={config.apiUrl}
            apiKey={config.apiKey}
          />
        </div>

        {/* Hosts Table */}
        <HostsTable hosts={hosts} isLoading={isLoading} />

        {/* Footer Info */}
        <div className="mt-8 text-center text-muted-foreground text-sm border-t border-border/30 pt-6">
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <span>🐍 Python Scanner: scanner/network_scanner.py</span>
            <span className="hidden sm:inline">|</span>
            <span>⚙️ Config: scanner/config.example.json</span>
            <span className="hidden sm:inline">|</span>
            <span>📡 SNMP Community: {config.snmpCommunity}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScannerManagement;
