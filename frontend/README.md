# ParkZee — Smart Parking Marketplace Frontend

A commercial-grade, modern, and responsive web application frontend for **ParkZee (Smart Parking Marketplace)**, built with React, TypeScript, Vite, Tailwind CSS, Leaflet, and TanStack Query.

---

## 1. Core Architecture & Business Rules Implemented

1. **Direct Settlement (No Online Payment Gateway)**:
   - Drivers discover parking, compare amenities/rates, and reserve capacity in advance with **zero upfront online payment**.
   - Initial booking status is set to `RESERVED_AWAITING_OWNER_CONFIRMATION` with payment status `NOT_PAID`.
   - The driver arrives at the physical parking location and pays the parking host directly via **Cash** or the host's **UPI QR Code**.
   - The parking owner locates the booking in their Owner Portal, enters the amount received, chooses the payment method, and records their attestation.
   - The booking status updates to `CONFIRMED`, payment status updates to `PAID_CONFIRMED_BY_OWNER`, and an immutable confirmation audit record is logged with timestamp and host details.

2. **Entry QR Code Gatekeeping**:
   - **Crucial Rule**: Entry QR codes are **never generated or active** prior to owner payment confirmation.
   - Drivers viewing their reservation before owner confirmation see a locked badge with step-by-step payment instructions.
   - Once the owner confirms payment, the secure verification token activates and renders the official QR entry pass in real time.
   - Cancelled or expired reservations permanently revoke and invalidate the QR entry pass.

3. **Role-Based Access Control**:
   - **Driver**: Discover spots on Leaflet map, GPS near-me detection, reserve slots, manage vehicles, view QR tickets.
   - **Parking Owner**: Register & configure parking facilities, map coordinate picker, manage operating hours, review reservations, confirm direct offline payments, scan QR tickets.
   - **Administrator**: Platform overview metrics, listing verification approvals/rejections with required reason, user account management (suspend/reactivate), booking audits, dispute resolution, Recharts analytics.
   - **1-Click Persona Switcher**: In the navigation bar and sidebar, instant switch pills (`Driver`, `Owner`, `Admin`) allow seamless toggling between all three role perspectives during evaluation.

4. **Offline Resilience & Live Backend Support**:
   - Centralized Axios client (`services/api.ts`) points to `VITE_API_BASE_URL`.
   - When the backend is offline or before backend deployment, the frontend service layer gracefully transitions to persistent browser storage seeded with realistic commercial data, allowing every single interactive flow (booking, payment confirmation, QR scanning, admin approvals) to work end-to-end immediately.

---

## 2. Technology Stack

- **Framework**: React 18 / 19 + TypeScript (Strict mode)
- **Bundler & Tooling**: Vite
- **Styling**: Tailwind CSS + Custom Mobility Commercial Palette
- **Routing**: React Router DOM (v7) with role-based `ProtectedRoute` guards
- **Server State & Caching**: TanStack Query (React Query)
- **Forms & Validation**: React Hook Form + Zod
- **Interactive Maps**: Leaflet + React Leaflet with OpenStreetMap tiles & custom SVG price markers
- **QR Code Engine**: `qrcode.react` (SVG generation) + `html5-qrcode` (camera barcode & QR scanner)
- **Charts & Visualizations**: Recharts (Revenue trend Area charts, booking distribution Pie charts, hourly demand Bar charts)
- **Real-time Event Bus**: Socket.IO Client with automatic room subscription (`parking:join`, `booking:confirmed`, etc.)
- **Icons**: Lucide React

---

## 3. Directory Structure

