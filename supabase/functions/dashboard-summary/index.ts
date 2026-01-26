const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InfraDevice {
  status: string;
  cpu: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Fetch all data in parallel from other functions
    const baseUrl = supabaseUrl?.replace("/rest/v1", "") + "/functions/v1";
    
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseKey}`,
    };

    const [bandwidthRes, infrastructureRes, gamingRes, alertsRes] = await Promise.all([
      fetch(`${baseUrl}/bandwidth`, { headers }).catch(() => null),
      fetch(`${baseUrl}/network-infrastructure`, { headers }).catch(() => null),
      fetch(`${baseUrl}/gaming-devices`, { headers }).catch(() => null),
      fetch(`${baseUrl}/alerts`, { headers }).catch(() => null),
    ]);

    const bandwidth = bandwidthRes ? await bandwidthRes.json() : { data: [] };
    const infrastructure = infrastructureRes ? await infrastructureRes.json() : { data: { devices: [] } };
    const gaming = gamingRes ? await gamingRes.json() : { data: { devices: [] }, summary: {} };
    const alerts = alertsRes ? await alertsRes.json() : { data: [], critical: 0, warning: 0 };

    const latestBandwidth = bandwidth.data?.[bandwidth.data.length - 1];
    const upstreamPercent = latestBandwidth?.upstream_percent || 0;

    const summary = {
      timestamp: new Date().toISOString(),
      bandwidth: {
        upstream_gbps: latestBandwidth?.upstream_gbps || 0,
        downstream_gbps: latestBandwidth?.downstream_gbps || 0,
        wifi_gbps: latestBandwidth?.wifi_gbps || 0,
        upstream_percent: upstreamPercent,
        status: upstreamPercent > 80 ? "high" : upstreamPercent > 50 ? "medium" : "normal",
      },
      infrastructure: {
        total_devices: infrastructure.data?.total_devices || infrastructure.data?.devices?.length || 0,
        active_devices: infrastructure.data?.devices?.filter((d: InfraDevice) => d.status === "active").length || 0,
        critical_devices: infrastructure.data?.devices?.filter((d: InfraDevice) => d.cpu > 80).length || 0,
      },
      gaming: {
        total: gaming.summary?.total || gaming.data?.total_gaming_devices || 0,
        nintendo: gaming.summary?.nintendo || 0,
        playstation: gaming.summary?.playstation || 0,
        optimal: gaming.summary?.optimalCount || 0,
      },
      alerts: {
        count: alerts.count || alerts.data?.length || 0,
        critical: alerts.critical || 0,
        warning: alerts.warning || 0,
        recent: alerts.data?.slice(-5) || [],
      },
    };

    return new Response(
      JSON.stringify({ success: true, ...summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Dashboard summary error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
