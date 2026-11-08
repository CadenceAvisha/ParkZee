# Smart Parking Marketplace --- Project Plan

## 1. Project Overview

**Working title:** Smart Parking Marketplace\
**Project type:** Location-based parking discovery, reservation, and
verification platform\
**Primary goal:** Connect drivers who need parking with homeowners,
businesses, malls, and other property owners who have parking capacity
available for rent.

The platform works like a booking marketplace for parking. Parking
providers list spaces, define prices and availability, and manage
reservations. Drivers search for parking near their current location or
destination, compare options, and reserve a space for a selected time
period without paying online. When the driver arrives at the parking
location, they pay the owner directly using an accepted offline method
such as cash or UPI. The owner records and confirms receipt of payment
through the application. A booking-specific QR code is then activated
for entry verification.

The system will include GPS-based location detection, interactive maps,
parking search, time-based reservations, owner-confirmed direct payment,
QR-based entry verification, and administrative management.

## 2. Problem Statement

Finding parking in busy urban areas can be time-consuming and
inconvenient. Drivers may spend considerable time searching for an
available space, while privately owned or commercial parking capacity
may remain unused for parts of the day.

There is no single marketplace in this proposed solution through which
drivers can discover and reserve these distributed parking spaces in
advance.

## 3. Proposed Solution

Build a web application that provides a common platform for:

-   **Drivers:** Discover, compare, reserve, pay the parking owner
    directly at the location, and verify access to parking.
-   **Parking owners:** Register parking locations, publish
    availability, set prices, manage reservations, and confirm direct
    payments received from drivers.
-   **Administrators:** Verify listings, manage users, monitor bookings
    and owner-recorded payment confirmations, and handle reports or
    disputes.

The platform should make parking availability and reservations reliable.
In particular, it must prevent two drivers from booking the same
capacity for overlapping time periods.

## 4. Objectives

1.  Reduce the time drivers spend searching for parking.
2.  Make underused private and commercial parking capacity discoverable.
3.  Allow drivers to reserve parking for a specified date and time.
4.  Provide accurate location information and map-based directions.
5.  Prevent overlapping reservations and double bookings.
6.  Verify valid reservations at the parking location using secure QR
    codes.
7.  Give parking owners tools to manage listings, availability, and
    earnings.
8.  Give administrators oversight of platform activity and listing
    quality.

## 5. User Roles

### 5.1 Driver

A driver can:

-   Register, log in, and manage their profile.
-   Grant or deny permission to access device location.
-   Search by current location, address, or destination.
-   View parking locations on a map and in a list.
-   Filter results by vehicle type, price, distance, parking type, and
    availability.
-   View parking details, photos, rules, operating hours, and owner
    information.
-   Select a date, arrival time, and departure time.
-   View the total estimated price before booking.
-   Reserve a parking slot without making an online payment.
-   Pay the parking owner directly after arriving at the location.
-   View the booking status and booking ID while awaiting owner
    confirmation.
-   View the booking-specific QR code after the owner confirms receipt
    of payment.
-   View upcoming, completed, and cancelled bookings.
-   Cancel a booking according to the cancellation policy.
-   Submit a rating or review after a completed booking.
-   Report a problem with a booking or parking location.

### 5.2 Parking Owner

A parking owner can:

-   Register and submit required profile information.
-   Add one or more parking locations.
-   Enter the address and mark the exact parking entrance or location on
    a map.
-   Add photos, parking instructions, and facility details.
-   Specify supported vehicle types, parking type, capacity, and
    operating hours.
-   Set hourly or other supported pricing.
-   Configure availability and block dates or time periods.
-   Submit a listing for administrator verification.
-   View and manage bookings for their locations.
-   View booking verification and check-in/check-out status.
-   Confirm receipt of direct payments from drivers through the
    application.
-   View earnings and booking history.
-   Report incidents or disputes.

### 5.3 Administrator

An administrator can:

-   View and manage driver and owner accounts.
-   Review, approve, reject, suspend, or deactivate parking listings.
-   Review reported listings, users, and bookings.
-   Monitor reservations, cancellations, owner-recorded payment
    confirmations, and disputes.
