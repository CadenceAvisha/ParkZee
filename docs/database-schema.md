# ParkZee – Database Schema & Indexing Guide

Database Engine: **MongoDB Atlas**
Object Data Modeling: **Mongoose ODM**

---

## 1. Collections & Schema Definitions

### A. `users`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Unique user identifier |
| `name` | String | Required, Trimmed | Full name |
| `email` | String | Required, Unique, Lowercase, Indexed | Login email |
| `phone` | String | Optional, Trimmed | Phone number |
| `passwordHash`| String | Required | bcrypt salted hash (cost factor 10) |
| `role` | String | Enum: `DRIVER`, `OWNER`, `ADMIN` | Role for authorization |
| `accountStatus`| String | Enum: `ACTIVE`, `SUSPENDED`, `PENDING` | Account status |
| `profileImage`| String | Optional | Profile avatar URL |
| `createdAt` | Date | Auto | Timestamp |
| `updatedAt` | Date | Auto | Timestamp |

**Indexes**:
- `{ email: 1 }` (unique)
- `{ role: 1 }`
- `{ accountStatus: 1 }`

---

### B. `parkinglocations`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Facility ID |
| `ownerId` | ObjectId | Ref: `User`, Required, Indexed | Host who owns the space |
| `ownerName` | String | Trimmed | Host display name |
| `name` | String | Required | Facility name |
| `description` | String | Required | Description & directions |
| `address` | String | Required | Physical street address |
| `city` | String | Required, Indexed | City name |
| `location` | GeoJSON Point | Required, `2dsphere` indexed | `[longitude, latitude]` |
| `entranceLocation`| GeoJSON Point| Optional | Entrance coordinates |
| `supportedVehicleTypes` | [String] | Required | Supported vehicle categories |
| `parkingType` | String | Enum: covered, uncovered, etc. | Type of structure |
| `totalCapacity`| Number | Required, Min: 1 | Total available parking bays |
| `availableCapacity` | Number | Required, Min: 0 | Live available bay count |
| `pricePerHour`| Number | Required, Min: 1 | Hourly rate in INR |
| `operatingHours`| Object | `{ openTime, closeTime, is24x7, openDays }` | Schedule configuration |
| `amenities` | [String] | Array | CCTV, Security, EV charger, etc. |
| `photos` | [String] | Array | Photographic URLs |
| `verificationStatus` | String | Enum: pending, approved, rejected, suspended | Admin review state |
| `isActive` | Boolean | Default: false | Discoverable in search |
| `rating` | Number | Default: 0 | Average user star rating (1-5) |
| `reviewCount` | Number | Default: 0 | Total reviews submitted |

**Indexes**:
- `{ location: '2dsphere' }` (Geospatial index for `$nearSphere` queries)
- `{ ownerId: 1 }`
- `{ verificationStatus: 1, isActive: 1 }`
- `{ city: 1 }`

---

### C. `bookings`
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Primary Key | Booking ID |
| `bookingReference` | String | Required, Unique, Indexed | Human-readable alphanumeric reference |
| `driverId` | ObjectId | Ref: `User`, Required, Indexed | Driver who made the booking |
| `driverName` | String | Required | Driver name |
| `parkingLocationId`| ObjectId | Ref: `ParkingLocation`, Required, Indexed | Reserved facility |
| `parkingName` | String | Required | Snapshot of facility name |
| `parkingAddress`| String | Required | Snapshot of facility address |
| `vehicleDetails` | Object | `{ plateNumber, makeModel, vehicleType, color }` | Vehicle details |
| `startTime` | Date | Required, Indexed | Scheduled arrival time |
| `endTime` | Date | Required, Indexed | Scheduled departure time |
| `durationHours` | Number | Required | Backend-computed hours |
| `pricePerHour` | Number | Required | Snapshot rate |
| `totalAmount` | Number | Required | Total amount (INR) |
| `bookingStatus` | String | Enum: `RESERVED_AWAITING_OWNER_CONFIRMATION`, `CONFIRMED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `DISPUTED` | Current lifecycle state |
| `paymentStatus` | String | Enum: `NOT_PAID`, `PAID_CONFIRMED_BY_OWNER`, `PAYMENT_DISPUTED` | Payment state |
| `reservationExpiresAt` | Date | Required, Indexed | Expiry deadline if payment unconfirmed |
| `paymentMethod` | String | Optional: `cash`, `upi`, `bank_transfer`, `other` | Method attested by host |
| `paymentConfirmedBy` | String | Optional | Host name who confirmed payment |
| `paymentConfirmedAt` | Date | Optional | Timestamp of confirmation |
| `verificationToken` | String | Optional, Indexed | Cryptographic QR token |
| `checkInTime` | Date | Optional | Gate entry timestamp |
| `checkOutTime` | Date | Optional | Gate departure timestamp |

**Indexes**:
- `{ bookingReference: 1 }` (unique)
- `{ driverId: 1 }`
- `{ parkingLocationId: 1, bookingStatus: 1, startTime: 1, endTime: 1 }` (Compound overlap index)
- `{ reservationExpiresAt: 1 }`

---

### D. `paymentconfirmations` (Immutable Audit Collection)
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Audit record ID |
| `bookingId` | ObjectId | Associated reservation |
| `bookingReference`| String | Alphanumeric booking reference |
| `driverId` | ObjectId | Driver who paid |
| `driverName` | String | Driver name |
| `ownerId` | ObjectId | Host who attested payment |
| `ownerName` | String | Host name |
| `amount` | Number | Exact amount received in INR |
| `paymentMethod` | String | Cash, UPI, Bank Transfer, Other |
| `paymentStatus` | String | `PAID_CONFIRMED_BY_OWNER` |
| `confirmedAt` | Date | Timestamp of host attestation |
| `notes` | String | Optional host remark |

---

### E. `reviews`
- `_id`: ObjectId
- `bookingId`: ObjectId (unique, one review per booking)
- `driverId`: ObjectId
- `parkingLocationId`: ObjectId
- `rating`: Number (1 to 5)
- `comment`: String

---

### F. `reports`
- `_id`: ObjectId
- `reportReference`: String (unique)
- `reportedBy`: `{ id, name, role, email }`
- `targetType`: `parking_location`, `booking`, `user`, `payment_dispute`
- `targetId`: String
- `targetTitle`: String
- `reason`: String
- `description`: String
- `status`: `pending`, `in_review`, `resolved`, `dismissed`
- `resolutionNotes`: String
- `resolvedBy`: String
- `resolvedAt`: Date
