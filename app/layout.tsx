// app/layout.tsx
import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Free Macro Calculator & AI Meal Planner | Hit Your Daily Targets",
  description: "Calculate your exact macro targets with our free, science-based calculator. Get AI-generated meal plans that hit your protein, carb & fat goals for weight loss or muscle gain. Try it free!",
  keywords: "macro calculator, free macro calculator, AI meal planner, macro meal generator, IIFYM calculator, nutrition calculator, macro counting, flexible dieting",
  authors: [{ name: "Macro Meal Generator" }],
  creator: "Macro Meal Generator",
  publisher: "Macro Meal Generator",
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://macro-meal-generator.vercel.app/', // Replace with your actual domain
    siteName: 'Macro Meal Generator',
    title: 'Free Macro Calculator & AI Meal Planner | Hit Your Daily Targets',
    description: 'Calculate your exact macro targets with our free, science-based calculator. Get AI-generated meal plans that hit your protein, carb & fat goals.',
    images: [
      {
        url: '/og-image.jpg', // You'll need to create this
        width: 1200,
        height: 630,
        alt: 'Free Macro Calculator & AI Meal Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Macro Calculator & AI Meal Planner',
    description: 'Calculate your exact macro targets and get AI-generated meal plans. Free science-based nutrition tool.',
    images: ['/twitter-card.jpg'], // You'll need to create this
  },
  verification: {
    google: 'your-google-verification-code', // You'll get this from Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Macro Meal Generator",
              "description": "Free macro calculator and AI meal planner for personalized nutrition",
              "url": "https://macro-meal-generator.vercel.app/", // Replace with your domain
              "applicationCategory": "HealthApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Science-based macro calculator",
                "AI meal plan generation",
                "Personalized nutrition targets",
                "Weight loss and muscle gain support"
              ],
              "author": {
                "@type": "Organization",
                "name": "Macro Meal Generator"
              }
            })
          }}
        />
      </head>
      <body
        className={`${poppins.variable} ${jetBrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}