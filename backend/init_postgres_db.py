"""
Database initialization script for PostgreSQL
Creates all tables and sets up the database schema
"""
import asyncio
from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models import Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_database_tables():
    """
    Create all database tables in PostgreSQL
    """
    try:
        # Create engine
        engine = create_engine(settings.DATABASE_URL)
        
        logger.info("Connecting to PostgreSQL database...")
        logger.info(f"Database URL: {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
        
        # Test connection
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            logger.info(f"Connected to PostgreSQL: {version}")
            
            # Check if pgvector extension is available
            try:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("✅ pgvector extension enabled")
            except Exception as e:
                logger.warning(f"⚠️  pgvector extension not available: {e}")
                logger.info("Vector embeddings will be stored as TEXT")
        
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All tables created successfully!")
        
        # List created tables
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"Created tables: {', '.join(tables)}")
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating database tables: {e}")
        return False

def verify_database_schema():
    """
    Verify that all expected tables exist
    """
    expected_tables = [
        'user', 'distributor', 'vendor', 'call', 'painpoint',
        'solutionresource', 'problemsolutionmapping', 'actionitem',
        'sentimentsegment', 'notification', 'qbrdraft'
    ]
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public';
            """))
            existing_tables = [row[0] for row in result.fetchall()]
            
            missing_tables = set(expected_tables) - set(existing_tables)
            extra_tables = set(existing_tables) - set(expected_tables)
            
            if missing_tables:
                logger.warning(f"⚠️  Missing tables: {', '.join(missing_tables)}")
            if extra_tables:
                logger.info(f"ℹ️  Additional tables: {', '.join(extra_tables)}")
                
            if not missing_tables:
                logger.info("✅ All expected tables exist!")
                return True
            else:
                return False
                
    except Exception as e:
        logger.error(f"❌ Error verifying database schema: {e}")
        return False

def insert_sample_data():
    """
    Insert sample data for testing
    """
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as connection:
            # Insert sample distributor
            connection.execute(text("""
                INSERT INTO distributor (name, profile_json) 
                VALUES (
                    'TechFlow Distributors',
                    '{"contact_email": "contact@techflow.com", "active": true}'::jsonb
                ) ON CONFLICT DO NOTHING;
            """))
            
            # Insert sample vendor
            connection.execute(text("""
                INSERT INTO vendor (name, resource_docs)
                VALUES (
                    'InnoTech Solutions',
                    '["doc1", "doc2", "training1"]'::jsonb
                ) ON CONFLICT DO NOTHING;
            """))
            
            # Insert sample user
            connection.execute(text("""
                INSERT INTO "user" (name, email, role)
                VALUES (
                    'John Doe',
                    'john@techflow.com',
                    'admin'
                ) ON CONFLICT DO NOTHING;
            """))
            
            connection.commit()
            logger.info("✅ Sample data inserted successfully!")
            
    except Exception as e:
        logger.error(f"❌ Error inserting sample data: {e}")

if __name__ == "__main__":
    logger.info("🚀 Starting PostgreSQL database initialization...")
    
    # Create tables
    if create_database_tables():
        logger.info("✅ Database tables created successfully!")
        
        # Verify schema
        if verify_database_schema():
            logger.info("✅ Database schema verified!")
            
            # Insert sample data
            insert_sample_data()
            
            logger.info("🎉 PostgreSQL database initialization completed!")
        else:
            logger.error("❌ Database schema verification failed!")
    else:
        logger.error("❌ Database table creation failed!")
