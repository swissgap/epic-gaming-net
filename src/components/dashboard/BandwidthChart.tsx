import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BandwidthData {
  time: string;
  upstream: number;
  downstream: number;
  wifi: number;
}

interface BandwidthChartProps {
  data: BandwidthData[];
}

export function BandwidthChart({ data }: BandwidthChartProps) {
  return (
    <div className="glass-card p-6 border-primary/20">
      <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
        <span>📊</span> Bandbreitenverlauf (Live)
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUpstream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorDownstream" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorWifi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            label={{ 
              value: 'Gbps', 
              angle: -90, 
              position: 'insideLeft',
              fill: 'rgba(255,255,255,0.5)',
              fontSize: 12
            }} 
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgb(6, 182, 212)",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelStyle={{ color: "#06b6d4" }}
          />
          <Legend 
            wrapperStyle={{ color: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="upstream"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUpstream)"
            name="Upstream (10G Link)"
          />
          <Area
            type="monotone"
            dataKey="downstream"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDownstream)"
            name="Downstream"
          />
          <Area
            type="monotone"
            dataKey="wifi"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorWifi)"
            name="WiFi Traffic"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
