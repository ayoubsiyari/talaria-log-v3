import { 
  Users, 
  CreditCard, 
  FileText, 
  Package, 
  Search, 
  Inbox,
  UserPlus,
  Plus,
  ShoppingBag,
  BarChart3,
  AlertCircle,
  Target,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Base Empty State Component
function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel = "Get Started",
  className = "" 
}) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {Icon && <Icon className="w-8 h-8 text-muted-foreground" />}
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {description}
        </p>
        {action && (
          <Button onClick={action} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Specific Empty States
export function EmptyUsers({ onAddUser }) {
  return (
    <EmptyState
      icon={Users}
      title="No users yet"
      description="Start by adding your first user to the platform. Users can be customers, team members, or administrators."
      action={onAddUser}
      actionLabel="Add First User"
    />
  );
}

export function EmptySubscriptions({ onCreatePlan }) {
  return (
    <EmptyState
      icon={CreditCard}
      title="No active subscriptions"
      description="Create subscription plans to start accepting recurring payments from your customers."
      action={onCreatePlan}
      actionLabel="Create Subscription Plan"
    />
  );
}

export function EmptyTransactions() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="No transactions yet"
      description="Transactions will appear here once customers start making purchases or subscriptions."
    />
  );
}

export function EmptyAnalytics() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No data available"
      description="Analytics data will be displayed here once you have enough activity on your platform."
    />
  );
}

export function EmptySearch({ searchTerm }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any results for "${searchTerm}". Try adjusting your search terms or filters.`}
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Inbox}
      title="All caught up!"
      description="You have no new notifications. We'll let you know when something important happens."
    />
  );
}

export function EmptyDocuments({ onUpload }) {
  return (
    <EmptyState
      icon={FileText}
      title="No documents uploaded"
      description="Upload documents to keep important files organized and accessible in one place."
      action={onUpload}
      actionLabel="Upload Document"
    />
  );
}

export function EmptyProducts({ onAddProduct }) {
  return (
    <EmptyState
      icon={Package}
      title="No products added"
      description="Add your first product to start selling. You can add physical or digital products."
      action={onAddProduct}
      actionLabel="Add Product"
    />
  );
}

export function EmptyAffiliates({ onInvite }) {
  return (
    <EmptyState
      icon={Target}
      title="No affiliate partners"
      description="Invite partners to join your affiliate program and start earning commissions."
      action={onInvite}
      actionLabel="Invite Partner"
    />
  );
}

export function EmptyPromotions({ onCreate }) {
  return (
    <EmptyState
      icon={Tag}
      title="No active promotions"
      description="Create promotions and discount codes to attract more customers and boost sales."
      action={onCreate}
      actionLabel="Create Promotion"
    />
  );
}

// Error State
export function ErrorState({ onRetry, message = "Something went wrong" }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Error loading data</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline">
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Generic Empty State with Custom Content
export function CustomEmptyState({ children, className = "" }) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        {children}
      </CardContent>
    </Card>
  );
}

export default {
  EmptyState,
  EmptyUsers,
  EmptySubscriptions,
  EmptyTransactions,
  EmptyAnalytics,
  EmptySearch,
  EmptyNotifications,
  EmptyDocuments,
  EmptyProducts,
  EmptyAffiliates,
  EmptyPromotions,
  ErrorState,
  CustomEmptyState
};


