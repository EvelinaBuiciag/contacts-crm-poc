# Contacts CRM POC

A modern contact management app with real-time two-way sync to HubSpot and Pipedrive CRMs, built with Next.js (App Router), TypeScript, Tailwind CSS, and the Integration.app SDK.

---

## Features
- Add, edit, and delete contacts
- Bi-directional sync with HubSpot and Pipedrive
- Modern UI with React, Tailwind, and Radix UI
- Works locally and on Vercel (recommended)

---

## Getting Started (Local Development)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EvelinaBuiciag/contacts-crm-poc.git
   cd contacts-crm-poc
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Create a `.env` file** in the root directory with the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   DEV_CUSTOMER_ID=your_dev_customer_id
   INTEGRATION_APP_WORKSPACE_KEY=your_integration_app_workspace_key
   INTEGRATION_APP_WORKSPACE_SECRET=your_integration_app_workspace_secret
   ```
4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000)

---

## Integration.app Console Setup

1. **Go to your [Integration.app Console](https://console.integration.app/)**
2. **Add Apps:**
   - Add both **Pipedrive** and **HubSpot** as external apps to your workspace.
   - Make sure both apps are connected and show a green status.
3. **Define Actions for Each CRM:**
   - For both Pipedrive and HubSpot, define the following actions:
     - `list-contacts`
     - `create-contact`
     - `update-contact`
     - `delete-contact`
   - These actions should be configured as described in the [Integration.app docs](http://console.integration.app/docs).
4. **Get your workspace key and secret** from the Integration.app console and use them in your `.env` and Vercel environment variables.

---

## Deploying to Vercel (Recommended)

1. **Import your repo** at [vercel.com/import](https://vercel.com/import) and connect your GitHub account.
2. **Set the environment variables** in the Vercel dashboard:
   - `MONGODB_URI`
   - `DEV_CUSTOMER_ID`
   - `INTEGRATION_APP_WORKSPACE_KEY`
   - `INTEGRATION_APP_WORKSPACE_SECRET`
3. **Deploy!** Vercel will auto-detect Next.js and handle everything for you.

**Your app will be live at your Vercel project URL.**

---

## Environment Variables
- `MONGODB_URI` — Your MongoDB connection string
- `DEV_CUSTOMER_ID` — Your dev customer ID
- `INTEGRATION_APP_WORKSPACE_KEY` — Integration.app workspace key
- `INTEGRATION_APP_WORKSPACE_SECRET` — Integration.app workspace secret

---

## Troubleshooting

- **Deleting contacts:**
  - To ensure proper sync, always delete contacts from the application. Deleting a contact from one of the CRMs (HubSpot or Pipedrive) will not propagate the deletion, and the contact will be re-created on the next sync. The application is the source of truth for deletions.
- **Contacts not syncing:**
  - Make sure you have set up the Integration.app console with both CRMs and all 4 actions for each.
  - Ensure your MongoDB Atlas cluster allows access from Vercel (add `0.0.0.0/0` to IP Access List for testing).
  - Check Vercel function logs for errors in `/api/contacts` or `/api/sync`.
  - If you need to reset your data, you can clear your MongoDB collection and re-sync.
- **Sync timing and update delays:**
  - Due to limitations in CRM APIs and the sync approach, even after waiting, updates or deletions may not always be reflected correctly in all systems. There is a risk of duplicates or multiple contacts, especially in Pipedrive, if changes are made in quick succession or if the CRMs are slow to update. This is a limitation of the current sync logic and external CRM APIs, not just a timing issue.

- **More help:**
  - See the [Integration.app docs](http://console.integration.app/docs) for details on configuring apps and actions.
  - For issues, open an issue on GitHub or contact the maintainer.

---

## Known Issues & Limitations

- **Duplicates and Missed Updates/Deletes:**
  - There is a risk of duplicate contacts or missed updates/deletes, especially in Pipedrive, even after waiting for sync cycles. This can occur if:
    - A contact is updated or deleted in the app, but the CRM is slow to reflect the change, so the sync re-imports or duplicates the contact.
    - Multiple changes are made in quick succession across systems, and the sync picks up stale or inconsistent data from the CRMs.
  - **Root Causes:**
    - Eventual consistency and propagation delays in CRM APIs (HubSpot, Pipedrive).
    - Lack of atomic, cross-system transactions—each system is updated independently.
    - No global locking or versioning across all systems.
  - **Example Scenario:**
    - You delete/update a contact in the app, but Pipedrive/Hubspot is slow to process the deletion. The next sync cycle sees the contact still in Pipedrive/Hubspot and re-imports it, creating a duplicate or "ghost" contact.
  - **Workarounds:**
    - Always use the app for destructive actions (deletes/updates) and avoid making rapid changes in multiple systems.
    - If duplicates occur, manually clean up in the CRMs and re-sync.
    - For critical use cases, consider implementing a more advanced sync protocol with versioning or conflict resolution.

---

**This repo is ready for local development and Vercel deployment.**