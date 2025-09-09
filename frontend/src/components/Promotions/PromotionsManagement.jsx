import { useState, useEffect } from 'react'
import { 
  Tag, 
  Plus, 
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Users,
  TrendingUp,
  Copy,
  QrCode,
  Mail,
  Share2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  CreditCard,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Target,
  DollarSign,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { API_BASE_URL } from '@/config/config'
import CreateCampaignModal from './CreateCampaignModal'
import EditCampaignModal from './EditCampaignModal'
import ViewCampaignModal from './ViewCampaignModal'
import QRCodeModal from './QRCodeModal'
import ShareCampaignModal from './ShareCampaignModal'
import DeleteCampaignModal from './DeleteCampaignModal'

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function PromotionsManagement({ onNavigate }) {
  const [selectedTab, setSelectedTab] = useState("campaigns")
  const [campaigns, setCampaigns] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch promotions data
  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/promotions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      } else {
        toast.error('Failed to fetch promotions')
      }
    } catch (error) {
      console.error('Error fetching promotions:', error)
      toast.error('Failed to fetch promotions')
    } finally {
      setLoading(false)
    }
  }

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/promotions/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch analytics')
    }
  }

  useEffect(() => {
    fetchPromotions()
    fetchAnalytics()
  }, [])

  const handleCampaignAction = async (campaignId, action) => {
    try {
      setSaving(true)
      const token = localStorage.getItem('access_token')
      
      let response
      if (action === 'delete') {
        response = await fetch(`${API_BASE_URL}/admin/promotions/${campaignId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      } else {
        // For activate/pause, update status
        const newStatus = action === 'activate' ? 'active' : 'paused'
        response = await fetch(`${API_BASE_URL}/admin/promotions/${campaignId}/status`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        })
      }

      if (response.ok) {
        toast.success(`Campaign ${action}d successfully`)
        fetchPromotions() // Refresh data
        fetchAnalytics() // Refresh analytics
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || `Failed to ${action} campaign`)
      }
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
      toast.error(`Failed to ${action} campaign`)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSuccess = (newCampaign) => {
    // Add the new campaign to the list
    setCampaigns(prev => [newCampaign, ...prev])
    // Refresh analytics
    fetchAnalytics()
  }

  const handleEditSuccess = (updatedCampaign) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === updatedCampaign.id ? updatedCampaign : campaign
    ))
    fetchAnalytics()
  }

  const handleDeleteSuccess = () => {
    fetchPromotions()
    fetchAnalytics()
  }

  const handleAction = (action, campaign) => {
    setSelectedCampaign(campaign)
    
    switch (action) {
      case 'view':
        setShowViewModal(true)
        break
      case 'edit':
        setShowEditModal(true)
        break
      case 'qr':
        setShowQRModal(true)
        break
      case 'share':
        setShowShareModal(true)
        break
      case 'delete':
        setShowDeleteModal(true)
        break
      default:
        break
    }
  }

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_BASE_URL}/admin/promotions/${selectedCampaign.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        toast.success('Campaign deleted successfully!')
        handleDeleteSuccess()
        setShowDeleteModal(false)
        setSelectedCampaign(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    } finally {
      setIsDeleting(false)
    }
  }

  const getDiscountDisplay = (campaign) => {
    if (campaign.type === 'percentage') {
      return `${campaign.value}% OFF`
    } else if (campaign.type === 'fixed') {
      return `$${campaign.value} OFF`
    } else if (campaign.type === 'trial_extension') {
      return `+${campaign.value} days`
    }
    return campaign.value
  }

  const getUsagePercentage = (campaign) => {
    if (!campaign.usageLimit) return 0
    return Math.min((campaign.usageCount / campaign.usageLimit) * 100, 100)
  }

  const stats = analytics?.summary || {
    total_promotions: campaigns.length,
    active_promotions: campaigns.filter(c => c.status === 'active').length,
    total_revenue: campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0),
    total_conversions: campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading promotions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promotions Management</h1>
          <p className="text-muted-foreground">
            Create and manage promotional campaigns, discount codes, and special offers
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => { fetchPromotions(); fetchAnalytics(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Campaigns</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_promotions}</p>
            <p className="text-xs text-muted-foreground">
              {stats.active_promotions} active campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
            <p className="text-xs text-muted-foreground">
              Generated from campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Conversions</span>
            </div>
            <p className="text-2xl font-bold">{stats.total_conversions}</p>
            <p className="text-xs text-muted-foreground">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Avg. Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {stats.avg_conversion_rate ? stats.avg_conversion_rate.toFixed(1) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Promotion Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Promotion Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Promotion Campaigns</CardTitle>
              <CardDescription>
                Manage active and scheduled promotional campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first promotional campaign to start driving sales and conversions. 
                    You can create percentage discounts, fixed amounts, or trial extensions.
                  </p>
                  <Button onClick={() => setShowCreateModal(true)} size="lg">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Conversions</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id} className="group">
                          <TableCell>
                            <div>
                              <div className="font-medium">{campaign.name}</div>
                              <div className="text-sm text-muted-foreground">{campaign.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <code className="px-2 py-1 bg-muted rounded text-sm">{campaign.code}</code>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  navigator.clipboard.writeText(campaign.code)
                                  toast.success('Code copied to clipboard')
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[campaign.status]}>
                              {campaign.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{campaign.usageCount}</span>
                                {campaign.usageLimit && <span>/{campaign.usageLimit}</span>}
                              </div>
                              {campaign.usageLimit && (
                                <Progress value={getUsagePercentage(campaign)} className="h-2" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm font-medium">{campaign.conversions}</div>
                              <div className="text-xs text-muted-foreground">
                                {campaign.usageCount > 0 ? ((campaign.conversions / campaign.usageCount) * 100).toFixed(1) : 0}% rate
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{formatDate(campaign.startDate)}</div>
                              <div className="text-muted-foreground">to {formatDate(campaign.endDate)}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleAction('view', campaign)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('edit', campaign)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Campaign
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('qr', campaign)}>
                                  <QrCode className="mr-2 h-4 w-4" />
                                  Generate QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAction('share', campaign)}>
                                  <Share2 className="mr-2 h-4 w-4" />
                                  Share Campaign
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {campaign.status === 'paused' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCampaignAction(campaign.id, 'activate')}
                                    className="text-green-600"
                                    disabled={saving}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate Campaign
                                  </DropdownMenuItem>
                                )}
                                {campaign.status === 'active' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCampaignAction(campaign.id, 'pause')}
                                    className="text-yellow-600"
                                    disabled={saving}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Pause Campaign
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => handleAction('delete', campaign)}
                                  className="text-red-600"
                                  disabled={saving}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Campaign
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="analytics">
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analytics Available</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Analytics will appear here once you create and start using promotional campaigns.
              </p>
              <Button onClick={() => setShowCreateModal(true)} size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Performance</CardTitle>
                  <CardDescription>Revenue and conversion metrics by campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.top_promotions?.length > 0 ? (
                      analytics.top_promotions.map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-muted-foreground">{campaign.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(campaign.revenue)}</p>
                            <p className="text-sm text-muted-foreground">{campaign.conversions} conversions</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No performance data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Status Distribution</CardTitle>
                  <CardDescription>Overview of campaign statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.status_distribution?.length > 0 ? (
                      analytics.status_distribution.map(({ status, count }) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={statusColors[status]}>
                              {status}
                            </Badge>
                          </div>
                          <span className="font-medium">{count} campaigns</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No status data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Campaign Modal */}
      <EditCampaignModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        campaign={selectedCampaign}
      />

      {/* View Campaign Modal */}
      <ViewCampaignModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        campaign={selectedCampaign}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        campaign={selectedCampaign}
      />

      {/* Share Campaign Modal */}
      <ShareCampaignModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        campaign={selectedCampaign}
      />

      {/* Delete Campaign Modal */}
      <DeleteCampaignModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCampaign}
        campaign={selectedCampaign}
        isDeleting={isDeleting}
      />
    </div>
  )
}

