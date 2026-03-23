# Assignment 7 - Business Logic Layer (BLL)

Course: CS 331 (Software Engineering Lab)  
Project: Argus (Server Monitoring System)  
Team: NightsWatch

---

## Q1. Core BLL modules and interaction with UI [10]

In our project, business logic is implemented mainly in backend service classes.  
Frontend pages call these through REST APIs and receive live updates through WebSocket.

### Core modules

1. Authentication module
- BLL: UserService, JwtService
- UI: Login, Register, Forgot/Reset Password, Verify Email pages
- Interaction: UI sends credentials -> service validates user and rules -> returns JWT/user data

2. Server management module
- BLL: ServerService
- UI: Servers, AddServer, EditServer, ServerDetail
- Interaction: UI creates/reads/deletes servers -> service checks owner access and manages agent key

3. Metrics ingestion module
- BLL: MetricService
- UI: Dashboard, ServerDetail, History
- Interaction: agent posts metrics -> service stores metrics, updates heartbeat, pushes live data to UI charts

4. Alert rule and alert lifecycle module
- BLL: AlertService, AlertEvaluationService
- UI: AlertRules, Alerts, Dashboard
- Interaction: UI creates/toggles rules -> service evaluates thresholds on incoming metrics -> alerts shown in UI in real time

5. Notification module
- BLL: NotificationService, NotificationPreferenceService, SmsService
- UI: Settings
- Interaction: when alert triggers, service sends email/SMS based on user preferences

### Simple interaction flow

UI -> Controller -> Service (BLL) -> Repository/DB  
BLL -> WebSocket -> UI (live updates)

---

## Q2(A). Business rules used in the project [10]

1. Authentication rules
- Username and email must be unique
- Password is encrypted before save
- User cannot login until email is verified

2. Access control rules
- User can access only their own servers, rules, and alerts

3. Alert rules
- Conditions like CPU > threshold are checked
- Duration and cooldown are applied to avoid false/spam alerts
- Auto-resolve happens when condition becomes normal

4. Server status rules
- Critical alert -> server status critical
- Warning alert -> status warning
- No alert -> status online
- No heartbeat for threshold time -> status offline

5. Notification rules
- Send email only if email setting is enabled
- Send SMS only if SMS setting + phone + provider availability are valid
- Failed notifications are retried

---

## Q2(B). Validation logic in the project [10]

Yes, validation is implemented in multiple layers.

1. Backend request validation
- DTOs use annotations like NotBlank, NotNull, Email, Size
- Controllers use Valid to reject bad input early

2. Service-level validation
- Duplicate user check
- Ownership check before operations
- Token expiry check for verification/reset
- Notification preference checks (for example, SMS cannot be enabled without phone number)

3. Frontend validation
- Username and email format checks
- Password strength checks during registration
- Alert rule form checks (required fields and numeric threshold)

So, validation is done at UI + API + business logic level.

---

## Q2(C). Data transformation for UI [10]

We transform data in both backend and frontend.

1. Backend transformation
- Entity to DTO mapping using response classes:
    - MetricResponse.fromEntity
    - AlertResponse.fromEntity
    - ServerResponse.fromEntity
- API responses follow a common ApiResponse format

2. Frontend transformation
- API data is converted into chart-friendly structures (time/value)
- Timestamps are formatted for readable display
- WebSocket JSON payloads are converted into UI state updates

Result: database data is converted into clean, understandable, and real-time UI data.

---