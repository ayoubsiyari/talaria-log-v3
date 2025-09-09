import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield, 
  Lock, 
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
  Activity,
  AlertTriangle,
  Key,
  Database,
  RefreshCw,
  FileText
} from 'lucide-react'

const securityPermissions = {
  access: {
    title: "Access Control",
    description: "Manage system access and authentication",
    icon: Lock,
    permissions: [
      {
        name: "security.access.view",
        displayName: "View Access Logs",
        description: "View access control logs",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "security.access.configure",
        displayName: "Configure Access",
        description: "Configure access control settings",
        action: "configure",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "security.access.monitor",
        displayName: "Monitor Access",
        description: "Monitor access patterns",
        action: "monitor",
        icon: Activity,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      }
    ]
  },
  audit: {
    title: "Security Audit",
    description: "Audit security events and compliance",
    icon: Shield,
    permissions: [
      {
        name: "security.audit.view",
        displayName: "View Audit Logs",
        description: "View security audit logs",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "security.audit.export",
        displayName: "Export Audit Logs",
        description: "Export audit logs for analysis",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "security.audit.analyze",
        displayName: "Analyze Security",
        description: "Analyze security patterns",
        action: "analyze",
        icon: Activity,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950"
      }
    ]
  },
  encryption: {
    title: "Encryption Management",
    description: "Manage data encryption and keys",
    icon: Key,
    permissions: [
      {
        name: "security.encryption.view",
        displayName: "View Encryption",
        description: "View encryption settings",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "security.encryption.configure",
        displayName: "Configure Encryption",
        description: "Configure encryption settings",
        action: "configure",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "security.encryption.rotate",
        displayName: "Rotate Keys",
        description: "Rotate encryption keys",
        action: "rotate",
        icon: RefreshCw,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      }
    ]
  },
  compliance: {
    title: "Compliance Management",
    description: "Manage security compliance and policies",
    icon: CheckCircle,
    permissions: [
      {
        name: "security.compliance.view",
        displayName: "View Compliance",
        description: "View compliance status",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "security.compliance.configure",
        displayName: "Configure Compliance",
        description: "Configure compliance policies",
        action: "configure",
        icon: Settings,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "security.compliance.report",
        displayName: "Generate Reports",
        description: "Generate compliance reports",
        action: "report",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  }
}

export default function SecurityPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('access')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing security, access control, audit, and compliance
          </p>
        </div>
        <Badge variant="default" className="bg-red-600">
          <Shield className="w-4 h-4 mr-1" />
          Security
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="audit">Security Audit</TabsTrigger>
          <TabsTrigger value="encryption">Encryption</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {Object.entries(securityPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common security tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('security')}>
              <Shield className="w-4 h-4 mr-2" />
              Security Monitor
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
