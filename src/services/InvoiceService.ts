import { pool } from '../db/config';
import { v4 as uuidv4 } from 'uuid';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  paymentMethod?: string;
  paymentReference?: string;
  paidAt?: Date;
  notes?: string;
  terms?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  itemType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  appointmentId?: string;
}

export interface CreateInvoiceInput {
  patientId: string;
  dueDate: Date;
  items: {
    description: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    appointmentId?: string;
  }[];
  taxRate?: number;
  discountAmount?: number;
  notes?: string;
  terms?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  paymentReference?: string;
  transactionId?: string;
  status: string;
  paymentDate: Date;
  notes?: string;
}

export class InvoiceService {
  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate invoice number
      const invoiceNumberResult = await client.query('SELECT generate_invoice_number() as number');
      const invoiceNumber = invoiceNumberResult.rows[0].number;
      
      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
      const taxAmount = subtotal * (input.taxRate || 0);
      const discountAmount = input.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;
      
      // Create invoice
      const invoiceId = uuidv4();
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          id, invoice_number, patient_id, issue_date, due_date,
          subtotal, tax_amount, discount_amount, total_amount, balance_due,
          notes, terms, status
        ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
        RETURNING *`,
        [
          invoiceId,
          invoiceNumber,
          input.patientId,
          input.dueDate,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          totalAmount, // balance_due initially equals total_amount
          input.notes,
          input.terms || 'Payment due within 30 days'
        ]
      );
      
      // Create invoice items
      for (const item of input.items) {
        const itemTotal = item.quantity * item.unitPrice;
        await client.query(
          `INSERT INTO invoice_items (
            id, invoice_id, description, item_type, quantity, unit_price, total_price, appointment_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            uuidv4(),
            invoiceId,
            item.description,
            item.itemType,
            item.quantity,
            item.unitPrice,
            itemTotal,
            item.appointmentId
          ]
        );
      }
      
      await client.query('COMMIT');
      return this.mapToInvoice(invoiceResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );
    
    if (result.rows.length === 0) return null;
    return this.mapToInvoice(result.rows[0]);
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const result = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at',
      [invoiceId]
    );
    
    return result.rows.map(row => this.mapToInvoiceItem(row));
  }

  async getPatientInvoices(patientId: string): Promise<Invoice[]> {
    const result = await pool.query(
      `SELECT * FROM invoices 
       WHERE patient_id = $1 
       ORDER BY issue_date DESC`,
      [patientId]
    );
    
    return result.rows.map(row => this.mapToInvoice(row));
  }

  async getOutstandingInvoices(patientId: string): Promise<Invoice[]> {
    const result = await pool.query(
      `SELECT * FROM invoices 
       WHERE patient_id = $1 
       AND status IN ('pending', 'partially_paid', 'overdue')
       AND balance_due > 0
       ORDER BY due_date`,
      [patientId]
    );
    
    return result.rows.map(row => this.mapToInvoice(row));
  }

  async recordPayment(
    invoiceId: string,
    patientId: string,
    amount: number,
    paymentMethod: string,
    paymentReference?: string,
    transactionId?: string
  ): Promise<Payment> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create payment record
      const paymentId = uuidv4();
      const paymentResult = await client.query(
        `INSERT INTO payments (
          id, invoice_id, patient_id, amount, payment_method,
          payment_reference, transaction_id, status, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed', CURRENT_TIMESTAMP)
        RETURNING *`,
        [paymentId, invoiceId, patientId, amount, paymentMethod, paymentReference, transactionId]
      );
      
      // Update invoice paid amount
      await client.query(
        `UPDATE invoices 
         SET paid_amount = paid_amount + $1,
             payment_method = $2,
             payment_reference = $3,
             paid_at = CASE WHEN paid_amount + $1 >= total_amount THEN CURRENT_TIMESTAMP ELSE paid_at END
         WHERE id = $4`,
        [amount, paymentMethod, paymentReference, invoiceId]
      );
      
      await client.query('COMMIT');
      return this.mapToPayment(paymentResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPatientOutstandingBalance(patientId: string): Promise<number> {
    const result = await pool.query(
      'SELECT get_patient_outstanding_balance($1) as balance',
      [patientId]
    );
    
    return parseFloat(result.rows[0].balance) || 0;
  }

  async getInvoicePayments(invoiceId: string): Promise<Payment[]> {
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE invoice_id = $1 
       ORDER BY payment_date DESC`,
      [invoiceId]
    );
    
    return result.rows.map(row => this.mapToPayment(row));
  }

  async cancelInvoice(invoiceId: string): Promise<void> {
    await pool.query(
      `UPDATE invoices 
       SET status = 'cancelled'
       WHERE id = $1 AND paid_amount = 0`,
      [invoiceId]
    );
  }

  async markOverdueInvoices(): Promise<number> {
    const result = await pool.query('SELECT mark_overdue_invoices()');
    return result.rows[0].mark_overdue_invoices;
  }

  private mapToInvoice(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      patientId: row.patient_id,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      subtotal: parseFloat(row.subtotal),
      taxAmount: parseFloat(row.tax_amount),
      discountAmount: parseFloat(row.discount_amount),
      totalAmount: parseFloat(row.total_amount),
      paidAmount: parseFloat(row.paid_amount),
      balanceDue: parseFloat(row.balance_due),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      paidAt: row.paid_at,
      notes: row.notes,
      terms: row.terms,
    };
  }

  private mapToInvoiceItem(row: any): InvoiceItem {
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      description: row.description,
      itemType: row.item_type,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      totalPrice: parseFloat(row.total_price),
      appointmentId: row.appointment_id,
    };
  }

  private mapToPayment(row: any): Payment {
    return {
      id: row.id,
      invoiceId: row.invoice_id,
      patientId: row.patient_id,
      amount: parseFloat(row.amount),
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      transactionId: row.transaction_id,
      status: row.status,
      paymentDate: row.payment_date,
      notes: row.notes,
    };
  }
}

export const invoiceService = new InvoiceService();