-   View platform-level reports and analytics.
-   Manage categories, vehicle types, and platform settings.
-   Maintain an audit trail of important administrative actions.

## 6. Main Functional Modules

### 6.1 Authentication and Role Management

-   Registration and login.
-   Secure password hashing.
-   Role-based authorization for Driver, Parking Owner, and Admin.
-   Profile management.
-   Password reset and account status management.
-   Protected backend routes.

### 6.2 Parking Listing Management

Each parking listing should include:

-   Listing ID and owner ID.
-   Name and description.
-   Address and map coordinates (latitude and longitude).
-   Parking entrance location or access instructions.
-   Supported vehicle types.
-   Parking type (covered or uncovered).
-   Total capacity and, where applicable, individual slot details.
-   Price and pricing unit.
-   Operating hours and availability schedule.
-   Photos and facilities.
-   Listing verification status.

A listing must not become publicly bookable until it has passed the
configured verification process.

### 6.3 GPS and Location-Based Search

-   Request device location permission only when needed.
-   Obtain the driver's current latitude and longitude using the browser
    Geolocation API.
-   Allow manual destination or address search if location permission is
    denied.
-   Find parking locations within a configurable search radius.
-   Calculate approximate distance from the driver's selected point.
-   Sort results by distance, price, or other relevant criteria.
-   Avoid continuous background tracking in the initial version.

GPS identifies the driver's device location. It does not automatically
verify that a vehicle has arrived at a parking space.

### 6.4 Map Integration and Navigation

-   Display parking listings as markers on an interactive map.
-   Show listing details when a marker is selected.
-   Provide a list/map view switch.
-   Allow drivers to view the route to a selected parking location.
-   Store parking coordinates in the database.
-   Let owners position the parking location accurately when creating a
    listing.

**Initial mapping approach:** Leaflet with OpenStreetMap-compatible map
tiles. A routing service can be added for route calculation. The
selected tile and routing providers must be used according to their
terms, attribution requirements, rate limits, and usage policies.

The map marker should represent the actual parking entrance where
possible, not merely the centre of a large property.

### 6.5 Availability and Booking Management

Drivers should be able to reserve parking for a time interval.

The booking process should:

1.  Receive the requested parking resource, start time, and end time.
2.  Validate that the start time is before the end time.
3.  Check operating hours and owner-defined availability.
4.  Check for overlapping reservations and active holds.
5.  Reserve capacity safely and create a booking immediately, without
    requiring online payment.
6.  Set the booking status to `RESERVED_AWAITING_OWNER_CONFIRMATION`.
7.  When the driver arrives, the driver pays the owner directly using
    an accepted method such as cash or UPI.
8.  The owner locates the reservation in the owner dashboard, verifies
    receipt of payment, and confirms it in the application.
9.  After owner confirmation, activate the booking-specific QR code
    for entry verification.
10. Release the reserved capacity if the reservation expires, is
    cancelled, or is not confirmed within the configured deadline.

For an individual slot, two bookings must not overlap for the same slot.
For a capacity-based listing, the number of overlapping reservations
must never exceed the available capacity.

**Overlap rule:** Two time intervals overlap when
`newStart < existingEnd` and `newEnd > existingStart`.

A simple read-then-insert check is not enough. Concurrent booking
requests must be protected using an atomic database operation,
transaction, or another concurrency-safe reservation strategy.

Suggested booking statuses:

-   `RESERVED_AWAITING_OWNER_CONFIRMATION`
-   `CONFIRMED`
-   `CHECKED_IN`
-   `COMPLETED`
-   `CANCELLED`
-   `EXPIRED`
-   `DISPUTED` (optional, for payment or reservation disagreements)

Payment confirmation should be tracked separately from booking status.
Suggested payment-record statuses are:

-   `NOT_PAID`
-   `PAID_CONFIRMED_BY_OWNER`
-   `PAYMENT_DISPUTED`

### 6.6 Direct Payment and Owner Confirmation

The application will not integrate an online payment gateway. Drivers
will pay parking owners directly when they arrive at the parking
location. The application will record the owner's confirmation; it will
not collect, process, transfer, or independently verify the money.

