import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  XCircle,
  Loader2,
  Activity
} from 'lucide-react'
import permissionService from '@/services/permissionService'
import PermissionAssignmentDialog from '../components/Permissions/PermissionAssignmentDialog'
import PermissionTemplates from '../components/Permissions/PermissionTemplates'
import PermissionSearch from '../components/Permissions/PermissionSearch'

export default function PermissionTestPage() {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const results = {}

    try {
      // Test 1: Get all permissions
      console.log('🧪 Test 1: Getting all permissions...')
      const permissionsResponse = await permissionService.getPermissions({ per_page: 10 })
      results.permissions = {
        success: permissionsResponse.success,
        count: permissionsResponse.permissions?.length || 0,
        total: permissionsResponse.total || 0,
        error: null
      }
      console.log('✅ Permissions test result:', results.permissions)

      // Test 2: Get permission categories
      console.log('🧪 Test 2: Getting permission categories...')
      const categoriesResponse = await permissionService.getPermissionCategories()
      results.categories = {
        success: categoriesResponse.success,
        count: Object.keys(categoriesResponse.categories || {}).length,
        error: null
      }
      console.log('✅ Categories test result:', results.categories)

      // Test 3: Get permission templates
      console.log('🧪 Test 3: Getting permission templates...')
      const templatesResponse = await permissionService.getPermissionTemplates()
      results.templates = {
        success: templatesResponse.success,
        count: templatesResponse.templates?.length || 0,
        error: null
      }
      console.log('✅ Templates test result:', results.templates)

      // Test 4: Get roles
      console.log('🧪 Test 4: Getting roles...')
      const rolesResponse = await permissionService.getRoles()
      results.roles = {
        success: rolesResponse.success,
        count: rolesResponse.roles?.length || 0,
        error: null
      }
      console.log('✅ Roles test result:', results.roles)

      // Test 5: Get permissions by category
      console.log('🧪 Test 5: Getting permissions by category...')
      const categoryResponse = await permissionService.getPermissionsByCategory('user_management')
      results.categoryPermissions = {
        success: categoryResponse.success,
        count: categoryResponse.permissions?.length || 0,
        error: null
      }
      console.log('✅ Category permissions test result:', results.categoryPermissions)

    } catch (error) {
      console.error('❌ Test error:', error)
      results.error = error.message
    }

    setTestResults(results)
    setLoading(false)
  }

  const handlePermissionClick = (permission) => {
    setSelectedPermission(permission)
    setIsDialogOpen(true)
  }

  const getTestStatus = (testName) => {
    const result = testResults[testName]
    if (!result) return 'pending'
    if (result.error) return 'error'
    if (result.success) return 'success'
    return 'error'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Activity className="w-5 h-5 text-gray-400" />
      default:
        return <Activity className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'pending':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission Management Test</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive test of all permission management functionality
          </p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Tests'
          )}
        </Button>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>API Test Results</CardTitle>
          <CardDescription>Results of testing all permission management endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'permissions', name: 'Get Permissions', description: 'Fetch all permissions' },
              { key: 'categories', name: 'Get Categories', description: 'Fetch permission categories' },
              { key: 'templates', name: 'Get Templates', description: 'Fetch permission templates' },
              { key: 'roles', name: 'Get Roles', description: 'Fetch all roles' },
              { key: 'categoryPermissions', name: 'Category Permissions', description: 'Fetch permissions by category' }
            ].map((test) => {
              const status = getTestStatus(test.key)
              const result = testResults[test.key]
              
              return (
                <Card key={test.key} className="p-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    <div className="flex-1">
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                      {result && (
                        <div className="mt-2 space-y-1">
                          {result.count !== undefined && (
                            <p className="text-xs">Count: {result.count}</p>
                          )}
                          {result.total !== undefined && (
                            <p className="text-xs">Total: {result.total}</p>
                          )}
                          {result.error && (
                            <p className="text-xs text-red-600">Error: {result.error}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Component Tests */}
      <Tabs defaultValue="search" className="space-y-6">
        <TabsList>
          <TabsTrigger value="search">Permission Search</TabsTrigger>
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="assignment">Permission Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Search Component</CardTitle>
              <CardDescription>Test the search and filtering functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionSearch onPermissionClick={handlePermissionClick} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Templates Component</CardTitle>
              <CardDescription>Test the template management functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionTemplates 
                onApplyTemplate={(template) => {
                  console.log('Template applied:', template)
                  alert(`Template "${template.name}" applied successfully!`)
                }} 
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Assignment Test</CardTitle>
              <CardDescription>Test permission assignment functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Click on any permission in the search tab above to test the assignment dialog.
                </p>
                <div className="p-4 border rounded-lg bg-muted">
                  <h4 className="font-medium mb-2">Test Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Go to the "Permission Search" tab</li>
                    <li>Click on any permission card</li>
                    <li>Test the assignment dialog functionality</li>
                    <li>Try assigning permissions to different roles</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Permission Assignment Dialog */}
      <PermissionAssignmentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        permission={selectedPermission}
        onAssign={(permissionName, roleIds) => {
          console.log(`Assigned ${permissionName} to roles:`, roleIds)
          alert(`Permission "${permissionName}" assigned to ${roleIds.length} role(s) successfully!`)
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
}






