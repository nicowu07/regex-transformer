import pandas as pd

def filter_apply(query: str, df: pd.DataFrame) -> pd.DataFrame:
    try:
        filtered_df = df.query(query)
        return filtered_df
    except Exception as e:
        raise ValueError(f"Error applying filter: {str(e)}")