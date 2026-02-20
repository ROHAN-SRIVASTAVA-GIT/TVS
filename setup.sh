#!/bin/bash

# Top View Public School - Complete Setup Script
# This script sets up both backend and frontend

echo "=========================================="
echo "Top View Public School - Setup Started"
echo "=========================================="

# Backend Setup
echo ""
echo "[1/5] Setting up Backend..."
cd backend
npm install
echo "✓ Backend dependencies installed"

# Frontend Setup
echo ""
echo "[2/5] Setting up Frontend..."
cd ../frontend
npm install
echo "✓ Frontend dependencies installed"

# Create logs directory
echo ""
echo "[3/5] Creating logs directory..."
mkdir -p ../backend/logs
echo "✓ Logs directory created"

# Create uploads directory
echo ""
echo "[4/5] Creating uploads directory..."
mkdir -p ../backend/uploads
echo "✓ Uploads directory created"

echo ""
echo "[5/5] Setup complete!"
echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. PostgreSQL Setup:"
echo "   CREATE DATABASE top_view_school;"
echo ""
echo "2. Backend Configuration:"
echo "   - Navigate to backend folder"
echo "   - Update .env file with your credentials"
echo "   - Run: npm run dev"
echo ""
echo "3. Frontend Configuration:"
echo "   - Navigate to frontend folder"
echo "   - Update .env file with API URL"
echo "   - Run: npm start"
echo ""
echo "4. Access the application:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:5000"
echo ""
echo "=========================================="
echo "✓ Setup Complete!"
echo "=========================================="
