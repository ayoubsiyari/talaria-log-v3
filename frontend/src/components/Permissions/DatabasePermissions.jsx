import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  HardDrive, 
  Archive, 
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
  RefreshCw
} from 'lucide-react'

const databasePermissions = {
  data: {
    title: "Data Management",
    description: "Manage database data and records",
    icon: Database,
    permissions: [
      {
        name: "database.data.view",
        displayName: "View Data",
        description: "View database records",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "database.data.create",
        displayName: "Create Data",
        description: "Create new database records",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "database.data.edit",
        displayName: "Edit Data",
        description: "Edit database records",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "database.data.delete",
        displayName: "Delete Data",
        description: "Delete database records",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  backup: {
    title: "Backup Management",
    description: "Manage database backups and recovery",
    icon: Archive,
    permissions: [
      {
        name: "database.backup.create",
        displayName: "Create Backup",
        description: "Create database backups",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "database.backup.restore",
        displayName: "Restore Backup",
        description: "Restore from backup",
        action: "restore",
        icon: Upload,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "database.backup.view",
        displayName: "View Backups",
        description: "View backup history",
        action: "view",
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "database.backup.delete",
        displayName: "Delete Backups",
        description: "Delete old backups",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  maintenance: {
    title: "Database Maintenance",
    description: "Perform database maintenance tasks",
    icon: HardDrive,
    permissions: [
      {
        name: "database.maintenance.optimize",
        displayName: "Optimize Database",
        description: "Optimize database performance",
        action: "optimize",
        icon: RefreshCw,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "database.maintenance.cleanup",
        displayName: "Cleanup Database",
        description: "Clean up old data",
        action: "cleanup",
        icon: Trash2,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "database.maintenance.monitor",
        displayName: "Monitor Database",
        description: "Monitor database health",
        action: "monitor",
        icon: Activity,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      }
    ]
  },
  schema: {
    title: "Schema Management",
    description: "Manage database schema and structure",
    icon: Settings,
    permissions: [
      {
        name: "database.schema.view",
        displayName: "View Schema",
        description: "View database schema",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "database.schema.modify",
        displayName: "Modify Schema",
        description: "Modify database schema",
        action: "modify",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "database.schema.migrate",
        displayName: "Run Migrations",
        description: "Execute database migrations",
        action: "migrate",
        icon: RefreshCw,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      }
    ]
  }
}

export default function DatabasePermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('data')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Database Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing database data, backups, maintenance, and schema
          </p>
        </div>
        <Badge variant="default" className="bg-teal-600">
          <Database className="w-4 h-4 mr-1" />
          Database
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        {Object.entries(databasePermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common database management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('database')}>
              <Database className="w-4 h-4 mr-2" />
              Database Monitor
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
