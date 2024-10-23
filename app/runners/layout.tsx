import { Suspense } from "react";
import DefaultLayout from "@/app/layouts/DefaultLayout";

export default function RunnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultLayout>
      <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
    </DefaultLayout>
  );
}
