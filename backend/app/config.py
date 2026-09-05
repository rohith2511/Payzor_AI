from dotenv import load_dotenv
import os

from pathlib import Path

env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    PROJECT_NAME: str = "Payzor AI Revenue Recovery Engine"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
    CHANNEL_SERVICE_URL: str = os.getenv("CHANNEL_SERVICE_URL", "http://localhost:8001")
    CRM_WEBHOOK_URL: str = os.getenv("CRM_WEBHOOK_URL", "http://localhost:8000/webhook")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

settings = Settings()