import unittest

from routes.privacy import visible_posts


def post(user_id):
    return {"user_id": user_id, "caption": "coffee"}


class VisiblePostsTests(unittest.TestCase):
    def test_keeps_my_posts_and_friends_posts(self):
        posts = [post("me"), post("sam"), post("stranger")]
        result = visible_posts(posts, "me", {"sam"})
        self.assertEqual([p["user_id"] for p in result], ["me", "sam"])

    def test_no_friends_means_only_my_posts(self):
        posts = [post("me"), post("stranger")]
        self.assertEqual(visible_posts(posts, "me", set()), [post("me")])

    def test_old_posts_without_an_owner_are_hidden(self):
        self.assertEqual(visible_posts([{"caption": "old"}], "me", {"sam"}), [])

    def test_keeps_the_original_order(self):
        posts = [post("sam"), post("me"), post("sam")]
        self.assertEqual(len(visible_posts(posts, "me", {"sam"})), 3)
        self.assertEqual(visible_posts(posts, "me", {"sam"})[1]["user_id"], "me")


if __name__ == "__main__":
    unittest.main()
