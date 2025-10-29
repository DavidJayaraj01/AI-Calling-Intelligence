# 🚀 AI Call Intelligence Backend

A powerful FastAPI-based backend service that provides AI-powered analysis of vendor-distributor conversations, extracting insights, pain points, and generating actionable items.

## 🎯 Features

### 🤖 AI/ML Pipeline
- **Speech-to-Text Processing**: Convert audio calls to text transcripts
- **Pain Point Extraction**: RoBERTa-based emotion analysis to identify customer concerns
- **Sentiment Analysis**: Multi-language sentiment analysis across call segments
- **Action Item Generation**: LLM-powered action item creation from call insights
- **Solution Matching**: Intelligent matching of pain points to available solutions
- **Vector Search**: Semantic search using sentence transformers

### 📊 API Capabilities
- RESTful API with comprehensive endpoints
- JWT-based authentication and authorization
- Real-time call processing and analysis
- Dashboard metrics and analytics
- Action item management system

## 🏗️ Architecture

### Project Structure
```
backend/
├── main.py                 # Entry point (python main.py)
├── app/
│   ├── main.py            # FastAPI application
│   ├── api/               # API route handlers
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── calls.py       # Call management endpoints
│   │   ├── action_items.py # Action item endpoints
│   │   ├── health.py      # Health check endpoints
│   │   └── model_test.py  # Model testing endpoints
│   ├── core/              # Core configuration
│   │   ├── config.py      # Settings and environment
│   │   ├── database.py    # Database connection
│   │   └── security.py    # JWT and security utilities
│   ├── models/            # SQLAlchemy database models
│   │   ├── user.py        # User model
│   │   └── all_MiniLM_L6_v2/ # Pre-loaded sentence transformer
│   ├── schemas/           # Pydantic request/response schemas
│   └── services/          # AI/ML services
│       ├── pain_point_service.py    # RoBERTa pain point extraction
│       ├── sentiment_service.py     # Sentiment analysis
│       ├── action_item_service.py   # Action item generation
│       ├── solution_service.py      # Solution matching
│       └── speech_to_text_service.py # Audio processing
├── logs/                  # Application logs
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── README.md             # This file
```

### Technology Stack
- **Framework**: FastAPI 0.104.1
- **Database**: SQLite (dev) / PostgreSQL (prod) with pgvector
- **ORM**: SQLAlchemy 2.0.23
- **AI/ML**: HuggingFace Transformers, OpenAI API
- **Authentication**: JWT with python-jose
- **Async**: Uvicorn with async/await support

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- pip package manager
- (Optional) PostgreSQL for production

### 1. Environment Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your settings
nano .env
```

### 3. Environment Variables
Key configuration in `.env`:
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

### 4. Run the Application
```bash
# Development mode (recommended)
python main.py

# Alternative: Direct uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Verify Installation
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Call Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/calls` | List all calls (paginated) |
| POST | `/api/calls` | Create new call |
| GET | `/api/calls/{id}` | Get call details |
| POST | `/api/calls/{id}/analyze` | Analyze call transcript |
| DELETE | `/api/calls/{id}` | Delete call |

### Action Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/action-items` | List action items |
| POST | `/api/action-items` | Create action item |
| GET | `/api/action-items/{id}` | Get action item details |
| PUT | `/api/action-items/{id}` | Update action item |
| DELETE | `/api/action-items/{id}` | Delete action item |
| POST | `/api/action-items/{id}/complete` | Mark as completed |

### Dashboard & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard metrics |
| GET | `/api/health` | Health check |

