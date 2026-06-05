const ADMIN_PASSWORD_KEY = "learngate_admin_password";

const adminState = {
  password: sessionStorage.getItem(ADMIN_PASSWORD_KEY) || "",
  status: null,
};

const adminElements = {
  login: document.querySelector("#adminLogin"),
  dashboard: document.querySelector("#adminDashboard"),
  loginForm: document.querySelector("#adminLoginForm"),
  passwordInput: document.querySelector("#adminPassword"),
  loginMessage: document.querySelector("#loginMessage"),
  logoutButton: document.querySelector("#logoutButton"),
  entryCodeDisplay: document.querySelector("#entryCodeDisplay"),
  regenerateEntryButton: document.querySelector("#regenerateEntryButton"),
  refreshButton: document.querySelector("#refreshButton"),
  participantCount: document.querySelector("#participantCount"),
  participantList: document.querySelector("#participantList"),
  courseCount: document.querySelector("#courseCount"),
  courseList: document.querySelector("#courseList"),
};

function setLoginMessage(message, type = "error") {
  adminElements.loginMessage.textContent = message;
  adminElements.loginMessage.classList.toggle("success", type === "success");
}

async function adminApi(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminState.password,
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The admin request failed.");
  }

  return data;
}

function showDashboard() {
  adminElements.login.hidden = true;
  adminElements.dashboard.hidden = false;
  adminElements.logoutButton.hidden = false;
}

function showLogin() {
  adminElements.login.hidden = false;
  adminElements.dashboard.hidden = true;
  adminElements.logoutButton.hidden = true;
  adminElements.passwordInput.value = "";
  adminElements.passwordInput.focus();
}

function renderStatus() {
  const status = adminState.status;

  adminElements.entryCodeDisplay.textContent = status.entryCode;
  adminElements.participantCount.textContent = `${status.sessions.length} active`;
  adminElements.courseCount.textContent = `${status.course.length} videos`;

  adminElements.participantList.innerHTML =
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

  adminElements.courseList.innerHTML = status.course
    .map(
      (lesson, index) => `
        <article class="lesson-card admin-lesson-card">
          <img src="https://img.youtube.com/vi/${lesson.youtubeId}/hqdefault.jpg" alt="${lesson.title} thumbnail" loading="lazy" />
          <span>
            <h2>${index + 1}. ${lesson.title}</h2>
            <p>${lesson.topic} - ${lesson.duration}</p>
          </span>
        </article>
      `,
    )
    .join("");
}

async function loadStatus() {
  try {
    adminState.status = await adminApi("/api/admin/status");
    sessionStorage.setItem(ADMIN_PASSWORD_KEY, adminState.password);
    showDashboard();
    renderStatus();
    setLoginMessage("");
  } catch (error) {
    sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    showLogin();
    setLoginMessage(error.message);
  }
}

adminElements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminState.password = adminElements.passwordInput.value;
  await loadStatus();
});

adminElements.logoutButton.addEventListener("click", () => {
  adminState.password = "";
  sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
  showLogin();
});

adminElements.refreshButton.addEventListener("click", loadStatus);

adminElements.regenerateEntryButton.addEventListener("click", async () => {
  try {
    adminState.status = await adminApi("/api/admin/entry-code", {
      method: "POST",
      body: JSON.stringify({}),
    });
    renderStatus();
  } catch (error) {
    setLoginMessage(error.message);
  }
});

if (adminState.password) {
  loadStatus();
} else {
  showLogin();
}


