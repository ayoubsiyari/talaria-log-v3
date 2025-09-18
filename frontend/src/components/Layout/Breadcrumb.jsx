import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

const breadcrumbMap = {
  dashboard: { label: 'Dashboard', path: '/' },
  users: { label: 'User Management', path: '/users' },
  subscriptions: { label: 'Subscriptions', path: '/subscriptions' },
  promotions: { label: 'Promotions', path: '/promotions' },
  affiliates: { label: 'Affiliates', path: '/affiliates' },
  analytics: { label: 'Analytics', path: '/analytics' },
  settings: { label: 'Settings', path: '/settings' }
}

export default function Breadcrumb({ activeItem, onItemClick }) {
  const currentItem = breadcrumbMap[activeItem]
  
  if (!currentItem) return null

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => onItemClick('dashboard', '/')}
      >
        <Home className="w-3 h-3" />
      </Button>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground font-medium">{currentItem.label}</span>
    </nav>
  )
}


