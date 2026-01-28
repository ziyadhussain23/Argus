# Argus - Continuous Monitoring and Alert Automation System

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-4.0.1-green?style=for-the-badge&logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk" alt="Java">
  <img src="https://img.shields.io/badge/React-18.3-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql" alt="MySQL">
  <img src="https://img.shields.io/badge/Redis-7.0-red?style=for-the-badge&logo=redis" alt="Redis">
</p>

Argus is a real-time server monitoring and alerting system that uses lightweight agents deployed on client servers to collect metrics and send them to a central monitoring server. The system evaluates metrics against user-defined alert rules and sends notifications when thresholds are breached.

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)
- [Frontend](#-frontend)
- [Agent Setup](#-agent-setup)
- [Database Schema](#-database-schema)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARGUS ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│   │   Server 1   │    │   Server 2   │    │   Server N   │                 │
│   │  ┌────────┐  │    │  ┌────────┐  │    │  ┌────────┐  │                 │
│   │  │ AGENT  │  │    │  │ AGENT  │  │    │  │ AGENT  │  │                 │
│   │  └───┬────┘  │    │  └───┬────┘  │    │  └───┬────┘  │                 │
│   └──────┼───────┘    └──────┼───────┘    └──────┼───────┘                 │
│          │                   │                   │                          │
│          └───────────────────┼───────────────────┘                          │
│                              ▼                                              │
│               ┌─────────────────────────────┐                               │
│               │      ARGUS SERVER           │                               │
│               │  ┌───────────────────────┐  │                               │
│               │  │ Metric Ingestion API  │◄─┼── POST /api/v1/metrics/ingest │
│               │  ├───────────────────────┤  │                               │
│               │  │   Alert Engine        │◄─┼── Evaluates rules in real-time│
│               │  ├───────────────────────┤  │                               │
│               │  │   Notification Svc    │◄─┼── Email/Slack/Webhook         │
│               │  ├───────────────────────┤  │                               │
│               │  │   WebSocket Handler   │◄─┼── Real-time dashboard updates │
│               │  └───────────────────────┘  │                               │
│               └──────────────┬──────────────┘                               │
│                              │                                              │
│          ┌───────────────────┼───────────────────┐                          │
│          ▼                   ▼                   ▼                          │
│   ┌────────────┐      ┌────────────┐      ┌────────────┐                   │
│   │   MySQL    │      │   Redis    │      │  Frontend  │                   │
│   │ (History)  │      │ (Real-time)│      │ (Dashboard)│                   │
│   └────────────┘      └────────────┘      └────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

- **Real-time Monitoring**: Collect CPU, Memory, Disk, Network metrics from multiple servers
- **Threshold-based Alerting**: Define custom alert rules with conditions and severity levels
- **Email Notifications**: Automatic email alerts with retry logic
- **Agent-based Collection**: Lightweight bash agent for Linux servers
- **WebSocket Support**: Real-time dashboard updates
- **Heartbeat Detection**: Automatic offline server detection
- **Role-based Access**: Admin and User roles for multi-tenant support

---

## 🛠 Tech Stack

### Backend

| Component | Technology |
|-----------|------------|
| Backend Framework | Spring Boot 4.0.1 |
| Language | Java 21 |
| Database | MySQL 8.0 |
| Cache | Redis 7.0 |
| Security | Spring Security + JWT |
| Real-time | WebSocket (STOMP) |
| Email | Spring Mail (SMTP) |
| Build Tool | Maven |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 18.3 |
| Language | TypeScript 5.8 |
| Build Tool | Vite 5.4 |
| UI Library | shadcn/ui + Radix UI |
| Styling | Tailwind CSS 3.4 |
| State Management | TanStack React Query |
| Routing | React Router 6 |
| Charts | Recharts |
| WebSocket | STOMP.js + SockJS |
| Form Handling | React Hook Form + Zod |

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- MySQL 8.0+
- Redis 7.0+
- Maven 3.9+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ziyadhussain23/Argus.git
   cd Argus
   ```

2. **Create MySQL database**
   ```sql
   CREATE DATABASE argus_db;
   ```

3. **Configure application properties**
   
   The application uses environment variables for sensitive configuration. 
   
   **Option 1: Using application.properties (Recommended for Development)**
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   # Edit application.properties and replace ${VARIABLE_NAME} with actual values
   ```
   
   **Option 2: Using Environment Variables (Recommended for Production)**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   # Edit .env with your actual credentials
   ```
   
   **Required Environment Variables:**
   - `DB_USERNAME` - MySQL username
   - `DB_PASSWORD` - MySQL password
   - `DB_HOST` - Database host (default: localhost)
   - `DB_PORT` - Database port (default: 3306)
   - `DB_NAME` - Database name (default: argus_db)
   - `REDIS_HOST` - Redis host (default: localhost)
   - `REDIS_PORT` - Redis port (default: 6379)
   - `JWT_SECRET` - JWT secret key (minimum 256 bits)
   - `JWT_EXPIRATION` - JWT expiration time in ms (default: 86400000)
   - `MAIL_HOST` - SMTP host (default: smtp.gmail.com)
   - `MAIL_PORT` - SMTP port (default: 587)
   - `MAIL_USERNAME` - Email username
   - `MAIL_PASSWORD` - Email app-specific password
   - `MAIL_FROM_EMAIL` - From email address
   
   **⚠️ Security Note:** Never commit `application.properties` or `.env` files with actual credentials to version control!

4. **Run the application**
   ```bash
   ./mvnw spring-boot:run
   ```

5. **Access the API**
   ```
   http://localhost:8080
   ```

6. **Run the Frontend**
   ```bash
   cd Argus_Frontend
   npm install
   npm run dev
   ```

7. **Access the Dashboard**
   ```
   http://localhost:5173
   ```

---

## ⚙ Configuration

### Environment Variables

The application uses environment variables for sensitive configuration. You can set them using:

1. **System environment variables**
2. **application.properties** with `${VARIABLE_NAME}` placeholders
3. **.env file** (for local development)

### application.properties.example

The repository includes a template file with environment variable placeholders:

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:argus_db}?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# Redis Configuration
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}

# JWT Configuration
argus.jwt.secret=${JWT_SECRET}
argus.jwt.expiration=${JWT_EXPIRATION:86400000}

# Mail Configuration
spring.mail.host=${MAIL_HOST:smtp.gmail.com}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
app.mail.from-email=${MAIL_FROM_EMAIL}

# Monitoring Configuration
argus.metrics.retention-days=30
argus.alert.evaluation-interval=60000
```

### Local Development Setup

1. Copy the example file:
   ```bash
   cp src/main/resources/application.properties.example src/main/resources/application.properties
   ```

2. Edit `application.properties` and replace the environment variables with your actual values:
   ```properties
   spring.datasource.username=your_actual_username
   spring.datasource.password=your_actual_password
   spring.mail.username=your-email@gmail.com
   spring.mail.password=your-app-password
   argus.jwt.secret=your-256-bit-secret-key
   ```

### Production Deployment

For production, set environment variables in your deployment environment:

```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-production-secret
export MAIL_USERNAME=your-email@gmail.com
export MAIL_PASSWORD=your-app-password
export MAIL_FROM_EMAIL=your-email@gmail.com
```

### application.properties

```properties
# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/argus_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=your_username
spring.datasource.password=your_password

# Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379

# JWT Configuration
argus.jwt.secret=your-secret-key-minimum-256-bits
argus.jwt.expiration=86400000

# Mail Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# Monitoring Configuration
argus.metrics.retention-days=30
argus.alert.evaluation-interval=60000
```

---

## 📖 API Reference

### Base URL
```
http://localhost:8080/api/v1
```

### Standard Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Success",
  "data": { },
  "timestamp": 1736755200000
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": 1736755200000
}
```

---

## � Authentication Endpoints

### 1. Register User

Create a new user account.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/auth/register` |
| **Method** | `POST` |
| **Auth** | None |

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "timestamp": 1736755200000
}
```

---

### 2. Login

Authenticate and receive a JWT token.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/auth/login` |
| **Method** | `POST` |
| **Auth** | None |

**Request Body:**

```json
{
  "username": "johndoe",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "timestamp": 1736755200000
}
```

---

### 3. Validate Token

Check if the current JWT token is valid.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/auth/validate` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token is valid",
  "data": "OK",
  "timestamp": 1736755200000
}
```

---

## �📊 Metric Ingestion Endpoints

These endpoints are **PUBLIC** (no authentication required) - used by agents.

### 1. Ingest Metrics

Push metrics from an agent to the Argus server.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/metrics/ingest` |
| **Method** | `POST` |
| **Auth** | None (uses agentKey) |

**Request Body:**

```json
{
  "agentKey": "argus-550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1736755200000,
  "metrics": [
    {
      "type": "CPU_USAGE",
      "value": 45.5,
      "unit": "%"
    },
    {
      "type": "MEMORY_USAGE",
      "value": 72.3,
      "unit": "%"
    },
    {
      "type": "MEMORY_TOTAL",
      "value": 16384,
      "unit": "MB"
    },
    {
      "type": "MEMORY_AVAILABLE",
      "value": 4521,
      "unit": "MB"
    },
    {
      "type": "DISK_USAGE",
      "value": 65.0,
      "unit": "%"
    },
    {
      "type": "NETWORK_IN",
      "value": 1048576,
      "unit": "bytes"
    },
    {
      "type": "NETWORK_OUT",
      "value": 524288,
      "unit": "bytes"
    },
    {
      "type": "PROCESS_COUNT",
      "value": 245,
      "unit": "count"
    },
    {
      "type": "LOAD_AVERAGE",
      "value": 1.25,
      "unit": ""
    },
    {
      "type": "UPTIME",
      "value": 864000,
      "unit": "seconds"
    }
  ]
}
```

**Supported Metric Types:**

| Type | Description | Typical Unit |
|------|-------------|--------------|
| `CPU_USAGE` | CPU utilization percentage | % |
| `MEMORY_USAGE` | Memory used percentage | % |
| `MEMORY_TOTAL` | Total system memory | MB |
| `MEMORY_AVAILABLE` | Available memory | MB |
| `DISK_USAGE` | Disk space used percentage | % |
| `DISK_TOTAL` | Total disk space | GB |
| `DISK_AVAILABLE` | Available disk space | GB |
| `NETWORK_IN` | Incoming network bytes | bytes |
| `NETWORK_OUT` | Outgoing network bytes | bytes |
| `PROCESS_COUNT` | Number of running processes | count |
| `LOAD_AVERAGE` | System load average (1 min) | - |
| `UPTIME` | System uptime | seconds |
| `CUSTOM` | Custom metric | varies |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Metrics ingested successfully",
  "data": null,
  "timestamp": 1736755200000
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid agent key",
  "data": null,
  "timestamp": 1736755200000
}
```

---

### 2. Heartbeat

Simple endpoint for agents to indicate they're alive without sending full metrics.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/metrics/heartbeat` |
| **Method** | `POST` |
| **Auth** | None (uses agentKey) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `agentKey` | string | Yes | Unique agent identifier |

**Example:**
```bash
curl -X POST "http://localhost:8080/api/v1/metrics/heartbeat?agentKey=argus-550e8400-e29b-41d4-a716-446655440000"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Heartbeat received",
  "data": null,
  "timestamp": 1736755200000
}
```

---

## 🖥 Server Management Endpoints

These endpoints require **authentication** (JWT token).

### 1. Register Server

Register a new server to be monitored.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers` |
| **Method** | `POST` |
| **Auth** | Required (JWT) |

**Request Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Production Server 1",
  "hostAddress": "192.168.1.100",
  "operatingSystem": "Ubuntu 22.04 LTS",
  "description": "Main web application server"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Server registered successfully",
  "data": {
    "id": 1,
    "name": "Production Server 1",
    "hostAddress": "192.168.1.100",
    "agentKey": "argus-550e8400-e29b-41d4-a716-446655440000",
    "operatingSystem": "Ubuntu 22.04 LTS",
    "status": "UNKNOWN",
    "lastHeartbeat": null,
    "createdAt": "2026-01-13T10:30:00",
    "activeAlerts": 0
  },
  "timestamp": 1736755200000
}
```

> **Important:** Save the `agentKey` - you'll need it to configure the agent on your server.

---

### 2. List All Servers

Get all servers owned by the authenticated user.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "Production Server 1",
      "hostAddress": "192.168.1.100",
      "agentKey": "argus-550e8400-e29b-41d4-a716-446655440000",
      "operatingSystem": "Ubuntu 22.04 LTS",
      "status": "ONLINE",
      "lastHeartbeat": "2026-01-13T12:45:30",
      "createdAt": "2026-01-13T10:30:00",
      "activeAlerts": 2
    },
    {
      "id": 2,
      "name": "Database Server",
      "hostAddress": "192.168.1.101",
      "agentKey": "argus-660e8400-e29b-41d4-a716-446655440001",
      "operatingSystem": "CentOS 8",
      "status": "WARNING",
      "lastHeartbeat": "2026-01-13T12:45:28",
      "createdAt": "2026-01-13T11:00:00",
      "activeAlerts": 1
    }
  ],
  "timestamp": 1736755200000
}
```

**Server Status Values:**

| Status | Description |
|--------|-------------|
| `ONLINE` | Server is healthy and sending metrics |
| `OFFLINE` | No heartbeat received (>2 minutes) |
| `WARNING` | Warning-level alert triggered |
| `CRITICAL` | Critical-level alert triggered |
| `UNKNOWN` | Server just registered, no metrics yet |

---

### 3. Get Server Details

Get details of a specific server.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers/{id}` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | Long | Server ID |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "name": "Production Server 1",
    "hostAddress": "192.168.1.100",
    "agentKey": "argus-550e8400-e29b-41d4-a716-446655440000",
    "operatingSystem": "Ubuntu 22.04 LTS",
    "status": "ONLINE",
    "lastHeartbeat": "2026-01-13T12:45:30",
    "createdAt": "2026-01-13T10:30:00",
    "activeAlerts": 2
  },
  "timestamp": 1736755200000
}
```

---

### 4. Delete Server

Remove a server from monitoring.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers/{id}` |
| **Method** | `DELETE` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Server deleted successfully",
  "data": null,
  "timestamp": 1736755200000
}
```

---

### 5. Regenerate Agent Key

Generate a new agent key for a server (invalidates the old key).

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers/{id}/regenerate-key` |
| **Method** | `POST` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Agent key regenerated",
  "data": "argus-770e8400-e29b-41d4-a716-446655440002",
  "timestamp": 1736755200000
}
```

---

### 6. Get Server Metrics

Retrieve metrics for a specific server within a time range.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers/{id}/metrics` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filter by metric type (e.g., `CPU_USAGE`) |
| `start` | datetime | No | Start time (ISO 8601). Default: 24 hours ago |
| `end` | datetime | No | End time (ISO 8601). Default: now |

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/v1/servers/1/metrics?type=CPU_USAGE&start=2026-01-13T00:00:00&end=2026-01-13T12:00:00"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1001,
      "metricType": "CPU_USAGE",
      "value": 45.5,
      "unit": "%",
      "timestamp": "2026-01-13T12:00:00",
      "additionalInfo": null
    },
    {
      "id": 1002,
      "metricType": "CPU_USAGE",
      "value": 52.3,
      "unit": "%",
      "timestamp": "2026-01-13T12:01:00",
      "additionalInfo": null
    }
  ],
  "timestamp": 1736755200000
}
```

---

### 7. Get Latest Metric

Get the most recent value for a specific metric type.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/servers/{id}/metrics/latest` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Metric type (e.g., `CPU_USAGE`) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1050,
    "metricType": "CPU_USAGE",
    "value": 48.2,
    "unit": "%",
    "timestamp": "2026-01-13T12:45:30",
    "additionalInfo": null
  },
  "timestamp": 1736755200000
}
```

---

### 8. Get Average Metric

Get the average value for a specific metric type over a time period.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/metrics/server/{id}/average` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Metric type (e.g., `CPU_USAGE`) |
| `minutes` | int | No | Time period in minutes (default: 60) |

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/v1/metrics/server/1/average?type=CPU_USAGE&minutes=30"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": 52.75,
  "timestamp": 1736755200000
}
```

---

## 🚨 Alert Management Endpoints

### Alert Rules

#### 1. Create Alert Rule

Create a new threshold-based alert rule.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/rules` |
| **Method** | `POST` |
| **Auth** | Required (JWT) |

