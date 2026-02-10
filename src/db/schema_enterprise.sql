-- Enterprise Patient Portal Database Schema
-- Enhanced schema with MFA, OAuth, appointments, notifications, files, and more

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone_number VARCHAR(20),
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(50),
  address_zip_code VARCHAR(20),
  address_country VARCHAR(100) DEFAULT 'USA',
  
  -- MFA
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  mfa_backup_codes TEXT[],
  
  -- OAuth
  google_id VARCHAR(255),
  facebook_id VARCHAR(255),
  apple_id VARCHAR(255),
  
  -- Profile
  avatar_url TEXT,
  bio TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  
  -- Role
  role VARCHAR(50) NOT NULL DEFAULT 'patient',
  
  -- Security
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  password_changed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_facebook_id ON users(facebook_id);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

-- ============================================
-- SESSIONS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_id VARCHAR(255),
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  location JSONB,
  
  -- Session management
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  invalidated BOOLEAN DEFAULT FALSE,
  
  -- Security
  is_suspicious BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0,
  
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_sessions_invalidated ON sessions(invalidated);

-- ============================================
-- TRUSTED DEVICES TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(100),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_expires_at ON trusted_devices(expires_at);

-- ============================================
-- APPOINTMENTS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  doctor_id UUID NOT NULL REFERENCES users(id),
  
  -- Appointment details
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  -- scheduled, confirmed, in_progress, completed, cancelled, no_show
  
  -- Type
  appointment_type VARCHAR(50) NOT NULL,
  -- consultation, follow_up, emergency, routine_checkup
  
  -- Details
  reason TEXT,
  notes TEXT,
  symptoms TEXT[],
  
  -- Reminders
  reminder_sent BOOLEAN DEFAULT FALSE,
  reminder_sent_at TIMESTAMP,
  
  -- Cancellation
  cancelled_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_time CHECK (end_time > start_time),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480)
);

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- ============================================
-- NOTIFICATIONS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Notification details
  type VARCHAR(50) NOT NULL,
  -- email, sms, push, in_app
  
  channel VARCHAR(50) NOT NULL,
  -- appointment_reminder, password_reset, account_update, etc.
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery
  status VARCHAR(50) DEFAULT 'pending',
  -- pending, sent, delivered, failed, read
  
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMP,
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- ============================================
-- FILES TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- File details
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  
  -- Storage
  storage_provider VARCHAR(50) NOT NULL, -- s3, azure, gcs, local
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(255),
  
  -- Security
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_key_id VARCHAR(255),
  virus_scanned BOOLEAN DEFAULT FALSE,
  virus_scan_result VARCHAR(50),
  
  -- Access control
  is_public BOOLEAN DEFAULT FALSE,
  access_token VARCHAR(255),
  access_expires_at TIMESTAMP,
  
  -- Metadata
  file_type VARCHAR(50), -- medical_record, lab_result, prescription, etc.
  tags TEXT[],
  description TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- AUDIT EVENTS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  
  -- Event details
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL, -- auth, data_access, data_modification, admin
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  
  -- Request context
  ip_address VARCHAR(45),
  user_agent TEXT,
  request_id VARCHAR(100),
  session_id VARCHAR(64),
  
  -- Event data
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(50),
  outcome VARCHAR(20) NOT NULL, -- success, failure, partial
  
  -- Details
  details JSONB,
  error_message TEXT,
  
  -- Compliance
  phi_accessed BOOLEAN DEFAULT FALSE,
  data_exported BOOLEAN DEFAULT FALSE,
  
  -- Tamper detection
  previous_hash VARCHAR(64),
  current_hash VARCHAR(64) NOT NULL,
  
  -- Metadata
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_outcome CHECK (outcome IN ('success', 'failure', 'partial'))
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_phi_accessed ON audit_events(phi_accessed) WHERE phi_accessed = TRUE;

-- ============================================
-- PERMISSIONS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  UNIQUE(role, action, resource)
);

CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);

-- Insert initial permissions
INSERT INTO permissions (role, action, resource) VALUES
  ('patient', 'read', 'own_profile'),
  ('patient', 'write', 'own_profile'),
  ('patient', 'read', 'dashboard'),
  ('patient', 'read', 'own_appointments'),
  ('patient', 'write', 'own_appointments'),
  ('patient', 'read', 'own_files'),
  ('patient', 'write', 'own_files'),
  ('doctor', 'read', 'all_appointments'),
  ('doctor', 'write', 'all_appointments'),
  ('doctor', 'read', 'patient_files'),
  ('admin', 'read', 'all_users'),
  ('admin', 'write', 'all_users'),
  ('admin', 'read', 'audit_logs'),
  ('admin', 'write', 'system_settings')
ON CONFLICT (role, action, resource) DO NOTHING;

-- ============================================
-- API KEYS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  scopes TEXT[],
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================
-- RATE LIMITS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(255) NOT NULL, -- IP or user ID
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  blocked_until TIMESTAMP,
  
  UNIQUE(identifier, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Active sessions view
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
  s.id,
  s.user_id,
  u.email,
  u.first_name,
  u.last_name,
  s.device_name,
  s.ip_address,
  s.created_at,
  s.last_activity_at,
  s.expires_at
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > CURRENT_TIMESTAMP
  AND s.revoked_at IS NULL
  AND s.invalidated = FALSE;

-- Upcoming appointments view
CREATE OR REPLACE VIEW upcoming_appointments AS
SELECT 
  a.id,
  a.patient_id,
  p.first_name AS patient_first_name,
  p.last_name AS patient_last_name,
  a.doctor_id,
  d.first_name AS doctor_first_name,
  d.last_name AS doctor_last_name,
  a.appointment_date,
  a.start_time,
  a.end_time,
  a.appointment_type,
  a.status
FROM appointments a
JOIN users p ON a.patient_id = p.id
JOIN users d ON a.doctor_id = d.id
WHERE a.appointment_date >= CURRENT_DATE
  AND a.status IN ('scheduled', 'confirmed')
ORDER BY a.appointment_date, a.start_time;

-- Unread notifications view
CREATE OR REPLACE VIEW unread_notifications AS
SELECT 
  n.id,
  n.user_id,
  n.type,
  n.title,
  n.message,
  n.created_at
FROM notifications n
WHERE n.read_at IS NULL
  AND n.status = 'delivered'
ORDER BY n.created_at DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired trusted devices
CREATE OR REPLACE FUNCTION cleanup_expired_devices()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM trusted_devices
  WHERE expires_at < CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts with MFA and OAuth support';
COMMENT ON TABLE sessions IS 'Active user sessions with device tracking';
COMMENT ON TABLE trusted_devices IS 'Devices trusted for MFA bypass';
COMMENT ON TABLE appointments IS 'Patient appointments with doctors';
COMMENT ON TABLE notifications IS 'Email, SMS, and push notifications';
COMMENT ON TABLE files IS 'User-uploaded files with virus scanning';
COMMENT ON TABLE audit_events IS 'Tamper-evident audit log';
COMMENT ON TABLE permissions IS 'Role-based access control';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE rate_limits IS 'Rate limiting tracking';
