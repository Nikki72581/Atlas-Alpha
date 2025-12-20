import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { ThemeWrapper } from "@/components/providers/theme-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Atlas ERP",
  description: "Junova Atlas ERP (Distribution-first) starter project",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeWrapper initialTheme="system">
          {children}
          <Toaster />
          <SonnerToaster />
        </ThemeWrapper>
      </body>
    </html>
  )
}
