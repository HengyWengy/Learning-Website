# Video Upload Guide

Do not upload MP4 videos to GitHub. GitHub browser upload limits are too small for these files.

## Easiest method: upload from the Admin page

After Railway is online:

1. Open `https://YOUR-RAILWAY-DOMAIN/server.js`.
2. Choose `Admin`.
3. Log in.
4. Find `Lesson video slot`.
5. Select the matching lesson slot.
6. Choose the MP4 file from your computer.
7. Click `Upload video`.

## Lesson-to-file map

Use these exact lesson slots / filenames:

| Lesson in website | Upload/select this filename |
|---|---|
| General vs Life Insurance | `general-vs-life.mp4` |
| Critical Illness Insurance | `critical-illness.mp4` |
| Director EPF | `director-epf.mp4` |
| MPOS Operation Flow | `mpos-new.mp4` |
| SOCSO Conversation | `socso-1.mp4` |
| Family Insurance Planning | `family-insurance-2.mp4` |
| Summary and Reflection | `summary-3.mp4` |

## If placing videos directly into Railway storage

Create one Railway Volume mounted at `/data`, then set:

```text
MEDIA_DIR=/data/protected_media
DATA_DIR=/data
```

Then put the MP4 files inside the `MEDIA_DIR` folder using the exact filenames above.

The website will show `Missing` or `Uploaded` beside each lesson in the Admin dashboard.
