# SIH26095: Smart Real-Time Monitoring & Inspection Platform

### Ministry of Social Justice and Empowerment (MoSJE) / Department of Social Justice and Empowerment (DoSJE)
**Problem Statement ID**: `SIH26095`  
**Category**: Software / Smart Automation  
**Branch**: `frontend-redesign` (Modern Next.js App Router + Native Android Client)  
**Target Schemes**:
- **AVYAY**: Atal Vayo Abhyuday Yojana (Senior Citizen Homes & Day Care)
- **NAPDDR**: National Action Plan for Drug Demand Reduction (Integrated Rehabilitation Centres for Addicts - IRCAs)
- **PM-AJAY**: Pradhan Mantri Anusuchit Jaati Abhyuday Yojana (SC/OBC Hostels & Residential Schools)
- **SMILE**: Support for Marginalized Individuals (Garima Greh Transgender Shelter Homes & Livelihood Units)
- **DIVYANG**: Assistance to Disabled Persons (Composite Regional Rehabilitation Centers)

---

## 🏗️ Architecture & Implemented Tech Stack

| Layer | Technology | Implementation Highlights |
| :--- | :--- | :--- |
| **Web Portal & Fullstack API** | **Next.js 14 (App Router), TypeScript, Tailwind CSS** | • Modern App Router architecture in `Web/src/app`<br>• Interactive National GIS Geofence Map with Leaflet & CartoDB tiles<br>• Central CCTV Surveillance Wall with facility menu & ONVIF PTZ (`/cctv`)<br>• Unannounced WebRTC Video Conference with AI Face Tracking (`/vc`)<br>• Real-time Drag-and-Drop Dynamic Form Builder (`/form-builder`)<br>• Working Android Handheld Station with live Form Builder sync (`/android`)<br>• Central Admin Console database explorer & raw JSON inspector (`/admin`)<br>• Facilities (`/facilities`) and Officers (`/officers`) directories<br>• Full Dark Mode support with system preference persistence |
| **Mobile App (Native)** | **Android (Kotlin), CameraX, PostGIS Client** | • Native production Android client in `android/app/`<br>• Real-time GPS Geofencing perimeter validator (150m radius)<br>• Hardware Camera capture with tamper-evident GPS/Timestamp/SHA-256 HUD overlay<br>• Gallery upload disabled per DoSJE Anti-Spoofing Rule 4.2<br>• Dual digital signature capture (Inspector + NGO In-Charge)<br>• AES-256-GCM encrypted offline package queue with auto-sync<br>• Ready-to-install debug APK in `Web/public/downloads/mosje-inspection.apk` |
| **Microservice Runner** | **Python 3.9+ REST Service** | • Zero-config unified prototype runner in `run_prototype.py`<br>• Real-time spatial queries, AES-256 ciphering, and video signaling |
| **Database** | **PostgreSQL + PostGIS** | • Spatial schema in `database/postgis_schema.sql`<br>• `GIST` spatial indices on facility GPS geometries<br>• `ST_DWithin` geofence verification stored procedure<br>• 12+ real-world DoSJE facilities seeded in `database/seed_dosje_data.sql`<br>• Automated SQLite/Haversine fallback in `database/db_adapter.py` |
| **Video / VC** | **ONVIF, RTSP, WebRTC** | • **ONVIF**: Camera discovery & Profile S/G PTZ controls (`video_engine/onvif_ptz_service.py`)<br>• **RTSP**: Live stream gateway, heartbeat check, frame extractor (`video_engine/rtsp_stream_gateway.py`)<br>• **WebRTC**: Real-time two-way signaling server & random spot-check room coordinator (`video_engine/webrtc_signaling.py`) |
| **AI / ML** | **Python, TensorFlow / TFLite** | • **Headcount & Attendance**: Model detecting individuals and flagging ghost beneficiary discrepancies (`ai_ml/headcount_detector.py`)<br>• **Beneficiary Privacy Masking**: Automated face-blurring engine under DPDP Act 2023 (`ai_ml/privacy_masker.py`)<br>• **Anti-Spoofing & Tamper Detection**: Velocity anomaly detection, duplicate image hashes (`ai_ml/anomaly_detector.py`)<br>• **Automated Random Dispatch**: Risk-weighted surprise inspection algorithm (`ai_ml/random_dispatch_ai.py`) |
| **Cloud** | **AWS / NIC GovCloud (MeghRaj)** | • Infrastructure-as-Code Terraform templates (`cloud/nic_govcloud.tf`)<br>• Kubernetes production manifests (`cloud/k8s/nic-deployment.yaml`)<br>• Multi-container Docker Compose (`docker-compose.yml`) |
| **Security** | **OAuth2, AES-256, RBAC** | • **OAuth2 + JWT + PKCE**: Token issuance, refresh, and claims verification (`security/oauth2_provider.py`)<br>• **AES-256-GCM**: Cryptographic encryption of field inspection packages & evidence (`security/aes256_cipher.py`)<br>• **5-Tier RBAC**: `NATIONAL_ADMIN`, `STATE_OFFICER`, `DISTRICT_INSPECTOR`, `SURPRISE_AUDITOR`, `FACILITY_HEAD` (`security/rbac_permissions.py`) |

