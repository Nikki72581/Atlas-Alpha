import type { Metadata } from "next"
import { DM_Sans, DM_Serif_Display } from "next/font/google"
import "./globals.css"

import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeWrapper } from "@/components/providers/theme-wrapper"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Atlas Alpha",
  description: "Atlas Alpha ERP — Distribution-first, built for operators who outgrew spreadsheets",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className={dmSans.className}>
        <ThemeWrapper initialTheme="system">
          {children}
          <Toaster />
          <SonnerToaster
            position="bottom-right"
            toastOptions={{
              className: "shadow-card",
              style: {
                borderRadius: "0.5rem",
              },
            }}
          />
        </ThemeWrapper>
      </body>
    </html>
  )
}
