# Deployment Guide - Pani Puri Billing System

Since your application uses a local file-based database (SQLite), the simplest way to "deploy" it for your business use is to run it on your main laptop/PC and access it from your mobile devices over Wi-Fi.

## Option 1: Local Network "Deployment" (Recommended for now)

This allows you to act as the "Server" and drivers to access the app on their phones while connected to the same Wi-Fi or Hotspot.

### 1. Build the Application
We have already done this step. If you make changes later, run:
```powershell
npm run build
```

### 2. Start the Production Server
Run this command to start the optimized version of your app:
```powershell
npm run start
```
The app will start on `localhost:3000`.

### 3. Access from Mobile (Driver's Phone)
1.  Make sure your Laptop and the Driver's Phone are connected to the **SAME Wi-Fi network**.
2.  Find your Laptop's IP Address:
    *   Open a new terminal/command prompt.
    *   Type `ipconfig` and press Enter.
    *   Look for **IPv4 Address** (e.g., `192.168.1.5` or `192.168.0.101`).
3.  Open Chrome on the Driver's phone.
4.  Type `http://<YOUR_IP_ADDRESS>:3000`.
    *   Example: `http://192.168.1.5:3000`

## Option 2: Cloud VPS (Advanced)
If you want to access the app from anywhere (4G/5G data), you need a Virtual Private Server (VPS) like DigitalOcean, Linode, or AWS Lightsail.

1.  Rent a small Ubuntu Server (~$5/month).
2.  Copy your code to the server.
3.  Install Node.js.
4.  Run `npm install`, `npm run build`, `npm run start`.
5.  Use a tool like `pm2` to keep it running forever.

**Note:** Standard free hosting like Vercel/Netlify **will NOT work** with your current `better-sqlite3` database setup because they don't support persistent local files.

## Maintenance
*   **Database:** Your data is stored in `sqlite.db`. **Back up this file regularly!**
*   **updates:** If you change code, stop the server (`Ctrl + C`), rebuild (`npm run build`), and restart (`npm run start`).
