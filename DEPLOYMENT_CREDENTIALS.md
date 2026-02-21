# TVS - Deployment Credentials & Info

## PostgreSQL Database (Render)
- **Service ID**: dpg-d6cj3qh4tr6s73c7bqf0-a
- **Name**: tvps-db
- **Status**: Available
- **Region**: Oregon (US West)
- **PostgreSQL Version**: 18
- **Instance Type**: Free (256 MB RAM, 1 GB Storage)
- **Expiry**: March 23, 2026 (upgrade to paid to keep)

### Connection Details
- **Hostname**: dpg-d6cj3qh4tr6s73c7bqf0-a
- **Port**: 5432
- **Database**: tvps_db
- **Username**: tvps_db_user
- **Password**: [Check Render Dashboard]

### Database URL Format
```
postgresql://tvps_db_user:PASSWORD@dpg-d6cj3qh4tr6s73c7bqf0-a.tvps-db.svc.cluster.local:5432/tvps_db
```

---

## Next Steps

### 1. Deploy Backend on Render
Create a new Web Service on Render:
- **Name**: tvps-backend
- **Root Directory**: backend
- **Build Command**: npm install
- **Start Command**: npm start
- **Instance Type**: Free

### Environment Variables for Backend:
```
DATABASE_URL=postgresql://tvps_db_user:PASSWORD@dpg-d6cj3qh4tr6s73c7bqf0-a.tvps-db.svc.cluster.local:5432/tvps_db
JWT_SECRET=tvs-secret-key-2026
EMAIL_USER=topviewpublicschool@gmail.com
EMAIL_PASS=[Your-App-Password]
FRONTEND_URL=[Your-Vercel-URL]
```

### 2. Deploy Frontend on Vercel
- Import TVS repo
- Build Command: npm run build
- Output: build
- Add env: REACT_APP_API_URL=https://tvps-backend.onrender.com/api

---

## Important Notes
- Free PostgreSQL expires in ~1 month
- Upgrade to paid ($6/month) to keep database
- Both frontend and backend must be deployed for full functionality
