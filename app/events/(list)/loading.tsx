import { Skeleton } from "@/components/design";

/** The calendar while it loads: the sentence and a few ledger rows, no spinner. */
export default function Loading() {
  return (
    <div className="container pt-5 pb-12 md:pt-7" aria-busy="true">
      <Skeleton className="mb-3 h-3 w-16" />
      <Skeleton className="h-7 w-full max-w-3xl" />
      <Skeleton className="mt-2 h-7 w-2/3 max-w-xl" />
      <div className="mt-8 border-t-2 border-fg">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="grid grid-cols-[5rem_1fr] gap-3 border-b border-hair py-3 lg:grid-cols-[9rem_10rem_1fr_12rem]">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="hidden h-4 w-1/2 lg:block" />
            <Skeleton className="hidden h-4 w-2/3 lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
