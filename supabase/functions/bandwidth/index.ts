const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NtopngData {
  throughput_bps?: number;
  throughput_pps?: number;
  download_pps?: number;
  upload_pps?: number;
  bytes_total?: number;
  bytes_download?: number;
  bytes_upload?: number;
  packets_total?: number;
  num_hosts?: number;
  num_local_hosts?: number;
  num_flows?: number;
  tcp_retransmissions?: number;
  tcp_out_of_order?: number;
  tcp_lost?: number;
}

interface BandwidthData {
  id: string;
  timestamp: string;
  upstream_gbps: number;
  downstream_gbps: number;
  wifi_gbps: number;
  upstream_percent: number;
  interfaces?: Record<string, unknown>;
  source?: string;
  ntopng?: NtopngData;
}

// In-memory storage (for production, use database)
const bandwidthStore: BandwidthData[] = [];
const MAX_RECORDS = 100;

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      // Return latest bandwidth data
      const limit = parseInt(url.searchParams.get("limit") || "20");
      const data = bandwidthStore.slice(-limit);
      
      // Get latest ntopng data if available
      const latestWithNtopng = data.find(d => d.ntopng);
      
      return new Response(
        JSON.stringify({
          success: true,
          data,
          count: data.length,
          lastUpdate: data[data.length - 1]?.timestamp || null,
          source: data[data.length - 1]?.source || "unknown",
          ntopng: latestWithNtopng?.ntopng || null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      // Validate API key for write operations
      const apiKey = req.headers.get("x-api-key");
      const expectedKey = Deno.env.get("NETWORK_API_KEY");
      
      if (expectedKey && apiKey !== expectedKey) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      
      const record: BandwidthData = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        upstream_gbps: body.upstream_gbps || body.upstream || 0,
        downstream_gbps: body.downstream_gbps || body.downstream || 0,
        wifi_gbps: body.wifi_gbps || body.wifi || 0,
        upstream_percent: body.upstream_percent || ((body.upstream_gbps || body.upstream || 0) / 10) * 100,
        interfaces: body.interfaces,
        source: body.source || "scanner",
        ntopng: body.ntopng,
      };

      bandwidthStore.push(record);
      
      // Keep only last MAX_RECORDS
      if (bandwidthStore.length > MAX_RECORDS) {
        bandwidthStore.shift();
      }

      const sourceInfo = record.source === "ntopng" ? "ntopng" : "SNMP";
      console.log(`✓ Bandwidth data received (${sourceInfo}):`, {
        upstream: record.upstream_gbps.toFixed(4),
        downstream: record.downstream_gbps.toFixed(4),
        timestamp: record.timestamp,
        ntopng_hosts: record.ntopng?.num_hosts,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Bandwidth data stored",
          data: record,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Bandwidth endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
