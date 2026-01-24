import { Zap, Wifi, Activity, Network } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BandwidthChart } from "@/components/dashboard/BandwidthChart";
import { WifiDistribution } from "@/components/dashboard/WifiDistribution";
import { GamingDevicesPanel } from "@/components/dashboard/GamingDevicesPanel";
import { NetworkInfrastructurePanel } from "@/components/dashboard/NetworkInfrastructurePanel";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { useNetworkData } from "@/hooks/useNetworkData";

const Index = () => {
  const {
    bandwidth,
    devices,
    networkDevices,
    alerts,
    wifiStats,
    lastUpdate,
    isLive,
    metrics,
  } = useNetworkData();

  return (
    <div className="min-h-screen bg-gradient-gaming p-4 md:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        <DashboardHeader isLive={isLive} lastUpdate={lastUpdate} />

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Upstream"
            value={`${metrics.currentUpstream.toFixed(1)} Gbps`}
            icon={<Zap className="w-6 h-6" />}
            variant="cyan"
            progress={metrics.upstreamPercent}
            progressLabel={`${metrics.upstreamPercent.toFixed(1)}% von 10 Gbps`}
          />
          <MetricCard
            title="WiFi"
            value={`${metrics.currentWifi.toFixed(1)} Gbps`}
            icon={<Wifi className="w-6 h-6" />}
            variant="purple"
            subtitle="8 Access Points • 32 Geräte"
          />
          <MetricCard
            title="Geräte"
            value={`${metrics.totalGamingDevices}/32`}
            icon={<Activity className="w-6 h-6" />}
            variant="green"
            subtitle="Alle Gaming-Geräte aktiv"
          />
          <MetricCard
            title="Netzwerk"
            value={`${metrics.activeNetworkDevices} Aktiv`}
            icon={<Network className="w-6 h-6" />}
            variant="orange"
            subtitle="Huawei + 6x Cisco Devices"
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <BandwidthChart data={bandwidth} />
          </div>
          <WifiDistribution data={wifiStats} />
        </div>

        {/* Network Infrastructure */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GamingDevicesPanel devices={devices} />
          <NetworkInfrastructurePanel devices={networkDevices} />
        </div>

        {/* Alerts */}
        <AlertsPanel alerts={alerts} />

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground text-sm border-t border-border/30 pt-6">
          <p className="flex items-center justify-center gap-3 flex-wrap">
            <span>⚙️ Live API Integration Ready</span>
            <span className="hidden sm:inline">|</span>
            <span>🔄 Auto-Refresh alle 5 Sekunden</span>
            <span className="hidden sm:inline">|</span>
            <span>📡 Lovable Cloud Ready</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