**Request Body:**

```json
{
  "name": "High CPU Alert",
  "description": "Alert when CPU usage exceeds 90% for 5 minutes",
  "serverId": 1,
  "metricType": "CPU_USAGE",
  "conditionOperator": "GREATER_THAN",
  "thresholdValue": 90.0,
  "durationSeconds": 300,
  "severity": "CRITICAL",
  "cooldownMinutes": 10
}
```

**Condition Operators:**

| Operator | Description |
|----------|-------------|
| `GREATER_THAN` | Value > threshold |
| `LESS_THAN` | Value < threshold |
| `GREATER_THAN_OR_EQUAL` | Value >= threshold |
| `LESS_THAN_OR_EQUAL` | Value <= threshold |
| `EQUALS` | Value == threshold |
| `NOT_EQUALS` | Value != threshold |

**Severity Levels:**

| Severity | Description |
|----------|-------------|
| `INFO` | Informational alert |
| `WARNING` | Warning level - server status changes to WARNING |
| `CRITICAL` | Critical level - server status changes to CRITICAL |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert rule created",
  "data": {
    "id": 1,
    "name": "High CPU Alert",
    "description": "Alert when CPU usage exceeds 90% for 5 minutes",
    "metricType": "CPU_USAGE",
    "conditionOperator": "GREATER_THAN",
    "thresholdValue": 90.0,
    "durationSeconds": 300,
    "severity": "CRITICAL",
    "isEnabled": true,
    "cooldownMinutes": 10,
    "createdAt": "2026-01-13T10:30:00",
    "updatedAt": "2026-01-13T10:30:00"
  },
  "timestamp": 1736755200000
}
```

---

#### 2. Get Alert Rules for Server

List all alert rules for a specific server.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/rules/server/{serverId}` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 1,
      "name": "High CPU Alert",
      "metricType": "CPU_USAGE",
      "conditionOperator": "GREATER_THAN",
      "thresholdValue": 90.0,
      "severity": "CRITICAL",
      "isEnabled": true
    },
    {
      "id": 2,
      "name": "Low Memory Warning",
      "metricType": "MEMORY_AVAILABLE",
      "conditionOperator": "LESS_THAN",
      "thresholdValue": 1024.0,
      "severity": "WARNING",
      "isEnabled": true
    }
  ],
  "timestamp": 1736755200000
}
```

---

#### 3. Toggle Alert Rule

Enable or disable an alert rule.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/rules/{ruleId}/toggle` |
| **Method** | `PATCH` |
| **Auth** | Required (JWT) |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | boolean | Yes | `true` to enable, `false` to disable |

