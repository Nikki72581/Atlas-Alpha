import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Ship, Package, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function InventoryInTransitPage() {
  // Get all inventory balances with in-transit quantity > 0
  const inTransitBalances = await prisma.inventoryBalance.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      inTransitQty: { gt: 0 }
    },
    include: {
      item: true,
      warehouse: true
    },
    orderBy: [
      { warehouseId: 'asc' },
      { item: { sku: 'asc' } }
    ]
  })

  // Get all shipped but not received transfer orders
  const inTransitTransferOrders = await prisma.transferOrder.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      status: { in: ['SHIPPED', 'PARTIALLY_RECEIVED'] }
    },
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      container: true,
      lines: {
        include: {
          item: true
        }
      }
    },
    orderBy: { actualShipDate: 'desc' }
  })

  // Calculate totals
  const totalInTransitValue = inTransitBalances.reduce((sum, balance) => {
    const value = Number(balance.inTransitQty) * Number(balance.unitCost || 0)
    return sum + value
  }, 0)

  const totalInTransitQty = inTransitBalances.reduce((sum, balance) => {
    return sum + Number(balance.inTransitQty)
  }, 0)

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory in Transit</h1>
          <p className="text-muted-foreground mt-1">
            Track inventory currently moving between warehouses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitTransferOrders.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items in Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitBalances.length}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quantity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalInTransitQty)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInTransitValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Orders in Transit */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Transfer Orders in Transit</CardTitle>
        </CardHeader>
        <CardContent>
          {inTransitTransferOrders.length === 0 ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <AlertCircle className="h-5 w-5" />
              <p>No transfer orders currently in transit</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">TO #</th>
                    <th className="px-4 py-3 text-left font-medium">Route</th>
                    <th className="px-4 py-3 text-left font-medium">Container</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Shipped</th>
                    <th className="px-4 py-3 text-left font-medium">Expected</th>
                    <th className="px-4 py-3 text-left font-medium">Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {inTransitTransferOrders.map((to) => (
                    <tr key={to.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/transfer-orders`}
                          className="font-medium hover:underline"
                        >
                          {to.transferOrderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs">
                            {to.fromWarehouse.code} → {to.toWarehouse.code}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {to.container ? (
                          <Link
                            href={`/dashboard/containers/${to.container.id}`}
                            className="text-xs hover:underline"
                          >
                            <Ship className="h-3 w-3 inline mr-1" />
                            {to.container.containerNumber}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={to.status === 'SHIPPED' ? 'default' : 'secondary'}>
                          {to.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(to.actualShipDate)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(to.expectedReceiptDate)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-Transit Balances by Warehouse */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>In-Transit Balances by Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          {inTransitBalances.length === 0 ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
              <AlertCircle className="h-5 w-5" />
              <p>No inventory currently in transit</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Warehouse</th>
                    <th className="px-4 py-3 text-left font-medium">Item</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-right font-medium">In Transit Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Unit Cost</th>
                    <th className="px-4 py-3 text-right font-medium">Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {inTransitBalances.map((balance) => {
                    const itemValue = Number(balance.inTransitQty) * Number(balance.unitCost || 0)

                    return (
                      <tr key={balance.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{balance.warehouse.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {balance.warehouse.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium">{balance.item.sku}</td>
                        <td className="px-4 py-3">{balance.item.name}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {Number(balance.inTransitQty)} {balance.item.uom}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatCurrency(Number(balance.unitCost || 0))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(itemValue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
