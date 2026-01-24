import { useState, useEffect, useCallback } from "react";

interface BandwidthData {
  time: string;
  upstream: number;
  downstream: number;
  wifi: number;
}

interface DeviceCluster {
  name: string;
  count: number;
  ping: number;
  packetLoss: number;
  status: "optimal" | "warning" | "critical";
}

interface NetworkDevice {
  id: string;
  type: "Gateway" | "Switch" | "Access Point";
  status: "active" | "inactive" | "warning";
  cpu: number;
  memory: number;
  ports: number;
}

interface Alert {
  id: number;
  device: string;
  level: "critical" | "warning" | "info";
  msg: string;
  time: string;
}

interface WifiStat {
  band: string;
  value: number;
  fill: string;
}

// Initial mock data - Replace with real API calls
const generateInitialBandwidth = (): BandwidthData[] => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const time = new Date(now.getTime() - (5 - i) * 5 * 60 * 1000);
    return {
      time: time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      upstream: 2.1 + Math.random() * 5,
      downstream: 5.2 + Math.random() * 4,
      wifi: 3.4 + Math.random() * 3,
    };
  });
};

export function useNetworkData() {
  const [bandwidth, setBandwidth] = useState<BandwidthData[]>(generateInitialBandwidth());
  const [devices, setDevices] = useState<DeviceCluster[]>([
    { name: "Nintendo Switch 2 Cluster", count: 16, ping: 12, packetLoss: 0.1, status: "optimal" },
    { name: "PlayStation 5 Cluster", count: 16, ping: 14, packetLoss: 0.2, status: "optimal" },
    { name: "Cisco Access Points", count: 8, ping: 8, packetLoss: 0, status: "optimal" },
  ]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([
    { id: "HUAWEI-HN8255WS", type: "Gateway", status: "active", cpu: 34, memory: 52, ports: 32 },
    { id: "CISCO-SW-01", type: "Switch", status: "active", cpu: 28, memory: 41, ports: 48 },
    { id: "CISCO-SW-02", type: "Switch", status: "active", cpu: 31, memory: 45, ports: 48 },
    { id: "CISCO-AP-01", type: "Access Point", status: "active", cpu: 22, memory: 38, ports: 1 },
    { id: "CISCO-AP-02", type: "Access Point", status: "active", cpu: 19, memory: 35, ports: 1 },
    { id: "CISCO-AP-03", type: "Access Point", status: "active", cpu: 25, memory: 42, ports: 1 },
    { id: "CISCO-AP-04", type: "Access Point", status: "active", cpu: 20, memory: 36, ports: 1 },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, device: "Upstream Link", level: "warning", msg: "7.2 Gbps / 10 Gbps ausgelastet (72%)", time: "Jetzt" },
    { id: 2, device: "CISCO-AP-03", level: "info", msg: "2.4 GHz Band bei 89% Auslastung", time: "1 min" },
  ]);
  const [wifiStats] = useState<WifiStat[]>([
    { band: "5 GHz", value: 65, fill: "#3b82f6" },
    { band: "2.4 GHz", value: 35, fill: "#8b5cf6" },
  ]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  const updateData = useCallback(() => {
    setBandwidth((prev) => {
      const newData = [...prev];
      newData.shift();
      const upstreamVal = 6.5 + Math.random() * 3.5;
      const downstreamVal = 8 + Math.random() * 2;
      const wifiVal = 5.5 + Math.random() * 2.5;
      newData.push({
        time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        upstream: parseFloat(upstreamVal.toFixed(1)),
        downstream: parseFloat(downstreamVal.toFixed(1)),
        wifi: parseFloat(wifiVal.toFixed(1)),
      });
      return newData;
    });

    // Update device stats with slight variations
    setNetworkDevices((prev) =>
      prev.map((device) => ({
        ...device,
        cpu: Math.min(95, Math.max(10, device.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.min(95, Math.max(10, device.memory + (Math.random() - 0.5) * 5)),
      }))
    );

    // Update gaming device pings
    setDevices((prev) =>
      prev.map((device) => ({
        ...device,
        ping: Math.max(5, Math.round(device.ping + (Math.random() - 0.5) * 4)),
        packetLoss: Math.max(0, parseFloat((device.packetLoss + (Math.random() - 0.5) * 0.1).toFixed(2))),
      }))
    );

    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [updateData]);

  // Calculate current metrics
  const currentUpstream = bandwidth[bandwidth.length - 1]?.upstream || 0;
  const upstreamPercent = (currentUpstream / 10) * 100;
  const currentWifi = bandwidth[bandwidth.length - 1]?.wifi || 0;
  const totalGamingDevices = devices.reduce((acc, d) => acc + d.count, 0);
  const activeNetworkDevices = networkDevices.filter((d) => d.status === "active").length;

  return {
    bandwidth,
    devices,
    networkDevices,
    alerts,
    wifiStats,
    lastUpdate,
    isLive,
    metrics: {
      currentUpstream,
      upstreamPercent,
      currentWifi,
      totalGamingDevices,
      activeNetworkDevices,
    },
  };
}
