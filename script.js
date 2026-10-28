
/* ==========================================
   STUDYFLOW PRO — APPLICATION LOGIC
========================================== */

"use strict";

/* ------------------------------------------
   CONFIGURATION
------------------------------------------ */

const GOALS = {
    daily: 3 * 60 * 60,
    weekly: 18 * 60 * 60,
    monthly: 70 * 60 * 60
};

const SUBJECTS = [
    "Statistics",
    "Computer Science",
    "Mathematics",
    "Physics",
    "Other"
];

const SUBJECT_COLORS = {
    "Statistics": "#8876f4",
    "Computer Science": "#5c9df5",
    "Mathematics": "#42c5a1",
    "Physics": "#f3a65b",
    "Other": "#e87da8"
};

const QUOTES = [
    {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain"
    },
    {
        text: "It always seems impossible until it's done.",
        author: "Nelson Mandela"
    },
    {
        text: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh"
    },
    {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi"
    },
    {
        text: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    },
    {
        text: "Success is the sum of small efforts, repeated day in and day out.",
        author: "Robert Collier"
    },
    {
        text: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        text: "You don't have to be extreme, just consistent.",
        author: "Unknown"
    },
    {
        text: "Focus on being productive instead of busy.",
        author: "Tim Ferriss"
    }
];

/* ------------------------------------------
   STORAGE
------------------------------------------ */

const STORAGE_KEY = "studyflow_pro_data_v1";
const THEME_KEY = "studyflow_pro_theme_v1";

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            return {
                sessions: Array.isArray(parsed.sessions)
                    ? parsed.sessions
                    : [],

                tasks: Array.isArray(parsed.tasks)
                    ? parsed.tasks
                    : []
            };
        }
    } catch (error) {
        console.warn("Could not load saved study data.", error);
    }

    return {
        sessions: [],
        tasks: []
    };
}

let appData = loadData();

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.warn("Could not save study data.", error);
        showToast("Unable to save data in this browser.");
    }
}

/* ------------------------------------------
   DATE HELPERS
------------------------------------------ */

function dateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getStartOfWeek(date = new Date()) {
    const start = new Date(date);

    const day = start.getDay();
    const difference = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - difference);
    start.setHours(0, 0, 0, 0);

    return start;
}

function getStartOfMonth(date = new Date()) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        1,
        0,
        0,
        0,
        0
    );
}

function getLastSevenDays() {
    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date = new Date();

        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        days.push(date);
    }

    return days;
}

function isSameDate(first, second) {
    return dateKey(first) === dateKey(second);
}

/* ------------------------------------------
   STUDY DATA CALCULATIONS
------------------------------------------ */

function getSessionsForDate(date) {
    const key = dateKey(date);

    return appData.sessions.filter(session => session.date === key);
}

function getSecondsForDate(date) {
    return getSessionsForDate(date).reduce(
        (total, session) => total + session.seconds,
        0
    );
}

function getSecondsSince(startDate) {
    const startKey = dateKey(startDate);

    return appData.sessions.reduce((total, session) => {
        if (session.date >= startKey) {
            return total + session.seconds;
        }

        return total;
    }, 0);
}

function getTodaySeconds() {
    return getSecondsForDate(new Date());
}

function getWeekSeconds() {
    const start = getStartOfWeek();

    return getSecondsSince(start);
}

function getMonthSeconds() {
    const start = getStartOfMonth();

    return getSecondsSince(start);
}

function getSubjectSeconds(subject, startDate) {
    const startKey = dateKey(startDate);

    return appData.sessions.reduce((total, session) => {
        if (
            session.subject === subject &&
            session.date >= startKey
        ) {
            return total + session.seconds;
        }

        return total;
    }, 0);
}

/* ------------------------------------------
   FORMATTING
------------------------------------------ */

function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function formatClock(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds));

    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainder).padStart(2, "0")
    );
}

function formatShortHours(seconds) {
    const hours = seconds / 3600;

    if (hours === 0) {
        return "0h";
    }

    if (hours < 1) {
        return `${Math.round(seconds / 60)}m`;
    }

    return `${hours.toFixed(1).replace(".0", "")}h`;
}

/* ------------------------------------------
   DATE AND GREETING
------------------------------------------ */

