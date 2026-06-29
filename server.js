const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const course = require("./course-data");

const root = __dirname;
const dataRoot = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : root;
const protectedMediaRoot = process.env.MEDIA_DIR ? path.resolve(process.env.MEDIA_DIR) : path.join(root, "protected_media");
fs.mkdirSync(dataRoot, { recursive: true });
fs.mkdirSync(protectedMediaRoot, { recursive: true });
const dbPath = path.join(dataRoot, "learngate-data.json");
const store = loadStore();
const sessions = new Map();
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "teacher123";
const STUDENT_LOGIN_PATH = "/server.js";
const PORTAL_PATHS = new Set(["/", STUDENT_LOGIN_PATH, "/admin.html", "/login", "/portal"]);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mp4": "video/mp4",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

function createCode(prefix) {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function normalizeCode(value) {
  return String(value || "").trim().replace(/\s+/g, "-").toUpperCase();
}

function publicCourse() {
  return course.map(({ quiz, mediaFile, ...lesson }) => lesson);
}

function publicQuestions(lesson) {
  return lesson.quiz.questions.map(({ question, options }) => ({ question, options }));
}

function createEmptyStore() {
  return {
    students: [],
    courseProgress: [],
    classCodes: [],
    quizAttempts: [],
    counters: { students: 1, courseProgress: 1, classCodes: 1, quizAttempts: 1 },
  };
}

function loadStore() {
  if (!fs.existsSync(dbPath)) return createEmptyStore();
  try {
    const loaded = JSON.parse(fs.readFileSync(dbPath, "utf8"));
    const empty = createEmptyStore();
    return {
      ...empty,
      ...loaded,
      counters: { ...empty.counters, ...(loaded.counters || {}) },
    };
  } catch {
    return createEmptyStore();
  }
}

function saveStore() {
  const tempPath = `${dbPath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(store, null, 2));
  fs.renameSync(tempPath, dbPath);
}

function nextId(collectionName) {
  const id = store.counters[collectionName] || 1;
  store.counters[collectionName] = id + 1;
  return id;
}

function nowIso() {
  return new Date().toISOString();
}

function initializeDatabase() {
  saveStore();
}

function getCurrentEntryCode() {
  const row = [...store.classCodes].filter((code) => code.codeType === "entry").sort((a, b) => b.id - a.id)[0];
  if (row) return row.code;
  const code = createCode("LG");
  store.classCodes.push({ id: nextId("classCodes"), code, codeType: "entry", studentId: null, lessonIndex: null, usedAt: null, createdAt: nowIso(), expiresAt: null });
  saveStore();
  return code;
}

let classEntryCode = null;
initializeDatabase();
classEntryCode = getCurrentEntryCode();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");
  if (!salt || !expectedHash) return false;
  const actualHash = hashPassword(password, salt).split(":")[1];
  return crypto.timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"));
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function validateCredentials(username, password) {
  if (!/^[a-z0-9_.-]{3,32}$/.test(username)) {
    const error = new Error("Username must be 3-32 characters using letters, numbers, dots, dashes, or underscores.");
    error.statusCode = 400;
    throw error;
  }
  if (String(password || "").length < 6) {
    const error = new Error("Password must be at least 6 characters.");
    error.statusCode = 400;
    throw error;
  }
}

function createStudent({ username, password, displayName }) {
  const cleanUsername = normalizeUsername(username);
  validateCredentials(cleanUsername, password);
  const cleanDisplayName = String(displayName || cleanUsername).trim().slice(0, 60) || cleanUsername;
  if (store.students.some((student) => student.username === cleanUsername)) {
    const duplicate = new Error("That username is already taken.");
    duplicate.statusCode = 409;
    throw duplicate;
  }
  const student = {
    id: nextId("students"),
    username: cleanUsername,
    passwordHash: hashPassword(password),
    displayName: cleanDisplayName,
    createdAt: nowIso(),
    lastLoginAt: null,
  };
  store.students.push(student);
  saveStore();
  ensureProgress(student.id);
  return getStudentById(student.id);
}

function getStudentById(studentId) {
  return store.students.find((student) => student.id === Number(studentId)) || null;
}

function getStudentByUsername(username) {
  return store.students.find((student) => student.username === normalizeUsername(username)) || null;
}

function publicStudent(student) {
  return { id: student.id, username: student.username, displayName: student.displayName };
}

function loginStudent(username, password) {
  const student = getStudentByUsername(username);
  if (!student || !verifyPassword(password, student.passwordHash)) {
    const error = new Error("Username or password is incorrect.");
    error.statusCode = 401;
    throw error;
  }
  student.lastLoginAt = nowIso();
  saveStore();
  ensureProgress(student.id);
  return student;
}

function createAuthSession(student) {
  const session = { id: crypto.randomUUID(), studentId: student.id, createdAt: Date.now(), lastSeen: Date.now() };
  sessions.set(session.id, session);
  return session;
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastSeen > SESSION_TTL_MS) sessions.delete(id);
  }
}

function getSession(sessionId) {
  cleanupSessions();
  const session = sessions.get(sessionId);
  if (!session) return null;
  session.lastSeen = Date.now();
  return session;
}

function requireSession(payload) {
  const session = getSession(payload.sessionId);
  if (!session) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }
  const student = getStudentById(session.studentId);
  if (!student) {
    sessions.delete(session.id);
    const error = new Error("This account no longer exists.");
    error.statusCode = 401;
    throw error;
  }
  return { session, student };
}

function ensureProgress(studentId) {
  if (store.courseProgress.some((progress) => progress.studentId === Number(studentId))) return;
  store.courseProgress.push({
    id: nextId("courseProgress"),
    studentId: Number(studentId),
    started: 0,
    activeIndex: 0,
    unlockedIndex: 0,
    completedLessonIds: "[]",
    courseComplete: 0,
    updatedAt: nowIso(),
  });
  saveStore();
}

function parseCompletedIds(value) {
  try { return new Set(JSON.parse(value || "[]")); } catch { return new Set(); }
}

function getProgress(studentId) {
  ensureProgress(studentId);
  const row = store.courseProgress.find((progress) => progress.studentId === Number(studentId));
  return {
    started: Boolean(row.started),
    activeIndex: Math.min(Math.max(Number(row.activeIndex) || 0, 0), course.length - 1),
    unlockedIndex: Math.min(Math.max(Number(row.unlockedIndex) || 0, 0), course.length - 1),
    completedIds: parseCompletedIds(row.completedLessonIds),
    courseComplete: Boolean(row.courseComplete),
  };
}

function saveProgress(studentId, progress) {
  ensureProgress(studentId);
  const row = store.courseProgress.find((item) => item.studentId === Number(studentId));
  row.started = progress.started ? 1 : 0;
  row.activeIndex = progress.activeIndex;
  row.unlockedIndex = progress.unlockedIndex;
  row.completedLessonIds = JSON.stringify([...progress.completedIds]);
  row.courseComplete = progress.courseComplete ? 1 : 0;
  row.updatedAt = nowIso();
  saveStore();
}

function requireStarted(progress) {
  if (!progress.started) {
    const error = new Error("Enter the instructor's entry code before starting.");
    error.statusCode = 403;
    throw error;
  }
}

function publicLesson(lesson, index, progress, includeQuiz = false) {
  const completed = progress.completedIds.has(lesson.id);
  const locked = progress.started ? index > progress.unlockedIndex : index > 0;
  const current = progress.started ? index === progress.activeIndex : index === 0;
  const status = completed ? "Completed" : locked ? "Locked" : current ? "Current" : "Open";
  return {
    id: lesson.id,
    title: lesson.title,
    topic: lesson.topic,
    duration: lesson.duration,
    hasVideo: Boolean(lesson.hasVideo),
    contentBlocks: lesson.contentBlocks || [],
    description: lesson.description,
    completed,
    locked,
    current,
    status,
    quiz: includeQuiz ? { questions: publicQuestions(lesson) } : undefined,
  };
}

function buildState(student) {
  const progress = getProgress(student.id);
  const pending = getAnyPendingNextCode(student.id);
  if (pending && pending.lessonIndex !== progress.activeIndex) {
    progress.activeIndex = pending.lessonIndex;
    progress.unlockedIndex = Math.max(progress.unlockedIndex, progress.activeIndex);
    progress.courseComplete = false;
    saveProgress(student.id, progress);
  }
  const currentLesson = course[progress.activeIndex];
  const totalLessons = course.length;
  const progressPercent = Math.round(((progress.unlockedIndex + 1) / totalLessons) * 100);
  const shouldHaveNextCode = progress.started && !progress.courseComplete && progress.activeIndex < course.length - 1 && progress.completedIds.has(currentLesson.id) && progress.unlockedIndex <= progress.activeIndex;
  if (shouldHaveNextCode) ensurePendingNextCode(student.id, progress.activeIndex);
  const needsNextCode = Boolean(getPendingNextCode(student.id, progress.activeIndex));
  const courseComplete = progress.courseComplete && !needsNextCode && progress.activeIndex === course.length - 1 && progress.completedIds.has(course[course.length - 1].id);
  if (progress.courseComplete && !courseComplete) {
    progress.courseComplete = false;
    saveProgress(student.id, progress);
  }
  return {
    student: publicStudent(student),
    started: progress.started,
    activeIndex: progress.activeIndex,
    unlockedIndex: progress.unlockedIndex,
    totalLessons,
    progressPercent,
    courseComplete,
    needsNextCode,
    currentLesson: publicLesson(currentLesson, progress.activeIndex, progress, true),
    lessons: course.map((lesson, index) => publicLesson(lesson, index, progress, false)),
  };
}

function buildPreviewState() {
  const progress = { started: false, activeIndex: 0, unlockedIndex: 0, completedIds: new Set(), courseComplete: false };
  return {
    started: false,
    activeIndex: 0,
    unlockedIndex: 0,
    totalLessons: course.length,
    progressPercent: Math.round(100 / course.length),
    courseComplete: false,
    currentLesson: publicLesson(course[0], 0, progress, true),
    lessons: course.map((lesson, index) => publicLesson(lesson, index, progress, false)),
  };
}

function getPendingNextCode(studentId, lessonIndex) {
  if (lessonIndex < 0 || lessonIndex >= course.length - 1) return null;
  return [...store.classCodes]
    .filter((code) => code.codeType === "next" && code.studentId === Number(studentId) && code.lessonIndex === Number(lessonIndex) && !code.usedAt)
    .sort((a, b) => b.id - a.id)[0] || null;
}

function getAnyPendingNextCode(studentId) {
  return [...store.classCodes]
    .filter((code) => code.codeType === "next" && code.studentId === Number(studentId) && code.lessonIndex >= 0 && code.lessonIndex < course.length - 1 && !code.usedAt)
    .sort((a, b) => b.id - a.id)[0] || null;
}

function ensurePendingNextCode(studentId, lessonIndex) {
  const existing = getPendingNextCode(studentId, lessonIndex);
  if (existing) return existing;
  const code = createCode("NEXT");
  const pending = { id: nextId("classCodes"), code, codeType: "next", studentId: Number(studentId), lessonIndex: Number(lessonIndex), usedAt: null, createdAt: nowIso(), expiresAt: null };
  store.classCodes.push(pending);
  saveStore();
  return pending;
}

function markCodeUsed(codeId) {
  const code = store.classCodes.find((item) => item.id === Number(codeId));
  if (code) {
    code.usedAt = nowIso();
    saveStore();
  }
}

function insertQuizAttempt(studentId, lessonId, answerIndex, correct) {
  store.quizAttempts.push({
    id: nextId("quizAttempts"),
    studentId: Number(studentId),
    lessonId,
    answerIndex,
    correct: correct ? 1 : 0,
    attemptedAt: nowIso(),
  });
  saveStore();
}

function buildAdminStatus() {
  const students = [...store.students].sort((a, b) => b.id - a.id);
  const summaries = students.map((student) => {
    const progress = getProgress(student.id);
    const lesson = course[progress.activeIndex];
    const pending = getAnyPendingNextCode(student.id);
    const status = progress.courseComplete ? "Course complete" : pending ? "Waiting for next code" : progress.started ? "In progress" : "Waiting for entry";
    return {
      studentId: student.id,
      username: student.username,
      displayName: student.displayName,
      status,
      activeIndex: progress.activeIndex,
      unlockedIndex: progress.unlockedIndex,
      currentLessonTitle: lesson.title,
      progressLabel: `${progress.activeIndex + 1} of ${course.length}`,
      pendingNextCode: pending?.code || null,
      completedCount: progress.completedIds.size,
      createdAt: student.createdAt,
      lastLoginAt: student.lastLoginAt,
    };
  });
  return { entryCode: classEntryCode, sessions: summaries, course: publicCourse(), media: mediaStatus() };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); } catch { reject(new Error("Request body must be valid JSON.")); }
    });
    request.on("error", reject);
  });
}

function readBuffer(request, maxBytes = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Upload chunk is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function hasAdminAccess(request) {
  const suppliedPassword = request.headers["x-admin-password"];
  return typeof suppliedPassword === "string" && suppliedPassword === ADMIN_PASSWORD;
}

function requireAdmin(request) {
  if (!hasAdminAccess(request)) {
    const error = new Error("Admin password is incorrect.");
    error.statusCode = 401;
    throw error;
  }
}

function streamFile(request, response, file, contentType) {
  fs.stat(file, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const headers = { "Content-Type": contentType, "Cache-Control": "no-store" };
    const range = request.headers.range;

    if (range && contentType.startsWith("video/")) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      const start = match && match[1] ? Number(match[1]) : 0;
      const end = match && match[2] ? Number(match[2]) : stats.size - 1;

      if (!match || start > end || start >= stats.size || end >= stats.size) {
        response.writeHead(416, { "Content-Range": `bytes */${stats.size}` });
        response.end();
        return;
      }

      response.writeHead(206, {
        ...headers,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stats.size}`,
      });
      fs.createReadStream(file, { start, end }).pipe(response);
      return;
    }

    response.writeHead(200, {
      ...headers,
      "Accept-Ranges": contentType.startsWith("video/") ? "bytes" : "none",
      "Content-Length": stats.size,
    });
    fs.createReadStream(file).pipe(response);
  });
}

