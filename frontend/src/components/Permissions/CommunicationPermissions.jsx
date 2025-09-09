import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Bell, 
  Mail, 
  Layout, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Send,
  Clock,
  Calendar,
  Settings,
  Shield,
  Activity
} from 'lucide-react'

const communicationPermissions = {
  notifications: {
    title: "Notification Management",
    description: "Send and manage system notifications",
    icon: Bell,
    permissions: [
      {
        name: "communication.notifications.view",
        displayName: "View Notifications",
        description: "View system notifications",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "communication.notifications.send",
        displayName: "Send Notifications",
        description: "Send notifications to users",
        action: "send",
        icon: Send,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "communication.notifications.schedule",
        displayName: "Schedule Notifications",
        description: "Schedule notifications for later",
        action: "schedule",
        icon: Clock,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  },
  messages: {
    title: "Message Management",
    description: "Send and manage direct messages",
    icon: MessageSquare,
    permissions: [
      {
        name: "communication.messages.view",
        displayName: "View Messages",
        description: "View message history",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "communication.messages.send",
        displayName: "Send Messages",
        description: "Send direct messages",
        action: "send",
        icon: Send,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "communication.messages.delete",
        displayName: "Delete Messages",
        description: "Delete messages",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  announcements: {
    title: "Announcement Management",
    description: "Create and manage system announcements",
    icon: Mail,
    permissions: [
      {
        name: "communication.announcements.view",
        displayName: "View Announcements",
        description: "View system announcements",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "communication.announcements.create",
        displayName: "Create Announcements",
        description: "Create new announcements",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "communication.announcements.edit",
        displayName: "Edit Announcements",
        description: "Edit existing announcements",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "communication.announcements.delete",
        displayName: "Delete Announcements",
        description: "Delete announcements",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  templates: {
    title: "Template Management",
    description: "Create and manage communication templates",
    icon: Layout,
    permissions: [
      {
        name: "communication.templates.view",
        displayName: "View Templates",
        description: "View communication templates",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "communication.templates.create",
        displayName: "Create Templates",
        description: "Create new templates",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "communication.templates.edit",
        displayName: "Edit Templates",
        description: "Edit existing templates",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "communication.templates.delete",
        displayName: "Delete Templates",
        description: "Delete templates",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  }
}

export default function CommunicationPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('notifications')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Communication Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing notifications, messages, announcements, and templates
          </p>
        </div>
        <Badge variant="default" className="bg-pink-600">
          <MessageSquare className="w-4 h-4 mr-1" />
          Communication
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {Object.entries(communicationPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common communication tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('communication')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Manage Communication
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
