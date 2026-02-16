import { Router, type Router as ExpressRouter } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';

const router: ExpressRouter = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(apiRateLimiter);
router.use(requireRole('admin'));

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

// Create invoice (admin/doctor only - add authorization middleware in production)
router.post('/', invoiceController.createInvoice.bind(invoiceController));

// Record payment
router.post('/:id/payment', invoiceController.recordPayment.bind(invoiceController));

// Cancel invoice
router.post('/:id/cancel', invoiceController.cancelInvoice.bind(invoiceController));

export default router;
