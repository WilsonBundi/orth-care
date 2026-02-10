import { Request, Response } from 'express';
import { invoiceService } from '../services/InvoiceService';
import { auditService } from '../services/AuditService';
import { AuditEventType } from '../types/models';

export class InvoiceController {
  async createInvoice(req: Request, res: Response) {
    try {
      const { patientId, dueDate, items, taxRate, discountAmount, notes, terms } = req.body;

      const invoice = await invoiceService.createInvoice({
        patientId,
        dueDate: new Date(dueDate),
        items,
        taxRate,
        discountAmount,
        notes,
        terms,
      });

      await auditService.logEvent({
        userId: (req as any).user.id,
        eventType: AuditEventType.PROFILE_UPDATED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, action: 'invoice_created' },
      });

      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const invoice = await invoiceService.getInvoice(id);

      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Get invoice items
      const items = await invoiceService.getInvoiceItems(id);

      res.json({ ...invoice, items });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMyInvoices(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const invoices = await invoiceService.getPatientInvoices(userId);

      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOutstandingInvoices(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const invoices = await invoiceService.getOutstandingInvoices(userId);

      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getOutstandingBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const balance = await invoiceService.getPatientOutstandingBalance(userId);

      res.json({ balance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async recordPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const { amount, paymentMethod, paymentReference, transactionId } = req.body;

      const payment = await invoiceService.recordPayment(
        id,
        userId,
        amount,
        paymentMethod,
        paymentReference,
        transactionId
      );

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.PROFILE_UPDATED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { invoiceId: id, paymentId: payment.id, amount, action: 'payment_recorded' },
      });

      res.json(payment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInvoicePayments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const payments = await invoiceService.getInvoicePayments(id);

      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancelInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await invoiceService.cancelInvoice(id);

      await auditService.logEvent({
        userId: (req as any).user.id,
        eventType: AuditEventType.PROFILE_UPDATED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { invoiceId: id, action: 'invoice_cancelled' },
      });

      res.json({ message: 'Invoice cancelled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const invoiceController = new InvoiceController();
