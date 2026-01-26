# CS 331 - Software Engineering Lab
## Assignment 2: Use Case Diagram - Argus Server Monitoring System

## Step 1: Identified Use Cases [Marks = 10]

| ID | Use Case | Description |
|----|----------|-------------|
| UC-01 | Register | Create account |
| UC-02 | Login | Authenticate user |
| UC-03 | Logout | End session |
| UC-04 | Verify Email | Verify via email link |
| UC-05 | Reset Password | Recover account |
| UC-06 | Add Server | Register server for monitoring |
| UC-07 | View Servers | List monitored servers |
| UC-08 | View Server Details | View server metrics |
| UC-09 | Delete Server | Remove server |
| UC-10 | Create Alert Rule | Define threshold rules |
| UC-11 | View Alerts | See triggered alerts |
| UC-12 | Acknowledge Alert | Mark alert acknowledged |
| UC-13 | Resolve Alert | Resolve active alert |
| UC-14 | View Dashboard | Overview metrics |
| UC-15 | Send Metrics | Agent sends metrics |
| UC-16 | Send Notification | Email on alert trigger |

---

## Step 2: Identified Actors [Marks = 10]

### Primary Actors
| Actor | Description |
|-------|-------------|
| Guest | Unauthenticated user |
| User | Authenticated user |
| Admin | Administrator |

### Secondary Actors
| Actor | Description |
|-------|-------------|
| Monitoring Agent | Sends metrics via API |
| Email Service | Delivers notifications |

---

## Use Case Relationships

### Include («include»)
| Base | Included |
|------|----------|
| Add Server | Generate Agent Key |
| Login | Validate Credentials |
| Send Metrics | Evaluate Alert Rules |

### Extend («extend»)
| Base | Extension | Condition |
|------|-----------|-----------|
| Evaluate Rules | Trigger Alert | Threshold breached |
| Trigger Alert | Send Notification | Alert created |

---

## Use Case Diagram

![Use Case Diagram](https://www.plantuml.com/plantuml/png/ZLNTRXiv3xsVfo1oq--xI16FVz8KWL77CTAYwQAmam850XJA32CBqKY1f8bhxEwxxuWUsf7ZoUwDFHJF8OyeYVpaWt2XhdJs3XPXhPMHcNzKvaauKO4eWdLn6K6iqDiANpXhZuNm27zc000NedYKpjQcd5fjtVcvgCDoF8Ph9PVXGjTu6ENHFQDZt9L3D1tXDBh0kAbrGX_6bS8lxwrm9MD_ejPsrP5zxGDMk-nYdVsTDPMuKK5Z5k8lJ9oiFIn89topHWNhb96m82uSmwr7cCP2N2eXdQYQ0EoyYBc4MsSEYo2Cr0X7v-UB-fuJtnaA_phkKLjM-da7awQOQ88gH53MR5DwSlD17CrHgeRiZa1uk9sUz82F8SLTMwaCW_9kaAq3e_eTg1_erCCQPfLGch633kmSFGRuBhnVMLSoUjWLMMXLYe0mTLZ6lGljMywl7vFhXCLbubCIHaYi6b9NfIPbsO9PnWZuChuIed3LWZsZJ_yB6Yun2AMtf0-Tf4lK671FqLad_0eDkbYQYOnx_8fhBipNsSzz5jyWZIx0lDROLPEfGugv1RP1UptWvtTehpkyPqBUHRYnKkf3AVhCwAZCQyOWPQJRVFi2fDAtgeTT6YR5ex4hZQLiXJ1ZrCMOexVwUGzzUbZn9JUiDwLkKHpj399UTu0oHw6FWweGlc5mgk2DvYV_Hcq9y5dvODsQURs4bvPTlb7h1PfoNqCEk-vx0FqPXGltA0BZ-vtusRFGTNfnjtrYHes2YOdYFsnG3qa_xH1EOHCuQngylOVO6fcIDCXys4cySKfATCd5-NKp_tBraa4ZwhjJbN1hcCGHxJEQr4rdgD5lUFJ5oxUUsuf7nukJicgd07tHsCB2cd8N5lut-ntG6Q7RiUJ_p-pTnBepTFeKYRuOGdk-Cx6hgGB9Jqin4yc3YVUsK5GXdssMZe_7cz7r4LmxplPSUUFILdfG9dKC6iSp5Hqz86LA_4EAwJ5uU6g7K2E5Qf8geHNEbbZzn1ebrcbYVKYiivTMhvTOUMBr4skGMCF46YNMQM8b-VAJnEh5JTEHWp9BT2fuU72ssbmESZJGlyORE-F7dLI8bZXWdfhzoA63XlReKsvyEOGbJ3I7EpDolvX2roN27FM6ibHFFgEJV_z-pFF_O_Car0Ov7aVlYBrn2EvxyortzefCUdy7DELUIdvx-qmay2RkWBs4tFEUz5flFanTdvg_kjB_0000)

![Use Case Diagram Simplified](https://www.plantuml.com/plantuml/png/PPBHJzim4CRV_LUSU04UGBIb1I9K4RMeaxPE4rdtYano60l7hco7gjhslo-sOoSPVVfwl---Epj-C9PgszG2SiqQyxmpkA86rvmoJUldWjTxWOIOToxtjAq0BQtIXJqA17f0eseSm3qjtod3W3MMbahcsYstRQ7D1XSENJfSXA5GeFv03LibUHlE9OFYQ2pMXAGCE0dMJvuJ-4sW_Pt2Ikb-Xl75ioTal7NfSw06Tgj9g7vJZCkkD0sblAh26j4w2_LV70yTC1sv_aHWZPPo4GtpO5YZG8lZr4L0AusqHRb0RU6f4TZXcpuwm1Xv6q1Ulajr45Wn3Bp3T_6qHecFCPfS3JBNrBozAAgh22S15YWhsABLl3GHJGVe2r9jNv2cqDa0VbUMl_AIMgvavF6EKFFN8ppMb8k8vcbNjF236dDG_JuByfUGKyZT8pCaspHeREROXcGxWzhh7SdogkRI_yb9DdWJEKCP6hOjy7Fz1-0b-kfZuU9zB9HAIYpTrePiuE9YwHP8QjhNvhrSk7QtoAXxbtgYcYLrdTGygKLIDqdT9dMNrEIgbnCtsHyRk7n3pQtnYv2yTVnfBPupbEE3RVCOC1tecJEFRcVKv3wWjuRhUa91FNZZUmTdS7cvXBCDIjJKOZVrAnxF8OFxUovBqLIuN18tDNWVFwXedDSzTlE_x-odveoXZW_NjVWTnZRoWB9gQl4F)

### Actor-Use Case Mapping

| Actor | Use Cases |
|-------|-----------|
| Guest | Register, Login, Verify Email, Reset Password |
| User | Login, Logout, Add Server, View Servers, View Server Details, Delete Server, Create Alert Rule, View Alerts, Acknowledge Alert, Resolve Alert, View Dashboard |
| Admin | All User use cases |
| Agent | Send Metrics |
| Email Service | Send Notification |

### Actor-Use Case Mapping

| Actor | Use Cases |
|-------|-----------|
| Guest | Register, Login, Verify Email, Reset Password |
| User | Login, Logout, Add Server, View Servers, View Server Details, Delete Server, Create Alert Rule, View Alerts, Acknowledge Alert, Resolve Alert, View Dashboard |
| Admin | All User use cases |
| Agent | Send Metrics |
| Email Service | Send Notification |

---

## Summary

| Category | Count |
|----------|-------|
| Primary Actors | 3 |
| Secondary Actors | 2 |
| Use Cases | 16 |
