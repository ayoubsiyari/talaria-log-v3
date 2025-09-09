import { API_BASE_URL } from '@/config/config'

class PermissionService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // Helper method to make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...defaultOptions,
      ...options
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Get all permissions with filtering and pagination
  async getPermissions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/admin/permissions${queryString ? `?${queryString}` : ''}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  }

  // Get permission categories with their resources and actions
  async getPermissionCategories() {
    try {
      const response = await this.makeRequest('/admin/permissions/categories')
      return response
    } catch (error) {
      console.error('Error fetching permission categories:', error)
      throw error
    }
  }

  // Assign a permission to multiple roles
  async assignPermissionToRoles(permissionName, roleIds) {
    try {
      const response = await this.makeRequest('/admin/permissions/assign', {
        method: 'POST',
        body: JSON.stringify({
          permission_name: permissionName,
          role_ids: roleIds
        })
      })
      return response
    } catch (error) {
      console.error('Error assigning permission:', error)
      throw error
    }
  }

  // Revoke a permission from multiple roles
  async revokePermissionFromRoles(permissionName, roleIds) {
    try {
      const response = await this.makeRequest('/admin/permissions/revoke', {
        method: 'POST',
        body: JSON.stringify({
          permission_name: permissionName,
          role_ids: roleIds
        })
      })
      return response
    } catch (error) {
      console.error('Error revoking permission:', error)
      throw error
    }
  }

  // Get permission templates
  async getPermissionTemplates() {
    try {
      const response = await this.makeRequest('/admin/permissions/templates')
      return response
    } catch (error) {
      console.error('Error fetching permission templates:', error)
      throw error
    }
  }

  // Apply a permission template
  async applyPermissionTemplate(templateId) {
    try {
      const response = await this.makeRequest('/admin/permissions/templates/apply', {
        method: 'POST',
        body: JSON.stringify({
          template_id: templateId
        })
      })
      return response
    } catch (error) {
      console.error('Error applying permission template:', error)
      throw error
    }
  }

  // Get roles for permission assignment dialog
  async getRoles() {
    try {
      const response = await this.makeRequest('/admin/roles')
      return response
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  }

  // Search permissions with advanced filtering
  async searchPermissions(searchParams) {
    try {
      const queryString = new URLSearchParams(searchParams).toString()
      const endpoint = `/admin/permissions${queryString ? `?${queryString}` : ''}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Error searching permissions:', error)
      throw error
    }
  }

  // Get permissions by category
  async getPermissionsByCategory(category) {
    try {
      const params = { category, per_page: 100 }
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/admin/permissions?${queryString}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching permissions by category:', error)
      throw error
    }
  }

  // Get permissions by resource
  async getPermissionsByResource(category, resource) {
    try {
      const params = { category, resource, per_page: 100 }
      const queryString = new URLSearchParams(params).toString()
      const endpoint = `/admin/permissions?${queryString}`
      const response = await this.makeRequest(endpoint)
      return response
    } catch (error) {
      console.error('Error fetching permissions by resource:', error)
      throw error
    }
  }
}

export default new PermissionService()
