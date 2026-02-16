import { Router, type Router as ExpressRouter } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { requireMinimumRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';
import { Role } from '../types/models';

const router: ExpressRouter = Router();

// All routes require authentication and minimum BILLING_CLERK role
router.use(authenticate);
router.use(apiRateLimiter);
router.use(requireMinimumRole(Role.BILLING_CLERK));

// Get my invoices
router.get('/my-invoices', invoiceController.getMyInvoices.bind(invoiceController));

// Get outstanding invoices
router.get('/outstanding', invoiceController.getOutstandingInvoices.bind(invoiceController));

// Get outstanding balance
router.get('/outstanding-balance', invoiceController.getOutstandingBalance.bind(invoiceController));

// Get specific invoice
router.get('/:id', invoiceController.getInvoice.bind(invoiceController));

// Get invoice payments
router.get('/:id/payments', invoiceController.getInvoicePayments.bind(invoiceController));

// Create invoice - Requires BILLING_CLERK or higher
router.post('/', invoiceController.createInvoice.bind(invoiceController));

// Record payment - Requires BILLING_CLERK or higher
router.post('/:id/payment', invoiceController.recordPayment.bind(invoiceController));

// Cancel invoice - Requires BILLING_CLERK or higher
router.post('/:id/cancel', invoiceController.cancelInvoice.bind(invoiceController));

export default router;
