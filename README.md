# Boss Gym - Management System

A premium React + Firebase application for gym management, featuring attendance tracking, QR-based scanning, and membership management.

## Features

- **Dashboard**: Real-time stats on attendance, inside members, and membership expiries.
- **QR Scanner**: Dedicated kiosk-mode scanner for tablet-based entry/exit verification.
- **Member Management**: Detailed profiles, visit history, and QR code generation.
- **Membership Plans**: Custom durations and pricing for flexible gym business models.
- **Staff/Admin Access**: Secure roles for managing the gym's daily operations.
- **Persistence**: Built-in offline support for fast, responsive usage.

## Tech Stack

- **Frontend**: React.js with Vite
- **Styling**: Vanilla CSS with Lucide Icons
- **Backend**: Firebase Authentication & Cloud Firestore

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

## Maintenance

- **Midnight Cleanup**: The app includes an automatic cleanup utility to flag sessions where members forgot to check out at the end of the day.
