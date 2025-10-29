#!/usr/bin/env python3
"""
Startup script for AI Call Intelligence Backend
"""
import os
import sys
import subprocess
from pathlib import Path

def check_environment():
    """Check if the environment is properly set up"""
    print("🔍 Checking environment...")
    
    # Check if virtual environment is activated
    if not hasattr(sys, 'real_prefix') and not (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("⚠️  Virtual environment not detected. Please activate it first:")
        print("   source venv/bin/activate")
        return False
    
    # Check if models exist
    models_dir = Path("app/models")
    required_models = [
        "roberta_finetuned/roberta_finetuned",
        "multilingual_sentiment_model", 
        "all_MiniLM_L6_v2",
        "s2t_small_librispeech"
    ]
    
    missing_models = []
    for model in required_models:
        model_path = models_dir / model
        if not model_path.exists():
            missing_models.append(model)
    
    if missing_models:
        print("❌ Missing models:")
        for model in missing_models:
            print(f"   - {model}")
        print("\nPlease ensure all model files are in the correct directories.")
        return False
    
    print("✅ Environment check passed")
    return True

def check_dependencies():
    """Check if all required dependencies are installed"""
    print("📦 Checking dependencies...")
    
    required_packages = [
        "fastapi", "uvicorn", "transformers", "torch", 
        "sentence-transformers", "librosa", "sqlalchemy"
    ]
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\nPlease install missing packages:")
        print("   pip install -r requirements.txt")
        return False
    
    print("✅ Dependencies check passed")
    return True

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting AI Call Intelligence Backend...")
    
    try:
        # Start uvicorn server
        cmd = [
            "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ]
        
        print(f"Running: {' '.join(cmd)}")
        subprocess.run(cmd, check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True

def main():
    """Main startup function"""
    print("=" * 60)
    print("🤖 AI Call Intelligence Backend Startup")
    print("=" * 60)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Start server
    print("\n" + "=" * 60)
    start_server()

if __name__ == "__main__":
    main()