**Example:**
```bash
curl -X PATCH -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/v1/alerts/rules/1/toggle?enabled=false"
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert rule updated",
  "data": null,
  "timestamp": 1736755200000
}
```

---

#### 4. Delete Alert Rule

Remove an alert rule.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/rules/{ruleId}` |
| **Method** | `DELETE` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert rule deleted",
  "data": null,
  "timestamp": 1736755200000
}
```

---

### Alerts

#### 1. Get Active Alerts

Get all active (unresolved) alerts for the authenticated user.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 101,
      "serverId": 1,
      "serverName": "Production Server 1",
      "title": "[CRITICAL] High CPU Alert on Production Server 1",
      "message": "Alert triggered: High CPU Alert\nServer: Production Server 1 (192.168.1.100)\nMetric: CPU_USAGE\nCurrent Value: 95.50 %\nThreshold: GREATER_THAN 90.00",
      "severity": "CRITICAL",
      "status": "ACTIVE",
      "metricValue": 95.5,
      "thresholdValue": 90.0,
      "triggeredAt": "2026-01-13T12:30:00",
      "acknowledgedAt": null,
      "resolvedAt": null
    }
  ],
  "timestamp": 1736755200000
}
```

**Alert Status Values:**

| Status | Description |
|--------|-------------|
| `ACTIVE` | Alert is active and unacknowledged |
| `ACKNOWLEDGED` | Alert has been acknowledged by a user |
| `RESOLVED` | Alert has been resolved (manually or auto-resolved) |

---

#### 2. Get Alerts by Server

Get all alerts for a specific server.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/server/{serverId}` |
| **Method** | `GET` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "id": 101,
      "serverId": 1,
      "serverName": "Production Server 1",
      "title": "[CRITICAL] High CPU Alert on Production Server 1",
      "severity": "CRITICAL",
      "status": "RESOLVED",
      "triggeredAt": "2026-01-13T12:30:00",
      "resolvedAt": "2026-01-13T12:45:00"
    }
  ],
  "timestamp": 1736755200000
}
```

---

#### 3. Acknowledge Alert

Mark an alert as acknowledged.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/{alertId}/acknowledge` |
| **Method** | `POST` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert acknowledged",
  "data": null,
  "timestamp": 1736755200000
}
```

---

#### 4. Resolve Alert

Manually resolve an alert.

| Property | Value |
|----------|-------|
| **URL** | `/api/v1/alerts/{alertId}/resolve` |
| **Method** | `POST` |
| **Auth** | Required (JWT) |

**Success Response (200):**

```json
{
  "success": true,
  "message": "Alert resolved",
  "data": null,
  "timestamp": 1736755200000
}
```

---

## 🖥️ Frontend

The Argus Frontend is a modern React dashboard for monitoring servers and managing alerts.

### Frontend Structure

```
Argus_Frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components (Sidebar, MainLayout)
│   │   ├── AlertCard.tsx    # Alert display component
│   │   ├── MetricCard.tsx   # Metric visualization component
│   │   ├── ServerCard.tsx   # Server status card
│   │   └── StatusBadge.tsx  # Status indicator badge
│   ├── pages/               # Application pages
│   │   ├── Dashboard.tsx    # Main dashboard with metrics overview
│   │   ├── Servers.tsx      # Server list view
│   │   ├── ServerDetail.tsx # Individual server details
│   │   ├── AddServer.tsx    # Server registration form
│   │   ├── Alerts.tsx       # Active alerts view
│   │   ├── AlertRules.tsx   # Alert rule management
│   │   ├── Login.tsx        # Authentication page
│   │   ├── Register.tsx     # User registration
│   │   └── Settings.tsx     # User settings
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── hooks/               # Custom React hooks
│   │   ├── use-realtime.ts  # WebSocket real-time updates
│   │   ├── use-toast.ts     # Toast notifications
│   │   └── use-mobile.tsx   # Mobile responsiveness
│   └── lib/                 # Utilities
│       ├── api.ts           # API client configuration
│       └── utils.ts         # Helper functions
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Running the Frontend

