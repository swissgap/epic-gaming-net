const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GamingDevice {
  name: string;
  count: number;
  ping: number;
  packetLoss: number;
  status: "optimal" | "warning" | "critical";
  ip?: string;
  type?: string;
}

interface GamingDevicesData {
  timestamp: string;
  devices: GamingDevice[];
  total_gaming_devices: number;
}

// In-memory storage
let gamingDevicesData: GamingDevicesData | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      const data = gamingDevicesData || { devices: [], total_gaming_devices: 0 };
      
      // Calculate summaries
      const nintendo = data.devices.filter((d) => d.name.includes("Nintendo") || d.name.includes("Switch"));
      const playstation = data.devices.filter((d) => d.name.includes("PlayStation") || d.name.includes("PS5"));

      const lastUpdate = gamingDevicesData?.timestamp || null;
      
      return new Response(
        JSON.stringify({
          success: true,
          data,
          summary: {
            total: data.total_gaming_devices,
            nintendo: nintendo.length,
            playstation: playstation.length,
            optimalCount: data.devices.filter((d) => d.status === "optimal").length,
          },
          lastUpdate,
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
      
      gamingDevicesData = {
        timestamp: new Date().toISOString(),
        devices: body.devices || [],
        total_gaming_devices: body.total_gaming_devices || body.devices?.length || 0,
      };

      console.log("✓ Gaming devices data received:", {
        totalDevices: gamingDevicesData.total_gaming_devices,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Gaming devices data stored",
          data: gamingDevicesData,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Gaming devices endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
