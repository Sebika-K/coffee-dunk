"""
Who can see which posts (friends-only).

Pure Python - no Flask or Firebase - so it's easy to test.
The database rules enforce the same thing for the app; this is for the
backend, which uses the Admin SDK and skips those rules.
"""


def visible_posts(posts, viewer_id, friend_ids):
    """Only the posts written by the viewer or one of their friends."""
    allowed = set(friend_ids) | {viewer_id}
    return [p for p in posts if p.get("user_id") in allowed]