---

## 📁 Codebase Directory Structure

```
SIH/
├── Web/                            # Modern Next.js 14 App Router Web Platform
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── public/
│   │   └── downloads/
│   │       └── mosje-inspection.apk # Ready-to-test Native Android APK (7.5 MB)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx          # Root layout with ThemeProvider & persistent Sidebar
│       │   ├── page.tsx            # Dashboard with GIS Map & Random/Risk Dispatch
│       │   ├── android/page.tsx    # Working Android Handheld Station (live Form sync)
│       │   ├── form-builder/page.tsx # Drag-and-drop Dynamic Form Builder
│       │   ├── facilities/page.tsx # Registered Institutions Directory
│       │   ├── officers/page.tsx   # Vigilance Officers Directory
│       │   └── admin/page.tsx      # Central Admin Console & Database Explorer
│       ├── components/
│       │   ├── Sidebar.tsx         # Responsive Sidebar navigation with Dark Mode toggle
│       │   ├── Header.tsx          # Ministry Topbar with live status indicators
│       │   ├── dashboard/
│       │   │   └── GisMap.tsx      # Leaflet GIS National Geofence & Facility Map
│       │   └── form-builder/
│       │       ├── QuestionCard.tsx # Editable criteria, weights & Dark Mode UI
│       │       └── MobilePreview.tsx # Synchronized real-time phone simulator
│       ├── context/
│       │   └── ThemeContext.tsx    # Persistent Light / Dark Mode context
│       ├── data/
│       │   ├── facilities_seed.json # 52 registered institutions across schemes
│       │   └── officers_seed.json   # 52 field inspectors and surveillance cadre
│       ├── lib/
│       │   ├── checklistStore.ts   # Active checklist state & event emitter
│       │   ├── dispatchStore.ts    # Dispatch state & surprise audit broadcaster
│       │   └── utils.ts            # Styling helper utilities
│       └── types/
│           └── index.ts            # TypeScript definitions (Checklist, Facility, Officer)
├── android/                        # Native Android Kotlin Application
│   ├── gradlew, gradlew.bat
│   ├── build.gradle, settings.gradle
│   └── app/
│       ├── build.gradle
│       └── src/main/
│           ├── AndroidManifest.xml
│           ├── java/gov/mosje/sih26095/
│           │   ├── DoSJEApplication.kt
│           │   ├── ui/
│           │   │   ├── login/LoginActivity.kt       # SSO login with officer facility lock
│           │   │   └── audit/AuditActivity.kt       # 5-point rubrics, GPS check, sign
│           │   ├── camera/
│           │   │   ├── NativeCameraCaptureActivity.kt # CameraX direct capture
│           │   │   └── CameraWatermarkProcessor.kt    # Tamper-evident GPS HUD
│           │   ├── security/
│           │   │   ├── AesCipherUtil.kt             # AES-256 encrypted payload
│           │   │   └── HashUtil.kt                  # SHA-256 digital seals
│           │   └── util/
│           │       ├── GeofenceCalculator.kt        # PostGIS 150m perimeter verification
│           │       └── LocationHelper.kt            # GPS hardware location provider
│           └── res/layout/                          # Native Android XML layouts
├── Web/                            # Next.js 14 Fullstack App Router (Port 3000)
│   ├── src/app/
│   │   ├── page.tsx                # National GIS Map & Command Dashboard
│   │   ├── cctv/page.tsx           # Multi-Feed CCTV Surveillance Wall & PTZ
│   │   ├── vc/page.tsx             # Unannounced WebRTC VC with AI Face Count
│   │   ├── android/page.tsx        # In-Browser Android Handheld Station
│   │   ├── form-builder/page.tsx   # Drag-and-Drop Dynamic Checklist Studio
│   │   ├── facilities/page.tsx     # Institutions & Geo-Fence Registry
│   │   ├── officers/page.tsx       # 52 Field Officers Roster & Dispatch
│   │   ├── admin/page.tsx          # Database Operations & Audit Registry
│   │   └── api/v1/                 # Unified REST API Route Handlers
│   ├── src/components/             # UI Components (Tailwind CSS + shadcn/ui)
│   └── src/lib/serverDb.ts         # Server-Side In-Memory / File Database
├── database/                       # Spatial Database
│   ├── postgis_schema.sql          # PostGIS spatial tables & GIST indices
│   ├── seed_dosje_data.sql         # 12+ real-world DoSJE facilities
│   └── db_adapter.py               # PostGIS / SQLite connection adapter
├── video_engine/                   # ONVIF / RTSP / WebRTC Protocol Layer
│   ├── onvif_ptz_service.py        # ONVIF Profile S PTZ controls
│   ├── rtsp_stream_gateway.py      # RTSP stream proxy & frame extractor
│   └── webrtc_signaling.py         # WebRTC room coordinator & signaling
├── ai_ml/                          # Python TensorFlow Machine Learning
│   ├── headcount_detector.py       # Attendance & ghost beneficiary detector
│   ├── privacy_masker.py           # DPDP Act 2023 face-blurring engine
│   ├── anomaly_detector.py         # Velocity spoofing & tamper detector
│   └── random_dispatch_ai.py       # Automated surprise audit dispatcher
├── security/                       # Enterprise Security
│   ├── aes256_cipher.py            # Authenticated AES-256-GCM cipher
│   ├── oauth2_provider.py          # OAuth2 JWT token provider
│   └── rbac_permissions.py         # 5-tier role-based access control
├── cloud/                          # GovCloud Deployment
│   ├── nic_govcloud.tf             # Terraform IaC for NIC MeghRaj / AWS
│   ├── k8s/nic-deployment.yaml     # Production Kubernetes manifests
│   └── docker-compose.yml          # Multi-container orchestration
├── run_prototype.py                # Unified Master Runner (APIs + Portal)
├── test_prototype.py               # Subsystem Test Suite (10/10 PASS)
├── test_in_memory_handler.py       # API Route Integration Test (10/10 PASS)
└── test_bug_fixes.py               # Regression & Security Test Suite (10/10 PASS)
```

