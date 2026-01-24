import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Alert {
  id: string;
  device: string;
  level: "critical" | "warning" | "info";
  msg: string;
  time: string;
  timestamp: string;
}

// In-memory storage
const alertsStore: Alert[] = [];
const MAX_ALERTS = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      // Return alerts from last hour by default
      const hoursBack = parseInt(url.searchParams.get("hours") || "1");
      const cutoff = new Date(Date.now() - hoursBack * 3600000);
      
      const recentAlerts = alertsStore.filter(
        (alert) => new Date(alert.timestamp) > cutoff
      );

      return new Response(
        JSON.stringify({
          success: true,
          data: recentAlerts.slice(-20),
          count: recentAlerts.length,
          critical: recentAlerts.filter((a) => a.level === "critical").length,
          warning: recentAlerts.filter((a) => a.level === "warning").length,
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
      const alerts = body.alerts || [body];
      
      const newAlerts: Alert[] = [];
      
      for (const alert of alerts) {
        const record: Alert = {
          id: alert.id || crypto.randomUUID(),
          device: alert.device || "Unknown",
          level: alert.level || "info",
          msg: alert.msg || alert.message || "",
          time: alert.time || "Jetzt",
          timestamp: new Date().toISOString(),
        };
        
        alertsStore.push(record);
        newAlerts.push(record);
      }

      // Keep only last MAX_ALERTS
      while (alertsStore.length > MAX_ALERTS) {
        alertsStore.shift();
      }

      console.log("✓ Alerts received:", { count: newAlerts.length });

      return new Response(
        JSON.stringify({
          success: true,
          message: `${newAlerts.length} alert(s) stored`,
          data: newAlerts,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const alertId = url.searchParams.get("id");
      
      if (!alertId) {
        return new Response(
          JSON.stringify({ error: "Alert ID required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const index = alertsStore.findIndex((a) => a.id === alertId);
      if (index > -1) {
        alertsStore.splice(index, 1);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Alert deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Alerts endpoint error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
