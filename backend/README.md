# 🚀 AI Call Intelligence - Backend API

> **Production API**: https://ai-calling-intelligence.onrender.com  
> **API Docs**: https://ai-calling-intelligence.onrender.com/docs  
> **Health Check**: https://ai-calling-intelligence.onrender.com/health

A high-performance FastAPI backend powered by OpenAI's cutting-edge AI models for intelligent call analysis and insights generation.

## 🌟 **Key Features**

### 🤖 **OpenAI Integration**
- **Whisper API**: Industry-leading speech-to-text transcription
- **GPT-4o-mini**: Advanced text analysis and insight generation
- **text-embedding-3-small**: Semantic search and vector operations
- **Real-time Processing**: Async operations for optimal performance

### 🏗️ **Architecture**
- **FastAPI**: Modern, fast web framework with automatic API documentation  
- **SQLAlchemy**: Powerful ORM with PostgreSQL/SQLite support
- **Pydantic**: Data validation and serialization
- **JWT Authentication**: Secure token-based authentication
- **Async/Await**: Non-blocking operations for high concurrency

### 🔧 **Production Ready**
- **Auto-scaling**: Ready for cloud deployment
- **Health Monitoring**: Built-in health checks and monitoring
- **Error Handling**: Comprehensive error logging and user feedback
- **CORS Support**: Configured for frontend integration
- **Environment Management**: Secure configuration handling

## 🚀 **Quick Start**

### 📋 **Prerequisites**
- Python 3.11+
- OpenAI API Key
- PostgreSQL (production) or SQLite (development)

### 🛠️ **Installation**

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

# Configure environment
cp .env.example .env
# Edit .env with your settings (see Configuration section)

# Start the server
python main.py
```

### 🌐 **Server URLs**
- **API Base**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## ⚙️ **Configuration**

### 🔧 **Environment Variables** (`.env`)

```env
# 🌐 API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
PROJECT_NAME=AI Call Intelligence API
VERSION=1.0.0

# 🗄️ Database Configuration
# Development (SQLite)
DATABASE_URL=sqlite:///./ai_call_intelligence.db

# Production (PostgreSQL)
# DATABASE_URL=postgresql://user:password@host:port/database

# 🤖 OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_WHISPER_MODEL=whisper-1  
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# 🔒 Security Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 📝 Logging Configuration
LOG_LEVEL=INFO
LOG_FILE=logs/app.log

# 🌍 CORS Configuration (handled automatically)
# ALLOWED_ORIGINS is configured in code for flexibility
```

### 🔑 **Getting OpenAI API Key**
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add it to your `.env` file
4. Ensure you have sufficient credits/billing set up

## 🏗️ **Project Structure**

```
backend/
├── main.py                     # 🚀 Application entry point
├── requirements.txt            # 📦 Python dependencies
├── runtime.txt                 # 🐍 Python version specification
├── .env.example               # 📋 Environment template
├── .env                       # 🔐 Environment variables (create this)
│
├── app/                       # 🏗️ Main application package
│   ├── main.py               # 🌐 FastAPI application core
│   │
│   ├── api/                  # 🛣️ API route handlers
│   │   ├── auth.py          # 🔐 Authentication endpoints
│   │   ├── audio.py         # 🎙️ Audio processing (OpenAI Whisper)
│   │   ├── calls_real.py    # 📞 Call management endpoints
│   │   └── action_items_real.py # ✅ Action items management
│   │
│   ├── core/                 # ⚙️ Core configuration
│   │   ├── config.py        # 🔧 Settings and environment config
│   │   ├── database.py      # 🗄️ Database connection and session
│   │   └── security.py      # 🔒 JWT and password utilities
│   │
│   ├── models/               # 📊 SQLAlchemy database models
│   │   └── __init__.py      # 🏗️ Database schema definitions
│   │
│   ├── schemas/              # 📝 Pydantic request/response schemas
│   │   └── __init__.py      # 📋 API data validation models
│   │
│   └── services/             # 🤖 AI/ML business logic
│       ├── pain_point_service.py   # 😰 Pain point extraction
│       ├── sentiment_service.py    # 😊 Sentiment analysis
│       ├── action_item_service.py  # ✅ Action item generation
│       ├── solution_service.py     # 💡 Solution matching
│       └── audio_service.py        # 🎙️ Audio processing utilities
│
└── logs/                      # 📝 Application logs
    └── app.log               # 📊 Main log file
