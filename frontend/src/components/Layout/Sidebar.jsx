import { useState } from 'react'
import { 
  Users, 
  CreditCard, 
  Tag, 
  UserCheck, 
  BarChart3, 
  Settings, 
  Home,
  ChevronLeft,
  ChevronRight,
  Menu,
  TrendingUp,
  Activity,
  Shield,
  Database,
  FileText,
  Target,
  DollarSign,
  Calendar,
  Bell,
  MessageSquare,
  ClipboardList,
  UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigationItems = [
  {
    group: "Overview",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/', description: 'Main overview and metrics' }
    ]
  },
  {
    group: "User Management",
    items: [
      { id: 'users', label: 'User Management', icon: Users, path: '/users', description: 'Manage user accounts and roles' },
      { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, path: '/subscriptions', description: 'Manage subscription plans and billing' }
    ]
  },
  {
    group: "Marketing & Sales",
    items: [
      { id: 'promotions', label: 'Promotions', icon: Tag, path: '/promotions', description: 'Manage promotional campaigns' },
      { id: 'affiliates', label: 'Affiliates', icon: UserCheck, path: '/affiliates', description: 'Manage affiliate partnerships' }
    ]
  },
  {
    group: "Support Management",
    items: [
      { id: 'staff-log', label: 'Staff Log', icon: ClipboardList, path: '/staff-log', description: 'Track staff assignments and workload' }
    ]
  },
  {
    group: "Analytics & Reports",
    items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics', description: 'Business intelligence and reports' }
    ]
  },
  {
    group: "System",
    items: [
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', description: 'System configuration and preferences' }
    ]
  }
]

export default function Sidebar({ activeItem, onItemClick, collapsed, onToggleCollapse }) {
  return (
    <div className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground">HADES Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <div className="space-y-6">
          {navigationItems.map((group, groupIndex) => (
            <div key={groupIndex}>
              {!collapsed && (
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
                    {group.group}
                  </h3>
                </div>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeItem === item.id
                  
                  return (
                    <li key={item.id}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${
                          collapsed ? 'px-2' : 'px-3'
                        } ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}`}
                        onClick={() => onItemClick(item.id)}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'}`} />
                        {!collapsed && (
                          <div className="flex-1 text-left">
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-sidebar-foreground/60 truncate">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/60">
            Trading Journal Admin v1.0
          </div>
          <div className="text-xs text-sidebar-foreground/40 mt-1">
            All systems operational
          </div>
        </div>
      )}
    </div>
  )
}

