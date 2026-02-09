import { cn } from "@/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      "rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow",
      className
    )}
    {...props}
  />
);

const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn("flex flex-col space-y-1.5 p-6 border-b border-slate-200", className)} {...props} />
);

const CardTitle = ({ className, ...props }: CardProps) => (
  <h2 className={cn("text-2xl font-semibold leading-none tracking-tight text-slate-900", className)} {...props} />
);

const CardDescription = ({ className, ...props }: CardProps) => (
  <p className={cn("text-sm text-slate-500", className)} {...props} />
);

const CardContent = ({ className, ...props }: CardProps) => (
  <div className={cn("p-6", className)} {...props} />
);

const CardFooter = ({ className, ...props }: CardProps) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