function expectedMediaFiles() {
  return new Set(course.filter((lesson) => lesson.hasVideo && lesson.mediaFile).map((lesson) => lesson.mediaFile));
}

function mediaStatus() {
  return course.filter((lesson) => lesson.hasVideo && lesson.mediaFile).map((lesson) => {
    const file = path.resolve(protectedMediaRoot, lesson.mediaFile);
    const insideMediaRoot = file.startsWith(protectedMediaRoot);
    const stats = insideMediaRoot && fs.existsSync(file) ? fs.statSync(file) : null;
    return {
      lessonId: lesson.id,
      title: lesson.title,
      mediaFile: lesson.mediaFile,
      exists: Boolean(stats?.isFile()),
      size: stats?.isFile() ? stats.size : 0,
    };
  });
}

async function handleMediaChunkUpload(request, response) {
  const mediaFile = path.basename(String(request.headers["x-media-file"] || ""));
  const uploadId = String(request.headers["x-upload-id"] || "").replace(/[^a-zA-Z0-9_-]/g, "");
  const chunkIndex = Number(request.headers["x-chunk-index"]);
  const totalChunks = Number(request.headers["x-total-chunks"]);

  if (!expectedMediaFiles().has(mediaFile)) {
    sendJson(response, 400, { error: "Choose one of the expected lesson video filenames." });
    return;
  }
  if (!uploadId || !Number.isInteger(chunkIndex) || !Number.isInteger(totalChunks) || chunkIndex < 0 || totalChunks < 1 || chunkIndex >= totalChunks) {
    sendJson(response, 400, { error: "Invalid upload chunk metadata." });
    return;
  }

  const chunk = await readBuffer(request);
  const uploadDir = path.join(protectedMediaRoot, ".uploads");
  fs.mkdirSync(uploadDir, { recursive: true });
  const tempFile = path.join(uploadDir, `${uploadId}-${mediaFile}.part`);
  fs.appendFileSync(tempFile, chunk);

  if (chunkIndex === totalChunks - 1) {
    const finalFile = path.resolve(protectedMediaRoot, mediaFile);
    if (!finalFile.startsWith(protectedMediaRoot)) {
      sendJson(response, 403, { error: "Invalid media path." });
      return;
    }
    fs.renameSync(tempFile, finalFile);
    sendJson(response, 200, { ok: true, complete: true, media: mediaStatus() });
    return;
  }

  sendJson(response, 200, { ok: true, complete: false, nextChunk: chunkIndex + 1 });
}