### Model Testing
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/model-test` | Test AI models |

## 🤖 AI/ML Models

### Pain Point Extraction
- **Model**: `j-hartmann/emotion-english-distilroberta-base`
- **Purpose**: Emotion analysis to identify customer concerns
- **Input**: Call transcript text
- **Output**: Pain points with confidence scores
- **Fallback**: Keyword-based analysis if model unavailable

### Sentiment Analysis
- **Model**: `cardiffnlp/twitter-roberta-base-sentiment-latest`
- **Purpose**: Multi-language sentiment analysis
- **Input**: Text segments from calls
- **Output**: Positive/Negative/Neutral with confidence scores

### Action Item Generation
- **Integration**: OpenAI API (GPT-3.5/4)
- **Purpose**: Generate actionable items from call insights
- **Input**: Pain points and call context
- **Output**: Structured action items with priorities
- **Fallback**: Local analysis if API unavailable

### Vector Embeddings
- **Model**: `all-MiniLM-L6-v2` (Sentence Transformers)
- **Purpose**: Semantic search and solution matching
- **Storage**: pgvector extension for PostgreSQL
- **Use Case**: Find similar pain points and solutions

### Speech-to-Text
- **Model**: `s2t_small_librispeech`
- **Purpose**: Convert audio files to text
- **Input**: Audio files (WAV, MP3, etc.)
- **Output**: Text transcripts

## 🗄️ Database Schema

### Core Tables
- **users**: User authentication and profiles
- **calls**: Call records and metadata
- **action_items**: Generated action items
- **pain_points**: Extracted pain points
- **solutions**: Available solutions database
- **sentiments**: Sentiment analysis results

### Features
- ✅ Cross-database UUID support (SQLite + PostgreSQL)
- ✅ Vector storage for semantic search
- ✅ Automatic table creation on startup
- ✅ Full schema with relationships
- ✅ Migration support with Alembic

## 🔧 Development

### Adding New Features
1. **Database Models**: Add to `app/models/`
2. **Pydantic Schemas**: Add to `app/schemas/`
3. **API Routes**: Add to `app/api/`
4. **Business Logic**: Add to `app/services/`
5. **Update Main App**: Include new routes in `app/main.py`

### Code Structure
```python
# Example: Adding a new endpoint
# 1. Create schema in app/schemas/
class NewFeatureSchema(BaseModel):
    field1: str
    field2: int

# 2. Add route in app/api/
@router.post("/new-feature")
async def create_new_feature(
    data: NewFeatureSchema,
    db: Session = Depends(get_db)
):
    # Implementation
    pass

# 3. Include in app/main.py
app.include_router(new_feature_router, prefix="/api")
```

### Testing
```bash
# Run tests (when implemented)
pytest

# Test specific endpoints
curl -X GET "http://localhost:8000/health"
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test"}'
```

### Logging
- Application logs: `logs/app.log`
- Log levels: DEBUG, INFO, WARNING, ERROR
- Structured logging with context

## 🚀 Production Deployment

### Docker Deployment
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Configuration
Production environment variables:
```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://user:password@localhost:5432/ai_call_intelligence

# AI/ML Models
OPENAI_API_KEY=your-production-openai-key
HUGGINGFACE_API_TOKEN=your-huggingface-token

# Security
SECRET_KEY=your-super-secure-production-key
ALLOWED_ORIGINS=https://yourdomain.com

# Performance
WORKERS=4
MAX_CONNECTIONS=100
```

### Performance Optimization
- **Connection Pooling**: Configure SQLAlchemy pool settings
- **Caching**: Implement Redis for model results
- **Background Tasks**: Use Celery for heavy AI processing
- **Load Balancing**: Multiple worker processes
- **Monitoring**: Add metrics and health checks

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Token refresh mechanism

### API Security
- CORS configuration
- Request validation with Pydantic
- Rate limiting (recommended)
- Input sanitization

### Data Protection
- Environment-based secrets
- Database connection encryption
- Secure headers
- Audit logging

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check database URL
   echo $DATABASE_URL
   
   # Test PostgreSQL connection
   psql $DATABASE_URL -c "SELECT 1;"
   ```

2. **AI Model Loading Error**
   ```bash
   # Check HuggingFace token
   echo $HUGGINGFACE_API_TOKEN
   
   # Test model download
   python -c "from transformers import pipeline; pipeline('sentiment-analysis')"
   ```

3. **OpenAI API Error**
   ```bash
   # Check API key
   echo $OPENAI_API_KEY
   
   # Test API connection
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

4. **CORS Issues**
   - Verify `ALLOWED_ORIGINS` in configuration
   - Check frontend URL matches allowed origins
   - Ensure proper headers in requests

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
python main.py

# Check logs
tail -f logs/app.log
```

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/health

# Detailed status
curl http://localhost:8000/api/health
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [HuggingFace Transformers](https://huggingface.co/docs/transformers/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [PostgreSQL with pgvector](https://github.com/pgvector/pgvector)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the main project README for details.

---

## 🎉 Success!

Your AI Call Intelligence Backend is now running at:
- 🌐 **API**: http://localhost:8000
- 📖 **Documentation**: http://localhost:8000/docs
- ❤️ **Health Check**: http://localhost:8000/health

The backend is fully configured with AI models loaded and ready to process calls!