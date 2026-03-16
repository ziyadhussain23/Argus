# Assignment 6 — Argus: UI Design & Implementation

> **Course:** CS 331 — Software Engineering Lab | **Marks:** 20 | **Team:** NightsWatch
>
> **Project:** Argus — Server Monitoring System | **Repo:** [github.com/ziyadhussain23/Argus](https://github.com/ziyadhussain23/Argus)

---

# Part I — Why We Chose This UI [10 Marks]

## Our Choice: Web-Based GUI (Direct Manipulation Interface)

We built Argus as a **website** where users click buttons, view live charts, and toggle switches — just like any modern web app.

> Think of a car dashboard — you don't type commands to check speed, you just look at it. Argus works the same way for servers.

### 5 Reasons

1. **Charts show live data best** — CPU/memory updates every 5 seconds. Only charts can show this clearly.
2. **Easy to move around** — Sidebar lets users switch between pages in one click.
3. **Anyone can use it** — Simple buttons, forms, and toggles. No coding knowledge needed.
4. **Complex data display** — History page: select server + time frame → view chart → export as PNG/PDF/CSV/JSON — all in one screen.
5. **No install needed** — Just open the browser and start using it.

### Why Not Other UI Types?

| UI Type | Why Not? | |
| --- | --- | --- |
| CLI (Command Line) | Can't show charts or graphs | ❌ |
| Menu-Based | Too slow, can't show live data | ❌ |
| Form-Based | Monitoring = watching, not filling forms | ❌ |
| Voice/Natural Language | Too slow for urgent alerts | ❌ |
| **Web GUI** | **Shows live charts, easy to navigate** | ✅ |

### How the App is Built

```mermaid
graph TD
    A["Browser"] --> B["React App"]
    B --> C["Router"]
    C --> D["Public Pages: Landing, Login, Register"]
    C --> F["Protected Pages (need login)"]
    F --> G["Dashboard"]
    F --> H["Servers"]
    F --> I["Alerts"]
    F --> J["History"]
    F --> K["Settings"]
    B --> M["WebSocket — sends live data"]
    B --> N["REST API — loads/saves data"]
    M --> O["Spring Boot Backend"]
    N --> O
```

---

# Part II — What We Built [10 Marks]

## Tools Used

| Part | Tools |
| --- | --- |
| Frontend | React, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| Live Data | WebSocket (STOMP/SockJS) |
| Backend | Spring Boot (Java), MySQL, Redis, JWT |

## How Pages Connect

```mermaid
graph LR
    L["Landing"] --> LG["Login"]
    L --> RG["Register"]
    LG --> DB["Dashboard"]
    DB --> SV["Servers"] --> SD["Server Detail"]
    DB --> AL["Alerts"]
    DB --> AR["Alert Rules"]
    DB --> HI["History"]
    DB --> ST["Settings"]
```

---

## 1. Landing Page
Home page with **Get Started** and **Sign In** buttons.

![Landing Page](screenshot-landing.png)

```tsx
<Button onClick={() => navigate("/register")}>Get Started</Button>
<Button onClick={() => navigate("/login")}>Sign In</Button>
```

## 2. Login Page
User types email + password → app saves login token → goes to Dashboard.

![Login Page](screenshot-login.png)

```tsx
await login(values.email, values.password);
navigate("/dashboard");
```

## 3. Register Page
Signup form. After signing up, a verification email is sent.

![Register Page](screenshot-register.png)

```tsx
await register(values.name, values.email, values.password);
toast({ title: "Account created! Please verify your email." });
```

## 4. Dashboard
Shows 4 cards: Total Servers, Online, Active Alerts, Avg CPU — plus server list.

![Dashboard](screenshot-dashboard.png)

```tsx
<MetricCard title="Total Servers" value={summary?.totalServers} />
<MetricCard title="Online" value={summary?.online} color="green" />
<MetricCard title="Active Alerts" value={summary?.activeAlerts} color="red" />
```

## 5. Servers Page
Lists all servers with colored status badges. "Add Server" button to add new ones.

![Servers Page](screenshot-servers.png)

```tsx
<Button onClick={() => setAddOpen(true)}>Add Server</Button>
{servers?.map(s => <ServerCard key={s.id} server={s} />)}
```

## 6. Server Detail
4 live charts (CPU, Memory, Disk, Network) that update every 5 seconds — no refresh needed.

![Server Detail](screenshot-server-detail.png)

```tsx
client.subscribe(`/topic/server/${id}/metrics`, (msg) => {
  const data = JSON.parse(msg.body);
  setMetrics(prev => [...prev.slice(-60), data]);
});
```

## 7. Alerts Page
Shows all alerts. Filter by: All, Active, or Resolved. Colors: 🔴 Critical, 🟡 Warning, 🔵 Info.

![Alerts Page](screenshot-alerts.png)

```tsx
{["all", "active", "resolved"].map(f => (
  <Button onClick={() => setFilter(f)}>{f}</Button>
))}
```

## 8. Alert Rules
Set rules like "Alert me if CPU > 85%". Each rule has an on/off switch.

![Alert Rules Page](screenshot-alert-rules.png)

```tsx
<TableCell>{rule.metric} > {rule.threshold}%</TableCell>
<TableCell><Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} /></TableCell>
```

## 9. History Page
Pick a server and time range → see chart → download as PNG, PDF, CSV, or JSON.

![History Page](screenshot-history.png)

```tsx
<ServerSelector value={serverId} onChange={setServerId} />
<TimeFrameSelector value={timeFrame} onChange={setTimeFrame} />
<AreaChart data={historyData} />
```

## 10. Settings
Edit profile, turn email alerts on/off, switch between dark and light theme.

![Settings Page](screenshot-settings.png)

```tsx
<Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
<ThemeToggle /> {/* Dark/Light mode */}
```

---

## Shared Components (used on many pages)

| Component | What it does |
| --- | --- |
| **Sidebar** | Left menu for navigation. Shows which page is active. Has a 🟢/🔴 connection light. |
| **StatusBadge** | Colored label — green (Online), yellow (Warning), red (Critical), gray (Offline) |
| **MetricCard** | Shows one number with icon, like "CPU: 72%" |
| **ThemeToggle** | Button to switch dark/light mode. Remembers your choice. |

![Sidebar shown in Dashboard](screenshot-dashboard.png)

---

## How Users Interact (4 Flows)

### Flow 1: Sign Up → Login → See Dashboard

```mermaid
sequenceDiagram
    actor User
    User->>React: Fill signup form
    React->>Spring Boot: Save new user
    Spring Boot->>Gmail: Send verification email
    User->>React: Login after verifying
    Spring Boot-->>React: Give login token
    React-->>User: Show Dashboard
```

### Flow 2: Open Server → Watch Live Charts

```mermaid
sequenceDiagram
    actor User
    User->>React: Open Dashboard
    React->>API: Get server summary
    User->>React: Click a server
    React->>WebSocket: Connect for live data
    WebSocket-->>React: New data every 5 sec
    React-->>User: Charts update live
```

### Flow 3: Set Alert Rule → Get Notified

```mermaid
sequenceDiagram
    actor User
    User->>React: Create rule: CPU > 85%
    React->>Spring Boot: Save rule
    Agent->>Spring Boot: Reports CPU = 90%
    Spring Boot-->>React: Send alert
    React-->>User: Shows 🔴 CRITICAL alert
```

### Flow 4: View History → Download Report

```mermaid
sequenceDiagram
    actor User
    User->>React: Pick server + time range
    React->>API: Get history data
    React-->>User: Show chart
    User->>React: Click Export PNG
    React-->>User: File downloads
```

---

## Quick Summary

| What | Details |
| --- | --- |
| Pages | 10 (Landing, Login, Register, Dashboard, Servers, Server Detail, Alerts, Alert Rules, History, Settings) |
| Live Data | Charts update every 5 sec via WebSocket |
| Security | JWT tokens — must login to see pages |
| Export | PNG, PDF, CSV, JSON |
| Theme | Dark/light mode, saved in browser |
| Alerts | Email + in-app with colored severity badges |
