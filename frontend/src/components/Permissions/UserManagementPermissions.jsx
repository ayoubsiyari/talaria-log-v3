import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  UserCog, 
  UserMinus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Shield,
  Activity,
  Clock,
  Settings,
  Loader2
} from 'lucide-react'
import permissionService from '@/services/permissionService'
import PermissionAssignmentDialog from './PermissionAssignmentDialog'

const userManagementPermissions = {
  users: {
    title: "User Accounts",
    description: "Manage user accounts and profiles",
    icon: Users,
    permissions: [
      {
        name: "user_management.users.view",
        displayName: "View Users",
        description: "View user list and individual user details",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "user_management.users.create",
        displayName: "Create Users",
        description: "Create new user accounts",
        action: "create",
        icon: UserPlus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "user_management.users.edit",
        displayName: "Edit Users",
        description: "Modify user information and settings",
        action: "edit",
        icon: UserCog,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "user_management.users.delete",
        displayName: "Delete Users",
        description: "Remove user accounts from the system",
        action: "delete",
        icon: UserMinus,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      },
      {
        name: "user_management.users.export",
        displayName: "Export Users",
        description: "Export user data to external formats",
        action: "export",
        icon: Download,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      },
      {
        name: "user_management.users.import",
        displayName: "Import Users",
        description: "Import user data from external sources",
        action: "import",
        icon: Upload,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50 dark:bg-indigo-950"
      }
    ]
  },
  profiles: {
    title: "User Profiles",
    description: "Manage user profile information",
    icon: UserCheck,
    permissions: [
      {
        name: "user_management.profiles.view",
        displayName: "View Profiles",
        description: "View user profile information",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "user_management.profiles.edit",
        displayName: "Edit Profiles",
        description: "Modify user profile information",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      }
    ]
  },
  accounts: {
    title: "Account Management",
    description: "Manage account status and settings",
    icon: Settings,
    permissions: [
      {
        name: "user_management.accounts.activate",
        displayName: "Activate Accounts",
        description: "Activate suspended user accounts",
        action: "activate",
        icon: UserCheck,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "user_management.accounts.suspend",
        displayName: "Suspend Accounts",
        description: "Temporarily suspend user accounts",
        action: "suspend",
        icon: UserX,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      },
      {
        name: "user_management.accounts.reset_password",
        displayName: "Reset Passwords",
        description: "Reset user account passwords",
        action: "reset_password",
        icon: Shield,
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950"
      }
    ]
  },
  sessions: {
    title: "User Sessions",
    description: "Manage user login sessions",
    icon: Activity,
    permissions: [
      {
        name: "user_management.sessions.view",
        displayName: "View Sessions",
        description: "View active user sessions",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "user_management.sessions.terminate",
        displayName: "Terminate Sessions",
        description: "Force terminate user sessions",
        action: "terminate",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  }
}

export default function UserManagementPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('users')
  const [selectedPermission, setSelectedPermission] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)

  // Load permissions on component mount
  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const response = await permissionService.getPermissionsByCategory('user_management')
      if (response.success) {
        setPermissions(response.permissions || [])
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionClick = (permission) => {
    setSelectedPermission(permission)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing user accounts, profiles, and sessions
          </p>
        </div>
        <Badge variant="default" className="bg-blue-600">
          <Users className="w-4 h-4 mr-1" />
          User Management
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Accounts</TabsTrigger>
          <TabsTrigger value="profiles">User Profiles</TabsTrigger>
          <TabsTrigger value="accounts">Account Management</TabsTrigger>
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
        </TabsList>

        {loading ? (
          <TabsContent value={selectedResource} className="space-y-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              <span>Loading permissions...</span>
            </div>
          </TabsContent>
        ) : (
          Object.entries(userManagementPermissions).map(([resourceKey, resource]) => {
            // Filter permissions for this resource
            const resourcePermissions = permissions.filter(p => 
              p.resource === resourceKey && p.category === 'user_management'
            )
            
            return (
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
                  {resourcePermissions.map((permission) => {
                    // Find matching static permission for icon and styling
                    const staticPermission = resource.permissions.find(p => p.name === permission.name)
                    const Icon = staticPermission?.icon || Eye
                    const color = staticPermission?.color || "text-blue-600"
                    const bgColor = staticPermission?.bgColor || "bg-blue-50 dark:bg-blue-950"
                    const displayName = staticPermission?.displayName || `${permission.action} ${permission.resource}`
                    const description = staticPermission?.description || `Permission to ${permission.action} ${permission.resource}`
                    
                    return (
                      <Card 
                        key={permission.name}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => handlePermissionClick(permission)}
                      >
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${bgColor}`}>
                              <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <span>{displayName}</span>
                          </CardTitle>
                          <CardDescription>{description}</CardDescription>
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
            )
          })
        )}
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common user management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('users')}>
              <Users className="w-4 h-4 mr-2" />
              Manage Users
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

      {/* Permission Assignment Dialog */}
      <PermissionAssignmentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        permission={selectedPermission}
        onAssign={(permissionName, roleIds) => {
          console.log(`Assigned ${permissionName} to roles:`, roleIds)
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
}
