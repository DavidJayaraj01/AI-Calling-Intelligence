"""
Database configuration and connection setup
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SSL connect_args for PostgreSQL
connect_args = {}
if settings.DATABASE_URL.startswith("postgresql"):
    # Add SSL support for PostgreSQL connections
    connect_args = {
        "connect_timeout": 10,
        "options": "-c statement_timeout=30000"
    }
    # If using Render or similar, add SSL mode
    if "render.com" in settings.DATABASE_URL or "amazonaws.com" in settings.DATABASE_URL:
        connect_args["sslmode"] = "require"

# Create database engine for PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args,
    echo=settings.DEBUG
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    """
    Dependency function to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
