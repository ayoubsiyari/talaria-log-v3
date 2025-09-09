import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default function UserAnalytics({ onNavigate }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Detailed insights into your trading performance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Analytics</CardTitle>
          <CardDescription>
            Performance metrics and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Analytics coming soon</h3>
              <p className="text-muted-foreground">
                Detailed analytics and performance insights will be available once you start trading.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

