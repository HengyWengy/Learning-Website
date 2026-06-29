# LearnGate GitHub + Railway Deploy Notes

Upload the contents of this package to GitHub, then connect that repository to Railway.

## Railway settings

- Service: `Learning-Website`
- Start command: `node server.js`
- Public URL path: `/server.js`
- Admin password: set `ADMIN_PASSWORD` in Railway Variables
- This package includes a `Dockerfile`, so Railway can run it without guessing the Node setup.
- The included `railway.json` checks `/health` and always restarts the service after a crash.
- Persistent data:
  - Add one Railway Volume mounted at `/data`.
  - Set `DATA_DIR=/data` so student accounts and progress survive redeploys.
  - Set `MEDIA_DIR=/data/protected_media` so uploaded MP4 videos survive redeploys.

## Important video note

The MP4 files are intentionally not inside this GitHub package because GitHub rejects files around/over 100 MB. Put the videos into Railway persistent storage with these exact filenames:

- `general-vs-life.mp4`
- `critical-illness.mp4`
- `director-epf.mp4`
- `mpos-new.mp4`
- `socso-1.mp4`
- `family-insurance-2.mp4`
- `summary-3.mp4`

If videos are not uploaded to Railway, the website and login will still work, but the lesson player will not find the video files.

See `VIDEO_UPLOAD_GUIDE.md` for the lesson-to-video filename map.

## Easiest no-command video upload

Do this only after the Railway website is online. If the Railway service is offline, the uploader cannot work yet.

After Railway deploys successfully:

1. Open `https://YOUR-RAILWAY-DOMAIN/server.js`.
2. Choose `Admin`.
3. Log in with your admin password.
4. Use the `Lesson video slot` uploader in the Admin dashboard.
5. Pick the matching video slot and upload the MP4.

The uploader sends the video in small chunks, so you do not need to upload big MP4s to GitHub. For uploaded videos to survive Railway redeploys/restarts, add a Railway Volume and set `MEDIA_DIR` to the volume folder.

## If Railway says Offline

Check the Railway Deploy Logs first. The site must show a successful deploy before video upload is possible. This package has:

- `package.json` with `start: node server.js`
- `railway.json` with `startCommand: node server.js`
- no SQLite/native dependency required

If Railway still stays offline, redeploy the latest GitHub commit and check that the service root is the folder containing `server.js`.

## Links

- Student/Admin portal: `https://YOUR-RAILWAY-DOMAIN/server.js`
- Admin login uses the same portal, choose `Admin`.
