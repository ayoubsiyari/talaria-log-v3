import React from 'react';
import { usePermissions } from '../hooks/usePermissions.jsx';

/**
 * PermissionGate component - conditionally renders children based on permissions
 */
export const PermissionGate = ({ 
  permission, 
  permissions, 
  role, 
  roles,
  requireAll = false,
  fallback = null, 
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, isAdmin, isSuperAdmin } = usePermissions();

  // Get user from localStorage
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  // If user is not authenticated, don't render
  if (!user) {
    return fallback;
  }

  // Super Admin bypass - grant all permissions
  if (isSuperAdmin()) {
    return children;
  }

   // Check single permission
  if (permission && !hasPermission(permission)) {
    return fallback;
  }

  // Check multiple permissions (Super Admin already bypassed above)
  if (permissions && permissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasRequiredPermissions) {
      return fallback;
    }
  }

  // Check single role
  if (role && !hasRole(role)) {
    return fallback;
  }

  // Check multiple roles
  if (roles && roles.length > 0) {
    if (!hasAnyRole(roles)) {
      return fallback;
    }
  }

  return children;
};

/**
 * AdminGate component - only renders for admin users
 */
export const AdminGate = ({ fallback = null, children }) => {
  const { isAdmin } = usePermissions();

  if (!isAdmin()) {
    return fallback;
  }

  return children;
};

/**
 * SuperAdminGate component - only renders for super admin users
 */
export const SuperAdminGate = ({ fallback = null, children }) => {
  const { isSuperAdmin } = usePermissions();

  if (!isSuperAdmin()) {
    return fallback;
  }

  return children;
};

/**
 * RoleGate component - renders based on user roles
 */
export const RoleGate = ({ role, roles, fallback = null, children }) => {
  return (
    <PermissionGate 
      role={role} 
      roles={roles} 
      fallback={fallback}
    >
      {children}
    </PermissionGate>
  );
};

/**
 * ConditionalRender component - more flexible conditional rendering
 */
export const ConditionalRender = ({ condition, fallback = null, children }) => {
  return condition ? children : fallback;
};

// Also export as default for backward compatibility
export default PermissionGate;
