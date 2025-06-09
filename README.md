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

## Troubleshooting & Known Issues

### Duplicate contacts on create/sync
- There is a known issue where creating a contact from the app or from HubSpot may result in duplicate records in Pipedrive. This can cause sync issues until the duplicates are manually resolved.
- If you encounter this, delete the duplicate contacts in Pipedrive and re-sync.
- We are actively working on a more robust deduplication and sync strategy.

### Contacts not syncing or ghost contacts?
- Make sure you have set up the Integration.app console with both CRMs and all 4 actions for each.
- Ensure your MongoDB Atlas cluster allows access from Vercel (add `0.0.0.0/0` to IP Access List for testing).
- If you see contacts re-appearing after deletion, check that deletions are being propagated to all systems and that your sync logic is not re-creating deleted contacts from CRM data.
- Check Vercel function logs for errors in `/api/contacts` or `/api/sync`.
- If you need to reset your data, you can clear your MongoDB collection and re-sync.

### More help
- See the [Integration.app docs](http://console.integration.app/docs) for details on configuring apps and actions.
- For issues, open an issue on GitHub or contact the maintainer.

---

**This repo is ready for local development and Vercel deployment.**