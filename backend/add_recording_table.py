"""
Add recording table to PostgreSQL database
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.recording import Recording
from app.core.database import Base

def add_recording_table():
    """Add the recording table to the existing database"""
    
    # Create engine
    engine = create_engine(settings.DATABASE_URL)
    
    print("🔗 Connecting to PostgreSQL database...")
    print(f"📍 Database: {settings.DATABASE_URL.split('@')[-1]}")
    
    try:
        # Check if table already exists
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'recording'
                );
            """))
            table_exists = result.scalar()
            
            if table_exists:
                print("⚠️  Recording table already exists. Skipping creation.")
                return
        
        # Create the recording table
        print("\n📦 Creating recording table...")
        Recording.__table__.create(engine, checkfirst=True)
        
        print("✅ Recording table created successfully!")
        print("\n📊 Table structure:")
        print("""
        - recording_id (Primary Key)
        - call_id (Foreign Key to call)
        - session_id (Unique session identifier)
        - audio_data (Binary data for audio file)
        - audio_format (Format: wav, mp3, webm)
        - audio_size (Size in bytes)
        - duration (Duration in seconds)
        - sample_rate (Default: 16000)
        - channels (Default: 1)
        - transcript (Full transcript text)
        - transcription_status (pending, processing, completed, failed)
        - started_at, completed_at, created_at, updated_at
        - metadata_json (Additional metadata)
        """)
        
        print("\n🎉 Recording table is ready to use!")
        
    except Exception as e:
        print(f"\n❌ Error creating recording table: {e}")
        raise
    finally:
        engine.dispose()

if __name__ == "__main__":
    add_recording_table()