-   Show the full parking price and applicable charges before the driver
    creates a reservation.
-   Allow the driver to reserve an available slot without paying online.
-   Display the reservation as
    `RESERVED_AWAITING_OWNER_CONFIRMATION` until the owner confirms
    receipt of payment.
-   When the driver arrives, the driver pays the owner directly using
    an accepted method, such as cash or UPI.
-   The owner opens the relevant reservation in the owner dashboard,
    selects the payment method, confirms the amount received, and
    submits the confirmation.
-   Record the confirming owner, confirmation timestamp, amount, and
    payment method for audit purposes.
-   Change the payment record to `PAID_CONFIRMED_BY_OWNER` and the
    booking status to `CONFIRMED` only after the owner submits the
    confirmation.
-   Activate the booking-specific QR code after confirmation.
-   Provide a way to report or flag disputed payment confirmations.
-   Apply the cancellation, no-show, and dispute policies consistently.

The application records an owner attestation that payment was received.
It does not verify the underlying cash or UPI transfer. The driver and
owner are responsible for completing and checking the direct payment
between themselves. The platform should clearly display the agreed
parking price and retain an audit record of the owner's confirmation.

### 6.7 QR-Based Booking Verification

A unique QR code should be generated or activated only after the owner
has recorded confirmation of the driver's direct payment and the
booking has changed to `CONFIRMED`.

**Entry workflow:**

1.  Driver creates a reservation and receives a booking reference.
2.  The reservation remains
    `RESERVED_AWAITING_OWNER_CONFIRMATION`; it does not yet authorize
    entry.
3.  Driver arrives and pays the owner directly.
4.  Owner finds the reservation in the authenticated owner dashboard,
    records the payment method and amount received, and confirms
    receipt of payment.
5.  Backend records the owner confirmation, changes the booking to
    `CONFIRMED`, and activates a cryptographically random,
    booking-specific verification token.
6.  Driver's application displays the active QR code.
7.  Owner or authorized attendant scans it using an authenticated
    scanner interface.
8.  Scanner sends the token to the backend.
9.  Backend verifies the token, booking, parking location, owner
    confirmation, validity window, and whether it has already been used.
10. If valid, backend records check-in and returns an approval result.
11. If invalid, expired, cancelled, already used, unconfirmed, or
    associated with another location, access is rejected.

**Exit workflow:**

-   An authorized owner or attendant records checkout through the
    application.
-   The booking is marked completed.
-   Capacity is released after the parking session has ended, subject to
    any configured buffer period.

**QR security requirements:**

-   Do not place passwords, payment details, or unnecessary personal
    information in the QR code.
-   Use an unpredictable token, not a sequential booking ID.
-   Store a hash of the token where practical.
-   Enforce expiry and one-time entry verification.
-   Check the token against the correct parking location.
-   Require authenticated and authorized scanner access.
-   Record scan attempts and verification events.
-   Provide a manual support procedure for legitimate users if scanning
    fails.

The QR code proves that the booking is valid according to the backend.
It does not independently prove vehicle identity unless a separate
vehicle verification process is implemented.

### 6.8 Notifications

Send relevant notifications for:

-   Account registration and important account changes.
-   Listing submission and approval/rejection.
-   Booking confirmation.
-   Owner confirmation of direct payment.
-   Upcoming booking reminders.
-   Reservation expiry or cancellation updates.
-   Check-in and checkout events.
-   Important owner or administrator actions.

Email can be used initially. SMS or push notifications can be added
later.

### 6.9 Reviews and Reports

-   Allow reviews only for eligible completed bookings.
-   Associate reviews with the relevant booking and parking location.
-   Allow users to report inaccurate listings or booking problems.
-   Give administrators tools to review and resolve reports.

### 6.10 Admin Dashboard and Analytics

Display useful operational information such as:

-   Total registered drivers and owners.
-   Pending and approved listings.
-   Active and completed bookings.
-   Cancelled and expired bookings.
-   Owner-confirmed payment totals and reported payment disputes.
-   Popular parking locations.
-   Booking trends over time.
-   Reported issues and their resolution status.

