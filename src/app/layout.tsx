import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WeatherGPT - AI Climate & Weather Intelligence Platform',
  description: 'AI-Powered Weather, Air Quality, Trip Planner & Agriculture Advisory for India & Worldwide',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="antialiased min-h-screen text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
