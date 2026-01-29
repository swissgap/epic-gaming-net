const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScannedHost {
  ip: string;
  name: string;
  type: "router" | "switch" | "access_point" | "server" | "storage" | "printer" | "unknown";
  vendor: string;
  status: "online" | "offline" | "warning";
  lastSeen: string;
  ping?: number;
  interfaces?: number;
  cpu?: number;
  memory?: number;
  source?: string;
  bytes_sent?: number;
  bytes_rcvd?: number;
}

interface NtopngHostStats {
  num_hosts?: number;
  num_local_hosts?: number;
  num_devices?: number;
  num_flows?: number;
  num_remote_hosts?: number;
}

interface HostsData {
  timestamp: string;
  hosts: ScannedHost[];
  total_hosts: number;
  online_count: number;
  offline_count: number;
  warning_count: number;
  ntopng_stats?: NtopngHostStats;
}

// In-memory storage
let hostsData: HostsData | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      // Filter options
      const statusFilter = url.searchParams.get("status");
      const typeFilter = url.searchParams.get("type");
      const sourceFilter = url.searchParams.get("source");
      const search = url.searchParams.get("search")?.toLowerCase();

      let hosts = hostsData?.hosts || [];

      // Apply filters
      if (statusFilter) {
        hosts = hosts.filter((h) => h.status === statusFilter);
      }
      if (typeFilter) {
        hosts = hosts.filter((h) => h.type === typeFilter);
      }
      if (sourceFilter) {
        hosts = hosts.filter((h) => h.source === sourceFilter || h.source?.includes(sourceFilter));
      }
      if (search) {
        hosts = hosts.filter(
          (h) =>
            h.ip.includes(search) ||
            h.name.toLowerCase().includes(search) ||
            h.vendor.toLowerCase().includes(search)
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            hosts,
            total_hosts: hostsData?.total_hosts || 0,
            online_count: hostsData?.online_count || 0,
            offline_count: hostsData?.offline_count || 0,
            warning_count: hostsData?.warning_count || 0,
            ntopng_stats: hostsData?.ntopng_stats || null,
          },
          lastUpdate: hostsData?.timestamp || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const apiKey = req.headers.get("x-api-key");
      const expectedKey = Deno.env.get("NETWORK_API_KEY");

      if (expectedKey && apiKey !== expectedKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();

      hostsData = {
        timestamp: new Date().toISOString(),
        hosts: body.hosts || [],
        total_hosts: body.total_hosts || body.hosts?.length || 0,
        online_count: body.online_count || body.hosts?.filter((h: ScannedHost) => h.status === "online").length || 0,
        offline_count: body.offline_count || body.hosts?.filter((h: ScannedHost) => h.status === "offline").length || 0,
        warning_count: body.warning_count || body.hosts?.filter((h: ScannedHost) => h.status === "warning").length || 0,
        ntopng_stats: body.ntopng_stats || null,
      };

      // Count sources
      const ntopngHosts = hostsData.hosts.filter(h => h.source?.includes("ntopng")).length;
      const snmpHosts = hostsData.hosts.filter(h => h.source?.includes("snmp")).length;

      console.log("Hosts scan received:", {
        totalHosts: hostsData.total_hosts,
        online: hostsData.online_count,
        offline: hostsData.offline_count,
        warning: hostsData.warning_count,
        fromNtopng: ntopngHosts,
        fromSnmp: snmpHosts,
        ntopngFlows: hostsData.ntopng_stats?.num_flows,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Hosts data stored",
          data: hostsData,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Hosts endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
