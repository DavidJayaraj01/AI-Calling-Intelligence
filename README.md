# 🚀 AI Call Intelligenc### 🛠️ **Technical Excellence**
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Production) + SSL Support
- **AI/ML**: 
  - **Local Models** (1.2GB total):
    - `all_MiniLM_L6_v2` (88M) - Sentence embeddings
    - `multilingual_sentiment_model` (521M) - Sentiment analysis
    - `roberta_finetuned` (477M) - Pain point extraction
    - `s2t_small_librispeech` (114M) - Speech recognition backup
  - **Ollama Llama3:8b** - Action item generation
  - **Google Speech Recognition** - Free transcription (no API key)
- **Audio Processing**: SpeechRecognition + pydub + ffmpeg
- **Authentication**: JWT-based secure authentication system
- **Deployment**: Production-ready on Render with auto-scaling
- **Performance**: Optimized bundle sizes and lightning-fast API responsesorm

> **🌟 Live Demo**: [Frontend](https://conversa-ai.onrender.com) | [Backend API](https://ai-calling-intelligence.onrender.com) | [API Docs](https://ai-calling-intelligence.onrender.com/docs)

A comprehensive AI-powered platform for analyzing vendor-distributor conversations, extracting pain points, generating action items, and providing intelligent insights using **local AI models** and **Ollama Llama3**. **No API keys required** - all AI processing runs locally for maximum privacy and zero usage costs.

## 🎯 Key Features

### 🤖 **Local AI Engine** (No API Keys Required!)
- **🎙️ Speech-to-Text**: Google Speech Recognition (free, no API key needed) for accurate transcriptions
- **🧠 Pain Point Extraction**: Local RoBERTa model for intelligent issue identification
- **😊 Sentiment Analysis**: Local multilingual sentiment model with confidence scores
- **✅ Action Item Generation**: Ollama Llama3:8b for smart task creation
- **💡 Solution Matching**: Local sentence transformers for semantic search
- **📊 QBR Generation**: Automated Quarterly Business Review reports
- **🔒 100% Private**: All processing happens locally, your data never leaves your server

### � **Dashboard & Analytics**
- **Real-time Metrics**: Live KPIs and performance indicators
- **Interactive Charts**: Recharts-powered visualizations with responsive design
- **Call History**: Comprehensive call management and detailed analytics
- **Smart Notifications**: Automated alerts for action items and deadlines
- **QBR Management**: Full quarterly business review lifecycle

### �️ **Technical Excellence**
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Production) + SQLite (Development)
- **AI/ML**: OpenAI GPT-4o-mini + Whisper + text-embedding-3-small
- **Authentication**: JWT-based secure authentication system
- **Deployment**: Production-ready on Render with auto-scaling
- **Performance**: Optimized bundle sizes and API response times

### 🔒 **Security & Scalability**
- **CORS Protection**: Configured for secure cross-origin requests
- **JWT Authentication**: Secure token-based authentication
- **Environment Management**: Secure configuration management
- **Database Security**: PostgreSQL with proper indexing and relationships
- **Error Handling**: Comprehensive error logging and user feedback

## 🏗️ Architecture

### Backend Structure
```
backend/
├── main.py                 # Entry point (python main.py)
├── app/
│   ├── main.py            # FastAPI application
│   ├── api/               # API route handlers
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── calls.py       # Call management endpoints
│   │   ├── action_items.py # Action item endpoints
│   │   ├── recording.py   # Real-time recording
│   │   ├── qbr.py         # QBR report generation
│   │   └── model_test.py  # AI model testing
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings and environment
│   │   ├── database.py    # PostgreSQL connection + SSL
│   │   └── security.py    # JWT and security utilities
│   ├── models/            # SQLAlchemy database models + AI models
│   │   ├── user.py        # User model
│   │   ├── recording.py   # Recording model
│   │   ├── all_MiniLM_L6_v2/              # Sentence embeddings (88M)
│   │   ├── multilingual_sentiment_model/  # Sentiment analysis (521M)
│   │   ├── roberta_finetuned/             # Pain point extraction (477M)
│   │   └── s2t_small_librispeech/         # Speech-to-text backup (114M)
│   ├── schemas/           # Pydantic request/response schemas
│   └── services/          # AI/ML services
│       ├── minimal_speech_to_text_service.py  # Google Speech Recognition
│       ├── sentiment_service.py              # Local sentiment analysis
│       ├── action_item_service.py            # Ollama Llama3 integration
│       ├── minimal_pain_point_service.py     # Pain point extraction
│       ├── recording_service.py              # Real-time recording
│       └── qbr_generation_service.py         # QBR report generation
├── logs/                  # Application logs
├── .env                   # Environment variables (NO API KEYS!)
├── requirements.txt       # Python dependencies
└── setup_models.py        # Automated model download script
```

