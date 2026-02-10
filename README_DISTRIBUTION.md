# 🚀 FLUX - Deployment and Configuration Guide

This shop is 100% static and self-contained within the `/static` folder. You can host it on any web server (Apache, Nginx, Vercel, Netlify, etc.).

## 1. Google Sheets Setup (The Database)
The shop uses Google Sheets as its backend. To configure it:

1.  **Create your Google Sheet** with any columns you want. 
    *Recommended headers:* `ID`, `Name`, `Description`, `Short Description`, `Long Description`, `Price`, `Image URL`, `Category`, `Variations`, `Variation Prices`.
2.  **Open Apps Script**: In your Sheet, go to `Extensions` > `Apps Script`.
3.  **Install Connector**: Open `GOOGLE_CONNECTOR.gs` from this folder, copy all code, and paste it into the Apps Script editor.
4.  **Save & Deploy**:
    *   Click the **Save** icon.
    *   Click **Deploy** > **New Deployment**.
    *   Select **Web App**.
    *   Change "Who has access" to **Anyone**.
    *   Click **Deploy** and copy the **Web App URL**.

## 2. Connect the Shop
1.  Open `static/script.js` in your code editor.
2.  Find the line: `const GOOGLE_URL = '...';`
3.  Replace the URL with your copied **Web App URL**.

## 3. Product Images
You have two ways to add images:
- **Direct Links**: Paste any image URL (Unsplash, Imgur, etc.) into the `Image URL` column.
- **Magic Upload**: Use the new **🚀 Shop Tools** menu that appears in your Google Sheet after installing the script. Select a cell in the Image column, click the menu, and upload a file from your computer. It will automatically host it on Google Drive and link it to your shop.

## 4. Payment Setup
Checkout logic is located in `static/checkout.php`. 
- Open the file and replace the `sk_test_...` key with your **Stripe Secret Key**.
- Note: This requires a PHP server to process the secure payment session.

---
Built for speed. Designed for luxury. **FLUX.**
