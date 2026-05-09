import re
import pandas as pd

REDOS_PATTERNS = [r'\(.+[+*]\)[+*]']   # (anything+)+ or (anything*)*

def redos_check(pattern: str) -> bool:
    for redos_pattern in REDOS_PATTERNS:
        if re.search(redos_pattern, pattern):
            return True
    return False

def validate_regex(pattern: str) -> bool:
    if len(pattern) > 500:
        return False
    if redos_check(pattern):
        return False
    try:
        re.compile(pattern)
        return True
    except re.error:
        return False

def regex_apply(df: pd.DataFrame, regex: str, columns: list, replacement: str) -> tuple[pd.DataFrame, int]:
    counts = 0
    for col in columns:
        if col in df.columns:
            colstr = df[col].astype(str)
            counts += colstr.str.count(regex).sum()
            df[col] = colstr.str.replace(regex, replacement, regex=True)
    return df, counts
    