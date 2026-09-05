"""
Centralised app configuration.

Reads values from environment variables (loaded from a local ".env" file
via python-dotenv) so secrets never live in the source code. Every other
module imports the single `settings` instance from here instead of
reading os.environ directly, keeping config in one place.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Where the database lives. Defaults to a local SQLite file so the
    # app runs out-of-the-box with zero setup during development.
    database_url: str = "sqlite:///./finance_tracker.db"

    # Secret used to sign/verify JWT tokens. MUST be overridden in
    # production via a real ".env" file or hosting-provider secret.
    jwt_secret_key: str = "change-this-to-a-random-secret-in-production"

    # Algorithm used for JWT signing.
    jwt_algorithm: str = "HS256"

    # How long an access token remains valid before the client must
    # refresh it.
    access_token_expire_minutes: int = 30

    class Config:
        env_file = ".env"


# Single shared settings instance, imported everywhere config is needed.
settings = Settings()
