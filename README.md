# Boss Gym Management System

A premium React + Firebase application for gym management, featuring attendance tracking, QR-based scanning, and membership management.

## Our Client

**Lupus Venture** is the technical developer and service provider for **Boss Gym**, a high-end fitness center looking to modernize its operations. Boss Gym needed a digital solution to replace manual logbooks and fragmented spreadsheets with a unified, real-time management platform.

## Goals

Boss Gym's primary goals were to:
- **Streamline Attendance**: Transition to a fully automated QR-based check-in and check-out system.
- **Member Retention**: Provide a seamless experience for members while maintaining clear visibility into membership expiries.
- **Operational Efficiency**: Automate daily maintenance tasks and provide real-time dashboard analytics on gym occupancy and membership stats.
- **Reliability & Scalability**: Ensure 99.9% uptime and zero data loss with real-time synchronization via Firebase.

## Challenges & Solutions

### 1. The "Forget to Exit" Challenge
**The Problem**: Many members would check in via the QR scanner but forget to scan out when leaving. This resulted in "ghost" sessions that inflated occupancy stats and made it impossible to track average workout durations accurately.
**Our Solution**: We implemented a **Midnight Cleanup Utility** (`src/utils/cleanup.js`). This automated background process identifies any sessions still marked as "open" at the end of the day and gracefully closes them, marking them with a "no-exit" status for admin review.

### 2. Robust QR-Based Entry/Exit
**The Problem**: Early versions of the scanner struggled with varying lighting conditions and tablet-based hardware limitations, leading to frustration during peak gym hours.
**Our Solution**: We built a dedicated, kiosk-mode **QR Scanner Page** (`src/pages/QRPage.jsx`) using `html5-qrcode`. This optimized the scanning engine for tablet-mounted cameras and implemented a multi-stage check-in flow that provides instant visual and audio feedback to the member.

### 3. Membership Expiry Monitoring
**The Problem**: Manually tracking hundreds of memberships with varying durations (1, 3, 6, 12 months) was prone to error, leading to missed revenue and awkward member interactions.
**Our Solution**: We developed a specialized **Alert Checker** (`src/utils/alertChecker.js`) that runs every time the dashboard is loaded. It automatically categorizes memberships into "active," "expiring soon," and "expired," providing the admin with actionable notifications at a glance.

---

## Tech Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **Backend**: Firebase Authentication & Cloud Firestore
- **Utilities**: `html5-qrcode` (Scanning), `recharts` (Analytics), `tesseract.js` (OCR)

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_id
VITE_FIREBASE_APP_ID=your_id
```

### 3. Run locally
```bash
npm run dev
```

---
*Developed by Lupus Venture*
