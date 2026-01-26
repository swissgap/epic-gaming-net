import { useState } from "react";
import { Monitor, Server, Wifi, Router, HardDrive, CircleCheck, CircleX, CircleMinus, Search, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ScannedHost {
  ip: string;
  name: string;
  type: "router" | "switch" | "access_point" | "server" | "storage" | "printer" | "unknown";
  vendor: string;
  status: "online" | "offline" | "warning";
  lastSeen: Date;
  ping?: number;
  interfaces?: number;
  cpu?: number;
  memory?: number;
}

interface HostsTableProps {
  hosts: ScannedHost[];
  isLoading?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  router: <Router className="w-4 h-4" />,
  switch: <Server className="w-4 h-4" />,
  access_point: <Wifi className="w-4 h-4" />,
  server: <Monitor className="w-4 h-4" />,
  storage: <HardDrive className="w-4 h-4" />,
  printer: <Monitor className="w-4 h-4" />,
  unknown: <Monitor className="w-4 h-4" />,
};

const statusIcons: Record<string, React.ReactNode> = {
  online: <CircleCheck className="w-4 h-4 text-success" />,
  offline: <CircleX className="w-4 h-4 text-destructive" />,
  warning: <CircleMinus className="w-4 h-4 text-accent" />,
};

type SortKey = "ip" | "name" | "type" | "status" | "ping" | "lastSeen";
type SortDirection = "asc" | "desc";

export function HostsTable({ hosts, isLoading }: HostsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ip");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedHost, setExpandedHost] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredHosts = hosts.filter(host =>
    host.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    host.vendor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedHosts = [...filteredHosts].sort((a, b) => {
    let comparison = 0;
    
    switch (sortKey) {
      case "ip": {
        const ipA = a.ip.split(".").map(Number);
        const ipB = b.ip.split(".").map(Number);
        for (let i = 0; i < 4; i++) {
          if (ipA[i] !== ipB[i]) {
            comparison = ipA[i] - ipB[i];
            break;
          }
        }
        break;
      }
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "ping":
        comparison = (a.ping || 999) - (b.ping || 999);
        break;
      case "lastSeen":
        comparison = a.lastSeen.getTime() - b.lastSeen.getTime();
        break;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={cn(
          "w-3 h-3 transition-opacity",
          sortKey === sortKeyName ? "opacity-100" : "opacity-30"
        )} />
      </div>
    </TableHead>
  );

  const onlineCount = hosts.filter(h => h.status === "online").length;
  const offlineCount = hosts.filter(h => h.status === "offline").length;
  const warningCount = hosts.filter(h => h.status === "warning").length;

  return (
    <Card className="glass-card border-accent/20">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg font-bold text-accent flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Gescannte Hosts
            <Badge variant="secondary" className="ml-2">{hosts.length}</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-success">
                <CircleCheck className="w-3 h-3" /> {onlineCount}
              </span>
              <span className="flex items-center gap-1 text-accent">
                <CircleMinus className="w-3 h-3" /> {warningCount}
              </span>
              <span className="flex items-center gap-1 text-destructive">
                <CircleX className="w-3 h-3" /> {offlineCount}
              </span>
            </div>
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suchen..."
                className="pl-8 h-8 w-48 bg-muted/30 border-border/50 text-sm"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="max-h-[400px] overflow-y-auto scrollbar-gaming">
            <Table>
              <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <SortHeader label="IP-Adresse" sortKeyName="ip" />
                  <SortHeader label="Name" sortKeyName="name" />
                  <SortHeader label="Typ" sortKeyName="type" />
                  <SortHeader label="Status" sortKeyName="status" />
                  <SortHeader label="Ping" sortKeyName="ping" />
                  <SortHeader label="Zuletzt gesehen" sortKeyName="lastSeen" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        Lade Hosts...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedHosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "Keine Hosts gefunden" : "Noch keine Hosts gescannt"}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHosts.map((host) => (
                    <>
                      <TableRow 
                        key={host.ip}
                        className={cn(
                          "border-border/30 cursor-pointer transition-colors",
                          expandedHost === host.ip ? "bg-muted/50" : "hover:bg-muted/30"
                        )}
                        onClick={() => setExpandedHost(expandedHost === host.ip ? null : host.ip)}
                      >
                        <TableCell className="py-2">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {expandedHost === host.ip ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-mono text-sm py-2">{host.ip}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-primary">{typeIcons[host.type]}</span>
                            <span className="text-sm">{host.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs capitalize">
                            {host.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1">
                            {statusIcons[host.status]}
                            <span className="text-xs capitalize">{host.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          {host.ping !== undefined ? (
                            <span className={cn(
                              "text-sm font-mono",
                              host.ping < 20 ? "text-success" :
                              host.ping < 50 ? "text-accent" : "text-destructive"
                            )}>
                              {host.ping}ms
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2">
                          {host.lastSeen.toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded Details */}
                      {expandedHost === host.ip && (
                        <TableRow className="bg-muted/20 border-border/30">
                          <TableCell colSpan={7} className="py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4">
                              <div>
                                <span className="text-xs text-muted-foreground">Vendor</span>
                                <div className="text-sm font-medium">{host.vendor || "Unbekannt"}</div>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Interfaces</span>
                                <div className="text-sm font-medium">{host.interfaces || "--"}</div>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">CPU</span>
                                <div className={cn(
                                  "text-sm font-medium",
                                  (host.cpu || 0) > 80 ? "text-destructive" : ""
                                )}>
                                  {host.cpu !== undefined ? `${host.cpu}%` : "--"}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground">Memory</span>
                                <div className={cn(
                                  "text-sm font-medium",
                                  (host.memory || 0) > 80 ? "text-destructive" : ""
                                )}>
                                  {host.memory !== undefined ? `${host.memory}%` : "--"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