```bash
# Navigate to frontend directory
cd Argus_Frontend

# Install dependencies (using npm or bun)
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev

# Build for production
npm run build
```

### Frontend Features

- **Real-time Dashboard**: Live metrics updates via WebSocket
- **Server Management**: Add, view, and delete monitored servers
- **Metrics Visualization**: Charts and graphs for CPU, Memory, Disk, Network
- **Alert Management**: View, acknowledge, and resolve alerts
- **Alert Rules**: Create and manage threshold-based alert rules
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: Theme support via next-themes

---

## 🤖 Agent Setup

The Argus agent is a lightweight shell script that runs on client servers to collect and send metrics.

### Installation

1. **Copy the agent script to your server**
   ```bash
   scp agent/argus-agent.sh user@your-server:/opt/argus/
   ```

2. **Make it executable**
   ```bash
   chmod +x /opt/argus/argus-agent.sh
   ```

3. **Configure the agent**
   
   Set environment variables or edit the script:
   ```bash
   export ARGUS_SERVER_URL="http://your-argus-server:8080"
   export AGENT_KEY="argus-550e8400-e29b-41d4-a716-446655440000"
   ```

4. **Test the agent**
   ```bash
   /opt/argus/argus-agent.sh
   ```

5. **Set up cron job (runs every minute)**
   ```bash
   (crontab -l 2>/dev/null; echo "*/1 * * * * ARGUS_SERVER_URL=http://your-server:8080 AGENT_KEY=your-key /opt/argus/argus-agent.sh >> /var/log/argus-agent.log 2>&1") | crontab -
   ```

