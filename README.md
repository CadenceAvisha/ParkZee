# ParkZee – Smart Parking Marketplace

ParkZee is a Smart Parking Marketplace connecting drivers looking for reliable parking spaces with property owners who have available parking capacity.

The platform provides interactive map discovery, GPS-based nearby parking search, concurrency-safe reservation allocation, an offline direct payment confirmation workflow (no online payment gateway), cryptographically secure QR code gate access, real-time WebSocket notifications, and an administrative oversight dashboard.

---

## Key Features by Role

### 1. Driver
- **Search & Discovery**: GPS device geolocation, manual destination query, Leaflet interactive map with pins, radial filtering (distance, price, vehicle type, parking structure type).
- **Instant Reservation**: Reserve slots without paying upfront; total estimated fee calculated strictly by the backend.
- **Direct Settlement**: Pay the host offline on arrival (cash or UPI); host confirms receipt in-app.
- **Secure Entry QR Pass**: Active QR code with unpredictable cryptographic token unlocked only upon host payment confirmation.
- **Booking Management**: View upcoming, active, and past bookings; cancel eligible uncommenced reservations.
- **Reviews & Dispute Reports**: Submit 1–5 star reviews for completed sessions and file incident reports.

### 2. Parking Owner (Host)
- **Facility Listings**: Register parking locations with precise geographic coordinates, operating hours (24/7 or custom windows), supported vehicle types, and capacity.
- **Direct Payment Confirmation**: Record amount received and offline payment method (cash, UPI, transfer) to authorize driver entry.
- **Integrated QR Scanner**: In-browser camera QR scanner with server-side validation to verify reservation authenticity.
- **Gate Check-In & Check-Out**: Record vehicle entry and exit timestamps; automatically release capacity upon departure.
- **Earnings & Audit History**: Track confirmed receipts and real-time facility occupancy.

### 3. Administrator
- **Listing Verification**: Review, approve, reject, or suspend host parking facilities before they appear in public search.
- **User Management**: Monitor drivers and hosts; suspend non-compliant or fraudulent accounts.
- **Dispute Resolution**: Review user-submitted discrepancy tickets, record resolution notes, and close cases.
- **Platform Analytics**: Real-time operational metrics covering total users, active listings, reservation trends, and total confirmed offline revenue.

---

## Architectural Highlights

- **Strict No-Gateway Architecture**: Financial settlement occurs directly between driver and host offline. The platform records host attestations for auditability and gate access control.
- **Double-Layer Concurrency Safety**: Overlap condition `newStart < existingEnd && newEnd > existingStart` is enforced with per-facility process locks (`async-mutex`) and MongoDB compound indexing.
- **Server-Side QR Verification**: QR code validity, facility ownership, payment attestation, and expiration are verified on the backend.
- **Real-Time Sockets**: Instant updates for reservation creation, payment confirmation, QR check-in, and slot availability.
- **Automated Expiry Worker**: Background cron pass periodically expires reservations awaiting payment confirmation that exceed their grace window, automatically releasing reserved capacity.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, React Router DOM, Axios, TanStack Query, React Hook Form, Zod, Socket.IO Client, Leaflet, Recharts, `qrcode.react`, `html5-qrcode`, Lucide React.
- **Backend**: Node.js, Express.js, TypeScript, MongoDB, Mongoose, JWT, bcryptjs, Zod, Socket.IO, Multer, Cloudinary, Nodemailer, Helmet, express-rate-limit, node-cron, async-mutex.
- **Testing**: Jest, ts-jest, Supertest, mongodb-memory-server.

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas connection string)

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Copy environment template
cp .env.example .env

# For an administrator account, set ADMIN_BOOTSTRAP_EMAIL and
# ADMIN_BOOTSTRAP_PASSWORD in backend/.env before starting the server.

# Run development server with live reload
npm run dev

# Run automated test suite
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

The bootstrap variables create an administrator account from the trusted server process when that email does not already exist. Existing administrator accounts are left unchanged. Use a unique password of at least 12 characters. Public registration only accepts driver and owner roles. Production deployments must also set unique `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` values (at least 32 characters each).

The backend connects to the `MONGODB_URI` exactly as configured and stops with a connection error if MongoDB is unavailable. This avoids silently writing registrations to temporary in-memory storage.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Run development server
npm run dev

# Build production bundle
npm run build
```

The frontend will be available at `http://localhost:5173`.
The backend API will run at `http://localhost:5000/api`.

---

## Test Results

The backend contains a test suite covering authentication, parking search, concurrency-safe reservation allocation, direct payment confirmation, QR verification, and admin moderation:

```bash
Test Suites: 5 passed, 5 total
Tests:       27 passed, 27 total
Time:        23.092 s
```

---

## Documentation

- [System Architecture](docs/architecture.md)
- [REST API Documentation](docs/api-documentation.md)
- [Database Schema & Indexes](docs/database-schema.md)
- [Development Progress](docs/progress.md)

---

## License

Private and Confidential – ParkZee Smart Parking Marketplace.
