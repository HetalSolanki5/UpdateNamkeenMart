import crypto from 'crypto';

/**
 * Generate a unique order number
 * Format: RN-ORD-XXXXXXXX (timestamp in base36 + random uppercase characters)
 */
export const generateOrderNumber = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RN-ORD-${timestampPart}${randomPart}`;
};

/**
 * Generate a unique invoice number
 * Format: RN-INV-XXXXXXXX
 */
export const generateInvoiceNumber = () => {
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `RN-INV-${timestampPart}${randomPart}`;
};
