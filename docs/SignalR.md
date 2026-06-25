# SignalR Real-Time Features

HAPM uses **ASP.NET Core SignalR** for live push delivery alongside the existing REST notification API. Notifications are still **persisted to PostgreSQL first**, then pushed to connected clients.

---

## Hub endpoints

| Hub | URL | Who connects | Purpose |
|-----|-----|--------------|---------|
| **NotificationsHub** | `/hubs/notifications` | All authenticated users | Live in-app notification push |
| **AppointmentsHub** | `/hubs/appointments` | Admin, Receptionist | Live appointment status board |
| **ChatHub** | `/hubs/chat` | Admin, Receptionist, Doctor | Internal staff messaging |

---

## Authentication

SignalR uses the same JWT as REST. Pass the access token as a query parameter:

```
ws://localhost:5168/hubs/notifications?access_token=<JWT>
```

CORS is configured with **credentials** enabled for WebSocket connections from configured frontend origins (`Cors:AllowedOrigins` in `appsettings.json`).

---

## 1. Live notifications

**Flow:** Background job or service → `NotificationService.NotifyAsync` → DB insert → `NotificationsHub` → client

**Client event:** `ReceiveNotification`

**Payload:** `NotificationDto` (same shape as `GET /api/notifications`)

**Group:** `user-{userId}` (auto-joined on connect)

Covers:

- Appointment booked / confirmed / cancelled / completed / rescheduled
- Waitlist slot opened (instant push when cancellation frees a slot)
- Prescription issued, lab uploaded, invoice/payment events
- 24 h appointment reminders and 2-day follow-up reminders (background job)

---

## 2. Appointment status board

**Flow:** Doctor/reception changes appointment status → `AppointmentService` → `AppointmentsHub` → reception dashboard

**Client event:** `AppointmentStatusChanged`

**Payload:** `AppointmentDto`

**Group:** `staff-board` (Admin + Receptionist auto-joined on connect)

Triggered on: book, confirm, check-in, complete, cancel, no-show, reschedule.

**Optional:** Doctors can call hub method `JoinDoctorQueue(doctorId)` to subscribe to their own queue updates.

---

## 3. Staff internal messaging

Staff-only operational communication — **no patient access**.

| Action | REST | SignalR delivery |
|--------|------|------------------|
| Reception → Doctor | `POST /api/staff-messages/to-doctor` | Group `doctor-{doctorId}` |
| Admin → All staff | `POST /api/staff-messages/broadcast` | Group `staff-broadcast` |
| History | `GET /api/staff-messages` | — |

**Client event:** `ReceiveStaffMessage`

**Payload:** `StaffMessageDto`

Messages are **persisted** in the `StaffMessages` table.

---

## JavaScript client example

```javascript
import * as signalR from "@microsoft/signalr";

const token = "<accessToken from /api/auth/login>";

const notifications = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5168/hubs/notifications", {
    accessTokenFactory: () => token
  })
  .withAutomaticReconnect()
  .build();

notifications.on("ReceiveNotification", (n) => {
  console.log("New notification:", n.title, n.message);
});

await notifications.start();
```

```javascript
const board = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5168/hubs/appointments", {
    accessTokenFactory: () => token
  })
  .build();

board.on("AppointmentStatusChanged", (appt) => {
  console.log("Board update:", appt.id, appt.status);
});

await board.start();
```

---

## Architecture

```
NotificationService.NotifyAsync
  ├── Save to PostgreSQL
  └── IRealtimeNotificationDispatcher → NotificationsHub → user-{id}

AppointmentService (status change)
  └── IAppointmentBoardDispatcher → AppointmentsHub → staff-board

StaffMessageService
  ├── Save to PostgreSQL
  └── IStaffMessageDispatcher → ChatHub → doctor-{id} | staff-broadcast
```

Dispatchers are **no-op stubs** in unit tests; real SignalR implementations are registered in `Program.cs` via `AddHapmSignalR()`.

---

## REST fallback

Clients that are offline or not using SignalR can still poll:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `GET /api/appointments?fromDate=today&toDate=today`
- `GET /api/staff-messages`