function updateDateDisplay() {
    const now = new Date();
    const hour = now.getHours();

    let greeting = "Good evening";

    if (hour < 12) {
        greeting = "Good morning";
    } else if (hour < 17) {
        greeting = "Good afternoon";
    }

    document.getElementById("greeting").innerHTML =
        `${greeting}, scholar<span class="greeting-star">✦</span>`;

    document.getElementById("dayName").textContent =
        now.toLocaleDateString("en-US", {
            weekday: "long"
        });

    document.getElementById("currentDate").textContent =
        now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
}

/* ------------------------------------------
   PROGRESS RINGS
------------------------------------------ */

function setRing(selector, percentage) {
    const ring = document.querySelector(selector);

    if (!ring) {
        return;
    }

    const radius = 57;
    const circumference = 2 * Math.PI * radius;

    const boundedPercentage = Math.min(
        Math.max(percentage, 0),
        100
    );

    const offset =
        circumference -
        (boundedPercentage / 100) * circumference;

    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = offset;
}

function updateProgress() {
    const daily = getTodaySeconds();
    const weekly = getWeekSeconds();
    const monthly = getMonthSeconds();

    const dailyPercentage = (daily / GOALS.daily) * 100;
    const weeklyPercentage = (weekly / GOALS.weekly) * 100;
    const monthlyPercentage = (monthly / GOALS.monthly) * 100;

    document.getElementById("dailyTime").textContent =
        formatDuration(daily);

    document.getElementById("weeklyTime").textContent =
        formatDuration(weekly);

    document.getElementById("monthlyTime").textContent =
        formatDuration(monthly);

    document.getElementById("dailyPercent").textContent =
        `${Math.round(dailyPercentage)}%`;

    document.getElementById("weeklyPercent").textContent =
        `${Math.round(weeklyPercentage)}%`;

    document.getElementById("monthlyPercent").textContent =
        `${Math.round(monthlyPercentage)}%`;

    document.getElementById("dailyRemaining").textContent =
        formatDuration(Math.max(GOALS.daily - daily, 0));

    document.getElementById("weeklyRemaining").textContent =
        formatDuration(Math.max(GOALS.weekly - weekly, 0));

    document.getElementById("monthlyRemaining").textContent =
        formatDuration(Math.max(GOALS.monthly - monthly, 0));

    setRing(".daily-ring", dailyPercentage);
    setRing(".weekly-ring", weeklyPercentage);
    setRing(".monthly-ring", monthlyPercentage);
}

/* ------------------------------------------
   SUBJECT BREAKDOWN
------------------------------------------ */

function updateSubjectBreakdown() {
    const subjectList = document.getElementById("subjectList");

    subjectList.innerHTML = "";

    const weekStart = getStartOfWeek();

    const subjectData = SUBJECTS.map(subject => ({
        subject,
        seconds: getSubjectSeconds(subject, weekStart)
    }));

    const totalSeconds = subjectData.reduce(
        (total, item) => total + item.seconds,
        0
    );

    subjectData.forEach(item => {
        const percentage =
            totalSeconds > 0
                ? (item.seconds / totalSeconds) * 100
                : 0;

        const row = document.createElement("div");

        row.className = "subject-row";

        row.innerHTML = `
            <div
                class="subject-dot"
                style="background:${SUBJECT_COLORS[item.subject]}"
            ></div>

            <div class="subject-info">
                <div class="subject-name-row">
                    <span class="subject-name">
                        ${item.subject}
                    </span>

                    <span class="subject-time">
                        ${formatDuration(item.seconds)}
                    </span>
                </div>

                <div class="subject-bar">
                    <div
                        class="subject-bar-fill"
                        style="
                            width:${percentage}%;
                            background:${SUBJECT_COLORS[item.subject]};
                        "
                    ></div>
                </div>
            </div>
        `;

        subjectList.appendChild(row);
    });

    document.getElementById("subjectTotal").textContent =
        formatDuration(totalSeconds);
}

/* ------------------------------------------
   WEEKLY ACTIVITY CHART
------------------------------------------ */

