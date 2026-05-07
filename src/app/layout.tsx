import type { Metadata } from 'next';
import { Toaster } from '@/components/ui';
import Providers from '@/app/providers';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const appName = process.env.NEXT_PUBLIC_APP_DISPLAY_NAME || 'My App';

export const metadata: Metadata = {
  title: {
    template: `%s - ${appName}`,
    default: appName,
  },
  description: 'Built with nextjs-starter',
  openGraph: {
    type: 'website',
    url: siteUrl,
    title: appName,
    siteName: appName,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="flex min-h-screen flex-col antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
