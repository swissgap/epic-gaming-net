import { useState, useCallback, useEffect } from "react";
import type { ScannedHost } from "@/components/scanner/HostsTable";

interface ScannerConfig {
  apiUrl: string;
  apiKey: string;
  snmpCommunity: string;
  scanInterval: number;
  subnets: string[];
}

interface ScannerStatus {
  isRunning: boolean;
  lastScan: Date | null;
  devicesFound: number;
  currentSubnet: string | null;
  scanProgress: number;
  errorCount: number;
}

interface ApiInfraDevice {
  id: string;
  ip?: string;
  name?: string;
  type?: string;
  vendor?: string;
  status?: string;
  ping?: number;
  ports?: number;
  cpu?: number;
  memory?: number;
}

interface ApiGamingDevice {
  ip: string;
  name?: string;
  status?: string;
  ping?: number;
}

const DEFAULT_CONFIG: ScannerConfig = {
  apiUrl: "https://oeckplemwzzzjikvwxkb.supabase.co/functions/v1",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lY2twbGVtd3p6emppa3Z3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTA1MjMsImV4cCI6MjA4NDg2NjUyM30.aYhxGKgUbfQJV3TghF3JMq0tQ8EUf6N3XsFTQWyAwcg",
  snmpCommunity: "public",
  scanInterval: 30,
  subnets: ["192.168.1.0/24", "192.168.10.0/24"],
};

const STORAGE_KEY = "scanner-config";

// Demo hosts für die Vorschau
const generateDemoHosts = (): ScannedHost[] => {
  const types: ScannedHost["type"][] = ["router", "switch", "access_point", "server", "storage", "unknown"];
  const vendors = ["Cisco", "Huawei", "Ubiquiti", "Netgear", "Synology", "Dell", "HP"];
  const statuses: ScannedHost["status"][] = ["online", "online", "online", "online", "warning", "offline"];
  
  const hosts: ScannedHost[] = [
    {
      ip: "192.168.1.1",
      name: "HUAWEI-HN8255WS",
      type: "router",
      vendor: "Huawei",
      status: "online",
      lastSeen: new Date(),
      ping: 1,
      interfaces: 8,
      cpu: 34,
      memory: 52,
    },
    {
      ip: "192.168.1.2",
      name: "CISCO-SW-01",
      type: "switch",
      vendor: "Cisco",
      status: "online",
      lastSeen: new Date(),
      ping: 2,
      interfaces: 48,
      cpu: 28,
      memory: 41,
    },
    {
      ip: "192.168.1.3",
      name: "CISCO-SW-02",
      type: "switch",
      vendor: "Cisco",
      status: "online",
      lastSeen: new Date(),
      ping: 3,
      interfaces: 48,
      cpu: 31,
      memory: 45,
    },
    {
      ip: "192.168.1.10",
      name: "CISCO-AP-01",
      type: "access_point",
      vendor: "Cisco",
      status: "online",
      lastSeen: new Date(),
      ping: 4,
      interfaces: 2,
      cpu: 22,
      memory: 38,
    },
    {
      ip: "192.168.1.11",
      name: "CISCO-AP-02",
      type: "access_point",
      vendor: "Cisco",
      status: "online",
      lastSeen: new Date(),
      ping: 5,
      interfaces: 2,
      cpu: 19,
      memory: 35,
    },
    {
      ip: "192.168.1.12",
      name: "CISCO-AP-03",
      type: "access_point",
      vendor: "Cisco",
      status: "warning",
      lastSeen: new Date(Date.now() - 60000),
      ping: 45,
      interfaces: 2,
      cpu: 89,
      memory: 72,
    },
    {
      ip: "192.168.1.20",
      name: "NAS-Synology",
      type: "storage",
      vendor: "Synology",
      status: "online",
      lastSeen: new Date(),
      ping: 3,
      interfaces: 4,
      cpu: 15,
      memory: 62,
    },
    {
      ip: "192.168.1.50",
      name: "Nintendo-Switch-01",
      type: "unknown",
      vendor: "Nintendo",
      status: "online",
      lastSeen: new Date(),
      ping: 12,
    },
    {
      ip: "192.168.1.51",
      name: "Nintendo-Switch-02",
      type: "unknown",
      vendor: "Nintendo",
      status: "online",
      lastSeen: new Date(),
      ping: 14,
    },
    {
      ip: "192.168.1.60",
      name: "PlayStation-5-01",
      type: "unknown",
      vendor: "Sony",
      status: "online",
      lastSeen: new Date(),
      ping: 11,
    },
    {
      ip: "192.168.1.100",
      name: "Unbekanntes Gerät",
      type: "unknown",
      vendor: "Unknown",
      status: "offline",
      lastSeen: new Date(Date.now() - 300000),
    },
  ];
  
  return hosts;
};

