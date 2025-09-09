import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Plus } from 'lucide-react'

export default function UserJournals({ onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trading Journals</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your trading activities
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Trade Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Journal</CardTitle>
          <CardDescription>
            Your trading journal entries and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No trades yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your trading performance by adding your first trade entry.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add First Trade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