### Frontend Structure
```
frontend/src/
├── components/            # Reusable UI components
│   ├── layout/           # Layout components (Navbar, Sidebar, Layout)
│   ├── ui/               # UI primitives (Button, Card, Input, etc.)
│   ├── AIPipeline.tsx    # AI processing pipeline
│   ├── AudioTranscription.tsx  # Audio upload & transcription
│   ├── LiveRecording.tsx       # Real-time recording component
│   ├── ModelTestResults.tsx    # AI model test results
│   └── ErrorBoundary.tsx       # Error handling
├── pages/                 # Application pages/routes
│   ├── Dashboard.tsx            # Main dashboard
│   ├── DashboardReal.tsx        # Real data dashboard
│   ├── CallsPage.tsx            # Call management
│   ├── CallDetailPage.tsx       # Call details view
│   ├── CallAnalysisPage.tsx     # AI analysis interface
│   ├── CallAnalysisPageReal.tsx # Real AI analysis
│   ├── ActionItemsPage.tsx      # Action items management
│   ├── ModelTestPage.tsx        # AI model testing interface
│   ├── QBRPage.tsx             # QBR management
│   ├── SentimentTimelinePage.tsx # Sentiment visualization
│   └── NotificationsPage.tsx    # Notifications center
├── services/              # API integration
│   ├── api.ts            # Main API service
│   └── realApi.ts        # Real data API service
├── contexts/              # React context providers
│   └── AuthContext.tsx   # Authentication context
├── types/                 # TypeScript type definitions
│   ├── index.ts          # General types
│   └── realData.ts       # Real data types
├── data/                  # Static data
│   └── mockData.ts       # Mock data for development
└── utils/                 # Utility functions
    └── cn.ts             # Tailwind class utilities
```

## 🚀 Quick Start

