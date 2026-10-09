"""Pure salary statistics. Inputs and outputs are whole currency units (ints)."""

from collections.abc import Callable, Iterable
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal


def _round(value: Decimal) -> int:
    return int(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class SalaryStats:
    count: int
    total: int
    min: int
    max: int
    mean: int
    median: int

    @classmethod
    def empty(cls) -> "SalaryStats":
        return cls(count=0, total=0, min=0, max=0, mean=0, median=0)


def median(values: list[int]) -> int:
    """Median of whole-unit values; even-length lists average the middle pair (half-up)."""
    if not values:
        raise ValueError("median of empty list")
    ordered = sorted(values)
    mid = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[mid]
    return _round((Decimal(ordered[mid - 1]) + Decimal(ordered[mid])) / 2)


def summarize(values: Iterable[int]) -> SalaryStats:
    data = list(values)
    if not data:
        return SalaryStats.empty()
    total = sum(data)
    return SalaryStats(
        count=len(data),
        total=total,
        min=min(data),
        max=max(data),
        mean=_round(Decimal(total) / len(data)),
        median=median(data),
    )


def group_summaries[K, T](
    rows: Iterable[T], key: Callable[[T], K], value: Callable[[T], int]
) -> dict[K, SalaryStats]:
    """Group rows by `key` and summarise `value` per group."""
    buckets: dict[K, list[int]] = {}
    for row in rows:
        buckets.setdefault(key(row), []).append(value(row))
    return {k: summarize(v) for k, v in buckets.items()}


@dataclass(frozen=True)
class Bucket:
    lower: int  # inclusive
    upper: int  # exclusive (except the last bucket, which is open-ended)
    count: int


def histogram(values: Iterable[int], bucket_size: int, max_buckets: int = 20) -> list[Bucket]:
    """Fixed-width histogram starting at 0. Values beyond the last bucket fold into it, so a few
    outliers can't stretch the chart into hundreds of empty bars."""
    if bucket_size <= 0:
        raise ValueError("bucket_size must be positive")
    data = list(values)
    if not data:
        return []
    n_buckets = min(max(data) // bucket_size + 1, max_buckets)
    counts = [0] * n_buckets
    for v in data:
        counts[min(v // bucket_size, n_buckets - 1)] += 1
    return [
        Bucket(lower=i * bucket_size, upper=(i + 1) * bucket_size, count=c)
        for i, c in enumerate(counts)
    ]
