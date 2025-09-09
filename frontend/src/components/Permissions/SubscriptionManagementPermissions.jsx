import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  DollarSign, 
  Receipt, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Settings,
  Shield,
  Activity
} from 'lucide-react'

const subscriptionManagementPermissions = {
  subscriptions: {
    title: "Subscription Management",
    description: "Manage user subscriptions and plans",
    icon: CreditCard,
    permissions: [
      {
        name: "subscription_management.subscriptions.view",
        displayName: "View Subscriptions",
        description: "View user subscriptions",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "subscription_management.subscriptions.create",
        displayName: "Create Subscriptions",
        description: "Create new subscriptions",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "subscription_management.subscriptions.edit",
        displayName: "Edit Subscriptions",
        description: "Edit existing subscriptions",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "subscription_management.subscriptions.cancel",
        displayName: "Cancel Subscriptions",
        description: "Cancel user subscriptions",
        action: "cancel",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  plans: {
    title: "Plan Management",
    description: "Manage subscription plans and pricing",
    icon: DollarSign,
    permissions: [
      {
        name: "subscription_management.plans.view",
        displayName: "View Plans",
        description: "View subscription plans",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "subscription_management.plans.create",
        displayName: "Create Plans",
        description: "Create new subscription plans",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "subscription_management.plans.edit",
        displayName: "Edit Plans",
        description: "Edit subscription plans",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "subscription_management.plans.delete",
        displayName: "Delete Plans",
        description: "Delete subscription plans",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  billing: {
    title: "Billing Management",
    description: "Manage billing and invoicing",
    icon: Receipt,
    permissions: [
      {
        name: "subscription_management.billing.view",
        displayName: "View Billing",
        description: "View billing information",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "subscription_management.billing.process",
        displayName: "Process Billing",
        description: "Process billing transactions",
        action: "process",
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "subscription_management.billing.export",
        displayName: "Export Billing",
        description: "Export billing reports",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  },
  payments: {
    title: "Payment Management",
    description: "Manage payment processing and refunds",
    icon: CreditCard,
    permissions: [
      {
        name: "subscription_management.payments.view",
        displayName: "View Payments",
        description: "View payment history",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "subscription_management.payments.refund",
        displayName: "Process Refunds",
        description: "Process payment refunds",
        action: "refund",
        icon: Upload,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "subscription_management.payments.export",
        displayName: "Export Payments",
        description: "Export payment reports",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  }
}

export default function SubscriptionManagementPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('subscriptions')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing subscriptions, plans, billing, and payments
          </p>
        </div>
        <Badge variant="default" className="bg-orange-600">
          <CreditCard className="w-4 h-4 mr-1" />
          Subscription Management
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {Object.entries(subscriptionManagementPermissions).map(([resourceKey, resource]) => (
          <TabsContent key={resourceKey} value={resourceKey} className="space-y-6">
            {/* Resource Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {(() => {
                    const IconComponent = resource.icon
                    return <IconComponent className="w-6 h-6" />
                  })()}
                  <span>{resource.title}</span>
                </CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
            </Card>

            {/* Permissions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resource.permissions.map((permission) => {
                const Icon = permission.icon
                return (
                  <Card 
                    key={permission.name}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handlePermissionClick(permission)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg ${permission.bgColor}`}>
                          <Icon className={`w-5 h-5 ${permission.color}`} />
                        </div>
                        <span>{permission.displayName}</span>
                      </CardTitle>
                      <CardDescription>{permission.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {permission.action}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common subscription management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('subscriptions')}>
              <CreditCard className="w-4 h-4 mr-2" />
              Manage Subscriptions
            </Button>
            <Button variant="outline" onClick={() => onNavigate('roles')}>
              <Shield className="w-4 h-4 mr-2" />
              Assign Roles
            </Button>
            <Button variant="outline" onClick={() => onNavigate('rbac')}>
              <Activity className="w-4 h-4 mr-2" />
              RBAC Overview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
