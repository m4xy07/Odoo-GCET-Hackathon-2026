import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/utils/cn';
import { Provider as TooltipProvider } from '@/components/ui/tooltip';
import { NotificationProvider } from '@/components/ui/notification-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const geistMono = localFont({
  src: './fonts/GeistMono[wght].woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  preload: false, // only used for codes and numbers, not worth blocking first paint
});

export const metadata: Metadata = {
  title: 'StockSense',
  description: 'Inventory that keeps its own ledger',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang='en' className={cn(inter.variable, geistMono.variable, 'antialiased')}>
      <body className='bg-bg-white-0 font-sans text-text-strong-950'>
        <ClerkProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <NotificationProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
