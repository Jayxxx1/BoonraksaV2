/**
 * centralize storage path management for future Object Storage integration.
 * This ensures consistency across the application and prepares for a 
 * cleaner migration to S3/Cloud Storage.
 */

/**
 * Generates a path for product images.
 * Format: products/{productId}/images/{filename}
 */
export const generateProductPath = (productId, filename) => {
  return `products/${productId}/images/${filename}`;
};

/**
 * Generates a path for order-related files.
 * Format: orders/{orderId}/{type}/{filename}
 */
export const generateOrderPath = (orderId, type, filename) => {
  const allowedTypes = ['design', 'production', 'payments', 'misc'];
  const folder = allowedTypes.includes(type) ? type : 'misc';
  return `orders/${orderId}/${folder}/${filename}`;
};

/**
 * Generates a path for customer-related files.
 * Format: customers/{customerId}/orders/{orderId}/{type}/{filename}
 */
export const generateCustomerOrderPath = (customerId, orderId, type, filename) => {
  const allowedTypes = ['design', 'print', 'slip', 'misc'];
  const folder = allowedTypes.includes(type) ? type : 'misc';
  return `customers/${customerId}/orders/${orderId}/${folder}/${filename}`;
};

/**
 * Generates a path for payment slips.
 * Format: payments/orders/{orderId}/{filename}
 */
export const generatePaymentSlipPath = (orderId, filename) => {
  return `payments/orders/${orderId}/${filename}`;
};

export default {
  generateProductPath,
  generateOrderPath,
  generateCustomerOrderPath,
  generatePaymentSlipPath,
};
