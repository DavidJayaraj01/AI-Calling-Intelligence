#!/usr/bin/env python3
"""
Initialize PostgreSQL database with all required tables
Creates all tables and enums needed for AI Call Intelligence Platform
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings
from app.core.database import Base
from app.models import *  # Import all models
from loguru import logger

def create_database_tables():
    """Create all database tables and enums"""
    try:
        logger.info("Connecting to PostgreSQL database...")
        logger.info(f"Database URL: {settings.DATABASE_URL}")
        
        # Create engine
        engine = create_engine(
            settings.DATABASE_URL,
            echo=True,  # Show SQL queries
            pool_pre_ping=True,
            pool_recycle=300
        )
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"Connected to PostgreSQL: {version}")
        
        logger.info("Creating database tables...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        logger.success("✅ All database tables created successfully!")
        
        # Verify tables were created
        logger.info("Verifying created tables...")
        with engine.connect() as conn:
            # Check all tables
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = result.fetchall()
            
            logger.info("Created tables:")
            for table in tables:
                logger.info(f"  ✓ {table[0]}")
            
            # Check enums
            result = conn.execute(text("""
                SELECT typname 
                FROM pg_type 
                WHERE typtype = 'e'
                ORDER BY typname
            """))
            enums = result.fetchall()
            
            logger.info("Created enums:")
            for enum in enums:
                logger.info(f"  ✓ {enum[0]}")
        
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

def main():
    """Main function"""
    logger.info("🚀 Starting PostgreSQL Database Initialization")
    logger.info("="*60)
    
    if create_database_tables():
        logger.success("🎉 Database initialization completed successfully!")
        logger.info("Your AI Call Intelligence Platform database is ready!")
        logger.info(f"Database: {settings.POSTGRES_DB}")
        logger.info(f"Host: {settings.POSTGRES_HOST}")
    else:
        logger.error("❌ Database initialization failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()