# 🚀 GETTING STARTED CHECKLIST

## Complete Setup Workflow

### ✅ PHASE 1: PREREQUISITES (5 minutes)

- [ ] Install Node.js from nodejs.org
- [ ] Install PostgreSQL from postgresql.org
- [ ] Verify installations:
  ```bash
  node --version
  npm --version
  psql --version
  ```

### ✅ PHASE 2: DATABASE SETUP (5 minutes)

- [ ] Start PostgreSQL service
- [ ] Open PostgreSQL shell or pgAdmin
- [ ] Create database:
  ```sql
  CREATE DATABASE top_view_school;
  ```
- [ ] Verify database created

### ✅ PHASE 3: BACKEND SETUP (10 minutes)

- [ ] Navigate to backend folder
  ```bash
  cd backend
  ```
- [ ] Install dependencies
  ```bash
  npm install
  ```
- [ ] Create `.env` file in backend folder
- [ ] Copy environment variables from template:
  ```
  PORT=5000
  NODE_ENV=development
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=top_view_school
  DB_USER=postgres
  DB_PASSWORD=root
  JWT_SECRET=top_view_school_jwt_secret_2024
  RAZORPAY_KEY_ID=rzp_test_xxxxx
  RAZORPAY_KEY_SECRET=xxxxx
  EMAIL_USER=your_email@gmail.com
  EMAIL_PASSWORD=your_app_password
  FRONTEND_URL=http://localhost:3000
  ```
- [ ] Update RAZORPAY credentials
- [ ] Update EMAIL credentials
- [ ] Create logs and uploads folders:
  ```bash
  mkdir -p logs uploads
  ```
- [ ] Start backend server
  ```bash
  npm run dev
  ```
- [ ] Verify server started:
  ```
  ✓ Server running on port 5000
  ✓ Database connected successfully
  ```

### ✅ PHASE 4: FRONTEND SETUP (10 minutes)

- [ ] Open new terminal window
- [ ] Navigate to frontend folder
  ```bash
  cd frontend
  ```
- [ ] Install dependencies
  ```bash
  npm install
  ```
