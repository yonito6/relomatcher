// app/layout.tsx
import type { ReactNode } from "react";
import "./globals.css";
import ClientOnly from "@/components/ClientOnly";
import Script from "next/script";

export const metadata = {
  title: "ReloMatcher",
  description: "The dating app for your next country",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className="bg-slate-50 text-slate-900 min-h-screen"
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-72H2Z0HF2C"
          strategy="afterInteractive"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-72H2Z0HF2C', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
        {/* End Google Analytics */}

        <ClientOnly>{children}</ClientOnly>
      </body>
    </html>
  );
}
