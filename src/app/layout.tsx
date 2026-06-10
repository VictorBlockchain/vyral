import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '@/context/WalletContext';
import { UserProvider } from '@/context/UserContext';
import { AdminProvider } from '@/context/AdminContext';

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'Vyral | Growth OS',
    template: '%s | Vyral',
  },
  description:
    'Web3 Viral Challenges Marketplace on Solana. Create, accept, and win viral challenges with VYRAL tokens.',
  metadataBase: new URL('https://vyral.buzz'),
  applicationName: 'Vyral Growth OS',
  authors: [{ name: 'Vyral', url: 'https://vyral.buzz' }],
  keywords: [
    'Vyral',
    'Solana',
    'Web3',
    'viral challenges',
    'creator economy',
    'TikTok growth',
    'challenges marketplace',
    'VYRAL token',
  ],
  themeColor: '#1f2937',
  colorScheme: 'dark',
  alternates: {
    canonical: new URL('https://vyral.buzz'),
  },
  openGraph: {
    title: 'Vyral | Growth OS',
    description:
      'Web3 Viral Challenges Marketplace on Solana. Create, accept, and win viral challenges with VYRAL tokens.',
    type: 'website',
    url: 'https://vyral.buzz',
    siteName: 'Vyral',
    images: [
      {
        url: '/logo.svg',
        width: 1200,
        height: 630,
        alt: 'Vyral Growth OS',
      },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vyral | Growth OS',
    description:
      'Web3 Viral Challenges Marketplace on Solana. Create, accept, and win viral challenges with VYRAL tokens.',
    images: ['/logo.svg'],
    creator: '@vyral',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className={`${fredoka.variable} ${nunito.variable}`}>
        <WalletProvider>
          <UserProvider>
            <AdminProvider>{children}</AdminProvider>
          </UserProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
