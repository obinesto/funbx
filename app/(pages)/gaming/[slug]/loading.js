import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <section className="space-y-4 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-72 max-w-full" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <Card className="overflow-hidden border-hidden bg-black shadow-lg">
        <Skeleton className="h-[72vh] min-h-[520px] w-full rounded-none bg-white/10" />
      </Card>

      <Skeleton className="h-12 w-full" />
    </section>
  );
}
