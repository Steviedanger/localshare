# LocalShare — LAN File Transfer Hub

Transfer files and send messages between devices on the same Wi-Fi network.
No internet. No cloud. No accounts.

---

## How it works

1. One machine runs the **Node.js hub** (backend).
2. Every other device on the same Wi-Fi opens a browser and visits the hub's IP address.
3. The hub broadcasts itself via **mDNS** (`_localshare._tcp`) so devices can auto-discover it.
4. Devices connect via **Socket.IO** for real-time messaging and presence.
5. Files are uploaded to the hub over **HTTP (multipart)**, stored on disk, then downloaded by the recipient.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Real-time | Socket.IO v4 |
| Database | PostgreSQL via Prisma ORM |
| Discovery | mDNS / Bonjour (`bonjour-service`) |
| File uploads | Multer |
| State | Zustand |
| Styling | CSS Modules + custom design system |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker)
- npm 9+

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/your-org/localshare.git
cd localshare
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

### 4. Run database migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Start the hub

```bash
cd backend && npm run dev
```

### 6. Start the frontend

```bash
cd frontend && npm run dev
```

Open **http://localhost:5173** on the hub machine, or **http://<hub-ip>:5173** from any other device on the same Wi-Fi.

---

## Production build

```bash
cd frontend && npm run build
cd ../backend && npm run build && npm start
```

Visit **http://<hub-ip>:3001** from any device.

---

## Security note

Designed for **trusted local networks only**. No authentication. Do not expose to the internet.
