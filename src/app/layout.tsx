import type { Metadata, Viewport } from 'next';
import { Inter, Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat'
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 2,
  userScalable: true,
  themeColor: '#0B0B0D',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'JOGIn - Running Club Community',
  description: 'Connect with local running clubs and fellow runners. Track your progress, join events, and be part of an active community.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JOGIn',
  },
  applicationName: 'JOGIn',
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} min-h-screen overscroll-none`}>
        {/* Main Content */}
        <ThemeProvider>
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
} 