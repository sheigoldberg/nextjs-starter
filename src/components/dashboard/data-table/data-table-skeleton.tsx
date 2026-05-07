import { Skeleton } from '@/components/ui';

interface DataTableSkeletonProps {
  columns: number;
  rows?: number;
}

export function DataTableSkeleton({ columns, rows = 5 }: DataTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="border-b">
          {/* Header skeleton */}
          <div className="flex">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={i} className="flex-1 p-4">
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Rows skeleton */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-b last:border-b-0">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1 p-4">
                {colIndex === 0 ? (
                  // First column (usually title with avatar)
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ) : colIndex === columns - 1 ? (
                  // Last column (usually actions)
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                ) : (
                  // Regular columns
                  <Skeleton className="h-4 w-20" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
