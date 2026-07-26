import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'About You — The 1975',
  description: 'About You — The 1975. An interactive music video experience.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&family=Playfair+Display:ital,wght@0,700;1,700&family=Syne:wght@700;800&family=Fraunces:ital,opsz,wght@1,9..144,700&family=Space+Mono:ital,wght@0,700;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
