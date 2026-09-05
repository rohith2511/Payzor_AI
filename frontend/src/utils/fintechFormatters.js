/**
 * Fintech Financial Formatters for Payzor AI Revenue Recovery
 * Indian Currency (Lakhs / Crores) and Financial Math Helpers
 */

/**
 * Formats a number into Indian Rupee currency.
 * @param {number|string} amount 
 * @param {boolean} compact - If true, formats as ₹18.45L, ₹2.14Cr, ₹75.2K
 * @returns {string} Formatted string
 */
export function formatINR(amount, compact = false) {
  const num = parseFloat(amount) || 0;
  
  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    
    if (abs >= 10000000) {
      // Crores (1 Cr = 1,00,00,000)
      const cr = (abs / 10000000).toFixed(2);
      return `${sign}₹${parseFloat(cr)}Cr`;
    } else if (abs >= 100000) {
      // Lakhs (1 L = 1,00,000)
      const l = (abs / 100000).toFixed(2);
      return `${sign}₹${parseFloat(l)}L`;
    } else if (abs >= 1000) {
      // Thousands
      const k = (abs / 1000).toFixed(1);
      return `${sign}₹${parseFloat(k)}k`;
    }
    return `${sign}₹${Math.round(abs).toLocaleString('en-IN')}`;
  }

  return `₹${Math.round(num).toLocaleString('en-IN')}`;
}

/**
 * Formats full exact amount with decimals for invoices/ledgers
 */
export function formatINRExact(amount) {
  const num = parseFloat(amount) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Returns color tokens for risk level in Obsidian & Gold Luxury Theme
 */
export function getRiskColorTokens(riskLevel) {
  const r = (riskLevel || 'Medium').toLowerCase();
  if (r === 'critical') {
    return {
      bg: 'rgba(244, 63, 94, 0.15)',
      border: 'rgba(244, 63, 94, 0.35)',
      text: '#FB7185',
      badgeClass: 'badge-critical',
      label: 'Critical'
    };
  }
  if (r === 'high') {
    return {
      bg: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.35)',
      text: '#FBBF24',
      badgeClass: 'badge-high',
      label: 'High'
    };
  }
  if (r === 'low') {
    return {
      bg: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.35)',
      text: '#34D399',
      badgeClass: 'badge-low',
      label: 'Low'
    };
  }
  // Medium
  return {
    bg: 'rgba(212, 175, 55, 0.15)',
    border: 'rgba(212, 175, 55, 0.35)',
    text: '#E5C158',
    badgeClass: 'badge-medium',
    label: 'Medium'
  };
}
