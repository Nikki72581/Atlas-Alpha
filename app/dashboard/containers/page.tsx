import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Plus, Ship, Calendar } from "lucide-react"
import Link from "next/link"
import { ContainerStatus } from "@prisma/client"

export default async function ContainersPage() {
  const containers = await prisma.container.findMany({
    where: { organizationId: DEMO_ORG_ID },
    include: {
      originWarehouse: true,
      destWarehouse: true,
      transferOrders: {
        include: {
          lines: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const getStatusColor = (status: ContainerStatus) => {
    switch (status) {
      case 'PLANNED':
        return 'outline'
      case 'LOADING':
      case 'LOADED':
        return 'secondary'
      case 'IN_TRANSIT':
        return 'default'
      case 'ARRIVED':
      case 'UNLOADING':
        return 'default'
      case 'UNLOADED':
        return 'default'
      case 'CANCELLED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Containers</h1>
          <p className="text-muted-foreground mt-1">
            Track 40ft FCL ocean freight containers
          </p>
        </div>
        <Link href="/dashboard/containers/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Container
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{containers.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => c.status === 'IN_TRANSIT').length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => c.status === 'PLANNED').length}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unloaded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {containers.filter(c => c.status === 'UNLOADED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>All Containers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Container #</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Route</th>
                  <th className="px-4 py-3 text-left font-medium">Carrier</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Depart</th>
                  <th className="px-4 py-3 text-left font-medium">Arrive</th>
                  <th className="px-4 py-3 text-left font-medium">Transfer Orders</th>
                </tr>
              </thead>
              <tbody>
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No containers found. Create your first container to get started.
                    </td>
                  </tr>
                ) : (
                  containers.map((container) => (
                    <tr key={container.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/containers/${container.id}`}
                          className="font-medium hover:underline"
                        >
                          {container.containerNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {container.containerType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-xs">
                            {container.originWarehouse.code} → {container.destWarehouse.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {container.originWarehouse.name} to {container.destWarehouse.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {container.carrier && (
                            <span className="text-xs font-medium">{container.carrier}</span>
                          )}
                          {container.vesselName && (
                            <span className="text-xs text-muted-foreground">{container.vesselName}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusColor(container.status)}>
                          {container.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span className="text-muted-foreground">Plan:</span>
                          <span>{formatDate(container.plannedDepartDate)}</span>
                          {container.actualDepartDate && (
                            <>
                              <span className="text-muted-foreground mt-1">Actual:</span>
                              <span className="font-medium">{formatDate(container.actualDepartDate)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col text-xs">
                          <span className="text-muted-foreground">Plan:</span>
                          <span>{formatDate(container.plannedArrivalDate)}</span>
                          {container.actualArrivalDate && (
                            <>
                              <span className="text-muted-foreground mt-1">Actual:</span>
                              <span className="font-medium">{formatDate(container.actualArrivalDate)}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {container.transferOrders.length === 0 ? (
                            <span className="text-xs text-muted-foreground">None</span>
                          ) : (
                            <>
                              {container.transferOrders.slice(0, 2).map((to) => (
                                <Badge key={to.id} variant="outline" className="text-xs">
                                  {to.transferOrderNumber} ({to.lines.length} lines)
                                </Badge>
                              ))}
                              {container.transferOrders.length > 2 && (
                                <span className="text-xs text-muted-foreground">
                                  +{container.transferOrders.length - 2} more
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