async function handleAdminApi(request, response, pathname) {
  if (!pathname.startsWith("/api/admin/")) return false;
  try {
    requireAdmin(request);
    if (request.method === "GET" && pathname === "/api/admin/status") {
      sendJson(response, 200, buildAdminStatus());
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/media-chunk") {
      await handleMediaChunkUpload(request, response);
      return true;
    }
    if (request.method === "POST" && pathname === "/api/admin/entry-code") {
      await readJson(request);
      classEntryCode = createCode("LG");
      store.classCodes.push({ id: nextId("classCodes"), code: classEntryCode, codeType: "entry", studentId: null, lessonIndex: null, usedAt: null, createdAt: nowIso(), expiresAt: null });
      saveStore();
      sendJson(response, 200, buildAdminStatus());
      return true;
    }
    sendJson(response, 404, { error: "Unknown admin API endpoint." });
    return true;
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return true;
  }
}

async function handleApi(request, response, pathname) {
  const handledAdmin = await handleAdminApi(request, response, pathname);
  if (handledAdmin) return true;

  if (request.method === "GET" && pathname === "/api/course") {
    sendJson(response, 200, { state: buildPreviewState(), lessons: publicCourse() });
    return true;
  }

  if (request.method === "GET" && pathname === "/api/state") {
    const url = new URL(request.url, "http://localhost");
    try {
      const { student } = requireSession({ sessionId: url.searchParams.get("sessionId") });
      sendJson(response, 200, { state: buildState(student) });
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message });
    }
    return true;
  }

  if (request.method === "GET" && pathname === "/api/lesson-media") {
    const url = new URL(request.url, "http://localhost");
    try {
      const { student } = requireSession({ sessionId: url.searchParams.get("sessionId") });
      const lessonIndex = course.findIndex((lesson) => lesson.id === url.searchParams.get("lessonId"));
      const progress = getProgress(student.id);
      requireStarted(progress);
      if (lessonIndex === -1 || lessonIndex > progress.unlockedIndex) {
        sendJson(response, 403, { error: "That lesson is still locked." });
        return true;
      }
      const lesson = course[lessonIndex];
      if (!lesson.hasVideo || !lesson.mediaFile) {
        sendJson(response, 404, { error: "This lesson does not have protected video media." });
        return true;
      }
      const file = path.resolve(protectedMediaRoot, lesson.mediaFile);
      if (!file.startsWith(protectedMediaRoot)) {
        response.writeHead(403);
        response.end("Forbidden");
        return true;
      }
      streamFile(request, response, file, mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream");
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message });
    }
    return true;
  }

  if (!pathname.startsWith("/api/")) return false;

  try {
    const payload = await readJson(request);

    if (request.method === "POST" && pathname === "/api/register") {
      const student = createStudent(payload);
      const session = createAuthSession(student);
      sendJson(response, 200, { ok: true, sessionId: session.id, student: publicStudent(student), state: buildState(student) });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/login") {
      const student = loginStudent(payload.username, payload.password);
      const session = createAuthSession(student);
      sendJson(response, 200, { ok: true, sessionId: session.id, student: publicStudent(student), state: buildState(student) });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/logout") {
      if (payload.sessionId) sessions.delete(payload.sessionId);
      sendJson(response, 200, { ok: true });
      return true;
    }

    const { student } = requireSession(payload);

    if (request.method === "POST" && pathname === "/api/entry") {
      if (normalizeCode(payload.code) !== classEntryCode) {
        sendJson(response, 401, { error: "That entry code is not active. Ask your instructor for the current code." });
        return true;
      }
      const progress = getProgress(student.id);
      progress.started = true;
      saveProgress(student.id, progress);
      sendJson(response, 200, { ok: true, state: buildState(student) });
      return true;
    }

    const progress = getProgress(student.id);
    requireStarted(progress);

    if (request.method === "POST" && pathname === "/api/quiz") {
      const lesson = course[progress.activeIndex];
      if (payload.lessonId !== lesson.id) {
        sendJson(response, 409, { error: "That quiz is not the current unlocked lesson." });
        return true;
      }
      const questions = lesson.quiz.questions;
      const answerIndexes = Array.isArray(payload.answerIndexes) ? payload.answerIndexes.map(Number) : [Number(payload.answerIndex)];
      if (answerIndexes.length !== questions.length || answerIndexes.some((answerIndex) => !Number.isInteger(answerIndex))) {
        sendJson(response, 400, { error: `Answer all ${questions.length} checkpoint questions before submitting.` });
        return true;
      }
      const incorrectIndex = questions.findIndex((question, index) => answerIndexes[index] !== question.answerIndex);
      questions.forEach((question, index) => {
        insertQuizAttempt(student.id, `${lesson.id}:q${index + 1}`, answerIndexes[index], answerIndexes[index] === question.answerIndex);
      });
      if (incorrectIndex !== -1) {
        sendJson(response, 200, { ok: true, correct: false, error: `Question ${incorrectIndex + 1} is not quite right. Review the lesson and try again.`, state: buildState(student) });
        return true;
      }
      if (!progress.completedIds.has(lesson.id)) progress.completedIds.add(lesson.id);
      if (progress.activeIndex === course.length - 1) {
        progress.courseComplete = true;
        saveProgress(student.id, progress);
        sendJson(response, 200, { ok: true, correct: true, message: "Correct. The final checkpoint is complete.", needsNextCode: false, state: buildState(student) });
        return true;
      }
      ensurePendingNextCode(student.id, progress.activeIndex);
      saveProgress(student.id, progress);
      sendJson(response, 200, { ok: true, correct: true, message: `${lesson.quiz.success} Ask your instructor for the next video code.`, needsNextCode: true, state: buildState(student) });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/next") {
      const pending = getPendingNextCode(student.id, progress.activeIndex);
      if (!pending) {
        sendJson(response, 409, { error: "Answer the current checkpoint before entering a next video code." });
        return true;
      }
      if (normalizeCode(payload.code) !== pending.code) {
        sendJson(response, 401, { error: "That next video code does not match." });
        return true;
      }
      markCodeUsed(pending.id);
      progress.unlockedIndex = Math.max(progress.unlockedIndex, progress.activeIndex + 1);
      progress.activeIndex = Math.min(progress.activeIndex + 1, course.length - 1);
      progress.courseComplete = false;
      saveProgress(student.id, progress);
      sendJson(response, 200, { ok: true, state: buildState(student) });
      return true;
    }

    if (request.method === "POST" && pathname === "/api/select") {
      const lessonIndex = course.findIndex((lesson) => lesson.id === payload.lessonId);
      if (lessonIndex === -1 || lessonIndex > progress.unlockedIndex) {
        sendJson(response, 403, { error: "That lesson is still locked." });
        return true;
      }
      const pending = getAnyPendingNextCode(student.id);
      if (pending && pending.lessonIndex !== lessonIndex) {
        sendJson(response, 409, { error: "Enter the current next video code before switching lessons." });
        return true;
      }
      progress.activeIndex = lessonIndex;
      saveProgress(student.id, progress);
      sendJson(response, 200, { ok: true, needsNextCode: Boolean(getPendingNextCode(student.id, lessonIndex)), state: buildState(student) });
      return true;
    }

    sendJson(response, 404, { error: "Unknown API endpoint." });
    return true;
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return true;
  }
}

