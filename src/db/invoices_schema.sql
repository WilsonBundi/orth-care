-- Invoice Management System Schema

-- ============================================
-- INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES users(id),
  
  -- Invoice details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  balance_due DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, paid, partially_paid, overdue, cancelled
  
  -- Payment details
  payment_method VARCHAR(50),
  -- mpesa, card, bank_transfer, cash, insurance
  
  payment_reference VARCHAR(100),
  paid_at TIMESTAMP,
  
  -- Additional info
  notes TEXT,
  terms TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    discount_amount >= 0 AND
    total_amount >= 0 AND
    paid_amount >= 0 AND
    balance_due >= 0
  ),
  CONSTRAINT valid_dates CHECK (due_date >= issue_date)
);

CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

-- ============================================
-- INVOICE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  
  -- Item details
  description TEXT NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  -- consultation, procedure, medication, lab_test, xray, therapy, other
  
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Reference
  appointment_id UUID REFERENCES appointments(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_prices CHECK (unit_price >= 0 AND total_price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_appointment ON invoice_items(appointment_id);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  patient_id UUID NOT NULL REFERENCES users(id),
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  -- mpesa, card, bank_transfer, cash, insurance
  
  payment_reference VARCHAR(100),
  transaction_id VARCHAR(100),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- pending, completed, failed, refunded
  
  -- Payment gateway response
  gateway_response JSONB,
  
  -- Timestamps
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- ============================================
-- INSURANCE CLAIMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  patient_id UUID NOT NULL REFERENCES users(id),
  
  -- Insurance details
  insurance_provider VARCHAR(100) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  claim_number VARCHAR(100) UNIQUE,
  
  -- Claim amounts
  claimed_amount DECIMAL(10, 2) NOT NULL,
  approved_amount DECIMAL(10, 2),
  patient_responsibility DECIMAL(10, 2),
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'submitted',
  -- submitted, under_review, approved, partially_approved, rejected, paid
  
  -- Dates
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approval_date DATE,
  payment_date DATE,
  
  -- Additional info
  diagnosis_codes TEXT[],
  procedure_codes TEXT[],
  notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_claim_amounts CHECK (
    claimed_amount > 0 AND
    (approved_amount IS NULL OR approved_amount >= 0) AND
    (patient_responsibility IS NULL OR patient_responsibility >= 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_invoice ON insurance_claims(invoice_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_claim_number ON insurance_claims(claim_number);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update invoice updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- Update insurance claim updated_at timestamp
CREATE TRIGGER trigger_update_insurance_claim_updated_at
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_updated_at();

-- Auto-calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due = NEW.total_amount - NEW.paid_amount;
  
  -- Update status based on payment
  IF NEW.paid_amount = 0 THEN
    IF NEW.due_date < CURRENT_DATE THEN
      NEW.status = 'overdue';
    ELSE
      NEW.status = 'pending';
    END IF;
  ELSIF NEW.paid_amount >= NEW.total_amount THEN
    NEW.status = 'paid';
  ELSE
    NEW.status = 'partially_paid';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_invoice_balance
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_balance();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
  next_number INTEGER;
  invoice_num VARCHAR;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM invoices
  WHERE invoice_number LIKE 'INV-%';
  
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- Get patient outstanding balance
CREATE OR REPLACE FUNCTION get_patient_outstanding_balance(p_patient_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_balance DECIMAL;
BEGIN
  SELECT COALESCE(SUM(balance_due), 0)
  INTO total_balance
  FROM invoices
  WHERE patient_id = p_patient_id
    AND status IN ('pending', 'partially_paid', 'overdue');
  
  RETURN total_balance;
END;
$$ LANGUAGE plpgsql;

-- Mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status IN ('pending', 'partially_paid')
    AND due_date < CURRENT_DATE
    AND balance_due > 0;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Outstanding invoices view
CREATE OR REPLACE VIEW outstanding_invoices AS
SELECT 
  i.id,
  i.invoice_number,
  i.patient_id,
  u.first_name,
  u.last_name,
  u.email,
  i.issue_date,
  i.due_date,
  i.total_amount,
  i.paid_amount,
  i.balance_due,
  i.status,
  CASE 
    WHEN i.due_date < CURRENT_DATE THEN CURRENT_DATE - i.due_date
    ELSE 0
  END AS days_overdue
FROM invoices i
JOIN users u ON i.patient_id = u.id
WHERE i.status IN ('pending', 'partially_paid', 'overdue')
  AND i.balance_due > 0
ORDER BY i.due_date;

-- Patient billing summary view
CREATE OR REPLACE VIEW patient_billing_summary AS
SELECT 
  u.id AS patient_id,
  u.first_name,
  u.last_name,
  u.email,
  COUNT(i.id) AS total_invoices,
  COALESCE(SUM(i.total_amount), 0) AS total_billed,
  COALESCE(SUM(i.paid_amount), 0) AS total_paid,
  COALESCE(SUM(i.balance_due), 0) AS total_outstanding,
  COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count
FROM users u
LEFT JOIN invoices i ON u.id = i.patient_id
WHERE u.role = 'patient'
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert sample payment terms
INSERT INTO invoices (id, invoice_number, patient_id, issue_date, due_date, subtotal, tax_amount, total_amount, balance_due, status, terms)
SELECT 
  gen_random_uuid(),
  'SAMPLE-001',
  id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  0,
  0,
  0,
  0,
  'cancelled',
  'Payment due within 30 days. Late payments may incur additional charges.'
FROM users
WHERE role = 'patient'
LIMIT 0; -- Don't actually insert, just for reference

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE invoices IS 'Patient invoices for medical services';
COMMENT ON TABLE invoice_items IS 'Line items for each invoice';
COMMENT ON TABLE payments IS 'Payment transactions for invoices';
COMMENT ON TABLE insurance_claims IS 'Insurance claims for invoices';
COMMENT ON FUNCTION generate_invoice_number() IS 'Generates sequential invoice numbers';
COMMENT ON FUNCTION get_patient_outstanding_balance(UUID) IS 'Returns total outstanding balance for a patient';
COMMENT ON FUNCTION mark_overdue_invoices() IS 'Marks invoices as overdue past due date';
