import { EnhancedSidebar } from "@/components/navigation/enhanced-sidebar"
import { EnhancedHeader } from "@/components/navigation/enhanced-header"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <EnhancedSidebar />
        <div className="flex-1 min-w-0">
          <EnhancedHeader />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