## 7. Proposed Technology Stack

  ------------------------------------------------------------------------
  Layer                  Proposed technology        Purpose
  ---------------------- -------------------------- ----------------------
  Frontend               React.js                   User interfaces and
                                                    dashboards

  Frontend tooling       Vite                       Development and build
                                                    tooling

  Styling                Tailwind CSS               Responsive UI styling

  Backend                Node.js                    Server-side JavaScript
                                                    runtime

  API framework          Express.js                 REST API development

  Database               MongoDB                    Store users, listings,
                                                    bookings, and related
                                                    data

  ODM                    Mongoose                   MongoDB schemas and
                                                    queries

  Authentication         JWT and bcrypt             Authentication and
                                                    password hashing

  Maps                   Leaflet and                Interactive maps
                         OpenStreetMap-compatible   
                         tiles                      

  Geolocation            Browser Geolocation API    Obtain device
                                                    coordinates with
                                                    permission

  Routing                A suitable routing         Calculate routes to
                         API/service                parking

  QR generation          A maintained QR-code       Generate booking QR
                         library                    codes

  QR scanning            Browser camera API and a   Scan booking QR codes
                         maintained scanning        
                         library                    

  Direct payment         Owner-confirmed cash/UPI    Record payment method,
                         or other accepted method    amount, and confirmation
                                                    in the application

  Image storage          Cloudinary or equivalent   Store listing photos

  Notifications          Email initially; SMS/push  Booking and account
                         later                      updates

  Version control        Git and GitHub             Source control and
                                                    collaboration

  Deployment             Suitable frontend and      Publish the
                         backend hosting            application
  ------------------------------------------------------------------------

The stack is a proposal. Confirm provider pricing, API limits,
deployment requirements, and the terms of any external map, routing,
email, or image-storage services before committing to them. No payment
gateway is required for the proposed direct-payment workflow.

## 8. High-Level System Architecture

``` text
                  DRIVER / OWNER / ADMIN
                           |
                           v
                  React.js Frontend
                           |
                    HTTPS REST APIs
                           |
                           v
                Node.js + Express Backend
                           |
       +-------------------+--------------------+
       |                   |                    |
       v                   v                    v
 Authentication       Parking & Search       Booking & QR
       |                   |                    |
       +-------------------+--------------------+
                           |
                           v
                       MongoDB
                           |
       +-------------------+--------------------+
       |                   |                    |
       v                   v                    v
   Maps/Routing      Owner Payment Confirmation  Notifications
                     (recorded in application)
```

All important business rules must be enforced by the backend. The
frontend must not be trusted to decide whether a reservation is
available, whether an owner has confirmed receipt of payment, or
whether a QR code is authorized. Payment confirmation is an owner
attestation recorded by the backend, not independent verification of
the cash or UPI transaction.

## 9. Proposed Database Collections

### 9.1 Users

Possible fields:

-   `_id`
-   `name`
-   `email`
-   `phone`
-   `passwordHash`
-   `role`
-   `accountStatus`
-   `createdAt`
-   `updatedAt`

### 9.2 ParkingLocations

Possible fields:

-   `_id`
-   `ownerId`
-   `name`
-   `description`
-   `address`
-   `location` (GeoJSON Point: longitude and latitude)
-   `entranceLocation` (optional GeoJSON Point)
-   `supportedVehicleTypes`
-   `parkingType`
-   `capacity`
-   `price`
-   `operatingHours`
-   `availabilityRules`
-   `photos`
-   `verificationStatus`
-   `isActive`
-   `createdAt`
-   `updatedAt`

Create a MongoDB `2dsphere` index on the GeoJSON location field to
support geospatial queries.

### 9.3 ParkingSlots (if individual slots are used)

Possible fields:

-   `_id`
-   `parkingLocationId`
-   `slotLabel`
-   `vehicleType`
-   `isActive`
-   `createdAt`

### 9.4 Bookings

Possible fields:

