import pandas as pd
import pytest
from api.services.regex import regex_apply, validate_regex, redos_check


# regex_apply ---------------------------------------------------------------

def test_regex_apply_redacts_matched_pattern():
    df = pd.DataFrame({"Email": ["alice@example.com", "bob@test.org"]})
    result, count = regex_apply(
        df.copy(),
        r"\b[\w.-]+@[\w.-]+\.\w+\b",
        ["Email"],
        "REDACTED",
    )
    assert result["Email"].tolist() == ["REDACTED", "REDACTED"]
    assert count == 2


def test_regex_apply_with_empty_replacement_deletes_matches():
    df = pd.DataFrame({"Phone": ["call 555-1234 now"]})
    result, count = regex_apply(
        df.copy(),
        r"\d{3}-\d{4}",
        ["Phone"],
        "",
    )
    assert result["Phone"].tolist() == ["call  now"]
    assert count == 1


def test_regex_apply_ignores_unknown_columns():
    df = pd.DataFrame({"Email": ["a@b.com"]})
    result, count = regex_apply(df.copy(), r"\w+", ["NotAColumn"], "X")
    # Should not crash, just match nothing
    assert count == 0
    assert result["Email"].tolist() == ["a@b.com"]


# validate_regex ------------------------------------------------------------

def test_validate_regex_accepts_simple_patterns():
    assert validate_regex(r"\d+") is True
    assert validate_regex(r"[a-z]+@[a-z]+\.\w+") is True


def test_validate_regex_rejects_invalid_syntax():
    assert validate_regex("(unclosed group") is False
    assert validate_regex("[invalid") is False


def test_validate_regex_rejects_too_long():
    assert validate_regex("a" * 501) is False


def test_validate_regex_rejects_redos_patterns():
    # Classic catastrophic backtracking pattern
    assert validate_regex("(a+)+") is False