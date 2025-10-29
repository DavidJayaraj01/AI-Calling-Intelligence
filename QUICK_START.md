# 🚀 Quick Start Guide - AI Calling Intelligence

## ✅ Git Push Status: IN PROGRESS

Your code is currently being pushed to GitHub **without model files**!

---

## 📋 What Just Happened

### ✅ Committed & Pushing:
- All application code (backend + frontend)
- Configuration files (.gitignore, .env.example)
- Documentation (README files)
- Service files (AI services, API endpoints)

### ❌ NOT Pushed (Excluded):
- AI/ML model files (~400MB)
- .env file (contains secrets)
- Python cache files
- Log files
- Database files

---

## 🔄 To Clone on Another Machine

```bash
# 1. Clone the repository
git clone https://github.com/Klassy01/AI-Calling-Intelligence.git
cd AI-Calling-Intelligence
git checkout feat/model

# 2. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Download AI Models
python3 setup_models.py
# This will download ~1.4GB of models

# 4. Configure Environment
cp .env.example .env
nano .env  # Edit with your database credentials

# 5. Install System Dependencies
sudo apt-get install ffmpeg  # For audio processing

# 6. Install Ollama (for local AI)
curl -fsSL https://ollama.com/install.sh | sh
ollama pull llama3:8b

# 7. Frontend Setup
cd ../frontend
npm install

# 8. Run the Application
# Terminal 1: Backend
cd backend && source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📦 Model Setup (Automated)

The `backend/setup_models.py` script will download:

1. **Sentence Transformer** (~90MB)
   - For text embeddings and similarity search

2. **Sentiment Analysis** (~500MB)
   - Twitter RoBERTa for sentiment classification

3. **Emotion Detection** (~500MB)
   - RoBERTa for emotion recognition

4. **Speech-to-Text** (~300MB) - Optional
   - Backup for Google Speech Recognition

---

## 🔑 Environment Variables

Edit `backend/.env` with your settings:

```env
# Database (Required)
DATABASE_URL=postgresql://user:password@host:5432/database

# Ollama (Local AI)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# JWT Secret (Generate your own)
SECRET_KEY=your-secret-key-here

# Optional: Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🎯 Key Features

### Backend (FastAPI)
- ✅ Real audio transcription (Google Speech Recognition)
- ✅ Local AI with Ollama Llama3:8b
- ✅ PostgreSQL database
- ✅ Real-time sentiment analysis
- ✅ QBR report generation
- ✅ Recording storage and management

### Frontend (React + TypeScript)
- ✅ Live recording with sentiment tracking
- ✅ Audio upload and transcription
- ✅ QBR visualization with charts
- ✅ Call analytics dashboard
- ✅ Action item management

---

## 🌐 API Endpoints

```
# Health
GET  /api/health

# Calls
GET  /api/calls
POST /api/calls
GET  /api/calls/{id}
POST /api/calls/transcribe

# Action Items
GET  /api/action-items
POST /api/action-items

# QBR
POST /api/qbr/generate
GET  /api/qbr/{id}

# Recording
POST /api/recording/start
POST /api/recording/stop
GET  /api/recording/{id}
```

---

## 🛠️ Development Tools

```bash
# Backend Testing
pytest backend/tests/

# Frontend Type Checking
npm run type-check

# Linting
npm run lint

# Format Code
npm run format
```

---

## 📊 Architecture

```
AI-Calling-Intelligence/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Configuration
│   │   ├── models/         # Database models + AI models
│   │   ├── services/       # Business logic
│   │   └── schemas/        # Pydantic schemas
│   ├── setup_models.py     # Model download script
│   └── requirements.txt
│
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # UI components
    │   ├── pages/          # Page components
    │   ├── services/       # API clients
    │   └── types/          # TypeScript types
    └── package.json
```

---

## 🐛 Troubleshooting

### Issue: Models not found
```bash
cd backend
python3 setup_models.py
```

### Issue: ffmpeg not found
```bash
sudo apt-get install ffmpeg
```

### Issue: Ollama not responding
```bash
# Check if Ollama is running
ollama list

# If not, start it
ollama serve

# Pull the model
ollama pull llama3:8b
```

### Issue: Database connection error
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL`

---

## 📚 Documentation

- **Backend API:** http://localhost:8000/docs (Swagger UI)
- **Frontend:** http://localhost:5173
- **GitHub:** https://github.com/Klassy01/AI-Calling-Intelligence

---

## 🎉 You're All Set!

Once the git push completes, your code will be on GitHub and ready to clone on any machine.

**Remember:**
- Models are downloaded separately (not in git)
- Configure .env on each machine
- Install system dependencies (ffmpeg)
- Set up Ollama for local AI

Happy coding! 🚀