- [ ] Create `.env` file in frontend folder:
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxx
  ```
- [ ] Start frontend application
  ```bash
  npm start
  ```
- [ ] Browser should open automatically to http://localhost:3000

### ✅ PHASE 5: INITIAL TESTING (10 minutes)

- [ ] Frontend loads at http://localhost:3000
- [ ] Navigation bar is visible
- [ ] Click on "Home" - loads properly
- [ ] Click on "About" - loads properly
- [ ] Click on "Gallery" - loads with demo images
- [ ] Click on "Fees" - shows fee structure table

### ✅ PHASE 6: USER REGISTRATION TEST (5 minutes)

- [ ] Click "Register" button
- [ ] Fill registration form:
  - First Name: Test
  - Last Name: User
  - Email: testuser@example.com
  - Phone: 9999999999
  - Password: Test@12345
  - Role: Parent
- [ ] Click "Create Account"
- [ ] Should redirect to dashboard
- [ ] Verify email in database

### ✅ PHASE 7: LOGIN TEST (5 minutes)

- [ ] Click "Logout"
- [ ] Click "Login"
- [ ] Enter credentials:
  - Email: testuser@example.com
  - Password: Test@12345
- [ ] Click "Login"
- [ ] Should show dashboard with user info

### ✅ PHASE 8: ADMISSION FORM TEST (10 minutes)

- [ ] From dashboard, go to "Admission"
- [ ] Fill Step 1 - Student Info:
  - Student Name: John Doe
  - Date of Birth: 2015-05-15
  - Email: john@example.com
  - Father Name: James Doe
  - Father Contact: 9999999999
  - Mother Name: Jane Doe
  - Mother Contact: 8888888888
- [ ] Click "Next"
- [ ] Fill Step 2 - Address Info:
  - Address: 123 Main Street
  - District: Palamu
  - PIN: 822122
  - State: Jharkhand
- [ ] Click "Next"
- [ ] Fill Step 3 - Final Info:
  - Admission Class: I
  - Academic Year: 2026
- [ ] Click "Submit Form"
- [ ] Verify success message with form number

### ✅ PHASE 9: PAYMENT TEST (10 minutes)

- [ ] Go to "Payment" page
- [ ] Select Fee Type: tuition
- [ ] Select Class: I
- [ ] Enter Amount: 100
- [ ] Click "Proceed to Payment"
- [ ] Razorpay modal should appear
- [ ] Use test card: 4111 1111 1111 1111
- [ ] Expiry: Any future date
- [ ] CVV: Any 3 digits
- [ ] Verify payment success

### ✅ PHASE 10: CONTACT FORM TEST (5 minutes)

- [ ] Go to "Contact" page
- [ ] Fill contact form:
  - Name: Test Contact
  - Email: contact@test.com
  - Phone: 9999999999
  - Subject: Test Subject
  - Message: This is a test message
- [ ] Click "Send Message"
- [ ] Verify success message

### ✅ PHASE 11: ADMIN FEATURES (Optional)

- [ ] Create admin account via registration
- [ ] Update user role to 'admin' in database:
  ```sql
  UPDATE users SET role='admin' WHERE email='admin@example.com';
  ```
- [ ] Login with admin account
- [ ] Access admin routes (if implemented)

### ✅ PHASE 12: DATA VERIFICATION

- [ ] Open PostgreSQL and verify tables:
  ```sql
  SELECT COUNT(*) FROM users;
  SELECT COUNT(*) FROM admissions;
  SELECT COUNT(*) FROM payments;
  ```
- [ ] Check logs in backend/logs/ folder
- [ ] Verify uploads in backend/uploads/ folder

---

## 🐛 TROUBLESHOOTING CHECKLIST

### Backend Won't Start
- [ ] PostgreSQL running?
- [ ] Database exists?
- [ ] .env file configured?
- [ ] Port 5000 free?
- [ ] Dependencies installed? (npm install)

### Frontend Won't Load
- [ ] Backend running?
- [ ] Frontend .env configured?
- [ ] Dependencies installed?
- [ ] Port 3000 free?
- [ ] Check browser console for errors

### Database Connection Error
- [ ] PostgreSQL running?
- [ ] Correct DB_HOST, DB_PORT?
- [ ] Correct DB_USER, DB_PASSWORD?
- [ ] Database exists?
- [ ] User has permissions?

### CORS Errors
- [ ] Backend FRONTEND_URL correct?
- [ ] Backend running on correct port?
- [ ] Frontend API_URL correct?
- [ ] Check Network tab in DevTools

### Email Not Working
- [ ] Gmail App Password set?
- [ ] EMAIL_USER correct?
- [ ] EMAIL_PASSWORD correct?
- [ ] 2FA enabled on Gmail?

### Payment Integration Issues
- [ ] RAZORPAY_KEY_ID set?
- [ ] RAZORPAY_KEY_SECRET set?
- [ ] Using test credentials?
- [ ] Correct test card number?

---

## 📊 VERIFICATION CHECKLIST

### Server Health
- [ ] Backend running on http://localhost:5000
- [ ] Health check: http://localhost:5000/health
- [ ] Frontend running on http://localhost:3000
- [ ] No console errors

### Database Tables
- [ ] users table exists
- [ ] students table exists
- [ ] admissions table exists
- [ ] fee_structures table exists
- [ ] payments table exists
- [ ] gallery table exists
- [ ] notices table exists
- [ ] contacts table exists

### API Endpoints
- [ ] POST /api/auth/register works
- [ ] POST /api/auth/login works
- [ ] GET /api/fees/structures works
- [ ] POST /api/admission/submit works
- [ ] POST /api/contact/submit works

### Frontend Pages
- [ ] Home page loads
- [ ] About page loads
- [ ] Admission form loads
- [ ] Fees page loads
- [ ] Gallery loads
- [ ] Contact page loads
- [ ] Login page loads
- [ ] Register page loads
- [ ] Dashboard loads (authenticated)
- [ ] 404 page works

---

## 🎯 COMMON ISSUES & SOLUTIONS

| Issue | Solution |
|-------|----------|
| Port 5000 already in use | Kill process: `lsof -ti:5000 \| xargs kill -9` |
| npm install fails | Clear cache: `npm cache clean --force` |
| Database connection refused | Start PostgreSQL service |
| CORS error | Check FRONTEND_URL in .env |
| Module not found | Delete node_modules, run npm install |
| Email won't send | Check Gmail App Password |
| Blank page loads | Check browser console for errors |
| API 404 error | Verify backend is running |

---

## 📝 IMPORTANT FILES TO CHECK

- [ ] backend/.env - Database & API credentials
- [ ] frontend/.env - API URL & Razorpay key
- [ ] backend/server.js - Server configuration
- [ ] frontend/src/App.js - Routes configuration
- [ ] backend/package.json - Dependencies
- [ ] frontend/package.json - Dependencies

---

## 🚀 DEPLOYMENT PREPARATION

- [ ] All tests passed
- [ ] No console errors
- [ ] Database backup created
- [ ] .env files configured
- [ ] Admin account created
- [ ] Frontend build tested: `npm run build`
- [ ] Backend start tested: `npm start`

---

## 📞 SUPPORT CONTACTS

- **Technical Support**: topviewpublicschool@gmail.com
- **Phone**: 9470525155
- **Documentation**: See README.md
- **Setup Guide**: See INSTALLATION_GUIDE.md

---

## ✅ FINAL VERIFICATION

Once all checkboxes are checked:
1. ✅ Application is running
2. ✅ Database is connected
3. ✅ All pages load
4. ✅ User registration works
5. ✅ Login works
6. ✅ Admission form works
7. ✅ Payment integration works
8. ✅ Contact form works
9. ✅ No errors in console
10. ✅ Ready for testing/deployment

**Status**: ✅ READY TO USE

---

**Last Updated**: February 2026  
**Version**: 1.0.0