> **💡 Tip**: Check out the [live demo](https://conversa-ai.onrender.com) before setting up locally!

### 📋 Prerequisites
- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend) 
- **Ollama** (for action item generation) - [Download Here](https://ollama.com/)
- **ffmpeg** (for audio processing) - Required for audio file conversion
- **PostgreSQL** (production) or use existing Render database
- **Git** (for cloning)
- **1.5GB+ free disk space** (for AI models)

### 🔧 **One-Time Setup: Ollama Installation**

The system uses **Ollama Llama3:8b** for action item generation. Install once:

```bash
# Install Ollama (choose your OS)
# macOS/Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Or download from: https://ollama.com/download

# Pull the Llama3 model (one-time, ~4.7GB)
ollama pull llama3:8b

# Start Ollama service (runs in background)
ollama serve
```

### 📦 **Install ffmpeg** (Required for Audio Processing)

```bash
# Ubuntu/Debian
sudo apt-get install ffmpeg

# macOS  
brew install ffmpeg

# Windows
# Download from: https://ffmpeg.org/download.html
```

### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/Klassy01/AI-Calling-Intelligence.git
cd AI-Calling-Intelligence
```

### 2️⃣ **Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# AI Models will download automatically on first run (~1.2GB)
# Or manually run the setup script:
python setup_models.py

# Configure environment
cp .env.example .env

# Edit .env - No API keys needed! Just verify database settings:
# DATABASE_URL=postgresql://your-db-url (or use provided Render DB)
# OLLAMA_BASE_URL=http://localhost:11434 (default)
# OLLAMA_MODEL=llama3:8b

# Make sure Ollama is running
ollama serve

# Start the backend server
python main.py
```

**Backend URLs:**
- 🌐 **API**: http://localhost:8000
- 📖 **API Documentation**: http://localhost:8000/docs
- ❤️ **Health Check**: http://localhost:8000/health

**Note**: On first run, AI models will be downloaded automatically. This is a one-time process taking ~5-10 minutes depending on your internet speed.

### 3️⃣ **Frontend Setup**
```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env to point to your backend:
# VITE_API_URL=http://localhost:8000

# Start development server
npm run dev
```

**Frontend URL:**
- 🚀 **Application**: http://localhost:5173

### 4️⃣ **Verify Setup**
1. Open http://localhost:5173 in your browser
2. Try the "AI Model Testing" page
3. Upload an audio file or enter sample text
4. Watch the AI analyze and extract insights! 🎉

## ⚡ **Local AI Models & Zero Cost**

This platform uses **100% local AI models** - no API keys, no usage costs, complete privacy!

### 🧠 **AI Models Used**
- **🎙️ Google Speech Recognition**: Free speech-to-text (no API key required)
- **🤖 Ollama Llama3:8b**: Local language model for action items (~4.7GB, runs on your machine)
- **😊 Multilingual Sentiment**: Local transformer model (521MB)
- **🧠 RoBERTa Fine-tuned**: Pain point extraction (477MB)
- **🔍 Sentence Transformers**: Semantic search (88MB)
- **🎤 Speech-to-Text Backup**: Local Whisper-based model (114MB)

### 💰 **Cost Comparison**

| Feature | This Solution (Local) | Cloud AI (OpenAI) | Savings |
|---------|----------------------|-------------------|---------|
| **Transcription** (5 min) | **FREE** | $0.03 | $30/month* |
| **Analysis** (~5K tokens) | **FREE** | $0.003 | $3/month* |
| **Embeddings** (~1K tokens) | **FREE** | $0.00002 | $0.02/month* |
| **Action Items** (LLM) | **FREE** | $0.01 | $10/month* |
| **Total per call** | **$0.00** | $0.04 | **100% savings** |
| **Monthly (1000 calls)** | **$0.00** | $43.02 | **$516/year** |

_* Based on 1000 calls/month_

### 🏆 **Why Local Models?**
- ✅ **Zero Cost**: No per-call charges, no API billing
- ✅ **100% Private**: Your data never leaves your server
- ✅ **No Rate Limits**: Process unlimited calls
- ✅ **Offline Capable**: Works without internet (after initial setup)
- ✅ **Customizable**: Fine-tune models for your specific use case
- ✅ **No Vendor Lock-in**: Complete control over your infrastructure

### 🔒 **Privacy First**
- All AI processing happens locally on your server
- No data sent to third-party APIs
- Full GDPR and data privacy compliance
- Perfect for sensitive business conversations

### ⚙️ **System Requirements**
- **RAM**: 8GB minimum (16GB recommended for optimal performance)
- **Storage**: 10GB free space (for models and processing)
- **CPU**: Modern multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **GPU**: Optional but recommended for faster processing
- **Internet**: Required only for initial model download

## 🔧 **Development Guide**

### 🏗️ **Architecture Explained**

#### **Why Two `main.py` Files?**
The backend follows FastAPI best practices with clear separation:

```
backend/
├── main.py              # 🚀 Entry point (python main.py)
└── app/
    ├── main.py          # 🏗️ FastAPI application core
    ├── api/             # 🛣️ Route handlers
    ├── core/            # ⚙️ Configuration & database
    ├── models/          # 📊 Database models
    ├── schemas/         # 📝 Pydantic schemas
    └── services/        # 🤖 AI/ML services
```

**Benefits:**
- ✅ **Clean Architecture**: Separation of concerns
- ✅ **Easy Testing**: Import `app` directly for tests  
- ✅ **Flexible Deployment**: Multiple server options
- ✅ **Development Friendly**: Simple `python main.py` startup

#### **Alternative Server Start**
```bash
# Method 1: Simple start
python main.py

# Method 2: Direct uvicorn (more control)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Method 3: Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 🗄️ **Database Architecture**

**Development**: SQLite (zero setup) → **Production**: PostgreSQL (scalable)

#### **Key Features:**
- ✅ **Cross-Database Compatibility**: Works with SQLite + PostgreSQL
- ✅ **Auto-Migration**: Tables created automatically on startup
- ✅ **Relationship Mapping**: Proper foreign keys and joins
- ✅ **UUID Support**: Cross-database unique identifiers
- ✅ **JSON Fields**: Flexible metadata storage

#### **Models Overview:**
```python
Call → PainPoint → ActionItem
  ↓
AnalyticsSnapshot (for dashboards)
```

### 🌍 **Environment Configuration**

#### **Backend** (`/backend/.env`):
```env
# 🌐 API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
PROJECT_NAME=AI Call Intelligence API
VERSION=1.0.0

# 🗄️ Database (PostgreSQL - Production Ready)
DATABASE_URL=postgresql://user:pass@host:port/db
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database
POSTGRES_HOST=your_host
POSTGRES_PORT=5432

# 🤖 Ollama Configuration (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# 📂 Local AI Model Paths (Auto-configured)
ROBERTA_MODEL=app/models/roberta_finetuned
SENTIMENT_MODEL=app/models/multilingual_sentiment_model
VECTOR_MODEL=app/models/all_MiniLM_L6_v2
STT_LOCAL_MODEL=app/models/s2t_small_librispeech

# 🔒 Security
SECRET_KEY=your-super-secret-key-change-this-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 📝 Logging
LOG_LEVEL=INFO
```

**Important Notes:**
- ✅ **No API keys required!** All AI runs locally
- ✅ Model paths are auto-configured relative to backend directory
- ✅ Ollama must be running: `ollama serve`
- ✅ Database URL can use provided Render PostgreSQL or your own

#### **Frontend** (`/frontend/.env`):
```env
# 🔗 API Connection
VITE_API_URL=http://localhost:8000

# 📱 App Configuration
VITE_APP_NAME=AI Call Intelligence Platform
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
```

## 📡 **API Reference**

> 📖 **Interactive Docs**: Visit `/docs` endpoint for full Swagger documentation

### 🔐 **Authentication**
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| `POST` | `/api/auth/login` | User login with JWT | ✅ Active |
| `POST` | `/api/auth/register` | User registration | ✅ Active |
| `GET` | `/api/auth/me` | Get current user profile | ✅ Active |

### 🎙️ **Audio Processing** (Local AI)
| Method | Endpoint | Description | Features |
|--------|----------|-------------|----------|
| `POST` | `/api/calls/transcribe` | Audio → text transcription | Google Speech Recognition (free) |
| `POST` | `/api/models/process-real-data` | Complete audio analysis pipeline | Full AI processing with local models |
| `POST` | `/api/recording/start` | Start real-time recording | Live transcription + analysis |
| `POST` | `/api/recording/stop` | Stop recording & process | Saves recording + generates insights |

### 📞 **Call Management**
| Method | Endpoint | Description | Returns |
|--------|----------|-------------|---------|
| `GET` | `/api/calls` | List calls with pagination | Call list + metadata |
| `GET` | `/api/calls/{id}` | Get detailed call info | Full call + analysis |
| `POST` | `/api/calls` | Create new call record | Call details |
| `DELETE` | `/api/calls/{id}` | Delete call | Success confirmation |

### ✅ **Action Items** (Ollama Llama3 Generated)
| Method | Endpoint | Description | AI Features |
|--------|----------|-------------|-------------|
| `GET` | `/api/action-items` | List action items | Smart filtering + priority |
| `GET` | `/api/action-items/{id}` | Get action item details | Full context + history |
| `PATCH` | `/api/action-items/{id}/status` | Update status | Progress tracking |
| `DELETE` | `/api/action-items/{id}` | Delete action item | Soft delete support |

### 📊 **Analytics & Dashboard**
| Method | Endpoint | Description | Returns |
|--------|----------|-------------|---------|
| `GET` | `/api/dashboard` | Dashboard metrics | Real-time KPIs |
| `GET` | `/api/qbr/generate` | Generate QBR report | Quarterly business review |
| `GET` | `/api/calls/analytics/dashboard` | Call analytics | Detailed metrics |

### 🧪 **AI Model Testing**
| Method | Endpoint | Description | Models Used |
|--------|----------|-------------|-------------|
| `GET` | `/api/models/model-status` | Check model availability | All local models |
| `POST` | `/api/models/test` | Test specific AI model | Selected model |

### 🔍 **System Health**
| Method | Endpoint | Description | Purpose |
|--------|----------|-------------|---------|
| `GET` | `/health` | Basic health check | Monitoring |
| `GET` | `/api/health` | Detailed health status | Service diagnostics |

## 🤖 AI/ML Models

### Pain Point Extraction
- **Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Purpose**: Emotion analysis to identify customer concerns
- **Fallback**: Keyword-based analysis if model unavailable

### Sentiment Analysis
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Purpose**: Multi-language sentiment analysis
- **Output**: Positive/Negative/Neutral with confidence scores

### Action Item Generation
- **Integration**: OpenAI API (with fallback to local analysis)
- **Purpose**: Generate actionable items from call insights

### Vector Embeddings
- **Model**: `all-MiniLM-L6-v2` (Sentence Transformers)
- **Purpose**: Semantic search and solution matching

## 🔒 Security

- JWT-based authentication
- CORS configuration for frontend integration
- Environment-based configuration
- Password hashing with bcrypt

## 📈 Production Deployment

### Backend
1. Set up PostgreSQL database
2. Update environment variables for production
3. Configure proper secret keys and API tokens
4. Deploy using Docker, Heroku, or cloud services

### Frontend
1. Build for production: `npm run build`
2. Deploy to Vercel, Netlify, or cloud services
3. Update API endpoints in environment config

## 🐛 Troubleshooting

### Common Issues

1. **Database UUID Error**: Fixed with cross-database UUID implementation
2. **Model Loading Issues**: Models download automatically on first run
3. **CORS Issues**: Pre-configured for local development
4. **Port Conflicts**: Backend (8000), Frontend (5173)

### Logs
Backend logs are available in `/backend/logs/app.log`

## 🚀 **Production Deployment**

### 🌐 **Live Deployment** (Current)
- **Frontend**: https://conversa-ai.onrender.com
- **Backend**: https://ai-calling-intelligence.onrender.com  
- **API Docs**: https://ai-calling-intelligence.onrender.com/docs

### ☁️ **Deployment Platforms**

#### **Render** (Current Setup)
```yaml
# render.yaml configuration for one-click deploy
services:
  - type: web
    name: ai-calling-intelligence-backend
    env: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && python main.py
    
  - type: web  
    name: ai-calling-intelligence-frontend
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: frontend/dist
```

#### **Other Platforms**
- **Vercel/Netlify**: Frontend static hosting
- **Railway/Heroku**: Full-stack deployment
- **AWS/GCP/Azure**: Enterprise cloud deployment
- **Docker**: Containerized deployment

### 🔧 **Production Environment Setup**

1. **Set Environment Variables**:
   ```bash
   OPENAI_API_KEY=sk-prod-key
   DATABASE_URL=postgresql://prod-db-url
   SECRET_KEY=secure-production-key
   DEBUG=false
   ```

2. **Database Migration**:
   ```bash
   # PostgreSQL setup is automatic
   # Tables created on first startup
   ```

3. **Security Checklist**:
   - ✅ Change default secret keys
   - ✅ Use environment variables for sensitive data
   - ✅ Enable HTTPS
   - ✅ Configure CORS properly
   - ✅ Set up monitoring and logging

## 🐛 **Troubleshooting**

### 🔧 **Common Issues & Solutions**

| Problem | Solution | Prevention |
|---------|----------|------------|
| **CORS Errors** | Update `ALLOWED_ORIGINS` in backend config | Use proper frontend URL |
| **OpenAI API Errors** | Check API key and billing | Monitor usage limits |
| **Database Connection** | Verify DATABASE_URL format | Test connection string |
| **Build Failures** | Check Node/Python versions | Use exact version requirements |
| **Import Errors** | Check package installation | Use virtual environments |

### 📊 **Monitoring & Logs**

#### **Backend Logs**:
```bash
# Local development
tail -f backend/logs/app.log

# Production (Render)
# View in Render dashboard logs section
```

#### **Health Checks**:
```bash
# Backend health
curl http://localhost:8000/health

# Full API status  
curl http://localhost:8000/api/health
```

## 🤝 **Contributing**

### 🔄 **Development Workflow**
1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Make** your changes
5. **Test** thoroughly (backend + frontend)
6. **Commit** with clear messages
7. **Push** to your fork
8. **Submit** a Pull Request

### 📝 **Coding Standards**
- **Backend**: Follow FastAPI + SQLAlchemy patterns
- **Frontend**: Use TypeScript, ESLint, and Prettier
- **Documentation**: Update README files for new features
- **Testing**: Add tests for new functionality

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Success! Your AI Call Intelligence Platform is Ready!**

### 🌐 **Local Development**
Both servers should now be running:
- 🚀 **Frontend**: http://localhost:5173
- 📊 **Backend API**: http://localhost:8000
- 📖 **API Documentation**: http://localhost:8000/docs
- ❤️ **Health Check**: http://localhost:8000/health

### ☁️ **Production Deployment**
Live platform available at:
- 🌟 **Application**: https://conversa-ai.onrender.com
- 🔗 **API**: https://ai-calling-intelligence.onrender.com
- 📚 **API Docs**: https://ai-calling-intelligence.onrender.com/docs

### 🚀 **What's Next?**
1. **Upload an audio file** or enter sample text
2. **Watch the AI** extract pain points and generate action items
3. **Explore the dashboard** for analytics and insights
4. **Customize** for your specific use case

**Happy Analyzing!** 🎯✨
