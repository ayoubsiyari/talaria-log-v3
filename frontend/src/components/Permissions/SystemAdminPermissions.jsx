import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Server, 
  Database, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Upload,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Shield,
  Activity,
  HardDrive,
  Archive,
  Zap
} from 'lucide-react'

const systemAdminPermissions = {
  system: {
    title: "System Status",
    description: "Monitor and manage system status and health",
    icon: Server,
    permissions: [
      {
        name: "system_admin.system.view",
        displayName: "View System Status",
        description: "View system status and health metrics",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.system.configure",
        displayName: "Configure System",
        description: "Configure system settings and parameters",
        action: "configure",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "system_admin.system.monitor",
        displayName: "Monitor System",
        description: "Monitor system performance and resources",
        action: "monitor",
        icon: Activity,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      }
    ]
  },
  settings: {
    title: "System Settings",
    description: "Manage system configuration and settings",
    icon: Settings,
    permissions: [
      {
        name: "system_admin.settings.view",
        displayName: "View Settings",
        description: "View system configuration settings",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.settings.edit",
        displayName: "Edit Settings",
        description: "Modify system configuration settings",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "system_admin.settings.reset",
        displayName: "Reset Settings",
        description: "Reset system settings to defaults",
        action: "reset",
        icon: RefreshCw,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  backup: {
    title: "Backup Management",
    description: "Create and manage system backups",
    icon: Database,
    permissions: [
      {
        name: "system_admin.backup.create",
        displayName: "Create Backup",
        description: "Create new system backups",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "system_admin.backup.restore",
        displayName: "Restore Backup",
        description: "Restore system from backup",
        action: "restore",
        icon: Upload,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.backup.view",
        displayName: "View Backups",
        description: "View available system backups",
        action: "view",
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "system_admin.backup.delete",
        displayName: "Delete Backup",
        description: "Delete system backups",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  logs: {
    title: "System Logs",
    description: "Access and manage system logs",
    icon: FileText,
    permissions: [
      {
        name: "system_admin.logs.view",
        displayName: "View Logs",
        description: "View system logs and audit trails",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.logs.export",
        displayName: "Export Logs",
        description: "Export system logs for analysis",
        action: "export",
        icon: Download,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "system_admin.logs.clear",
        displayName: "Clear Logs",
        description: "Clear system logs",
        action: "clear",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  maintenance: {
    title: "System Maintenance",
    description: "Schedule and execute system maintenance",
    icon: Wrench,
    permissions: [
      {
        name: "system_admin.maintenance.schedule",
        displayName: "Schedule Maintenance",
        description: "Schedule system maintenance tasks",
        action: "schedule",
        icon: Clock,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.maintenance.execute",
        displayName: "Execute Maintenance",
        description: "Execute system maintenance tasks",
        action: "execute",
        icon: Zap,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "system_admin.maintenance.view",
        displayName: "View Maintenance",
        description: "View maintenance schedules and history",
        action: "view",
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  },
  updates: {
    title: "System Updates",
    description: "Manage system updates and patches",
    icon: RefreshCw,
    permissions: [
      {
        name: "system_admin.updates.view",
        displayName: "View Updates",
        description: "View available system updates",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "system_admin.updates.install",
        displayName: "Install Updates",
        description: "Install system updates and patches",
        action: "install",
        icon: Download,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "system_admin.updates.rollback",
        displayName: "Rollback Updates",
        description: "Rollback system updates if needed",
        action: "rollback",
        icon: RefreshCw,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  }
}

export default function SystemAdminPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('system')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Administration Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing system settings, backup, logs, and maintenance
          </p>
        </div>
        <Badge variant="default" className="bg-gray-600">
          <Settings className="w-4 h-4 mr-1" />
          System Administration
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
        </TabsList>

        {Object.entries(systemAdminPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common system administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('settings')}>
              <Settings className="w-4 h-4 mr-2" />
              System Settings
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
