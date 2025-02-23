import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { AuthProvider } from './contexts/auth';
import { CartProvider } from './contexts/cart';
import { FeatureFlagsProvider } from './contexts/featureFlags';
import { Toaster } from 'react-hot-toast';
import Header from '@/components/Header';

// Primary font for body text - clean and highly readable
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Secondary font for headings - warmer, more personable
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "localmart",
  description: "Local delivery marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <ClerkProvider>
          <FeatureFlagsProvider>
            <AuthProvider>
              <CartProvider>
                <Header />
                {children}
              </CartProvider>
            </AuthProvider>
          </FeatureFlagsProvider>
        </ClerkProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
