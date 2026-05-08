import re

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
    