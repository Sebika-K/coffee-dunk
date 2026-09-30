"""
Tests for the fair "Top rated" ordering in routes/ranking.py.

Run from the backend folder:  python3 -m unittest discover -s tests -t .
"""

import unittest

from routes.ranking import fair_score, sort_top_rated


class TestFairScore(unittest.TestCase):
    def test_many_reviews_beat_a_few_perfect_ones(self):
        # The example that started this: 4.8 from 2,000 beats 5.0 from 3
        self.assertGreater(fair_score(4.8, 2000), fair_score(5.0, 3))

    def test_same_count_higher_rating_wins(self):
        self.assertGreater(fair_score(4.9, 500), fair_score(4.5, 500))

    def test_no_rating_scores_zero(self):
        self.assertEqual(fair_score(None, 100), 0)

    def test_missing_count_stays_near_average(self):
        # No review count at all: treated as 0 real reviews
        self.assertAlmostEqual(fair_score(5.0, None), 4.3)


class TestSortTopRated(unittest.TestCase):
    def test_order(self):
        cafes = [
            {"name": "New", "rating": 5.0, "rating_count": 3},
            {"name": "Unrated", "rating": None, "rating_count": None},
            {"name": "Loved", "rating": 4.8, "rating_count": 2000},
        ]
        sort_top_rated(cafes)
        self.assertEqual([c["name"] for c in cafes], ["Loved", "New", "Unrated"])


if __name__ == "__main__":
    unittest.main()
