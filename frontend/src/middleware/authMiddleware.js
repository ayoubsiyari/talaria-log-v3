import roleService from '@/services/roleService';

class AuthMiddleware {
  constructor() {
    this.requiredPermissions = new Map();
    this.requiredRoles = new Map();
    this.redirectPath = '/login';
    this.unauthorizedPath = '/unauthorized';
  }

  // Register required permissions for routes
  registerRoutePermissions(routePath, permissions) {
    this.requiredPermissions.set(routePath, permissions);
  }

  // Register required roles for routes
  registerRouteRoles(routePath, roles) {
    this.requiredRoles.set(routePath, roles);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }

    try {
      // Basic token validation
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return false;
      }

      // Check token expiration
      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // Check if user has required permissions for a route
  async hasRoutePermissions(routePath) {
    const requiredPermissions = this.requiredPermissions.get(routePath);
    
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No permissions required
    }

    try {
      const { permissions } = await roleService.getRolesAndPermissions();
      
      if (!permissions || permissions.length === 0) {
        return false;
      }

      // Check if user has all required permissions
      return roleService.hasAllPermissions(requiredPermissions);
    } catch (error) {
      console.error('Permission check error:', error);
      return false;
    }
  }

  // Check if user has required roles for a route
  async hasRouteRoles(routePath) {
    const requiredRoles = this.requiredRoles.get(routePath);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    try {
      const { roles } = await roleService.getRolesAndPermissions();
      
      if (!roles || roles.length === 0) {
        return false;
      }

      // Check if user has any of the required roles
      return roleService.hasAnyRole(requiredRoles);
    } catch (error) {
      console.error('Role check error:', error);
      return false;
    }
  }

  // Main authentication guard
  async canAccess(routePath) {
    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      return {
        allowed: false,
        reason: 'unauthenticated',
        redirectTo: this.redirectPath
      };
    }

    // Check permissions
    const hasPermissions = await this.hasRoutePermissions(routePath);
    if (!hasPermissions) {
      return {
        allowed: false,
        reason: 'insufficient_permissions',
        redirectTo: this.unauthorizedPath
      };
    }

    // Check roles
    const hasRoles = await this.hasRouteRoles(routePath);
    if (!hasRoles) {
      return {
        allowed: false,
        reason: 'insufficient_roles',
        redirectTo: this.unauthorizedPath
      };
    }

    return {
      allowed: true,
      reason: 'authorized'
    };
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    roleService.clearCache();
  }

  // Get current user info
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  // Get user's access summary
  async getAccessSummary() {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      return roleService.getAccessSummary();
    } catch (error) {
      console.error('Error getting access summary:', error);
      return null;
    }
  }

  // Check if user can perform specific action
  async canPerformAction(resource, action) {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      return roleService.canPerformAction(resource, action);
    } catch (error) {
      console.error('Error checking action permission:', error);
      return false;
    }
  }

  // Get user's role hierarchy level
  async getRoleHierarchyLevel() {
    if (!this.isAuthenticated()) {
      return 0;
    }

    try {
      return roleService.getRoleHierarchyLevel();
    } catch (error) {
      console.error('Error getting role hierarchy:', error);
      return 0;
    }
  }

  // Check if user is admin
  async isAdmin() {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      return roleService.isAdmin();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Refresh authentication data
  async refreshAuth() {
    try {
      await roleService.getRolesAndPermissions(true); // Force refresh
      return true;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      return false;
    }
  }

  // Logout user
  logout() {
    this.clearAuthData();
    window.location.href = this.redirectPath;
  }

  // Set redirect paths
  setRedirectPaths(loginPath, unauthorizedPath) {
    this.redirectPath = loginPath;
    this.unauthorizedPath = unauthorizedPath;
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Register common route permissions
authMiddleware.registerRoutePermissions('/admin/users', ['view_users', 'manage_users']);
authMiddleware.registerRoutePermissions('/admin/roles', ['view_roles', 'manage_roles']);
authMiddleware.registerRoutePermissions('/admin/permissions', ['view_permissions', 'manage_permissions']);
authMiddleware.registerRoutePermissions('/admin/role-assignments', ['view_role_assignments', 'manage_role_assignments']);

// Register common route roles
authMiddleware.registerRouteRoles('/admin/users', ['super_admin', 'user_manager']);
authMiddleware.registerRouteRoles('/admin/roles', ['super_admin']);
authMiddleware.registerRouteRoles('/admin/permissions', ['super_admin']);
authMiddleware.registerRouteRoles('/admin/role-assignments', ['super_admin']);

export default authMiddleware;