```
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env / .env.example
└── src/
    ├── types/                 # Strict TypeScript models
    │   ├── user.types.ts
    │   ├── parking.types.ts
    │   ├── booking.types.ts
    │   ├── payment.types.ts
    │   ├── report.types.ts
    │   └── socket.types.ts
    ├── schemas/               # Zod validation schemas
    │   ├── auth.schema.ts
    │   ├── parking.schema.ts
    │   ├── booking.schema.ts
    │   └── payment.schema.ts
    ├── services/              # Centralized API and storage layer
    │   ├── api.ts
    │   ├── auth.service.ts
    │   ├── parking.service.ts
    │   ├── booking.service.ts
    │   ├── payment.service.ts
    │   ├── qr.service.ts
    │   ├── admin.service.ts
    │   ├── storage.ts
    │   └── mockData.ts
    ├── context/               # Global state contexts
    │   ├── AuthContext.tsx
    │   ├── NotificationContext.tsx
    │   └── SocketContext.tsx
    ├── routes/                # Protected role-based routing
    │   ├── AppRoutes.tsx
    │   └── ProtectedRoute.tsx
    ├── components/
    │   ├── common/            # Button, Input, Modal, Badge, Toast, Card, Skeleton, EmptyState
    │   │   ├── Navbar.tsx
    │   │   ├── Footer.tsx
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Card.tsx
    │   │   ├── Modal.tsx
    │   │   ├── Toast.tsx
    │   │   ├── LoadingSkeleton.tsx
    │   │   └── EmptyState.tsx
    │   ├── layout/            # Layout wrappers
    │   │   ├── PublicLayout.tsx
    │   │   └── DashboardLayout.tsx
    │   ├── maps/              # Leaflet components
    │   │   ├── ParkingMap.tsx
    │   │   └── LocationPickerMap.tsx
    │   ├── parking/           # Parking search & cards
    │   │   ├── ParkingCard.tsx
    │   │   └── ParkingFilterBar.tsx
    │   ├── booking/           # Booking & direct payment modals
    │   │   ├── BookingStatusBadge.tsx
    │   │   └── DirectPaymentModal.tsx
    │   ├── qr/                # QR display and camera scanner
    │   │   ├── QRCodeDisplay.tsx
    │   │   └── QRScannerModal.tsx
    │   └── dashboard/         # Dashboard metrics & Recharts widgets
    │       ├── StatCard.tsx
    │       ├── RevenueChart.tsx
    │       └── BookingsPieChart.tsx
    └── pages/
        ├── public/            # LandingPage
        ├── auth/              # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
        ├── driver/            # DriverDashboard, ParkingSearch, ParkingDetails, BookingCheckout, MyBookings, DriverBookingDetail, DriverProfile
        ├── owner/             # OwnerDashboard, ManageListings, AddEditListing, OwnerBookings, OwnerScanner, OwnerProfile
        └── admin/             # AdminDashboard, AdminUsers, AdminListings, AdminBookings, AdminReports, AdminAnalytics
```

---

## 4. Implemented Pages & Workflows

### Public & Authentication
- **Landing Page (`/`)**: Hero with location/date/time search bar, 4-step direct parking explanation, driver & owner value props, featured parking cards, trust & safety.
- **Login Page (`/login`)**: Email & password authentication with password toggle, 1-click test credential fill buttons for Driver, Owner, and Admin.
- **Registration Page (`/register`)**: Account creation with Driver or Parking Owner selection (Admin accounts cannot register publicly as per business rules).
- **Forgot Password (`/forgot-password`) & Reset Password (`/reset-password`)**: Recovery instructions workflow.

### Driver Experience
- **Driver Dashboard (`/driver/dashboard`)**: Welcome banner, active reservations spotlight with QR pass trigger, quick stats, nearby parking recommendations.
- **Parking Search (`/search`)**: Interactive Leaflet map with custom price markers, GPS geolocation detection, search query input, vehicle category filter, parking structure type filter, price slider, and sorting (distance, price, rating, capacity).
- **Parking Details (`/parking/:id`)**: Photo gallery, description, coordinates, operating hours, capacity gauge, supported vehicle types, amenities list, verified host contact, and interactive time duration widget.
- **Booking Checkout (`/booking/:parkingId`)**: Vehicle number plate & category selection, date & time interval picker, conflict overlap detection, real-time total calculation, explicit direct settlement explanation, and confirmation receipt.
- **My Reservations (`/driver/bookings`)**: Categorized tabs (All, Active/Upcoming, Completed, Cancelled) with status badges and quick link to QR pass.
- **Booking Details & QR Pass (`/driver/bookings/:id`)**: Lifecycle timeline, locked state with clear arrival payment steps before host confirmation, and dynamic active QR pass once payment is recorded.
- **Driver Profile (`/driver/profile`)**: Personal contact details, multi-vehicle management (add/remove saved vehicles with license plates).

### Parking Owner Experience
- **Owner Dashboard (`/owner/dashboard`)**: Total facilities, active listings, today's arrivals, current occupancy gauge, direct revenue counter, pending payment confirmations alert banner, weekly revenue area chart, and recent customer reservations table.
- **Manage Listings (`/owner/listings`)**: View parking facilities, capacity, hourly rate, approval status (`Approved`, `Pending`, `Rejected`), and public preview link.
- **Add / Edit Parking Listing (`/owner/listings/new` & `/owner/listings/edit/:id`)**: 6-section wizard with `LocationPickerMap` to place entrance pin, street address, structure type, capacity, hourly rate, vehicle compatibility, operating hours schedule (24x7 or custom times), amenities checklist, and photo URL manager.
- **Owner Bookings (`/owner/bookings`)**: Reservation ledger with filter tabs (`Awaiting Payment`, `Confirmed & Active`, `Completed`), driver contact, vehicle plate, and the **Direct Payment Confirmation** action trigger.
- **Direct Payment Confirmation Modal**: Modal recording payment method received (`Cash` or `UPI`), amount received, reference notes, host attestation checkbox, and confirmation timestamp.
- **QR Entry & Exit Scanner (`/owner/scanner`)**: Camera-based `html5-qrcode` scanner with manual booking reference input fallback, verifying validity, check-in registration, and checkout capacity release.
- **Owner Profile (`/owner/profile`)**: Host contact, accepted direct settlement modes (UPI ID and cash acceptance).

