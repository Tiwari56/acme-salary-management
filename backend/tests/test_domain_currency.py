import pytest

from app.domain.currency import USD_PER_UNIT, UnknownCurrencyError, from_usd, to_usd
from app.domain.reference import COUNTRIES, JOB_CATALOG, currency_for, is_valid_job


def test_usd_is_identity():
    assert to_usd(123_456, "USD") == 123_456


def test_converts_and_rounds_half_up():
    # 1_000_000 INR * 0.012 = 12_000 USD
    assert to_usd(1_000_000, "INR") == 12_000
    # 1 GBP = 1.27 -> rounds to 1
    assert to_usd(1, "GBP") == 1
    # 2 * 0.74 = 1.48 -> 1 ; 3 * 0.74 = 2.22 -> 2 ; 5 * 0.66 = 3.3 -> 3
    assert to_usd(5, "AUD") == 3


def test_round_trip_is_close():
    assert abs(to_usd(from_usd(100_000, "EUR"), "EUR") - 100_000) <= 1


def test_unknown_currency_raises():
    with pytest.raises(UnknownCurrencyError):
        to_usd(1, "XYZ")


def test_every_country_currency_has_a_rate():
    for country in COUNTRIES.values():
        assert country.currency in USD_PER_UNIT


def test_currency_for_country():
    assert currency_for("IN") == "INR"
    assert currency_for("DE") == "EUR"


def test_job_catalog_validation():
    dept, titles = next(iter(JOB_CATALOG.items()))
    assert is_valid_job(dept, titles[0])
    assert not is_valid_job(dept, "Astronaut")
    assert not is_valid_job("Nonexistent", titles[0])
