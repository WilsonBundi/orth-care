# Enterprise-Grade System Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer (Nginx/ALB)                │
│                              SSL Termination                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼────────┐       ┌───────▼────────┐
        │  API Gateway   │       │  CDN (Static)  │
        │   (Kong/AWS)   │       │  CloudFront    │
        └───────┬────────┘       └────────────────┘
                │
    ┌───────────┼───────────┬───────────┬──────────┐
    │           │           │           │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
│ Auth  │  │ User  │  │ Appt  │  │ Notif │  │ File  │
│Service│  │Service│  │Service│  │Service│  │Service│
└───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘  └───┬───┘
    │          │          │          │          │
    └──────────┴──────────┴──────────┴──────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
      ┌─────▼─────┐ ┌───▼────┐  ┌───▼────┐
      │PostgreSQL │ │ Redis  │  │RabbitMQ│
      │(Primary+  │ │ Cache  │  │ Queue  │
      │ Replicas) │ │        │  │        │
      └───────────┘ └────────┘  └────────┘
```

---

## 1. Microservices Architecture

### Service Breakdown

#### Auth Service
**Responsibilities**:
- User registration and login
- Password management
- MFA/2FA handling
- OAuth integration
- JWT token generation
- Session management

**Technology Stack**:
- Node.js + Express + TypeScript
- Redis for session storage
- PostgreSQL for user credentials
- JWT for stateless authentication

**API Endpoints**:
```
POST   /auth/register
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh-token
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email
POST   /auth/mfa/enable
POST   /auth/mfa/verify
POST   /auth/oauth/google
POST   /auth/oauth/facebook
```

#### User Service
**Responsibilities**:
- User profile management
- Address management
- User preferences
- Account settings
- Profile picture upload

**Technology Stack**:
- Node.js + Express + TypeScript
- PostgreSQL for user data
- S3 for profile pictures
- Redis for caching

**API Endpoints**:
```
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
GET    /users/:id/profile
PUT    /users/:id/profile
POST   /users/:id/avatar
GET    /users/:id/preferences
PUT    /users/:id/preferences
```

#### Appointment Service
**Responsibilities**:
- Appointment scheduling
- Availability management
- Appointment reminders
- Calendar integration
- Waitlist management

**Technology Stack**:
- Node.js + Express + TypeScript
- PostgreSQL for appointments
- Redis for caching
- RabbitMQ for notifications

**API Endpoints**:
```
POST   /appointments
GET    /appointments/:id
PUT    /appointments/:id
DELETE /appointments/:id
GET    /appointments/user/:userId
GET    /appointments/available-slots
POST   /appointments/:id/reschedule
POST   /appointments/:id/cancel
```

#### Notification Service
**Responsibilities**:
- Email notifications
- SMS notifications
- Push notifications
- In-app notifications
- Notification preferences

**Technology Stack**:
- Node.js + Express + TypeScript
- SendGrid for email
- Twilio for SMS
- Firebase for push notifications
- RabbitMQ for message queue

**API Endpoints**:
```
POST   /notifications/email
POST   /notifications/sms
POST   /notifications/push
GET    /notifications/user/:userId
PUT    /notifications/preferences
POST   /notifications/mark-read
```

#### File Service
**Responsibilities**:
- File upload/download
- Document management
- Image processing
- Virus scanning
- Access control

**Technology Stack**:
- Node.js + Express + TypeScript
- AWS S3 or Azure Blob Storage
- Sharp for image processing
- ClamAV for virus scanning

**API Endpoints**:
```
POST   /files/upload
GET    /files/:id
DELETE /files/:id
GET    /files/user/:userId
POST   /files/:id/share
GET    /files/:id/download
```

---

## 2. Database Design

### Enhanced Schema

#### Users Table (Enhanced)
```sql
CREATE TABLE users (
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
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'USA',
    
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
    
    -- Indexes
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

#### Sessions Table (Enhanced)
```sql
CREATE TABLE sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_id VARCHAR(255),
    device_name VARCHAR(100),
    device_type VARCHAR(50), -- mobile, desktop, tablet
    location JSONB, -- {country, city, lat, lon}
    
    -- Session management
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    
    -- Security
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0,
    
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_device_id ON sessions(device_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity_at);
```

#### Appointments Table (New)
```sql
CREATE TABLE appointments (
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

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at);
```

#### Notifications Table (New)
```sql
CREATE TABLE notifications (
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

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
```

#### Files Table (New)
```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    
    -- Storage
    storage_provider VARCHAR(50) NOT NULL, -- s3, azure, gcs
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

CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_deleted_at ON files(deleted_at) WHERE deleted_at IS NULL;
```

#### Audit Events Table (Enhanced)
```sql
CREATE TABLE audit_events (
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

CREATE INDEX idx_audit_user_id ON audit_events(user_id);
CREATE INDEX idx_audit_event_type ON audit_events(event_type);
CREATE INDEX idx_audit_timestamp ON audit_events(timestamp);
CREATE INDEX idx_audit_severity ON audit_events(severity);
CREATE INDEX idx_audit_phi_accessed ON audit_events(phi_accessed) WHERE phi_accessed = TRUE;
```

---

## 3. Caching Strategy

### Redis Cache Layers

#### L1: Session Cache
```typescript
// Session data (TTL: 30 minutes)
Key: `session:{sessionId}`
Value: {
  userId: string,
  email: string,
  role: string,
  permissions: string[],
  deviceId: string,
  expiresAt: number
}
```

#### L2: User Profile Cache
```typescript
// User profile (TTL: 1 hour)
Key: `user:profile:{userId}`
Value: {
  id: string,
  email: string,
  firstName: string,
  lastName: string,
  avatarUrl: string,
  // ... other profile fields
}
```

#### L3: Permissions Cache
```typescript
// User permissions (TTL: 24 hours)
Key: `user:permissions:{userId}`
Value: string[] // Array of permission strings
```

#### L4: Rate Limiting
```typescript
// Rate limit counters (TTL: 1 minute/1 hour)
Key: `ratelimit:ip:{ipAddress}:{endpoint}`
Value: number // Request count

Key: `ratelimit:user:{userId}:{endpoint}`
Value: number // Request count
```

#### L5: Application Data
```typescript
// Frequently accessed data (TTL: varies)
Key: `appointments:upcoming:{userId}`
Value: Appointment[] // Next 7 days

Key: `notifications:unread:{userId}`
Value: number // Unread count
```

### Cache Invalidation Strategy

1. **Write-Through**: Update cache immediately after database write
2. **Time-Based**: TTL expiration for stale data
3. **Event-Based**: Invalidate on specific events (user update, logout)
4. **Manual**: Admin-triggered cache clear

---

## 4. Message Queue Architecture

### RabbitMQ Queues

#### Email Queue
```
Queue: email.notifications
Exchange: notifications
Routing Key: email.*

Messages:
- email.welcome
- email.password_reset
- email.appointment_reminder
- email.appointment_confirmation
```

#### SMS Queue
```
Queue: sms.notifications
Exchange: notifications
Routing Key: sms.*

Messages:
- sms.otp
- sms.appointment_reminder
- sms.emergency_alert
```

#### Audit Queue
```
Queue: audit.events
Exchange: audit
Routing Key: audit.*

Messages:
- audit.login
- audit.data_access
- audit.data_modification
- audit.admin_action
```

#### File Processing Queue
```
Queue: file.processing
Exchange: files
Routing Key: file.*

Messages:
- file.virus_scan
- file.thumbnail_generation
- file.ocr_processing
```

### Message Format
```typescript
interface QueueMessage {
  id: string;
  type: string;
  timestamp: number;
  priority: number; // 1-10
  retryCount: number;
  maxRetries: number;
  payload: any;
  metadata: {
    userId?: string;
    correlationId: string;
    source: string;
  };
}
```

---

## 5. Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Auth Service validates credentials
   ↓
3. Check MFA if enabled
   ↓
4. Generate JWT access token (15 min expiry)
   ↓
5. Generate refresh token (7 days expiry)
   ↓
6. Store session in Redis
   ↓
7. Return tokens to client
   ↓
8. Client stores tokens (httpOnly cookies)
```

### JWT Token Structure

```typescript
// Access Token
{
  sub: "user-id",
  email: "user@example.com",
  role: "patient",
  permissions: ["read:own_profile", "write:own_profile"],
  sessionId: "session-id",
  iat: 1234567890,
  exp: 1234568790, // 15 minutes
  iss: "patient-portal-auth",
  aud: "patient-portal-api"
}

// Refresh Token
{
  sub: "user-id",
  sessionId: "session-id",
  tokenFamily: "family-id",
  iat: 1234567890,
  exp: 1235172690, // 7 days
  iss: "patient-portal-auth"
}
```

### Authorization Middleware

```typescript
// Permission-based authorization
@RequirePermission('read:appointments')
async getAppointments(req, res) {
  // Handler code
}

// Role-based authorization
@RequireRole('doctor', 'admin')
async getDoctorDashboard(req, res) {
  // Handler code
}

// Resource ownership check
@RequireOwnership('user')
async updateProfile(req, res) {
  // Handler code
}
```

---

## 6. API Gateway Configuration

### Kong API Gateway

```yaml
services:
  - name: auth-service
    url: http://auth-service:3001
    routes:
      - name: auth-routes
        paths:
          - /api/v1/auth
        methods:
          - GET
          - POST
        plugins:
          - name: rate-limiting
            config:
              minute: 100
              hour: 1000
          - name: cors
          - name: request-transformer

  - name: user-service
    url: http://user-service:3002
    routes:
      - name: user-routes
        paths:
          - /api/v1/users
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 200
          - name: request-size-limiting
            config:
              allowed_payload_size: 10
```

---

## 7. Monitoring & Observability

### Metrics to Track

#### Application Metrics
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users
- Database query time
- Cache hit rate

#### Business Metrics
- New registrations
- Daily active users
- Appointments booked
- Appointment cancellations
- Average session duration

#### Infrastructure Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network throughput
- Database connections
- Queue depth

### Alerting Rules

```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5m
    severity: critical
    
  - name: SlowResponseTime
    condition: p95_response_time > 1000ms
    duration: 10m
    severity: warning
    
  - name: DatabaseConnectionPoolExhausted
    condition: db_connections > 90%
    duration: 2m
    severity: critical
    
  - name: QueueBacklog
    condition: queue_depth > 10000
    duration: 15m
    severity: warning
```

---

## 8. Deployment Architecture

### Kubernetes Deployment

```yaml
# Auth Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: patient-portal/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Technology Stack Summary

### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js
- **Language**: TypeScript 5+
- **API Gateway**: Kong or AWS API Gateway
- **Authentication**: JWT + OAuth 2.0

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit or Zustand
- **UI Library**: Material-UI or Ant Design
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

### Databases
- **Primary**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Search**: Elasticsearch 8+

### Message Queue
- **Queue**: RabbitMQ or AWS SQS
- **Streaming**: Apache Kafka (optional)

### Storage
- **Object Storage**: AWS S3 or Azure Blob
- **CDN**: CloudFront or Cloudflare

### Monitoring
- **APM**: New Relic or DataDog
- **Logging**: ELK Stack or CloudWatch
- **Metrics**: Prometheus + Grafana
- **Tracing**: Jaeger or AWS X-Ray

### DevOps
- **Containers**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions or Jenkins
- **IaC**: Terraform
- **Registry**: Docker Hub or ECR

### Security
- **Secrets**: HashiCorp Vault or AWS Secrets Manager
- **Encryption**: AWS KMS
- **WAF**: AWS WAF or Cloudflare
- **DDoS Protection**: Cloudflare or AWS Shield

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time (p95) | < 200ms | APM |
| API Response Time (p99) | < 500ms | APM |
| Page Load Time | < 2s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Uptime | 99.9% | Monitoring |
| Error Rate | < 0.1% | APM |
| Cache Hit Rate | > 90% | Redis |
| Database Query Time (p95) | < 50ms | APM |
| Concurrent Users | 100,000+ | Load Testing |
| Requests per Second | 10,000+ | Load Testing |

---

## Scalability Strategy

### Horizontal Scaling
- Auto-scaling based on CPU/memory
- Load balancing across instances
- Stateless services
- Session storage in Redis

### Vertical Scaling
- Database instance upgrades
- Cache instance upgrades
- Optimize resource allocation

### Database Scaling
- Read replicas for read-heavy operations
- Connection pooling
- Query optimization
- Sharding for massive scale

### Caching Strategy
- Multi-layer caching
- CDN for static assets
- Redis for application cache
- Browser caching

---

This design provides a solid foundation for an enterprise-grade system that can scale to millions of users while maintaining security, reliability, and performance.
