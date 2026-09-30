"""
Fair "Top rated" ordering for café search results.

The problem: sorting by Google's star rating alone puts a café with 5.0 from
3 reviews above one with 4.8 from 2,000 reviews. A handful of reviews can
easily be friends and family, so that 5.0 isn't really trustworthy yet.

The fix (a "weighted" or "Bayesian" average, the same idea IMDb uses for its
top-250 list): pretend every café starts with some imaginary average reviews,
then add its real ones. With few real reviews, the score stays close to the
average. With lots of real reviews, the real rating wins.
"""

# How many imaginary reviews every café starts with. Bigger = more reviews
# needed before a café's own rating "counts".
PRIOR_REVIEWS = 50

# The rating those imaginary reviews give: a typical café on Google.
PRIOR_RATING = 4.3


def fair_score(rating, review_count):
    """
    One number to sort by (higher = better). Cafés with no rating get 0,
    so they always go last.
    """
    if not isinstance(rating, (int, float)):
        return 0
    count = review_count if isinstance(review_count, int) and review_count > 0 else 0
    return (rating * count + PRIOR_RATING * PRIOR_REVIEWS) / (count + PRIOR_REVIEWS)


def sort_top_rated(cafes):
    """Sort cafés best first, using fair_score. Changes the list in place."""
    cafes.sort(key=lambda c: fair_score(c.get("rating"), c.get("rating_count")), reverse=True)
