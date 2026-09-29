"""
Tests for the small "read input from the URL safely" helpers in routes/parsing.py.
Anyone can type anything into a URL, so these must never crash or accept nonsense.

Run from the backend folder:  python -m unittest -v
"""

import unittest

from routes.parsing import parse_coordinates, parse_radius


class TestParseCoordinates(unittest.TestCase):
    def test_real_coordinates(self):
        self.assertEqual(parse_coordinates("30.27", "-97.74"), (30.27, -97.74))

    def test_missing_values(self):
        self.assertIsNone(parse_coordinates(None, "-97.74"))

    def test_not_numbers(self):
        self.assertIsNone(parse_coordinates("banana", "-97.74"))

    def test_impossible_places(self):
        self.assertIsNone(parse_coordinates("95", "10"))  # latitude only goes to 90
        self.assertIsNone(parse_coordinates("10", "200"))  # longitude only goes to 180


class TestParseRadius(unittest.TestCase):
    def test_default_when_missing_or_nonsense(self):
        self.assertEqual(parse_radius(None), 5000)
        self.assertEqual(parse_radius("banana"), 5000)

    def test_capped_at_googles_maximum(self):
        self.assertEqual(parse_radius("999999"), 50000)


if __name__ == "__main__":
    unittest.main()
