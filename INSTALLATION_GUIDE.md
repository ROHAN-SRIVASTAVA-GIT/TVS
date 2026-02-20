# Installation & Setup Guide

## Complete Step-by-Step Setup Instructions

### System Requirements
- **Node.js**: v16.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v12 or higher
- **RAM**: 2GB minimum
- **Disk Space**: 500MB minimum

---

## PART 1: DATABASE SETUP

### 1.1 Install PostgreSQL

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer and follow wizard
3. Remember username (postgres) and password you set
4. Choose port 5432 (default)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### 1.2 Create Database

Open PostgreSQL Command Line:

**Windows:**
- Open pgAdmin or SQL Shell

**macOS/Linux:**
```bash
psql -U postgres
```

Create database:
```sql
CREATE DATABASE top_view_school;
\q
```

---

## PART 2: BACKEND SETUP

### 2.1 Navigate to Backend Directory
```bash
cd backend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Configure Environment Variables

Create `.env` file in backend folder:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=top_view_school
DB_USER=postgres
DB_PASSWORD=root

# JWT Configuration
JWT_SECRET=top_view_school_jwt_secret_key_change_in_production_2024
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=top_view_school_refresh_secret_key_change_in_production_2024
JWT_REFRESH_EXPIRE=30d

# Email Configuration (Gmail Example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=Top View Public School <noreply@topviewschool.com>

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_DIR=logs

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### 2.4 Get Gmail App Password

1. Go to https://myaccount.google.com
2. Click "Security" in left menu
3. Enable "2-Step Verification" if not enabled
4. Search for "App passwords"
5. Select Mail and Windows Computer
6. Copy the 16-character password
7. Paste in EMAIL_PASSWORD in .env

### 2.5 Get Razorpay Credentials

1. Visit https://dashboard.razorpay.com
2. Sign up or login
3. Go to Settings → API Keys
4. Copy Key ID and Key Secret
5. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env

### 2.6 Create Directories
```bash
mkdir -p logs uploads
```

### 2.7 Start Backend Server
```bash
npm run dev
```

You should see:
```
✓ Server running on port 5000
✓ Database connected successfully
✓ Database tables initialized
```

---

## PART 3: FRONTEND SETUP

### 3.1 Navigate to Frontend Directory
```bash
cd ../frontend
```

### 3.2 Install Dependencies
```bash
npm install
```

### 3.3 Configure Environment Variables

Create `.env` file in frontend folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_1234567890
```

### 3.4 Start Frontend Application
```bash
npm start
```

The application will automatically open at http://localhost:3000

---

## PART 4: TESTING THE APPLICATION

### 4.1 Test Registration
1. Go to http://localhost:3000/register
2. Fill in the form with:
   - First Name: Test
   - Last Name: User
   - Email: testuser@example.com
   - Phone: 9999999999
   - Password: Test@12345 (min 8 characters, 1 uppercase, 1 lowercase, 1 number)

### 4.2 Test Login
1. Go to http://localhost:3000/login
2. Use credentials from registration

### 4.3 Test Admission Form
1. After login, go to /admission
2. Fill multi-step form
3. Upload photo
4. Submit form

### 4.4 Test Payment
1. Go to /fees to see fee structures
2. Go to /payment
3. Enter test amount (e.g., 100)
4. Click "Proceed to Payment"
5. Use Razorpay test card:
   - Card: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits

### 4.5 Test Contact Form
1. Go to /contact
2. Fill and submit form
3. Check success message

---

## PART 5: PROJECT STRUCTURE OVERVIEW

```
top-view-public-school/
├── backend/
│   ├── config/              ← Database & Logger config
│   ├── middleware/          ← Auth, validation, error handling
│   ├── models/              ← Database models
│   ├── routes/              ← API endpoints
│   ├── controllers/         ← Business logic
│   ├── validators/          ← Input validation schemas
│   ├── utils/               ← Helper functions
│   ├── logs/                ← Application logs
│   ├── uploads/             ← Uploaded files
│   ├── .env                 ← Environment variables
│   ├── server.js            ← Main server file
│   └── package.json         ← Dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/      ← Reusable components
│   │   ├── pages/           ← Page components
│   │   ├── context/         ← Auth context
│   │   ├── api/             ← Axios configuration
│   │   ├── utils/           ← Constants & helpers
│   │   ├── App.js           ← Main app component
│   │   └── index.js         ← Entry point
│   ├── public/              ← Static files
│   ├── .env                 ← Environment variables
│   ├── package.json         ← Dependencies
│   └── .gitignore
│
├── README.md                ← Project documentation
├── .gitignore               ← Git ignore rules
└── setup.sh                 ← Setup script
```

---

## PART 6: TROUBLESHOOTING

### Issue: Database Connection Failed
**Solution:**
1. Check PostgreSQL is running
2. Verify DB credentials in .env
3. Ensure database `top_view_school` exists
4. Check DB_HOST, DB_PORT values

### Issue: Port 5000 Already in Use
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5000 | xargs kill -9
```

### Issue: CORS Error
**Solution:**
- Check FRONTEND_URL in backend .env
- Ensure frontend URL matches exactly

### Issue: Dependencies Installation Failed
**Solution:**
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: Module Not Found Error
**Solution:**
1. Delete node_modules folder
2. Delete package-lock.json
3. Run `npm install` again

### Issue: Email Not Sending
**Solution:**
1. Verify EMAIL_USER and EMAIL_PASSWORD in .env
2. Check Gmail App Password (not regular password)
3. Enable "Less secure apps" if using regular Gmail password

---

## PART 7: DEVELOPMENT WORKFLOW

### Terminal Setup (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Keep both terminals open during development.

---

## PART 8: BUILD FOR PRODUCTION

### Backend:
```bash
cd backend
npm start
```

### Frontend:
```bash
cd frontend
npm run build
```

Build folder is created with optimized production files.

---

## PART 9: DEPLOYMENT

### Deploy Backend (Railway.app)
1. Sign up at https://railway.app
2. Connect GitHub repository
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy

### Deploy Frontend (Vercel)
1. Sign up at https://vercel.com
2. Import GitHub repository
3. Set REACT_APP_API_URL to backend URL
4. Deploy

---

## Additional Resources

- **Node.js Docs**: https://nodejs.org/docs/
- **React Docs**: https://react.dev
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Express Docs**: https://expressjs.com
- **Razorpay Docs**: https://razorpay.com/docs/

---

## Support & Help

For issues or questions:
- Email: support@topviewschool.com
- Phone: 9470525155

---

**Setup Guide Version**: 1.0
**Last Updated**: February 2026
