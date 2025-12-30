import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/db"
import { DEMO_ORG_ID } from "@/lib/demo-org"
import { Plus, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function ItemsToTransferPage() {
  // Get all open/released sales orders with lines
  const salesOrders = await prisma.salesOrder.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      status: { in: ['DRAFT', 'RELEASED'] }
    },
    include: {
      lines: {
        include: {
          item: true,
          warehouse: true
        }
      }
    }
  })

  // Get all warehouses
  const warehouses = await prisma.warehouse.findMany({
    where: { organizationId: DEMO_ORG_ID, isActive: true }
  })

  // Find Atlanta warehouse (main hub)
  const atlWarehouse = warehouses.find(w => w.code === 'ATL')

  // Get inventory balances from Atlanta
  const atlBalances = atlWarehouse ? await prisma.inventoryBalance.findMany({
    where: {
      organizationId: DEMO_ORG_ID,
      warehouseId: atlWarehouse.id
    },
    include: {
      item: true
    }
  }) : []

  // Build transfer needs by destination warehouse
  type TransferNeed = {
    itemId: string
    itemSku: string
    itemName: string
    destinationWarehouseId: string
    destinationWarehouseName: string
    destinationWarehouseCode: string
    qtyNeeded: number
    qtyAvailableAtl: number
    salesOrderNumbers: string[]
    uom: string
  }

  const transferNeedsByWarehouse = new Map<string, TransferNeed[]>()

  for (const so of salesOrders) {
    for (const line of so.lines) {
      // Skip if line is for Atlanta warehouse (no transfer needed)
      if (line.warehouse.code === 'ATL') continue

      // Find existing need for this item + destination
      const warehouseNeeds = transferNeedsByWarehouse.get(line.warehouseId) || []
      const existingNeed = warehouseNeeds.find(n => n.itemId === line.itemId)

      // Get available qty from Atlanta
      const atlBalance = atlBalances.find(b => b.itemId === line.itemId)
      const qtyAvailableAtl = atlBalance ? Number(atlBalance.availableQty) : 0

      if (existingNeed) {
        // Add to existing need
        existingNeed.qtyNeeded += Number(line.quantity)
        if (!existingNeed.salesOrderNumbers.includes(so.orderNo)) {
          existingNeed.salesOrderNumbers.push(so.orderNo)
        }
      } else {
        // Create new need
        warehouseNeeds.push({
          itemId: line.itemId,
          itemSku: line.item.sku,
          itemName: line.item.name,
          destinationWarehouseId: line.warehouseId,
          destinationWarehouseName: line.warehouse.name,
          destinationWarehouseCode: line.warehouse.code,
          qtyNeeded: Number(line.quantity),
          qtyAvailableAtl,
          salesOrderNumbers: [so.orderNo],
          uom: line.item.uom
        })
      }

      transferNeedsByWarehouse.set(line.warehouseId, warehouseNeeds)
    }
  }

  // Convert to array for rendering
  const warehouseGroups = Array.from(transferNeedsByWarehouse.entries()).map(([warehouseId, needs]) => ({
    warehouseId,
    warehouseName: needs[0]?.destinationWarehouseName || '',
    warehouseCode: needs[0]?.destinationWarehouseCode || '',
    needs: needs.sort((a, b) => a.itemSku.localeCompare(b.itemSku))
  }))

  const totalItemsNeeded = Array.from(transferNeedsByWarehouse.values()).reduce((sum, needs) => sum + needs.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Items to Transfer</h1>
          <p className="text-muted-foreground mt-1">
            Items needed at island warehouses to fulfill open sales orders
          </p>
        </div>
        <Link href="/dashboard/transfer-orders">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Transfer Order
          </Button>
        </Link>
      </div>

      {!atlWarehouse ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>Atlanta warehouse (ATL) not found. Please configure warehouses first.</p>
            </div>
          </CardContent>
        </Card>
      ) : warehouseGroups.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p>No items need to be transferred. All sales orders are fulfilled or allocated to Atlanta.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Destination Warehouses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouseGroups.length}</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Items Needed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItemsNeeded}</div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Source Warehouse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{atlWarehouse.code}</div>
                <p className="text-xs text-muted-foreground mt-1">{atlWarehouse.name}</p>
              </CardContent>
            </Card>
          </div>

          {warehouseGroups.map((group) => (
            <Card key={group.warehouseId} className="rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {group.warehouseName} ({group.warehouseCode})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {group.needs.length} item{group.needs.length !== 1 ? 's' : ''} needed
                    </p>
                  </div>
                  <Link href="/dashboard/transfer-orders">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Transfer
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium">Item</th>
                        <th className="px-4 py-3 text-left font-medium">Description</th>
                        <th className="px-4 py-3 text-right font-medium">Qty Needed</th>
                        <th className="px-4 py-3 text-right font-medium">Available (ATL)</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Sales Orders</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.needs.map((need) => {
                        const canFulfill = need.qtyAvailableAtl >= need.qtyNeeded
                        const isPartial = need.qtyAvailableAtl > 0 && need.qtyAvailableAtl < need.qtyNeeded
                        const isOutOfStock = need.qtyAvailableAtl === 0

                        return (
                          <tr key={need.itemId} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="px-4 py-3 font-medium">{need.itemSku}</td>
                            <td className="px-4 py-3">{need.itemName}</td>
                            <td className="px-4 py-3 text-right font-medium">
                              {need.qtyNeeded} {need.uom}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className={
                                isOutOfStock ? 'text-destructive font-medium' :
                                isPartial ? 'text-yellow-600 dark:text-yellow-500 font-medium' :
                                'text-green-600 dark:text-green-500'
                              }>
                                {need.qtyAvailableAtl} {need.uom}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {canFulfill && (
                                <Badge variant="default" className="bg-green-600">
                                  Ready
                                </Badge>
                              )}
                              {isPartial && (
                                <Badge variant="secondary" className="bg-yellow-600">
                                  Partial
                                </Badge>
                              )}
                              {isOutOfStock && (
                                <Badge variant="destructive">
                                  Out of Stock
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {need.salesOrderNumbers.map((soNo) => (
                                  <Badge key={soNo} variant="outline" className="text-xs">
                                    {soNo}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}
