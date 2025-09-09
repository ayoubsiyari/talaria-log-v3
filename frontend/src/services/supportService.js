import api from '../config/api';

const SUPPORT_BASE_URL = '/support';

export const supportService = {
  // Get all support tickets
  getTickets: async (params = {}) => {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = queryString ? `${SUPPORT_BASE_URL}/tickets?${queryString}` : `${SUPPORT_BASE_URL}/tickets`;
      
      console.log('supportService.getTickets calling endpoint:', endpoint)
      const response = await api.get(endpoint);
      // Wrap the response to match axios-like structure
      return { data: response };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },

  // Get a single ticket by ID
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/${ticketId}`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  // Create a new support ticket
  createTicket: async (ticketData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets`, ticketData);
      return { data: response };
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Update a support ticket
  updateTicket: async (ticketId, updateData) => {
    try {
      const response = await api.put(`${SUPPORT_BASE_URL}/tickets/${ticketId}`, updateData);
      return { data: response };
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  // Delete a support ticket
  deleteTicket: async (ticketId) => {
    try {
      const response = await api.delete(`${SUPPORT_BASE_URL}/tickets/${ticketId}`);
      return { data: response };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  // Add a message to a ticket
  addMessage: async (ticketId, messageData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/messages`, messageData);
      return { data: response };
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  // Get support categories
  getCategories: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/categories`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/categories`, categoryData);
      return { data: response };
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update a category
  updateCategory: async (categoryId, updateData) => {
    try {
      const response = await api.put(`${SUPPORT_BASE_URL}/categories/${categoryId}`, updateData);
      return { data: response };
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Rate a support ticket
  rateTicket: async (ticketId, ratingData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/rate`, ratingData);
      return { data: response };
    } catch (error) {
      console.error('Error rating ticket:', error);
      throw error;
    }
  },

  // Get support agent statistics
  getSupportAgentStats: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/agents/stats`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching support agent stats:', error);
      throw error;
    }
  },

  // Delete a category
  deleteCategory: async (categoryId) => {
    try {
      const response = await api.delete(`${SUPPORT_BASE_URL}/categories/${categoryId}`);
      return { data: response };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // Get ticket statistics
  getStats: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/stats`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Upload attachment
  uploadAttachment: async (ticketId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { data: response };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      throw error;
    }
  },

  // Get attachments for a ticket
  getAttachments: async (ticketId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/${ticketId}/attachments`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  },

  // Download attachment
  downloadAttachment: async (ticketId, attachmentId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/${ticketId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      return { data: response };
    } catch (error) {
      console.error('Error downloading attachment:', error);
      throw error;
    }
  },

  // Delete attachment
  deleteAttachment: async (ticketId, attachmentId) => {
    try {
      const response = await api.delete(`${SUPPORT_BASE_URL}/tickets/${ticketId}/attachments/${attachmentId}`);
      return { data: response };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw error;
    }
  },

  // Assign ticket to agent
  assignTicket: async (ticketId, agentId, reason = '') => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/assign`, { 
        assigned_to: agentId,
        reason: reason
      });
      return { data: response };
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  },

  // Unassign ticket
  unassignTicket: async (ticketId, reason = '') => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/unassign`, { 
        reason: reason
      });
      return { data: response };
    } catch (error) {
      console.error('Error unassigning ticket:', error);
      throw error;
    }
  },

  // Bulk assign tickets
  bulkAssignTickets: async (ticketIds, agentId, reason = '') => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/bulk-assign`, {
        ticket_ids: ticketIds,
        assigned_to: agentId,
        reason: reason
      });
      return { data: response };
    } catch (error) {
      console.error('Error bulk assigning tickets:', error);
      throw error;
    }
  },

  // Auto assign tickets
  autoAssignTickets: async (options = {}) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/auto-assign`, options);
      return { data: response };
    } catch (error) {
      console.error('Error auto assigning tickets:', error);
      throw error;
    }
  },

  // Get assignment history for a ticket
  getAssignmentHistory: async (ticketId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/${ticketId}/assignment-history`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  },

  // Get agent workload statistics
  getAgentWorkload: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/agents/workload`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching agent workload:', error);
      throw error;
    }
  },

  // Change ticket status
  changeStatus: async (ticketId, status) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/${ticketId}/status`, { status });
      return { data: response };
    } catch (error) {
      console.error('Error changing status:', error);
      throw error;
    }
  },

  // Get ticket history
  getTicketHistory: async (ticketId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/${ticketId}/history`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching ticket history:', error);
      throw error;
    }
  },

  // Search tickets
  searchTickets: async (searchQuery, filters = {}) => {
    try {
      const params = { q: searchQuery, ...filters };
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/search`, { params });
      return { data: response };
    } catch (error) {
      console.error('Error searching tickets:', error);
      throw error;
    }
  },

  // Bulk operations
  bulkUpdate: async (ticketIds, updateData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/bulk-update`, {
        ticket_ids: ticketIds,
        ...updateData
      });
      return { data: response };
    } catch (error) {
      console.error('Error bulk updating tickets:', error);
      throw error;
    }
  },

  bulkDelete: async (ticketIds) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/tickets/bulk-delete`, {
        ticket_ids: ticketIds
      });
      return { data: response };
    } catch (error) {
      console.error('Error bulk deleting tickets:', error);
      throw error;
    }
  },

  // Export tickets
  exportTickets: async (filters = {}, format = 'csv') => {
    try {
      const params = { format, ...filters };
      const response = await api.get(`${SUPPORT_BASE_URL}/tickets/export`, {
        params,
        responseType: 'blob'
      });
      return { data: response };
    } catch (error) {
      console.error('Error exporting tickets:', error);
      throw error;
    }
  },

  // Get support agents
  getAgents: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/agents`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    }
  },

  // Get agent workload
  getAgentWorkload: async (agentId) => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/agents/${agentId}/workload`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching agent workload:', error);
      throw error;
    }
  },

  // Get ticket templates
  getTemplates: async () => {
    try {
      const response = await api.get(`${SUPPORT_BASE_URL}/templates`);
      return { data: response };
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Create ticket from template
  createFromTemplate: async (templateId, ticketData) => {
    try {
      const response = await api.post(`${SUPPORT_BASE_URL}/templates/${templateId}/create-ticket`, ticketData);
      return { data: response };
    } catch (error) {
      console.error('Error creating ticket from template:', error);
      throw error;
    }
  }
};

export default supportService;
