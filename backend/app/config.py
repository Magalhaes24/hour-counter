from pydantic import BaseModel


class Settings(BaseModel):
    DATABASE_URL: str = "sqlite:///./storage/hours_counter.db"
    APP_NAME: str = "Hour Counter"


settings = Settings()
