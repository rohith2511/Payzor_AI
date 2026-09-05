import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ArrowUpDown, X, User, ShoppingBag, Brain, ShieldCheck,
  Plus, Upload, Download, Trash2, Edit3, AlertTriangle, CheckCircle, 
  Calendar, ChevronLeft, ChevronRight, Sparkles, DollarSign, Activity,
  FileText, MapPin, Mail, Phone, ChevronDown, Clock, MessageSquare, Send,
  ArrowRight, TrendingUp
} from 'lucide-react';
import { useCrm } from './CrmContext';

export default function CrmCustomers() {
  const { 
    customers, 
    orders, 
    campaigns, 
    loading, 
    addCustomer, 
    updateCustomer, 
    deleteCustomer, 
    importCustomers,
    generateFakeCustomers
  } = useCrm();

  // Form State
  const initialFormState = {
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
  };

  const { customersState, setCustomersState } = useCrm();
  const {
    search,
    selectedSegment,
    selectedStatus,
    selectedSpend,
    selectedCity,
    selectedRecency,
    sortField,
    sortOrder,
    currentPage,
    pageSize,
    selectedCustomerIdForDrawer,
    isAddOpen,
    isEditOpen,
    isDeleteOpen,
    isImportOpen,
    customerToDeleteId,
    customerToEditId,
    formValues,
    formErrors,
    importStep,
    importedData,
    validatedRecords,
    failedRecords,
    importProgress
  } = customersState;

  const setSearch = (val) => setCustomersState(prev => ({ ...prev, search: typeof val === 'function' ? val(prev.search) : val }));
  const setSelectedSegment = (val) => setCustomersState(prev => ({ ...prev, selectedSegment: typeof val === 'function' ? val(prev.selectedSegment) : val }));
  const setSelectedStatus = (val) => setCustomersState(prev => ({ ...prev, selectedStatus: typeof val === 'function' ? val(prev.selectedStatus) : val }));
  const setSelectedSpend = (val) => setCustomersState(prev => ({ ...prev, selectedSpend: typeof val === 'function' ? val(prev.selectedSpend) : val }));
  const setSelectedCity = (val) => setCustomersState(prev => ({ ...prev, selectedCity: typeof val === 'function' ? val(prev.selectedCity) : val }));
  const setSelectedRecency = (val) => setCustomersState(prev => ({ ...prev, selectedRecency: typeof val === 'function' ? val(prev.selectedRecency) : val }));
  const setSortField = (val) => setCustomersState(prev => ({ ...prev, sortField: typeof val === 'function' ? val(prev.sortField) : val }));
  const setSortOrder = (val) => setCustomersState(prev => ({ ...prev, sortOrder: typeof val === 'function' ? val(prev.sortOrder) : val }));
  const setCurrentPage = (val) => setCustomersState(prev => ({ ...prev, currentPage: typeof val === 'function' ? val(prev.currentPage) : val }));
  const setPageSize = (val) => setCustomersState(prev => ({ ...prev, pageSize: typeof val === 'function' ? val(prev.pageSize) : val }));

  // Drawer selected customer mapping
  const selectedCustomer = selectedCustomerIdForDrawer ? customers.find(c => String(c.id) === String(selectedCustomerIdForDrawer)) : null;
  const setSelectedCustomer = (cust) => setCustomersState(prev => ({ ...prev, selectedCustomerIdForDrawer: cust ? String(cust.id) : null }));

  const setIsAddOpen = (val) => setCustomersState(prev => ({ ...prev, isAddOpen: typeof val === 'function' ? val(prev.isAddOpen) : val }));
  const setIsEditOpen = (val) => setCustomersState(prev => ({ ...prev, isEditOpen: typeof val === 'function' ? val(prev.isEditOpen) : val }));
  const setIsDeleteOpen = (val) => setCustomersState(prev => ({ ...prev, isDeleteOpen: typeof val === 'function' ? val(prev.isDeleteOpen) : val }));
  const setIsImportOpen = (val) => setCustomersState(prev => ({ ...prev, isImportOpen: typeof val === 'function' ? val(prev.isImportOpen) : val }));

  // Map delete ID
  const customerToDelete = customerToDeleteId ? customers.find(c => String(c.id) === String(customerToDeleteId)) : null;
  const setCustomerToDelete = (cust) => setCustomersState(prev => ({ ...prev, customerToDeleteId: cust ? String(cust.id) : null }));

  // Map edit ID
  const customerToEdit = customerToEditId ? customers.find(c => String(c.id) === String(customerToEditId)) : null;
  const setCustomerToEdit = (cust) => setCustomersState(prev => ({ ...prev, customerToEditId: cust ? String(cust.id) : null }));

  const setFormValues = (val) => setCustomersState(prev => ({ ...prev, formValues: typeof val === 'function' ? val(prev.formValues) : val }));
  const setFormErrors = (val) => setCustomersState(prev => ({ ...prev, formErrors: typeof val === 'function' ? val(prev.formErrors) : val }));

  // CSV Import mapping
  const setImportStep = (val) => setCustomersState(prev => ({ ...prev, importStep: typeof val === 'function' ? val(prev.importStep) : val }));
  const setImportedData = (val) => setCustomersState(prev => ({ ...prev, importedData: typeof val === 'function' ? val(prev.importedData) : val }));
  const setValidatedRecords = (val) => setCustomersState(prev => ({ ...prev, validatedRecords: typeof val === 'function' ? val(prev.validatedRecords) : val }));
  const setFailedRecords = (val) => setCustomersState(prev => ({ ...prev, failedRecords: typeof val === 'function' ? val(prev.failedRecords) : val }));
  const setImportProgress = (val) => setCustomersState(prev => ({ ...prev, importProgress: typeof val === 'function' ? val(prev.importProgress) : val }));

  // Local/Temporary states that don't need context
  const [toast, setToast] = useState(null);
  const [isFakeCustomersModalOpen, setIsFakeCustomersModalOpen] = useState(false);
  const [fakeCount, setFakeCount] = useState(100);
  const [fakeCity, setFakeCity] = useState("Chennai");
  const [generateRandomCities, setGenerateRandomCities] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Get dynamic unique cities from database for filters
  const uniqueCities = useMemo(() => {
    const list = new Set();
    customers.forEach(c => { if (c.city) list.add(c.city); });
    return Array.from(list).sort();
  }, [customers]);

  // Handle Form Input Change & Inline Validation
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let errors = { ...formErrors };

    if (name === 'firstName' && !value.trim()) {
      errors.firstName = 'First Name is required.';
    } else if (name === 'firstName') {
      delete errors.firstName;
    }

    if (name === 'lastName' && !value.trim()) {
      errors.lastName = 'Last Name is required.';
    } else if (name === 'lastName') {
      delete errors.lastName;
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        errors.email = 'Email Address is required.';
      } else if (!emailRegex.test(value)) {
        errors.email = 'Invalid email format.';
      } else {
        // Check duplicate email
        const isDuplicate = customers.some(c => c.email.toLowerCase() === value.toLowerCase() && (!customerToEdit || c.id !== customerToEdit.id));
        if (isDuplicate) {
          errors.email = 'Email already exists in system.';
        } else {
          delete errors.email;
        }
      }
    }

    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      if (!value.trim()) {
        errors.phone = 'Phone number is required.';
      } else if (cleaned.length < 8) {
        errors.phone = 'Phone number is too short.';
      } else {
        delete errors.phone;
      }
    }

    if (name === 'dob' && value) {
      const date = new Date(value);
      const today = new Date();
      if (date > today) {
        errors.dob = 'Date of birth cannot be in the future.';
      } else {
        delete errors.dob;
      }
    }

    if (name === 'registrationDate' && value) {
      const date = new Date(value);
      const today = new Date();
      if (date > today) {
        errors.registrationDate = 'Registration date cannot be in the future.';
      } else {
        delete errors.registrationDate;
      }
    }

    if (name === 'lastPurchaseDate' && value) {
      const date = new Date(value);
      const today = new Date();
      const regDate = new Date(formValues.registrationDate);
      if (date > today) {
        errors.lastPurchaseDate = 'Purchase date cannot be in the future.';
      } else if (formValues.registrationDate && date < regDate) {
        errors.lastPurchaseDate = 'Purchase date cannot be before registration date.';
      } else {
        delete errors.lastPurchaseDate;
      }
    }

    setFormErrors(errors);
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formValues.firstName.trim()) errors.firstName = 'First Name is required.';
    if (!formValues.lastName.trim()) errors.lastName = 'Last Name is required.';
    
    if (!formValues.email.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(formValues.email)) {
      errors.email = 'Invalid email format.';
    } else {
      const isDuplicate = customers.some(c => c.email.toLowerCase() === formValues.email.toLowerCase() && (!customerToEdit || c.id !== customerToEdit.id));
      if (isDuplicate) {
        errors.email = 'Email already exists in system.';
      }
    }

    if (!formValues.phone.trim()) {
      errors.phone = 'Phone number is required.';
    } else if (formValues.phone.replace(/\D/g, '').length < 8) {
      errors.phone = 'Phone number is too short.';
    }

    if (formValues.dob) {
      if (new Date(formValues.dob) > new Date()) errors.dob = 'Date of birth cannot be in the future.';
    }
    
    if (formValues.registrationDate) {
      if (new Date(formValues.registrationDate) > new Date()) errors.registrationDate = 'Registration date cannot be in the future.';
    }

    if (formValues.lastPurchaseDate) {
      const pDate = new Date(formValues.lastPurchaseDate);
      const rDate = new Date(formValues.registrationDate);
      if (pDate > new Date()) errors.lastPurchaseDate = 'Purchase date cannot be in the future.';
      else if (pDate < rDate) errors.lastPurchaseDate = 'Purchase date cannot be before registration.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create Customer Action
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const res = addCustomer(formValues);
    if (res.success) {
      showToast(`Customer ${formValues.firstName} ${formValues.lastName} added successfully!`, 'success');
      setIsAddOpen(false);
      setFormValues(initialFormState);
    } else {
      setFormErrors({ email: res.error });
    }
  };

  // Edit Customer Trigger
  const handleOpenEdit = (customer) => {
    setCustomerToEdit(customer);
    const names = customer.name.split(' ');
    const first = names[0] || '';
    const last = names.slice(1).join(' ') || '';
    
    setFormValues({
      firstName: first,
      lastName: last,
      email: customer.email,
      phone: customer.phone,
      gender: customer.gender || 'Female',
      dob: customer.dob || '',
      city: customer.city || '',
      state: customer.state || '',
      country: customer.country || '',
      registrationDate: customer.registrationDate || '',
      segment: customer.segment || 'New Customers',
      totalSpend: customer.totalSpend.toString(),
      averageOrderValue: customer.averageOrderValue.toString(),
      lastPurchaseDate: customer.lastPurchaseDate || '',
      preferredChannel: customer.preferredChannel || 'WhatsApp',
      notes: customer.notes || ''
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Save Edit Customer Action
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const res = updateCustomer(customerToEdit.id, formValues);
    if (res.success) {
      showToast(`Customer profile updated successfully!`, 'success');
      setIsEditOpen(false);
      setCustomerToEdit(null);
      setFormValues(initialFormState);
      
      // Update selected profile drawer if open
      if (selectedCustomer && selectedCustomer.id === customerToEdit.id) {
        setSelectedCustomer(prev => ({
          ...prev,
          ...formValues,
          name: `${formValues.firstName} ${formValues.lastName}`
        }));
      }
    } else {
      setFormErrors({ email: res.error });
    }
  };

  // Delete Customer Action
  const handleDeleteTrigger = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer(customerToDelete.id);
      showToast(`Customer ${customerToDelete.name} deleted successfully.`, 'success');
      setIsDeleteOpen(false);
      
      if (selectedCustomer && selectedCustomer.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      setCustomerToDelete(null);
    }
  };

  const handleGenerateFakeCustomers = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const cityParam = generateRandomCities ? null : fakeCity;
      const res = await generateFakeCustomers(fakeCount, cityParam);
      if (res.success) {
        showToast(`${res.count} demo customers generated successfully.`, 'success');
        setIsFakeCustomersModalOpen(false);
      } else {
        showToast(res.error || "Failed to generate demo customers.", 'error');
      }
    } catch (err) {
      console.error("Error generating fake customers:", err);
      showToast("Failed to generate demo customers.", 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Search & Filters Logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Global Search
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        c.name.toLowerCase().includes(searchLower) || 
        c.email.toLowerCase().includes(searchLower) ||
        (c.phone && c.phone.includes(searchLower)) ||
        (c.city && c.city.toLowerCase().includes(searchLower)) ||
        c.id.toLowerCase().includes(searchLower);

      // Segment Filter
      const matchesSegment = selectedSegment === 'All' || c.segment === selectedSegment;

      // Status (Propensity) Filter
      const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;

      // Spend range
      let matchesSpend = true;
      if (selectedSpend !== 'All') {
        const val = c.totalSpend;
        if (selectedSpend === 'high') matchesSpend = val > 50000;
        else if (selectedSpend === 'mid') matchesSpend = val >= 10000 && val <= 50000;
        else if (selectedSpend === 'low') matchesSpend = val < 10000;
      }

      // City Filter
      const matchesCity = selectedCity === 'All' || c.city === selectedCity;

      // Recency (last purchase date) Filter
      let matchesRecency = true;
      if (selectedRecency !== 'All') {
        if (!c.lastPurchaseDate) {
          matchesRecency = false;
        } else {
          const lastDate = new Date(c.lastPurchaseDate);
          const now = new Date("2026-06-09");
          const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
          
          if (selectedRecency === '30') matchesRecency = diffDays <= 30;
          else if (selectedRecency === '90') matchesRecency = diffDays > 30 && diffDays <= 90;
          else if (selectedRecency === 'old') matchesRecency = diffDays > 90;
        }
      }

      return matchesSearch && matchesSegment && matchesStatus && matchesSpend && matchesCity && matchesRecency;
    });
  }, [customers, search, selectedSegment, selectedStatus, selectedSpend, selectedCity, selectedRecency]);

  // Sort Logic
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    sorted.sort((a, b) => {
      let valA, valB;
      
      if (sortField === 'spend') {
        valA = a.totalSpend;
        valB = b.totalSpend;
      } else if (sortField === 'aov') {
        valA = a.averageOrderValue;
        valB = b.averageOrderValue;
      } else if (sortField === 'newest') {
        valA = new Date(a.registrationDate || 0).getTime();
        valB = new Date(b.registrationDate || 0).getTime();
      } else if (sortField === 'oldest') {
        valA = new Date(a.registrationDate || 0).getTime();
        valB = new Date(b.registrationDate || 0).getTime();
      } else if (sortField === 'active') {
        valA = new Date(a.lastPurchaseDate || 0).getTime();
        valB = new Date(b.lastPurchaseDate || 0).getTime();
      } else {
        valA = a.name;
        valB = b.name;
      }

      // Special sort toggle direction
      if (sortField === 'newest') {
        return sortOrder === 'asc' ? valA - valB : valB - valA; // newest is desc by default
      }
      if (sortField === 'oldest') {
        return sortOrder === 'asc' ? valB - valA : valA - valB; // oldest is asc by default
      }
      if (sortField === 'active') {
        return sortOrder === 'asc' ? valA - valB : valB - valA; // active is desc by default
      }

      if (typeof valA === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    });
    return sorted;
  }, [filteredCustomers, sortField, sortOrder]);

  // Pagination bounds
  const totalRecords = sortedCustomers.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  
  const paginatedCustomers = useMemo(() => {
    // Safety check on page limits
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    return sortedCustomers.slice(start, start + pageSize);
  }, [sortedCustomers, currentPage, pageSize, totalPages]);

  // Handle page changes
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // CSV Parser
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const parsedData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let charIdx = 0; charIdx < line.length; charIdx++) {
        const char = line[charIdx];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row = {};
      headers.forEach((header, idx) => {
        // Normalize header names to match supported columns
        const normHeader = header.toLowerCase().replace(/\s+/g, '');
        let targetKey = header;
        
        if (normHeader === 'name' || normHeader === 'fullname') targetKey = 'name';
        else if (normHeader === 'email' || normHeader === 'emailaddress') targetKey = 'email';
        else if (normHeader === 'phone' || normHeader === 'phonenumber') targetKey = 'phone';
        else if (normHeader === 'gender') targetKey = 'gender';
        else if (normHeader === 'city') targetKey = 'city';
        else if (normHeader === 'totalspend' || normHeader === 'spend') targetKey = 'totalSpend';
        else if (normHeader === 'averageordervalue' || normHeader === 'aov') targetKey = 'averageOrderValue';
        else if (normHeader === 'segment' || normHeader === 'cohort') targetKey = 'segment';
        else if (normHeader === 'lastpurchasedate' || normHeader === 'lastpurchase') targetKey = 'lastPurchaseDate';

        row[targetKey] = values[idx] ? values[idx].replace(/^["']|["']$/g, '') : '';
      });
      parsedData.push(row);
    }
    return parsedData;
  };

  // File Upload Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      alert("Unsupported file format. Please upload a CSV or Excel (.xlsx) file.");
      return;
    }

    setImportProgress(10);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImportProgress(50);
      const text = e.target.result;
      const parsed = parseCSV(text);
      setImportProgress(100);
      setTimeout(() => {
        analyzeAndValidateImport(parsed);
      }, 500);
    };
    reader.readAsText(file);
  };

  // Analyze CSV records
  const analyzeAndValidateImport = (records) => {
    const valid = [];
    const failed = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    records.forEach((r, idx) => {
      let errors = [];
      
      if (!r.name || !r.name.trim()) {
        errors.push("Missing Name");
      }
      
      if (!r.email || !r.email.trim()) {
        errors.push("Missing Email");
      } else if (!emailRegex.test(r.email)) {
        errors.push("Invalid Email Format");
      } else {
        const isDuplicate = customers.some(c => c.email.toLowerCase() === r.email.toLowerCase()) ||
                            valid.some(v => v.email.toLowerCase() === r.email.toLowerCase());
        if (isDuplicate) {
          errors.push("Duplicate Email Address");
        }
      }

      if (r.totalSpend && isNaN(Number(r.totalSpend))) {
        errors.push("Total Spend must be a number");
      }
      if (r.averageOrderValue && isNaN(Number(r.averageOrderValue))) {
        errors.push("Average Order Value must be a number");
      }

      if (errors.length > 0) {
        failed.push({
          rowNum: idx + 2,
          ...r,
          error: errors.join(', ')
        });
      } else {
        valid.push({
          ...r,
          totalSpend: Number(r.totalSpend) || 0,
          averageOrderValue: Number(r.averageOrderValue) || Number(r.totalSpend) || 0,
        });
      }
    });

    setValidatedRecords(valid);
    setFailedRecords(failed);
    setImportStep(2);
  };

  // Import Action
  const triggerDatabaseImport = () => {
    if (validatedRecords.length > 0) {
      const res = importCustomers(validatedRecords);
      if (res.success) {
        showToast(`Import completed! ${res.importedCount} records added, ${res.duplicateCount} duplicates skipped.`, 'success');
        setImportStep(3);
      }
    }
  };

  // Download Failed CSV Records report
  const downloadFailedReport = () => {
    if (failedRecords.length === 0) return;
    
    const headers = ["Row", "Name", "Email", "Phone", "Gender", "City", "Total Spend", "Average Order Value", "Segment", "Last Purchase Date", "Validation Error"];
    const csvContent = [headers.join(',')];
    
    failedRecords.forEach(r => {
      const rowData = [
        r.rowNum,
        `"${r.name || ''}"`,
        `"${r.email || ''}"`,
        `"${r.phone || ''}"`,
        `"${r.gender || ''}"`,
        `"${r.city || ''}"`,
        `"${r.totalSpend || 0}"`,
        `"${r.averageOrderValue || 0}"`,
        `"${r.segment || ''}"`,
        `"${r.lastPurchaseDate || ''}"`,
        `"${r.error}"`
      ];
      csvContent.push(rowData.join(','));
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `failed_import_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export all database customers
  const handleExportCustomers = () => {
    const headers = ["Customer ID", "Name", "Email", "Phone", "Gender", "City", "Registration Date", "Total Spend", "Average Order Value", "Last Purchase Date", "Propensity Status", "Propensity Score", "Preferred Channel", "Segment"];
    const csvContent = [headers.join(',')];
    
    customers.forEach(c => {
      const rowData = [
        c.id,
        `"${c.name}"`,
        `"${c.email}"`,
        `"${c.phone || ''}"`,
        `"${c.gender || ''}"`,
        `"${c.city || ''}"`,
        `"${c.registrationDate || ''}"`,
        c.totalSpend,
        c.averageOrderValue,
        `"${c.lastPurchaseDate || ''}"`,
        `"${c.status}"`,
        c.propensity,
        `"${c.preferredChannel}"`,
        `"${c.segment}"`
      ];
      csvContent.push(rowData.join(','));
    });

    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payzor_recovery_customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${customers.length} customer records to CSV!`, 'success');
  };

  // Customer Drawer Insights computed helpers
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => o.customerId === selectedCustomer.id);
  }, [selectedCustomer, orders]);

  const customerCampaigns = useMemo(() => {
    if (!selectedCustomer) return [];
    // Campaigns matching customer segment or sent to all
    return campaigns.filter(c => c.audience === selectedCustomer.segment || c.audience === 'All');
  }, [selectedCustomer, campaigns]);

  return (
    <div style={{ padding: '2rem', position: 'relative', minHeight: '88vh' }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={toastStyle(toast.type)}
            className="glass-panel"
          >
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-family-title)', color: 'var(--text-primary)', letterSpacing: '-0.025em', margin: 0 }}>
              B2B Customers & Receivables Ledger
            </h1>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '9999px', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-champagne)', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              {customers.length} Accounts
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Manage debtor profiles, credit limits, overdue receivables, and AI delinquency diagnoses.
          </p>
        </div>

        {/* Top actions */}
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setFormValues(initialFormState); setFormErrors({}); setIsAddOpen(true); }} style={primaryActionButtonStyle}>
            <Plus size={15} /> Add Account
          </button>

          <button onClick={() => { setIsFakeCustomersModalOpen(true); setFakeCount(100); setFakeCity("Chennai"); setGenerateRandomCities(false); }} style={secondaryActionButtonStyle}>
            <Sparkles size={14} /> Seed Test Debtors
          </button>
          
          <button onClick={() => { setImportStep(1); setImportedData([]); setValidatedRecords([]); setFailedRecords([]); setImportProgress(0); setIsImportOpen(true); }} style={secondaryActionButtonStyle}>
            <Upload size={14} /> Import Ledger (CSV)
          </button>

          <button onClick={handleExportCustomers} style={secondaryActionButtonStyle}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Top 4 Financial Ledger Summary Metric Chips */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>TOTAL OUTSTANDING</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            ₹{Math.round(customers.reduce((acc, c) => acc + (parseFloat(c.outstandingAmount || c.outstanding_amount || 0)), 0)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Portfolio balance</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>OVERDUE RECEIVABLES</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
            ₹{Math.round(customers.reduce((acc, c) => acc + (parseFloat(c.overdueAmount || c.overdue_amount || 0)), 0)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#ef4444', marginTop: '0.15rem' }}>Unpaid past maturity</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>HIGH / CRITICAL RISK</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fb923c', marginTop: '0.2rem' }}>
            {customers.filter(c => ['high', 'critical'].includes((c.aiRiskLevel || c.ai_risk_level || '').toLowerCase())).length} Accounts
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Elevated delinquency probability</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PROMISE-TO-PAY (PTP)</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gold-primary)', marginTop: '0.2rem' }}>
            {customers.filter(c => (c.promise_to_pay_status || c.ptp_status || '').toUpperCase() === 'ACTIVE').length} Active
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Committed payment terms</div>
        </div>
      </div>

      {/* 2. Search & Filtering Utilities */}
      <div style={filterBarContainerStyle}>
        
        {/* Global Search Bar */}
        <div style={searchBoxStyle}>
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search name, email, phone, city..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            style={searchInputStyle}
          />
        </div>

        {/* Multi-parameter Select Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Segment Filter */}
          <div style={selectBoxStyle}>
            <Filter size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedSegment}
              onChange={(e) => { setSelectedSegment(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="All">All Segments</option>
              <option value="High Value Customers">High Value</option>
              <option value="Loyal Customers">Loyal</option>
              <option value="Dormant Customers">Dormant</option>
              <option value="At Risk Customers">At Risk</option>
              <option value="New Customers">New Customer</option>
            </select>
          </div>

          {/* Status Propensity Filter */}
          <div style={selectBoxStyle}>
            <Activity size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="All">All Statuses</option>
              <option value="High Propensity">High Propensity</option>
              <option value="Medium Propensity">Medium Propensity</option>
              <option value="Low Propensity">Low Propensity</option>
            </select>
          </div>

          {/* Outstanding Range Filter */}
          <div style={selectBoxStyle}>
            <DollarSign size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedSpend}
              onChange={(e) => { setSelectedSpend(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="All">All Exposure Levels</option>
              <option value="high">High Dues (&gt; ₹50,000)</option>
              <option value="mid">Mid Dues (₹10,000 - ₹50,000)</option>
              <option value="low">Low Dues (&lt; ₹10,000)</option>
            </select>
          </div>

          {/* City Filter */}
          <div style={selectBoxStyle}>
            <MapPin size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedCity}
              onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="All">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Recency Filter */}
          <div style={selectBoxStyle}>
            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={selectedRecency}
              onChange={(e) => { setSelectedRecency(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="All">All Repayment Terms</option>
              <option value="30">Repaid (Last 30 Days)</option>
              <option value="90">Slipping Dues (30-90 Days)</option>
              <option value="old">Overdue (&gt; 90 Days)</option>
            </select>
          </div>

          {/* Sorting Option */}
          <div style={selectBoxStyle}>
            <ArrowUpDown size={13} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortField(field);
                setSortOrder(order);
                setCurrentPage(1);
              }}
              style={selectStyle}
            >
              <option value="spend-desc">Highest Outstanding</option>
              <option value="spend-asc">Lowest Outstanding</option>
              <option value="newest-desc">Newest Credit Account</option>
              <option value="oldest-desc">Oldest Credit Account</option>
            </select>
          </div>

        </div>
      </div>

      {/* 3. CRM Table & Pagination */}
      {loading ? (
        <div style={emptyStateContainerStyle}>
          <Activity size={28} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite', color: 'var(--blue-primary)' }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Synthesizing customer intelligence logs...</span>
        </div>
      ) : sortedCustomers.length === 0 ? (
        <div style={emptyStateContainerStyle} className="glass-panel">
          <AlertTriangle size={32} style={{ color: 'var(--text-muted)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem' }}>No Customers Match Your Filters</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '300px', margin: '0.25rem auto 0 auto' }}>
            Try refining your keyword search, resetting segment limits, or adding a new profile manually.
          </p>
        </div>
      ) : (
        <>
          {/* Main Professional CRM Table */}
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={tableHeaderStyle}>Customer Name</th>
                  <th style={tableHeaderStyle}>Segment</th>
                  <th style={tableHeaderStyle}>Credit Limit</th>
                  <th style={tableHeaderStyle}>Outstanding Balance</th>
                  <th style={tableHeaderStyle}>Overdue Balance</th>
                  <th style={tableHeaderStyle}>AI Risk Status</th>
                  <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((c) => (
                  <tr 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    style={tableRowStyle}
                    className="customer-row"
                  >
                    <td style={{ ...tableCellStyle, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={avatarStyle(c.segment)}>{c.name.split(' ').map(n => n[0]).join('')}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.email} • {c.phone}</div>
                      </div>
                    </td>
                    <td style={tableCellStyle}>
                      <span style={segmentBadgeStyle(c.segment)}>{c.segment.replace(' Customers', '')}</span>
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 700 }}>
                      ₹{c.creditLimit.toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, color: c.outstandingAmount > 0 ? '#ef4444' : 'var(--text-primary)', fontWeight: 600 }}>
                      ₹{c.outstandingAmount.toLocaleString()}
                    </td>
                    <td style={{ ...tableCellStyle, color: c.overdueAmount > 0 ? '#ef4444' : 'var(--text-secondary)' }}>
                      ₹{c.overdueAmount.toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={propensityBadgeStyle(c.aiRiskScore)}>
                        {c.aiRiskLevel} ({c.aiRiskScore.toFixed(0)}%)
                      </span>
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button onClick={() => setSelectedCustomer(c)} style={actionIconButtonStyle} title="View Details">
                          <User size={13} />
                        </button>
                        <button onClick={() => handleOpenEdit(c)} style={actionIconButtonStyle} title="Edit Profile">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => handleDeleteTrigger(c)} style={{ ...actionIconButtonStyle, color: '#ef4444', hoverColor: '#fef2f2' }} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={paginationContainerStyle}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Showing <strong>{((Math.min(currentPage, totalPages) - 1) * pageSize) + 1}</strong> to <strong>{Math.min(Math.min(currentPage, totalPages) * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> records
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              
              {/* Page Size select */}
              <div style={{ ...selectBoxStyle, padding: '0.2rem 0.4rem', border: 'none' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Show:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ ...selectStyle, fontSize: '0.75rem' }}
                >
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                </select>
              </div>

              <button 
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
                style={paginationButtonStyle}
              >
                First
              </button>
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1}
                style={paginationButtonStyle}
              >
                <ChevronLeft size={14} />
              </button>
              
              <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', padding: '0 0.5rem' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              </span>

              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style={paginationButtonStyle}
              >
                <ChevronRight size={14} />
              </button>
              <button 
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
                style={paginationButtonStyle}
              >
                Last
              </button>
            </div>
          </div>
        </>
      )}

      {/* ================================================= */}
      {/* 4. SLIDE-OVER DRAWER: ADD CUSTOMER FORM */}
      {/* ================================================= */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              style={backdropStyle}
            />
            {/* Slide-over panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={slidePanelStyle}
              className="glass-panel"
            >
              <div style={slideHeaderStyle}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Add Customer</h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>Create a brand-new customer profile in the CRM database.</p>
                </div>
                <button onClick={() => setIsAddOpen(false)} style={closeButtonStyle}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateCustomer} style={slideContentFormStyle}>
                
                {/* Section A: Personal info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><User size={13} /> Personal Information</h4>
                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>First Name *</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={formValues.firstName} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.firstName)}
                        placeholder="e.g. Priya"
                      />
                      {formErrors.firstName && <span style={errorTextStyle}>{formErrors.firstName}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={formValues.lastName} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.lastName)}
                        placeholder="e.g. Sharma"
                      />
                      {formErrors.lastName && <span style={errorTextStyle}>{formErrors.lastName}</span>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formValues.email} 
                      onChange={handleFormChange}
                      style={formInputStyle(formErrors.email)}
                      placeholder="name@company.com"
                    />
                    {formErrors.email && <span style={errorTextStyle}>{formErrors.email}</span>}
                  </div>

                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>Phone Number *</label>
                      <input 
                        type="text" 
                        name="phone" 
                        value={formValues.phone} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.phone)}
                        placeholder="+91 98765 43210"
                      />
                      {formErrors.phone && <span style={errorTextStyle}>{formErrors.phone}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Gender</label>
                      <select 
                        name="gender" 
                        value={formValues.gender} 
                        onChange={handleFormChange}
                        style={formSelectStyle}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Date Of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formValues.dob} 
                      onChange={handleFormChange}
                      style={formInputStyle(formErrors.dob)}
                    />
                    {formErrors.dob && <span style={errorTextStyle}>{formErrors.dob}</span>}
                  </div>
                </div>

                {/* Section B: Location info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><MapPin size={13} /> Location Information</h4>
                  <div style={formGrid3Style}>
                    <div>
                      <label style={formLabelStyle}>City</label>
                      <input type="text" name="city" value={formValues.city} onChange={handleFormChange} style={formInputStyle()} placeholder="Mumbai" />
                    </div>
                    <div>
                      <label style={formLabelStyle}>State</label>
                      <input type="text" name="state" value={formValues.state} onChange={handleFormChange} style={formInputStyle()} placeholder="MH" />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Country</label>
                      <input type="text" name="country" value={formValues.country} onChange={handleFormChange} style={formInputStyle()} placeholder="India" />
                    </div>
                  </div>
                </div>

                {/* Section C: Customer Info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><ShieldCheck size={13} /> Customer Status & Marketing</h4>
                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>Registration Date</label>
                      <input 
                        type="date" 
                        name="registrationDate" 
                        value={formValues.registrationDate} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.registrationDate)}
                      />
                      {formErrors.registrationDate && <span style={errorTextStyle}>{formErrors.registrationDate}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Customer Segment</label>
                      <select 
                        name="segment" 
                        value={formValues.segment} 
                        onChange={handleFormChange}
                        style={formSelectStyle}
                      >
                        <option value="High Value Customers">High Value</option>
                        <option value="Loyal Customers">Loyal</option>
                        <option value="Dormant Customers">Dormant</option>
                        <option value="At Risk Customers">At Risk</option>
                        <option value="New Customers">New Customer</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Preferred Marketing Channel</label>
                    <select 
                      name="preferredChannel" 
                      value={formValues.preferredChannel} 
                      onChange={handleFormChange}
                      style={formSelectStyle}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                </div>

                {/* Section D: Financial & Credit Info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><DollarSign size={13} /> Credit & Receivables Information</h4>
                  <div style={formGrid3Style}>
                    <div>
                      <label style={formLabelStyle}>Total Credit Line (₹)</label>
                      <input type="number" name="totalSpend" value={formValues.totalSpend} onChange={handleFormChange} style={formInputStyle()} placeholder="0" />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Initial Receivable Value (₹)</label>
                      <input type="number" name="averageOrderValue" value={formValues.averageOrderValue} onChange={handleFormChange} style={formInputStyle()} placeholder="0" />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Billing / Due Date</label>
                      <input 
                        type="date" 
                        name="lastPurchaseDate" 
                        value={formValues.lastPurchaseDate} 
                        onChange={handleFormChange} 
                        style={formInputStyle(formErrors.lastPurchaseDate)}
                      />
                    </div>
                  </div>
                  {formErrors.lastPurchaseDate && <div style={{...errorTextStyle, marginTop: '0.3rem'}}>{formErrors.lastPurchaseDate}</div>}
                </div>

                {/* Section E: Notes */}
                <div style={formSectionStyle}>
                  <label style={formLabelStyle}>Debtor & Credit Notes</label>
                  <textarea 
                    name="notes" 
                    value={formValues.notes} 
                    onChange={handleFormChange} 
                    style={formTextAreaStyle}
                    placeholder="Enter debtor notes, corporate credit terms, repayment commitments, or interaction logs..."
                  />
                </div>

                {/* Actions */}
                <div style={formActionContainerStyle}>
                  <button type="button" onClick={() => setIsAddOpen(false)} style={secondaryFormButtonStyle}>
                    Cancel
                  </button>
                  <button type="submit" style={primaryFormButtonStyle}>
                    Create Customer
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* 5. SLIDE-OVER DRAWER: EDIT CUSTOMER FORM */}
      {/* ================================================= */}
      <AnimatePresence>
        {isEditOpen && customerToEdit && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditOpen(false)}
              style={backdropStyle}
            />
            {/* Slide-over panel */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={slidePanelStyle}
              className="glass-panel"
            >
              <div style={slideHeaderStyle}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Edit Customer Profile</h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>ID: {customerToEdit.id}</p>
                </div>
                <button onClick={() => setIsEditOpen(false)} style={closeButtonStyle}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={slideContentFormStyle}>
                
                {/* Section A: Personal info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><User size={13} /> Personal Information</h4>
                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>First Name *</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={formValues.firstName} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.firstName)}
                      />
                      {formErrors.firstName && <span style={errorTextStyle}>{formErrors.firstName}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Last Name *</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={formValues.lastName} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.lastName)}
                      />
                      {formErrors.lastName && <span style={errorTextStyle}>{formErrors.lastName}</span>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Email Address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formValues.email} 
                      onChange={handleFormChange}
                      style={formInputStyle(formErrors.email)}
                    />
                    {formErrors.email && <span style={errorTextStyle}>{formErrors.email}</span>}
                  </div>

                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>Phone Number *</label>
                      <input 
                        type="text" 
                        name="phone" 
                        value={formValues.phone} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.phone)}
                      />
                      {formErrors.phone && <span style={errorTextStyle}>{formErrors.phone}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Gender</label>
                      <select 
                        name="gender" 
                        value={formValues.gender} 
                        onChange={handleFormChange}
                        style={formSelectStyle}
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Date Of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formValues.dob} 
                      onChange={handleFormChange}
                      style={formInputStyle(formErrors.dob)}
                    />
                    {formErrors.dob && <span style={errorTextStyle}>{formErrors.dob}</span>}
                  </div>
                </div>

                {/* Section B: Location info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><MapPin size={13} /> Location Information</h4>
                  <div style={formGrid3Style}>
                    <div>
                      <label style={formLabelStyle}>City</label>
                      <input type="text" name="city" value={formValues.city} onChange={handleFormChange} style={formInputStyle()} />
                    </div>
                    <div>
                      <label style={formLabelStyle}>State</label>
                      <input type="text" name="state" value={formValues.state} onChange={handleFormChange} style={formInputStyle()} />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Country</label>
                      <input type="text" name="country" value={formValues.country} onChange={handleFormChange} style={formInputStyle()} />
                    </div>
                  </div>
                </div>

                {/* Section C: Customer Info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><ShieldCheck size={13} /> Customer Status & Marketing</h4>
                  <div style={formGridStyle}>
                    <div>
                      <label style={formLabelStyle}>Registration Date</label>
                      <input 
                        type="date" 
                        name="registrationDate" 
                        value={formValues.registrationDate} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.registrationDate)}
                      />
                      {formErrors.registrationDate && <span style={errorTextStyle}>{formErrors.registrationDate}</span>}
                    </div>
                    <div>
                      <label style={formLabelStyle}>Customer Segment</label>
                      <select 
                        name="segment" 
                        value={formValues.segment} 
                        onChange={handleFormChange}
                        style={formSelectStyle}
                      >
                        <option value="High Value Customers">High Value</option>
                        <option value="Loyal Customers">Loyal</option>
                        <option value="Dormant Customers">Dormant</option>
                        <option value="At Risk Customers">At Risk</option>
                        <option value="New Customers">New Customer</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.75rem' }}>
                    <label style={formLabelStyle}>Preferred Marketing Channel</label>
                    <select 
                      name="preferredChannel" 
                      value={formValues.preferredChannel} 
                      onChange={handleFormChange}
                      style={formSelectStyle}
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                    </select>
                  </div>
                </div>

                {/* Section D: Financial & Credit Info */}
                <div style={formSectionStyle}>
                  <h4 style={formSectionTitleStyle}><DollarSign size={13} /> Credit & Receivables Information</h4>
                  <div style={formGrid3Style}>
                    <div>
                      <label style={formLabelStyle}>Total Credit Line (₹)</label>
                      <input type="number" name="totalSpend" value={formValues.totalSpend} onChange={handleFormChange} style={formInputStyle()} />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Outstanding / Receivable (₹)</label>
                      <input type="number" name="averageOrderValue" value={formValues.averageOrderValue} onChange={handleFormChange} style={formInputStyle()} />
                    </div>
                    <div>
                      <label style={formLabelStyle}>Billing / Due Date</label>
                      <input 
                        type="date" 
                        name="lastPurchaseDate" 
                        value={formValues.lastPurchaseDate} 
                        onChange={handleFormChange}
                        style={formInputStyle(formErrors.lastPurchaseDate)}
                      />
                    </div>
                  </div>
                  {formErrors.lastPurchaseDate && <div style={{...errorTextStyle, marginTop: '0.3rem'}}>{formErrors.lastPurchaseDate}</div>}
                </div>

                {/* Section E: Notes */}
                <div style={formSectionStyle}>
                  <label style={formLabelStyle}>Debtor & Credit Notes</label>
                  <textarea 
                    name="notes" 
                    value={formValues.notes} 
                    onChange={handleFormChange} 
                    style={formTextAreaStyle}
                    placeholder="Enter debtor notes, corporate credit terms, repayment commitments, or interaction logs..."
                  />
                </div>

                {/* Actions */}
                <div style={formActionContainerStyle}>
                  <button type="button" onClick={() => setIsEditOpen(false)} style={secondaryFormButtonStyle}>
                    Discard Changes
                  </button>
                  <button type="submit" style={primaryFormButtonStyle}>
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* 6. SLIDING PROFILE DRAWER DETAILS PANEL */}
      {/* ================================================= */}
      <AnimatePresence>
        {selectedCustomer && !isEditOpen && !isAddOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomer(null)}
              style={backdropStyle}
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.35, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={drawerStyle}
              className="glass-panel"
            >
              <div style={drawerHeaderStyle}>
                <div>
                  <span style={drawerLabelStyle}>Intelligence Summary</span>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedCustomer.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  <button onClick={() => handleOpenEdit(selectedCustomer)} style={drawerActionButtonStyle}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => setSelectedCustomer(null)} style={closeButtonStyle}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div style={drawerContentStyle}>
                
                {/* 1. Debtor Profile Card */}
                <div style={profilePanelCardStyle}>
                  <div style={largeAvatarStyle(selectedCustomer.segment)}>
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  
                  <span style={{...segmentBadgeStyle(selectedCustomer.segment), marginTop: '0.75rem'}}>{selectedCustomer.segment}</span>

                  <div style={{ width: '100%', marginTop: '1.25rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}><Mail size={12} /> Email</span>
                      <span style={detailValStyle}>{selectedCustomer.email}</span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}><Phone size={12} /> Phone</span>
                      <span style={detailValStyle}>{selectedCustomer.phone}</span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}><MapPin size={12} /> Location</span>
                      <span style={detailValStyle}>
                        {[selectedCustomer.city, selectedCustomer.state, selectedCustomer.country].filter(Boolean).join(', ') || 'Mumbai, IN'}
                      </span>
                    </div>
                    <div style={detailRowStyle}>
                      <span style={detailLabelStyle}><Calendar size={12} /> Account Established</span>
                      <span style={detailValStyle}>
                        {new Date(selectedCustomer.registrationDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. B2B Credit & Receivables Ledger Lifecycle Card */}
                <div style={drawerCardStyle}>
                  <h5 style={drawerCardTitleStyle}>
                    <DollarSign size={14} style={{ color: 'var(--blue-primary)' }} /> B2B Credit & Receivables Ledger
                  </h5>

                  {/* Visual Financial Lifecycle Pipeline */}
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.6rem 0.75rem', 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    fontSize: '0.65rem' 
                  }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                      Receivables Lifecycle Position
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.2rem', color: 'var(--text-secondary)' }}>
                      <span style={{ fontWeight: 600, color: 'var(--blue-primary)', fontSize: '0.65rem' }}>1. Credit Line</span>
                      <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, color: selectedCustomer.outstandingAmount > 0 ? '#ef4444' : 'var(--text-primary)', fontSize: '0.65rem' }}>2. Outstanding</span>
                      <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, color: '#f59e0b', fontSize: '0.65rem' }}>3. AI Risk</span>
                      <ArrowRight size={10} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--green-primary)', fontSize: '0.65rem' }}>4. Recovered</span>
                    </div>
                  </div>

                  {/* Primary Financial Ledger Metric Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                    
                    {/* Credit Limit */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={labelStyle}>Credit Limit Extended</div>
                      <div style={{ ...valStyle, fontWeight: 800, color: 'var(--text-primary)' }}>
                        ₹{selectedCustomer.creditLimit?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Issued: ₹{selectedCustomer.totalCreditIssued?.toLocaleString() || '0'}
                      </div>
                    </div>

                    {/* Outstanding Balance */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={labelStyle}>Outstanding Balance</div>
                      <div style={{ ...valStyle, fontWeight: 800, color: selectedCustomer.outstandingAmount > 0 ? '#f87171' : 'var(--text-primary)' }}>
                        ₹{selectedCustomer.outstandingAmount?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: selectedCustomer.outstandingAmount > 0 ? '#ef4444' : 'var(--green-primary)', marginTop: '0.15rem', fontWeight: 600 }}>
                        {selectedCustomer.outstandingAmount > 0 ? 'Active Receivable' : 'Zero Open Dues'}
                      </div>
                    </div>

                    {/* Overdue Balance */}
                    <div style={{ backgroundColor: selectedCustomer.overdueAmount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', border: `1px solid ${selectedCustomer.overdueAmount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ ...labelStyle, color: selectedCustomer.overdueAmount > 0 ? '#f87171' : 'var(--text-muted)' }}>Overdue Balance</div>
                      <div style={{ ...valStyle, fontWeight: 800, color: selectedCustomer.overdueAmount > 0 ? '#f87171' : 'var(--text-primary)' }}>
                        ₹{selectedCustomer.overdueAmount?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: selectedCustomer.overdueAmount > 0 ? '#f87171' : 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {selectedCustomer.nextDueDate ? `Due: ${new Date(selectedCustomer.nextDueDate).toLocaleDateString()}` : 'Maturity standard'}
                      </div>
                    </div>

                    {/* Total Amount Paid / Recovered */}
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                      <div style={{ ...labelStyle, color: '#34d399' }}>Total Recovered / Paid</div>
                      <div style={{ ...valStyle, fontWeight: 800, color: '#34d399' }}>
                        ₹{selectedCustomer.totalAmountPaid?.toLocaleString() || '0'}
                      </div>
                      <div style={{ fontSize: '0.62rem', color: '#34d399', marginTop: '0.15rem', fontWeight: 600 }}>
                        {selectedCustomer.totalAmountPaid > 0 ? 'Settled to date' : 'No settlements logged'}
                      </div>
                    </div>

                  </div>

                  {/* Credit Facility Utilization Bar */}
                  <div style={{ marginTop: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Credit Facility Utilization</span>
                      <strong style={{ color: selectedCustomer.outstandingAmount > (selectedCustomer.creditLimit * 0.8) ? '#f87171' : 'var(--text-primary)' }}>
                        {selectedCustomer.creditLimit > 0 
                          ? `${Math.min(100, Math.round((selectedCustomer.outstandingAmount / selectedCustomer.creditLimit) * 100))}%` 
                          : '0%'}
                      </strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${selectedCustomer.creditLimit > 0 ? Math.min(100, Math.round((selectedCustomer.outstandingAmount / selectedCustomer.creditLimit) * 100)) : 0}%`, 
                          backgroundColor: selectedCustomer.outstandingAmount > (selectedCustomer.creditLimit * 0.8) ? '#f87171' : (selectedCustomer.outstandingAmount > 0 ? 'var(--gold-primary)' : 'var(--green-primary)'),
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      <span>Available Line: ₹{Math.max(0, (selectedCustomer.creditLimit || 0) - (selectedCustomer.outstandingAmount || 0)).toLocaleString()}</span>
                      <span>Terms: Net 30 Corporate</span>
                    </div>
                  </div>

                </div>

                {/* 3. Promise-to-Pay (PTP) Commitment Card (if PTP is active or set) */}
                {(selectedCustomer.promiseToPayStatus || selectedCustomer.promiseToPayDate || selectedCustomer.promiseToPayAmount > 0) && (
                  <div style={{ 
                    backgroundColor: '#fffbeb', 
                    border: '1px solid #fde68a', 
                    borderRadius: 'var(--border-radius-md)', 
                    padding: '1.1rem', 
                    boxShadow: 'var(--shadow-sm)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #fef3c7', paddingBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <ShieldCheck size={14} style={{ color: '#d97706' }} /> Promise-to-Pay (PTP) Commitment
                      </span>
                      <span style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: 800, 
                        padding: '0.15rem 0.45rem', 
                        borderRadius: '4px', 
                        backgroundColor: (selectedCustomer.promiseToPayStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' ? '#fef3c7' : '#f0fdf4',
                        color: (selectedCustomer.promiseToPayStatus || 'ACTIVE').toUpperCase() === 'ACTIVE' ? '#b45309' : '#15803d',
                        border: '1px solid #fde68a',
                        textTransform: 'uppercase'
                      }}>
                        {selectedCustomer.promiseToPayStatus || 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Committed Amount</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350f', marginTop: '0.1rem' }}>
                          ₹{(selectedCustomer.promiseToPayAmount || selectedCustomer.outstandingAmount || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.6rem', color: '#92400e', fontWeight: 700, textTransform: 'uppercase' }}>Target Clearance Date</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#78350f', marginTop: '0.1rem' }}>
                          {selectedCustomer.promiseToPayDate ? new Date(selectedCustomer.promiseToPayDate).toLocaleDateString() : 'Scheduled'}
                        </div>
                      </div>
                    </div>

                    {selectedCustomer.promiseToPayNotes && (
                      <p style={{ fontSize: '0.68rem', color: '#92400e', marginTop: '0.5rem', fontStyle: 'italic', lineHeight: 1.35, backgroundColor: 'rgba(255,255,255,0.6)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                        "{selectedCustomer.promiseToPayNotes}"
                      </p>
                    )}

                    <div style={{ fontSize: '0.62rem', color: '#b45309', marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={11} /> <strong>Guardrail Active:</strong> Automated dunning outreach is suppressed under PTP Cooldown.
                    </div>
                  </div>
                )}

                {/* 4. AI Risk Assessment & Delinquency Diagnostics Card */}
                <div style={drawerCardStyle}>
                  <h5 style={drawerCardTitleStyle}>
                    <Brain size={14} style={{ color: 'var(--blue-primary)' }} /> AI Risk Assessment & Diagnosis
                  </h5>
                  
                  {/* Risk Tier & Explanation */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Delinquency Risk Rating</span>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: selectedCustomer.aiRiskLevel === 'Critical' ? '#fef2f2' : (selectedCustomer.aiRiskLevel === 'High' ? '#fff7ed' : (selectedCustomer.aiRiskLevel === 'Medium' ? '#fffbeb' : '#f0fdf4')),
                        color: selectedCustomer.aiRiskLevel === 'Critical' ? '#ef4444' : (selectedCustomer.aiRiskLevel === 'High' ? '#f97316' : (selectedCustomer.aiRiskLevel === 'Medium' ? '#d97706' : 'var(--green-primary)')),
                        textTransform: 'uppercase',
                        border: `1px solid ${selectedCustomer.aiRiskLevel === 'Critical' ? '#fca5a5' : (selectedCustomer.aiRiskLevel === 'High' ? '#fed7aa' : (selectedCustomer.aiRiskLevel === 'Medium' ? '#fde68a' : '#bbf7d0'))}`
                      }}>
                        {selectedCustomer.aiRiskLevel || 'Low'} Risk ({selectedCustomer.aiRiskScore?.toFixed(0) || '0'}%)
                      </span>
                    </div>

                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.4, backgroundColor: 'var(--bg-secondary)', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      "{selectedCustomer.aiRiskExplanation || (selectedCustomer.outstandingAmount > 0 ? 'AI risk model evaluates overdue aging and historical settlement velocity to formulate proactive recovery cadence.' : 'Account maintains pristine payment discipline with zero open arrears.')}"
                    </p>

                    {/* Historical Payment Behavior Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Delayed Invoices</div>
                        <strong style={{ fontSize: '0.75rem', color: selectedCustomer.numberOfDelayedPayments > 0 ? '#f87171' : 'var(--text-primary)' }}>{selectedCustomer.numberOfDelayedPayments || 0}</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Avg Delay</div>
                        <strong style={{ fontSize: '0.75rem', color: selectedCustomer.averagePaymentDelay > 15 ? '#f87171' : 'var(--text-primary)' }}>{selectedCustomer.averagePaymentDelay || 0} days</strong>
                      </div>
                      <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Reliability</div>
                        <strong style={{ fontSize: '0.75rem', color: selectedCustomer.paymentReliability === 'High' ? '#34d399' : (selectedCustomer.paymentReliability === 'Low' ? '#f87171' : '#fbbf24') }}>{selectedCustomer.paymentReliability || 'High'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommended Recovery Action */}
                  {selectedCustomer.outstandingAmount > 0 && selectedCustomer.aiRecommendedAction !== 'No Action' && (
                    <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.73rem', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '0.75rem' }}>
                      ⚡ <strong>AI Strategy:</strong> {selectedCustomer.aiRecommendedAction}<br/>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}><strong>Rationale:</strong> {selectedCustomer.aiRecommendedReason || 'Optimized for high-probability invoice clearance.'}</span>
                    </div>
                  )}

                  {/* Historical Recovery Trails */}
                  {selectedCustomer.recoveryHistory && (() => {
                    try {
                      const history = JSON.parse(selectedCustomer.recoveryHistory);
                      if (history && history.length > 0) {
                        return (
                          <div style={{ marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Recovery Activity Log</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
                              {history.map((h, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', borderBottom: '1px solid #f8fafc', paddingBottom: '0.2rem' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{h.action}</span>
                                  <span style={{ color: h.status === 'success' ? 'var(--green-primary)' : '#ef4444', fontWeight: 600 }}>
                                    ₹{h.amount?.toLocaleString()} ({h.status})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}
                </div>

                {/* 5. Receivables & Credit Ledger Transactions */}
                <div style={drawerCardStyle}>
                  <h5 style={drawerCardTitleStyle}>
                    <FileText size={14} style={{ color: 'var(--text-primary)' }} /> Receivables & Credit Transactions
                  </h5>

                  <div style={{ marginTop: '0.75rem' }}>
                    {customerOrders.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                        {customerOrders.map((o, idx) => (
                          <div key={idx} style={historyItemStyle}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{o.productCategory || 'Corporate Invoicing'}</div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {new Date(o.purchaseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})} • Ref: {o.orderId || o.orderNumber || `INV-${1000 + idx}`}
                              </div>
                            </div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>₹{o.orderValue.toLocaleString()}</strong>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '6px', 
                        padding: '0.75rem', 
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Facility Type:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Corporate B2B Net-30 Account</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Ledger Status:</span>
                          <span style={{ fontWeight: 700, color: selectedCustomer.outstandingAmount > 0 ? (selectedCustomer.overdueAmount > 0 ? '#f87171' : 'var(--gold-champagne)') : 'var(--green-primary)' }}>
                            {selectedCustomer.outstandingAmount > 0 ? (selectedCustomer.overdueAmount > 0 ? 'Overdue Invoicing Active' : 'Current Active Invoicing') : 'Settled / Zero Outstanding'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Active Balance:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{selectedCustomer.outstandingAmount?.toLocaleString() || '0'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.35rem', marginTop: '0.35rem', fontSize: '0.65rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Last Ledger Update:</span>
                          <span style={{ fontWeight: 600 }}>
                            {selectedCustomer.lastPurchaseDate 
                              ? new Date(selectedCustomer.lastPurchaseDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) 
                              : new Date(selectedCustomer.registrationDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Outreach & Recovery Campaign History */}
                {customerCampaigns.length > 0 && (
                  <div style={drawerCardStyle}>
                    <h5 style={drawerCardTitleStyle}>
                      <Send size={14} style={{ color: 'var(--text-secondary)' }} /> Recovery Outreach Attributions ({customerCampaigns.length})
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem', maxHeight: '150px', overflowY: 'auto' }}>
                      {customerCampaigns.slice(0, 5).map((c, idx) => (
                        <div key={idx} style={historyItemStyle}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.73rem' }}>{c.campaignName}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Channel: {c.channel}</div>
                          </div>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--green-primary)', backgroundColor: 'var(--green-light)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                            Dispatched
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. Internal Notes */}
                {selectedCustomer.notes && (
                  <div style={drawerCardStyle}>
                    <h5 style={drawerCardTitleStyle}><FileText size={14} style={{ color: 'var(--text-secondary)' }} /> Account & Debtor Notes</h5>
                    <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.6rem', whiteSpace: 'pre-wrap' }}>
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* 7. DELETE CUSTOMER CONFIRMATION MODAL */}
      {/* ================================================= */}
      <AnimatePresence>
        {isDeleteOpen && customerToDelete && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={modalContainerStyle}
              className="glass-panel"
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={alertIconContainerStyle}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Delete Customer</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    Are you sure you want to delete <strong>{customerToDelete.name}</strong> ({customerToDelete.email})? 
                    This action cannot be undone and will erase their historical logs from metrics calculations.
                  </p>
                </div>
              </div>
              <div style={modalActionsStyle}>
                <button onClick={() => { setIsDeleteOpen(false); setCustomerToDelete(null); }} style={secondaryFormButtonStyle}>
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} style={dangerFormButtonStyle}>
                  Delete Customer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* FAKE CUSTOMER GENERATOR MODAL */}
      {/* ================================================= */}
      <AnimatePresence>
        {isFakeCustomersModalOpen && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={modalContainerStyle}
              className="glass-panel"
            >
              <div style={modalHeaderStyle}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Generate Demo Customers</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                    Generate mock customer records for testing and product demonstrations.
                  </p>
                </div>
                <button onClick={() => setIsFakeCustomersModalOpen(false)} style={closeButtonStyle}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleGenerateFakeCustomers} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Number of Customers to Generate</label>
                  <input 
                    type="number"
                    min="1"
                    max="1000"
                    value={fakeCount}
                    onChange={(e) => setFakeCount(parseInt(e.target.value) || 0)}
                    style={formInputStyle(false)}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>City (Optional)</label>
                  <input 
                    type="text"
                    placeholder="e.g. Chennai"
                    value={fakeCity}
                    onChange={(e) => setFakeCity(e.target.value)}
                    disabled={generateRandomCities}
                    style={{
                      ...formInputStyle(false),
                      backgroundColor: generateRandomCities ? '#f1f5f9' : '#ffffff',
                      cursor: generateRandomCities ? 'not-allowed' : 'text'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox"
                    id="generateRandomCities"
                    checked={generateRandomCities}
                    onChange={(e) => setGenerateRandomCities(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="generateRandomCities" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    Generate Random Indian Cities
                  </label>
                </div>

                <div style={modalActionsStyle}>
                  <button type="button" onClick={() => setIsFakeCustomersModalOpen(false)} style={secondaryFormButtonStyle}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isGenerating || fakeCount <= 0} style={primaryFormButtonStyle}>
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================================================= */}
      {/* 8. IMPORT CUSTOMERS MODAL (CSV WIZARD) */}
      {/* ================================================= */}
      <AnimatePresence>
        {isImportOpen && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              style={{ ...modalContainerStyle, maxWidth: '800px', width: '90%' }}
              className="glass-panel"
            >
              {/* Header */}
              <div style={modalHeaderStyle}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Import Customers</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                    Upload customer listings using CSV or Excel files.
                  </p>
                </div>
                {importStep !== 2 && (
                  <button onClick={() => setIsImportOpen(false)} style={closeButtonStyle}>
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Wizard Content */}
              <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                
                {/* STEP 1: Uploader */}
                {importStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current.click()}
                      style={dragDropAreaStyle(isDragging)}
                    >
                      <Upload size={32} style={{ color: 'var(--blue-primary)', marginBottom: '0.75rem' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Drag &amp; drop customer roster here</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Supports CSV or XLSX spreadsheet formats</div>
                      <button style={{ ...secondaryActionButtonStyle, marginTop: '1rem' }}>
                        Browse Files
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        style={{ display: 'none' }} 
                        accept=".csv"
                      />
                    </div>

                    {/* Specifications */}
                    <div style={importSpecsBoxStyle}>
                      <h5 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supported Columns Checklist</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {["Name", "Email", "Phone", "Gender", "City", "Total Spend", "Average Order Value", "Segment", "Last Purchase Date"].map(col => (
                          <span key={col} style={columnBadgeStyle}>{col}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Preview & Validation Check */}
                {importStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Metrics Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                      <div style={importSummaryBoxStyle}>
                        <span style={detailLabelStyle}>Total Records</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800 }}>{validatedRecords.length + failedRecords.length}</strong>
                      </div>
                      <div style={importSummaryBoxStyle}>
                        <span style={{...detailLabelStyle, color: 'var(--green-primary)'}}>Valid Records</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-primary)' }}>{validatedRecords.length}</strong>
                      </div>
                      <div style={importSummaryBoxStyle}>
                        <span style={{...detailLabelStyle, color: '#ef4444'}}>Invalid Records</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>{failedRecords.length}</strong>
                      </div>
                      <div style={importSummaryBoxStyle}>
                        <span style={detailLabelStyle}>Importable</span>
                        <strong style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--blue-primary)' }}>{validatedRecords.length}</strong>
                      </div>
                    </div>

                    {/* Download failed report option */}
                    {failedRecords.length > 0 && (
                      <div style={alertBannerStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <AlertTriangle size={16} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>We identified {failedRecords.length} records with validation conflicts (invalid format or duplicate email).</span>
                        </div>
                        <button onClick={downloadFailedReport} style={failedDownloadButtonStyle}>
                          <Download size={12} /> Download Failed Records CSV
                        </button>
                      </div>
                    )}

                    {/* Preview Table */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Data Integrity Preview</h4>
                      <div style={importPreviewTableContainerStyle}>
                        <table style={importTableStyle}>
                          <thead>
                            <tr style={tableHeaderRowStyle}>
                              <th style={tableHeaderStyle}>Row</th>
                              <th style={tableHeaderStyle}>Name</th>
                              <th style={tableHeaderStyle}>Email</th>
                              <th style={tableHeaderStyle}>Spend</th>
                              <th style={tableHeaderStyle}>Segment</th>
                              <th style={tableHeaderStyle}>Validation Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Failed records first */}
                            {failedRecords.slice(0, 5).map((r) => (
                              <tr key={`fail-${r.rowNum}`} style={{ ...tableRowStyle, backgroundColor: '#fef2f2' }}>
                                <td style={tableCellStyle}>{r.rowNum}</td>
                                <td style={{ ...tableCellStyle, fontWeight: 700 }}>{r.name || '---'}</td>
                                <td style={tableCellStyle}>{r.email || '---'}</td>
                                <td style={tableCellStyle}>₹{Number(r.totalSpend || 0).toLocaleString()}</td>
                                <td style={tableCellStyle}>{r.segment || '---'}</td>
                                <td style={tableCellStyle}>
                                  <span style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <AlertTriangle size={11} /> {r.error}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {/* Valid records */}
                            {validatedRecords.slice(0, 10).map((r, i) => (
                              <tr key={`valid-${i}`} style={tableRowStyle}>
                                <td style={tableCellStyle}>{failedRecords.length + i + 2}</td>
                                <td style={{ ...tableCellStyle, fontWeight: 700 }}>{r.name}</td>
                                <td style={tableCellStyle}>{r.email}</td>
                                <td style={tableCellStyle}>₹{Number(r.totalSpend || 0).toLocaleString()}</td>
                                <td style={tableCellStyle}>{r.segment || 'New Customers'}</td>
                                <td style={tableCellStyle}>
                                  <span style={{ color: 'var(--green-primary)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle size={11} /> Valid Roster Record
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right' }}>
                        Showing top 15 preview lines.
                      </div>
                    </div>

                  </div>
                )}

                {/* STEP 3: Complete */}
                {importStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', gap: '1rem' }}>
                    <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '50%', backgroundColor: 'var(--green-light)', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <CheckCircle size={32} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Import Successfully Completed</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '350px', margin: '0.5rem auto 0 auto', lineHeight: 1.4 }}>
                        Roster database tables have compiled and reconciled. AI Audience indexes and analytics widgets have dynamically refreshed.
                      </p>
                    </div>
                    <button onClick={() => setIsImportOpen(false)} style={primaryFormButtonStyle}>
                      Close Window
                    </button>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              {importStep === 2 && (
                <div style={modalActionsStyle}>
                  <button onClick={() => setImportStep(1)} style={secondaryFormButtonStyle}>
                    Back
                  </button>
                  <button 
                    onClick={triggerDatabaseImport} 
                    disabled={validatedRecords.length === 0}
                    style={primaryFormButtonStyle}
                  >
                    Import {validatedRecords.length} Valid Records
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .customer-row {
          transition: background-color 0.25s, transform 0.15s;
        }
        .customer-row:hover {
          background-color: var(--bg-secondary) !important;
          cursor: pointer;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Styling Helper Maps
const primaryActionButtonStyle = {
  backgroundColor: 'var(--blue-primary)',
  color: '#ffffff',
  border: 'none',
  padding: '0.55rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  boxShadow: '0 4px 10px var(--blue-glow)',
  transition: 'background-color 0.2s, transform 0.1s'
};

const secondaryActionButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border-color)',
  padding: '0.55rem 1rem',
  fontSize: '0.8rem',
  fontWeight: 500,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  transition: 'border-color 0.2s, background-color 0.2s'
};

const actionIconButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '0.3rem',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
  transition: 'all 0.15s'
};

// Filter panel styles
const filterBarContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '1rem',
  marginBottom: '1.5rem'
};

const searchBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  padding: '0.45rem 0.8rem',
  width: '320px',
  backgroundColor: 'var(--bg-card)',
  boxShadow: 'var(--shadow-sm)'
};

const searchInputStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '0.8rem',
  width: '100%',
  fontFamily: 'inherit',
  color: 'var(--text-primary)'
};

const selectBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-sm)',
  padding: '0.45rem 0.6rem',
  backgroundColor: 'var(--bg-card)',
  boxShadow: 'var(--shadow-sm)'
};

const selectStyle = {
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: '0.78rem',
  fontWeight: 500,
  fontFamily: 'inherit',
  cursor: 'pointer',
  color: 'var(--text-primary)'
};

// Table styles
const tableContainerStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  boxShadow: 'var(--shadow-sm)',
  overflowX: 'auto',
  marginBottom: '1rem'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.8rem'
};

const tableHeaderRowStyle = {
  borderBottom: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)'
};

const tableHeaderStyle = {
  padding: '0.85rem 1.2rem',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  fontSize: '0.72rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tableRowStyle = {
  borderBottom: '1px solid var(--border-color)'
};

const tableCellStyle = {
  padding: '0.85rem 1.2rem',
  color: 'var(--text-primary)',
  verticalAlign: 'middle'
};

const avatarStyle = (segment) => {
  const isHighValue = segment === 'High Value Customers';
  const isLoyal = segment === 'Loyal Customers';
  const isDormant = segment === 'Dormant Customers';
  const isAtRisk = segment === 'At Risk Customers';
  
  let bg = 'rgba(212, 175, 55, 0.15)';
  let color = 'var(--gold-primary)';
  if (isHighValue) { bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; }
  else if (isLoyal) { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
  else if (isDormant) { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; }
  else if (isAtRisk) { bg = 'rgba(239, 68, 68, 0.15)'; color = '#f87171'; }

  return {
    width: '2rem',
    height: '2rem',
    borderRadius: '50%',
    backgroundColor: bg,
    color: color,
    fontWeight: 700,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };
};

const segmentBadgeStyle = (segment) => {
  const isHighValue = segment === 'High Value Customers';
  const isLoyal = segment === 'Loyal Customers';
  const isDormant = segment === 'Dormant Customers';
  const isAtRisk = segment === 'At Risk Customers';

  let bg = 'rgba(212, 175, 55, 0.1)';
  let color = 'var(--gold-primary)';
  let border = 'rgba(212, 175, 55, 0.3)';
  if (isHighValue) { bg = 'rgba(16, 185, 129, 0.1)'; color = '#34d399'; border = 'rgba(16, 185, 129, 0.3)'; }
  else if (isLoyal) { bg = 'rgba(59, 130, 246, 0.1)'; color = '#60a5fa'; border = 'rgba(59, 130, 246, 0.3)'; }
  else if (isDormant) { bg = 'rgba(245, 158, 11, 0.1)'; color = '#fbbf24'; border = 'rgba(245, 158, 11, 0.3)'; }
  else if (isAtRisk) { bg = 'rgba(239, 68, 68, 0.1)'; color = '#f87171'; border = 'rgba(239, 68, 68, 0.3)'; }

  return {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
    backgroundColor: bg,
    color: color,
    border: `1px solid ${border}`,
    display: 'inline-block',
    whiteSpace: 'nowrap'
  };
};

const propensityBadgeStyle = (val) => {
  const isHigh = val >= 75;
  const isLow = val < 40;
  return {
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
    backgroundColor: isHigh ? 'rgba(16, 185, 129, 0.1)' : isLow ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
    color: isHigh ? '#34d399' : isLow ? '#f87171' : '#fbbf24',
    border: `1px solid ${isHigh ? 'rgba(16, 185, 129, 0.3)' : isLow ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
  };
};

// Pagination styles
const paginationContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '1.25rem',
  flexWrap: 'wrap',
  gap: '1rem'
};

const paginationButtonStyle = {
  border: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-card)',
  color: 'var(--text-primary)',
  padding: '0.3rem 0.6rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  transition: 'all 0.15s'
};

// Form slide-overs
const backdropStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  zIndex: 1000
};

const slidePanelStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: '520px',
  backgroundColor: 'var(--bg-card)',
  borderLeft: '1px solid var(--border-color)',
  boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.8)',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
};

const slideHeaderStyle = {
  padding: '1.5rem',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: '0.25rem',
  borderRadius: '6px',
  transition: 'background-color 0.15s'
};

const slideContentFormStyle = {
  padding: '1.5rem',
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const formSectionStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem'
};

const formSectionTitleStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const formLabelStyle = {
  fontSize: '0.72rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: '0.3rem'
};

const formInputStyle = (hasError) => ({
  width: '100%',
  padding: '0.55rem 0.75rem',
  fontSize: '0.8rem',
  border: `1px solid ${hasError ? '#ef4444' : 'var(--border-color)'}`,
  borderRadius: '6px',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  boxSizing: 'border-box'
});

const formSelectStyle = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  fontSize: '0.8rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  cursor: 'pointer'
};

