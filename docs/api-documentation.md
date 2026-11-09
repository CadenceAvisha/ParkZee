# ParkZee – REST API Specification

Base URL: `http://localhost:5000/api` (or `/api`)

All requests requiring authentication must include the HTTP header:
`Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /auth/register`
Registers a new user account as DRIVER or OWNER (public registration as ADMIN is disallowed).
- **Body**:
  ```json
  {
    "name": "Ravi Kumar",
    "email": "ravi@example.com",
    "phone": "+919876543210",
    "role": "driver",
    "password": "Password123"
  }
  ```
- **Response** `(201 Created)`:
  ```json
  {
    "success": true,
    "token": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "67ce12...",
      "name": "Ravi Kumar",
      "email": "ravi@example.com",
      "role": "driver",
      "accountStatus": "active"
    }
  }
  ```

### `POST /auth/login`
Authenticates existing active users and returns JWT tokens.
- **Body**:
  ```json
  {
    "email": "ravi@example.com",
    "password": "Password123"
  }
  ```
- **Response** `(200 OK)`:
  ```json
  {
    "success": true,
    "token": "eyJhbG...",
    "user": { ... }
  }
  ```

### `GET /auth/me`
Returns current authenticated user session.
- **Headers**: `Authorization: Bearer <token>`
- **Response** `(200 OK)`: User profile object.

---

## 2. Parking Facility Endpoints (`/api/parking`)

### `GET /parking/search`
Geospatial and text-based discovery of active, approved parking facilities.
- **Query Parameters**:
  - `locationQuery` (string): Text search across name, address, city.
  - `latitude` (number): User latitude coordinate.
  - `longitude` (number): User longitude coordinate.
  - `radiusKm` (number): Radial discovery boundary in kilometers (default 25km).
  - `vehicleType` (string): `car` | `suv` | `motorcycle` | `ev` | `truck`.
  - `parkingType` (string): `covered` | `uncovered` | `multi-level` | `underground` | `driveway`.
  - `maxPrice` (number): Maximum hourly rate.
  - `sortBy` (string): `distance` | `price_asc` | `price_desc` | `rating` | `capacity`.
- **Response** `(200 OK)`: Array of parking locations with computed `distanceKm`.

### `GET /parking/:id`
Retrieves detailed information for a single parking facility.

### `POST /parking`
Creates a new parking facility (Owner only; created in `pending` review status).
- **Headers**: `Authorization: Bearer <owner_token>`
- **Body**:
  ```json
  {
    "name": "Brigade Metro Garage",
    "description": "CCTV guarded parking near station",
    "address": "MG Road 4th Cross",
    "city": "Bengaluru",
    "postalCode": "560001",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "supportedVehicleTypes": ["car", "suv"],
    "parkingType": "covered",
    "totalCapacity": 10,
    "pricePerHour": 50,
    "openTime": "06:00",
    "closeTime": "23:00",
    "is24x7": false,
    "openDays": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    "amenities": ["CCTV", "Covered Roof"],
    "photos": ["https://images.unsplash.com/..."]
  }
  ```

### `PATCH /parking/:id/verification`
Admin approval or rejection of host listing.
- **Headers**: `Authorization: Bearer <admin_token>`
- **Body**: `{ "status": "approved" | "rejected" | "suspended", "rejectionReason": "optional" }`

---

## 3. Booking Engine Endpoints (`/api/bookings`)