function serveStatic(request, response, pathname) {
  const target = PORTAL_PATHS.has(pathname.toLowerCase()) ? "index.html" : decodeURIComponent(pathname.slice(1));
  const topLevel = target.split(/[\\/]/)[0].toLowerCase();
  const lowerTarget = target.toLowerCase();
  const privateFiles = new Set(["server.js", "course-data.js", "learngate.db", "learngate.db-shm", "learngate.db-wal", "learngate-data.json", "learngate-data.json.tmp"]);
  if (privateFiles.has(lowerTarget) || lowerTarget.endsWith(".db") || lowerTarget.endsWith(".db-shm") || lowerTarget.endsWith(".db-wal")) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  if (topLevel === "media" || topLevel === "protected_media") {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  const file = path.resolve(root, target);
  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  streamFile(request, response, file, mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream");
}

function createServer() {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");
    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, service: "learngate" });
      return;
    }
    const handled = await handleApi(request, response, url.pathname);
    if (handled) return;
    serveStatic(request, response, url.pathname);
  });
}

function getLocalNetworkUrls(port) {
  return Object.values(os.networkInterfaces()).flat().filter((network) => network && network.family === "IPv4" && !network.internal).map((network) => `http://${network.address}:${port}${STUDENT_LOGIN_PATH}`);
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8765);
  const host = process.env.HOST || "0.0.0.0";
  const server = createServer();
  server.listen(port, host, () => {
    console.log(`LearnGate backend is running on port ${port}`);
    console.log(`Portal login: http://127.0.0.1:${port}${STUDENT_LOGIN_PATH}`);
    console.log("Use the same portal link to log in as admin or student.");
    console.log("Share one of these portal links with computers on the same Wi-Fi/LAN:");
    for (const url of getLocalNetworkUrls(port)) console.log(`- ${url}`);
    console.log(`Admin password: ${ADMIN_PASSWORD}`);
  });
}

module.exports = { createServer, course };
