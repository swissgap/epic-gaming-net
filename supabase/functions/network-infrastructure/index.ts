const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NetworkDevice {
  id: string;
  type: "Gateway" | "Switch" | "Access Point";
  status: "active" | "inactive" | "warning";
  cpu: number;
  memory: number;
  ports: number;
  ip?: string;
  uptime?: number;
  temperature?: number;
}

interface InfrastructureData {
  timestamp: string;
  devices: NetworkDevice[];
  total_devices: number;
}

// In-memory storage
let infrastructureData: InfrastructureData | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      // Check for specific device
      const deviceId = url.searchParams.get("device_id");
      
      if (deviceId && infrastructureData) {
        const device = infrastructureData.devices.find((d) => d.id === deviceId);
        if (!device) {
          return new Response(
            JSON.stringify({ error: "Device not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: true, data: device }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return all infrastructure data
      return new Response(
        JSON.stringify({
          success: true,
          data: infrastructureData || { devices: [], total_devices: 0 },
          lastUpdate: infrastructureData?.timestamp || null,
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
      
      infrastructureData = {
        timestamp: new Date().toISOString(),
        devices: body.devices || [],
        total_devices: body.total_devices || body.devices?.length || 0,
      };

      const activeDevices = infrastructureData.devices.filter((d) => d.status === "active").length;
      console.log("✓ Infrastructure scan received:", {
        totalDevices: infrastructureData.total_devices,
        activeDevices,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Infrastructure data stored",
          data: infrastructureData,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Network infrastructure endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
