# Contacts CRM POC – Architecture & Integration Documentation

## Overview
This document details the technical approach, architecture, and key decisions behind the Contacts CRM POC, which provides bi-directional sync between a custom app, HubSpot, and Pipedrive using Integration.app.

---

## 1. Integration Journey & Developer Notes

### Initial Setup & First Bottleneck – Auth Debugging
- Added Pipedrive and HubSpot as external CRMs and tested all actions individually.
- Attempted to register the app as an external app and build a connector.
- **Blocker:** JWT Bearer token auth was problematic; reverted to using a static x-auth-id header for testing.
- Used:
  ```env
  DEV_CUSTOMER_ID=f4ec5e01-b864-43e7-a461-bab1ec2dace2
  ```
  ```ts
  export function getAuthFromRequest(req) {
    return { customerId: process.env.DEV_CUSTOMER_ID }
  }
  ```

### Documentation Gaps & Swagger Fallback
- Integration.app docs only covered List operation; no guidance for create, update, or delete.
- Attempted to use Swagger spec and ngrok to expose local server, but connector did not work due to unclear payloads and missing validations.

### Scenario-Based Flow (Abandoned)
- Tried scenario builder in the console, but it generated duplicate collections/fields and incomplete mappings, leading to errors and a cluttered workspace.

### Final Working POC (Current Strategy)
- **Used only the CRM actions** (list, create, update, delete) for both HubSpot and Pipedrive.
- **No flows or scenarios.**
- Built a robust sync engine in the app backend to coordinate all systems.

---

## 2. Architecture Diagram

```mermaid
flowchart TD
    subgraph App
      A[App DB (MongoDB)]
      B[App API]
    end
    subgraph IntegrationApp
      C[Integration.app SDK]
      D[HubSpot Action]
      E[Pipedrive Action]
    end
    A <--> B
    B <--> C
    C <--> D
    C <--> E
    D -.sync.-> E
    E -.sync.-> D
```

---

## 3. Key Decisions & Rationale
- **Actions-Only Approach:**
  - Flows/scenarios in Integration.app were unstable and poorly documented.
  - Actions (list, create, update, delete) are well-supported and predictable.
- **Soft Delete:**
  - Contacts are marked as `deleted: true` in MongoDB, never hard-deleted, to prevent "ghost" contacts from reappearing after sync.
- **Email as Primary Key:**
  - All matching and deduplication is done by email (case-insensitive) for reliability across systems.
- **App as Source of Truth for Deletions:**
  - Deletions must be performed from the app. Deleting in a CRM will not propagate, as the app will re-create the contact on sync.
- **Error Handling:**
  - All critical errors are logged; non-critical debug logs are removed for production.

---

## 4. Sync Logic
- **On Create:**
  - Check for existing contact by email in all systems before creating.
  - If found, update instead of creating a duplicate.
- **On Update:**
  - Update in all systems, matching by email.
- **On Delete:**
  - Mark as deleted in MongoDB and propagate deletion to both CRMs.
  - Never re-create a contact that is marked as deleted locally, even if it exists in a CRM.
- **On Sync:**
  - Always merge/update by email.
  - Never create a new local contact if one with the same email is marked as deleted.

---

## 5. Lessons Learned & Recommendations
- **Integration.app is powerful but the Connector Builder -> Data Collections -> Operations  are under-documented for anything beyond List actions.**
- **Actions are the most reliable integration point.**
- **Flows/scenarios are not production-ready for complex sync (scenarios create data sources, field mappings etc. before finishing the scenario, which leads to duplicates).**
- **Soft delete is essential for robust sync in multi-system environments.**
- **Always use a unique, immutable field (email) for cross-system matching.**
- **Keep the app as the source of truth for destructive operations (deletes).**

---

## 6. How to Extend or Maintain
- To add more CRMs, define the same 4 actions and extend the sync logic.
- To support hard deletes, add a purge endpoint to remove `deleted: true` contacts.
- To improve deduplication, consider supporting secondary keys (e.g., phone number).

---

**For more details, see the codebase and the Integration.app [docs](http://console.integration.app/docs).** 