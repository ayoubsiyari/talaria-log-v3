import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions.jsx';
import { PermissionGate, AdminGate, SuperAdminGate, RoleGate } from '../PermissionGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, XCircle, Shield, Users, Settings, Eye } from 'lucide-react';

const RBACTest = () => {
  const { 
    permissions, 
    roles, 
    loading, 
    error, 
    hasPermission, 
    hasRole, 
    isAdmin, 
    isSuperAdmin,
    refreshPermissions 
  } = usePermissions();
  
  const [testResults, setTestResults] = useState([]);
  
  useEffect(() => {
    runTests();
  }, [permissions, roles]);
  
  const runTests = () => {
    const tests = [
      {
        name: 'Permissions Hook Loading',
        test: () => !loading,
        description: 'usePermissions hook should load without errors'
      },
      {
        name: 'Permissions Data Available',
        test: () => Array.isArray(permissions) && permissions.length > 0,
        description: 'Should have permissions data'
      },
      {
        name: 'Roles Data Available',
        test: () => Array.isArray(roles) && roles.length > 0,
        description: 'Should have roles data'
      },
      {
        name: 'Admin Detection',
        test: () => typeof isAdmin === 'boolean',
        description: 'Should detect admin status'
      },
      {
        name: 'Super Admin Detection',
        test: () => typeof isSuperAdmin === 'boolean',
        description: 'Should detect super admin status'
      },
      {
        name: 'Permission Check Function',
        test: () => typeof hasPermission === 'function',
        description: 'hasPermission should be a function'
      },
      {
        name: 'Role Check Function',
        test: () => typeof hasRole === 'function',
        description: 'hasRole should be a function'
      }
    ];
    
    const results = tests.map(test => ({
      ...test,
      passed: test.test(),
      timestamp: new Date().toISOString()
    }));
    
    setTestResults(results);
  };
  
  const TestResult = ({ result }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center space-x-3">
        {result.passed ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <div>
          <p className="font-medium">{result.name}</p>
          <p className="text-sm text-gray-600">{result.description}</p>
        </div>
      </div>
      <Badge variant={result.passed ? 'success' : 'destructive'}>
        {result.passed ? 'PASS' : 'FAIL'}
      </Badge>
    </div>
  );
  
  const PermissionTestCard = ({ permission, description }) => (
    <PermissionGate permission={permission}>
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Has {permission}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{description}</p>
        </CardContent>
      </Card>
    </PermissionGate>
  );
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">RBAC Test Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={refreshPermissions} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RBAC System Test</h1>
          <p className="text-gray-600">Testing Role-Based Access Control implementation</p>
        </div>
        <Button onClick={runTests} variant="outline">
          <Shield className="h-4 w-4 mr-2" />
          Run Tests
        </Button>
      </div>
      
      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
          <CardDescription>
            {passedTests}/{totalTests} tests passed ({((passedTests/totalTests)*100).toFixed(1)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <TestResult key={index} result={result} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Current User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Current User Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roles.length > 0 ? (
                roles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <p className="text-gray-500">No roles assigned</p>
              )}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Admin Status:</span>
                <Badge variant={isAdmin ? 'success' : 'secondary'}>
                  {isAdmin ? 'Admin' : 'Not Admin'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Super Admin:</span>
                <Badge variant={isSuperAdmin ? 'success' : 'secondary'}>
                  {isSuperAdmin ? 'Super Admin' : 'Not Super Admin'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Current Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 overflow-y-auto">
              {permissions.length > 0 ? (
                <div className="space-y-1">
                  {permissions.map((permission, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No permissions assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Permission Gates Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Permission Gates Test
          </CardTitle>
          <CardDescription>
            These components will only show if you have the required permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AdminGate>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Admin Access</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">You have admin privileges</p>
                </CardContent>
              </Card>
            </AdminGate>
            
            <SuperAdminGate>
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Super Admin Access</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">You have super admin privileges</p>
                </CardContent>
              </Card>
            </SuperAdminGate>
            
            <PermissionTestCard 
              permission="user.create" 
              description="Can create new users"
            />
            <PermissionTestCard 
              permission="role.create" 
              description="Can create new roles"
            />
            <PermissionTestCard 
              permission="permission.assign" 
              description="Can assign permissions"
            />
            <PermissionTestCard 
              permission="system.admin" 
              description="System administration access"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Role Gates Test */}
      <Card>
        <CardHeader>
          <CardTitle>Role Gates Test</CardTitle>
          <CardDescription>
            These components will only show if you have the required roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RoleGate role="super_admin">
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium">Super Admin Role</span>
                  </div>
                </CardContent>
              </Card>
            </RoleGate>
            
            <RoleGate role="user_manager">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">User Manager Role</span>
                  </div>
                </CardContent>
              </Card>
            </RoleGate>
            
            <RoleGate role="content_manager">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium">Content Manager Role</span>
                  </div>
                </CardContent>
              </Card>
            </RoleGate>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RBACTest;
