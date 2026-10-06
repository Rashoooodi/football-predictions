# Scoring

Exact score predictions earn points.

- First correct prediction on a match: `first_correct_points` (default 2)
- Other correct predictions: `other_correct_points` (default 1)
- Wrong prediction: 0

Tiebreaker on the leaderboard is the earliest correct prediction timestamp.
Settings live in the `settings` table and can be changed from admin.
