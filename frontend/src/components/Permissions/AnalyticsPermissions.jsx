import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Activity, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Share2,
  Clock,
  Calendar,
  Filter,
  Search,
  Settings,
  Shield,
  FileText
} from 'lucide-react'

const analyticsPermissions = {
  dashboards: {
    title: "Dashboard Management",
    description: "Create and manage analytics dashboards",
    icon: BarChart3,
    permissions: [
      {
        name: "analytics.dashboards.view",
        displayName: "View Dashboards",
        description: "View analytics dashboards",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "analytics.dashboards.create",
        displayName: "Create Dashboards",
        description: "Create new analytics dashboards",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "analytics.dashboards.edit",
        displayName: "Edit Dashboards",
        description: "Edit existing dashboards",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "analytics.dashboards.delete",
        displayName: "Delete Dashboards",
        description: "Delete analytics dashboards",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  reports: {
    title: "Report Management",
    description: "Generate and manage analytics reports",
    icon: FileText,
    permissions: [
      {
        name: "analytics.reports.view",
        displayName: "View Reports",
        description: "View analytics reports",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "analytics.reports.generate",
        displayName: "Generate Reports",
        description: "Generate new analytics reports",
        action: "generate",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "analytics.reports.export",
        displayName: "Export Reports",
        description: "Export reports to various formats",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "analytics.reports.schedule",
        displayName: "Schedule Reports",
        description: "Schedule automated report generation",
        action: "schedule",
        icon: Clock,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950"
      }
    ]
  },
  metrics: {
    title: "Metrics Management",
    description: "Configure and manage analytics metrics",
    icon: TrendingUp,
    permissions: [
      {
        name: "analytics.metrics.view",
        displayName: "View Metrics",
        description: "View analytics metrics",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "analytics.metrics.configure",
        displayName: "Configure Metrics",
        description: "Configure analytics metrics",
        action: "configure",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "analytics.metrics.create",
        displayName: "Create Metrics",
        description: "Create custom metrics",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      }
    ]
  },
  data: {
    title: "Data Management",
    description: "Export and share analytics data",
    icon: Activity,
    permissions: [
      {
        name: "analytics.data.export",
        displayName: "Export Data",
        description: "Export analytics data",
        action: "export",
        icon: Download,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "analytics.data.share",
        displayName: "Share Data",
        description: "Share analytics data with others",
        action: "share",
        icon: Share2,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "analytics.data.view",
        displayName: "View Data",
        description: "View raw analytics data",
        action: "view",
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  }
}

export default function AnalyticsPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('dashboards')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing analytics, reports, metrics, and dashboards
          </p>
        </div>
        <Badge variant="default" className="bg-indigo-600">
          <BarChart3 className="w-4 h-4 mr-1" />
          Analytics
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {Object.entries(analyticsPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common analytics tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
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
