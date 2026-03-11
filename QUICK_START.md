# QUICK START GUIDE

## 🚀 5-Minute Quick Start

### Prerequisites Check
- Node.js installed? `node --version`
- PostgreSQL running? 
- Git available?

### Step 1: Clone/Download Project
```bash
cd top-view-public-school
```

### Step 2: Setup Database
```sql
-- Open PostgreSQL
createdb top_view_school
```

### Step 3: Backend Setup
```bash
cd backend
npm install
# Edit .env with your credentials
npm run dev
```

### Step 4: Frontend Setup (New Terminal)
```bash
cd frontend
npm install
# Edit .env if needed
npm start
```

### Step 5: Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

---

## 📋 Default Credentials

### Test User
```
Email: parent@example.com
Password: Test@12345
```

### Admin (Create Your Own)
- Use registration form to create admin account
- Or update role in database

---

## 🔧 Environment Variables

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=top_view_school
DB_USER=postgres
DB_PASSWORD=root
JWT_SECRET=top_view_school_secret_2024
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

---

## 📚 Key Features

✅ **User Management**
- Registration & Login
- Role-based access (parent, student, admin)
- Profile management

✅ **Admission**
- Multi-step admission form
- Photo upload
- Admission status tracking

✅ **Fees & Payments**
- Fee structure by class (NUR to 8)
- Online payment via Razorpay
- Payment history

✅ **Gallery & Notices**
- School image gallery
- Latest announcements
- Event notices

✅ **Admin Panel**
- Dashboard with statistics
- Manage users and admissions
- Payment tracking

---

## 🛠️ Common Commands

### Backend
```bash
npm run dev      # Start development server
npm start        # Start production server
npm run seed     # Seed sample data
npm run migrate  # Run migrations
```

### Frontend
```bash
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

---

## 🔒 Security Features

- JWT authentication
- Password hashing with bcryptjs
- Input validation & sanitization
- Rate limiting
- CORS protection
- XSS prevention

---

## 📞 Support

- **Email**: topviewpublicschool@gmail.com
- **Phone**: 9470525155 | 9199204566 | 8797207811 | 7857006144
- **Location**: Manju Sadan Basdiha, Panki, Palamu, Jharkhand

---

## 🎓 Classes Offered

NUR, LKG, UKG, I, II, III, IV, V, VI, VII, VIII

---

## 💾 Database Tables

- users
- students
- admissions
- fee_structures
- payments
- gallery
- notices
- contacts

---

## 🌐 API Documentation

Base URL: `http://localhost:5000/api`

### Main Endpoints
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `POST /admission/submit` - Submit admission
- `GET /fees/structures` - Get fee structures
- `POST /payments/create-order` - Create payment
- `GET /gallery` - Get gallery images
- `GET /notices` - Get announcements
- `POST /contact/submit` - Send message

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Configure database
3. ✅ Set environment variables
4. ✅ Start backend & frontend
5. ✅ Create admin account
6. ✅ Test all features
7. ✅ Deploy to production

---

## 📱 Mobile Responsive

- Fully responsive design
- Mobile-friendly interface
- Touch-optimized buttons
- Adaptive layouts

---

## 🚀 Deployment Ready

- Production-grade code
- Security best practices
- Error handling
- Logging system
- Database optimization

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: Production Ready ✅
