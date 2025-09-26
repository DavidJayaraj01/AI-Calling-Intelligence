# AI Call Intelligence Backend

## Setup Instructions

### 1. Environment Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
source venv/bin/activate

# Install dependencies (if not already done)
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
```

### 2. Configure Environment Variables
Edit the `.env` file with your actual values:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ai_call_intelligence

# OpenAI API Key (required for solution matching and action items)
OPENAI_API_KEY=your-openai-api-key-here

# HuggingFace Token (required for RoBERTa and sentiment models)
HUGGINGFACE_API_TOKEN=your-huggingface-token-here

# JWT Secret (change this!)
SECRET_KEY=your-super-secret-key-change-this-in-production
```

### 3. Database Setup
```bash
# Install PostgreSQL and create database
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb ai_call_intelligence

# Install pgvector extension
sudo -u postgres psql ai_call_intelligence -c "CREATE EXTENSION vector;"
```

### 4. Run the Application
```bash
# Development mode
python main.py

# Or with uvicorn directly
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. API Documentation
Once running, visit:
- API Docs: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Calls
- `POST /api/calls/` - Create new call
- `POST /api/calls/process` - Process call with AI pipeline
- `GET /api/calls/` - Get paginated calls
- `GET /api/calls/{call_id}` - Get call details
- `DELETE /api/calls/{call_id}` - Delete call

### Action Items
- `POST /api/action-items/` - Create action item
- `GET /api/action-items/` - Get paginated action items
- `GET /api/action-items/{item_id}` - Get action item details
- `PUT /api/action-items/{item_id}` - Update action item
- `DELETE /api/action-items/{item_id}` - Delete action item
- `POST /api/action-items/{item_id}/complete` - Mark as completed

### Dashboard
- `GET /api/dashboard` - Get dashboard metrics

## AI Pipeline

The backend implements a complete AI pipeline:

1. **Pain Point Extraction** - Uses RoBERTa model to identify customer issues
2. **Solution Matching** - Uses OpenAI API with vector similarity search
3. **Action Item Generation** - Uses OpenAI (Llama 8B fallback) to create tasks
4. **Sentiment Analysis** - Uses multilingual sentiment model for call analysis

## Architecture

### Services
- `pain_point_service.py` - RoBERTa-based pain point extraction
- `solution_service.py` - OpenAI-powered solution matching
- `action_item_service.py` - LLM-based action item generation
- `sentiment_service.py` - Multilingual sentiment analysis

### Models
- PostgreSQL with pgvector for semantic search
- SQLAlchemy ORM with UUID primary keys
- Comprehensive schema for all business entities

### Security
- JWT-based authentication
- Role-based access control
- CORS configuration for frontend integration

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/           # FastAPI routes
│   ├── core/          # Configuration and database
│   ├── models/        # SQLAlchemy models
│   ├── schemas/       # Pydantic schemas
│   ├── services/      # AI/ML services
│   └── main.py        # FastAPI application
├── logs/              # Application logs
├── venv/              # Virtual environment
├── requirements.txt   # Dependencies
└── .env              # Environment variables
```

### Adding New Features
1. Create database models in `app/models/`
2. Add Pydantic schemas in `app/schemas/`
3. Create API routes in `app/api/`
4. Add business logic in `app/services/`
5. Update main app to include new routes

### Testing
```bash
# Run tests (when implemented)
pytest

# Test specific endpoints
curl -X GET "http://localhost:8000/health"
```

## Production Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
Set these in production:
- `DATABASE_URL` - Production PostgreSQL URL
- `OPENAI_API_KEY` - OpenAI API key
- `HUGGINGFACE_API_TOKEN` - HuggingFace token
- `SECRET_KEY` - Strong JWT secret
- `DEBUG=False` - Disable debug mode

### Performance Considerations
- Use connection pooling for database
- Implement caching for AI model results
- Use background tasks for heavy AI processing
- Configure proper logging levels
- Monitor API response times

## Troubleshooting

### Common Issues
1. **Database connection error** - Check DATABASE_URL and PostgreSQL service
2. **AI model loading error** - Verify HuggingFace token and internet connection
3. **OpenAI API error** - Check API key and usage limits
4. **CORS error** - Verify ALLOWED_ORIGINS in configuration

### Logs
Check logs in `logs/app.log` for detailed error information.
