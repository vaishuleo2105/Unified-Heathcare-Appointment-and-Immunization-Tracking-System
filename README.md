# Unified Healthcare Appointment, Immunization & Emergency Tracking System (UHAITS)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stack: MERN](https://img.shields.io/badge/Stack-MongoDB%20%7C%20Express%20%7C%20React%20%7C%20Node-blue)](https://reactjs.org/)
[![UI: TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS%20Organic%20Modernism-teal)](https://tailwindcss.com/)
[![Language: i18n](https://img.shields.io/badge/i18n-EN%20%7C%20HI%20%7C%20TA%20%7C%20TE%20%7C%20KN%20%7C%20ML-orange)](#multilingual-support-i18n)

A comprehensive, full-stack healthcare platform designed to streamline patient appointment booking, doctor slot management, child immunization tracking, maternal healthcare (ANC checkups), emergency inter-hospital referrals, and unified electronic health record (EHR) export across healthcare facilities.

---

## 🏛️ System Architecture Overview

The system follows a **3-Tier Model-View-Controller (MVC)** design pattern, integrating frontend single-page applications, RESTful microservices, and document-based data management.

### Architecture Layers

1. **Presentation Layer (View)**
   - Built with **React.js (Vite)** and styled using **TailwindCSS** following Organic Modernist design principles.
   - Multilingual support (**i18n**) across 6 languages: English, Hindi, Tamil, Telugu, Kannada, and Malayalam.
   - Role-Based Dashboards for **Patients**, **Doctors**, **Healthcare Staff / ASHA Workers**, and **System Administrators**.

2. **Application / API Layer (Controller)**
   - **Node.js** and **Express.js** RESTful web services managing request routing, authentication middleware, slot allocation algorithms, emergency transfer dispatch, and background notifications (`node-cron` & Nodemailer).

3. **Machine Learning Microservice Layer**
   - Python microservice executing pre-trained **Gradient Boosting Classifier** models for triage assessment, high-risk pregnancy flagging, and doctor workload risk scoring.

4. **Data Layer (Model)**
   - **MongoDB Atlas** with **Mongoose ODM**, maintaining document collections for Users, Hospitals, Appointments, Time Slots, Maternal Records, Immunizations, Emergency Transfers, and Security Audit Logs.

5. **Integration & Security Layer**
   - **ABHA Sandbox API** integration for digital health ID verification.
   - **JWT (JSON Web Tokens)** authentication with **bcryptjs** password hashing.
   - Strict **Role-Based Access Control (RBAC)** middleware and **Audit Logging** (`AuditLog` collection) for security auditing.

6. **Visualization & Reporting Layer**
   - Interactive clinical dashboards, doctor workload risk meters, vaccination schedule timelines, and downloadable **EHR PDF Health Reports**.

---

## 🔄 Architecture Flow

$$\text{React.js Web Interface (SPA)} \longrightarrow \text{Axios REST API Requests (JWT Auth Header)}$$
$$\downarrow$$
$$\text{Express.js Controllers \& Security Middleware (Auth / RBAC)}$$
$$\downarrow$$
$$\text{Python ML Risk Microservice / Mongoose ODM Engine}$$
$$\downarrow$$
$$\text{MongoDB Database Collections / External Services (Nodemailer \& PDF Export)}$$
$$\downarrow$$
$$\text{React UI Dashboards \& Interactive Clinical Visualizations}$$

> **Summary Flow:** User Actions / React.js Web UI $\rightarrow$ Axios HTTPS REST API Calls (JWT Header) $\rightarrow$ Express.js Controllers & Security Middlewares (JWT & RBAC Validation) $\rightarrow$ Python ML Microservice / Mongoose ODM Data Access $\rightarrow$ MongoDB Atlas Collections & External Services (Nodemailer Email Alerts & PDF Export) $\rightarrow$ Real-Time React UI Dashboards & Clinical Visualizations.

---

## 🖼️ System Architecture Diagram

The system architecture diagram is available in the repository root formatted specifically for A4 documentation and presentations:

- 📄 **[diagram_architecture_clean_a4.png](./diagram_architecture_clean_a4.png)** - High-contrast, large-font A4 printable diagram (300 DPI).
- 📄 **[diagram_architecture_a4_cropped.png](./diagram_architecture_a4_cropped.png)** - Cropped high-resolution PNG for direct insertion into MS Word / LaTeX.

---

## ✨ Key Features & Modules

### 1. 🔑 Auth & ABHA ID Portal
- Login, Registration, and ABHA (Ayushman Bharat Health Account) Digital ID verification.
- Secure JWT token issuing and role-based route protection.

### 2. 📅 Appointments & Slot Booking Engine
- Patient self-booking with doctor specialization filtering.
- Dynamic time-slot creation for doctors and real-time status management (Pending, Approved, Completed, Cancelled).

### 3. 💉 Immunization & Vaccination Tracker
- Automated calculation of due dates for child vaccines based on birth records.
- Status tracking (`Due` vs `Completed`) with batch number logging.

### 4. 🤰 Maternal & Child Healthcare (ANC)
- Antenatal checkup tracking across trimesters.
- High-risk pregnancy detection algorithms flagging critical vitals for ASHA workers and doctors.

### 5. 🚑 Emergency Transfer & Inter-Hospital Referral
- Immediate dispatch of patient medical history snapshot to receiving hospital in critical care / emergency transfers.
- Shared data category selection (blood group, vitals, allergies, current medications, maternal records).

### 6. 🛡️ Security Audit Logging
- Automated `AuditLog` generation tracking every inter-hospital transfer, record viewing, and PDF export event with IP address and timestamp.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **npm** or **yarn**
- **MongoDB** instance (local or MongoDB Atlas connection string)

### Installation & Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/vaishuleo2105/Unified-Heathcare-Appointment-and-Immunization-Tracking-System.git
   cd Unified-Heathcare-Appointment-and-Immunization-Tracking-System
   ```

2. **Server Setup:**
   ```bash
   cd server
   npm install
   ```
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/uhaits
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   ```
   Start the backend server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

3. **Client Setup:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 👥 Project Team

- **Induja E** – 25MX315
- **Vaishali S** – 25MX355

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).