export function useScannerManagement() {
  const [config, setConfig] = useState<ScannerConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [status, setStatus] = useState<ScannerStatus>({
    isRunning: false,
    lastScan: null,
    devicesFound: 0,
    currentSubnet: null,
    scanProgress: 0,
    errorCount: 0,
  });

  const [hosts, setHosts] = useState<ScannedHost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const updateConfig = useCallback((newConfig: ScannerConfig) => {
    setConfig(newConfig);
  }, []);

  const fetchHostsFromApi = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Try to fetch from gaming-devices and network-infrastructure endpoints
      const [gamingRes, infraRes] = await Promise.all([
        fetch(`${config.apiUrl}/gaming-devices`, {
          headers: {
            "Content-Type": "application/json",
            "apikey": config.apiKey,
          },
        }),
        fetch(`${config.apiUrl}/network-infrastructure`, {
          headers: {
            "Content-Type": "application/json",
            "apikey": config.apiKey,
          },
        }),
      ]);

      const gamingData = gamingRes.ok ? await gamingRes.json() : null;
      const infraData = infraRes.ok ? await infraRes.json() : null;

      const apiHosts: ScannedHost[] = [];

      // Parse infrastructure devices
      if (infraData?.data?.devices) {
        infraData.data.devices.forEach((device: ApiInfraDevice) => {
          apiHosts.push({
            ip: device.ip || device.id,
            name: device.name || device.id,
            type: device.type?.toLowerCase().replace(" ", "_") || "unknown",
            vendor: device.vendor || "Unknown",
            status: device.status === "active" ? "online" : device.status === "warning" ? "warning" : "offline",
            lastSeen: new Date(),
            ping: device.ping,
            interfaces: device.ports,
            cpu: device.cpu,
            memory: device.memory,
          });
        });
      }

      // Parse gaming devices
      if (gamingData?.data?.devices) {
        gamingData.data.devices.forEach((device: ApiGamingDevice) => {
          if (!apiHosts.find(h => h.ip === device.ip)) {
            apiHosts.push({
              ip: device.ip,
              name: device.name || device.ip,
              type: "unknown",
              vendor: device.name?.includes("Nintendo") ? "Nintendo" : 
                      device.name?.includes("PlayStation") ? "Sony" : "Unknown",
              status: device.status === "optimal" ? "online" : 
                      device.status === "warning" ? "warning" : "offline",
              lastSeen: new Date(),
              ping: device.ping,
            });
          }
        });
      }

      // If we got data from API, use it; otherwise use demo data
      if (apiHosts.length > 0) {
        setHosts(apiHosts);
        setStatus(prev => ({
          ...prev,
          devicesFound: apiHosts.length,
          lastScan: new Date(),
        }));
      } else {
        // Use demo data
        const demoHosts = generateDemoHosts();
        setHosts(demoHosts);
        setStatus(prev => ({
          ...prev,
          devicesFound: demoHosts.length,
          lastScan: new Date(),
        }));
      }
    } catch (error) {
      console.log("API not available, using demo mode");
      const demoHosts = generateDemoHosts();
      setHosts(demoHosts);
      setStatus(prev => ({
        ...prev,
        devicesFound: demoHosts.length,
        lastScan: new Date(),
        errorCount: prev.errorCount + 1,
      }));
    } finally {
      setIsLoading(false);
    }
  }, [config.apiUrl, config.apiKey]);

  const startScanner = useCallback(() => {
    setStatus(prev => ({ ...prev, isRunning: true, errorCount: 0 }));
    fetchHostsFromApi();
  }, [fetchHostsFromApi]);

  const stopScanner = useCallback(() => {
    setStatus(prev => ({ ...prev, isRunning: false, scanProgress: 0, currentSubnet: null }));
  }, []);

  const manualScan = useCallback(async () => {
    setStatus(prev => ({ ...prev, scanProgress: 0, currentSubnet: config.subnets[0] }));
    
    // Simulate scan progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setStatus(prev => ({ ...prev, scanProgress: i }));
    }
    
    await fetchHostsFromApi();
    setStatus(prev => ({ ...prev, scanProgress: 0, currentSubnet: null }));
  }, [config.subnets, fetchHostsFromApi]);

  // Auto-refresh when running
  useEffect(() => {
    if (!status.isRunning) return;

    const interval = setInterval(() => {
      fetchHostsFromApi();
    }, config.scanInterval * 1000);

    return () => clearInterval(interval);
  }, [status.isRunning, config.scanInterval, fetchHostsFromApi]);

  // Initial load
  useEffect(() => {
    fetchHostsFromApi();
  }, [fetchHostsFromApi]);

  return {
    config,
    updateConfig,
    status,
    hosts,
    isLoading,
    startScanner,
    stopScanner,
    manualScan,
  };
}
