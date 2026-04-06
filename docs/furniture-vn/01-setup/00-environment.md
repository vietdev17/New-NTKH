# ENVIRONMENT CONFIGURATION

Huong dan cau hinh moi truong cho he thong Furniture E-Commerce Vietnam.
He thong su dung kien truc monorepo voi 2 ung dung chinh: Backend (NestJS) va Frontend (Next.js).

---

## 1. Backend Environment (apps/backend/.env)

Tao file `.env` tai thu muc `apps/backend/`:

```env
# ===== SERVER =====
PORT=5001
NODE_ENV=development

# ===== DATABASE =====
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/furniture-vn?retryWrites=true&w=majority

# ===== JWT =====
JWT_SECRET=your-super-secret-key-here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

# ===== GOOGLE OAUTH (Dang nhap bang Google) =====
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
GOOGLE_REDIRECT_URI=http://localhost:5001/api/v1/auth/google/callback

# ===== GOOGLE DRIVE (Upload hinh anh san pham) =====
GOOGLE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
GOOGLE_DRIVE_CLIENT_EMAIL=furniture-upload@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n"

# ===== FRONTEND URL (CORS) =====
FRONTEND_URL=http://localhost:3000

# ===== EMAIL (Thong bao don hang, xac nhan tai khoan) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# ===== RATE LIMITING =====
THROTTLE_TTL=60000
THROTTLE_LIMIT=60
```

> **LUU Y QUAN TRONG:** He thong nay chi ho tro thanh toan COD (thanh toan khi nhan hang) va Chuyen khoan ngan hang. KHONG tich hop VNPay, MoMo hay bat ky cong thanh toan nao khac. Vi vay KHONG can cau hinh bat ky API key thanh toan nao.

---

## 2. Frontend Environment (apps/fe/.env.local)

Tao file `.env.local` tai thu muc `apps/fe/`:

```env
# ===== API =====
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# ===== GOOGLE OAUTH =====
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com

# ===== GOOGLE MAPS (Ban do theo doi shipper) =====
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> **Ghi chu:** Tat ca bien moi truong phia frontend phai bat dau bang `NEXT_PUBLIC_` de Next.js expose ra browser.

---

## 3. Google Drive Setup (Upload hinh anh san pham)

Google Drive duoc su dung lam noi luu tru hinh anh san pham thay vi su dung dich vu luu tru tra phi nhu AWS S3 hay Cloudinary.

### Buoc 1: Tao Google Cloud Project

1. Truy cap [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** > **New Project**
3. Dat ten project: `furniture-vn` (hoac ten tuy chon)
4. Click **Create**
5. Doi project duoc tao xong, chon project vua tao

### Buoc 2: Bat Google Drive API

1. Vao menu **APIs & Services** > **Library**
2. Tim kiem "Google Drive API"
3. Click vao **Google Drive API**
4. Click **Enable**
5. Doi API duoc bat thanh cong

### Buoc 3: Tao Service Account

1. Vao **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Dien thong tin:
   - Service account name: `furniture-drive-upload`
   - Service account ID: `furniture-drive-upload` (tu dong tao)
   - Description: `Upload hinh anh san pham len Google Drive`
4. Click **Create and Continue**
5. Chon role: **Editor** (hoac **Storage Object Admin**)
6. Click **Done**

### Buoc 4: Download JSON Key

1. Trong danh sach Service Accounts, click vao account vua tao
2. Chon tab **Keys**
3. Click **Add Key** > **Create new key**
4. Chon loai **JSON**
5. Click **Create** - file JSON se duoc tai ve tu dong
6. Mo file JSON, lay cac gia tri:
   - `client_email` -> `GOOGLE_DRIVE_CLIENT_EMAIL`
   - `private_key` -> `GOOGLE_DRIVE_PRIVATE_KEY`

> **Bao mat:** KHONG commit file JSON key vao git. Them file vao `.gitignore`.

### Buoc 5: Chia se thu muc Drive voi Service Account

1. Truy cap [Google Drive](https://drive.google.com/)
2. Tao thu muc moi, dat ten: `furniture-products` (hoac ten tuy chon)
3. Click chuot phai vao thu muc > **Share**
4. Dan email cua service account (vi du: `furniture-drive-upload@your-project.iam.gserviceaccount.com`)
5. Chon quyen **Editor**
6. Click **Send** (bo check gui email thong bao)

### Buoc 6: Lay Folder ID

1. Mo thu muc vua tao tren Google Drive
2. Nhin vao thanh dia chi URL cua trinh duyet:
   ```
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```
3. Phan sau `/folders/` chinh la **FOLDER_ID**: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
4. Copy gia tri nay vao `GOOGLE_DRIVE_FOLDER_ID` trong file `.env`

---

## 4. Google OAuth Setup (Dang nhap bang tai khoan Google)

### Buoc 1: Cau hinh OAuth Consent Screen

1. Vao [Google Cloud Console](https://console.cloud.google.com/) > project da tao
2. Chon **APIs & Services** > **OAuth consent screen**
3. Chon **External** > Click **Create**
4. Dien thong tin:
   - App name: `Furniture Vietnam`
   - User support email: email cua ban
   - Developer contact: email cua ban
5. Click **Save and Continue**
6. Them scopes:
   - `email`
   - `profile`
   - `openid`
7. Click **Save and Continue**
8. Them test users (neu dang o che do Testing):
   - Them email cua ban va cac thanh vien team
9. Click **Save and Continue** > **Back to Dashboard**

### Buoc 2: Tao OAuth 2.0 Client ID

1. Vao **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Chon Application type: **Web application**
4. Dat ten: `Furniture VN Web Client`
5. Cau hinh **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   http://localhost:5001
   ```
