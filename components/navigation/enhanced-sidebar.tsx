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
  CheckCircle,
  CreditCard,
  FileText,
  BarChart3,
  User,
  Settings,
  Shield,
  FileSearch,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Database,
  Receipt,
  BookOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'default' | 'destructive' | 'secondary' | 'success' | 'warning' | 'info'
  children?: NavItem[]
  adminOnly?: boolean
  salesPersonOnly?: boolean
  iconColor?: string
  sectionColor?: string
}

// Navigation structure
const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Order to Cash',
    icon: ShoppingCart,
    iconColor: 'text-purple-600 dark:text-purple-400',
    sectionColor: 'border-purple-500/30',
    children: [
      {
        title: 'Customers',
        href: '/dashboard/customers',
        icon: Users,
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
      {
        title: 'Sales Orders',
        href: '/dashboard/sales-orders',
        icon: FileText,
        iconColor: 'text-purple-600 dark:text-purple-400',
      },
    ],
  },
  {
    title: 'Procure to Pay',
    icon: CreditCard,
    iconColor: 'text-amber-600 dark:text-amber-400',
    sectionColor: 'border-amber-500/30',
    children: [
      {
        title: 'Vendors',
        href: '/dashboard/vendors',
        icon: Users,
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
      {
        title: 'Purchase Orders',
        href: '/dashboard/purchase-orders',
        icon: Receipt,
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
    ],
  },
  {
    title: 'Inventory',
    icon: Database,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    sectionColor: 'border-emerald-500/30',
    children: [
      {
        title: 'Items',
        href: '/dashboard/items',
        icon: Database,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Warehouses',
        href: '/dashboard/warehouses',
        icon: FolderKanban,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        title: 'Movements',
        href: '/dashboard/inventory',
        icon: BarChart3,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
    ],
  },
  {
    title: 'Finance',
    icon: DollarSign,
    iconColor: 'text-slate-700 dark:text-slate-200',
    sectionColor: 'border-slate-500/30',
    children: [
      {
        title: 'Chart of Accounts',
        href: '/dashboard/finance/accounts',
        icon: BookOpen,
        iconColor: 'text-slate-700 dark:text-slate-200',
      },
      {
        title: 'Journal Entries',
        href: '/dashboard/finance/journals',
        icon: FileText,
        iconColor: 'text-slate-700 dark:text-slate-200',
      },
      {
        title: 'Accounting Periods',
        href: '/dashboard/finance/periods',
        icon: Calendar,
        iconColor: 'text-slate-700 dark:text-slate-200',
      },
      {
        title: 'Reports',
        icon: TrendingUp,
        iconColor: 'text-slate-700 dark:text-slate-200',
        children: [
          {
            title: 'Trial Balance',
            href: '/dashboard/finance/reports/trial-balance',
            icon: BarChart3,
            iconColor: 'text-slate-600 dark:text-slate-300',
          },
          {
            title: 'Balance Sheet',
            href: '/dashboard/finance/reports/balance-sheet',
            icon: FileText,
            iconColor: 'text-slate-600 dark:text-slate-300',
          },
          {
            title: 'Income Statement',
            href: '/dashboard/finance/reports/income-statement',
            icon: TrendingUp,
            iconColor: 'text-slate-600 dark:text-slate-300',
          },
        ],
      },
    ],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    iconColor: 'text-slate-700 dark:text-slate-200',
  },
]


interface EnhancedSidebarProps {
  userRole?: 'ADMIN' | 'SALESPERSON'
  pendingCount?: number
  unpaidCount?: number
  userName?: string
  organizationName?: string
}

export function EnhancedSidebar({
  userRole = 'ADMIN',
  pendingCount = 0,
  unpaidCount = 0,
  userName,
  organizationName,
}: EnhancedSidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'Order to Cash',
    'Procure to Pay',
    'Inventory',
    'Finance',
    'Reports',
  ])

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
    // Exact match for dashboard
    if (href === '/dashboard' && pathname === '/dashboard') return true
    // Starts with match for other pages
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    if (!isItemVisible(item)) return null

    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedSections.includes(item.title)
    const active = isActive(item.href)
    const badgeValue = getBadgeValue(item.badge)

    // Section with children
    if (hasChildren) {
      return (
        <div key={item.title}>
          <button
            onClick={() => toggleSection(item.title)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50',
              level > 0 && 'pl-9'
            )}
          >
            <Icon className={cn('h-4 w-4 transition-colors', item.iconColor)} />
            <span className="flex-1 text-left font-medium">{item.title}</span>
            {badgeValue && (
              <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                {badgeValue}
              </Badge>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && (
            <div className={cn(
              'ml-3 mt-1 space-y-1 border-l pl-3',
              item.sectionColor || 'border-border'
            )}>
              {item.children?.map((child) => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    // Regular link item
    return (
      <Link
        key={item.title}
        href={item.href!}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50',
          active && 'bg-gradient-to-r from-accent to-accent/50 font-medium text-accent-foreground shadow-sm',
          level > 0 && 'pl-9'
        )}
      >
        <Icon className={cn('h-4 w-4 transition-colors', item.iconColor, active && 'scale-110')} />
        <span className="flex-1">{item.title}</span>
        {badgeValue && (
          <Badge variant={item.badgeVariant || 'default'}>
            {badgeValue}
          </Badge>
        )}
      </Link>
    )
  }

  return (
    <div className="flex h-full flex-col gap-2">
      {/* Organization & User Info Header */}
      {(organizationName || userName) && (
        <div className="border-b border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 p-4">
          <div className="space-y-2">
            {organizationName && (
              <p className="text-sm font-semibold truncate bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">{organizationName}</p>
            )}
            {userName && (
              <p className="text-xs text-muted-foreground truncate">{userName}</p>
            )}
            <Badge
              variant={userRole === 'ADMIN' ? 'default' : 'info'}
              className="w-fit text-xs"
            >
              {userRole}
            </Badge>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => renderNavItem(item))}
        </nav>
      </div>

      {/* Quick Stats */}
      {userRole === 'ADMIN' && (pendingCount > 0 || unpaidCount > 0) && (
        <div className="border-t border-border/50 bg-gradient-to-br from-amber-500/5 via-transparent to-red-500/5 p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-3">Action Required</p>
          <div className="space-y-2 text-sm">
            {pendingCount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2 hover:bg-amber-500/20 transition-colors">
                <span className="text-amber-900 dark:text-amber-100 font-medium">Pending Approval</span>
                <Badge variant="warning">{pendingCount}</Badge>
              </div>
            )}
            {unpaidCount > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2 hover:bg-blue-500/20 transition-colors">
                <span className="text-blue-900 dark:text-blue-100 font-medium">Unpaid</span>
                <Badge variant="info">{unpaidCount}</Badge>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
