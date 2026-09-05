import api from './api';

const crmApi = {
  // Customers
  getCustomers: async () => {
    const response = await api.get('/customers/');
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/customers/orders');
    return response.data;
  },
  getCustomersBySegment: async (segment) => {
    const response = await api.get('/customers/by-segment', { params: { segment } });
    return response.data;
  },
  createCustomer: async (customerData) => {
    const response = await api.post('/customers/', customerData);
    return response.data;
  },
  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },
  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  importCustomers: async (customersList) => {
    const response = await api.post('/customers/import', customersList);
    return response.data;
  },

  // Audience Builder
  queryAudience: async (prompt) => {
    const response = await api.post('/audience/', { prompt });
    return response.data;
  },

  // Campaigns
  getCampaigns: async () => {
    const response = await api.get('/campaigns/');
    return response.data;
  },
  generateCampaign: async (goal, segment, channel) => {
    const response = await api.post('/campaigns/generate', { goal, segment, channel });
    return response.data;
  },
  sendCampaign: async (campaignId) => {
    const response = await api.post(`/campaigns/${campaignId}/send`);
    return response.data;
  },
  scheduleCampaign: async (campaignId, scheduledTime) => {
    const response = await api.post(`/campaigns/${campaignId}/schedule`, { scheduled_time: scheduledTime });
    return response.data;
  },
  cancelCampaign: async (campaignId) => {
    const response = await api.post(`/campaigns/${campaignId}/cancel`);
    return response.data;
  },
  getCampaignPerformance: async (campaignId) => {
    const response = await api.get(`/campaigns/${campaignId}/performance`);
    return response.data;
  },
  generateRecoveryWorkflow: async (audienceSegment, objective, channel, goal) => {
    const response = await api.post('/campaigns/recovery-workflow', {
      audience_segment: audienceSegment,
      objective: objective,
      channel: channel,
      goal: goal
    });
    return response.data;
  },
  executeRecoveryCampaign: async (campaignName, objective, targetSegment, channel, customerIds, simulateRecovery = true) => {
    const response = await api.post('/campaigns/execute-recovery', {
      campaign_name: campaignName,
      objective: objective,
      target_segment: targetSegment,
      channel: channel,
      customer_ids: customerIds,
      simulate_recovery: simulateRecovery
    });
    return response.data;
  },

  // Analytics
  getAnalytics: async () => {
    const response = await api.get('/analytics/stats');
    return response.data;
  },

  // Copilot
  getCopilotConversations: async () => {
    const response = await api.get('/copilot/conversations');
    return response.data;
  },
  getCopilotMessages: async (conversationId) => {
    const response = await api.get(`/copilot/conversations/${conversationId}/messages`);
    return response.data;
  },
  createCopilotConversation: async (title = 'New Chat') => {
    const response = await api.post('/copilot/conversations', { title });
    return response.data;
  },
  queryCopilot: async (message, conversationId = null) => {
    const response = await api.post('/copilot/query', { message, conversation_id: conversationId });
    return response.data;
  },
  deleteCopilotConversation: async (conversationId) => {
    const response = await api.delete(`/copilot/conversations/${conversationId}`);
    return response.data;
  },

  // Negotiations
  getNegotiations: async () => {
    const response = await api.get('/negotiations/');
    return response.data;
  },
  startNegotiation: async (negotiationData) => {
    const response = await api.post('/negotiations/start', negotiationData);
    return response.data;
  },
  sendNegotiationMessage: async (id, message, offer, strategy) => {
    const response = await api.post(`/negotiations/${id}/message`, { message, offer, strategy });
    return response.data;
  },
  stopNegotiation: async (id) => {
    const response = await api.post(`/negotiations/${id}/stop`);
    return response.data;
  },

  generateFakeCustomers: async (count, city) => {
    const payload = { count };
    if (city) payload.city = city;
    const response = await api.post('/customers/generate', payload);
    return response.data;
  },

  // Database Seeding
  seedDatabase: async () => {
    const response = await api.post('/testing/seed');
    return response.data;
  },

  // Webhook Callback
  triggerWebhook: async (webhookPayload) => {
    const response = await api.post('/webhook/callback', webhookPayload);
    return response.data;
  },

  // Auth / Quotas
  getAiUsage: async () => {
    const response = await api.get('/auth/ai-usage');
    return response.data;
  },

  // Revenue Recovery
  getRecoveryDashboard: async () => {
    const response = await api.get('/recovery/dashboard');
    return response.data;
  },
  getRecoveryQueue: async () => {
    const response = await api.get('/recovery/queue');
    return response.data;
  },
  approveRecoveryAction: async (customerId, actionType, forceFail = false) => {
    const response = await api.post('/recovery/action/approve', {
      customer_id: customerId,
      action_type: actionType,
      force_fail: forceFail
    });
    return response.data;
  },
  approveRecoveryBatch: async (customerIds, simulateRecovery = true) => {
    const response = await api.post('/recovery/batch/approve', {
      customer_ids: customerIds,
      simulate_recovery: simulateRecovery
    });
    return response.data;
  },
  getBatchHistory: async () => {
    const response = await api.get('/recovery/batch/history');
    return response.data;
  },
  getBatchDetails: async (batchId) => {
    const response = await api.get(`/recovery/batch/${batchId}`);
    return response.data;
  },
  registerPromiseToPay: async (customerId, amount, promiseDate, notes = '') => {
    const response = await api.post(`/recovery/customer/${customerId}/ptp`, {
      amount: amount,
      promise_date: promiseDate,
      notes: notes
    });
    return response.data;
  },
  cancelPromiseToPay: async (customerId) => {
    const response = await api.post(`/recovery/customer/${customerId}/ptp/cancel`);
    return response.data;
  },
  simulatePaymentSuccess: async (customerId, amount) => {
    const response = await api.post('/recovery/action/simulate-payment', {
      customer_id: customerId,
      amount: amount
    });
    return response.data;
  },
  getRecoveryAudits: async () => {
    const response = await api.get('/recovery/audits');
    return response.data;
  },
  getRecoveryAuditDetail: async (auditId) => {
    const response = await api.get(`/recovery/audit/${auditId}`);
    return response.data;
  },
};

export default crmApi;
