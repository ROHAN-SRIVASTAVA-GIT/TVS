# Deployment Guide

## Frontend - Deploy to Vercel (Free)

1. **Push your code to GitHub** (already done)

2. **Go to [vercel.com](https://vercel.com) and sign up**

3. **Import your GitHub repository**
   - Click "Add New Project" → Select "TVS" repository

4. **Configure project**
   - Framework Preset: React
   - Build Command: npm run build
   - Output Directory: build

5. **Add Environment Variables**
   ```
   REACT_APP_API_URL=https://your-backend-url.com/api
   ```

6. **Deploy** - Click Deploy!

---

## Backend + Database - Deploy to Render.com (Free)

1. **Go to [render.com](https://render.com) and sign up with GitHub**

2. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: tvps-db
   - Free tier will be auto-selected
   - Note the connection string (postgresql://...)

3. **Create Web Service for Backend**
   - New → Web Service
   - Connect your GitHub repo
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
   - Add Environment Variables:
     ```
     DATABASE_URL: (paste the PostgreSQL connection string)
     JWT_SECRET: your-secret-key-min-32-chars
     EMAIL_USER: your-email@gmail.com
     EMAIL_PASS: your-app-password
     FRONTEND_URL: https://your-vercel-frontend.vercel.app
     ```

4. **Deploy** - Wait 2-3 minutes

---

## After Deployment

1. **Update frontend** `REACT_APP_API_URL` to your Render backend URL (e.g., `https://tvps-backend.onrender.com/api`)

2. **Test your deployed app!**

---

## Important Notes

- **Vercel**: Frontend only, builds automatically on Git push
- **Render**: Backend + Database, free tier has some limits but works well
- **Database**: Render's free PostgreSQL has 90-day expiry but can be extended

## Alternative: All-in-One with Railway

You can also use Railway (railway.app) - it has both frontend and backend deployment with PostgreSQL in one place. Free tier includes $5 credit/month.
