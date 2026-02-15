# Orthopedic's Care - Specialized Orthopedic Clinic Portal

A comprehensive healthcare management system for a specialized orthopedic clinic led by a qualified orthopedic doctor. The system provides patient portal, appointments, medical records, billing, and comprehensive security features for bone, joint, and muscle condition management.

## 🏥 About Orthopedic's Care

Orthopedic's Care is a specialized orthopedic clinic led by a qualified orthopedic doctor. We provide comprehensive diagnosis, treatment, and rehabilitation for bone, joint, and muscle conditions—helping patients relieve pain, restore movement, and return to daily life with confidence.

### Our Specialties
- **Joint Replacement** - Advanced hip, knee, and shoulder replacement procedures
- **Sports Medicine** - Treatment for sports injuries and athletic performance
- **Trauma Care** - Emergency treatment for fractures and injuries  
- **Spine Care** - Comprehensive spine treatment and surgery
- **Pediatric Orthopedics** - Specialized care for children's bone and joint conditions
- **Physical Therapy** - Rehabilitation and recovery programs

## 🎯 Portal Features
- **Registration & Authentication**
  - 6-step registration wizard with validation
  - Citizenship information (Kenyan/Foreign/Resident)
  - Location selection (County → Constituency → Ward)
  - Dependants management
  - Secure login with email/ID
  - Session management
  - Password change

- **Profile Management**
  - Complete patient profile view
  - Personal information
  - Contact details
  - Location information
  - Dependants list

### ✅ Appointments
- **Booking System**
  - Select specialty and doctor
  - Choose date and time slots
  - Appointment types (Consultation, Follow-up, Emergency)
  - Reason and symptoms input

- **Management**
  - View upcoming appointments
  - View past appointments
  - Reschedule appointments
  - Cancel appointments

### ✅ Medical Records
- **Document Management**
  - Upload medical documents (drag & drop)
  - Categorize by type (Lab Results, X-Rays, Prescriptions, Reports)
  - View and download documents
  - Search and filter

### ✅ Billing & Payments
- **Invoice System**
  - Automatic invoice generation
  - Multiple line items
  - Tax and discount support
  - Outstanding balance tracking

- **Payment Processing**
  - M-Pesa integration ready
  - Card payment support
  - Bank transfer
  - Payment history

### ✅ Notifications
- **Email Notifications** (SendGrid)
  - Appointment confirmations
  - Appointment reminders
  - Password reset

- **SMS Notifications** (Twilio)
  - Appointment reminders
  - Important updates

### 🔒 Security
- Password hashing (bcrypt)
- JWT authentication
- Session management
- Rate limiting
- CSRF protection
- Input sanitization
- SQL injection prevention
- XSS protection
- Security headers
- Audit logging
- MFA support (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account (free tier available)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/WilsonBundi/orth-care.git
   cd orth-care
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup Firebase Firestore**:
   
   See [FIREBASE_QUICK_START.txt](FIREBASE_QUICK_START.txt) for detailed setup instructions.
   
   Quick steps:
   - Create Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database
   - Get your Project ID
   - Update `.env` with `FIREBASE_PROJECT_ID=your-project-id`
   ```

4. **Configure environment**:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   # Firebase
   FIREBASE_PROJECT_ID=your-firebase-project-id

   # Server
   PORT=3000
   NODE_ENV=development

   # JWT
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h

   # Email (Optional - SendGrid)
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@orthocare.go.ke

   # SMS (Optional - Twilio)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=+254700000000

   # Redis (Optional)
   REDIS_URL=redis://localhost:6379

   # App URL
   APP_URL=http://localhost:3000
   ```

5. **Start the server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
orth-care/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── db/              # Database schemas and migrations
│   ├── middleware/      # Express middleware
│   ├── repositories/    # Data access layer
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   └── types/           # TypeScript types
├── public/
│   ├── *.html          # Frontend pages
│   └── js/             # Frontend JavaScript
├── logs/               # Application logs
└── docs/               # Documentation
```

## 📱 User Journey

### New User Registration
1. Visit landing page → Click "Register Now"
2. Complete 6-step registration
3. Receive welcome email
4. Login with credentials

### Booking an Appointment
1. Login → Dashboard → Appointments
2. Select specialty and doctor
3. Choose date and time slot
4. Submit booking
5. Receive confirmation email/SMS

### Managing Medical Records
1. Dashboard → Medical Records
2. Upload documents (drag & drop)
3. View/download documents
4. Filter by type

### Paying Bills
1. Dashboard → Billing
2. View outstanding invoices
3. Select payment method (M-Pesa/Card/Bank)
4. Complete payment
5. Receive confirmation

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Appointments
- `POST /api/appointments` - Create appointment
- `GET /api/appointments/my-appointments` - Get user appointments
- `GET /api/appointments/upcoming` - Get upcoming appointments
- `GET /api/appointments/available-slots` - Get available time slots
- `POST /api/appointments/:id/cancel` - Cancel appointment

### Invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/my-invoices` - Get user invoices
- `GET /api/invoices/outstanding` - Get outstanding invoices
- `GET /api/invoices/outstanding-balance` - Get total balance
- `POST /api/invoices/:id/payment` - Record payment

### Dashboard
- `GET /api/dashboard` - Get dashboard data

### Health
- `GET /health` - Health check

## 🛠️ Technology Stack

- **Backend**: Node.js, TypeScript, Express.js
- **Database**: Firebase Firestore (NoSQL Cloud Database)
- **Authentication**: JWT, bcrypt
- **Security**: Helmet, CSRF protection
- **Logging**: Winston
- **Email**: SendGrid (optional)
- **SMS**: Twilio (optional)
- **Caching**: Redis (optional)

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📝 Documentation

- `FULL_IMPLEMENTATION_COMPLETE.md` - Complete implementation details
- `SYSTEM_COMPLETE.md` - System overview
- `SETUP.md` - Detailed setup guide

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- Wilson Bundi - [@WilsonBundi](https://github.com/WilsonBundi)

## 🙏 Acknowledgments

- Inspired by SHA Kenya (Social Health Authority)
- Built for orthopaedic healthcare management

## 📞 Support

For support, email support@orthocare.go.ke or visit http://localhost:3000/help.html

---

**Status**: Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 2026
