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
