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

## Support
- For issues, open an issue on GitHub or contact the maintainer.
- For Integration.app SDK help, see [Integration.app docs](https://docs.integration.app/).

---

**This repo is ready for local development and Vercel deployment.**