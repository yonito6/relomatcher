// components/ClientOnly.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On the server (and very first render) render nothing.
  if (!mounted) return null;

  return <>{children}</>;
}