-   `_id`
-   `bookingReference`
-   `driverId`
-   `parkingLocationId`
-   `parkingSlotId` (optional for capacity-based listings)
-   `vehicleDetails`
-   `startTime`
-   `endTime`
-   `amount`
-   `bookingStatus`
-   `paymentStatus`
-   `paymentMethod` (cash, UPI, or another supported direct method)
-   `paymentConfirmedBy` (owner user ID)
-   `paymentConfirmedAt`
-   `checkInTime`
-   `checkOutTime`
-   `createdAt`
-   `updatedAt`

### 9.5 QRVerificationTokens

Possible fields:

-   `_id`
-   `bookingId`
-   `tokenHash`
-   `validUntil`
-   `usedAt`
-   `status`
-   `createdAt`

### 9.6 PaymentConfirmations

This collection records the owner's confirmation of a direct payment.
It does not represent a payment processed by the platform.

Possible fields:

-   `_id`
-   `bookingId`
-   `driverId`
-   `ownerId` (the owner who confirmed receipt)
-   `amount`
-   `currency`
-   `paymentMethod` (cash, UPI, or another supported direct method)
-   `paymentStatus` (`NOT_PAID`, `PAID_CONFIRMED_BY_OWNER`, or
    `PAYMENT_DISPUTED`)
-   `confirmedAt`
-   `notes` (optional)
-   `createdAt`
-   `updatedAt`

Do not store card details, UPI PINs, banking credentials, or other
sensitive payment credentials. The application records the owner's
confirmation and any reference voluntarily supplied for reconciliation;
it does not process the transfer.

### 9.7 Reviews

Possible fields:

-   `_id`
-   `bookingId`
-   `driverId`
-   `parkingLocationId`
-   `rating`
-   `comment`
-   `createdAt`

### 9.8 Reports (optional initial release)

Possible fields:

-   `_id`
-   `reportedBy`
-   `targetType`
-   `targetId`
-   `reason`
-   `description`
-   `status`
-   `resolvedBy`
-   `createdAt`

Use references and indexes appropriate to the queries. Add validation
for required fields, allowed statuses, date ranges, prices, and
coordinates.

## 10. Main Application Workflows

### 10.1 Owner Listing Workflow

``` text
Owner registers/logs in
        |
        v
Adds parking location and details
        |
        v
Sets coordinates, capacity, price, and hours
        |
        v
Uploads photographs
        |
        v
Submits listing
        |
        v
Admin reviews listing
        |
   +----+----+
   |         |
Approved   Rejected
   |         |
   v         v
Published  Owner edits and resubmits
```

### 10.2 Driver Booking Workflow

``` text
Driver opens application
        |
        v
Uses GPS or enters destination
        |
        v
Views nearby parking on map/list
        |
        v
Selects parking and time interval
        |
        v
Backend checks availability
        |
   +----+----+
   |         |
Available  Unavailable
   |         |
   v         v
Create reservation   Show alternatives
and reserve capacity
        |
        v
Status: RESERVED_AWAITING_OWNER_CONFIRMATION
        |
        v
Driver arrives at parking location
        |
        v
Driver pays owner directly (cash/UPI/etc.)
        |
        v
Owner records amount and payment method
and confirms receipt in the application
        |
        v
Backend records owner confirmation
        |
        v
Status: CONFIRMED; activate QR code
        |
        v
Owner/attendant scans driver's QR
        |
        v
Backend validates QR and booking
        |
        v
Check-in, parking session, checkout
        |
        v
Complete booking and release capacity
```

## 11. Non-Functional Requirements

### Security

-   Hash passwords using a suitable password-hashing algorithm.
-   Use HTTPS in production.
-   Validate and sanitize user input.
-   Enforce role-based authorization on the backend.
-   Protect owner payment-confirmation and QR verification endpoints.
-   Keep secrets and API keys in environment variables.
-   Apply rate limiting to sensitive endpoints.
-   Log important security and administrative events.

### Performance

-   Use database indexes for geospatial search and common booking
    queries.
-   Paginate parking search results.
-   Avoid unnecessary repeated map and API requests.
-   Keep booking operations concurrency-safe.
-   Optimize and resize uploaded images.

### Reliability

