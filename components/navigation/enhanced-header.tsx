'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Moon, Sun, Command, Building2 } from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'

function pageTitleFromPath(pathname: string) {
  const p = pathname.replace(/\?.*$/, '')
  if (p === '/dashboard') return 'Dashboard'
  if (p.startsWith('/dashboard/customers')) return 'Customers'
  if (p.startsWith('/dashboard/vendors')) return 'Vendors'
  if (p.startsWith('/dashboard/items')) return 'Items'
  if (p.startsWith('/dashboard/warehouses')) return 'Warehouses'
  if (p.startsWith('/dashboard/sales-orders')) return 'Sales Orders'
  if (p.startsWith('/dashboard/purchase-orders')) return 'Purchase Orders'
  if (p.startsWith('/dashboard/inventory')) return 'Inventory'
  if (p.startsWith('/dashboard/finance/accounts')) return 'Chart of Accounts'
  if (p.startsWith('/dashboard/finance/journals')) return 'Journals'
  if (p.startsWith('/dashboard/settings')) return 'Settings'
  return 'Atlas'
}

export function EnhancedHeader() {
  const pathname = usePathname()
  const title = pageTitleFromPath(pathname)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-foreground/80" />
            <span className="text-sm font-semibold">Atlas</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-sm font-medium text-foreground/90">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link
            href="/dashboard/search"
            className={cn(
              'hidden md:flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors'
            )}
          >
            <Command className="h-3.5 w-3.5" />
            Search
            <span className="ml-2 rounded border px-1.5 py-0.5 text-[10px]">⌘K</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
