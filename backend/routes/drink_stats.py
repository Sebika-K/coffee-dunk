"""
Top drinks at a café, worked out from everyone's posts there.

These are plain Python functions - no Flask, no Firebase - so they're easy
to understand and easy to test (see tests/test_drink_stats.py).
"""

# How much "benefit of the doubt" a drink gets towards the café's average.
# Think of it as: every drink starts with this many pretend ratings that are
# exactly average. Real ratings then pull it up or down.
CONFIDENCE = 2

# The rating those pretend ratings have: 3 stars, the middle of the 1-5 scale.
# (We first tried the café's own average here - but at a café where everyone
# rates highly, that let one lucky 5-star drink win. A test caught it!)
NEUTRAL_RATING = 3.0


def drink_key(post):
    """
    What counts as "the same drink": same drink + milk + hot/iced.
    ("Iced oat latte" and "Hot latte" are different drinks.)
    For "other" drinks, the typed name is used, ignoring upper/lower case.
    Returns None for posts without a drink (old posts from before Phase 3).
    """
    drink = post.get("drink")
    if not drink:
        return None
    custom = (post.get("drink_custom") or "").strip().lower() if drink == "other" else None
    return (drink, custom, post.get("milk"), post.get("temperature"))


def confidence_score(ratings, prior_average, confidence=CONFIDENCE):
    """
    A "confidence-weighted" (Bayesian) average.

    Normal average:   sum / count
    This one:         (sum + confidence * prior_average) / (count + confidence)

    With few ratings, the score stays close to the neutral rating (3 stars).
    With many ratings, the drink's own average wins. So one lucky 5-star
    rating can't beat a drink that lots of people rated 4.7.
    """
    return (sum(ratings) + confidence * prior_average) / (len(ratings) + confidence)


def top_drinks(posts, limit=3):
    """
    Group a café's posts by drink and return the best `limit` drinks,
    best first. Each result looks like:
      { "drink": "latte", "drink_custom": None, "milk": "oat", "temperature": "iced",
        "average": 4.67, "count": 3, "score": 4.5 }
    """
    # Only posts that have both a drink and a rating can be ranked
    rated = [p for p in posts if drink_key(p) and isinstance(p.get("rating"), (int, float))]
    if not rated:
        return []

    # Group ratings by drink:  key -> list of ratings
    groups = {}
    examples = {}  # key -> one post, to copy the drink details from
    for p in rated:
        key = drink_key(p)
        groups.setdefault(key, []).append(p["rating"])
        examples.setdefault(key, p)

    results = []
    for key, ratings in groups.items():
        example = examples[key]
        results.append({
            "drink": example.get("drink"),
            "drink_custom": example.get("drink_custom") if example.get("drink") == "other" else None,
            "milk": example.get("milk"),
            "temperature": example.get("temperature"),
            "average": round(sum(ratings) / len(ratings), 2),
            "count": len(ratings),
            "score": round(confidence_score(ratings, NEUTRAL_RATING), 2),
        })

    # Best score first; if scores tie, the drink more people rated comes first
    results.sort(key=lambda r: (r["score"], r["count"]), reverse=True)
    return results[:limit]


# ---------------------------------------------------------------------------
# Recommendations (Phase 6)
# ---------------------------------------------------------------------------

# Only recommend based on a drink you actually LIKE (confidence score at least this)
MIN_FAVOURITE_SCORE = 3.5


def favourite_drink(user_posts):
    """
    The user's favourite drink = their best drink by confidence score
    (so one lucky 5-star doesn't count as a "favourite" - several good ratings do).
    Returns the drink details, or None if they have no clear favourite yet.
    """
    best = top_drinks(user_posts, limit=1)
    if not best or best[0]["score"] < MIN_FAVOURITE_SCORE:
        return None
    return best[0]


def recommend_cafes(posts, favourite, exclude_place_ids, exclude_user_id=None, limit=5):
    """
    Cafés where OTHER people rated the user's favourite drink highly.

    posts             - posts of that drink, from all cafés
    favourite         - the drink details (from favourite_drink)
    exclude_place_ids - cafés the user has already been to (we want NEW places)
    exclude_user_id   - the user themselves (their own ratings shouldn't recommend to them)

    Returns cafés best first:
      { "place_id": ..., "cafe_name": ..., "average": 4.7, "count": 3, "score": 4.1 }
    """
    wanted = drink_key(favourite)

    # Group ratings by café, for posts of exactly that drink
    groups = {}
    names = {}
    for p in posts:
        place_id = p.get("place_id")
        if (
            drink_key(p) != wanted
            or not isinstance(p.get("rating"), (int, float))
            or not place_id
            or place_id in exclude_place_ids
            or p.get("user_id") == exclude_user_id
        ):
            continue
        groups.setdefault(place_id, []).append(p["rating"])
        names.setdefault(place_id, p.get("cafe_name"))

    results = []
    for place_id, ratings in groups.items():
        score = confidence_score(ratings, NEUTRAL_RATING)
        if score <= NEUTRAL_RATING:
            continue  # only recommend cafés where the drink is rated ABOVE average
        results.append({
            "place_id": place_id,
            "cafe_name": names[place_id],
            "average": round(sum(ratings) / len(ratings), 2),
            "count": len(ratings),
            "score": round(score, 2),
        })

    results.sort(key=lambda r: (r["score"], r["count"]), reverse=True)
    return results[:limit]
