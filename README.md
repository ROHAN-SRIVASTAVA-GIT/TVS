# Top View Public School - Full Stack Application

A comprehensive full-stack school management system built with Node.js/Express backend and React frontend.

## Project Overview

This is a complete production-level application for managing school operations including:
- Student admission and management
- Fee structure and online payments (Razorpay)
- Gallery and announcements
- Notice board and faculty management
- User authentication and authorization
- Admin dashboard with statistics

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **Razorpay** payment gateway
- **Nodemailer** for email notifications
- **Winston** for logging
- **Joi** for validation

### Frontend
- **React 18** with React Router
- **Axios** for API calls
- **CSS3** with responsive design
- **Context API** for state management

## Project Structure

```
├── backend/
│   ├── config/         (Database, Logger, Razorpay)
│   ├── middleware/     (Auth, Validation, Error Handling)
│   ├── models/         (Database Models)
│   ├── routes/         (API Routes)
│   ├── controllers/    (Business Logic)
│   ├── validators/     (Input Validation)
│   ├── utils/          (Helpers, Email Service)
│   └── server.js       (Main Server File)
└── frontend/
    ├── src/
    │   ├── components/ (Reusable Components)
    │   ├── pages/      (Page Components)
    │   ├── context/    (Auth Context)
    │   ├── api/        (Axios Configuration)
    │   └── utils/      (Constants & Helpers)
    └── public/         (Static Files)
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with configuration:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=top_view_school
   DB_USER=postgres
   DB_PASSWORD=root
   JWT_SECRET=your_jwt_secret
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

4. Create PostgreSQL database:
   ```sql
   CREATE DATABASE top_view_school;
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_RAZORPAY_KEY_ID=your_key_id
   ```

4. Start the frontend application:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Admission
- `POST /api/admission/submit` - Submit admission form
- `GET /api/admission/my-admissions` - Get user's admissions
- `GET /api/admission/:id` - Get specific admission

### Fees
- `GET /api/fees/structures` - Get all fee structures
- `GET /api/fees/class/:className` - Get fee for specific class
- `POST /api/fees/structure` - Create fee structure (Admin)

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history

### Gallery
- `GET /api/gallery` - Get all gallery images
- `GET /api/gallery/category/:category` - Get images by category
- `POST /api/gallery/upload` - Upload image (Admin)

### Notices
- `GET /api/notices` - Get all notices
- `POST /api/notices` - Create notice (Admin)

### Contact
- `POST /api/contact/submit` - Submit contact form
- `GET /api/contact` - Get all contacts (Admin)

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/admissions` - Get all admissions

## Features

### For Students & Parents
- ✅ User registration and authentication
- ✅ Online admission application with photo upload
- ✅ View fee structures by class
- ✅ Online fee payment via Razorpay
- ✅ Access to admission history
- ✅ View school gallery
- ✅ Check notices and announcements
- ✅ Contact school administration
- ✅ Personal dashboard

### For Administration
- ✅ Admin dashboard with statistics
- ✅ Manage admissions (approve/reject)
- ✅ Manage fee structures
- ✅ View all payments
- ✅ Manage gallery
- ✅ Post notices and announcements
- ✅ Manage contact requests
- ✅ User management

### Security Features
- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Input validation and sanitization
- ✅ Rate limiting
- ✅ CORS security
- ✅ Helmet.js for HTTP headers
- ✅ XSS protection

## Database Schema

### Users Table
```sql
- id (Primary Key)
- email (Unique)
- password (Hashed)
- first_name, last_name
- phone
- role (parent, student, teacher, admin)
- status (active/inactive)
- avatar
- timestamps
```

### Students Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- roll_number
- class, section
- date_of_birth, gender
- aadhaar_number, blood_group
- timestamps
```

### Admissions Table
```sql
- id (Primary Key)
- user_id (Foreign Key)
- student_name, parent info
- addresses (corresponding, permanent)
- admission_class, academic_year
- form_number, admission_number
- status (pending, approved, rejected)
- timestamps
```

### Payments Table
```sql
- id (Primary Key)
- user_id, student_id (Foreign Keys)
- razorpay_order_id, razorpay_payment_id
- amount, fee_type, class
- status, transaction_date
- timestamps
```

## Environment Configuration

### Backend (.env)
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
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

## Running the Application

### Development Mode

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

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## Production Deployment

### Backend (Railway/Render)
1. Create account on Railway or Render
2. Connect GitHub repository
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy build folder to Vercel or Netlify

## Testing

### Test Registration
```bash
Email: test@example.com
Password: Test@12345
```

### Test Admin Login
```bash
Email: admin@school.com
Password: Admin@12345
```

## Troubleshooting

### Database Connection Error
- Ensure PostgreSQL is running
- Check credentials in .env
- Verify database name exists

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### CORS Error
- Check frontend URL in backend .env
- Ensure CORS is properly configured in Express

## Contributing

Guidelines for contributing:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, contact:
- Email: topviewpublicschool@gmail.com
- Phone: 9470525155

## Author

Top View Public School Management System
Created with ❤️ for education

---

**Last Updated:** February 2026
**Version:** 1.0.0
