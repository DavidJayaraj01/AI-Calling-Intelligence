# 🚀 AI Call Intelligence - Render Deployment Guide

This guide will help you deploy your AI Call Intelligence platform to Render using native Python web service and static site hosting.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com)
3. **GitHub Repository**: Push your code to GitHub
4. **PostgreSQL Database**: We'll create this on Render

## 🏗️ Project Structure

Your project is already configured for Render deployment:
```
AI-Calling-Intelligence/
├── render.yaml              # Render configuration
├── backend/                 # Python FastAPI backend
│   ├── main.py             # Entry point
│   ├── requirements.txt    # Python dependencies
│   └── app/               # FastAPI application
├── frontend/              # React TypeScript frontend
│   ├── package.json       # Node.js dependencies
│   └── src/              # React application
└── README.md
```

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify files are present**:
   - ✅ `render.yaml` (Render configuration)
   - ✅ `backend/requirements.txt` (Python dependencies)
   - ✅ `frontend/package.json` (Node.js dependencies)

### Step 2: Create PostgreSQL Database on Render

1. **Go to Render Dashboard** → **New** → **PostgreSQL**
2. **Configure Database**:
   - **Name**: `ai-call-intelligence-db`
   - **Database**: `ai_call_intelligence`
   - **User**: `ai_call_user`
   - **Plan**: Starter (Free tier)
   - **Region**: Choose closest to your users
3. **Create Database** and note the connection details

### Step 3: Deploy Backend (Python Web Service)

1. **Go to Render Dashboard** → **New** → **Web Service**
2. **Connect Repository**: Select your GitHub repository
3. **Configure Service**:
   - **Name**: `ai-call-intelligence-backend`
   - **Environment**: `Python 3`
   - **Python Version**: `3.11` (IMPORTANT: Select 3.11, not 3.13)
   - **Build Command**: `pip install --upgrade pip && pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python main.py`
   - **Plan**: Starter (Free tier)
   - **Root Directory**: Leave empty (uses repo root)
4. **Environment Variables**:
   ```
   OPENAI_API_KEY=sk-your-openai-api-key-here
   DATABASE_URL=postgresql://user:password@host:port/database
   API_HOST=0.0.0.0
   API_PORT=8000
   DEBUG=false
   LOG_LEVEL=INFO
   SECRET_KEY=your-super-secret-key-here
   ```
5. **Advanced Settings**:
   - **Health Check Path**: `/health`
   - **Auto Deploy**: Yes
6. **Create Web Service**

### Step 4: Deploy Frontend (Static Site)

1. **Go to Render Dashboard** → **New** → **Static Site**
2. **Connect Repository**: Select your GitHub repository
3. **Configure Site**:
   - **Name**: `ai-call-intelligence-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Starter (Free tier)
4. **Environment Variables**:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
5. **Advanced Settings**:
   - **Auto Deploy**: Yes
6. **Create Static Site**

### Step 5: Update CORS Configuration

After both services are deployed, update the backend CORS settings:

1. **Go to Backend Service** → **Environment**
2. **Add Environment Variable**:
   ```
   ALLOWED_ORIGINS=["https://your-frontend-url.onrender.com"]
   ```
3. **Redeploy** the backend service

## 🔧 Configuration Details

### Backend Configuration (`backend/app/core/config.py`)

The backend is already configured to work with Render:
- ✅ PostgreSQL database support
- ✅ Environment variable configuration
- ✅ CORS middleware
- ✅ Health check endpoint
- ✅ Production logging

### Frontend Configuration (`frontend/src/services/api.ts`)

The frontend uses environment variables for API URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

### Render Configuration (`render.yaml`)

The `render.yaml` file defines:
- **Backend**: Python web service with PostgreSQL
- **Frontend**: Static site with build process
- **Database**: PostgreSQL with connection string

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**:
   - **Python 3.13 setuptools error**: 
     - **Solution 1**: Manually select Python 3.11 in Render dashboard (not 3.13)
     - **Solution 2**: Use simplified requirements.txt with flexible version ranges
     - **Solution 3**: Delete and recreate the service if Python version is stuck
   - **Python version**: Use Python 3.11 (specified in runtime.txt and .python-version)
   - **If still failing**: Try deploying without render.yaml, use manual configuration
   - Check `requirements.txt` for Python dependencies
   - Verify `package.json` for Node.js dependencies
   - Check build logs in Render dashboard

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` environment variable
   - Check PostgreSQL service is running
   - Ensure database credentials are correct

3. **CORS Issues**:
   - Update `ALLOWED_ORIGINS` with frontend URL
   - Redeploy backend after CORS changes

4. **OpenAI API Issues**:
   - Verify `OPENAI_API_KEY` is set correctly
   - Check API key has sufficient credits
   - Monitor API usage in OpenAI dashboard

### Health Checks

- **Backend Health**: `https://your-backend.onrender.com/health`
- **API Documentation**: `https://your-backend.onrender.com/docs`
- **Frontend**: `https://your-frontend.onrender.com`

## 📊 Monitoring

### Render Dashboard
- Monitor service health and logs
- Check resource usage
- View deployment history

### Application Logs
- Backend logs: Available in Render dashboard
- Frontend logs: Browser developer console
- Database logs: PostgreSQL service logs

## 🔄 Updates and Maintenance

### Updating the Application
1. **Push changes** to GitHub
2. **Render auto-deploys** (if enabled)
3. **Monitor deployment** in dashboard

### Environment Variables
- Update in Render dashboard
- Changes require service restart
- Backend redeploys automatically

### Database Migrations
- Database tables are created automatically on startup
- No manual migration needed for initial deployment

## 💰 Cost Considerations

### Free Tier Limits
- **Web Service**: 750 hours/month
- **Static Site**: 100GB bandwidth/month
- **PostgreSQL**: 1GB storage, 1GB RAM

### Scaling Options
- Upgrade to paid plans for more resources
- Consider separate services for high traffic
- Monitor usage in Render dashboard

## 🎉 Success!

Once deployed, your AI Call Intelligence platform will be available at:
- **Frontend**: `https://your-frontend.onrender.com`
- **Backend API**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`

The platform includes:
- ✅ OpenAI-powered call analysis
- ✅ Real-time sentiment analysis
- ✅ Action item generation
- ✅ Dashboard analytics
- ✅ PostgreSQL database
- ✅ Production-ready configuration

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **React Documentation**: [react.dev](https://react.dev)
- **OpenAI API**: [platform.openai.com](https://platform.openai.com)
