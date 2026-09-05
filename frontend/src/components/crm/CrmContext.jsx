import React, { createContext, useContext, useState, useEffect } from 'react';
import crmApi from '../../api/crmApi';
import { useAuth } from '../auth/AuthContext';

const CrmContext = createContext();

export function CrmProvider({ children }) {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recoveryDashboard, setRecoveryDashboard] = useState(null);
  const [recoveryQueue, setRecoveryQueue] = useState([]);
  const [recoveryAudits, setRecoveryAudits] = useState([]);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const { user } = useAuth();

  const normalizeCustomers = (data) => {
    if (!data) return [];
    return data.map(c => {
      const totalSpend = Number(c.total_spend || c.totalSpend || 0);
      const avgOrderValue = totalSpend > 0 ? Math.round(totalSpend / 3) : 0;
      
      // Dynamic Channel Selection Heuristic
      const preferredChannel = c.preferredChannel || (c.phone ? "WhatsApp" : "Email");
      
      // Dynamic RFM Propensity Score Heuristic
      let propensity = 50;
      if (totalSpend > 50000) propensity += 20;
      else if (totalSpend > 10000) propensity += 10;
      
      if (c.last_purchase) {
        const lastDate = new Date(c.last_purchase);
        const refDate = new Date("2026-06-12");
        const diffDays = Math.floor((refDate - lastDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) propensity += 25;
        else if (diffDays <= 90) propensity += 15;
        else if (diffDays > 180) propensity -= 15;
      }
      propensity = Math.min(100, Math.max(0, propensity));
      
      const status = propensity > 80 ? "High Propensity" : (propensity > 60 ? "Medium Propensity" : "Low Propensity");

      return {
        ...c,
        id: String(c.id),
        name: c.name || '',
        email: c.email || '',
        phone: c.phone || '',
        city: c.city || '',
        total_spend: totalSpend,
        totalSpend: totalSpend,
        averageOrderValue: avgOrderValue,
        last_purchase: c.last_purchase,
        lastPurchaseDate: c.last_purchase || '',
        preferredChannel: preferredChannel,
        propensity: propensity,
        status: status,
        segment: c.segment || 'New Customers',
        registrationDate: c.created_at ? c.created_at.split('T')[0] : '2026-01-01',

        // credit fields:
        creditLimit: Number(c.credit_limit || 0),
        totalCreditIssued: Number(c.total_credit_issued || 0),
        totalAmountPaid: Number(c.total_amount_paid || 0),
        outstandingAmount: Number(c.outstanding_amount || 0),
        currentDueAmount: Number(c.current_due_amount || 0),
        overdueAmount: Number(c.overdue_amount || 0),
        nextDueDate: c.next_due_date || null,
        numberOfDelayedPayments: Number(c.number_of_delayed_payments || 0),
        averagePaymentDelay: Number(c.average_payment_delay || 0),
        paymentReliability: c.payment_reliability || 'High',
        previousPaymentBehavior: c.previous_payment_behavior || '',
        recoveryHistory: c.recovery_history || '',
        aiRiskScore: Number(c.ai_risk_score || 0),
        aiRiskLevel: c.ai_risk_level || 'Low',
        aiRiskExplanation: c.ai_risk_explanation || '',
        aiRecommendedAction: c.ai_recommended_action || 'No Action',
        aiRecommendedReason: c.ai_recommended_reason || '',

        // Promise-to-Pay (PTP) Fields:
        promiseToPayStatus: c.promise_to_pay_status || null,
        promiseToPayDate: c.promise_to_pay_date || null,
        promiseToPayAmount: Number(c.promise_to_pay_amount || 0),
        promiseToPayNotes: c.promise_to_pay_notes || ''
      };
    });
  };

  const normalizeOrders = (data) => {
    if (!data) return [];
    return data.map(o => {
      const orderValue = Number(o.total_amount || o.unit_price || o.orderValue || 0);
      return {
        ...o,
        customerId: String(o.customer_id),
        orderValue: orderValue,
        productName: o.product_name || o.productName || '',
        productCategory: o.category || o.productCategory || 'General',
        orderNumber: o.order_number || o.orderNumber || '',
        purchaseDate: o.purchase_date || o.created_at || o.purchaseDate || '',
      };
    });
  };

  const normalizeCampaigns = (data) => {
    if (!data) return [];
    return data.map((c, idx) => {
      // Pull directly from backend database event counts
      const sent = Number(c.sent ?? c.audience_size ?? 0);
      const delivered = Number(c.delivered ?? 0);
      const opened = Number(c.opened ?? 0);
      const clicked = Number(c.clicked ?? 0);
      const purchased = Number(c.purchased ?? 0);
      const revenue = Number(c.revenue || c.revenueImpact || 0);
      const revenueImpact = c.revenueImpact !== undefined ? c.revenueImpact : revenue;
      const audience = c.target_segment || c.audience || (c.campaign_name && c.campaign_name.split(' ').slice(0, 2).join(' ') + ' Segment') || 'Target Segment';
      
      const lowerChan = (c.channel || '').toLowerCase();
      const normalizedChannel = lowerChan === 'whatsapp' ? 'WhatsApp' : (lowerChan === 'email' ? 'Email' : (lowerChan === 'sms' ? 'SMS' : c.channel || 'WhatsApp'));

      return {
        ...c,
        campaignName: c.campaignName || c.campaign_name || 'Campaign Draft',
        audience: audience,
        sent: sent,
        delivered: delivered,
        opened: opened,
        clicked: clicked,
        purchased: purchased,
        revenueImpact: revenueImpact,
        channel: normalizedChannel,
        status: c.status || 'Completed',
      };
    });
  };

  const refreshRecoveryData = async () => {
    if (!user) return;
    setRecoveryLoading(true);
    try {
      const [dash, queue, audits] = await Promise.all([
        crmApi.getRecoveryDashboard(),
        crmApi.getRecoveryQueue(),
        crmApi.getRecoveryAudits()
      ]);
      setRecoveryDashboard(dash);
      setRecoveryQueue(queue);
      setRecoveryAudits(audits);
    } catch (error) {
      console.error("Failed to refresh recovery data:", error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const refreshCrmData = async () => {
    if (!user) return;
    try {
      const [custData, campData, orderData] = await Promise.all([
        crmApi.getCustomers(),
        crmApi.getCampaigns(),
        crmApi.getOrders(),
      ]);
      setCustomers(normalizeCustomers(custData));
      setCampaigns(normalizeCampaigns(campData));
      setOrders(normalizeOrders(orderData));
    } catch (error) {
      console.error("Failed to load CRM data from API:", error);
    }
  };

  const refreshAllData = async () => {
    if (!user) return;
    setRecoveryLoading(true);
    try {
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
    } catch (error) {
      console.error("Failed to refresh all data:", error);
    } finally {
      setRecoveryLoading(false);
    }
  };

  const approveRecoveryAction = async (customerId, actionType, forceFail = false) => {
    try {
      const result = await crmApi.approveRecoveryAction(customerId, actionType, forceFail);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to approve recovery action:", error);
      const errMsg = error.response?.data?.detail || "Action execution failed.";
      return { success: false, error: errMsg };
    }
  };

  const simulatePaymentSuccess = async (customerId, amount) => {
    try {
      const result = await crmApi.simulatePaymentSuccess(customerId, amount);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to simulate payment success:", error);
      const errMsg = error.response?.data?.detail || "Payment simulation failed.";
      return { success: false, error: errMsg };
    }
  };

  const approveRecoveryBatch = async (customerIds, simulateRecovery = true) => {
    try {
      const result = await crmApi.approveRecoveryBatch(customerIds, simulateRecovery);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to approve recovery batch:", error);
      const errMsg = error.response?.data?.detail || "Batch recovery execution failed.";
      return { success: false, error: errMsg };
    }
  };

  const registerPromiseToPay = async (customerId, amount, promiseDate, notes = '') => {
    try {
      const result = await crmApi.registerPromiseToPay(customerId, amount, promiseDate, notes);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to register Promise to Pay:", error);
      const errMsg = error.response?.data?.detail || "Promise to Pay registration failed.";
      return { success: false, error: errMsg };
    }
  };

  const cancelPromiseToPay = async (customerId) => {
    try {
      const result = await crmApi.cancelPromiseToPay(customerId);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to cancel Promise to Pay:", error);
      const errMsg = error.response?.data?.detail || "Promise to Pay cancellation failed.";
      return { success: false, error: errMsg };
    }
  };

  // Load CRM data on login or authentication change
  useEffect(() => {
    async function loadCrmData() {
      setLoading(true);
      await Promise.all([
        refreshCrmData(),
        refreshRecoveryData()
      ]);
      setLoading(false);
    }
    loadCrmData();
  }, [user]);

  // Real-time polling: refresh every 2s while any campaign is Running
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'Running');
    if (!hasRunning) return;
    const interval = setInterval(() => {
      refreshCrmData();
    }, 2000);
    return () => clearInterval(interval);
  }, [campaigns]);

  const addCustomer = async (customerData) => {
    try {
      // Map frontend fields back to backend format
      const payload = {
        name: `${customerData.firstName} ${customerData.lastName}`,
        email: customerData.email,
        phone: customerData.phone,
        city: customerData.city,
        total_spend: Number(customerData.totalSpend || 0),
        segment: customerData.segment,
        last_purchase: customerData.lastPurchaseDate || null
      };
      const newCustomer = await crmApi.createCustomer(payload);
      setCustomers(prev => normalizeCustomers([newCustomer, ...prev]));
      return { success: true, customer: newCustomer };
    } catch (error) {
      console.error("Failed to create customer:", error);
      const errMsg = error.response?.data?.detail || "Failed to create customer.";
      return { success: false, error: errMsg };
    }
  };

  const updateCustomer = async (id, updatedData) => {
    try {
      // Map frontend fields back to backend format
      const payload = {
        name: `${updatedData.firstName} ${updatedData.lastName}`,
        email: updatedData.email,
        phone: updatedData.phone,
        city: updatedData.city,
        total_spend: Number(updatedData.totalSpend || 0),
        segment: updatedData.segment,
        last_purchase: updatedData.lastPurchaseDate || null
      };
      const updated = await crmApi.updateCustomer(id, payload);
      setCustomers(prev => normalizeCustomers(prev.map(c => c.id === String(id) ? updated : c)));
      return { success: true };
    } catch (error) {
      console.error("Failed to update customer:", error);
      const errMsg = error.response?.data?.detail || "Failed to update customer.";
      return { success: false, error: errMsg };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await crmApi.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== String(id)));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete customer:", error);
      return { success: false };
    }
  };

  const importCustomers = async (newCustomersList) => {
    try {
      // Map bulk records back to backend format
      const payload = newCustomersList.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone || '',
        city: c.city || '',
        total_spend: Number(c.totalSpend || 0),
        segment: c.segment || 'New Customers',
        last_purchase: c.lastPurchaseDate || null
      }));
      const res = await crmApi.importCustomers(payload);
      await refreshCrmData();
      return {
        success: true,
        importedCount: res.imported,
        duplicateCount: 0,
        invalidCount: 0
      };
    } catch (error) {
      console.error("Failed to bulk import customers:", error);
      return { success: false, error: "Bulk import failed." };
    }
  };

  const addCampaign = (campaignData) => {
    setCampaigns(prev => normalizeCampaigns([campaignData, ...prev]));
  };

  const cancelCampaign = async (id) => {
    try {
      const res = await crmApi.cancelCampaign(id);
      await refreshCrmData();
      return { success: true, message: res.message };
    } catch (error) {
      console.error("Failed to cancel campaign:", error);
      const errMsg = error.response?.data?.detail || "Failed to cancel campaign.";
      return { success: false, error: errMsg };
    }
  };

  const generateFakeCustomers = async (count, city) => {
    try {
      const res = await crmApi.generateFakeCustomers(count, city);
      await refreshCrmData();
      return { success: true, count: res.count };
    } catch (error) {
      console.error("Failed to generate fake customers:", error);
      const errMsg = error.response?.data?.detail || "Failed to generate demo customers.";
      return { success: false, error: errMsg };
    }
  };

  const triggerSeed = async () => {
    setLoading(true);
    try {
      await crmApi.seedDatabase();
      await refreshCrmData();
      return { success: true };
    } catch (error) {
      console.error("Database seeding failed:", error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // State Persistence Hooks for each workflow/page
  const [campaignStudioState, setCampaignStudioState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_campaign_studio');
      return saved ? JSON.parse(saved) : {
        audience: 'Dormant Customers',
        channel: 'whatsapp',
        goal: 'Winback dormant champions with a premium incentive.',
        campaign: null
      };
    } catch {
      return {
        audience: 'Dormant Customers',
        channel: 'whatsapp',
        goal: 'Winback dormant champions with a premium incentive.',
        campaign: null
      };
    }
  });

  const [audienceBuilderState, setAudienceBuilderState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_audience_builder');
      return saved ? JSON.parse(saved) : {
        prompt: 'Show customers inactive for 60 days who spent more than ₹5000.',
        result: null
      };
    } catch {
      return {
        prompt: 'Show customers inactive for 60 days who spent more than ₹5000.',
        result: null
      };
    }
  });

  const [copilotState, setCopilotState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_copilot');
      return saved ? JSON.parse(saved) : {
        messages: [
          { role: 'assistant', text: "Hello! I am your Payzor AI Financial Copilot. Ask me anything about your receivables ledger, delinquent accounts, cohort recovery strategies, or automated dunning ROI. What would you like to achieve today?" }
        ],
        input: ''
      };
    } catch {
      return {
        messages: [
          { role: 'assistant', text: "Hello! I am your Payzor AI Financial Copilot. Ask me anything about your receivables ledger, delinquent accounts, cohort recovery strategies, or automated dunning ROI. What would you like to achieve today?" }
        ],
        input: ''
      };
    }
  });

  const [negotiatorState, setNegotiatorState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_negotiator');
      return saved ? JSON.parse(saved) : {
        selectedCustomerId: '',
        negotiationId: null,
        customerName: 'John Doe',
        phoneNumber: '+91 98765 43210',
        productName: 'Nike Air Max 90',
        productCategory: 'Footwear',
        originalPrice: 9999,
        marginFloorPrice: 6999,
        maxDiscountPercent: 30,
        strategy: 'Balanced',
        negotiationActive: false,
        messages: [],
        inputText: '',
        turns: 0,
        currentOffer: 9999,
        status: 'Active',
        probability: 45,
        logs: [],
        insights: [],
        hasFreeShipping: false
      };
    } catch {
      return {
        selectedCustomerId: '',
        negotiationId: null,
        customerName: 'John Doe',
        phoneNumber: '+91 98765 43210',
        productName: 'Nike Air Max 90',
        productCategory: 'Footwear',
        originalPrice: 9999,
        marginFloorPrice: 6999,
        maxDiscountPercent: 30,
        strategy: 'Balanced',
        negotiationActive: false,
        messages: [],
        inputText: '',
        turns: 0,
        currentOffer: 9999,
        status: 'Active',
        probability: 45,
        logs: [],
        insights: [],
        hasFreeShipping: false
      };
    }
  });

  const [analyticsState, setAnalyticsState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_analytics');
      return saved ? JSON.parse(saved) : {
        dateRange: '30d',
        selectedChannel: 'all'
      };
    } catch {
      return {
        dateRange: '30d',
        selectedChannel: 'all'
      };
    }
  });

  const [customersState, setCustomersState] = useState(() => {
    try {
      const saved = localStorage.getItem('crm_customers');
      return saved ? JSON.parse(saved) : {
        search: '',
        selectedSegment: 'All',
        selectedStatus: 'All',
        selectedSpend: 'All',
        selectedCity: 'All',
        selectedRecency: 'All',
        sortField: 'spend',
        sortOrder: 'desc',
        currentPage: 1,
        pageSize: 25,
        selectedCustomerIdForDrawer: null,
        isAddOpen: false,
        isEditOpen: false,
        isDeleteOpen: false,
        isImportOpen: false,
        customerToDeleteId: null,
        customerToEditId: null,
        formValues: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'Female',
          dob: '',
          city: '',
          state: '',
          country: '',
          registrationDate: new Date().toISOString().split('T')[0],
          segment: 'New Customers',
          totalSpend: '0',
          averageOrderValue: '0',
          lastPurchaseDate: '',
          preferredChannel: 'WhatsApp',
          notes: ''
        },
        importStep: 1,
        importedData: [],
        validatedRecords: [],
        failedRecords: [],
        importProgress: 0
      };
    } catch {
      return {
        search: '',
        selectedSegment: 'All',
        selectedStatus: 'All',
        selectedSpend: 'All',
        selectedCity: 'All',
        selectedRecency: 'All',
        sortField: 'spend',
        sortOrder: 'desc',
        currentPage: 1,
        pageSize: 25,
        selectedCustomerIdForDrawer: null,
        isAddOpen: false,
        isEditOpen: false,
        isDeleteOpen: false,
        isImportOpen: false,
        customerToDeleteId: null,
        customerToEditId: null,
        formValues: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          gender: 'Female',
          dob: '',
          city: '',
          state: '',
          country: '',
          registrationDate: new Date().toISOString().split('T')[0],
          segment: 'New Customers',
          totalSpend: '0',
          averageOrderValue: '0',
          lastPurchaseDate: '',
          preferredChannel: 'WhatsApp',
          notes: ''
        },
        importStep: 1,
        importedData: [],
        validatedRecords: [],
        failedRecords: [],
        importProgress: 0
      };
    }
  });

  // Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('crm_campaign_studio', JSON.stringify(campaignStudioState));
  }, [campaignStudioState]);

  useEffect(() => {
    localStorage.setItem('crm_audience_builder', JSON.stringify(audienceBuilderState));
  }, [audienceBuilderState]);

  useEffect(() => {
    localStorage.setItem('crm_copilot', JSON.stringify(copilotState));
  }, [copilotState]);

  useEffect(() => {
    localStorage.setItem('crm_negotiator', JSON.stringify(negotiatorState));
  }, [negotiatorState]);

  useEffect(() => {
    localStorage.setItem('crm_analytics', JSON.stringify(analyticsState));
  }, [analyticsState]);

  useEffect(() => {
    localStorage.setItem('crm_customers', JSON.stringify(customersState));
  }, [customersState]);

  return (
    <CrmContext.Provider value={{
      customers,
      orders,
      campaigns,
      loading,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      importCustomers,
      addCampaign,
      cancelCampaign,
      generateFakeCustomers,
      triggerSeed,
      refreshCrmData,
      refreshAllData,
      campaignStudioState,
      setCampaignStudioState,
      audienceBuilderState,
      setAudienceBuilderState,
      copilotState,
      setCopilotState,
      negotiatorState,
      setNegotiatorState,
      analyticsState,
      setAnalyticsState,
      customersState,
      setCustomersState,
      
      // credit recovery:
      recoveryDashboard,
      recoveryQueue,
      recoveryAudits,
      recoveryLoading,
      refreshRecoveryData,
      approveRecoveryAction,
      approveRecoveryBatch,
      registerPromiseToPay,
      cancelPromiseToPay,
      simulatePaymentSuccess
    }}>
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error("useCrm must be used within a CrmProvider");
  }
  return context;
}
