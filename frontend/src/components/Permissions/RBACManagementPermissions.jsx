import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Key, 
  Target, 
  FileText, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Users,
  Activity,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

const rbacManagementPermissions = {
  roles: {
    title: "Role Management",
    description: "Create, edit, and manage system roles",
    icon: Shield,
    permissions: [
      {
        name: "rbac_management.roles.view",
        displayName: "View Roles",
        description: "View all system roles and their details",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "rbac_management.roles.create",
        displayName: "Create Roles",
        description: "Create new roles with custom permissions",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "rbac_management.roles.edit",
        displayName: "Edit Roles",
        description: "Modify existing roles and their permissions",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "rbac_management.roles.delete",
        displayName: "Delete Roles",
        description: "Remove roles from the system",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  permissions: {
    title: "Permission Management",
    description: "Manage system permissions and access rights",
    icon: Key,
    permissions: [
      {
        name: "rbac_management.permissions.view",
        displayName: "View Permissions",
        description: "View all system permissions",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "rbac_management.permissions.create",
        displayName: "Create Permissions",
        description: "Create new custom permissions",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "rbac_management.permissions.edit",
        displayName: "Edit Permissions",
        description: "Modify existing permissions",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "rbac_management.permissions.delete",
        displayName: "Delete Permissions",
        description: "Remove permissions from the system",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  assignments: {
    title: "Role Assignments",
    description: "Assign and manage user role assignments",
    icon: Target,
    permissions: [
      {
        name: "rbac_management.assignments.view",
        displayName: "View Assignments",
        description: "View all role assignments",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "rbac_management.assignments.create",
        displayName: "Create Assignments",
        description: "Assign roles to users",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "rbac_management.assignments.edit",
        displayName: "Edit Assignments",
        description: "Modify existing role assignments",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "rbac_management.assignments.delete",
        displayName: "Delete Assignments",
        description: "Remove role assignments from users",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      },
      {
        name: "rbac_management.assignments.revoke",
        displayName: "Revoke Assignments",
        description: "Immediately revoke role assignments",
        action: "revoke",
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  audit: {
    title: "RBAC Audit",
    description: "Audit and monitor RBAC system activities",
    icon: FileText,
    permissions: [
      {
        name: "rbac_management.audit.view",
        displayName: "View Audit Logs",
        description: "View RBAC audit trail and logs",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "rbac_management.audit.export",
        displayName: "Export Audit Logs",
        description: "Export audit logs for analysis",
        action: "export",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "rbac_management.audit.analyze",
        displayName: "Analyze Audit Data",
        description: "Analyze RBAC audit data and patterns",
        action: "analyze",
        icon: BarChart3,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950"
      }
    ]
  }
}

export default function RBACManagementPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('roles')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RBAC Management Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing roles, permissions, and assignments
          </p>
        </div>
        <Badge variant="default" className="bg-purple-600">
          <Shield className="w-4 h-4 mr-1" />
          RBAC Management
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        {Object.entries(rbacManagementPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common RBAC management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('roles')}>
              <Shield className="w-4 h-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="outline" onClick={() => onNavigate('role-assignments')}>
              <Target className="w-4 h-4 mr-2" />
              Role Assignments
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
