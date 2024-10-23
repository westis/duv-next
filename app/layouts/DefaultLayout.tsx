import React from "react";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-grow container mx-auto py-8">{children}</main>;
}
