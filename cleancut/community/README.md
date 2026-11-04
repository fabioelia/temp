# Community data

Scene tags and skip lists for CleanCut live here as small JSON files. Anyone can
propose one with a pull request; once it is reviewed and merged, GitHub Actions
publishes it to GitHub Pages and the extension picks it up (within a few hours,
the extension caches the index).

```
community/
  titles/<platform>/*.json    scene tags for one title (platform: netflix, prime or web)
  lists/*.json                shared skip lists (rating settings)
```

## The easy way: from the extension

1. Tag scenes while you watch (`Alt+[` start, `Alt+]` end).
2. Open **CleanCut → Options → Your tags** and press **Submit on GitHub…**.
3. GitHub opens with the file filled in. Press **Propose new file**; if you don't have
   write access GitHub forks the repo and opens the pull request for you.

For a skip list: popup → **Share my settings as a skip list…**.

## Tag file format

`community/titles/netflix/20261104-abc123.json` (the file name doesn't matter; several files for one title are merged):

```json
{
  "title": {
    "platform": "netflix",
    "platformId": "70248288",
    "series": "Game of Thrones",
    "season": 1,
    "episode": 1,
    "name": "Winter Is Coming",
    "duration": 3720
  },
  "segments": [
    { "start": 1520.5, "end": 1588, "category": "sex", "severity": 3, "note": "brothel scene" },
    { "start": 2210, "end": 2226, "category": "violence", "severity": 2, "action": "blur" }
  ]
}
```

- `start`/`end`: seconds into the video **on that platform** (ads and different cuts shift timing).
- `category`: `nudity`, `sex`, `violence`, `gore`, `language`, `drugs`, `frightening`.
- `severity`: `1` mild, `2` moderate, `3` strong.
- `action` (optional): `skip`, `mute` or `blur`. Leave it out to follow the viewer's own choice.
- `platformId`: Netflix → the number in `/watch/<id>`; Prime → the episode ASIN. The extension's popup shows it.

## Skip list format

`community/lists/got-for-teens.json` (lowercase letters, digits and dashes in the file name):

```json
{
  "name": "GoT for teens",
  "description": "PG-13 but keeps the battle scenes",
  "author": "your-github-name",
  "settings": { "preset": "PG-13" },
  "title": { "platform": "netflix", "platformId": "70248288" }
}
```

Leave out `title` to make the list apply to every title.

## Checking your file

```bash
cd cleancut
node scripts/build-data.mjs --check
```

CI runs the same check on every pull request and prints each problem with its file and line of data.

## Reviewing (maintainers)

Moderation is the pull request. Look for:

- **Accuracy:** timestamps match the scene, and the category/severity is reasonable. Spot-check one or two.
- **Scope:** only `community/**` changes. Anything else (extension code, workflows) needs a separate, closer review.
- **No spam or abuse:** notes are short and factual; list names and descriptions are appropriate.
- **No personal data:** `author` should be a public GitHub name, nothing else.

To remove something, delete the file in a PR. Removal takes effect on the next publish.
