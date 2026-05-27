import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Gamepad2 } from "lucide-react";

function GameCardSkeleton() {
  return (
    <Card className="grid h-full min-h-[360px] grid-rows-[auto_1fr] overflow-hidden">
      <div className="relative aspect-video">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="grid min-h-0 grid-rows-[1fr_auto] p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="mt-4 h-9 w-full" />
      </div>
    </Card>
  );
}

export function GameGridLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <GameCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function GamingLoadingSkeleton() {
  return (
    <section className="space-y-4 pb-12">
      <Card className="border-hidden p-4">
        <div className="flex items-center gap-2 text-customRed">
          <Gamepad2 className="h-5 w-5" />
          <Skeleton className="h-7 w-28" />
        </div>
        <Skeleton className="mt-2 h-4 w-56" />
      </Card>

      <div className="flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-6 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      <GameGridLoadingSkeleton />
    </section>
  );
}

export default function Loading() {
  return <GamingLoadingSkeleton />;
}