---

## 🚀 How to Run the Platform

### 1. Run the Next.js Web Platform (`Web/`)
```bash
cd Web
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser:
- **Dashboard (`/`)**: National GIS Geofence surveillance map, real-time KPI metrics, and 1-click Random/Risk-Weighted Officer Dispatch.
- **Android Handheld Station (`/android`)**: Interactive handheld client with live Form Builder synchronization, strict facility locking, direct camera capture, and offline package queuing.
- **Form Builder (`/form-builder`)**: Dynamic inspection checklist studio with editable compliance rubrics, weights, and live mobile preview.
- **Admin Console (`/admin`)**: Multi-tab database explorer (facilities, officers, submitted audits ledger, offline packages) with live search and JSON export.
- **Production Build**:
  ```bash
  npm run build
  npm run start
  ```

### 2. Run the Unified Backend Server
To boot the REST API server, WebRTC signaling coordinator, and CCTV proxy:
```bash
python3 run_prototype.py
```
Backend API gateway runs at **`http://localhost:8000`**.

### 3. Build or Install the Native Android App (`android/`)
- **Compile APK via Gradle**:
  ```bash
  cd android
  ./gradlew assembleDebug
  ```
  The built APK is placed at:
  `android/app/build/outputs/apk/debug/app-debug.apk`
- **Direct Physical Device Testing**:
  A pre-compiled APK is available at:
  `Web/public/downloads/mosje-inspection.apk` (7.5 MB)
- **Install on Connected Device / Phone via ADB**:
  ```bash
  adb install -r android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

## 🧪 Automated Verification & Testing

### 1. Run Backend Subsystem & AI Model Tests:
```bash
python3 test_prototype.py
```
*Validates AES-256 encryption, OAuth2 tokens, RBAC permissions, geofencing mathematics, AI headcount detection, DPDP privacy masking, and anomaly detection.*

### 2. Run In-Memory REST API Route Tests:
```bash
python3 test_in_memory_handler.py
```
*Validates all 10 core HTTP endpoints with HTTP 200 responses.*

### 3. Run Bug Fixes & Security Verification Suite:
```bash
python3 test_bug_fixes.py
```
*Validates officer facility locking, direct camera HUD watermarking, and audit rejection handling.*

### 4. Build Verification for Next.js Web App:
```bash
cd Web && npm run build
```
*Compiles all 9 static routes with 0 TypeScript or lint errors.*

---

## 🐳 Running with Docker & PostGIS

To deploy the multi-container stack with production PostGIS:
```bash
docker-compose up -d
```
Services started:
- `dosje-postgis`: PostgreSQL 15 + PostGIS 3.3 container with spatial indexing and seed data.
- `dosje-drf-api`: Django REST Framework API with Gunicorn on port 8000.
- `dosje-webrtc-signaling`: WebRTC TURN/STUN relay server on port 3478.
