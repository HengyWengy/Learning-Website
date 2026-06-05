const SESSION_KEY = "learngate_student_session";

const ADMIN_PASSWORD_KEY = "learngate_admin_password";

const state = {
  mode: "student",
  sessionId: sessionStorage.getItem(SESSION_KEY) || null,
  adminPassword: sessionStorage.getItem(ADMIN_PASSWORD_KEY) || "",
  adminStatus: null,
  student: null,
  backend: null,
  selectedAnswers: [],
  waitingForInstructorCode: false,
};

const elements = {
  gateView: document.querySelector("#gateView"),
  libraryView: document.querySelector("#libraryView"),
  adminView: document.querySelector("#adminView"),
  gateEyebrow: document.querySelector("#gateEyebrow"),
  gateTitle: document.querySelector("#gateTitle"),
  gateLead: document.querySelector("#gateLead"),
  studentModeButton: document.querySelector("#studentModeButton"),
  adminModeButton: document.querySelector("#adminModeButton"),
  studentAccess: document.querySelector("#studentAccess"),
  adminAccess: document.querySelector("#adminAccess"),
  authForm: document.querySelector("#authForm"),
  usernameInput: document.querySelector("#usernameInput"),
  displayNameInput: document.querySelector("#displayNameInput"),
  passwordInput: document.querySelector("#passwordInput"),
  authMessage: document.querySelector("#authMessage"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLoginMessage: document.querySelector("#adminLoginMessage"),
  signedInCard: document.querySelector("#signedInCard"),
  signedInName: document.querySelector("#signedInName"),
  logoutStudentButton: document.querySelector("#logoutStudentButton"),
  entryForm: document.querySelector("#entryForm"),
  entryCodeInput: document.querySelector("#entryCodeInput"),
  entryMessage: document.querySelector("#entryMessage"),
  participantCode: document.querySelector("#participantCode"),
  lessonCount: document.querySelector("#lessonCount"),
  previewRail: document.querySelector("#previewRail"),
  accessStatus: document.querySelector("#accessStatus"),
  lockButton: document.querySelector("#lockButton"),
  adminLogoutButton: document.querySelector("#adminLogoutButton"),
  playerShell: document.querySelector("#playerShell"),
  videoPlayer: document.querySelector("#videoPlayer"),
  materialPanel: document.querySelector("#materialPanel"),
  currentTopic: document.querySelector("#currentTopic"),
  currentTitle: document.querySelector("#currentTitle"),
  currentDescription: document.querySelector("#currentDescription"),
  quizHeading: document.querySelector("#quizHeading"),
  quizQuestions: document.querySelector("#quizQuestions"),
  quizForm: document.querySelector("#quizForm"),
  submitAnswerButton: document.querySelector("#submitAnswerButton"),
  checkpointState: document.querySelector("#checkpointState"),
  nextCodeForm: document.querySelector("#nextCodeForm"),
  nextCodeInput: document.querySelector("#nextCodeInput"),
  nextCodeHint: document.querySelector("#nextCodeHint"),
  quizMessage: document.querySelector("#quizMessage"),
  accessName: document.querySelector("#accessName"),
  progressText: document.querySelector("#progressText"),
  progressFill: document.querySelector("#progressFill"),
  lessonList: document.querySelector("#lessonList"),
  entryCodeDisplay: document.querySelector("#entryCodeDisplay"),
  regenerateEntryButton: document.querySelector("#regenerateEntryButton"),
  refreshButton: document.querySelector("#refreshButton"),
  participantCount: document.querySelector("#participantCount"),
  participantList: document.querySelector("#participantList"),
  courseCount: document.querySelector("#courseCount"),
  courseList: document.querySelector("#courseList"),
};

function normalizeCode(value) {
  return value.trim().replace(/\s+/g, "-").toUpperCase();
}

function setMessage(element, message, type = "error") {
  element.textContent = message;
  element.classList.toggle("success", type === "success");
}

function getInitialMode() {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname.toLowerCase();
  return params.get("role") === "admin" || path.endsWith("/admin.html") ? "admin" : "student";
}

function setMode(mode) {
  state.mode = mode;
  const isAdmin = mode === "admin";
  elements.studentAccess.hidden = isAdmin;
  elements.adminAccess.hidden = !isAdmin;
  elements.studentModeButton.setAttribute("aria-selected", String(!isAdmin));
  elements.adminModeButton.setAttribute("aria-selected", String(isAdmin));
  elements.gateEyebrow.textContent = isAdmin ? "Teacher only" : "Account and code required";
  elements.gateTitle.textContent = isAdmin ? "Admin access" : "Sign in to learn";
  elements.gateLead.textContent = isAdmin
    ? "Open the private dashboard for class codes, student progress, and next-video approvals."
    : "Create an account or log in so your video progress and quiz attempts are saved.";
  elements.accessStatus.textContent = isAdmin ? "Admin login" : state.student ? "Signed in" : "Signed out";
  setMessage(elements.authMessage, "");
  setMessage(elements.adminLoginMessage, "");
}

function getPreviewMedia(lesson) {
  const label = lesson.hasVideo ? "Video lesson" : "Reading lesson";
  return `<div class="video-placeholder" aria-hidden="true"><span>${label}</span></div>`;
}

function clearVideoPlayer() {
  elements.videoPlayer.pause();
  elements.videoPlayer.removeAttribute("src");
  elements.videoPlayer.load();
}

async function requestApi(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The backend request failed.");
  return data;
}

async function adminApi(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": state.adminPassword,
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The admin request failed.");
  return data;
}

function rememberSession(sessionId) {
  state.sessionId = sessionId;
  if (sessionId) sessionStorage.setItem(SESSION_KEY, sessionId);
  else sessionStorage.removeItem(SESSION_KEY);
}

function setStudent(student) {
  state.student = student;
  if (student) {
    elements.signedInName.textContent = `${student.displayName} (${student.username})`;
    elements.participantCode.textContent = student.username;
    if (state.mode !== "admin") elements.accessStatus.textContent = "Signed in";
    elements.authForm.hidden = true;
    elements.signedInCard.hidden = false;
    elements.entryForm.hidden = false;
  } else {
    elements.signedInName.textContent = "Student";
    elements.participantCode.textContent = "Not signed in";
    if (state.mode !== "admin") elements.accessStatus.textContent = "Signed out";
    elements.authForm.hidden = false;
    elements.signedInCard.hidden = true;
    elements.entryForm.hidden = true;
  }
}

async function loadPreview() {
  try {
    const data = await requestApi("/api/course");
    state.backend = data.state;
    renderPreview();
  } catch (error) {
    elements.participantCode.textContent = "Offline";
    elements.lessonCount.textContent = "0";
    setMessage(elements.authMessage, "Start the backend with node server.js, then refresh this page.");
  }
}

async function restoreSession() {
  if (!state.sessionId) return;
  try {
    const data = await requestApi(`/api/state?sessionId=${encodeURIComponent(state.sessionId)}`);
    state.backend = data.state;
    setStudent(data.state.student);
    if (data.state.started) unlockCourse(data.state);
    else showGate();
  } catch {
    rememberSession(null);
    setStudent(null);
  }
}

function showGate() {
  window.scrollTo(0, 0);
  elements.gateView.hidden = false;
  elements.libraryView.hidden = true;
  elements.adminView.hidden = true;
  elements.lockButton.hidden = true;
  elements.lockButton.textContent = "Portal";
  elements.adminLogoutButton.hidden = true;
  clearVideoPlayer();
  renderPreview();
}

function renderPreview() {
  const lessons = state.backend?.lessons || [];
  elements.lessonCount.textContent = lessons.length;
  elements.previewRail.innerHTML = lessons.map((lesson, index) => `
    <article class="preview-card">
      ${getPreviewMedia(lesson)}
      <div class="preview-content">
        <span class="badge">Step ${index + 1}</span>
        <div><span class="badge">${lesson.topic}</span><h2>${lesson.title}</h2></div>
      </div>
    </article>
  `).join("");
}

function unlockCourse(nextState) {
  state.mode = "student";
  state.backend = nextState;
  state.selectedAnswers = [];
  state.waitingForInstructorCode = Boolean(nextState.needsNextCode);
  setStudent(nextState.student);
  window.scrollTo(0, 0);
  elements.gateView.hidden = true;
  elements.libraryView.hidden = false;
  elements.adminView.hidden = true;
  elements.lockButton.hidden = false;
  elements.lockButton.textContent = "Course gate";
  elements.adminLogoutButton.hidden = true;
  elements.accessStatus.textContent = `Unlocked: ${nextState.student.displayName}`;
  elements.accessName.textContent = nextState.student.displayName;
  renderActiveLesson();
}

function renderActiveLesson() {
  const lesson = state.backend.currentLesson;
  if (lesson.hasVideo) {
    elements.playerShell.hidden = false;
    elements.videoPlayer.src = `/api/lesson-media?lessonId=${encodeURIComponent(lesson.id)}&sessionId=${encodeURIComponent(state.sessionId)}`;
  } else {
    elements.playerShell.hidden = true;
    clearVideoPlayer();
  }
  renderMaterial(lesson);
  elements.currentTopic.textContent = lesson.topic;
  elements.currentTitle.textContent = lesson.title;
  elements.currentDescription.textContent = lesson.description;
  elements.progressText.textContent = `Video ${state.backend.activeIndex + 1} of ${state.backend.totalLessons}`;
  elements.progressFill.style.width = `${state.backend.progressPercent}%`;
  renderLessonList();
  renderQuiz();
}

function renderMaterial(lesson) {
  const blocks = lesson.contentBlocks || [];
  elements.materialPanel.hidden = !blocks.length;
  elements.materialPanel.innerHTML = blocks.map((block) => `
    <article class="material-card">
      <h2>${block.title}</h2>
      <ul>
        ${block.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderLessonList() {
  elements.lessonList.innerHTML = state.backend.lessons.map((lesson) => `
    <button class="lesson-card${lesson.current ? " active" : ""}${lesson.completed ? " completed" : ""}" type="button" data-lesson-id="${lesson.id}" ${lesson.locked ? "disabled" : ""}>
      ${getPreviewMedia(lesson)}
      <span><h2>${lesson.title}</h2><p>${lesson.status} - ${lesson.duration}</p></span>
    </button>
  `).join("");
}

function renderQuiz() {
  const lesson = state.backend.currentLesson;
  const isCompleted = lesson.completed;
  const needsNextCode = state.waitingForInstructorCode || Boolean(state.backend.needsNextCode);
  const questions = lesson.quiz.questions || [];
  elements.quizQuestions.innerHTML = questions.map((question, questionIndex) => `
    <fieldset class="quiz-question-card">
      <legend>${questionIndex + 1}. ${question.question}</legend>
      <div class="quiz-options">
        ${question.options.map((option, optionIndex) => `
          <label class="quiz-option">
            <input type="radio" name="quizAnswer-${questionIndex}" value="${optionIndex}" ${state.selectedAnswers[questionIndex] === optionIndex ? "checked" : ""} ${isCompleted ? "disabled" : ""} />
            <span>${option}</span>
          </label>
        `).join("")}
      </div>
    </fieldset>
  `).join("");
  elements.submitAnswerButton.disabled = isCompleted;
  elements.submitAnswerButton.textContent = isCompleted ? "Checkpoint passed" : "Submit answer";
  elements.checkpointState.textContent = isCompleted ? "Passed" : "Question";

  if (needsNextCode) {
    state.waitingForInstructorCode = true;
    elements.quizHeading.textContent = "Enter the instructor's next code";
    elements.nextCodeForm.hidden = false;
    elements.nextCodeHint.textContent = `Checkpoint passed. Ask your instructor for the next code for ${state.student.username}.`;
    return;
  }

  if (state.backend.courseComplete) {
    elements.quizHeading.textContent = "Course complete";
    elements.nextCodeForm.hidden = true;
    setMessage(elements.quizMessage, "You answered the final checkpoint. The course is complete.", "success");
    return;
  }

  elements.nextCodeForm.hidden = true;
  elements.nextCodeInput.value = "";
  if (isCompleted) setMessage(elements.quizMessage, "This checkpoint is complete.", "success");
  else setMessage(elements.quizMessage, "");
}

function showAdminDashboard() {
  state.mode = "admin";
  window.scrollTo(0, 0);
  elements.gateView.hidden = true;
  elements.libraryView.hidden = true;
  elements.adminView.hidden = false;
  elements.lockButton.hidden = false;
  elements.lockButton.textContent = "Portal";
  elements.adminLogoutButton.hidden = false;
  clearVideoPlayer();
  elements.accessStatus.textContent = "Admin";
}

function renderAdminStatus() {
  const status = state.adminStatus;
  elements.entryCodeDisplay.textContent = status.entryCode;
  elements.participantCount.textContent = `${status.sessions.length} active`;
  elements.courseCount.textContent = `${status.course.length} videos`;

  elements.participantList.innerHTML =
    status.sessions
      .map((session) => {
        const nextCode = session.pendingNextCode
          ? `<code class="inline-code">${session.pendingNextCode}</code>`
          : `<span class="muted-text">No next code waiting</span>`;

        return `
          <article class="participant-card">
            <div>
              <span class="badge">${session.username}</span>
              <h2>${session.displayName}</h2>
              <p>${session.status} - ${session.progressLabel} - ${session.currentLessonTitle}</p>
            </div>
            <div>
              <small>Next code</small>
              ${nextCode}
            </div>
          </article>
        `;
      })
      .join("") || `<p class="empty-state">No student sessions yet.</p>`;

  elements.courseList.innerHTML = status.course
    .map(
      (lesson, index) => `
        <article class="lesson-card admin-lesson-card">
          ${getPreviewMedia(lesson)}
          <span>
            <h2>${index + 1}. ${lesson.title}</h2>
            <p>${lesson.topic} - ${lesson.duration}</p>
          </span>
        </article>
      `,
    )
    .join("");
}

async function loadAdminStatus() {
  try {
    state.adminStatus = await adminApi("/api/admin/status");
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, state.adminPassword);
    showAdminDashboard();
    renderAdminStatus();
    setMessage(elements.adminLoginMessage, "");
  } catch (error) {
    state.adminPassword = "";
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    showGate();
    setMode("admin");
    setMessage(elements.adminLoginMessage, error.message);
  }
}

function logoutAdmin() {
  state.adminPassword = "";
  state.adminStatus = null;
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  showGate();
  setMode("admin");
  elements.adminPassword.value = "";
}

async function authenticate(action) {
  try {
    const data = await requestApi(`/api/${action}`, {
      method: "POST",
      body: JSON.stringify({
        username: elements.usernameInput.value,
        password: elements.passwordInput.value,
        displayName: elements.displayNameInput.value,
      }),
    });
    rememberSession(data.sessionId);
    state.backend = data.state;
    setStudent(data.student);
    setMessage(elements.authMessage, action === "register" ? "Account created." : "Logged in.", "success");
    if (data.state.started) unlockCourse(data.state);
    else showGate();
  } catch (error) {
    setMessage(elements.authMessage, error.message);
  }
}

async function submitQuizAnswer() {
  const lesson = state.backend.currentLesson;
  const questions = lesson.quiz.questions || [];
  const missingIndex = questions.findIndex((_, index) => !Number.isInteger(state.selectedAnswers[index]));
  if (missingIndex !== -1) {
    setMessage(elements.quizMessage, `Answer question ${missingIndex + 1} before submitting.`);
    return;
  }
  try {
    const data = await requestApi("/api/quiz", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.sessionId, lessonId: lesson.id, answerIndexes: state.selectedAnswers }),
    });
    state.backend = data.state;
    if (!data.correct) {
      state.waitingForInstructorCode = false;
      renderActiveLesson();
      setMessage(elements.quizMessage, data.error || "Not quite. Review the lesson and try again.");
      return;
    }
    state.waitingForInstructorCode = Boolean(data.needsNextCode);
    renderActiveLesson();
    setMessage(elements.quizMessage, data.message, "success");
  } catch (error) {
    setMessage(elements.quizMessage, error.message);
  }
}

async function submitNextCode() {
  try {
    const data = await requestApi("/api/next", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.sessionId, code: normalizeCode(elements.nextCodeInput.value) }),
    });
    state.backend = data.state;
    state.selectedAnswers = [];
    state.waitingForInstructorCode = false;
    elements.nextCodeInput.value = "";
    window.scrollTo(0, 0);
    renderActiveLesson();
  } catch (error) {
    setMessage(elements.quizMessage, error.message);
  }
}

async function selectLesson(lessonId) {
  try {
    const data = await requestApi("/api/select", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.sessionId, lessonId }),
    });
    state.backend = data.state;
    state.selectedAnswers = [];
    state.waitingForInstructorCode = Boolean(data.needsNextCode);
    window.scrollTo(0, 0);
    renderActiveLesson();
  } catch (error) {
    setMessage(elements.quizMessage, error.message);
  }
}

elements.authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  authenticate(event.submitter?.dataset.authAction || "login");
});

elements.studentModeButton.addEventListener("click", () => {
  showGate();
  setMode("student");
});

elements.adminModeButton.addEventListener("click", () => {
  showGate();
  setMode("admin");
});

elements.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.adminPassword = elements.adminPassword.value;
  await loadAdminStatus();
});

elements.adminLogoutButton.addEventListener("click", logoutAdmin);

elements.logoutStudentButton.addEventListener("click", async () => {
  if (state.sessionId) {
    await requestApi("/api/logout", { method: "POST", body: JSON.stringify({ sessionId: state.sessionId }) }).catch(() => {});
  }
  rememberSession(null);
  state.student = null;
  state.selectedAnswers = [];
  state.waitingForInstructorCode = false;
  setStudent(null);
  await loadPreview();
  showGate();
  setMode("student");
});

elements.entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const data = await requestApi("/api/entry", {
      method: "POST",
      body: JSON.stringify({ sessionId: state.sessionId, code: normalizeCode(elements.entryCodeInput.value) }),
    });
    setMessage(elements.entryMessage, "Access granted.", "success");
    unlockCourse(data.state);
  } catch (error) {
    setMessage(elements.entryMessage, error.message);
  }
});

elements.lockButton.addEventListener("click", () => {
  const mode = state.mode;
  showGate();
  setMode(mode);
});

elements.refreshButton.addEventListener("click", loadAdminStatus);

elements.regenerateEntryButton.addEventListener("click", async () => {
  try {
    state.adminStatus = await adminApi("/api/admin/entry-code", {
      method: "POST",
      body: JSON.stringify({}),
    });
    renderAdminStatus();
  } catch (error) {
    setMessage(elements.adminLoginMessage, error.message);
  }
});

elements.quizQuestions.addEventListener("change", (event) => {
  const match = event.target.name?.match(/^quizAnswer-(\d+)$/);
  if (!match) return;
  state.selectedAnswers[Number(match[1])] = Number(event.target.value);
});

elements.quizForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitQuizAnswer();
});

elements.nextCodeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitNextCode();
});

elements.lessonList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-lesson-id]");
  if (card && !card.disabled) selectLesson(card.dataset.lessonId);
});

const initialMode = getInitialMode();
setStudent(null);
setMode(initialMode);
loadPreview().then(async () => {
  if (initialMode === "admin" && state.adminPassword) {
    await loadAdminStatus();
  } else {
    await restoreSession();
  }
});
