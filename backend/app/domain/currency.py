"""Currency conversion using a fixed, dated reference rate table.

HR compares pay across countries using a stable budget rate, not live market rates — live rates
would make the same report give different answers day to day.
"""

from decimal import ROUND_HALF_UP, Decimal

RATES_AS_OF = "2026-01-01"

# 1 unit of currency = N USD. Illustrative reference rates.
USD_PER_UNIT: dict[str, Decimal] = {
    "USD": Decimal("1"),
    "GBP": Decimal("1.27"),
    "EUR": Decimal("1.08"),
    "INR": Decimal("0.012"),
    "CAD": Decimal("0.73"),
    "AUD": Decimal("0.66"),
    "SGD": Decimal("0.74"),
    "BRL": Decimal("0.18"),
}


class UnknownCurrencyError(ValueError):
    pass


def _rate(currency: str) -> Decimal:
    try:
        return USD_PER_UNIT[currency]
    except KeyError as exc:
        raise UnknownCurrencyError(currency) from exc


def to_usd(amount: int, currency: str) -> int:
    """Convert whole units of `currency` to whole USD, rounding half-up."""
    return int((Decimal(amount) * _rate(currency)).quantize(Decimal(1), rounding=ROUND_HALF_UP))


def from_usd(amount_usd: int | Decimal, currency: str) -> int:
    """Convert USD to whole units of `currency`, rounding half-up."""
    value = Decimal(amount_usd) / _rate(currency)
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))
