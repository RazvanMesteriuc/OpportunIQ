import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreGauge({ score, className, size = "md" }: ScoreGaugeProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  let color = "text-red-500";
  let bg = "bg-red-500/20";
  
  if (normalizedScore >= 80) {
    color = "text-primary";
    bg = "bg-primary/20";
  } else if (normalizedScore >= 60) {
    color = "text-yellow-500";
    bg = "bg-yellow-500/20";
  }

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-lg"
  };

  return (
    <div className={cn("relative flex items-center justify-center rounded-full font-bold", bg, color, sizeClasses[size], className)}>
      <svg className="absolute inset-0 w-full h-full transform -rotate-90">
        <circle
          className="text-transparent"
          strokeWidth="2"
          stroke="currentColor"
          fill="transparent"
          r="45%"
          cx="50%"
          cy="50%"
        />
        <circle
          className="transition-all duration-1000 ease-out"
          strokeWidth="2"
          strokeDasharray={`${normalizedScore * 2.8} 280`}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45%"
          cx="50%"
          cy="50%"
        />
      </svg>
      <span>{normalizedScore}</span>
    </div>
  );
}
