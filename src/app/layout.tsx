import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { TopBar } from "@/components/layout/TopBar";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: site.name,
  description: site.description,
  // Internal tool: keep it out of search engines.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <div className="app-shell">
          <TopBar />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
