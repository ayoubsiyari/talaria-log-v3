import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Gift, 
  Database,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  Activity
} from 'lucide-react'
import permissionService from '@/services/permissionService'

const permissionTemplates = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    permissions: [
      'user_management.*',
      'rbac_management.*',
      'system_admin.*',
      'content_management.*',
      'analytics.*',
      'subscription_management.*',
      'communication.*',
      'security.*',
      'promotions.*',
      'database.*'
    ],
    roles: ['super_admin']
  },
  {
    id: 'admin',
    name: 'Administrator',
    description: 'General administrative access with most permissions',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    permissions: [
      'user_management.users.view',
      'user_management.users.create',
      'user_management.users.edit',
      'user_management.profiles.view',
      'user_management.profiles.edit',
      'rbac_management.roles.view',
      'rbac_management.assignments.view',
      'rbac_management.assignments.create',
      'content_management.*',
      'analytics.*',
      'subscription_management.*',
      'communication.*',
      'promotions.*'
    ],
    roles: ['admin']
  },
  {
    id: 'user_manager',
    name: 'User Manager',
    description: 'Focused on user management and basic admin tasks',
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    permissions: [
      'user_management.users.view',
      'user_management.users.create',
      'user_management.users.edit',
      'user_management.profiles.view',
      'user_management.profiles.edit',
      'user_management.accounts.activate',
      'user_management.accounts.suspend',
      'user_management.accounts.reset_password',
      'rbac_management.assignments.view',
      'rbac_management.assignments.create',
      'analytics.reports.view',
      'analytics.data.view'
    ],
    roles: ['user_manager']
  },
  {
    id: 'content_manager',
    name: 'Content Manager',
    description: 'Manage content, files, and media',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    permissions: [
      'content_management.content.view',
      'content_management.content.create',
      'content_management.content.edit',
      'content_management.content.publish',
      'content_management.files.upload',
      'content_management.files.download',
      'content_management.files.view',
      'content_management.media.manage',
      'content_management.templates.view',
      'content_management.templates.create',
      'content_management.templates.edit',
      'analytics.reports.view',
      'rbac_management.assignments.view'
    ],
    roles: ['content_manager']
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Access to analytics and reporting features',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    permissions: [
      'analytics.dashboards.view',
      'analytics.reports.view',
      'analytics.reports.generate',
      'analytics.reports.export',
      'analytics.metrics.view',
      'analytics.data.view',
      'analytics.data.export',
      'user_management.users.view',
      'content_management.content.view'
    ],
    roles: ['analyst']
  },
  {
    id: 'support',
    name: 'Support Agent',
    description: 'Customer support with limited access',
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    permissions: [
      'user_management.users.view',
      'user_management.profiles.view',
      'user_management.accounts.reset_password',
      'communication.messages.view',
      'communication.messages.send',
      'communication.announcements.view',
      'subscription_management.subscriptions.view',
      'analytics.reports.view'
    ],
    roles: ['support']
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to basic information',
    icon: Eye,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    permissions: [
      'user_management.users.view',
      'content_management.content.view',
      'analytics.reports.view',
      'communication.announcements.view'
    ],
    roles: ['viewer']
  }
]

export default function PermissionTemplates({ onApplyTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  // Load templates on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setTemplatesLoading(true)
    try {
      const response = await permissionService.getPermissionTemplates()
      if (response.success) {
        setTemplates(response.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template)
    setIsDialogOpen(true)
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return
    
    setLoading(true)
    try {
      await permissionService.applyPermissionTemplate(selectedTemplate.id)
      if (onApplyTemplate) {
        onApplyTemplate(selectedTemplate)
      }
      setIsDialogOpen(false)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to apply template:', error)
      alert('Failed to apply template. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission Templates</h1>
          <p className="text-muted-foreground mt-2">
            Pre-configured permission sets for common role combinations
          </p>
        </div>
        <Badge variant="default" className="bg-purple-600">
          <Shield className="w-4 h-4 mr-1" />
          Templates
        </Badge>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templatesLoading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No templates available</p>
          </div>
        ) : (
          templates.map((template) => {
            // Map template to icon based on name
            const getIcon = (templateName) => {
              const iconMap = {
                'super_admin': Shield,
                'admin': Shield,
                'user_manager': Users,
                'content_manager': FileText,
                'analyst': BarChart3,
                'support_agent': MessageSquare,
                'viewer': Eye
              }
              return iconMap[templateName] || Shield
            }
            
            const Icon = getIcon(template.id)
            return (
            <Card 
              key={template.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTemplateClick(template)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span>{template.name}</span>
                </CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Permissions:</span>
                    <Badge variant="outline">{template.permissions.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Roles:</span>
                    <div className="flex space-x-1">
                      {template.roles.map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" disabled={loading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {loading ? 'Applying...' : 'Apply Template'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })
        )}
      </div>

      {/* Template Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedTemplate && (
                <div className={`p-2 rounded-lg ${selectedTemplate.bgColor}`}>
                  {(() => {
                    const IconComponent = selectedTemplate.icon
                    return <IconComponent className={`w-5 h-5 ${selectedTemplate.color}`} />
                  })()}
                </div>
              )}
              <span>{selectedTemplate?.name} Template</span>
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Template Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Permissions:</span>
                      <Badge variant="outline">{selectedTemplate.permissions.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Roles:</span>
                      <Badge variant="outline">{selectedTemplate.roles.length}</Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Target Roles</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions List */}
              <div>
                <h3 className="font-semibold mb-3">Included Permissions</h3>
                <ScrollArea className="h-64 border rounded-lg p-4">
                  <div className="space-y-2">
                    {selectedTemplate.permissions.map((permission, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 rounded-lg bg-background border">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <code className="text-sm font-mono">{permission}</code>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyTemplate} className="min-w-[120px]">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
