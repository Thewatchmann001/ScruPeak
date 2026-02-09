import { cn } from "@/utils/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "success" | "warning";
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const variants = {
    default: "bg-primary-100 text-primary-700 border border-primary-200",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200",
    destructive: "bg-danger-100 text-danger-700 border border-danger-200",
    success: "bg-success-100 text-success-700 border border-success-200",
    warning: "bg-warning-100 text-warning-700 border border-warning-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