```

## 📡 **API Endpoints**

### 🔐 **Authentication**
```http
POST   /api/auth/login         # User login
POST   /api/auth/register      # User registration  
GET    /api/auth/me           # Get current user
```

### 🎙️ **Audio Processing**
```http
POST   /api/audio/process-complete     # Complete: Audio → Insights
POST   /api/audio/transcribe-audio     # Whisper: Audio → Text
POST   /api/audio/analyze-transcript   # GPT: Text → Analysis
```

### 📞 **Call Management**
```http
GET    /api/calls                     # List calls (paginated)
GET    /api/calls/{id}               # Get call details
GET    /api/calls/analytics/dashboard # Dashboard metrics
```

### ✅ **Action Items**
```http
GET    /api/action-items              # List action items
GET    /api/action-items/{id}        # Get action item details
PATCH  /api/action-items/{id}/status # Update status
GET    /api/action-items/analytics/summary # Analytics
```

### 🔍 **System**
```http
GET    /health                       # Basic health check
GET    /api/health                  # Detailed health status
```

## 🗄️ **Database Models**

### 📊 **Core Entities**

#### **Call** (Main entity)
```python
- id: Primary key
- title: Call title
- transcript: Full call transcript
- duration_seconds: Call duration
- overall_sentiment: AI-analyzed sentiment
- ai_summary: GPT-generated summary
- created_at, updated_at: Timestamps
```

#### **PainPoint** (AI-extracted issues)
```python
- id: Primary key
- call_id: Foreign key to Call
- description: AI-extracted pain point
- category: Issue category (pricing, product, service, etc.)
- severity: Impact level (low, medium, high, critical)
- confidence_score: AI confidence level
```

#### **ActionItem** (AI-generated tasks)
```python
- id: Primary key  
- call_id: Foreign key to Call
- title: Action item title
- description: Detailed description
- priority: Task priority (low, medium, high, urgent)
- status: Current status (pending, in_progress, completed)
- due_date: Target completion date
```

### 🔗 **Relationships**
```
Call (1) → PainPoint (Many)
Call (1) → ActionItem (Many)
```

## 🤖 **AI/ML Services**

### 🎙️ **Audio Service** (`audio_service.py`)
- **File Processing**: Handle multiple audio formats
- **OpenAI Whisper**: Speech-to-text conversion
- **Error Handling**: Robust audio processing pipeline

### 😰 **Pain Point Service** (`pain_point_service.py`)
- **GPT Analysis**: Extract customer pain points
- **Categorization**: Automatic issue classification
- **Severity Scoring**: Impact assessment
- **Confidence Tracking**: AI confidence levels

### 😊 **Sentiment Service** (`sentiment_service.py`)
- **Real-time Analysis**: Per-segment sentiment analysis
- **Timeline Generation**: Sentiment progression over call
- **Confidence Scoring**: Analysis reliability metrics

### ✅ **Action Item Service** (`action_item_service.py`)
- **Smart Generation**: Context-aware task creation
- **Priority Assignment**: Intelligent priority scoring
- **Timeline Estimation**: Realistic completion timelines

### 💡 **Solution Service** (`solution_service.py`)
- **Vector Search**: Semantic solution matching
- **Recommendation Engine**: AI-powered suggestions
- **Similarity Scoring**: Match confidence levels

## 🚀 **Deployment**

### 🌐 **Production Deployment**

#### **Environment Setup**
```bash
# Production environment variables
DEBUG=false
DATABASE_URL=postgresql://prod-connection-string
OPENAI_API_KEY=sk-prod-api-key
SECRET_KEY=ultra-secure-production-key
```

#### **Render Deployment** (Current)
```yaml
# render.yaml
- type: web
  name: ai-calling-intelligence-backend
  env: python
  buildCommand: cd backend && pip install -r requirements.txt
  startCommand: cd backend && python main.py
  healthCheckPath: /health
```

#### **Alternative Deployments**
- **Railway**: `railway up`
- **Heroku**: `git push heroku main`
- **Docker**: Use provided Dockerfile
- **AWS/GCP**: Deploy with container services

### 🔧 **Production Checklist**
- ✅ Set `DEBUG=false`
- ✅ Use secure `SECRET_KEY`
- ✅ Configure PostgreSQL database
- ✅ Set up environment variables
- ✅ Enable HTTPS
- ✅ Configure monitoring and alerts
- ✅ Set up log aggregation
- ✅ Configure backup strategy

## 🔍 **Development**

### 🧪 **Testing**
```bash
# Run tests (when available)
pytest

# API testing with curl
curl -X GET http://localhost:8000/health
curl -X POST http://localhost:8000/api/audio/analyze-transcript \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Sample call transcript..."}'
```

### 📊 **Monitoring**
```bash
# View logs
tail -f logs/app.log

# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs
```

### 🔧 **Development Tools**
- **FastAPI**: Automatic API documentation
- **SQLAlchemy**: Database ORM with migrations
- **Pydantic**: Data validation and serialization
- **Loguru**: Structured logging
- **JWT**: Secure authentication

## 🐛 **Troubleshooting**

### 🔧 **Common Issues**

| Issue | Cause | Solution |
|-------|-------|----------|
| **Import Errors** | Missing dependencies | `pip install -r requirements.txt` |
| **Database Connection** | Wrong DATABASE_URL | Check connection string format |
| **OpenAI API Errors** | Invalid/missing API key | Verify API key and billing |
| **CORS Errors** | Frontend domain not allowed | Update ALLOWED_ORIGINS |
| **Port Already in Use** | Port 8000 occupied | Use different port or kill process |

### 📝 **Debug Mode**
```bash
# Enable debug mode
export DEBUG=true
python main.py

# Check logs
tail -f logs/app.log
```

### 🔍 **Health Diagnostics**
```bash
# Basic health
curl http://localhost:8000/health

# Detailed health with service status
curl http://localhost:8000/api/health
```

## 📈 **Performance**

### ⚡ **Optimization Features**
- **Async Processing**: Non-blocking I/O operations
- **Connection Pooling**: Efficient database connections
- **Caching**: Response caching for repeated requests
- **Streaming**: Large file handling with streaming
- **Pagination**: Efficient data retrieval

### 📊 **Monitoring Metrics**
- **Response Times**: API endpoint performance
- **Error Rates**: Success/failure tracking
- **Resource Usage**: Memory and CPU utilization
- **Database Performance**: Query execution times

## 🤝 **Contributing**

### 🔄 **Development Workflow**
1. Create virtual environment
2. Install dependencies
3. Set up environment variables
4. Make changes
5. Test thoroughly
6. Submit pull request

### 📝 **Code Standards**
- Follow FastAPI patterns
- Use type hints
- Add docstrings
- Handle errors gracefully
- Write tests for new features

---

## 🎉 **Ready to Go!**

Your AI Call Intelligence backend is now ready to power intelligent call analysis with OpenAI's cutting-edge AI models!

**Start the server**: `python main.py`  
**Visit API docs**: http://localhost:8000/docs  
**Check health**: http://localhost:8000/health

Happy coding! 🚀✨
