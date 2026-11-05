# pgquery demo bucket

This is a read-only sample bucket for trying the S3 browser in pgquery. It
holds the project's artwork, a few screenshots, a short screen recording and
two small data files, so every kind of preview has something to show.

| Folder | What is in it | Preview |
|---|---|---|
| `brand/` | Tuple the elephant, the banner and the pixel icons (SVG) | image |
| `screenshots/` | The SQL editor, a query plan, dark mode and a schema plate (PNG) | image |
| `video/` | A 21 second recording of the app | video, seekable |
| `data/` | The record store's artists as CSV and as JSON | text |

You can browse, search, preview and download. Uploads, new folders and deletes
are switched off here; connect your own bucket to use them.

The bucket is reset every day. If you want to look at how it is wired, the
source is at <https://github.com/Hxndrik/pgquery>.
