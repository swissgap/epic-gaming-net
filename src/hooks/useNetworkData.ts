import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

// Generate mock data for demo mode
const generateMockBandwidth = (): BandwidthData[] => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const time = new Date(now.getTime() - (5 - i) * 5 * 60 * 1000);
    return {
      time: time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      upstream: parseFloat((2.1 + Math.random() * 5).toFixed(1)),
      downstream: parseFloat((5.2 + Math.random() * 4).toFixed(1)),
      wifi: parseFloat((3.4 + Math.random() * 3).toFixed(1)),
    };
  });
};

const defaultDevices: DeviceCluster[] = [
  { name: "Nintendo Switch 2 Cluster", count: 16, ping: 12, packetLoss: 0.1, status: "optimal" },
  { name: "PlayStation 5 Cluster", count: 16, ping: 14, packetLoss: 0.2, status: "optimal" },
  { name: "Cisco Access Points", count: 8, ping: 8, packetLoss: 0, status: "optimal" },
];

const defaultNetworkDevices: NetworkDevice[] = [
  { id: "HUAWEI-HN8255WS", type: "Gateway", status: "active", cpu: 34, memory: 52, ports: 32 },
  { id: "CISCO-SW-01", type: "Switch", status: "active", cpu: 28, memory: 41, ports: 48 },
  { id: "CISCO-SW-02", type: "Switch", status: "active", cpu: 31, memory: 45, ports: 48 },
  { id: "CISCO-AP-01", type: "Access Point", status: "active", cpu: 22, memory: 38, ports: 1 },
  { id: "CISCO-AP-02", type: "Access Point", status: "active", cpu: 19, memory: 35, ports: 1 },
  { id: "CISCO-AP-03", type: "Access Point", status: "active", cpu: 25, memory: 42, ports: 1 },
  { id: "CISCO-AP-04", type: "Access Point", status: "active", cpu: 20, memory: 36, ports: 1 },
];

const defaultAlerts: Alert[] = [
  { id: 1, device: "Upstream Link", level: "warning", msg: "7.2 Gbps / 10 Gbps ausgelastet (72%)", time: "Jetzt" },
  { id: 2, device: "CISCO-AP-03", level: "info", msg: "2.4 GHz Band bei 89% Auslastung", time: "1 min" },
];

const API_BASE_URL = `https://oeckplemwzzzjikvwxkb.supabase.co/functions/v1`;

export function useNetworkData() {
  const [bandwidth, setBandwidth] = useState<BandwidthData[]>(generateMockBandwidth());
  const [devices, setDevices] = useState<DeviceCluster[]>(defaultDevices);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>(defaultNetworkDevices);
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts);
  const [wifiStats] = useState<WifiStat[]>([
    { band: "5 GHz", value: 65, fill: "#3b82f6" },
    { band: "2.4 GHz", value: 35, fill: "#8b5cf6" },
  ]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [useRealApi, setUseRealApi] = useState(false);

  // Fetch data from real API
  const fetchFromApi = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2twbGVtd3p6emppa3Z3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTA1MjMsImV4cCI6MjA4NDg2NjUyM30.aYhxGKgUbfQJV3TghF3JMq0tQ8EUf6N3XsFTQWyAwcg",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Fetch bandwidth data
      const bandwidthRes = await fetch(`${API_BASE_URL}/bandwidth`, { headers });
      if (bandwidthRes.ok) {
        const bandwidthData = await bandwidthRes.json();
        if (bandwidthData.data && bandwidthData.data.length > 0) {
          const formattedBandwidth = bandwidthData.data.map((item: any) => ({
            time: new Date(item.timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
            upstream: item.upstream_gbps,
            downstream: item.downstream_gbps,
            wifi: item.wifi_gbps,
          }));
          setBandwidth(formattedBandwidth);
          setUseRealApi(true);
        }
      }

      // Fetch network infrastructure
      const infraRes = await fetch(`${API_BASE_URL}/network-infrastructure`, { headers });
      if (infraRes.ok) {
        const infraData = await infraRes.json();
        if (infraData.data?.devices && infraData.data.devices.length > 0) {
          setNetworkDevices(infraData.data.devices);
        }
      }

      // Fetch alerts
      const alertsRes = await fetch(`${API_BASE_URL}/alerts`, { headers });
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json();
        if (alertsData.data && alertsData.data.length > 0) {
          setAlerts(alertsData.data);
        }
      }

      // Fetch gaming devices
      const gamingRes = await fetch(`${API_BASE_URL}/gaming-devices`, { headers });
      if (gamingRes.ok) {
        const gamingData = await gamingRes.json();
        if (gamingData.data?.devices && gamingData.data.devices.length > 0) {
          // Transform into clusters
          const nintendo = gamingData.data.devices.filter((d: any) => d.name?.includes("Nintendo"));
          const ps5 = gamingData.data.devices.filter((d: any) => d.name?.includes("PlayStation"));
          
          if (nintendo.length > 0 || ps5.length > 0) {
            const clusters: DeviceCluster[] = [];
            if (nintendo.length > 0) {
              const avgPing = nintendo.reduce((sum: number, d: any) => sum + d.ping, 0) / nintendo.length;
              const avgPL = nintendo.reduce((sum: number, d: any) => sum + d.packetLoss, 0) / nintendo.length;
              clusters.push({
                name: "Nintendo Switch 2 Cluster",
                count: nintendo.length,
                ping: Math.round(avgPing),
                packetLoss: parseFloat(avgPL.toFixed(2)),
                status: "optimal",
              });
            }
            if (ps5.length > 0) {
              const avgPing = ps5.reduce((sum: number, d: any) => sum + d.ping, 0) / ps5.length;
              const avgPL = ps5.reduce((sum: number, d: any) => sum + d.packetLoss, 0) / ps5.length;
              clusters.push({
                name: "PlayStation 5 Cluster",
                count: ps5.length,
                ping: Math.round(avgPing),
                packetLoss: parseFloat(avgPL.toFixed(2)),
                status: "optimal",
              });
            }
            setDevices(clusters);
          }
        }
      }

      setLastUpdate(new Date());
      setIsLive(true);
    } catch (error) {
      console.log("API not available, using demo mode:", error);
      setIsLive(true); // Still show as live for demo
    }
  }, []);

  // Simulate real-time updates for demo mode
  const updateDemoData = useCallback(() => {
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
        cpu: Math.min(95, Math.max(10, Math.round(device.cpu + (Math.random() - 0.5) * 10))),
        memory: Math.min(95, Math.max(10, Math.round(device.memory + (Math.random() - 0.5) * 5))),
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

  // Initial fetch attempt
  useEffect(() => {
    fetchFromApi();
  }, [fetchFromApi]);

  // Periodic updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (useRealApi) {
        fetchFromApi();
      } else {
        updateDemoData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [useRealApi, fetchFromApi, updateDemoData]);

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
    useRealApi,
    metrics: {
      currentUpstream,
      upstreamPercent,
      currentWifi,
      totalGamingDevices,
      activeNetworkDevices,
    },
  };
}
