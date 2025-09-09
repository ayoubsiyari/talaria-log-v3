import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Shield, 
  Settings, 
  FileText, 
  BarChart3, 
  CreditCard, 
  MessageSquare, 
  DollarSign, 
  Lock, 
  Database,
  Eye,
  Edit,
  Plus,
  Trash2,
  Activity,
  Target,
  Gift,
  Sparkles
} from 'lucide-react'

const permissionCategories = [
  {
    id: 'user_management',
    title: 'User Management',
    description: 'Manage user accounts, profiles, and sessions',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    resources: ['users', 'profiles', 'accounts', 'sessions'],
    permissions: 12,
    route: 'user-management-permissions'
  },
  {
    id: 'rbac_management',
    title: 'RBAC Management',
    description: 'Manage roles, permissions, and assignments',
    icon: Shield,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    resources: ['roles', 'permissions', 'assignments', 'audit'],
    permissions: 15,
    route: 'rbac-management-permissions'
  },
  {
    id: 'system_admin',
    title: 'System Administration',
    description: 'Manage system settings, backup, logs, and maintenance',
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    resources: ['system', 'settings', 'backup', 'logs', 'maintenance', 'updates'],
    permissions: 18,
    route: 'system-admin-permissions'
  },
  {
    id: 'content_management',
    title: 'Content Management',
    description: 'Manage content, files, media, and templates',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950',
    resources: ['content', 'files', 'media', 'templates'],
    permissions: 16,
    route: 'content-management-permissions'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Manage analytics, reports, metrics, and data',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950',
    resources: ['dashboards', 'reports', 'metrics', 'data'],
    permissions: 14,
    route: 'analytics-permissions'
  },
  {
    id: 'subscription_management',
    title: 'Subscription Management',
    description: 'Manage subscriptions, plans, billing, and payments',
    icon: CreditCard,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950',
    resources: ['subscriptions', 'plans', 'billing', 'payments'],
    permissions: 14,
    route: 'subscription-management-permissions'
  },
  {
    id: 'communication',
    title: 'Communication',
    description: 'Manage notifications, messages, announcements, and templates',
    icon: MessageSquare,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-950',
    resources: ['notifications', 'messages', 'announcements', 'templates'],
    permissions: 15,
    route: 'communication-permissions'
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Manage security, access control, audit, and compliance',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950',
    resources: ['access', 'audit', 'encryption', 'compliance'],
    permissions: 12,
    route: 'security-permissions'
  },
  {
    id: 'promotions',
    title: 'Promotions',
    description: 'Manage promotional campaigns, offers, scheduling, and analytics',
    icon: Gift,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    resources: ['campaigns', 'offers', 'scheduling', 'analytics'],
    permissions: 15,
    route: 'promotions-permissions'
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Manage database data, backups, maintenance, and schema',
    icon: Database,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950',
    resources: ['data', 'backup', 'maintenance', 'schema'],
    permissions: 14,
    route: 'database-permissions'
  }
]

export default function PermissionsOverview({ onNavigate }) {
  const [selectedCategory, setSelectedCategory] = useState(null)

  const handleCategoryClick = (category) => {
    onNavigate(category.route)
  }

  const getTotalPermissions = () => {
    return permissionCategories.reduce((total, category) => total + category.permissions, 0)
  }

  const getTotalResources = () => {
    return permissionCategories.reduce((total, category) => total + category.resources.length, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permissions Overview</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive permission management organized by categories and resources
          </p>
        </div>
        <Badge variant="default" className="bg-primary">
          <Shield className="w-4 h-4 mr-1" />
          {getTotalPermissions()} Total Permissions
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Categories</p>
                <p className="text-2xl font-bold">{permissionCategories.length}</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Resources</p>
                <p className="text-2xl font-bold">{getTotalResources()}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Permissions</p>
                <p className="text-2xl font-bold">{getTotalPermissions()}</p>
              </div>
              <Lock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Permission Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {permissionCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCategoryClick(category)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <Icon className={`w-6 h-6 ${category.color}`} />
                  </div>
                  <span>{category.title}</span>
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Resources */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Resources:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.resources.map((resource) => (
                        <Badge key={resource} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {category.permissions} permissions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {category.resources.length} resources
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common permission management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button onClick={() => onNavigate('permission-templates')}>
              <Sparkles className="w-4 h-4 mr-2" />
              Permission Templates
            </Button>
            <Button variant="outline" onClick={() => onNavigate('roles')}>
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
            <Button variant="outline" onClick={() => onNavigate('permissions')}>
              <Lock className="w-4 h-4 mr-2" />
              All Permissions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
