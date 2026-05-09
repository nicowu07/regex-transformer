import pandas as pd
from pathlib import Path
import uuid
import os

STORAGE_DIR = Path(os.getenv("STORAGE_DIR"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

def valid_id(file_id: str) -> bool:
    try:
        uuid.UUID(file_id)
        return True
    except (ValueError, TypeError, AttributeError):
        return False

def save_dataframe(df: pd.DataFrame) -> str:
    file_id = uuid.uuid4()
    df.to_parquet(STORAGE_DIR / f"{file_id}.parquet")
    return str(file_id)

def load_dataframe(file_id: str) -> pd.DataFrame:
    if not valid_id(file_id):
        raise ValueError("Invalid file ID")
    try:
        return pd.read_parquet(STORAGE_DIR / f"{file_id}.parquet")
    except FileNotFoundError:
        raise ValueError("File not found")
