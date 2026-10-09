import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { preload } from "react-dom";

import { Cursor, ParticleCanvas } from "@/components/Chrome";
import { SiteMotion } from "@/features/motion/SiteMotion";
import { DATA_URL } from "@/features/particles/data";
import { site } from "@/lib/site";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.title,
  description: site.description,
  authors: [{ name: site.name, url: site.url }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.shortName,
    title: site.title,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: site.themeColor,
};

/**
 * Runs before first paint: applies the saved theme and reduced-motion class, and shows the
 * preloader. A failsafe drops the preloader if the app bundle never finishes booting.
 */
const bootScript = `(function(){var d=document.documentElement;
try{var t=localStorage.getItem('lyb-theme');if(t==='dark'||t==='light')d.dataset.theme=t;}catch(e){}
if(matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('reduce');return;}
d.classList.add('js-loading');
setTimeout(function(){d.classList.remove('js-loading');},15000);})();`;

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  jobTitle: "Frontend Engineer",
  url: site.url,
  email: `mailto:${site.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Accra", addressCountry: "GH" },
  worksFor: { "@type": "Organization", name: "Stanbic Bank Ghana" },
  sameAs: [site.github, site.linkedin],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  preload(DATA_URL, { as: "fetch", crossOrigin: "anonymous" });
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>
        <ParticleCanvas />
        {children}
        <Cursor />
        <SiteMotion />
      </body>
    </html>
  );
}
