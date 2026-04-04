# 🏋️ Boss Gym - Elite Management & Marketing Platform

A premium, full-stack React + Firebase application designed for high-end fitness centers. This platform provides a dual-purpose experience: a sophisticated **Public Marketing Website** for prospective members and a robust **Private Admin Dashboard** for gym operations.

---

## 🚀 Overview

Boss Gym is a modern solution developed to replace manual logbooks and fragmented spreadsheets. It offers a unified, real-time management platform built with a "Mobile-First" and "Elite" design philosophy.

### 🌐 Public Website
A high-conversion landing page and marketing suite featuring:
- **Dynamic Branding**: Gym name and contact details update globally from the admin settings.
- **Service Showcases**: Detailed pages for About Us, Services, Workout Plans, and a Gallery.
- **Member Access**: Secure login and registration for members to browse plans and view gym info.
- **Optimized UX**: Smooth navigation with automatic "Scroll to Top" and a fully responsive mobile menu.

### 📊 Admin Dashboard
A comprehensive management suite (restricted to authorized administrators):
- **Real-time Analytics**: Visual insights into total members, daily attendance, and occupancy using **Recharts**.
- **Member Management**: Create, edit, and track memberships with automatic expiry status (Active, Expiring Soon, Expired).
- **QR Attendance System**: Automated check-in/check-out via a dedicated kiosk-mode QR scanner.
- **Global Settings**: Real-time customization of gym branding, themes (Gold/Blue), and location coordinates.
- **Midnight Cleanup**: Automated background utility that closes "ghost" sessions left open by members.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React Icons](https://lucide.dev/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **QR Technology**: `html5-qrcode` (Scanning) & `qrcode.react` (Generation)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **Utilities**: `Tesseract.js` (OCR), `Compromise` (NLP), `WhatsApp Integration` (Alerts)

---

## 🔐 Security & Access Control

The platform implements **Role-Based Access Control (RBAC)**:
- **Super Admin**: Only the authorized email (`nsakthiveldev@gmail.com`) is granted full dashboard access.
- **Authorized Redirection**: Users are automatically routed based on their role—Admins to the Dashboard, regular users to the Website.
- **Route Protection**: All administrative pages are guarded by a specialized `ProtectedRoute` component to prevent unauthorized access.

---

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (Latest LTS)
- Firebase Project

### 2. Clone and Install
```bash
git clone <repository-url>
cd gym-app
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Development
```bash
npm run dev
```

---

## 📐 Project Structure

- `src/pages/`: Contains all route-level components (Website & Dashboard).
- `src/components/`: Reusable UI elements, including the `Layout` and `ProtectedRoute`.
- `src/context/`: State management for Authentication, Notifications, and Global Settings.
- `src/utils/`: Core business logic for cleanup, alert checking, and third-party integrations.
- `src/firebase/`: Firebase initialization and service configuration.

---
*Developed by **Lupus Venture***