const formTextAreaStyle = {
  width: '100%',
  minHeight: '80px',
  padding: '0.55rem 0.75rem',
  fontSize: '0.8rem',
  border: '1px solid var(--border-color)',
  borderRadius: '6px',
  outline: 'none',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  resize: 'vertical'
};

const errorTextStyle = {
  fontSize: '0.65rem',
  color: '#f87171',
  marginTop: '0.2rem',
  display: 'block',
  fontWeight: 500
};

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem'
};

const formGrid3Style = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '0.75rem'
};

const formActionContainerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem',
  borderTop: '1px solid var(--border-color)',
  paddingTop: '1.25rem',
  marginTop: '0.5rem'
};

const primaryFormButtonStyle = {
  backgroundColor: 'var(--gold-primary)',
  color: '#0a0a0c',
  border: 'none',
  padding: '0.6rem 1.25rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  boxShadow: '0 4px 10px var(--gold-glow)',
  transition: 'all 0.15s'
};

const secondaryFormButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.6rem 1.25rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  transition: 'all 0.15s'
};

const dangerFormButtonStyle = {
  backgroundColor: '#ef4444',
  color: '#ffffff',
  border: 'none',
  padding: '0.6rem 1.25rem',
  fontSize: '0.8rem',
  fontWeight: 600,
  borderRadius: 'var(--border-radius-sm)',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.15)',
  transition: 'all 0.15s'
};