-   Make owner payment-confirmation requests idempotent.
-   Handle expired reservations awaiting owner confirmation.
-   Maintain booking and payment-confirmation audit records.
-   Provide clear error states for location, map, payment confirmation,
    and QR failures.
-   Handle network failures without creating duplicate confirmations.

### Privacy

-   Ask permission before accessing device location.
-   Provide manual location search as an alternative.
-   Do not continuously track drivers in the initial version.
-   Collect only the location and personal data needed for the service.
-   Define data retention and deletion policies.

### Usability

-   Build responsive layouts for mobile and desktop.
-   Keep booking steps clear.
-   Show total price before reservation.
-   Explain that payment is made directly to the owner at the location.
-   Display understandable reservation, owner-confirmation, and
    verification states.
-   Make QR scanning straightforward for owners or attendants.

## 12. Development Roadmap

### Phase 1 --- Project Setup

-   Create the GitHub repository.
-   Set up React/Vite frontend.
-   Set up Node.js/Express backend.
-   Connect MongoDB.
-   Configure environment variables.
-   Define project structure and API conventions.

### Phase 2 --- Authentication and Roles

-   Implement registration and login.
-   Add password hashing.
-   Implement role-based access.
-   Create protected dashboards for drivers, owners, and admins.

### Phase 3 --- Parking Listing Management

-   Build owner listing forms.
-   Add image upload.
-   Store address and coordinates.
-   Add pricing, capacity, vehicle types, and operating hours.
-   Build admin listing verification.

### Phase 4 --- GPS, Maps, and Search

-   Request browser location permission.
-   Add manual destination search.
-   Store parking locations as GeoJSON points.
-   Add geospatial indexes and nearby search.
-   Display parking markers using Leaflet.
-   Add route display through a routing service.

### Phase 5 --- Availability and Booking

-   Implement date/time selection.
-   Implement availability rules.
-   Prevent overlapping reservations.
-   Add temporary booking holds.
-   Handle hold expiry and concurrent requests.
-   Build booking history and cancellation.

### Phase 6 --- Direct Payment and Owner Confirmation

-   Remove online payment gateway integration.
-   Display the agreed parking amount before reservation.
-   Allow drivers to reserve slots without online payment.
-   Build the owner interface to view reservations awaiting payment
    confirmation.
-   Allow the owner to record the direct payment method and amount
    received.
-   Record the owner identity and timestamp for each confirmation.
-   Update the booking to `CONFIRMED` only after owner confirmation.
-   Add handling for disputed confirmations, cancellation, no-shows,
    and reservation expiry.

### Phase 7 --- QR Verification

-   Generate secure booking-specific tokens.
-   Display QR codes in the driver's booking details.
-   Build an authenticated owner/attendant scanner.
-   Validate QR tokens on the backend.
-   Record check-in and checkout.
-   Prevent replay and unauthorized scans.

### Phase 8 --- Notifications and Reviews

-   Add email notifications.
-   Add booking reminders.
-   Add reviews and reports.
-   Add owner booking notifications.

### Phase 9 --- Testing and Deployment

-   Test each user role.
-   Test geospatial search and map accuracy.
-   Test overlapping and simultaneous booking attempts.
-   Test reservation creation without payment.
-   Test owner confirmation, duplicate confirmation requests, and
    disputed payment records.
-   Test reservation expiry, cancellation, and no-show handling.
-   Test valid, expired, reused, unconfirmed, and wrong-location QR
    codes.
-   Test cancellation and capacity release.
-   Deploy frontend, backend, and database.
-   Configure production environment variables, logging, backups, and
    monitoring.

## 13. MVP Scope and Future Enhancements

### Minimum Viable Product (MVP)

The first working version should include:

-   Driver, owner, and admin accounts.
-   Owner parking registration and admin approval.
-   GPS-based nearby parking search.
-   Map-based parking discovery.
-   Parking details, prices, and availability.
-   Time-based reservations.
-   Double-booking prevention.
-   Direct owner payment with in-application confirmation.
-   Booking-specific QR generation and verification after owner
    confirmation.
-   Basic check-in/check-out.
-   Booking history and notifications.

### Future Enhancements

After the MVP is reliable, consider:

