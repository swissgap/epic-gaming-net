import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface WifiStat {
  band: string;
  value: number;
  fill: string;
}

interface WifiDistributionProps {
  data: WifiStat[];
}

export function WifiDistribution({ data }: WifiDistributionProps) {
  return (
    <div className="glass-card p-6 border-secondary/20">
      <h2 className="text-xl font-bold mb-4 text-secondary flex items-center gap-2">
        <span>📡</span> WiFi Band Aufteilung
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgb(139, 92, 246)",
              borderRadius: "8px",
              color: "#fff",
            }}
            formatter={(value: number) => [`${value}%`, "Auslastung"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2 mt-4">
        {data.map((stat, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: stat.fill }}
              />
              <span className="text-muted-foreground">{stat.band}</span>
            </span>
            <span className="font-bold text-foreground">{stat.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
