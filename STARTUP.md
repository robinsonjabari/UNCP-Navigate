# UNCP Navigate - Startup Guide

## Quick Start

### Option 1: Use the startup script (Windows)

```cmd
start-all.bat
```

### Option 2: Manual startup

#### 1. Start PostgreSQL

**If using Windows service:**

```powershell
net start postgresql-x64-16
```

**If using Docker:**

```powershell
docker start uncp-postgres
```

#### 2. Start Backend (Port 3000)

```powershell
cd backend
npm install
npm run dev
```

#### 3. Start Frontend (Port 3001)

```powershell
cd frontend
npm install
npm run dev
```

#### 4. Test API (Optional)

```powershell
cd backend
node test-places.js
```

## URLs

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **API Places**: http://localhost:3000/api/places

## Shutdown

### Quick Stop

```cmd
stop-all.bat
```

### Manual Stop

1. Press `Ctrl+C` in each terminal window
2. Optionally stop PostgreSQL:
   ```powershell
   net stop postgresql-x64-16
   # OR
   docker stop uncp-postgres
   ```

## Troubleshooting

### Port already in use

```powershell
# Check what's using port 3000 or 3001
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill the process
taskkill /PID <process_id> /F
```

### Database connection fails

- Verify PostgreSQL is running
- Check credentials in `backend/.env`:
  - DB_HOST=localhost
  - DB_PORT=5432
  - DB_NAME=uncp_navigate
  - DB_USER=uncp_navigate_user
  - DB_PASSWORD=UNCP6adm

### Backend won't start

- Delete `backend/node_modules` and run `npm install` again
- Check `backend/.env` file exists with correct values

### Frontend won't start

- Delete `frontend/node_modules` and run `npm install` again
- Verify `frontend/vite.config.ts` has proxy set to http://localhost:3000
