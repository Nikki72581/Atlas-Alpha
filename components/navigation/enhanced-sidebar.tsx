'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  FolderKanban,
  DollarSign,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  FileSearch,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Database,
  Receipt,
  BookOpen,
  Calendar,
  TrendingUp,
  Tags,
  ArrowRightLeft,
  Ship,
  Hexagon,
  AlertCircle,
  Building2,
  ArrowLeftRight,
  LogOut,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info'
  children?: NavItem[]
  adminOnly?: boolean
  salesPersonOnly?: boolean
  module?: 'sales' | 'purchase' | 'inventory' | 'finance' | 'default'
}

// Navigation structure with module assignments
const navigation: NavItem[] = [
  {
    title: 'Command Center',
    href: '/dashboard',
    icon: LayoutDashboard,
    module: 'default',
  },
  {
    title: 'Order to Cash',
    icon: ShoppingCart,
    module: 'sales',
    children: [
      {
        title: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        module: 'sales',
      },
      {
        title: 'Sales Orders',
        href: '/dashboard/sales-orders',
        icon: FileText,
        module: 'sales',
      },
    ],
  },
  {
    title: 'Procure to Pay',
    icon: CreditCard,
    module: 'purchase',
    children: [
      {
        title: 'Vendors',
        href: '/dashboard/vendors',
        icon: Users,
        module: 'purchase',
      },
      {
        title: 'Purchase Orders',
        href: '/dashboard/purchase-orders',
        icon: Receipt,
        module: 'purchase',
      },
    ],
  },
  {
    title: 'Inventory',
    icon: Database,
    module: 'inventory',
    children: [
      {
        title: 'Items',
        href: '/dashboard/items',
        icon: Database,
        module: 'inventory',
      },
      {
        title: 'Warehouses',
        href: '/dashboard/warehouses',
        icon: FolderKanban,
        module: 'inventory',
      },
      {
        title: 'Transfer Orders',
        href: '/dashboard/transfer-orders',
        icon: ArrowRightLeft,
        module: 'inventory',
      },
      {
        title: 'Containers',
        href: '/dashboard/containers',
        icon: Ship,
        module: 'inventory',
      },
      {
        title: 'Movements',
        href: '/dashboard/inventory',
        icon: BarChart3,
        module: 'inventory',
      },
      {
        title: 'Items to Transfer',
        href: '/dashboard/reports/items-to-transfer',
        icon: FileSearch,
        module: 'inventory',
      },
      {
        title: 'Inventory in Transit',
        href: '/dashboard/reports/inventory-in-transit',
        icon: Ship,
        module: 'inventory',
      },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    module: 'finance',
    children: [
      {
        title: 'Chart of Accounts',
        href: '/dashboard/finance/accounts',
        icon: BookOpen,
        module: 'finance',
      },
      {
        title: 'Journal Entries',
        href: '/dashboard/finance/journals',
        icon: FileText,
        module: 'finance',
      },
      {
        title: 'Bank Accounts',
        href: '/dashboard/finance/bank-accounts',
        icon: Building2,
        module: 'finance',
      },
      {
        title: 'Bank Transactions',
        href: '/dashboard/finance/bank-transactions',
        icon: ArrowLeftRight,
        module: 'finance',
      },
      {
        title: 'Accounting Periods',
        href: '/dashboard/finance/periods',
        icon: Calendar,
        module: 'finance',
      },
      {
        title: 'Dimensions',
        href: '/dashboard/finance/dimensions',
        icon: Tags,
        module: 'finance',
      },
      {
        title: 'Reports',
        icon: TrendingUp,
        module: 'finance',
        children: [
          {
            title: 'Trial Balance',
            href: '/dashboard/finance/reports/trial-balance',
            icon: BarChart3,
            module: 'finance',
          },
          {
            title: 'Balance Sheet',
            href: '/dashboard/finance/reports/balance-sheet',
            icon: FileText,
            module: 'finance',
          },
          {
            title: 'Income Statement',
            href: '/dashboard/finance/reports/income-statement',
            icon: TrendingUp,
            module: 'finance',
          },
        ],
      },
    ],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    module: 'default',
  },
]

// Module color classes using the new design system
const moduleColors = {
  sales: {
    icon: 'text-[oklch(0.55_0.18_320)] dark:text-[oklch(0.72_0.16_320)]',
    bg: 'bg-[oklch(0.55_0.18_320/0.08)] dark:bg-[oklch(0.68_0.18_320/0.12)]',
    border: 'border-l-[oklch(0.55_0.18_320)] dark:border-l-[oklch(0.68_0.18_320)]',
    activeBg: 'bg-[oklch(0.55_0.18_320/0.12)] dark:bg-[oklch(0.68_0.18_320/0.18)]',
  },
  purchase: {
    icon: 'text-[oklch(0.58_0.14_55)] dark:text-[oklch(0.74_0.12_55)]',
    bg: 'bg-[oklch(0.58_0.14_55/0.08)] dark:bg-[oklch(0.70_0.14_55/0.12)]',
    border: 'border-l-[oklch(0.58_0.14_55)] dark:border-l-[oklch(0.70_0.14_55)]',
    activeBg: 'bg-[oklch(0.58_0.14_55/0.12)] dark:bg-[oklch(0.70_0.14_55/0.18)]',
  },
  inventory: {
    icon: 'text-[oklch(0.52_0.14_165)] dark:text-[oklch(0.66_0.12_165)]',
    bg: 'bg-[oklch(0.52_0.14_165/0.08)] dark:bg-[oklch(0.62_0.14_165/0.12)]',
    border: 'border-l-[oklch(0.52_0.14_165)] dark:border-l-[oklch(0.62_0.14_165)]',
    activeBg: 'bg-[oklch(0.52_0.14_165/0.12)] dark:bg-[oklch(0.62_0.14_165/0.18)]',
  },
  finance: {
    icon: 'text-[oklch(0.45_0.08_250)] dark:text-[oklch(0.64_0.08_250)]',
    bg: 'bg-[oklch(0.45_0.08_250/0.08)] dark:bg-[oklch(0.60_0.10_250/0.12)]',
    border: 'border-l-[oklch(0.45_0.08_250)] dark:border-l-[oklch(0.60_0.10_250)]',
    activeBg: 'bg-[oklch(0.45_0.08_250/0.12)] dark:bg-[oklch(0.60_0.10_250/0.18)]',
  },
  default: {
    icon: 'text-[oklch(0.35_0.08_195)] dark:text-[oklch(0.70_0.10_195)]',
    bg: 'bg-[oklch(0.35_0.08_195/0.06)] dark:bg-[oklch(0.70_0.10_195/0.10)]',
    border: 'border-l-[oklch(0.35_0.08_195)] dark:border-l-[oklch(0.70_0.10_195)]',
    activeBg: 'bg-[oklch(0.35_0.08_195/0.10)] dark:bg-[oklch(0.70_0.10_195/0.15)]',
  },
}

interface EnhancedSidebarProps {
  userRole?: 'ADMIN' | 'SALESPERSON'
  pendingCount?: number
  unpaidCount?: number
  userName?: string
  organizationName?: string
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function EnhancedSidebar({
  userRole = 'ADMIN',
  pendingCount = 0,
  unpaidCount = 0,
  userName,
  organizationName,
  collapsed: controlledCollapsed,
  onCollapsedChange,
}: EnhancedSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Order to Cash',
    'Procure to Pay',
    'Inventory',
    'Finance',
    'Reports',
  ])

  const toggleCollapsed = () => {
    const newValue = !collapsed
    setInternalCollapsed(newValue)
    onCollapsedChange?.(newValue)
  }

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title)
        ? prev.filter((s) => s !== title)
        : [...prev, title]
    )
  }

  const isItemVisible = (item: NavItem) => {
    if (item.adminOnly && userRole !== 'ADMIN') return false
    if (item.salesPersonOnly && userRole !== 'SALESPERSON') return false
    return true
  }

  const getBadgeValue = (badge?: string | number) => {
    if (typeof badge === 'number') return badge
    if (badge === 'pendingCount') return pendingCount
    if (badge === 'unpaidCount') return unpaidCount
    return badge
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  const getModuleColors = (module?: string) => {
    return moduleColors[module as keyof typeof moduleColors] || moduleColors.default
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    if (!isItemVisible(item)) return null

    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.includes(item.title)
    const active = isActive(item.href)
    const badgeValue = getBadgeValue(item.badge)
    const colors = getModuleColors(item.module)

    // Section with children
    if (hasChildren) {
      // When collapsed, show only the parent icon with link to first child
      if (collapsed) {
        const firstChildWithHref = item.children?.find(c => c.href)
        return (
          <div key={item.title} className="relative group">
            <Link
              href={firstChildWithHref?.href || '#'}
              className={cn(
                'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
                'hover:bg-accent/60'
              )}
              title={item.title}
            >
              <div className={cn('rounded-md p-1.5 transition-colors', colors.bg)}>
                <Icon className={cn('h-4 w-4', colors.icon)} />
              </div>
            </Link>
            {/* Tooltip */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              {item.title}
            </div>
          </div>
        )
      }

      return (
        <div key={item.title} className="space-y-0.5">
          <button
            onClick={() => toggleSection(item.title)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
              'hover:bg-accent/60',
              level > 0 && 'pl-9'
            )}
          >
            <div className={cn('rounded-md p-1.5 transition-colors', colors.bg)}>
              <Icon className={cn('h-4 w-4', colors.icon)} />
            </div>
            <span className="flex-1 text-left font-medium">{item.title}</span>
            {badgeValue && (
              <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                {badgeValue}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                !isExpanded && '-rotate-90'
              )}
            />
          </button>
          <div
            className={cn(
              'ml-4 space-y-0.5 border-l-2 pl-3 overflow-hidden transition-all duration-200',
              colors.border,
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            )}
          >
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        </div>
      )
    }

    // Regular link item - collapsed mode
    if (collapsed && level === 0) {
      return (
        <div key={item.title} className="relative group">
          <Link
            href={item.href!}
            className={cn(
              'flex items-center justify-center rounded-lg p-2.5 transition-all duration-200',
              'hover:bg-accent/60',
              active && cn(colors.activeBg, 'shadow-sm')
            )}
            title={item.title}
          >
            <div
              className={cn(
                'rounded-md p-1.5 transition-all duration-200',
                active ? colors.bg : 'bg-transparent group-hover:bg-accent/50'
              )}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-all duration-200',
                  active ? colors.icon : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
            </div>
            {badgeValue && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                {typeof badgeValue === 'number' && badgeValue > 9 ? '9+' : badgeValue}
              </span>
            )}
          </Link>
          {/* Tooltip */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
            {item.title}
          </div>
        </div>
      )
    }

    // Regular link item - expanded mode
    return (
      <Link
        key={item.title}
        href={item.href!}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200',
          'hover:bg-accent/60',
          active && cn(colors.activeBg, 'shadow-sm'),
          level > 0 && 'pl-3'
        )}
      >
        <div
          className={cn(
            'rounded-md p-1.5 transition-all duration-200',
            active ? colors.bg : 'bg-transparent group-hover:bg-accent/50',
            level > 0 && 'p-1'
          )}
        >
          <Icon
            className={cn(
              'transition-all duration-200',
              level > 0 ? 'h-3.5 w-3.5' : 'h-4 w-4',
              active ? colors.icon : 'text-muted-foreground group-hover:text-foreground'
            )}
          />
        </div>
        <span className={cn('flex-1', active && 'font-medium')}>{item.title}</span>
        {badgeValue && (
          <Badge variant={item.badgeVariant || 'default'}>
            {badgeValue}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border py-4 transition-all duration-300',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          <Hexagon className="h-5 w-5 text-primary" strokeWidth={1.5} />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-display text-lg tracking-tight">Atlas</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Alpha</span>
          </div>
        )}
      </div>

      {/* Organization & User Info */}
      {(organizationName || userName) && !collapsed && (
        <div className="border-b border-sidebar-border px-4 py-3">
          <div className="space-y-1.5">
            {organizationName && (
              <p className="text-sm font-medium truncate">{organizationName}</p>
            )}
            {userName && (
              <p className="text-xs text-muted-foreground truncate">{userName}</p>
            )}
            <Badge
              variant={userRole === 'ADMIN' ? 'default' : 'secondary'}
              className="text-[10px] uppercase tracking-wider"
            >
              {userRole}
            </Badge>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3">
        <nav className={cn('space-y-1', collapsed ? 'px-2' : 'px-3')}>
          {navigation.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Action Required Section */}
      {userRole === 'ADMIN' && (pendingCount > 0 || unpaidCount > 0) && !collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-lg bg-[oklch(0.55_0.22_25/0.06)] dark:bg-[oklch(0.60_0.20_25/0.10)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-3.5 w-3.5 text-[oklch(0.50_0.20_25)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[oklch(0.45_0.18_25)] dark:text-[oklch(0.70_0.15_25)]">
                Action Required
              </span>
            </div>
            <div className="space-y-1.5">
              {pendingCount > 0 && (
                <Link
                  href="/dashboard/sales-orders?status=PENDING"
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[oklch(0.55_0.22_25/0.08)]"
                >
                  <span className="text-xs">Pending Approval</span>
                  <Badge variant="warning" className="text-[10px]">{pendingCount}</Badge>
                </Link>
              )}
              {unpaidCount > 0 && (
                <Link
                  href="/dashboard/finance/reports"
                  className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[oklch(0.55_0.12_230/0.08)]"
                >
                  <span className="text-xs">Unpaid Items</span>
                  <Badge variant="info" className="text-[10px]">{unpaidCount}</Badge>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed Action Indicator */}
      {userRole === 'ADMIN' && (pendingCount > 0 || unpaidCount > 0) && collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <div className="relative group flex justify-center">
            <Link
              href="/dashboard/sales-orders?status=PENDING"
              className="flex items-center justify-center rounded-lg p-2 bg-[oklch(0.55_0.22_25/0.06)] dark:bg-[oklch(0.60_0.20_25/0.10)] hover:bg-[oklch(0.55_0.22_25/0.12)]"
            >
              <AlertCircle className="h-4 w-4 text-[oklch(0.50_0.20_25)]" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                {pendingCount + unpaidCount > 9 ? '9+' : pendingCount + unpaidCount}
              </span>
            </Link>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Action Required
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={cn(
        'border-t border-sidebar-border py-3 transition-all duration-300',
        collapsed ? 'px-2' : 'px-4'
      )}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            'flex w-full items-center rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground mb-2',
            collapsed ? 'justify-center px-0' : 'gap-2 px-2'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className={cn(
            'h-3.5 w-3.5 transition-transform duration-300',
            collapsed && 'rotate-180'
          )} />
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* Sign Out Button */}
        <div className="relative group">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/login')
              router.refresh()
            }}
            className={cn(
              'flex w-full items-center rounded-lg py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground',
              collapsed ? 'justify-center px-0' : 'gap-2 px-2'
            )}
          >
            <LogOut className="h-3.5 w-3.5" />
            {!collapsed && <span>Sign out</span>}
          </button>
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
              Sign out
            </div>
          )}
        </div>

        {!collapsed && (
          <p className="mt-2 text-[10px] text-muted-foreground/60">
            Atlas Alpha v0.1 · Distribution ERP
          </p>
        )}
      </div>
    </aside>
  )
}
