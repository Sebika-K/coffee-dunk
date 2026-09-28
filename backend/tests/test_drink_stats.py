"""
Automated tests for routes/drink_stats.py.

Run them from the backend folder with:
    python -m unittest -v

Each test builds some made-up posts, runs the real function,
and checks the answer is what we expect.
"""

import unittest

from routes.drink_stats import (
    confidence_score,
    drink_key,
    favourite_drink,
    recommend_cafes,
    top_drinks,
    weighted_confidence_score,
)


def post(drink, rating, milk=None, temperature=None, custom=None, place_id=None, user_id=None):
    """Helper: make a fake post with just the fields the stats use."""
    return {"drink": drink, "rating": rating, "milk": milk,
            "temperature": temperature, "drink_custom": custom,
            "place_id": place_id, "cafe_name": place_id, "user_id": user_id}


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


class TestFavouriteDrink(unittest.TestCase):
    def test_favourite_needs_several_good_ratings(self):
        mine = [post("latte", 5, milk="oat")] * 3 + [post("mocha", 5)]
        self.assertEqual(favourite_drink(mine)["drink"], "latte")

    def test_no_favourite_if_nothing_is_rated_well(self):
        mine = [post("latte", 2), post("mocha", 3)]
        self.assertIsNone(favourite_drink(mine))


class TestRecommendCafes(unittest.TestCase):
    favourite = post("latte", 5, milk="oat")

    def test_recommends_cafes_where_others_love_the_drink(self):
        posts = [post("latte", 5, milk="oat", place_id="cafeA", user_id="other")] * 3
        result = recommend_cafes(posts, self.favourite, exclude_place_ids=set())
        self.assertEqual(result[0]["place_id"], "cafeA")

    def test_skips_cafes_you_have_already_been_to(self):
        posts = [post("latte", 5, milk="oat", place_id="cafeA", user_id="other")] * 3
        result = recommend_cafes(posts, self.favourite, exclude_place_ids={"cafeA"})
        self.assertEqual(result, [])

    def test_ignores_your_own_ratings(self):
        posts = [post("latte", 5, milk="oat", place_id="cafeA", user_id="me")] * 3
        result = recommend_cafes(posts, self.favourite, set(), exclude_user_id="me")
        self.assertEqual(result, [])

    def test_only_the_same_drink_counts(self):
        # A great PLAIN latte doesn't mean a great OAT latte
        posts = [post("latte", 5, place_id="cafeA", user_id="other")] * 3
        self.assertEqual(recommend_cafes(posts, self.favourite, set()), [])

    def test_skips_cafes_where_the_drink_is_rated_badly(self):
        posts = [post("latte", 2, milk="oat", place_id="cafeA", user_id="other")] * 3
        self.assertEqual(recommend_cafes(posts, self.favourite, set()), [])

    def test_better_cafe_comes_first(self):
        posts = (
            [post("latte", 4, milk="oat", place_id="okCafe", user_id="x")] * 3
            + [post("latte", 5, milk="oat", place_id="greatCafe", user_id="x")] * 3
        )
        result = recommend_cafes(posts, self.favourite, set())
        self.assertEqual([r["place_id"] for r in result], ["greatCafe", "okCafe"])


class TestFriendsTaste(unittest.TestCase):
    favourite = post("latte", 5, milk="oat")

    def test_equal_weights_match_the_normal_score(self):
        self.assertAlmostEqual(
            weighted_confidence_score([(5, 1), (4, 1)], prior_average=3.0),
            confidence_score([5, 4], prior_average=3.0),
        )

    def test_a_friend_counts_more_than_a_stranger(self):
        # Same rating, one café rated by a friend, one by a stranger
        posts = [
            post("latte", 5, milk="oat", place_id="friendCafe", user_id="bestie"),
            post("latte", 5, milk="oat", place_id="strangerCafe", user_id="stranger"),
        ]
        result = recommend_cafes(posts, self.favourite, set(), friend_ids={"bestie"})
        self.assertEqual(result[0]["place_id"], "friendCafe")

    def test_friends_are_counted_once_each(self):
        posts = [post("latte", 5, milk="oat", place_id="cafeA", user_id="bestie")] * 2 + [
            post("latte", 4, milk="oat", place_id="cafeA", user_id="pal"),
            post("latte", 4, milk="oat", place_id="cafeA", user_id="stranger"),
        ]
        result = recommend_cafes(posts, self.favourite, set(), friend_ids={"bestie", "pal"})
        self.assertEqual(result[0]["friends_count"], 2)  # bestie + pal, not 3

    def test_without_friends_nothing_changes(self):
        posts = [post("latte", 5, milk="oat", place_id="cafeA", user_id="x")] * 3
        result = recommend_cafes(posts, self.favourite, set())
        self.assertEqual(result[0]["friends_count"], 0)


if __name__ == "__main__":
    unittest.main()