// Profile Drawer Style Maps
const drawerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  maxWidth: '440px',
  backgroundColor: 'var(--bg-card)',
  borderLeft: '1px solid var(--border-color)',
  boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.8)',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
};

const drawerHeaderStyle = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'var(--bg-secondary)'
};

const drawerLabelStyle = {
  fontSize: '0.62rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '0.15rem'
};

const drawerActionButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)',
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  boxShadow: 'var(--shadow-sm)',
  transition: 'all 0.15s'
};

const drawerContentStyle = {
  padding: '1.5rem',
  flex: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  backgroundColor: 'var(--bg-card)'
};

const profilePanelCardStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.5rem',
  boxShadow: 'var(--shadow-sm)'
};

const largeAvatarStyle = (segment) => {
  const isHighValue = segment === 'High Value Customers';
  const isLoyal = segment === 'Loyal Customers';
  const isDormant = segment === 'Dormant Customers';
  const isAtRisk = segment === 'At Risk Customers';

  let bg = 'rgba(212, 175, 55, 0.15)';
  let color = 'var(--gold-primary)';
  if (isHighValue) { bg = 'rgba(16, 185, 129, 0.15)'; color = '#34d399'; }
  else if (isLoyal) { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
  else if (isDormant) { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; }
  else if (isAtRisk) { bg = 'rgba(239, 68, 68, 0.15)'; color = '#f87171'; }

  return {
    width: '3.5rem',
    height: '3.5rem',
    borderRadius: '50%',
    backgroundColor: bg,
    color: color,
    fontWeight: 800,
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--shadow-md)'
  };
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.78rem',
  padding: '0.25rem 0'
};

