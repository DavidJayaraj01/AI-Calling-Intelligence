#!/usr/bin/env python3
"""
AI Calling Intelligence - Model Setup Script
Downloads and configures all required AI models

Run this script after cloning the repository to set up models locally.
"""

from sentence_transformers import SentenceTransformer
from transformers import pipeline
import os
from pathlib import Path

# Get the models directory
MODELS_DIR = Path(__file__).parent / "app" / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("=" * 60)
print("🤖 AI Calling Intelligence - Model Setup")
print("=" * 60)
print()

# Model configurations
MODELS = {
    "sentence_transformer": {
        "name": "Sentence Transformer (all-MiniLM-L6-v2)",
        "path": MODELS_DIR / "all_MiniLM_L6_v2",
        "size": "~90MB",
        "purpose": "Text embeddings for similarity search"
    },
    "sentiment": {
        "name": "Sentiment Analysis (Twitter RoBERTa)",
        "path": MODELS_DIR / "multilingual_sentiment_model",
        "size": "~500MB",
        "purpose": "Sentiment classification (positive/negative/neutral)"
    },
    "emotion": {
        "name": "Emotion Detection (RoBERTa)",
        "path": MODELS_DIR / "roberta_finetuned" / "roberta_finetuned",
        "size": "~500MB",
        "purpose": "Emotion detection (joy, sadness, anger, etc.)"
    },
    "speech_to_text": {
        "name": "Speech-to-Text (S2T Small LibriSpeech)",
        "path": MODELS_DIR / "s2t_small_librispeech",
        "size": "~300MB",
        "purpose": "Audio transcription (backup for Google STT)"
    }
}

def download_sentence_transformer():
    """Download sentence transformer model for embeddings"""
    print(f"📥 Downloading: {MODELS['sentence_transformer']['name']}")
    print(f"   Size: {MODELS['sentence_transformer']['size']}")
    print(f"   Path: {MODELS['sentence_transformer']['path']}")
    
    if MODELS['sentence_transformer']['path'].exists():
        print("   ✅ Already exists, skipping...")
        return
    
    try:
        model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        model.save(str(MODELS['sentence_transformer']['path']))
        print("   ✅ Downloaded successfully!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    return True

def download_sentiment_model():
    """Download sentiment analysis model"""
    print(f"\n📥 Downloading: {MODELS['sentiment']['name']}")
    print(f"   Size: {MODELS['sentiment']['size']}")
    print(f"   Path: {MODELS['sentiment']['path']}")
    
    if MODELS['sentiment']['path'].exists():
        print("   ✅ Already exists, skipping...")
        return
    
    try:
        sentiment = pipeline('sentiment-analysis', 
                           model='cardiffnlp/twitter-roberta-base-sentiment-latest')
        sentiment.save_pretrained(str(MODELS['sentiment']['path']))
        print("   ✅ Downloaded successfully!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    return True

def download_emotion_model():
    """Download emotion detection model"""
    print(f"\n📥 Downloading: {MODELS['emotion']['name']}")
    print(f"   Size: {MODELS['emotion']['size']}")
    print(f"   Path: {MODELS['emotion']['path']}")
    
    if MODELS['emotion']['path'].exists():
        print("   ✅ Already exists, skipping...")
        return
    
    try:
        MODELS['emotion']['path'].parent.mkdir(parents=True, exist_ok=True)
        emotion = pipeline('text-classification', 
                         model='SamLowe/roberta-base-go_emotions')
        emotion.save_pretrained(str(MODELS['emotion']['path']))
        print("   ✅ Downloaded successfully!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    return True

def download_stt_model():
    """Download speech-to-text model (optional, as Google STT is primary)"""
    print(f"\n📥 Downloading: {MODELS['speech_to_text']['name']}")
    print(f"   Size: {MODELS['speech_to_text']['size']}")
    print(f"   Path: {MODELS['speech_to_text']['path']}")
    print("   ℹ️  This is optional - Google Speech Recognition is the primary STT")
    
    if MODELS['speech_to_text']['path'].exists():
        print("   ✅ Already exists, skipping...")
        return
    
    response = input("   Download? (y/N): ").strip().lower()
    if response != 'y':
        print("   ⏭️  Skipped")
        return True
    
    try:
        stt = pipeline('automatic-speech-recognition', 
                      model='facebook/s2t-small-librispeech-asr')
        stt.save_pretrained(str(MODELS['speech_to_text']['path']))
        print("   ✅ Downloaded successfully!")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    return True

def verify_models():
    """Verify all downloaded models"""
    print("\n" + "=" * 60)
    print("🔍 Verifying Models")
    print("=" * 60)
    
    for key, config in MODELS.items():
        exists = config['path'].exists()
        status = "✅" if exists else "❌"
        print(f"{status} {config['name']}")
        if exists:
            # Check if it has files
            files = list(config['path'].glob("*"))
            print(f"   📁 {len(files)} files")
    
def main():
    """Main setup function"""
    print("This script will download AI models for the application.")
    print("Total download size: ~1.4GB")
    print()
    
    response = input("Continue? (y/N): ").strip().lower()
    if response != 'y':
        print("Setup cancelled.")
        return
    
    print("\n" + "=" * 60)
    print("📦 Starting Downloads")
    print("=" * 60)
    
    # Download models
    results = []
    results.append(download_sentence_transformer())
    results.append(download_sentiment_model())
    results.append(download_emotion_model())
    results.append(download_stt_model())
    
    # Verify
    verify_models()
    
    # Summary
    print("\n" + "=" * 60)
    print("🎉 Setup Complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Configure .env file with your database credentials")
    print("2. Install Ollama: curl -fsSL https://ollama.com/install.sh | sh")
    print("3. Pull Llama3: ollama pull llama3:8b")
    print("4. Install ffmpeg: sudo apt-get install ffmpeg")
    print("5. Start backend: uvicorn app.main:app --reload")
    print()
    print("✅ You're ready to go!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()