### Administrator Experience
- **Admin Dashboard (`/admin/dashboard`)**: Platform metrics (users, drivers, hosts, listings, pending approvals, active bookings, direct turnover), pending approval callout, platform revenue trends, and booking lifecycle pie chart.
- **User Management (`/admin/users`)**: Searchable user table with role filters, join date, account status, and suspend/reactivate actions.
- **Listing Approvals (`/admin/listings`)**: Inspection of submitted listings with map coordinates, photos, and host details; approve button or reject modal with mandatory reason.
- **Platform Bookings (`/admin/bookings`)**: Centralized ledger of all reservations across the marketplace.
- **Dispute Resolution & Reports (`/admin/reports`)**: User tickets regarding parking discrepancies, with resolution audit logging.
- **Analytics (`/admin/analytics`)**: Recharts visualizations for settlement velocity, user growth by role, and hourly capacity utilization.

---

## 5. Expected Backend REST API Contract

When connecting a live backend, the centralized Axios service (`services/api.ts`) expects:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user, return JWT token & user object |
| `POST` | `/api/auth/register` | Register Driver or Owner |
| `GET` | `/api/auth/me` | Current authenticated user profile |
| `POST` | `/api/auth/forgot-password` | Dispatch password reset email |
| `POST` | `/api/auth/reset-password` | Update password with token |
| `GET` | `/api/parking/search` | Geospatial and filtered parking search |
| `GET` | `/api/parking/:id` | Get parking location details |
| `POST` | `/api/parking` | Create new listing (pending review) |
| `PUT` | `/api/parking/:id` | Update listing details |
| `GET` | `/api/parking/owner/:ownerId` | Get listings owned by specific host |
| `PATCH`| `/api/parking/:id/verification` | Admin approve/reject listing |
| `POST` | `/api/bookings` | Create reservation without online payment |
| `GET` | `/api/bookings/driver/:driverId` | Get driver's reservations |
| `GET` | `/api/bookings/owner/:ownerId` | Get reservations for host's locations |
| `GET` | `/api/bookings/:id` | Get single reservation details |
| `POST` | `/api/bookings/:id/cancel` | Cancel reservation |
| `POST` | `/api/payments/confirm-direct`| Record owner confirmation of direct Cash/UPI payment |
| `GET` | `/api/payments/history` | Audit log of confirmed payments |
| `POST` | `/api/qr/verify` | Verify booking QR token |
| `POST` | `/api/qr/check-in` | Record vehicle check-in |
| `POST` | `/api/qr/check-out` | Record vehicle check-out and restore slot capacity |
| `GET` | `/api/admin/stats` | Platform metrics and counters |
| `GET` | `/api/admin/users` | List all platform users |
| `PATCH`| `/api/admin/users/:id/status` | Suspend or reactivate user |
| `GET` | `/api/admin/reports` | List platform dispute reports |
| `PATCH`| `/api/admin/reports/:id/resolve` | Record report resolution notes |

---

## 6. Real-Time Socket.IO Events

The Socket.IO service (`context/SocketContext.tsx`) supports:

- `parking:join` (Client -> Server): Join a specific parking location's live room.
- `parking:leave` (Client -> Server): Leave parking room.
- `parking:availability_updated` (Server -> Client): Capacity update broadcast.
- `booking:created` (Server -> Client): Notify owner of incoming reservation.
- `booking:confirmed` (Server -> Client): Notify driver that direct payment was confirmed and QR code is active.
- `booking:checked_in` (Server -> Client): Notify driver/owner of entry.
- `booking:completed` (Server -> Client): Notify driver/owner of exit.
- `reservation:expired` (Server -> Client): Capacity released on no-show.

---

## 7. How to Run the Frontend

### Prerequisites
- Node.js >= 18.x (tested on Node v22.15.0)
- npm >= 9.x

### Commands
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start local Vite development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```
