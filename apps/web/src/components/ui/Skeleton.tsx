import { cn } from "@/utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
}

const Skeleton = ({ className, count = 1, ...props }: SkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn("animate-pulse rounded-lg bg-slate-200", className)}
          {...props}
        />
      ))}
    </>
  );
};

export { Skeleton };