### `POST /bookings`
Creates a time-interval reservation with concurrency-safe overlap validation.
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "parkingLocationId": "67ce123...",
    "vehicleDetails": {
      "plateNumber": "KA-01-AB-1234",
      "makeModel": "Hyundai Creta",
      "vehicleType": "car",
      "color": "Silver"
    },
    "startTime": "2026-11-08T18:00:00.000Z",
    "endTime": "2026-11-08T21:00:00.000Z"
  }
  ```
- **Response** `(201 Created)`:
  Initial status: `bookingStatus = RESERVED_AWAITING_OWNER_CONFIRMATION`, `paymentStatus = NOT_PAID`.

### `GET /bookings/driver/:driverId`
Retrieves booking history for the specified driver.

### `GET /bookings/owner/:ownerId`
Retrieves incoming and past reservations for facilities owned by the host.

### `POST /bookings/:bookingId/cancel`
Cancels an active uncommenced reservation and automatically restores facility capacity.

---

## 4. Direct Payment Endpoints (`/api/payments`)

### `POST /payments/confirm-direct`
Host confirmation of direct offline payment (Cash, UPI, etc.) received from driver.
- **Headers**: `Authorization: Bearer <owner_token>`
- **Body**:
  ```json
  {
    "bookingId": "67ce123...",
    "amountReceived": 150,
    "paymentMethod": "upi",
    "notes": "Driver paid via UPI at entrance"
  }
  ```
- **Response** `(200 OK)`:
  Returns updated booking (`bookingStatus = CONFIRMED`, `paymentStatus = PAID_CONFIRMED_BY_OWNER`, `verificationToken = PKZ-SEC-...`) and immutable `paymentRecord` audit object.

### `GET /payments/history`
Returns history of confirmed direct payments for the host.

---

## 5. QR Verification & Gate Access Endpoints (`/api/qr`)

### `POST /qr/verify`
Server-side validation of driver QR code token by authorized host scanner.
- **Headers**: `Authorization: Bearer <owner_token>`
- **Body**: `{ "token": "PKZ-SEC-...", "ownerParkingId": "optional" }`
- **Response** `(200 OK)`:
  ```json
  {
    "valid": true,
    "message": "Valid QR token verified. Driver is authorized for entry.",
    "booking": {
      "id": "67ce123...",
      "bookingReference": "PKZ-2026-5541",
      "driverName": "Ravi Kumar",
      "vehiclePlate": "KA-01-AB-1234",
      "vehicleType": "car",
      "parkingName": "Brigade Metro Garage",
      "bookingStatus": "CONFIRMED",
      "paymentStatus": "PAID_CONFIRMED_BY_OWNER",
      "amount": 150,
      "alreadyCheckedIn": false
    }
  }
  ```

### `POST /qr/check-in`
Records vehicle gate entry timestamp (`checkInTime`) and sets status to `CHECKED_IN`.

### `POST /qr/check-out`
Records vehicle departure timestamp (`checkOutTime`), sets status to `COMPLETED`, and releases capacity back to facility.

---

## 6. Reports & Reviews (`/api/reports`, `/api/reviews`)

### `POST /reports`
Submits an incident or discrepancy report ticket.
- **Body**: `{ "targetType": "parking_location" | "booking" | "user" | "payment_dispute", "targetId": "...", "targetTitle": "...", "reason": "...", "description": "..." }`

### `POST /reviews`
Submits a 1-5 star review for an eligible `COMPLETED` booking. Recalculates average facility rating.

---

## 7. Admin Endpoints (`/api/admin`)

- `GET /admin/stats`: Platform analytics, counts of users, listings, active/completed bookings, and total confirmed offline revenue.
- `GET /admin/users`: List registered drivers and hosts.
- `PATCH /admin/users/:userId/status`: Suspend or reactivate user accounts.
- `GET /admin/reports`: List all filed user reports.
- `PATCH /admin/reports/:reportId/resolve`: Record resolution notes and close ticket.

## 8. Additional Implemented Endpoints

These routes are also mounted by the server. Protected routes require a bearer token; role restrictions are noted where applicable.

### Authentication

- `POST /auth/forgot-password`: Request a password reset email. Body: `{ "email": "ravi@example.com" }`.
- `POST /auth/reset-password`: Set a new password using the reset token. Body: `{ "token": "...", "password": "..." }`.

### Users (`/api/users`)

- `GET /users`: List users (admin only).
- `GET /users/:id`: Retrieve a user profile (authenticated).
- `PATCH /users/profile`: Update the authenticated user's profile.
- `PATCH /users/:id/status`: Change a user's account status (admin only).

### Parking

- `GET /parking/owner/:ownerId`: List an owner's parking facilities (owner or admin).
- `GET /parking/admin/all`: List all facilities for review (admin only).
- `PUT /parking/:id`: Update a facility (owner or admin; ownership is enforced by the service).
- `DELETE /parking/:id`: Delete a facility (owner or admin; ownership is enforced by the service).
- `POST /parking/upload`: Upload a facility photo (owner or admin; multipart form field `image`).

### Bookings (`/api/bookings`)

- `GET /bookings/admin/all`: List all bookings (admin only).
- `GET /bookings/:bookingId`: Retrieve a booking accessible to the authenticated user.
- `PATCH /bookings/:bookingId/status`: Update a booking status (owner or admin).

### Reports and reviews

- `GET /reports`: List reports (admin only).
- `PATCH /reports/:reportId/resolve`: Resolve a report (admin only). Body: `{ "status": "pending" | "in_review" | "resolved" | "dismissed", "resolutionNotes": "..." }`.
- `GET /reviews/parking/:parkingId`: List reviews for a facility.
