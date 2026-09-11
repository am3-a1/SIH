# SIH26095: Smart Real-Time Monitoring & Inspection Platform

### Ministry of Social Justice and Empowerment (MoSJE) / Department of Social Justice and Empowerment (DoSJE)
**Problem Statement ID**: `SIH26095`  
**Category**: Software / Smart Automation  
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
| **Mobile App** | **Flutter (Android / iOS)** | • Production cross-platform app in `sih_inspector_app/`<br>• GPS Geofencing perimeter validator<br>• Camera with auto-stamped GPS/Time/Hash watermark<br>• Dual digital signature capture<br>• Offline-first storage with automatic sync queue<br>• WebRTC spot-check video call UI |
| **Backend** | **Django REST Framework (DRF)** | • Modular Django REST backend in `backend/`<br>• Apps for `authentication_rbac`, `facilities`, `inspections`, `cctv_onvif`, `video_conference`, and `ai_services`<br>• Zero-config unified prototype runner in `run_prototype.py` |
| **Database** | **PostgreSQL + PostGIS** | • Spatial schema in `database/postgis_schema.sql`<br>• `GIST` spatial indices on facility GPS geometries<br>• `ST_DWithin` geofence verification stored procedure<br>• 12+ real-world DoSJE facilities seeded in `database/seed_dosje_data.sql`<br>• Automated SQLite/Haversine fallback in `database/db_adapter.py` |
| **Video / VC** | **ONVIF, RTSP, WebRTC** | • **ONVIF**: Camera discovery & Profile S/G PTZ controls (`video_engine/onvif_ptz_service.py`)<br>• **RTSP**: Live stream gateway, heartbeat check, frame extractor (`video_engine/rtsp_stream_gateway.py`)<br>• **WebRTC**: Real-time two-way signaling server & random spot-check room coordinator (`video_engine/webrtc_signaling.py`) |
| **AI / ML** | **Python, TensorFlow / TFLite** | • **Headcount & Attendance**: TensorFlow model detecting individuals and flagging ghost beneficiary discrepancies (`ai_ml/headcount_detector.py`)<br>• **Beneficiary Privacy Masking**: Automated face-blurring engine under DPDP Act 2023 (`ai_ml/privacy_masker.py`)<br>• **Anti-Spoofing & Tamper Detection**: Velocity anomaly detection, duplicate image hashes (`ai_ml/anomaly_detector.py`)<br>• **Automated Random Dispatch**: Risk-weighted surprise inspection algorithm (`ai_ml/random_dispatch_ai.py`) |
| **Cloud** | **AWS / NIC GovCloud (MeghRaj)** | • Infrastructure-as-Code Terraform templates (`cloud/nic_govcloud.tf`)<br>• Kubernetes production manifests (`cloud/k8s/nic-deployment.yaml`)<br>• Multi-container Docker Compose (`docker-compose.yml`) |
| **Security** | **OAuth2, AES-256, RBAC** | • **OAuth2 + JWT + PKCE**: Token issuance, refresh, and claims verification (`security/oauth2_provider.py`)<br>• **AES-256-GCM**: Cryptographic encryption of field inspection packages & evidence (`security/aes256_cipher.py`)<br>• **5-Tier RBAC**: `NATIONAL_ADMIN`, `STATE_OFFICER`, `DISTRICT_INSPECTOR`, `SURPRISE_AUDITOR`, `FACILITY_HEAD` (`security/rbac_permissions.py`) |

---

## 📁 Codebase Directory Structure

```
SIH/
├── sih_inspector_app/              # Flutter Mobile App (Android / iOS)
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── core/
│       │   ├── security/aes_crypto.dart         # AES-256 encryption in Dart
│       │   ├── network/oauth2_client.dart       # OAuth2 with JWT & PKCE
│       │   └── offline/sync_queue.dart          # Offline-first caching & sync
│       ├── services/
│       │   ├── location_service.dart            # Geofencing radius calculations
│       │   └── camera_watermark_service.dart    # Tamper-proof photo watermarking
│       └── screens/
│           ├── auth/login_screen.dart           # RBAC login screen
│           ├── inspections/list_screen.dart     # Assigned surprise visits
│           ├── inspections/audit_screen.dart    # 5-point rubric, GPS check, signatures
│           ├── vc/webrtc_call_screen.dart       # Live spot-check video call
│           └── cctv/feed_viewer_screen.dart     # CCTV matrix with ONVIF PTZ
├── backend/                        # Django REST Framework Backend
│   ├── manage.py
│   ├── config/settings.py, urls.py, wsgi.py
│   └── apps/
│       ├── authentication_rbac/    # OAuth2 login & role checking
│       ├── facilities/             # PostGIS facilities & geofence endpoints
│       ├── inspections/            # Field audit submissions & reviews
│       ├── cctv_onvif/             # ONVIF PTZ & RTSP stream gateway
│       ├── video_conference/       # WebRTC signaling & snapshot logging
│       └── ai_services/            # AI Headcount, Privacy Mask, Dispatch
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
├── web_preview/                    # Interactive Portal & Simulator
│   ├── index.html                  # MoSJE Command Center + Flutter Simulator
│   ├── styles.css
│   └── app.js
├── run_prototype.py                # Unified Master Runner (APIs + Portal)
├── test_prototype.py               # Unit & Subsystem Test Suite (10/10 PASS)
└── test_in_memory_handler.py       # API Route Integration Test (10/10 PASS)
```

---

## 🚀 How to Run the Prototype

### 1. Launch the Unified Master Server
To run the complete platform (REST API server + WebRTC coordinator + interactive web portal):

```bash
python3 run_prototype.py
```
Open your browser at:
👉 **`http://localhost:8000`**

From this portal you can test:
1. **MoSJE Central Command Center**: View the national GIS map with real-time PostGIS facility pins, scheme analytics, live alert feeds, and 1-click AI Random Dispatch.
2. **Flutter Mobile App Simulator**: Test the mobile handheld inspection flow inside an interactive smartphone frame:
   - GPS Geofence perimeter validation (35m from facility vs 150m radius).
   - 5-point statutory checklist with dynamic scoring sliders.
   - Camera photo capture with auto-stamped GPS, timestamp, and SHA-256 hash.
   - Dual digital signatures (Inspector + NGO Head).
   - AES-256 encrypted offline queue saving and 1-click cloud sync.
3. **ONVIF & RTSP Surveillance Matrix**: Pan/Tilt/Zoom continuous camera control, live frame extraction, and AI Headcount scanning.
4. **WebRTC Spot-Check Room**: Unannounced live video call with in-call watermarked snapshot capture and verification note logging.

---

## 🧪 Running Automated Verification Tests

### Run Unit & AI Model Tests:
```bash
python3 test_prototype.py
```
*Output: 10/10 tests passed in 0.004s (AES-256, OAuth2, RBAC, Geofencing, Headcount, Privacy Mask, Velocity Spoofing, Dispatch, ONVIF PTZ, WebRTC).*

### Run In-Memory REST API Route Tests:
```bash
python3 test_in_memory_handler.py
```
*Output: 10/10 HTTP endpoints verified with HTTP 200 responses.*

---

## 🐳 Running with Docker & PostgreSQL+PostGIS

To deploy the multi-container stack with production PostGIS:
```bash
docker-compose up -d
```
This boots:
- `dosje-postgis`: PostgreSQL 15 + PostGIS 3.3 container with spatial indexing and seed data.
- `dosje-drf-api`: Django REST Framework API with Gunicorn on port 8000.
- `dosje-webrtc-signaling`: WebRTC TURN/STUN relay server on port 3478.