### Alternative: Use the Loop Script

For continuous monitoring without cron:
```bash
# Run the agent loop script
ARGUS_SERVER_URL=http://your-server:8080 AGENT_KEY=your-key ./argus-agent-loop.sh
```

### Systemd Service (Recommended)

For production, create a systemd service:

```bash
sudo nano /etc/systemd/system/argus-agent.service
```

```ini
[Unit]
Description=Argus Monitoring Agent
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -c 'while true; do /opt/argus/argus-agent.sh; sleep 60; done'
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable argus-agent
sudo systemctl start argus-agent
```

### Metrics Collected by Agent

| Metric | Command Used | Description |
|--------|--------------|-------------|
| CPU_USAGE | `top -bn1` | CPU utilization % |
| MEMORY_USAGE | `free -m` | Memory used % |
| MEMORY_TOTAL | `free -m` | Total RAM in MB |
| MEMORY_AVAILABLE | `free -m` | Available RAM in MB |
| DISK_USAGE | `df -h /` | Root partition usage % |
| NETWORK_IN | `/sys/class/net/*/statistics/rx_bytes` | Bytes received |
| NETWORK_OUT | `/sys/class/net/*/statistics/tx_bytes` | Bytes transmitted |
| PROCESS_COUNT | `ps aux \| wc -l` | Running processes |
| LOAD_AVERAGE | `/proc/loadavg` | 1-minute load average |
| UPTIME | `/proc/uptime` | System uptime in seconds |

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌──────────────────┐     ┌──────────────────┐
│      users       │     │     servers      │
├──────────────────┤     ├──────────────────┤
│ id (PK)          │◄────│ owner_id (FK)    │
│ username         │     │ id (PK)          │
│ email            │     │ name             │
│ password         │     │ host_address     │
│ role             │     │ agent_key        │
│ is_active        │     │ status           │
│ created_at       │     │ last_heartbeat   │
│ updated_at       │     │ operating_system │
└──────────────────┘     └────────┬─────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     metrics      │     │   alert_rules    │     │     alerts       │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │     │ id (PK)          │◄────│ alert_rule_id(FK)│
│ server_id (FK)   │     │ server_id (FK)   │     │ id (PK)          │
│ metric_type      │     │ name             │     │ server_id (FK)   │
│ metric_value     │     │ metric_type      │     │ title            │
│ unit             │     │ condition_op     │     │ message          │
│ timestamp        │     │ threshold_value  │     │ severity         │
│ additional_info  │     │ duration_seconds │     │ status           │
└──────────────────┘     │ severity         │     │ metric_value     │
                         │ is_enabled       │     │ triggered_at     │
                         │ cooldown_minutes │     │ acknowledged_at  │
                         └──────────────────┘     │ resolved_at      │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  notifications   │
                                                  ├──────────────────┤
                                                  │ id (PK)          │
                                                  │ alert_id (FK)    │
                                                  │ user_id (FK)     │
                                                  │ channel          │
                                                  │ subject          │
                                                  │ content          │
                                                  │ status           │
                                                  │ sent_at          │
                                                  │ retry_count      │
                                                  └──────────────────┘
