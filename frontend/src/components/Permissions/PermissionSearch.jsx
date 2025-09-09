import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Upload,
  Activity,
  Shield,
  Users,
  FileText,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Gift,
  Database
} from 'lucide-react'
import permissionService from '@/services/permissionService'

const permissionCategories = [
  { id: 'user_management', name: 'User Management', icon: Users, color: 'text-blue-600' },
  { id: 'rbac_management', name: 'RBAC Management', icon: Shield, color: 'text-purple-600' },
  { id: 'system_admin', name: 'System Administration', icon: Settings, color: 'text-gray-600' },
  { id: 'content_management', name: 'Content Management', icon: FileText, color: 'text-green-600' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'text-indigo-600' },
  { id: 'subscription_management', name: 'Subscription Management', icon: CreditCard, color: 'text-orange-600' },
  { id: 'communication', name: 'Communication', icon: MessageSquare, color: 'text-pink-600' },
  { id: 'security', name: 'Security', icon: Shield, color: 'text-red-600' },
  { id: 'promotions', name: 'Promotions', icon: Gift, color: 'text-yellow-600' },
  { id: 'database', name: 'Database', icon: Database, color: 'text-teal-600' }
]

const permissionActions = [
  { id: 'view', name: 'View', icon: Eye, color: 'text-blue-600' },
  { id: 'create', name: 'Create', icon: Plus, color: 'text-green-600' },
  { id: 'edit', name: 'Edit', icon: Edit, color: 'text-orange-600' },
  { id: 'delete', name: 'Delete', icon: Trash2, color: 'text-red-600' },
  { id: 'export', name: 'Export', icon: Download, color: 'text-purple-600' },
  { id: 'import', name: 'Import', icon: Upload, color: 'text-indigo-600' },
  { id: 'monitor', name: 'Monitor', icon: Activity, color: 'text-cyan-600' }
]

export default function PermissionSearch({ onPermissionClick }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedActions, setSelectedActions] = useState([])
  const [filteredPermissions, setFilteredPermissions] = useState([])
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [actions, setActions] = useState([])

  // Load permissions and categories on component mount
  useEffect(() => {
    loadPermissions()
    loadCategories()
  }, [])

  useEffect(() => {
    filterPermissions()
  }, [searchTerm, selectedCategories, selectedActions, permissions])

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const response = await permissionService.getPermissions({ per_page: 100 })
      if (response.success) {
        setPermissions(response.permissions || [])
      }
    } catch (error) {
      console.error('Failed to load permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await permissionService.getPermissionCategories()
      if (response.success) {
        setCategories(response.categories || [])
        
        // Extract unique actions from permissions
        const uniqueActions = new Set()
        response.categories?.forEach(category => {
          category.resources?.forEach(resource => {
            resource.actions?.forEach(action => {
              uniqueActions.add(action.name)
            })
          })
        })
        setActions(Array.from(uniqueActions).map(action => ({ id: action, name: action })))
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const filterPermissions = () => {
    let filtered = permissions

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(permission =>
        permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(permission =>
        selectedCategories.some(category => permission.category === category)
      )
    }

    // Filter by actions
    if (selectedActions.length > 0) {
      filtered = filtered.filter(permission =>
        selectedActions.some(action => permission.action === action)
      )
    }

    setFilteredPermissions(filtered)
  }

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const handleActionToggle = (actionId) => {
    setSelectedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategories([])
    setSelectedActions([])
  }

  const getPermissionCategory = (permissionName) => {
    return permissionCategories.find(cat => permissionName.startsWith(cat.id))
  }

  const getPermissionAction = (permissionName) => {
    const action = permissionName.split('.').pop()
    return permissionActions.find(act => act.id === action)
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Search Permissions</span>
          </CardTitle>
          <CardDescription>
            Find and filter permissions by category, action, or search term
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search permissions by name, display name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <h3 className="font-semibold mb-2">Categories</h3>
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-2">
                  {categories.map((category) => {
                    const getCategoryIcon = (categoryName) => {
                      const iconMap = {
                        'user_management': Users,
                        'rbac_management': Shield,
                        'system_admin': Settings,
                        'content_management': FileText,
                        'analytics': BarChart3,
                        'subscription_management': CreditCard,
                        'communication': MessageSquare,
                        'security': Shield,
                        'promotions': Gift,
                        'database': Database
                      }
                      return iconMap[categoryName] || Shield
                    }
                    const Icon = getCategoryIcon(category.name)
                    return (
                      <div key={category.name} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedCategories.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{category.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Action Filter */}
            <div>
              <h3 className="font-semibold mb-2">Actions</h3>
              <ScrollArea className="h-32 border rounded-lg p-2">
                <div className="space-y-2">
                  {actions.map((action) => {
                    const getActionIcon = (actionName) => {
                      const iconMap = {
                        'view': Eye,
                        'create': Plus,
                        'edit': Edit,
                        'delete': Trash2,
                        'download': Download,
                        'upload': Upload,
                        'assign': Activity
                      }
                      return iconMap[actionName] || Eye
                    }
                    const Icon = getActionIcon(action.name)
                    return (
                      <div key={action.name} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedActions.includes(action.name)}
                          onCheckedChange={() => handleActionToggle(action.name)}
                        />
                        <Icon className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{action.name.charAt(0).toUpperCase() + action.name.slice(1)}</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || selectedCategories.length > 0 || selectedActions.length > 0) && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {selectedCategories.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedCategories.length} categories
                  </Badge>
                )}
                {selectedActions.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedActions.length} actions
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading permissions...</p>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No permissions found matching your criteria</p>
              <Button variant="outline" onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {filteredPermissions.map((permission) => {
                  // Get icon based on category
                  const getCategoryIcon = (category) => {
                    const iconMap = {
                      'user_management': Users,
                      'rbac_management': Shield,
                      'system_admin': Settings,
                      'content_management': FileText,
                      'analytics': BarChart3,
                      'subscription_management': CreditCard,
                      'communication': MessageSquare,
                      'security': Shield,
                      'promotions': Gift,
                      'database': Database
                    }
                    return iconMap[category] || Shield
                  }

                  // Get icon based on action
                  const getActionIcon = (action) => {
                    const iconMap = {
                      'view': Eye,
                      'create': Plus,
                      'edit': Edit,
                      'delete': Trash2,
                      'download': Download,
                      'upload': Upload,
                      'assign': Activity
                    }
                    return iconMap[action] || Eye
                  }

                  const CategoryIcon = getCategoryIcon(permission.category)
                  const ActionIcon = getActionIcon(permission.action)

                  return (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => onPermissionClick?.(permission)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="w-4 h-4 text-blue-600" />
                          <ActionIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-sm text-muted-foreground">{permission.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {permission.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {permission.action}
                        </Badge>
                        {permission.roles_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {permission.roles_count} roles
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
