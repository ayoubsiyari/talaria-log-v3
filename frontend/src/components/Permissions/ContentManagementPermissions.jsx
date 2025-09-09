import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  File, 
  Image, 
  Layout, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  Lock,
  Unlock,
  Search,
  Filter,
  Archive,
  Share2,
  Shield,
  Activity
} from 'lucide-react'

const contentManagementPermissions = {
  content: {
    title: "Content Management",
    description: "Create, edit, and manage content",
    icon: FileText,
    permissions: [
      {
        name: "content_management.content.view",
        displayName: "View Content",
        description: "View content and articles",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "content_management.content.create",
        displayName: "Create Content",
        description: "Create new content and articles",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "content_management.content.edit",
        displayName: "Edit Content",
        description: "Edit existing content and articles",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "content_management.content.delete",
        displayName: "Delete Content",
        description: "Delete content and articles",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      },
      {
        name: "content_management.content.publish",
        displayName: "Publish Content",
        description: "Publish content to make it public",
        action: "publish",
        icon: Globe,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "content_management.content.moderate",
        displayName: "Moderate Content",
        description: "Moderate and approve content",
        action: "moderate",
        icon: CheckCircle,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  },
  files: {
    title: "File Management",
    description: "Upload and manage files",
    icon: File,
    permissions: [
      {
        name: "content_management.files.upload",
        displayName: "Upload Files",
        description: "Upload files to the system",
        action: "upload",
        icon: Upload,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "content_management.files.download",
        displayName: "Download Files",
        description: "Download files from the system",
        action: "download",
        icon: Download,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "content_management.files.delete",
        displayName: "Delete Files",
        description: "Delete files from the system",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      },
      {
        name: "content_management.files.view",
        displayName: "View Files",
        description: "View file listings and details",
        action: "view",
        icon: Eye,
        color: "text-purple-600",
        bgColor: "bg-purple-50 dark:bg-purple-950"
      }
    ]
  },
  media: {
    title: "Media Management",
    description: "Manage images, videos, and other media",
    icon: Image,
    permissions: [
      {
        name: "content_management.media.manage",
        displayName: "Manage Media",
        description: "Manage all media files",
        action: "manage",
        icon: Image,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "content_management.media.upload",
        displayName: "Upload Media",
        description: "Upload media files",
        action: "upload",
        icon: Upload,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "content_management.media.edit",
        displayName: "Edit Media",
        description: "Edit media metadata and properties",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "content_management.media.delete",
        displayName: "Delete Media",
        description: "Delete media files",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  },
  templates: {
    title: "Template Management",
    description: "Create and manage content templates",
    icon: Layout,
    permissions: [
      {
        name: "content_management.templates.view",
        displayName: "View Templates",
        description: "View available templates",
        action: "view",
        icon: Eye,
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950"
      },
      {
        name: "content_management.templates.create",
        displayName: "Create Templates",
        description: "Create new content templates",
        action: "create",
        icon: Plus,
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950"
      },
      {
        name: "content_management.templates.edit",
        displayName: "Edit Templates",
        description: "Edit existing templates",
        action: "edit",
        icon: Edit,
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950"
      },
      {
        name: "content_management.templates.delete",
        displayName: "Delete Templates",
        description: "Delete content templates",
        action: "delete",
        icon: Trash2,
        color: "text-red-600",
        bgColor: "bg-red-50 dark:bg-red-950"
      }
    ]
  }
}

export default function ContentManagementPermissions({ onNavigate }) {
  const [selectedResource, setSelectedResource] = useState('content')

  const handlePermissionClick = (permission) => {
    // Navigate to role management to assign this permission
    onNavigate('roles')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Management Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Granular permissions for managing content, files, media, and templates
          </p>
        </div>
        <Badge variant="default" className="bg-green-600">
          <FileText className="w-4 h-4 mr-1" />
          Content Management
        </Badge>
      </div>

      {/* Resource Tabs */}
      <Tabs value={selectedResource} onValueChange={setSelectedResource} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {Object.entries(contentManagementPermissions).map(([resourceKey, resource]) => (
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
          <CardDescription>Common content management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('content')}>
              <FileText className="w-4 h-4 mr-2" />
              Manage Content
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
