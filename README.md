# 📦 SHOPBOX

High-performance, static e-commerce platform powered by Google Sheets.

## Overview
Shopbox is a lightweight, SOTA static commerce solution that synchronizes directly with a Google Spreadsheet. It features a glassmorphic UI, dynamic product routing, and a secure Stripe checkout integration.

## Features
- **Headless CMS**: Google Sheets acts as your database.
- **Dynamic Routing**: Automatic internal routing for product detail pages.
- **Stripe Integration**: Secure checkout processing (PHP required for session signing).
- **Responsive UI**: Hand-crafted CSS with modern aesthetics and dark mode support.
- **Instant Sync**: Real-time data fetching with smart caching failover.

## Installation & Deployment

### 1. Database Setup
1. Open a Google Sheet and define your columns (e.g., `ID`, `Name`, `Price`, `Variations`).
2. Open `Extensions > Apps Script`.
3. Copy the contents of `GOOGLE_CONNECTOR.gs` into the editor.
4. Deploy as a **Web App** with access set to **Anyone**.
5. Copy the generated **Web App URL**.

### 2. Frontend Configuration
1. Open `script.js` and `feed.php`.
2. In **both files**, replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with your deployed Apps Script URL.
3. Open `checkout.php` and replace `YOUR_STRIPE_SECRET_KEY` with your actual Stripe Secret Key.

#### 3. Rich Text Editing
Shopbox includes a professional WYSIWYG editor for product descriptions:
1. Select a cell in your `Description` or `Long Description` column.
2. Go to `📦 Shopbox Tools > Open Rich Text Editor`.
3. Format your text in the sidebar and click **Save to Cell**.
4. The shop will automatically render this rich formatting in the product modals.

## 4. Deployment
Upload the contents of this folder to any static host (Vercel, Netlify, Apache, etc.). Ensure your host supports PHP if you intend to use the Stripe checkout feature.

## License
MIT License - Developed by Shopbox Engineering.
