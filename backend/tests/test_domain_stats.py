import pytest

from app.domain.stats import SalaryStats, group_summaries, histogram, median, summarize


class TestMedian:
    def test_odd_length_returns_middle_value(self):
        assert median([5, 1, 3]) == 3

    def test_even_length_averages_middle_pair(self):
        assert median([1, 2, 3, 4]) == 3  # 2.5 rounds half-up

    def test_single_value(self):
        assert median([42]) == 42

    def test_empty_raises(self):
        with pytest.raises(ValueError):
            median([])


class TestSummarize:
    def test_basic_stats(self):
        s = summarize([100, 200, 300, 1000])
        assert s == SalaryStats(count=4, total=1600, min=100, max=1000, mean=400, median=250)

    def test_empty_returns_zeroes(self):
        assert summarize([]) == SalaryStats.empty()

    def test_accepts_generators(self):
        assert summarize(x for x in [10, 20]).count == 2


def test_group_summaries_groups_by_key():
    rows = [("IN", 10), ("US", 100), ("IN", 30)]
    result = group_summaries(rows, key=lambda r: r[0], value=lambda r: r[1])
    assert result["IN"].count == 2
    assert result["IN"].mean == 20
    assert result["US"].median == 100


class TestHistogram:
    def test_buckets_are_fixed_width_from_zero(self):
        buckets = histogram([5, 15, 15, 25], bucket_size=10)
        assert [(b.lower, b.upper, b.count) for b in buckets] == [
            (0, 10, 1),
            (10, 20, 2),
            (20, 30, 1),
        ]

    def test_outliers_fold_into_last_bucket(self):
        buckets = histogram([1, 1_000_000], bucket_size=10, max_buckets=3)
        assert len(buckets) == 3
        assert buckets[-1].count == 1

    def test_empty_input(self):
        assert histogram([], bucket_size=10) == []

    def test_invalid_bucket_size(self):
        with pytest.raises(ValueError):
            histogram([1], bucket_size=0)
