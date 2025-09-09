import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Plus,
  UserCheck,
  ClipboardList
} from 'lucide-react';

const SupportNavigation = ({ unreadCount = 0, assignedCount = 0 }) => {
  const location = useLocation();

  const navItems = [
    {
      title: 'All Tickets',
      href: '/support/tickets',
      icon: MessageSquare,
      badge: null
    },
    {
      title: 'My Assigned Tickets',
      href: '/support/my-tickets',
      icon: UserCheck,
      badge: assignedCount > 0 ? assignedCount : null
    },
    {
      title: 'Create Ticket',
      href: '/support/create',
      icon: Plus,
      badge: null
    },
    {
      title: 'Categories',
      href: '/support/categories',
      icon: FileText,
      badge: null
    },
    {
      title: 'Agents',
      href: '/support/agents',
      icon: Users,
      badge: null
    },
    {
      title: 'Analytics',
      href: '/support/analytics',
      icon: BarChart3,
      badge: null
    },
    {
      title: 'Settings',
      href: '/support/settings',
      icon: Settings,
      badge: null
    }
  ];

  return (
    <div className="space-y-2">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Support Management
        </h2>
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link key={item.href} to={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isActive ? 'bg-secondary' : ''}`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SupportNavigation;
