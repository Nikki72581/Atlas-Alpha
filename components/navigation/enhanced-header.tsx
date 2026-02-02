'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Moon,
  Sun,
  Search,
  Bell,
  ChevronRight,
  Home,
  User,
} from 'lucide-react'
import { useTheme } from '@/components/providers/theme-provider'

interface BreadcrumbItem {
  label: string
  href?: string
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const p = pathname.replace(/\?.*$/, '')
  const crumbs: BreadcrumbItem[] = []

  if (p === '/dashboard') {
    return [{ label: 'Command Center' }]
  }

  // Build breadcrumb based on path segments
  const segments = p.replace('/dashboard/', '').split('/')

  const labelMap: Record<string, string> = {
    customers: 'Customers',
    vendors: 'Vendors',
    items: 'Items',
    warehouses: 'Warehouses',
    'sales-orders': 'Sales Orders',
    'purchase-orders': 'Purchase Orders',
    inventory: 'Inventory Movements',
    'transfer-orders': 'Transfer Orders',
    containers: 'Containers',
    finance: 'Finance',
    accounts: 'Chart of Accounts',
    journals: 'Journal Entries',
    periods: 'Accounting Periods',
    dimensions: 'Dimensions',
    reports: 'Reports',
    'trial-balance': 'Trial Balance',
    'balance-sheet': 'Balance Sheet',
    'income-statement': 'Income Statement',
    'items-to-transfer': 'Items to Transfer',
    'inventory-in-transit': 'Inventory in Transit',
    settings: 'Settings',
  }

  let currentPath = '/dashboard'
  segments.forEach((segment, idx) => {
    currentPath += `/${segment}`
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

    if (idx === segments.length - 1) {
      crumbs.push({ label })
    } else {
      crumbs.push({ label, href: currentPath })
    }
  })

  return crumbs
}

export function EnhancedHeader() {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
          </Link>

          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-2 text-muted-foreground md:flex"
            asChild
          >
            <Link href="/dashboard/search">
              <Search className="h-4 w-4" />
              <span className="text-sm">Search</span>
              <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground lg:inline-flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Link>
          </Button>

          {/* Mobile search */}
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link href="/dashboard/search">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="sr-only">Notifications</span>
            {/* Notification dot */}
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[oklch(0.55_0.22_25)]" />
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="relative overflow-hidden"
          >
            <Sun className={cn(
              'h-4 w-4 transition-all duration-300',
              resolvedTheme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
            )} />
            <Moon className={cn(
              'absolute h-4 w-4 transition-all duration-300',
              resolvedTheme === 'dark' ? '-rotate-90 scale-0' : 'rotate-0 scale-100'
            )} />
          </Button>

          {/* User avatar */}
          <Button variant="ghost" size="icon" className="ml-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  )
}
