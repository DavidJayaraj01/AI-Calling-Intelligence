"""
Drop all tables from PostgreSQL database
"""
from sqlalchemy import create_engine, text
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def drop_all_tables():
    """Drop all tables from the database"""
    try:
        engine = create_engine(settings.DATABASE_URL)
        
        logger.info("Connecting to PostgreSQL database...")
        
        with engine.connect() as connection:
            # Get all tables
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE';
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if not tables:
                logger.info("No tables to drop")
                return True
            
            logger.info(f"Found {len(tables)} tables: {', '.join(tables)}")
            
            # Drop all tables with CASCADE
            logger.info("Dropping all tables...")
            connection.execute(text("DROP SCHEMA public CASCADE;"))
            connection.execute(text("CREATE SCHEMA public;"))
            connection.execute(text("GRANT ALL ON SCHEMA public TO public;"))
            connection.commit()
            
            logger.info("✅ All tables dropped successfully!")
            return True
            
    except Exception as e:
        logger.error(f"❌ Error dropping tables: {e}")
        return False

if __name__ == "__main__":
    logger.info("🗑️  Dropping all tables from PostgreSQL database...")
    
    if drop_all_tables():
        logger.info("✅ Tables dropped successfully!")
        logger.info("Now run: python3 init_postgres_db.py to recreate tables")
    else:
        logger.error("❌ Failed to drop tables!")
