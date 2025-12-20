import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Organization settings (placeholder).</p>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Not wired yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Multi-tenant + RBAC + config manifests land here next. This starter keeps the scaffolding clean.
        </CardContent>
      </Card>
    </div>
  )
}
