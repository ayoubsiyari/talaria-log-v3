import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Shield, Users, CheckCircle, XCircle } from 'lucide-react'
import permissionService from '@/services/permissionService'

export default function PermissionAssignmentDialog({ 
  isOpen, 
  onClose, 
  permission, 
  onAssign 
}) {
  const [selectedRoles, setSelectedRoles] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(false)

  // Load roles when dialog opens
  useEffect(() => {
    if (isOpen && roles.length === 0) {
      loadRoles()
    }
  }, [isOpen])

  const loadRoles = async () => {
    setRolesLoading(true)
    try {
      const response = await permissionService.getRoles()
      if (response.success) {
        setRoles(response.roles || [])
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    } finally {
      setRolesLoading(false)
    }
  }

  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleAssign = async () => {
    if (selectedRoles.length === 0) return
    
    setLoading(true)
    try {
      await permissionService.assignPermissionToRoles(permission.name, selectedRoles)
      if (onAssign) {
        onAssign(permission.name, selectedRoles)
      }
      onClose()
    } catch (error) {
      console.error('Failed to assign permission:', error)
      alert('Failed to assign permission. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    setSelectedRoles(filteredRoles.map(role => role.id))
  }

  const handleDeselectAll = () => {
    setSelectedRoles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Assign Permission</span>
          </DialogTitle>
          <DialogDescription>
            Assign the permission "{permission?.displayName}" to one or more roles
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Permission Details */}
          {permission && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`p-2 rounded-lg ${permission.bgColor}`}>
                  {(() => {
                    const IconComponent = permission.icon
                    return <IconComponent className={`w-4 h-4 ${permission.color}`} />
                  })()}
                </div>
                <h3 className="font-semibold">{permission.displayName}</h3>
                <Badge variant="outline" className="capitalize">
                  {permission.action}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{permission.description}</p>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Select All/None */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>

          {/* Roles List */}
          <ScrollArea className="h-64 border rounded-lg p-4">
            <div className="space-y-2">
              {filteredRoles.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No roles found</p>
                </div>
              ) : (
                filteredRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{role.display_name || role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {role.assigned_users_count || 0} users
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Summary */}
          {selectedRoles.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={selectedRoles.length === 0 || loading}
            className="min-w-[100px]"
          >
            {loading ? 'Assigning...' : 'Assign Permission'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