-   Dynamic pricing based on demand.
-   Live navigation and optional trip tracking.
-   Push notifications.
-   Advanced owner analytics and payouts.
-   Subscription plans and promoted listings.
-   Vehicle number plate verification.
-   Automatic gate integration.
-   EV charging spot listings.
-   AI-based parking recommendations.
-   Demand forecasting and utilization analytics.
-   Multi-city expansion and localization.

These enhancements are not required for the first release.

## 14. Key Risks and Mitigation

  ---------------------------------------------------------------------
  Risk                               Mitigation
  ---------------------------------- ----------------------------------
  Double booking                     Atomic reservation and
                                     concurrency-safe database
                                     operations

  Fake or unauthorized listings      Owner checks and admin approval

  Incorrect parking coordinates      Map pin placement, entrance
                                     coordinates, and listing review

  Driver cannot access parking       Clear instructions, owner contact
                                     process, and support workflow

  QR code copied or reused           Unpredictable expiring tokens and
                                     one-time verification

  Owner receives direct payment but Record owner confirmation with
  booking is not confirmed           timestamp, amount, method, and
                                     audit history; provide a dispute
                                     process

  Driver does not arrive             No-show policy and reservation
                                     expiry rules

  Location permission denied         Manual address or destination
                                     search

  Map provider limits or costs       Check usage policies and keep the
                                     mapping layer replaceable

  Disputes or vehicle safety         Clear terms, reporting, owner
  concerns                           verification, and support
                                     procedures
  ---------------------------------------------------------------------

## 15. Important Business Rules to Finalize

Before production development, decide:

1.  Whether listings use total capacity, individual slots, or both.
2.  Whether every reservation requires owner confirmation after the
    driver pays at the location.
3.  How early a driver can reserve.
4.  Whether there is a grace period for late arrival.
5.  How long a reservation remains active while awaiting the driver's
    arrival and owner confirmation.
6.  What happens when a driver does not arrive or does not pay.
7.  Which direct payment methods owners will accept (cash, UPI, or
    others).
8.  Whether drivers can extend a parking session.
9.  What cancellation, no-show, and dispute policies apply.
10. Who performs QR scanning and checkout.
11. How owner earnings and any platform commission are recorded.
12. What verification documents are required from owners.
13. What support process applies if a QR scanner or internet connection
    fails.

## 16. Project Success Criteria

The MVP can be considered successful when:

-   A parking owner can create a listing and receive approval.
-   A driver can find nearby approved parking locations.
-   The map displays the correct parking location.
-   A driver can reserve an available space for a time interval.
-   The system rejects overlapping bookings.
-   A driver can reserve a slot without making an online payment.
-   The owner can record and confirm direct payment received at the
    parking location.
-   The booking becomes confirmed only after the owner submits payment
    confirmation.
-   A valid QR code is activated after owner confirmation and accepted
    at the correct location.
-   Invalid, expired, reused, and wrong-location QR codes are rejected.
-   Check-in and checkout update booking status and capacity correctly.
-   Admins can manage listings, users, and booking issues.

## 17. Final Project Description

The Smart Parking Marketplace is a GPS-enabled platform that connects
drivers seeking parking with property owners who have available parking
capacity. Owners can register and manage parking listings, set prices,
and define availability. Drivers can discover nearby parking using GPS
and interactive maps, compare options, reserve a parking space for a
selected time period without making an online payment. When the driver
arrives, they pay the parking owner directly using an accepted method
such as cash or UPI. The owner records and confirms receipt of payment
through the application. Only then does the booking become confirmed
and its unique QR code become active. An authorized parking owner or
attendant can scan the QR code to verify the reservation and record
vehicle entry. The platform also provides role-based dashboards, booking
management, notifications, and administrative controls. Its objective is
to make distributed private parking capacity easier to discover and
reserve while improving parking utilization and creating an additional
revenue opportunity for property owners.

------------------------------------------------------------------------

**Document status:** Initial project plan.\
**Note:** This plan defines the proposed scope and architecture.
Detailed API contracts, UI wireframes, database indexes, deployment
configuration, and final business policies should be documented during
implementation.
