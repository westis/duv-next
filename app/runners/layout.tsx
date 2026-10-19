import DefaultLayout from "@/app/layouts/DefaultLayout";

export default function RunnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DefaultLayout>
      {children}
    </DefaultLayout>
  );
}
