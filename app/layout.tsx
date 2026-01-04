import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Macro Tracker',
  description: 'AI-powered nutrition tracking for muscle gain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
