import { API_BASE_URL } from '@/config/config';

class RoleService {
  constructor() {
    this.userRoles = [];
    this.userPermissions = [];
    this.lastFetch = null;
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes - shorter cache
  }

  clearCache() {
    this.userRoles = [];
    this.userPermissions = [];
    this.lastFetch = null;
    console.log('🧹 Role cache cleared');
  }

  async getUserRolesAndPermissions() {
    const token = localStorage.getItem('access_token');
    
    try {
      if (!token) {
        console.error('RoleService: No authentication token found');
        throw new Error('No authentication token');
      }

      console.log('RoleService: Fetching roles and assignments...');
      // Fetch roles and assignments in parallel
      const [rolesResp, assignmentsResp] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/roles`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/admin/role-assignments`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      console.log('RoleService: Roles response status:', rolesResp.status);
      console.log('RoleService: Assignments response status:', assignmentsResp.status);

      if (!rolesResp.ok) {
        throw new Error(`HTTP ${rolesResp.status}: ${rolesResp.statusText}`);
      }
      if (!assignmentsResp.ok) {
        throw new Error(`HTTP ${assignmentsResp.status}: ${assignmentsResp.statusText}`);
      }

      const rolesJson = await rolesResp.json();
      const assignmentsJson = await assignmentsResp.json();

      console.log('RoleService: Raw roles response:', rolesJson);
      console.log('RoleService: Raw assignments response:', assignmentsJson);

      const allRoles = Array.isArray(rolesJson.roles) ? rolesJson.roles : [];
      const userAssignments = Array.isArray(assignmentsJson.assignments) ? assignmentsJson.assignments : [];

      console.log('RoleService: Processed roles:', allRoles);
      console.log('RoleService: Processed assignments:', userAssignments);

      // Build role map by id
      const roleById = new Map();
      allRoles.forEach(r => {
        if (r && r.id != null) {
          roleById.set(r.id, r);
        }
      });

      // Get current user info and determine user type
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('No user data found');
      }
      const currentUser = JSON.parse(userData);
      if (!currentUser) {
        throw new Error('Invalid user data');
      }

      // Use userTypeService for consistent user type detection
      const userTypeInfo = userTypeService.determineUserType(currentUser);
      const currentId = userTypeService.getUserId();
      const currentEmail = userTypeService.getUserEmail();
      const isAdminUser = userTypeInfo.isAdmin;
      
      if (!currentId) {
        throw new Error('No user ID found in user data');
      }

      console.log('Current user ID:', currentId);
      console.log('Current user email:', currentEmail);
      console.log('Total assignments:', userAssignments.length);

      // Filter assignments for current user - simplified logic
      const assignmentsForUser = userAssignments.filter(a => {
        const active = a?.is_active !== false; // treat undefined/null as active
        
        if (!active) {
          return false;
        }
        
        // Use the user_type field from backend to determine matching logic
        const assignmentUserType = a?.user_type || 'unknown';
        const userMatches = a?.user?.id === parseInt(currentId) || a?.user?.email === currentEmail;
        const adminUserMatches = a?.admin_user?.id === parseInt(currentId) || a?.admin_user?.email === currentEmail;
        const directUserMatches = a?.user_id === parseInt(currentId);
        const directAdminMatches = a?.admin_user_id === parseInt(currentId);
        
        let matches = false;
        
        if (isAdminUser) {
          // Admin users should match admin assignments
          matches = adminUserMatches || directAdminMatches || (assignmentUserType === 'admin' && (userMatches || directUserMatches));
        } else {
          // Regular users should match regular user assignments
          matches = userMatches || directUserMatches || (assignmentUserType === 'regular' && (adminUserMatches || directAdminMatches));
        }
        
        console.log(`Assignment ${a.id}: userType=${assignmentUserType}, isAdminUser=${isAdminUser}, matches=${matches}`);
        return matches;
      })

      console.log('Filtered assignments for user:', assignmentsForUser.length);

      // Extract roles using role map with improved error handling
      const roles = assignmentsForUser.map(a => {
        // Get role from assignment's role object or role map
        let role = a.role || roleById.get(a.role_id) || {};
        
        // Get permissions from role object or assignment
        let perms = [];
        if (role.permissions && Array.isArray(role.permissions)) {
          perms = role.permissions;
        } else if (a.permissions && Array.isArray(a.permissions)) {
          perms = a.permissions;
        }
        
        // Normalize permissions to array of strings
        const normalizedPerms = perms.map(p => {
          if (typeof p === 'string') return p;
          if (p && p.name) return p.name;
          return null;
        }).filter(Boolean);
        
        const extractedRole = {
          id: role.id || a.role_id,
          name: role.name || a.role_name || 'unknown_role',
          displayName: role.display_name || role.displayName || a.role_name || 'Unknown Role',
          description: role.description || null,
          permissions: normalizedPerms,
          isActive: a?.is_active !== false,
          assignedAt: a.assigned_at,
          assignedBy: a.assigned_by || a.assigned_by_username || 'System',
          userType: a.user_type || 'unknown'
        };
        console.log('Extracted role:', extractedRole);
        return extractedRole;
      });

      console.log('Total roles extracted:', roles.length);

      // Aggregate unique permissions with validation
      const permissionsSet = new Set();
      roles.forEach(role => {
        if (Array.isArray(role.permissions)) {
          role.permissions.forEach(permission => {
            if (permission && typeof permission === 'string' && permission.trim()) {
              permissionsSet.add(permission.trim());
            }
          });
        }
      });
      
      console.log('Aggregated permissions:', Array.from(permissionsSet));

      this.userRoles = roles;
      this.userPermissions = Array.from(permissionsSet);
      this.lastFetch = Date.now();

      return {
        roles,
        permissions: this.userPermissions
      };
    } catch (error) {
      console.error('Error fetching user roles and permissions:', error);
      throw error;
    }
  }

  async getRolesAndPermissions(forceRefresh = false) {
    try {
      // Check cache validity
      if (!forceRefresh && this.lastFetch && (Date.now() - this.lastFetch) < this.cacheExpiry) {
        console.log('✅ Using cached roles and permissions');
        return {
          roles: this.userRoles,
          permissions: this.userPermissions
        };
      }

      console.log('🔄 Fetching fresh roles and permissions...');
      
      // Get user data and token
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('access_token');
      
      if (!token || !userData.id) {
        console.log('❌ No authentication token or user data found');
        return { roles: [], permissions: [] };
      }

      console.log('👤 Current user:', { id: userData.id, email: userData.email });
      
      // Determine user type based on user data
      const isAdminUser = this.isUserAdmin(userData);
      console.log('🔍 User type detected:', isAdminUser ? 'Admin' : 'Regular');
      
      // For regular users, skip API call and use localStorage data
      if (!isAdminUser) {
        console.log('👤 Regular user detected, skipping API call');
        const roles = userData.roles || [];
        const permissions = [];
        
        // Extract permissions from roles
        roles.forEach(role => {
          if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach(permission => {
              permissions.push(permission);
            });
          }
        });
        
        this.userRoles = roles;
        this.userPermissions = permissions;
        this.lastFetch = Date.now();
        
        console.log('✅ Using localStorage roles for regular user:', roles.length);
        
        return {
          roles: this.userRoles,
          permissions: this.userPermissions
        };
      }
      
      // Only make API call for admin users
      console.log('👤 Admin user detected, making API call');
      
      // Fetch role assignments
      const response = await fetch('/api/admin/role-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('❌ Role assignments API failed:', response.status);
        return { roles: [], permissions: [] };
      }

      const data = await response.json();
      console.log('📥 Raw API response:', data);

      if (!data.success || !data.assignments) {
        console.log('⚠️ API returned no assignments or error');
        return { roles: [], permissions: [] };
      }

      // Process assignments - much simpler logic
      const assignments = data.assignments.filter(a => a.is_active !== false);
      console.log('✅ Active assignments found:', assignments.length);
      
      // Extract roles and permissions
      const roles = [];
      const permissionsSet = new Set();
      
      assignments.forEach(assignment => {
        if (assignment.role) {
          const role = {
            id: assignment.role.id,
            name: assignment.role.name,
            displayName: assignment.role.display_name || assignment.role.name,
            description: assignment.role.description,
            permissions: assignment.role.permissions || [],
            isActive: assignment.is_active,
            assignedAt: assignment.assigned_at,
            userType: assignment.user_type
          };
          
          roles.push(role);
          
          // Add permissions to set
          if (Array.isArray(role.permissions)) {
            role.permissions.forEach(perm => {
              if (typeof perm === 'string') {
                permissionsSet.add(perm);
              }
            });
          }
          
          console.log('✅ Processed role:', role.name, 'with', role.permissions.length, 'permissions');
        }
      });

      this.userRoles = roles;
      this.userPermissions = Array.from(permissionsSet);
      this.lastFetch = Date.now();

      console.log('🎯 Final result:', {
        roles: roles.length,
        permissions: this.userPermissions.length,
        roleNames: roles.map(r => r.name)
      });

      return {
        roles: this.userRoles,
        permissions: this.userPermissions
      };
    } catch (error) {
      console.error('❌ Error in getRolesAndPermissions:', error);
      
      // Return empty arrays on error
      this.userRoles = [];
      this.userPermissions = [];
      
      return {
        roles: [],
        permissions: []
      };
    }
  }
  
  // Simple user type detection
  isUserAdmin(userData) {
    if (!userData) return false;
    
    // Check explicit admin indicators
    if (userData.account_type === 'admin') return true;
    if (userData.is_admin === true) return true;
    if (userData.is_super_admin === true) return true;
    
    // Check for admin-specific fields
    if (userData.failed_login_attempts !== undefined) return true;
    
    return false;
  }

  hasRole(roleName) {
    if (!roleName) return false;
    return this.userRoles.some(role => 
      role.name?.toLowerCase() === roleName.toLowerCase() || 
      role.displayName?.toLowerCase() === roleName.toLowerCase()
    );
  }

  hasPermission(permissionName) {
    return this.userPermissions.includes(permissionName);
  }

  getUserRoles() {
    return this.userRoles;
  }

  getUserPermissions() {
    return this.userPermissions;
  }

  // Get primary role for current user
  async getPrimaryRole() {
    try {
      const { roles } = await this.getRolesAndPermissions();
      return roles.find(role => role.isActive) || null;
    } catch (error) {
      console.error('Error getting primary role:', error);
      return null;
    }
  }

  // Check if cache is still valid
  isCacheValid() {
    return this.lastFetch && (Date.now() - this.lastFetch) < this.cacheExpiry;
  }

  // Check if current user has admin role
  async isCurrentUserAdmin() {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return this.isUserAdmin(userData);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Get user type for current user
  async getCurrentUserType() {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      return this.isUserAdmin(userData) ? 'admin' : 'regular';
    } catch (error) {
      console.error('Error getting user type:', error);
      return 'unknown';
    }
  }

  // Check if user has admin role (synchronous method)
  isAdmin() {
    const adminRoles = ['super_admin', 'admin', 'administrator', 'system_admin'];
    return this.userRoles.some(role => 
      adminRoles.includes(role.name?.toLowerCase()) || 
      adminRoles.includes(role.displayName?.toLowerCase())
    );
  }

  // Clear all cached data on logout
  onLogout() {
    this.clearCache();
    console.log('🚪 User logged out, cache cleared');
  }
}

export default new RoleService();

