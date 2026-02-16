# Design Document: Admin-Only Access Control

## Overview

This feature implements role-based authorization to restrict access to medical records and billing pages to users with the admin role. The design builds upon the existing authentication infrastructure and role-based access control foundation established in the patient-portal-auth feature.

The implementation follows a defense-in-depth approach with three layers:
1. Frontend guards that prevent unauthorized navigation
2. Backend middleware that enforces role requirements on API endpoints
3. Comprehensive audit logging of all access attempts

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  medical-records.html  │  billing.html  │  dashboard.html   │
│  ┌──────────────────┐  │  ┌──────────┐  │  ┌────────────┐  │
│  │ Role Check Guard │  │  │Role Check│  │  │ Navigation │  │
│  │ - Verify token   │  │  │  Guard   │  │  │  Builder   │  │
│  │ - Check role     │  │  │          │  │  │            │  │
│  │ - Redirect if ❌ │  │  │          │  │  │            │  │
│  └──────────────────┘  │  └──────────┘  │  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend Layer                         │
├─────────────────────────────────────────────────────────────┤
│                    Express Middleware                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Auth Check   │→ │ Role Requirement │→ │   Route      │  │
│  │ (existing)   │  │   Middleware     │  │  Handler     │  │
│  │              │  │   (new)          │  │              │  │
│  └──────────────┘  └──────────────────┘  └──────────────┘  │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │  Audit Service   │                     │
│                    │  - Log attempts  │                     │
│                    └──────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Users Table    │  Permissions Table  │  Audit Events Table │
│  - id           │  - role             │  - event_type       │
│  - role         │  - action           │  - user_