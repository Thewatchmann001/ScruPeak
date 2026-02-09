import { cn } from "@/utils/cn";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
  title?: string;
}

const Alert = ({ className, variant = "default", title, children, ...props }: AlertProps) => {
  const variants = {
    default: "bg-primary-50 border border-primary-200 text-primary-800",
    destructive: "bg-danger-50 border border-danger-200 text-danger-800",
    success: "bg-success-50 border border-success-200 text-success-800",
    warning: "bg-warning-50 border border-warning-200 text-warning-800",
  };

  return (
    <div
      role="alert"
      className={cn("rounded-lg p-4", variants[variant], className)}
      {...props}
    >
      {title && <h5 className="mb-2 font-semibold">{title}</h5>}
      <div className="text-sm">{children}</div>
    </div>
  );
};

export { Alert };