const detailLabelStyle = {
  color: 'var(--text-secondary)',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem'
};

const detailValStyle = {
  fontWeight: 600,
  color: 'var(--text-primary)',
  textAlign: 'right'
};

const labelStyle = {
  fontSize: '0.62rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const valStyle = {
  fontSize: '0.8rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginTop: '0.15rem'
};

const drawerCardStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-md)',
  padding: '1.25rem',
  boxShadow: 'var(--shadow-sm)'
};

const drawerCardTitleStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderBottom: '1px solid var(--border-color)',
  paddingBottom: '0.5rem',
  fontFamily: 'var(--font-family-title)'
};

const historyItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--border-color)'
};

// Modal popups style mappings
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '1rem'
};

const modalContainerStyle = {
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxSizing: 'border-box'
};

const modalHeaderStyle = {
  padding: '1.25rem 1.5rem',
  borderBottom: '1px solid var(--border-color)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const modalActionsStyle = {
  padding: '1.25rem 1.5rem',
  borderTop: '1px solid var(--border-color)',
  backgroundColor: 'var(--bg-secondary)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '0.75rem'
};

const alertIconContainerStyle = {
  width: '2.5rem',
  height: '2.5rem',
  borderRadius: '50%',
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  color: '#f87171',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

// CSV Importer layouts
const dragDropAreaStyle = (dragging) => ({
  border: `2px dashed ${dragging ? 'var(--gold-primary)' : 'var(--border-color)'}`,
  backgroundColor: dragging ? 'rgba(212, 175, 55, 0.1)' : 'var(--bg-secondary)',
  borderRadius: 'var(--border-radius-md)',
  padding: '2.5rem 2rem',
  textAlign: 'center',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  transition: 'all 0.2s'
});

const importSpecsBoxStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '1rem'
};

