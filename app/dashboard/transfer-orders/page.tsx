import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Plus } from "lucide-react"
import { TransferOrderDialog } from "./transfer-order-dialog"
import { TransferOrderActions } from "./transfer-order-actions"

export default async function TransferOrdersPage() {
  const transferOrders = await prisma.transferOrder.findMany({
    where: { organizationId: DEMO_ORG_ID },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      lines: {
        include: {
          item: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: DEMO_ORG_ID, isActive: true },
    orderBy: { code: 'asc' }
  })

  const items = await prisma.item.findMany({
    where: { organizationId: DEMO_ORG_ID, isActive: true },
    orderBy: { sku: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transfer Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage warehouse-to-warehouse inventory transfers
          </p>
        </div>
        <TransferOrderDialog
          warehouses={warehouses}
          items={items}
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transfer Order
            </Button>
          }
        />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Transfer Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">TO #</th>
                  <th className="px-4 py-3 text-left font-medium">From</th>
                  <th className="px-4 py-3 text-left font-medium">To</th>
                  <th className="px-4 py-3 text-left font-medium">Order Date</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Lines</th>
                  <th className="px-4 py-3 text-left font-medium">Ship Method</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transferOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      No transfer orders found. Create your first transfer order to get started.
                    </td>
                  </tr>
                ) : (
                  transferOrders.map((to) => (
                    <tr key={to.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{to.transferOrderNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{to.fromWarehouse.name}</span>
                          <span className="text-xs text-muted-foreground">{to.fromWarehouse.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{to.toWarehouse.name}</span>
                          <span className="text-xs text-muted-foreground">{to.toWarehouse.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(to.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          to.status === 'DRAFT' ? 'outline' :
                          to.status === 'RELEASED' ? 'secondary' :
                          to.status === 'SHIPPED' ? 'default' :
                          to.status === 'PARTIALLY_RECEIVED' ? 'default' :
                          to.status === 'RECEIVED' ? 'default' :
                          'outline'
                        }>
                          {to.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {to.lines.slice(0, 2).map((line) => (
                            <div key={line.id} className="text-xs">
                              <span className="font-medium">{line.item.sku}</span>
                              {' '}<span className="text-muted-foreground">
                                ({Number(line.orderedQty)} {line.uom})
                              </span>
                            </div>
                          ))}
                          {to.lines.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{to.lines.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {to.shippingMethod || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TransferOrderActions
                          transferOrder={to}
                          warehouses={warehouses}
                          items={items}
                        />
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
