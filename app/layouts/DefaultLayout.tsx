import React from "react";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="container py-8">{children}</div>;
}
