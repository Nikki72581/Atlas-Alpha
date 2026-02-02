import { EnhancedSidebar } from "@/components/navigation/enhanced-sidebar"
import { EnhancedHeader } from "@/components/navigation/enhanced-header"

export const dynamic = 'force-dynamic'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-muted/40 via-background to-background" />

      <div className="flex h-screen">
        {/* Sidebar - fixed width */}
        <div className="hidden lg:block">
          <EnhancedSidebar
            organizationName="Demo Organization"
            userName="Admin User"
            userRole="ADMIN"
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          <EnhancedHeader />

          {/* Content with refined spacing */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 md:px-8 lg:px-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
