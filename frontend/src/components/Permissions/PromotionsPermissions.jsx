import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Gift, 
  Tag, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Shield,
  Activity,
  BarChart3
} from 'lucide-react'

const promotionsPermissions = {
  campaigns: {
    title: "Campaign Management",
    description: "Create and manage promotional campaigns",
    icon: Gift,
    permissions: [
      {
        name: "promotions.campaigns.view",
        displayName: "View Campaigns",
        description: "View promotional campaigns",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "promotions.campaigns.create",
        displayName: "Create Campaigns",
        description: "Create new promotional campaigns",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "promotions.campaigns.edit",
        displayName: "Edit Campaigns",
        description: "Edit existing campaigns",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "promotions.campaigns.delete",
        displayName: "Delete Campaigns",
        description: "Delete promotional campaigns",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  offers: {
    title: "Offer Management",
    description: "Manage promotional offers and discounts",
    icon: Tag,
    permissions: [
      {
        name: "promotions.offers.view",
        displayName: "View Offers",
        description: "View promotional offers",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "promotions.offers.create",
        displayName: "Create Offers",
        description: "Create new promotional offers",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "promotions.offers.edit",
        displayName: "Edit Offers",
        description: "Edit existing offers",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "promotions.offers.delete",
        displayName: "Delete Offers",
        description: "Delete promotional offers",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  scheduling: {
    title: "Schedule Management",
    description: "Schedule and manage promotion timing",
    icon: Calendar,
    permissions: [
      {
        name: "promotions.scheduling.view",
        displayName: "View Schedules",
        description: "View promotion schedules",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "promotions.scheduling.create",
        displayName: "Create Schedules",
        description: "Create promotion schedules",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "promotions.scheduling.edit",
        displayName: "Edit Schedules",
        description: "Edit promotion schedules",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      }
    ]
  },
  analytics: {
    title: "Promotion Analytics",
    description: "Analyze promotion performance and metrics",
    icon: BarChart3,
    permissions: [
      {
        name: "promotions.analytics.view",
        displayName: "View Analytics",
        description: "View promotion analytics",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "promotions.analytics.export",
        displayName: "Export Analytics",
        description: "Export promotion reports",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "promotions.analytics.analyze",
        displayName: "Analyze Performance",
        description: "Analyze promotion performance",
        action: "analyze",
        icon: Activity,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950"
      }
    ]
  }
}

export default function PromotionsPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('campaigns')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotions Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing promotional campaigns, offers, scheduling, and analytics
          </p>
        </div>
        <Badge variant="default" className="bg-yellow-600">
          <Gift className="w-4 h-4 mr-1" />
          Promotions
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {Object.entries(promotionsPermissions).map(([resourceKey, resource]) => (
          <TabsContent key={resourceKey} value={resourceKey} className="space-y-6">
            {/* Resource Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <resource.icon className="w-6 h-6" />
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
          <CardDescription>Common promotion management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('promotions')}>
              <Gift className="w-4 h-4 mr-2" />
              Manage Promotions
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

