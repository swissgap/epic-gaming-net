import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant: "cyan" | "purple" | "green" | "orange";
  progress?: number;
  progressLabel?: string;
}

const variantStyles = {
  cyan: {
    card: "bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-primary/30",
    icon: "text-primary",
    badge: "bg-primary/20 text-primary",
    progress: "bg-primary",
    subtitle: "text-primary/70",
  },
  purple: {
    card: "bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-secondary/30",
    icon: "text-secondary",
    badge: "bg-secondary/20 text-secondary",
    progress: "bg-secondary",
    subtitle: "text-secondary/70",
  },
  green: {
    card: "bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-success/30",
    icon: "text-success",
    badge: "bg-success/20 text-success",
    progress: "bg-success",
    subtitle: "text-success/70",
  },
  orange: {
    card: "bg-gradient-to-br from-orange-900/40 to-red-900/40 border-accent/30",
    icon: "text-accent",
    badge: "bg-accent/20 text-accent",
    progress: "bg-accent",
    subtitle: "text-accent/70",
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  variant,
  progress,
  progressLabel,
}: MetricCardProps) {
  const styles = variantStyles[variant];
  const isHighUsage = progress && progress > 80;

  return (
    <div
      className={cn(
        "glass-card p-6 backdrop-blur transition-all duration-300 hover:scale-[1.02]",
        styles.card
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-6 h-6", styles.icon)}>{icon}</div>
        <span className={cn("text-xs px-2 py-1 rounded", styles.badge)}>
          {title}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1 text-foreground">{value}</div>
      
      {progress !== undefined && (
        <>
          <div className="w-full bg-muted/50 rounded-full h-2 mb-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                isHighUsage ? "bg-destructive animate-pulse" : styles.progress
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {progressLabel && (
            <div className={cn("text-xs", styles.subtitle)}>{progressLabel}</div>
          )}
        </>
      )}
      
      {subtitle && !progress && (
        <div className={cn("text-xs", styles.subtitle)}>{subtitle}</div>
      )}
    </div>
  );
}
