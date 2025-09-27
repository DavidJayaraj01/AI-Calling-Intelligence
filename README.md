# 🚀 AI Call Intelligence Platform

A comprehensive AI-powered platform for analyzing vendor-distributor conversations, extracting pain points, generating action items, and providing intelligent insights.

## 🎯 Features

### 🤖 OpenAI-Powered AI Capabilities
- **Speech-to-Text Processing**: OpenAI Whisper API for accurate transcriptions
- **Pain Point Extraction**: GPT-4o-mini for intelligent issue identification and categorization
- **Sentiment Analysis**: Advanced multi-segment sentiment analysis with confidence scores
- **Action Item Generation**: Smart follow-up task creation with priority and timeline analysis
- **Solution Matching**: AI-powered solution recommendations using vector embeddings
- **QBR Generation**: Automated Quarterly Business Review report creation

### 📊 Dashboard & Analytics
- Real-time metrics and KPIs
- Interactive charts and visualizations
- Call history and detailed analytics
- Notification system for action items
- Comprehensive QBR management

### 🔧 Technical Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL (Cloud)
- **AI/ML**: OpenAI GPT-4o-mini, OpenAI Whisper, OpenAI Embeddings
- **Authentication**: JWT-based auth system
- **Deployment**: Cloud-ready with minimal dependencies

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
│   │   └── action_items.py # Action item endpoints
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings and environment
│   │   ├── database.py    # Database connection
│   │   └── security.py    # JWT and security utilities
│   ├── models/            # SQLAlchemy database models
│   ├── schemas/           # Pydantic request/response schemas
│   └── services/          # AI/ML services
│       ├── pain_point_service.py    # RoBERTa pain point extraction
│       ├── sentiment_service.py     # Sentiment analysis
│       ├── action_item_service.py   # Action item generation
│       └── solution_service.py      # Solution matching
├── .env                   # Environment variables
└── requirements.txt       # Python dependencies
```

### Frontend Structure
```
src/
├── components/            # Reusable UI components
├── pages/                 # Application pages/routes
├── services/              # API integration
├── contexts/              # React context providers
└── types/                 # TypeScript type definitions
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/Klassy01/AI-Calling-Intelligence.git
cd AI-Calling-Intelligence
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux

# Install dependencies (much lighter now!)
pip install -r requirements.txt

# Configure OpenAI API
copy .env.example .env
# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-openai-api-key-here

# Start the backend server
python main.py
```

Backend will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs

### 3. Frontend Setup
```bash
# Navigate to frontend directory (from project root)
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## ⚡ OpenAI Integration

This version uses **OpenAI API exclusively** for all AI features:

- **GPT-4o-mini**: Cost-effective model for analysis ($0.15/$0.60 per 1M tokens)
- **Whisper API**: State-of-the-art speech-to-text processing
- **text-embedding-3-small**: Advanced vector embeddings for semantic search
- **No local models**: Faster setup, more reliable, easier deployment

### Cost Example:
- Typical call analysis: ~5000 tokens
- Cost per call: ~$0.003 (less than a penny!)
- Monthly cost for 1000 calls: ~$3

## 🔧 Development

### Why Two main.py Files?

The backend uses a common FastAPI pattern:

1. **`/backend/main.py`** - Simple entry point for running with `python main.py`
2. **`/backend/app/main.py`** - The actual FastAPI application with routes, middleware, etc.

This separation provides:
- ✅ Clean architecture and separation of concerns
- ✅ Easy testing (can import `app` directly)
- ✅ Multiple deployment options

### Running with uvicorn
You can also run the backend directly with uvicorn:
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database

The application uses **SQLite** for development (no setup required) and supports **PostgreSQL** for production.

Database features:
- ✅ Cross-database UUID support (SQLite + PostgreSQL)
- ✅ Cross-database Vector storage (for AI embeddings)
- ✅ Automatic table creation on startup
- ✅ Full schema with relationships

### Environment Configuration

Key environment variables in `/backend/.env`:
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# Database (SQLite for development)
DATABASE_URL=sqlite:///./ai_call_intelligence.db

# AI/ML Models
ROBERTA_MODEL=j-hartmann/emotion-english-distilroberta-base
SENTIMENT_MODEL=cardiffnlp/twitter-roberta-base-sentiment-latest
OPENAI_API_KEY=your-openai-api-key-here

# JWT Security
SECRET_KEY=your-super-secret-key-change-this-in-production-2024
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Calls Management
- `GET /api/calls` - List all calls
- `POST /api/calls` - Create new call
- `GET /api/calls/{id}` - Get call details
- `POST /api/calls/{id}/analyze` - Analyze call transcript

### Action Items
- `GET /api/action-items` - List action items
- `POST /api/action-items` - Create action item
- `PUT /api/action-items/{id}` - Update action item
- `DELETE /api/action-items/{id}` - Delete action item

### Dashboard
- `GET /api/dashboard` - Get dashboard metrics

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎉 Success! Your AI Call Intelligence Platform is Ready!

Both servers should now be running:
- 🌐 **Frontend**: http://localhost:5173
- 📊 **Backend API**: http://localhost:8000
- 📖 **API Docs**: http://localhost:8000/docs

The platform is fully configured with AI models loaded and database ready!
