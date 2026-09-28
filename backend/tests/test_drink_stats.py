"""
Automated tests for routes/drink_stats.py.

Run them from the backend folder with:
    python -m unittest -v

Each test builds some made-up posts, runs the real function,
and checks the answer is what we expect.
"""

import unittest

from routes.drink_stats import confidence_score, drink_key, top_drinks


def post(drink, rating, milk=None, temperature=None, custom=None):
    """Helper: make a fake post with just the fields the stats use."""
    return {"drink": drink, "rating": rating, "milk": milk,
            "temperature": temperature, "drink_custom": custom}


class TestDrinkKey(unittest.TestCase):
    def test_old_posts_without_a_drink_are_skipped(self):
        self.assertIsNone(drink_key({"rating": 5}))

    def test_iced_and_hot_are_different_drinks(self):
        self.assertNotEqual(drink_key(post("latte", 5, temperature="iced")),
                            drink_key(post("latte", 5, temperature="hot")))

    def test_other_drinks_ignore_upper_and_lower_case(self):
        self.assertEqual(drink_key(post("other", 5, custom="Lavender Latte")),
                         drink_key(post("other", 4, custom="  lavender latte ")))


class TestConfidenceScore(unittest.TestCase):
    def test_one_rating_is_pulled_towards_the_neutral_rating(self):
        # One 5-star rating, neutral point 4.0 -> (5 + 2*4) / 3 = 4.33
        self.assertAlmostEqual(confidence_score([5], prior_average=4.0), 4.33, places=2)

    def test_many_ratings_mostly_keep_their_own_average(self):
        score = confidence_score([5] * 20, prior_average=4.0)
        self.assertGreater(score, 4.9)


class TestTopDrinks(unittest.TestCase):
    def test_no_journal_posts_means_no_top_drinks(self):
        self.assertEqual(top_drinks([{"rating": 5}, {"rating": 3}]), [])

    def test_many_good_ratings_beat_one_lucky_rating(self):
        posts = [post("latte", r) for r in [5, 5, 5, 5, 4]] + [post("mocha", 5)]
        result = top_drinks(posts)
        self.assertEqual(result[0]["drink"], "latte")  # 4.8 from 5 people...
        self.assertEqual(result[1]["drink"], "mocha")  # ...beats 5.0 from 1 person

    def test_only_the_top_few_are_returned(self):
        posts = [post(d, 4) for d in ["latte", "mocha", "cortado", "espresso", "chai"]]
        self.assertEqual(len(top_drinks(posts, limit=3)), 3)

    def test_result_includes_average_and_count(self):
        result = top_drinks([post("cortado", 4), post("cortado", 5)])
        self.assertEqual(result[0]["average"], 4.5)
        self.assertEqual(result[0]["count"], 2)


if __name__ == "__main__":
    unittest.main()
