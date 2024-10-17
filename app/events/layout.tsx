import { Suspense } from "react";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </div>
  );
}
