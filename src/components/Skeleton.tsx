import { cn } from '../utils/cn';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div className={cn("animate-pulse bg-white/10 rounded", className)} />
  );
};

export const CardSkeleton = () => (
  <div className="glass-card p-4 rounded-xl border border-white/5 space-y-4">
    <Skeleton className="h-6 w-1/3" />
    <Skeleton className="h-20 w-full rounded-lg" />
    <div className="flex justify-between">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

export const MatchCardSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden border border-white/5 h-48 animate-pulse">
    <div className="bg-white/5 h-10 w-full" />
    <div className="flex h-32 divide-x divide-white/10">
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
        <Skeleton className="w-16 h-12 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4">
        <Skeleton className="w-16 h-12 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);
