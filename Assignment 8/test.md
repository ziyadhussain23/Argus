# Assignment 8 - Combined Test Log

**Project:** Argus (Server Monitoring System)  
**Course:** CS 331 - Software Engineering Lab  
**Date:** 2026-03-30  
**Base URL (API tests):** `http://localhost:8080`

---
## 1. Purpose

This report includes:
- White Box Testing (internal-logic-focused cases)
- Other tests (Black Box API checks + automated backend test)

---

## 2. White Box Testing (With Command and Output)

These cases are based on internal branch coverage in auth logic (duplicate checks, token validation, email verification branch, DTO validation).

### WB-01: Duplicate Username Branch

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/register" \
-d '{"username":"assign8_user_1774851004","email":"new_assign8_1774851004@example.com","password":"secret123"}'
```

**Expected**
- HTTP 400
- Message: Username already taken

**Actual Output**
```json
{"success":false,"message":"Username already taken","data":null,"timestamp":1774851092105}
HTTP_STATUS:400
```

**Result:** PASS

### WB-02: Duplicate Email Branch

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/register" \
-d '{"username":"new_assign8_user_1774851004","email":"assign8_1774851004@example.com","password":"secret123"}'
```

**Expected**
- HTTP 400
- Message: Email already registered

**Actual Output**
```json
{"success":false,"message":"Email already registered","data":null,"timestamp":1774851092150}
HTTP_STATUS:400
```

**Result:** PASS

### WB-03: Invalid Token Branch

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/verify" \
-d '{"token":"bad.token"}'
```

**Expected**
- HTTP 400
- Message: Invalid token

**Actual Output**
```json
{"success":false,"message":"Invalid token","data":null,"timestamp":1774851092188}
HTTP_STATUS:400
```

**Result:** PASS

### WB-04: Unverified Email Login Branch

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/login" \
-d '{"username":"assign8_user_1774851004","password":"secret123"}'
```

**Expected**
- HTTP 400
- Message: Email not verified

**Actual Output**
```json
{"success":false,"message":"Email not verified. Please verify your email before logging in.","data":null,"timestamp":1774851092363}
HTTP_STATUS:400
```

**Result:** PASS

### WB-05: DTO Validation Branch

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/login" \
-d '{"username":"someone","password":""}'
```

**Expected**
- HTTP 400
- Validation error for missing password

**Actual Output**
```json
{"success":false,"message":"Validation failed","data":{"password":"Password is required"},"timestamp":1774851092400}
HTTP_STATUS:400
```

**Result:** PASS

### White Box Summary

| Metric | Value |
| --- | --- |
| Total White Box Cases | 5 |
| Passed | 5 |
| Failed | 0 |

---

## 3. Other Tests

### 3.1 Black Box API Testing (Functional)

These cases were executed from API behavior perspective only (request and response), without relying on internal implementation details.

### BB-01: Register With Invalid Email Format

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/register" \
-d '{"username":"demoUser","email":"bad-email","password":"secret123"}'
```

**Expected**
- HTTP 400
- Validation failed with invalid email format message

**Actual Output**
```json
{"success":false,"message":"Validation failed","data":{"email":"Invalid email format"},"timestamp":1774851004602}
HTTP_STATUS:400
```

**Result:** PASS

### BB-02: Verify With Invalid Token

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/verify" \
-d '{"token":"invalid.token.value"}'
```

**Expected**
- HTTP 400
- Message: Invalid token

**Actual Output**
```json
{"success":false,"message":"Invalid token","data":null,"timestamp":1774851004647}
HTTP_STATUS:400
```

**Result:** PASS

### BB-03: Login With Missing Password

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/login" \
-d '{"username":"someone","password":""}'
```

**Expected**
- HTTP 400
- Validation failed with password required message

**Actual Output**
```json
{"success":false,"message":"Validation failed","data":{"password":"Password is required"},"timestamp":1774851004692}
HTTP_STATUS:400
```

**Result:** PASS

### BB-04: Register With Valid User Data

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/register" \
-d '{"username":"assign8_user_1774851004","email":"assign8_1774851004@example.com","password":"secret123"}'
```

**Expected**
- HTTP 201
- Success response containing token and user object

**Actual Output**
```json
{"success":true,"message":"User registered successfully","data":{"token":"eyJhbGciOiJIUzM4NCJ9.eyJyb2xlIjoiVVNFUiIsInVzZXJJZCI6NCwiZW1haWwiOiJhc3NpZ244XzE3NzQ4NTEwMDRAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6ImFzc2lnbjhfdXNlcl8xNzc0ODUxMDA0Iiwic3ViIjoiYXNzaWduOF91c2VyXzE3NzQ4NTEwMDQiLCJpYXQiOjE3NzQ4NTEwMDQsImV4cCI6MTc3NDkzNzQwNH0.rbDtthnrDkjPVA5Z-OV4CyEARrFSaPoHF77jT2bItfz-prqUhvKnLbmnqTj82V21","user":{"id":4,"username":"assign8_user_1774851004","email":"assign8_1774851004@example.com","role":"USER"}},"timestamp":1774851004909}
HTTP_STATUS:201
```

**Result:** PASS

### BB-05: Login Before Email Verification

**Command**
```bash
curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Content-Type: application/json" \
-X POST "http://localhost:8080/api/v1/auth/login" \
-d '{"username":"assign8_user_1774851004","password":"secret123"}'
```

**Expected**
- HTTP 400
- Message indicating email is not verified

**Actual Output**
```json
{"success":false,"message":"Email not verified. Please verify your email before logging in.","data":null,"timestamp":1774851005094}
HTTP_STATUS:400
```

**Result:** PASS

### Black Box Summary

| Metric | Value |
| --- | --- |
| Total Black Box Cases | 5 |
| Passed | 5 |
| Failed | 0 |

### 3.2 Automated Backend Test (JUnit/Spring Boot)

**Command**
```bash
./mvnw test -q
```

**Output Summary**
```text
Test set: nightswatch.argus.ArgusApplicationTests
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
Time elapsed: 7.393 s
```

**Result:** PASS

---

## 4. Final Summary

| Test Group | Executed | Passed | Failed |
| --- | --- | --- | --- |
| White Box | 5 | 5 | 0 |
| Black Box | 5 | 5 | 0 |
| Automated Backend Test | 1 suite | 1 suite | 0 |

**Conclusion:**
Both white box and other required tests were performed successfully, and observed behavior matched expected outcomes for the selected scenarios.
