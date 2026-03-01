# Assignment 5 — Deployment & Implementation Details

**Course:** CS 331 — Software Engineering Lab  
**Project:** Argus (Real-time Server Monitoring and Alerting System)  
**Team:** NightsWatch

---

## 1. Hosting & Deployment Strategy [5 Marks]

### Components & Target Hosts

To keep things cost-effective and simple, we are relying mostly on AWS Free Tier:

| Component | Where it's Hosted | Details |
| :--- | :--- | :--- |
| **React Frontend** | AWS EC2 (served by Nginx) | Nginx serves the static built files over port 80/443 |
| **Spring Boot Backend** | AWS EC2 | Runs as a `systemd` background service on port 8080 |
| **MySQL Database** | AWS RDS | Managed database, port 3306 |
| **Redis Cache** | AWS EC2 | Running locally on the same instance, port 6379 |
| **Bash Agent** | Target Client Servers | Can be any Linux machine the user wants to monitor |

### Step-by-Step Deployment

1. **Build the Application**
   - Package the backend using Maven: `./mvnw clean package -DskipTests`
   - Build the React SPA into static files: `npm run build`
2. **Transfer Files to EC2**
   - Use `scp` to copy the generated `Argus.jar` and the frontend `dist/` folder to the EC2 server.
3. **Configure the Environment**
   - Update `application.properties` on the server with production credentials (RDS database URL, Redis host, AWS SES keys for email, and JWT secret).
4. **Start the Backend**
   - Run the Spring Boot app as a linux `systemd` service so it automatically restarts if it crashes.
5. **Setup Nginx**
   - Configure Nginx to serve the React files at the root `/`.
   - Setup reverse proxies for `/api/*` and WebSocket connections (`/ws`) to forward traffic to the Spring Boot app running on port 8080.
6. **Deploy the Agent**
   - The user copies `argus-agent.sh` to their machine, sets the `AGENT_KEY`, and adds it to their `crontab` to run every minute.

### Security Implementation

- **API Security:** All protected endpoints require a JWT token (expires every 24 hours).
- **Agent Authentication:** Metric ingestion doesn't use JWT; instead, it requires the secret `agentKey` passed in the payload.
- **Passwords:** Handled using BCrypt hashing.
- **Infrastructure:** The RDS database is kept in a private subnet, meaning it cannot be reached from the public internet, only from our EC2 instance.
- **DDoS/Spam Protection:** We use Redis to rate-limit Twilio SMS notifications.

---

## 2. User Access & Component Interaction [10 Marks]

End users have three primary ways of interacting with Argus:

1. **Web Dashboard:** The standard browser interface where users sign up, add servers, define alert thresholds, and watch live charts.
2. **Bash Agent:** A passive interaction point. Server admins install the script once, and it consistently pushes hardware metrics every minute.
3. **Notifications:** Users passively receive critical system alerts via email (AWS SES) and text message (Twilio).

### Overview Architecture Diagram

```mermaid
graph TB
    User([fa:fa-user End User<br/>Browser])
    Agent([fa:fa-terminal Bash Agent<br/>Client Servers])

    subgraph EC2["AWS EC2 Instance"]
        Nginx[Nginx<br/>Port 80/443]
        Frontend[React Frontend<br/>Static Files]
        Backend[Spring Boot<br/>Port 8080]
        Redis[(Redis<br/>Port 6379)]
    end

    RDS[(MySQL<br/>AWS RDS)]
    Twilio[Twilio SMS API]
    SES[AWS SES Email]

    User -->|HTTPS| Nginx
    Nginx -->|static files| Frontend
    Nginx -->|/api, /ws| Backend
    Agent -->|POST /api/v1/metrics/ingest| Nginx
    Backend -->|JPA| RDS
    Backend -->|rate limiting| Redis
    Backend -->|SMS| Twilio
    Backend -->|Email| SES
    Backend -->|WebSocket push| User
```

### Component Flow

```mermaid
graph LR
    A[Bash Agent] -->|POST metrics + agentKey| B[MetricIngestionController]
    B --> C[MetricService]
    C -->|save| D[(MySQL)]
    C -->|update heartbeat| E[ServerService]
    C --> F[AlertEvaluationService]
    F -->|check rules| D
    F -->|threshold breached| G[triggerAlert]
    G -->|persist alert| D
    G --> H[NotificationService]
    H -->|email| I[AWS SES]
    H -->|SMS| J[Twilio]
    C -->|WebSocket push| K[React Dashboard]
    G -->|WebSocket push| K
    F -->|condition OK| L[Auto-resolve Alert]
```

### Basic Usage Sequence

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as React Frontend
    participant B as Spring Boot Backend
    participant DB as MySQL (RDS)
    participant Ag as Bash Agent
    participant N as AWS SES / Twilio

    U->>F: Open dashboard, login
    F->>B: POST /auth/login
    B->>F: JWT token
    U->>F: Add server
    F->>B: POST /servers
    B->>DB: Save server, generate agentKey
    B->>F: Return agentKey
    U->>Ag: Deploy agent with agentKey
    loop Every 1 minute
        Ag->>B: POST /metrics/ingest (CPU, RAM, Disk...)
        B->>DB: Save metrics
        B->>B: Evaluate alert rules
        alt Threshold breached
            B->>DB: Save alert
            B->>N: Send email + SMS
            B-->>F: WebSocket push (alert)
            F-->>U: Dashboard updates in real-time
        end
        B-->>F: WebSocket push (metrics)
        F-->>U: Live metric charts update
    end
```

---

## 3. Component Implementations [10 Marks]

The actual implementations for these parts have already been coded and exist in the repository:
- **Backend APIs & Logic:** Located in `src/main/java/nightswatch/argus/`
- **Frontend SPA:** Located in `Argus_Frontend/src/`
- **Agent Bash Script:** Located in `agent/argus-agent.sh`

### How the core components talk to each other

When an agent pushes a new performance metric, this is the exact flow that takes place under the hood:

```mermaid
sequenceDiagram
    participant Agent as Bash Agent
    participant Ctrl as MetricIngestionController
    participant MS as MetricService
    participant AES as AlertEvaluationService
    participant DB as MySQL
    participant NS as NotificationService
    participant WS as WebSocket → React Dashboard

    Agent->>Ctrl: POST /api/v1/metrics/ingest<br/>{agentKey, metrics: [{CPU: 95%}]}
    Ctrl->>MS: ingestMetrics(payload)
    MS->>DB: saveAll(metrics)
    MS->>MS: updateHeartbeat(server)
    MS->>AES: evaluateMetrics(server, metrics)
    AES->>DB: findRules(server, CPU_USAGE)
    Note over AES: Rule: CPU > 90%<br/>Current: 95% → BREACH
    AES->>DB: save(Alert)
    AES->>NS: sendAlertNotification(alert)
    NS-->>NS: Send Email (AWS SES) + SMS (Twilio)
    AES-->>WS: push alert update
    MS-->>WS: push metric update
    Ctrl-->>Agent: 200 OK
```