6. Cau hinh **Authorized redirect URIs**:
   ```
   http://localhost:5001/api/v1/auth/google/callback
   ```
7. Click **Create**

### Buoc 3: Lay Client ID va Client Secret

1. Sau khi tao, mot popup se hien thi:
   - **Client ID** -> `GOOGLE_CLIENT_ID` (backend) va `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend)
   - **Client Secret** -> `GOOGLE_CLIENT_SECRET` (chi backend)
2. Copy cac gia tri nay vao file `.env` tuong ung

> **Luu y khi deploy production:**
> - Them domain production vao Authorized JavaScript origins
> - Them redirect URI production vao Authorized redirect URIs
> - Chuyen OAuth consent screen tu Testing sang Production
> - Submit de Google review (neu can)

---

## 5. MongoDB Atlas Setup

### Buoc 1: Tao tai khoan va Cluster

1. Truy cap [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Dang ky tai khoan (hoac dang nhap neu da co)
3. Click **Build a Database**
4. Chon plan:
   - **M0 FREE** (phu hop cho development)
   - Chon provider: **AWS** hoac **Google Cloud**
   - Chon region gan Viet Nam nhat: **Singapore (ap-southeast-1)** hoac **Hong Kong**
5. Dat ten cluster: `furniture-vn-cluster`
6. Click **Create Cluster**

### Buoc 2: Tao Database User

1. Vao **Database Access** (menu ben trai)
2. Click **Add New Database User**
3. Chon Authentication Method: **Password**
4. Dien thong tin:
   - Username: `furniture-admin`
   - Password: tao mat khau manh (click **Autogenerate Secure Password** va luu lai)
5. Database User Privileges: **Read and write to any database**
6. Click **Add User**

> **Quan trong:** Luu lai username va password, se dung trong connection string.

### Buoc 3: Whitelist IP Address

1. Vao **Network Access** (menu ben trai)
2. Click **Add IP Address**
3. Cau hinh:
   - Cho development: Click **Allow Access from Anywhere** (se them `0.0.0.0/0`)
   - Cho production: Chi them IP cua server
4. Click **Confirm**

> **Bao mat:** Tren moi truong production, chi whitelist IP cua server. KHONG su dung `0.0.0.0/0`.

### Buoc 4: Lay Connection String

1. Quay lai **Database** (menu ben trai)
2. Click **Connect** tren cluster
3. Chon **Connect your application**
4. Chon Driver: **Node.js**, Version: **6.0 or later**
5. Copy connection string:
   ```
   mongodb+srv://furniture-admin:<password>@furniture-vn-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Thay `<password>` bang mat khau da tao o Buoc 2
7. Them ten database vao truoc `?`:
   ```
   mongodb+srv://furniture-admin:your-password@furniture-vn-cluster.xxxxx.mongodb.net/furniture-vn?retryWrites=true&w=majority
   ```
8. Dan gia tri nay vao `MONGODB_URI` trong file `.env` cua backend

---

## 6. Cau hinh Email (Gmail App Password)

He thong su dung email de gui thong bao don hang, xac nhan tai khoan, va quen mat khau.

### Buoc 1: Bat 2-Factor Authentication

1. Vao [Google Account](https://myaccount.google.com/)
2. Chon **Security** > **2-Step Verification**
3. Bat xac thuc 2 buoc neu chua bat

### Buoc 2: Tao App Password

1. Vao [Google Account](https://myaccount.google.com/) > **Security**
2. Tim **App passwords** (chi hien khi da bat 2-Step Verification)
3. Chon app: **Mail**
4. Chon device: **Other** > dat ten `Furniture VN`
5. Click **Generate**
6. Copy mat khau 16 ky tu (vi du: `abcd efgh ijkl mnop`)
7. Dan vao `EMAIL_PASS` trong file `.env` (bo khoang trang: `abcdefghijklmnop`)

---

## 7. Kiem tra cau hinh

Sau khi cau hinh xong, chay cac lenh sau de kiem tra:

```bash
# Tai thu muc goc cua project
cd /path/to/furniture-vn

# Cai dat dependencies
npm install

# Chay backend
npm run dev:backend
# Backend se chay tai http://localhost:5001
# Truy cap http://localhost:5001/api/docs de xem Swagger docs

# Chay frontend (terminal khac)
npm run dev:fe
# Frontend se chay tai http://localhost:3000
```

### Kiem tra ket noi:

| Thanh phan       | Cach kiem tra                                           | Ket qua mong doi                  |
|------------------|---------------------------------------------------------|-----------------------------------|
| MongoDB          | Backend log khi khoi dong                               | `MongoDB connected successfully`  |
| Google Drive     | Upload 1 hinh anh san pham qua admin panel              | Hinh anh hien thi dung            |
| Google OAuth     | Click "Dang nhap bang Google" tren trang login           | Redirect va dang nhap thanh cong  |
| Email            | Dang ky tai khoan moi                                   | Nhan email xac nhan               |
| Socket.IO        | Mo 2 tab, dat hang tren 1 tab                           | Tab admin nhan thong bao realtime |

---

## 8. Cau truc file Environment

```
furniture-vn/
├── apps/
│   ├── backend/
│   │   ├── .env              # Backend environment variables
│   │   └── .env.example      # Template (commit vao git)
│   └── fe/
│       ├── .env.local        # Frontend environment variables (KHONG commit)
│       └── .env.example      # Template (commit vao git)
├── .gitignore                # Phai co: .env, .env.local, *.json (service account key)
└── ...
```

> **Nho:** Luon tao file `.env.example` voi cac gia tri mau de cac thanh vien team biet can cau hinh nhung gi. KHONG bao gio commit file `.env` hoac `.env.local` chua gia tri that vao git.
