import { z } from 'zod';
import { OrderStatus } from './order.constants.js';

/**
 * Validation Schemas for Order Operations
 */

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  reason: z.string().optional(),
  trackingNo: z.string().optional(),
});

export const claimTaskSchema = z.object({}); // No body needed, but defined for consistency

/**
 * Middleware wrapper for Zod validation
 */
export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: error.errors[0]?.message || 'Invalid request data',
      details: error.errors
    });
  }
};