function updateWeeklyChart() {
    const chart = document.getElementById("weeklyChart");

    chart.innerHTML = "";

    const dates = getLastSevenDays();

    const values = dates.map(date => getSecondsForDate(date));

    const maxValue = Math.max(...values, 3600);

    const todayKey = dateKey();

    dates.forEach((date, index) => {
        const seconds = values[index];

        const percentage = (seconds / maxValue) * 100;

        const isToday = dateKey(date) === todayKey;

        const dayName = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const dayElement = document.createElement("div");

        dayElement.className =
            `chart-day${isToday ? " today" : ""}`;

        dayElement.innerHTML = `
            <div class="chart-bar-area">
                <div
                    class="chart-bar"
                    style="height:${percentage}%"
                    title="${formatDuration(seconds)}"
                ></div>
            </div>

            <span>${dayName}</span>
        `;

        chart.appendChild(dayElement);
    });

    document.getElementById("activityTotal").textContent =
        formatDuration(getWeekSeconds());
}

/* ------------------------------------------
   TASK MANAGEMENT
------------------------------------------ */

function getTodayTasks() {
    const today = dateKey();

    return appData.tasks.filter(task => task.date === today);
}

function renderTasks() {
    const taskList = document.getElementById("taskList");

    taskList.innerHTML = "";

    const tasks = getTodayTasks();

    const completed = tasks.filter(task => task.completed).length;

    document.getElementById("taskCounter").textContent =
        `${completed} / ${tasks.length} completed`;

    if (tasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-tasks">
                No tasks yet. Add your first task to get started ✦
            </div>
        `;

        return;
    }

    tasks.forEach(task => {
        const item = document.createElement("div");

        item.className =
            `task-item${task.completed ? " completed" : ""}`;

        item.innerHTML = `
            <input
                type="checkbox"
                class="task-check"
                aria-label="Complete task"
                ${task.completed ? "checked" : ""}
            >

            <div class="task-content">
                <div class="task-title"></div>
                <span class="task-subject"></span>
            </div>

            <button
                class="task-delete"
                aria-label="Delete task"
                title="Delete task"
            >×</button>
        `;

        item.querySelector(".task-title").textContent = task.title;
        item.querySelector(".task-subject").textContent = task.subject;

        const checkbox = item.querySelector(".task-check");

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;

            saveData();
            renderTasks();

            if (task.completed) {
                showToast("Task completed. Great work! ✦");
            }
        });

        item.querySelector(".task-delete").addEventListener("click", () => {
            appData.tasks = appData.tasks.filter(
                existingTask => existingTask.id !== task.id
            );

            saveData();
            renderTasks();

            showToast("Task removed.");
        });

        taskList.appendChild(item);
    });
}

function addTask(event) {
    event.preventDefault();

    const input = document.getElementById("taskInput");
    const subjectSelect = document.getElementById("taskSubject");

    const title = input.value.trim();

    if (!title) {
        return;
    }

    const task = {
        id: Date.now().toString(),
        title,
        subject: subjectSelect.value,
        completed: false,
        date: dateKey()
    };

    appData.tasks.push(task);

    saveData();
    renderTasks();

    input.value = "";

    showToast("Task added to your day.");
}

document.getElementById("taskForm").addEventListener(
    "submit",
    addTask
);

/* ------------------------------------------
   FOCUS TIMER
------------------------------------------ */

let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;

let timerInterval = null;
let isRunning = false;
let sessionStartedAt = null;
let sessionElapsedBeforePause = 0;

function updateTimerDisplay() {
    document.getElementById("timerText").textContent =
        formatClock(remainingSeconds);

    const radius = 108;
    const circumference = 2 * Math.PI * radius;

    const percentage =
        remainingSeconds / (selectedMinutes * 60);

    const offset =
        circumference * (1 - percentage);

    const progressCircle =
        document.getElementById("timerProgress");

    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = offset;
}

function setTimerStatus(status) {
    const statusElement = document.getElementById("timerStatus");

    statusElement.innerHTML = `
        <span></span>
        ${status}
    `;
}

function startTimer() {
    if (isRunning) {
        pauseTimer();
        return;
    }

    isRunning = true;

    sessionStartedAt = Date.now();

    document.getElementById("startTimer").innerHTML =
        "<span>Ⅱ</span> Pause";

    document.getElementById("timerMode").textContent =
        "Stay focused";

    setTimerStatus("FOCUSING");

    timerInterval = setInterval(() => {
        remainingSeconds--;

        updateTimerDisplay();

        if (remainingSeconds <= 0) {
            completeSession();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);

    isRunning = false;

    document.getElementById("startTimer").innerHTML =
        "<span>▶</span> Resume";

    document.getElementById("timerMode").textContent =
        "Paused — take a breath";

    setTimerStatus("PAUSED");
}

function resetTimer() {
    clearInterval(timerInterval);

    isRunning = false;

    remainingSeconds = selectedMinutes * 60;

    sessionStartedAt = null;
    sessionElapsedBeforePause = 0;

    document.getElementById("startTimer").innerHTML =
        "<span>▶</span> Start focus";

    document.getElementById("timerMode").textContent =
        "Pomodoro session";

    setTimerStatus("READY");

    updateTimerDisplay();
}

function completeSession() {
    clearInterval(timerInterval);

    isRunning = false;

    const subject =
        document.getElementById("subjectSelect").value;

    const studiedSeconds = selectedMinutes * 60;

    const session = {
        id: Date.now().toString(),
        date: dateKey(),
        subject,
        seconds: studiedSeconds,
        completedAt: new Date().toISOString()
    };

    appData.sessions.push(session);

    saveData();

    updateProgress();
    updateSubjectBreakdown();
    updateWeeklyChart();

    remainingSeconds = selectedMinutes * 60;

    document.getElementById("startTimer").innerHTML =
        "<span>▶</span> Start focus";

    document.getElementById("timerMode").textContent =
        "Session completed!";

    setTimerStatus("COMPLETED");

    updateTimerDisplay();

    showToast("Focus session completed. Amazing work! ✦");

    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("StudyFlow Pro", {
            body: "Your focus session is complete. Great work!"
        });
    }
}

document.getElementById("startTimer").addEventListener(
    "click",
    startTimer
);

document.getElementById("resetTimer").addEventListener(
    "click",
    resetTimer
);

document.querySelectorAll(".preset").forEach(button => {
    button.addEventListener("click", () => {
        selectedMinutes = Number(button.dataset.minutes);

        document.querySelectorAll(".preset").forEach(preset => {
            preset.classList.remove("active");
        });

        button.classList.add("active");

        resetTimer();
    });
});

/* ------------------------------------------
   DARK MODE
------------------------------------------ */

function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle("dark", isDark);

    document.getElementById("themeIcon").textContent =
        isDark ? "☀" : "☾";

    document.getElementById("themeText").textContent =
        isDark ? "Light appearance" : "Dark appearance";

    document.querySelector('meta[name="theme-color"]').content =
        isDark ? "#10111a" : "#f5f6fb";

    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("Could not save theme preference.", error);
    }
}

function loadTheme() {
    let savedTheme = "light";

    try {
        savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (error) {
        console.warn("Could not load theme preference.", error);
    }

    applyTheme(savedTheme);
}

document.getElementById("themeToggle").addEventListener("click", () => {
    const isDark = document.body.classList.contains("dark");

    applyTheme(isDark ? "light" : "dark");
});

/* ------------------------------------------
   MOTIVATIONAL QUOTES
------------------------------------------ */

function newQuote() {
    const currentText =
        document.getElementById("quoteText").textContent;

    let quote;

    do {
        quote = QUOTES[
            Math.floor(Math.random() * QUOTES.length)
        ];
    } while (
        QUOTES.length > 1 &&
        quote.text === currentText
    );

    document.getElementById("quoteText").textContent =
        quote.text;

    document.getElementById("quoteAuthor").textContent =
        `— ${quote.author}`;
}

document.getElementById("newQuote").addEventListener(
    "click",
    newQuote
);

/* ------------------------------------------
   MOBILE SIDEBAR
------------------------------------------ */

const sidebar = document.getElementById("sidebar");

document.getElementById("mobileMenu").addEventListener("click", () => {
    sidebar.classList.toggle("open");
});

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        document.querySelectorAll(".nav-link").forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

        sidebar.classList.remove("open");
    });
});

document.addEventListener("click", event => {
    const menuButton = document.getElementById("mobileMenu");

    if (
        window.innerWidth <= 760 &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
    ) {
        sidebar.classList.remove("open");
    }
});

/* ------------------------------------------
   TOAST NOTIFICATIONS
------------------------------------------ */

let toastTimeout;

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2800);
}

/* ------------------------------------------
   INITIALIZE APPLICATION
------------------------------------------ */

function initializeApp() {
    loadTheme();

    updateDateDisplay();
    updateProgress();
    updateSubjectBreakdown();
    updateWeeklyChart();
    renderTasks();
    updateTimerDisplay();

    setInterval(updateDateDisplay, 60000);
}

initializeApp();
