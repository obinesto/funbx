import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardGridLoading({
  titleWidth = "w-48",
  actionWidth,
  count = 8,
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className={`h-8 ${titleWidth}`} />
        {actionWidth ? <Skeleton className={`h-9 ${actionWidth}`} /> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="relative aspect-video">
              <Skeleton className="absolute inset-0" />
            </div>
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function DashboardVideoLoading() {
  return (
    <section className="flex min-h-full flex-col gap-4 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-8 w-3/4" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-24 w-full" />
      </div>

      <aside className="w-full space-y-4 lg:w-[420px]">
        <Skeleton className="h-7 w-40" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </aside>
    </section>
  );
}

export function DashboardSubscriptionsLoading() {
  return (
    <section className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <Card key={cardIndex} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default DashboardGridLoading;

