import { Suspense } from "react";

export default function RunnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </main>
  );
}