const columnBadgeStyle = {
  fontSize: '0.7rem',
  fontWeight: 600,
  padding: '0.2rem 0.5rem',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-secondary)'
};

const importSummaryBoxStyle = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem'
};

const alertBannerStyle = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: '#f87171',
  flexWrap: 'wrap',
  gap: '0.5rem'
};

const failedDownloadButtonStyle = {
  backgroundColor: 'var(--bg-secondary)',
  color: '#f87171',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  padding: '0.35rem 0.65rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  boxShadow: 'var(--shadow-sm)'
};

const importPreviewTableContainerStyle = {
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  maxHeight: '220px',
  overflowY: 'auto',
  backgroundColor: 'var(--bg-card)'
};

const importTableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  fontSize: '0.75rem'
};

const emptyStateContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6rem 2rem',
  textAlign: 'center',
  gap: '1rem',
  backgroundColor: 'var(--bg-card)',
  border: '1px dashed var(--border-color)',
  borderRadius: 'var(--border-radius-lg)',
  boxShadow: 'var(--shadow-sm)'
};

const toastStyle = (type) => ({
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  backgroundColor: 'var(--bg-card)',
  border: `1px solid ${type === 'success' ? 'var(--green-border)' : 'rgba(239, 68, 68, 0.4)'}`,
  color: type === 'success' ? '#34d399' : '#f87171',
  borderRadius: '8px',
  padding: '0.8rem 1.25rem',
  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.8)',
  zIndex: 3000,
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  maxWidth: '320px'
});
