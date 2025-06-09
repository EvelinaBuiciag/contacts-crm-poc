# Integration.app Solution Engineer Test Assignment

## Task Overview

This repository contains a contact management app that lets users add, edit and delete contacts. It connects to other systems using the Integration.app SDK. The task is to add two-way contact syncing between this app and connected CRM systems, so that contacts stay up to date everywhere.

---

## Local Development

### 1. Clone the repository
```bash
git clone https://github.com/EvelinaBuiciag/contacts-crm-poc.git
cd contacts-crm-poc
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=your_mongodb_connection_string
DEV_CUSTOMER_ID=your_dev_customer_id
INTEGRATION_APP_WORKSPACE_KEY=your_integration_app_workspace_key
INTEGRATION_APP_WORKSPACE_SECRET=your_integration_app_workspace_secret
```

### 4. Run the development server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to use the app locally.

---

## Deploying to Netlify

### 1. Connect your GitHub repo to Netlify
- Go to [Netlify](https://app.netlify.com/) and create a new site from GitHub.

### 2. Set environment variables in Netlify
- Go to **Site settings > Environment variables** and add:
  - `MONGODB_URI`
  - `DEV_CUSTOMER_ID`
  - `INTEGRATION_APP_WORKSPACE_KEY`
  - `INTEGRATION_APP_WORKSPACE_SECRET`

### 3. Netlify Build Settings
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** `18.17.0` (set in package.json and Netlify UI)
- The `@netlify/plugin-nextjs` plugin is enabled in `netlify.toml`.

### 4. Deploy
- Push to `main` branch or use the **Trigger deploy** button in Netlify.
- Your app will be live at your Netlify site URL.

---

## Troubleshooting
- **404 Page Not Found:**
  - Make sure you have a valid `/src/app/page.tsx` (for App Router) or `/pages/index.js` (for Pages Router).
  - Let the Netlify Next.js plugin handle routing (do not override with custom redirects).
- **Build Fails:**
  - Check that all environment variables are set in Netlify.
  - Ensure your Node version matches (`18.17.0`).
  - Review build logs for missing dependencies or errors.
- **API/DB Issues:**
  - Make sure your MongoDB URI is correct and accessible from Netlify.

---

## Implementation Requirements

- Integrates with at least two CRM systems (HubSpot and Pipedrive)
- Uses the Integration.app React SDK
- Robust bi-directional sync logic

---

## Questions and Support
Feel free to:
- Ask questions about the requirements
- Discuss implementation approaches
- Request clarification on any aspect
- Share your progress and get feedback

---

**You can use this repo for both local development and Netlify deployment.**

## Evaluation Criteria

We'll evaluate your solution based on:
1. **Integration Logic**
   - Clean and maintainable code structure
   - Proper error handling
   - Robust bi-directional sync logic
2. **Code Quality**
3. **User Experience**


## Submission Requirements

1. Source code repository
2. Live demo URL (e.g., Vercel deployment)
3. Brief documentation of your implementation approach and any assumptions or decisions made during development