```

---

## 🔧 Scheduled Tasks

| Task | Interval | Description |
|------|----------|-------------|
| Heartbeat Monitor | 30 seconds | Marks servers as OFFLINE if no heartbeat >2 min |
| Notification Processor | 30 seconds | Sends pending notifications |
| Notification Retry | 60 seconds | Retries failed notifications (max 3 retries) |
| Metric Cleanup | Daily @ 2 AM | Deletes metrics older than retention period |

---

## 🔌 WebSocket

Real-time updates are available via WebSocket at:

```
ws://localhost:8080/ws
```

**Topics:**
- `/topic/metrics/{serverId}` - Real-time metrics for a server
- `/topic/alerts` - New alert notifications
- `/topic/server-status` - Server status changes

### Frontend WebSocket Usage

The frontend uses `@stomp/stompjs` and `sockjs-client` for WebSocket connections:

```typescript
// Example from use-realtime.ts
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
  onConnect: () => {
    client.subscribe('/topic/metrics/1', (message) => {
      const metrics = JSON.parse(message.body);
      // Handle real-time metrics
    });
  }
});
```

---

## 📝 License

This project is licensed under the MIT License.

---

## �️ Project Structure

```
Argus/
├── src/main/java/nightswatch/argus/
│   ├── ArgusApplication.java    # Main Spring Boot application
│   ├── config/                  # Configuration classes
│   │   ├── SecurityConfig.java  # Spring Security configuration
│   │   ├── WebSocketConfig.java # WebSocket configuration
│   │   ├── JwtAuthenticationFilter.java
│   │   └── SchedulingConfig.java
│   ├── controller/              # REST API controllers
│   │   ├── AuthController.java
│   │   ├── ServerController.java
│   │   ├── MetricIngestionController.java
│   │   └── AlertController.java
│   ├── service/                 # Business logic services
│   │   ├── UserService.java
│   │   ├── ServerService.java
│   │   ├── MetricService.java
│   │   ├── AlertService.java
│   │   ├── AlertEvaluationService.java
│   │   ├── NotificationService.java
│   │   ├── HeartbeatMonitorService.java
│   │   └── JwtService.java
│   ├── entity/                  # JPA entities
│   │   ├── User.java
│   │   ├── Server.java
│   │   ├── Metric.java
│   │   ├── Alert.java
│   │   ├── AlertRule.java
│   │   └── Notification.java
│   ├── repository/              # Spring Data JPA repositories
│   ├── dto/                     # Data Transfer Objects
│   │   ├── request/
│   │   └── response/
│   └── exception/               # Custom exceptions
├── src/main/resources/
│   └── application.properties   # Application configuration
├── Argus_Frontend/              # React Frontend
├── agent/                       # Monitoring agent scripts
│   ├── argus-agent.sh          # Main agent script
│   ├── argus-agent-loop.sh     # Continuous monitoring script
│   └── argus-agent-test.sh     # Test script
├── pom.xml                      # Maven configuration
└── README.md
```

---

## �👥 Contributors

- **Night's Watch Team** - Initial development

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.
