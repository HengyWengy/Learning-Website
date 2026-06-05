# LearnGate Shared Student Portal

A Node.js backend plus a unified student/admin portal for code-gated local learning videos and reading lessons.

## Run it on your computer

```bash
node server.js
```

Then open:

- Portal login: `http://127.0.0.1:8765/server.js`

The server now listens on your local network too. When you run `node server.js`, it prints one or more share links like:

```text
http://192.168.1.25:8765/server.js
```

Give that link to students on the same Wi-Fi/LAN. They should open the student link in their browser.
Use the same portal link to choose either Student or Admin.

If Windows asks whether to allow Node.js through the firewall, allow it on private networks.

Default admin password:

```text
teacher123
```

To set your own password before starting the server:

```bash
ADMIN_PASSWORD=my-secret-password node server.js
```

In Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD="my-secret-password"
node server.js
```

## How it works

- Students create an account or log in, and their progress is saved in learngate.db.
- Lessons now use the custom course in `course-data.js`: MPOS video plus Will, KWSP/EPF, SOCSO/SEPCC, and protection-map reading checkpoints.
- Student pages do not link to the source PDFs, PPTX files, or old media folder. MPOS video is streamed from `protected_media` only after login and lesson unlock.
- Students still ask you for the current class entry code.
- You choose Admin on the portal to see the private entry code.
- After a student answers a checkpoint correctly, their next-video code appears only on the admin dashboard and their quiz attempt is saved.
- The student enters the next code you give them to continue.

## Sharing computer to computer

1. Connect all computers to the same Wi-Fi/LAN.
2. On the teacher computer, run `node server.js`.
3. Open the portal on the teacher computer: `http://127.0.0.1:8765/server.js`.
4. Give students the `http://192.168...:8765/server.js` link printed in the terminal.
5. Give students the entry and next-video codes from the admin dashboard when needed.

## Sharing online

For other people outside your computer to use it, deploy this folder to a Node.js host such as Render, Railway, Fly.io, or a VPS. The local address `127.0.0.1` only works on your own computer.

Student accounts, course progress, class codes, and quiz attempts are saved in `learngate.db`. Login sessions are still temporary, so students may need to log in again after a server restart. For production, add HTTPS and stronger admin login.

## Saved progress

The SQLite file learngate.db stores student accounts, lesson progress, class codes, and quiz attempts. Restarting the server keeps account progress, but clears browser login sessions, so students should log in again.

