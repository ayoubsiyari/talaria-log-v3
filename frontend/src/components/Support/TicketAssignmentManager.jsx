import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Clock, 
  BarChart3, 
  History, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { supportService } from '@/services/supportService';
import { toast } from 'sonner';

const TicketAssignmentManager = ({ tickets: propTickets, agents: propAgents, onAssignmentChange }) => {
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignmentReason, setAssignmentReason] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [workloadData, setWorkloadData] = useState([]);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showWorkloadDialog, setShowWorkloadDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedTicketForHistory, setSelectedTicketForHistory] = useState(null);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadWorkloadData();
  }, []);

  // Handle props if provided
  useEffect(() => {
    if (propTickets) {
      setTickets(propTickets);
    }
    if (propAgents) {
      setAgents(propAgents);
    }
  }, [propTickets, propAgents]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load tickets if not provided as props
      if (!propTickets) {
        const ticketsResponse = await supportService.getTickets();
        if (ticketsResponse.data.success) {
          setTickets(ticketsResponse.data.tickets);
        }
      }
      
      // Load agents if not provided as props
      if (!propAgents) {
        const agentsResponse = await supportService.getAgents();
        if (agentsResponse.data.success) {
          setAgents(agentsResponse.data.agents);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkloadData = async () => {
    try {
      const response = await supportService.getAgentWorkload();
      if (response.data.success) {
        setWorkloadData(response.data.workload);
      }
    } catch (error) {
      console.error('Error loading workload data:', error);
      toast.error('Failed to load workload data');
    }
  };

  const handleTicketSelection = (ticketId, checked) => {
    if (checked) {
      setSelectedTickets(prev => [...prev, ticketId]);
    } else {
      setSelectedTickets(prev => prev.filter(id => id !== ticketId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedTickets(tickets && Array.isArray(tickets) ? tickets.map(ticket => ticket.id) : []);
    } else {
      setSelectedTickets([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) {
      toast.error('Please select tickets to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedTickets.length} ticket(s)? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await supportService.bulkDelete(selectedTickets);
      if (response.data.success) {
        toast.success(`Successfully deleted ${selectedTickets.length} ticket(s)`);
        setSelectedTickets([]);
        loadData(); // Refresh the data
        onAssignmentChange?.(); // Notify parent component
      }
    } catch (error) {
      console.error('Error deleting tickets:', error);
      toast.error('Failed to delete tickets');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssignTickets = async () => {
    if (!selectedAgent || selectedTickets.length === 0) {
      toast.error('Please select an agent and tickets');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await supportService.bulkAssignTickets(
        selectedTickets, 
        parseInt(selectedAgent), 
        assignmentReason
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        setSelectedTickets([]);
        setSelectedAgent('');
        setAssignmentReason('');
        setShowAssignmentDialog(false);
        onAssignmentChange?.();
      }
    } catch (error) {
      console.error('Error assigning tickets:', error);
      toast.error('Failed to assign tickets');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    setIsAutoAssigning(true);
    try {
      const response = await supportService.autoAssignTickets();
      if (response.data.success) {
        toast.success(response.data.message);
        onAssignmentChange?.();
      }
    } catch (error) {
      console.error('Error auto-assigning tickets:', error);
      toast.error('Failed to auto-assign tickets');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  const handleUnassignTicket = async (ticketId) => {
    try {
      const response = await supportService.unassignTicket(ticketId, 'Manual unassignment');
      if (response.data.success) {
        toast.success('Ticket unassigned successfully');
        onAssignmentChange?.();
      }
    } catch (error) {
      console.error('Error unassigning ticket:', error);
      toast.error('Failed to unassign ticket');
    }
  };

  const handleViewHistory = async (ticketId) => {
    setSelectedTicketForHistory(ticketId);
    try {
      const response = await supportService.getAssignmentHistory(ticketId);
      if (response.data.success) {
        setAssignmentHistory(response.data.history);
        setShowHistoryDialog(true);
      }
    } catch (error) {
      console.error('Error loading assignment history:', error);
      toast.error('Failed to load assignment history');
    }
  };

  const unassignedTickets = tickets && Array.isArray(tickets) ? tickets.filter(ticket => !ticket.assigned_to) : [];
  const assignedTickets = tickets && Array.isArray(tickets) ? tickets.filter(ticket => ticket.assigned_to) : [];

  const getWorkloadColor = (workload) => {
    if (workload <= 3) return 'text-green-600';
    if (workload <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadStatus = (workload) => {
    if (workload <= 3) return 'Low';
    if (workload <= 7) return 'Medium';
    return 'High';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assignment Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ticket Assignment Management
          </CardTitle>
          <CardDescription>
            Manage ticket assignments, view workload, and track assignment history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
              <DialogTrigger asChild>
                <Button disabled={selectedTickets.length === 0}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Selected ({selectedTickets.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Tickets</DialogTitle>
                  <DialogDescription>
                    Assign {selectedTickets.length} selected tickets to a support agent
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agent">Select Agent</Label>
                    <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agents && Array.isArray(agents) ? agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.full_name || agent.username} ({agent.username})
                          </SelectItem>
                        )) : (
                          <SelectItem value="" disabled>No agents available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason">Assignment Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Why are you assigning these tickets?"
                      value={assignmentReason}
                      onChange={(e) => setAssignmentReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignTickets} disabled={!selectedAgent || isAssigning}>
                    {isAssigning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Tickets'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline" 
              onClick={handleAutoAssign}
              disabled={unassignedTickets.length === 0 || isAutoAssigning}
            >
              {isAutoAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Auto-assigning...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-assign ({unassignedTickets.length})
                </>
              )}
            </Button>

                         <Button 
               variant="outline" 
               onClick={() => setShowWorkloadDialog(true)}
             >
               <BarChart3 className="h-4 w-4 mr-2" />
               View Workload
             </Button>

             {selectedTickets.length > 0 && (
               <Button 
                 variant="destructive" 
                 onClick={handleBulkDelete}
                 disabled={isDeleting}
               >
                 {isDeleting ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                     Deleting...
                   </>
                 ) : (
                   <>
                     <XCircle className="h-4 w-4 mr-2" />
                     Delete Selected ({selectedTickets.length})
                   </>
                 )}
               </Button>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{unassignedTickets.length}</div>
              <div className="text-sm text-muted-foreground">Unassigned Tickets</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{assignedTickets.length}</div>
              <div className="text-sm text-muted-foreground">Assigned Tickets</div>
            </div>
                         <div className="text-center p-4 border rounded-lg">
               <div className="text-2xl font-bold text-purple-600">{agents && Array.isArray(agents) ? agents.length : 0}</div>
               <div className="text-sm text-muted-foreground">Available Agents</div>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Assignment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                             <Checkbox
                 checked={selectedTickets.length === (tickets && Array.isArray(tickets) ? tickets.length : 0) && (tickets && Array.isArray(tickets) ? tickets.length : 0) > 0}
                 onCheckedChange={handleSelectAll}
               />
              <span className="text-sm">Select All</span>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Select</TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets && Array.isArray(tickets) ? tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTickets.includes(ticket.id)}
                        onCheckedChange={(checked) => handleTicketSelection(ticket.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">{ticket.ticket_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">{ticket.subject}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        ticket.status === 'open' ? 'default' :
                        ticket.status === 'in_progress' ? 'secondary' :
                        ticket.status === 'resolved' ? 'outline' : 'destructive'
                      }>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        ticket.priority === 'urgent' ? 'destructive' :
                        ticket.priority === 'high' ? 'default' :
                        ticket.priority === 'medium' ? 'secondary' : 'outline'
                      }>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_admin ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {ticket.assigned_admin.username?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{ticket.assigned_admin.full_name}</div>
                            <div className="text-xs text-muted-foreground">{ticket.assigned_admin.username}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewHistory(ticket.id)}
                        >
                          <History className="h-3 w-3" />
                        </Button>
                        {ticket.assigned_to && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnassignTicket(ticket.id)}
                          >
                            <UserMinus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tickets available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Workload Dialog */}
      <Dialog open={showWorkloadDialog} onOpenChange={setShowWorkloadDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Agent Workload Statistics</DialogTitle>
            <DialogDescription>
              View current workload and performance metrics for all support agents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Stats</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workloadData && Array.isArray(workloadData) ? workloadData.map((agent) => (
                    <Card key={agent.agent_id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{agent.agent_name}</CardTitle>
                        <CardDescription>{agent.agent_email}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Active Workload</span>
                          <Badge className={getWorkloadColor(agent.active_workload)}>
                            {getWorkloadStatus(agent.active_workload)}
                          </Badge>
                        </div>
                        <Progress 
                          value={Math.min((agent.active_workload / 10) * 100, 100)} 
                          className="h-2"
                        />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Open:</span> {agent.open_tickets}
                          </div>
                          <div>
                            <span className="text-muted-foreground">In Progress:</span> {agent.in_progress_tickets}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Resolved:</span> {agent.resolved_tickets}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Response:</span> {agent.avg_response_time_hours}h
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="col-span-full text-center text-muted-foreground">
                      No workload data available
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="detailed">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Open</TableHead>
                      <TableHead>In Progress</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead>Closed</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Avg Response (h)</TableHead>
                      <TableHead>Last 30 Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workloadData && Array.isArray(workloadData) ? workloadData.map((agent) => (
                      <TableRow key={agent.agent_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{agent.agent_name}</div>
                            <div className="text-sm text-muted-foreground">{agent.agent_username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.open_tickets > 5 ? 'destructive' : 'default'}>
                            {agent.open_tickets}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.in_progress_tickets > 3 ? 'destructive' : 'secondary'}>
                            {agent.in_progress_tickets}
                          </Badge>
                        </TableCell>
                        <TableCell>{agent.resolved_tickets}</TableCell>
                        <TableCell>{agent.closed_tickets}</TableCell>
                        <TableCell className="font-medium">{agent.total_assigned}</TableCell>
                        <TableCell>{agent.avg_response_time_hours}</TableCell>
                        <TableCell>{agent.tickets_last_30_days}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No workload data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment History</DialogTitle>
            <DialogDescription>
              Track all assignment changes for ticket {selectedTicketForHistory}
            </DialogDescription>
          </DialogHeader>
                     <div className="space-y-4">
             {assignmentHistory && Array.isArray(assignmentHistory) && assignmentHistory.length === 0 ? (
              <Alert>
                <AlertDescription>No assignment history found for this ticket.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {assignmentHistory && Array.isArray(assignmentHistory) ? assignmentHistory.map((record, index) => (
                  <div key={record.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{record.assigned_to_name}</span>
                        <span className="text-muted-foreground">←</span>
                        <span className="text-muted-foreground">{record.previous_assignment_name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Assigned by {record.assigned_by_name} on {new Date(record.assigned_at).toLocaleString()}
                      </div>
                      {record.reason && (
                        <div className="text-sm text-muted-foreground">
                          Reason: {record.reason}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-muted-foreground">
                    No assignment history available
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketAssignmentManager;
