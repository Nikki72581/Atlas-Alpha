import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Search</h2>
        <p className="text-sm text-muted-foreground">
          Placeholder for global search (documents, parties, items, journals).
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Global search becomes great once everything is evented and indexed. We’re not faking it in week one.
        </CardContent>
      </Card>
    </div>
  )
}
