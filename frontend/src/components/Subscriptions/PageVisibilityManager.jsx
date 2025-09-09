import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/config';

const PageVisibilityManager = () => {
  const [pages, setPages] = useState([]);
  const [subscriptionLevels, setSubscriptionLevels] = useState(['basic', 'premium', 'enterprise']);
  const [loading, setLoading] = useState(true);
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [newPage, setNewPage] = useState({
    id: '',
    label: '',
    group: '',
    description: '',
    icon: 'Settings',
    path: '',
    required: false
  });

  useEffect(() => {
    fetchPageVisibility();
  }, []);

  const fetchPageVisibility = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/page-visibility`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPages(data.pages || []);
      } else {
        // Fallback to default pages if API doesn't exist yet
        setPages(getDefaultPages());
      }
    } catch (error) {
      console.error('Error fetching page visibility:', error);
      setPages(getDefaultPages());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPages = () => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      group: 'Main',
      description: 'Your personal dashboard',
      icon: 'Home',
      path: '/',
      required: true,
      visibility: {
        basic: true,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'journal',
      label: 'Trading Journal',
      group: 'Trading',
      description: 'Track your trades and performance',
      icon: 'FileText',
      path: '/journal',
      required: true,
      visibility: {
        basic: true,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'analytics',
      label: 'Analytics',
      group: 'Trading',
      description: 'View trading analytics and reports',
      icon: 'BarChart3',
      path: '/analytics',
      required: false,
      visibility: {
        basic: false,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'chart',
      label: 'Trading Charts',
      group: 'Trading',
      description: 'Live market charts',
      icon: 'Activity',
      path: '/chart',
      required: false,
      visibility: {
        basic: false,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'portfolio',
      label: 'Portfolio',
      group: 'Trading',
      description: 'Manage your portfolio',
      icon: 'TrendingUp',
      path: '/portfolio',
      required: false,
      visibility: {
        basic: false,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'advanced-analytics',
      label: 'Advanced Analytics',
      group: 'Trading',
      description: 'Advanced trading analytics and insights',
      icon: 'BarChart3',
      path: '/advanced-analytics',
      required: false,
      visibility: {
        basic: false,
        premium: false,
        enterprise: true
      }
    },
    {
      id: 'api-access',
      label: 'API Access',
      group: 'Advanced',
      description: 'Access to trading APIs',
      icon: 'Settings',
      path: '/api-access',
      required: false,
      visibility: {
        basic: false,
        premium: false,
        enterprise: true
      }
    },
    {
      id: 'subscription',
      label: 'My Subscription',
      group: 'Account',
      description: 'Manage your plan',
      icon: 'CreditCard',
      path: '/subscription',
      required: true,
      visibility: {
        basic: true,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      group: 'Account',
      description: 'Update your profile',
      icon: 'User',
      path: '/profile',
      required: true,
      visibility: {
        basic: true,
        premium: true,
        enterprise: true
      }
    },
    {
      id: 'priority-support',
      label: 'Priority Support',
      group: 'Support',
      description: 'Priority customer support',
      icon: 'MessageSquare',
      path: '/priority-support',
      required: false,
      visibility: {
        basic: false,
        premium: false,
        enterprise: true
      }
    },
    {
      id: 'help-support',
      label: 'Help & Support',
      group: 'Support',
      description: 'Get help and support',
      icon: 'MessageSquare',
      path: '/help-support',
      required: true,
      visibility: {
        basic: true,
        premium: true,
        enterprise: true
      }
    }
  ];

  const handleVisibilityToggle = (pageId, level) => {
    setPages(pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          visibility: {
            ...page.visibility,
            [level]: !page.visibility[level]
          }
        };
      }
      return page;
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/page-visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ pages })
      });

      if (response.ok) {
        toast.success('Page visibility settings saved successfully');
      } else {
        toast.error('Failed to save page visibility settings');
      }
    } catch (error) {
      toast.error('Network error while saving settings');
    }
  };

  const handleAddPage = () => {
    if (newPage.id && newPage.label && newPage.group) {
      const page = {
        ...newPage,
        visibility: {
          basic: false,
          premium: false,
          enterprise: false
        }
      };
      setPages([...pages, page]);
      setNewPage({
        id: '',
        label: '',
        group: '',
        description: '',
        icon: 'Settings',
        path: '',
        required: false
      });
      setShowAddPageModal(false);
      toast.success('Page added successfully');
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleDeletePage = (pageId) => {
    if (confirm('Are you sure you want to delete this page?')) {
      setPages(pages.filter(page => page.id !== pageId));
      toast.success('Page deleted successfully');
    }
  };

  const getVisibilityIcon = (isVisible) => {
    return isVisible ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />;
  };

  const getVisibilityBadge = (isVisible) => {
    return isVisible ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Visible</Badge> : 
      <Badge variant="secondary">Hidden</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Page Visibility Manager</h1>
          <p className="text-muted-foreground mt-2">
            Configure which pages are visible to different subscription levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPageVisibility}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddPageModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Page
          </Button>
          <Button onClick={handleSaveChanges}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Subscription Level Headers */}
      <Card>
        <CardHeader>
          <CardTitle>Page Visibility Configuration</CardTitle>
          <CardDescription>
            Toggle visibility for each page across different subscription levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 items-center font-medium text-sm text-muted-foreground border-b pb-2">
              <div className="col-span-4">Page</div>
              <div className="col-span-2 text-center">Basic</div>
              <div className="col-span-2 text-center">Premium</div>
              <div className="col-span-2 text-center">Enterprise</div>
              <div className="col-span-2 text-center">Actions</div>
            </div>

            {/* Page Rows */}
            {pages.map((page) => (
              <div key={page.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b">
                <div className="col-span-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium">{page.label}</div>
                      <div className="text-sm text-muted-foreground">{page.group}</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisibilityToggle(page.id, 'basic')}
                    className="p-2"
                  >
                    {getVisibilityIcon(page.visibility.basic)}
                  </Button>
                </div>
                
                <div className="col-span-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisibilityToggle(page.id, 'premium')}
                    className="p-2"
                  >
                    {getVisibilityIcon(page.visibility.premium)}
                  </Button>
                </div>
                
                <div className="col-span-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVisibilityToggle(page.id, 'enterprise')}
                    className="p-2"
                  >
                    {getVisibilityIcon(page.visibility.enterprise)}
                  </Button>
                </div>
                
                <div className="col-span-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePage(page.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Page Modal */}
      <Dialog open={showAddPageModal} onOpenChange={setShowAddPageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
            <DialogDescription>
              Add a new page to the visibility configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="page-id">Page ID</Label>
              <Input
                id="page-id"
                value={newPage.id}
                onChange={(e) => setNewPage({...newPage, id: e.target.value})}
                placeholder="e.g., new-feature"
                required
              />
            </div>
            <div>
              <Label htmlFor="page-label">Page Label</Label>
              <Input
                id="page-label"
                value={newPage.label}
                onChange={(e) => setNewPage({...newPage, label: e.target.value})}
                placeholder="e.g., New Feature"
                required
              />
            </div>
            <div>
              <Label htmlFor="page-group">Group</Label>
              <Select 
                value={newPage.group} 
                onValueChange={(value) => setNewPage({...newPage, group: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Trading">Trading</SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="page-description">Description</Label>
              <Input
                id="page-description"
                value={newPage.description}
                onChange={(e) => setNewPage({...newPage, description: e.target.value})}
                placeholder="Page description"
              />
            </div>
            <div>
              <Label htmlFor="page-path">Path</Label>
              <Input
                id="page-path"
                value={newPage.path}
                onChange={(e) => setNewPage({...newPage, path: e.target.value})}
                placeholder="e.g., /new-feature"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="page-required"
                checked={newPage.required}
                onChange={(e) => setNewPage({...newPage, required: e.target.checked})}
              />
              <Label htmlFor="page-required">Required Page</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddPageModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPage}>
                Add Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageVisibilityManager;

