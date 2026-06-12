let pipelineSteps = [];
let variableColorMap = {};
let isTimelineActive = false;
let currentFrameIndex = 0;
let predictionTarget = null;
let activeLessonId = "accumulator";
let activeTaskId = "sum-three";
let activeContentMode = "practice-task";
let lastLessonResult = null;
let predictionAttempts = [];
let predictionAttemptCounts = {};
let revealedPredictionKeys = new Set();
let studentActionLog = [];
let exerciseTrainingRecords = [];
let presentationMode = false;

const GUIDE_KEY = "ssp_first_run_guide_completed";
const BRIGHT_PALETTE = ["#ff7b72", "#3fb950", "#d29922", "#a5d6ff", "#f274c5", "#58a6ff", "#ffc600", "#e2a6ff"];

const LESSONS = {
    assignment: {
        title: "Variable Assignment",
        concept: "Variable assignment",
        objective: "Set the final value of student_name to Ada.",
        starterCode: `student_name = ""`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "student_name", expected: "Ada" },
            { type: "conceptSeen", concept: "Variable assignment" }
        ]
    },
    ifElse: {
        title: "If / Else",
        concept: "Condition",
        objective: "Modify the code so result finishes as pass.",
        starterCode: `score = 55

if score >= 60:
    result = "pass"
else:
    result = "retry"`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "result", expected: "pass" },
            { type: "conceptSeen", concept: "Condition" }
        ]
    },
    forLoop: {
        title: "For Loop",
        concept: "Loop",
        objective: "Use the for loop so last_number finishes as 3.",
        starterCode: `last_number = 0

for number in range(1, 4):
    last_number = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "last_number", expected: "3" },
            { type: "conceptSeen", concept: "Loop" }
        ]
    },
    whileLoop: {
        title: "While Loop",
        concept: "Loop",
        objective: "Modify the while loop so count finishes as 5.",
        starterCode: `count = 0

while count < 3:
    count += 1`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "count", expected: "5" },
            { type: "conceptSeen", concept: "Loop" }
        ]
    },
    listTraversal: {
        title: "List Traversal",
        concept: "List traversal",
        objective: "Traverse the list so largest finishes as 6.",
        starterCode: `numbers = [2, 4, 6]
largest = 0

for number in numbers:
    largest = number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "largest", expected: "6" },
            { type: "conceptSeen", concept: "List traversal" }
        ]
    },
    accumulator: {
        title: "Accumulator Pattern",
        concept: "Accumulator",
        objective: "Make the final total_sum equal 60.",
        starterCode: `total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "total_sum", expected: "60" },
            { type: "conceptSeen", concept: "Accumulator" }
        ]
    },
    nestedLoop: {
        title: "Nested Loop",
        concept: "Nested loop",
        objective: "Count every row/column pair so pair_count finishes as 6.",
        starterCode: `pair_count = 0
rows = ["A", "B"]
cols = [1, 2, 3]

for row in rows:
    for col in cols:
        pair_count += 1`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "pair_count", expected: "6" },
            { type: "conceptSeen", concept: "Nested loop" }
        ]
    },
    functionCall: {
        title: "Function Call",
        concept: "Function call",
        objective: "Call square so answer finishes as 16.",
        starterCode: `def square(number):
    result = number * number
    return result

answer = square(4)`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "answer", expected: "16" },
            { type: "conceptSeen", concept: "Function call" }
        ]
    },
    recursion: {
        title: "Recursion Intro",
        concept: "Recursion",
        objective: "Use recursion so answer finishes as 120.",
        starterCode: `def factorial(n):
    if n == 1:
        return 1
    return n * factorial(n - 1)

answer = factorial(5)`,
        checks: [
            { type: "noErrors" },
            { type: "variableEquals", variable: "answer", expected: "120" },
            { type: "conceptSeen", concept: "Recursion" }
        ]
    }
};

const PRACTICE_TASKS = {
    assignment: [
        {
            id: "set-ada",
            title: "Set a student name",
            objective: LESSONS.assignment.objective,
            starterCode: LESSONS.assignment.starterCode,
            checks: LESSONS.assignment.checks
        },
        {
            id: "undefined-variable",
            title: "Find an undefined variable",
            objective: "Run the code and identify the undefined variable error.",
            starterCode: `price = 20
total = price + tax
print(total)`,
            checks: [{ type: "errorCategory", expected: "undefined-variable" }]
        }
    ],
    ifElse: [
        {
            id: "pass-or-retry",
            title: "Choose pass or retry",
            objective: LESSONS.ifElse.objective,
            starterCode: LESSONS.ifElse.starterCode,
            checks: LESSONS.ifElse.checks
        },
        {
            id: "print-result",
            title: "Trace a printed decision",
            objective: "Run the condition so stdout finishes with pass.",
            starterCode: `score = 72

if score >= 60:
    result = "pass"
else:
    result = "try again"

print(result)`,
            checks: [
                { type: "noErrors" },
                { type: "stdoutContains", text: "pass" },
                { type: "conceptSeen", concept: "Condition" }
            ]
        }
    ],
    forLoop: [
        {
            id: "last-number",
            title: "Track the last number",
            objective: LESSONS.forLoop.objective,
            starterCode: LESSONS.forLoop.starterCode,
            checks: LESSONS.forLoop.checks
        },
        {
            id: "not-iterable",
            title: "Loop over the wrong object",
            objective: "Run the code and identify why a single number cannot be looped over.",
            starterCode: `for item in 5:
    print(item)`,
            checks: [{ type: "errorCategory", expected: "not-iterable" }]
        }
    ],
    whileLoop: [
        {
            id: "count-to-five",
            title: "Count to five",
            objective: LESSONS.whileLoop.objective,
            starterCode: LESSONS.whileLoop.starterCode,
            checks: LESSONS.whileLoop.checks
        },
        {
            id: "infinite-risk",
            title: "Spot an infinite-loop risk",
            objective: "Run the code and identify why the while loop does not finish.",
            starterCode: `count = 0

while count < 3:
    print(count)`,
            checks: [{ type: "errorCategory", expected: "infinite-loop-risk" }]
        }
    ],
    listTraversal: [
        {
            id: "largest-value",
            title: "Trace the largest value",
            objective: LESSONS.listTraversal.objective,
            starterCode: LESSONS.listTraversal.starterCode,
            checks: LESSONS.listTraversal.checks
        }
    ],
    accumulator: [
        {
            id: "sum-three",
            title: "Build the sum",
            objective: LESSONS.accumulator.objective,
            starterCode: LESSONS.accumulator.starterCode,
            checks: LESSONS.accumulator.checks
        },
        {
            id: "sum-four",
            title: "Add four prices",
            objective: "Make the final total_sum equal 100.",
            starterCode: `total_sum = 0
prices = [10, 20, 30, 40]

for price in prices:
    total_sum += price`,
            checks: [
                { type: "noErrors" },
                { type: "variableEquals", variable: "total_sum", expected: "100" },
                { type: "conceptSeen", concept: "Accumulator" }
            ]
        }
    ],
    nestedLoop: [
        {
            id: "count-pairs",
            title: "Count row and column pairs",
            objective: LESSONS.nestedLoop.objective,
            starterCode: LESSONS.nestedLoop.starterCode,
            checks: LESSONS.nestedLoop.checks
        }
    ],
    functionCall: [
        {
            id: "square-call",
            title: "Call a square function",
            objective: LESSONS.functionCall.objective,
            starterCode: LESSONS.functionCall.starterCode,
            checks: LESSONS.functionCall.checks
        }
    ],
    recursion: [
        {
            id: "factorial-five",
            title: "Trace factorial",
            objective: LESSONS.recursion.objective,
            starterCode: LESSONS.recursion.starterCode,
            checks: LESSONS.recursion.checks
        }
    ]
};

const btnRun = document.getElementById('btn-run');
const btnOpenGuide = document.getElementById('btn-open-guide');
const slider = document.getElementById('trace-slider');
const consoleOutput = document.getElementById('console-output');
const scopeGrid = document.getElementById('scope-grid');
const stepCounter = document.getElementById('step-counter');
const conceptPanel = document.getElementById('concept-panel');
const exampleSelect = document.getElementById('example-select');
const lessonSelect = document.getElementById('lesson-select');
const btnCheckLesson = document.getElementById('btn-check-lesson');
const lessonGoal = document.getElementById('lesson-goal');
const lessonStatus = document.getElementById('lesson-status');
const teacherInsights = document.getElementById('teacher-insights');
const btnExportReport = document.getElementById('btn-export-report');
const btnPresentationMode = document.getElementById('btn-presentation-mode');
const predictionPrompt = document.getElementById('prediction-prompt');
const predictionInput = document.getElementById('prediction-input');
const predictionFeedback = document.getElementById('prediction-feedback');
const btnCheckPrediction = document.getElementById('btn-check-prediction');
const btnRevealAnswer = document.getElementById('btn-reveal-answer');
const guideOverlay = document.getElementById('guide-overlay');
const guideCard = document.getElementById('guide-card');
const guideTitle = document.getElementById('guide-title');
const guideBody = document.getElementById('guide-body');
const guideStep = document.getElementById('guide-step');
const btnGuideNext = document.getElementById('btn-guide-next');
const btnGuidePrev = document.getElementById('btn-guide-prev');
const btnGuideSkip = document.getElementById('btn-guide-skip');

const codeInput = document.getElementById('code-input');
const codeViewer = document.getElementById('code-viewer');
const gutterZone = document.getElementById('gutter-zone');

const GUIDE_STEPS = [
    {
        title: "1. Choose a topic",
        body: "Choose the programming idea you want to practise, such as accumulator, condition, loop, or function call.",
        focus: "#lesson-select",
        placement: "top"
    },
    {
        title: "2. Choose a practice task",
        body: "Pick one task inside the selected topic. The task loads into the editor and has its own trace-based goal.",
        focus: "#example-select",
        placement: "top"
    },
    {
        title: "3. Read the task goal",
        body: "This is what your code should achieve. The system checks the real trace result, not just the text you typed.",
        focus: "#lesson-goal",
        placement: "top"
    },
    {
        title: "4. Read the code before running",
        body: "Look at the editor. Notice total_sum starts at 0, numbers contains [10, 20, 30], and the loop adds each number into total_sum.",
        focus: "#code-input",
        placement: "right"
    },
    {
        title: "5. Run the trace",
        body: "Click Compile & Trace. The program will execute through Python, and the timeline will be built from real runtime data.",
        focus: "#btn-run",
        placement: "bottom"
    },
    {
        title: "6. Watch the telemetry console",
        body: "After running, this console should show Step, Line, scope, concept, and variable change. It is no longer empty when there is no print().",
        focus: "#console-output",
        placement: "left"
    },
    {
        title: "7. Move through time",
        body: "Drag the Time-Travel Debugger. As you move it, the highlighted code line, memory panel, concept tags, and telemetry console change together.",
        focus: "#trace-slider",
        placement: "top"
    },
    {
        title: "8. Read the concept tags",
        body: "These tags name what you are practicing, such as Variable assignment, Loop, Accumulator, Scope, or Function call.",
        focus: "#concept-panel",
        placement: "top"
    },
    {
        title: "9. Try a prediction",
        body: "Type your guess for the variable value, then press Check Guess. The answer stays hidden unless you reveal it or miss the same step three times.",
        focus: "#prediction-input",
        placement: "top"
    },
    {
        title: "10. Enter and check your guess",
        body: "Type the expected new value into this box, then click Check Guess. For the first assignment step, the reference input is 0.",
        focus: "#prediction-input",
        placement: "top"
    },
    {
        title: "11. Reveal if you are stuck",
        body: "Click Reveal to show the actual value. This is useful after you have made a serious attempt.",
        focus: "#btn-reveal-answer",
        placement: "top"
    },
    {
        title: "12. Check the task goal",
        body: "Click Check Task Goal. The system checks the final trace state, not whether your code text matches an answer key.",
        focus: "#btn-check-lesson",
        placement: "top"
    },
    {
        title: "13. Teacher tools",
        body: "Teachers can export student activity or switch to presentation mode for class.",
        focus: ".teacher-panel",
        placement: "top"
    }
];

let guideIndex = 0;

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderInitialConsole() {
    consoleOutput.innerHTML = `
        <div class="console-row muted">>>> Telemetry console ready.</div>
        <div class="console-row trace-output-label">example format</div>
        <div class="console-row trace-head">Step 1 / Line 1</div>
        <div class="console-row trace-line">code: total_sum = 0</div>
        <div class="console-row trace-meta">scope: global | concept: Variable assignment</div>
        <div class="console-row trace-change">change: total_sum: not allocated -> hidden until prediction is checked</div>
        <div class="console-row trace-output-label">step explanation</div>
        <div class="console-row trace-explanation">Python is about to store a value under a variable name. After you make a prediction, the value can be revealed.</div>
        <div class="console-row trace-output-label">after running</div>
        <div class="console-row muted">The highlighted code line, memory cards, prediction target, and timeline slider update together.</div>
    `;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeValue(value) {
    return String(value ?? '').trim();
}

function getTasksForTopic(topicId) {
    return PRACTICE_TASKS[topicId] || [];
}

function getActiveTask() {
    const tasks = getTasksForTopic(activeLessonId);
    return tasks.find(task => task.id === activeTaskId) || tasks[0] || null;
}

function logStudentAction(actionType, label, details = {}) {
    const task = getActiveTask();
    studentActionLog.push({
        timestamp: new Date().toISOString(),
        actionType,
        label,
        topicId: activeLessonId,
        topicTitle: LESSONS[activeLessonId]?.title || "",
        taskId: task?.id || "",
        taskTitle: task?.title || "",
        contentMode: activeContentMode,
        stepIndex: pipelineSteps.length ? currentFrameIndex + 1 : null,
        ...details
    });
}

function getPredictionTarget(frame) {
    const changes = frame?.changes || [];
    return changes.find(change => change.changeType !== "removed") || changes[0] || null;
}

function getPredictionKey(frame, target) {
    if (!frame || !target) return "";
    return [
        frame.stepNumber ?? currentFrameIndex + 1,
        frame.line ?? "",
        frame.scopeName ?? "",
        target.name ?? ""
    ].join("|");
}

function shouldShowPredictionAnswer(frame, target) {
    return revealedPredictionKeys.has(getPredictionKey(frame, target));
}

function getMaskedValue(value, hidden = false) {
    return hidden ? "hidden until checked" : value;
}

function syncEditorRendering(highlightLineNum = -1) {
    const lines = codeInput.value.split('\n');

    gutterZone.innerHTML = '';
    codeViewer.innerHTML = '';

    lines.forEach((lineText, index) => {
        const lineNum = index + 1;

        const gutterNum = document.createElement('div');
        gutterNum.className = 'gutter-num';
        gutterNum.textContent = lineNum;
        if (lineNum === highlightLineNum) {
            gutterNum.classList.add('active-num');
        }
        gutterZone.appendChild(gutterNum);

        const row = document.createElement('div');
        row.className = 'render-line-row';
        if (lineNum === highlightLineNum) {
            row.classList.add('active-row');
        }

        if (isTimelineActive && Object.keys(variableColorMap).length > 0) {
            let renderedLine = escapeHtml(lineText);
            for (const [varName, color] of Object.entries(variableColorMap)) {
                const regex = new RegExp(`\\b${escapeRegExp(varName)}\\b`, 'g');
                renderedLine = renderedLine.replace(regex, `<span style="color: ${color}; font-weight: bold;">${escapeHtml(varName)}</span>`);
            }
            row.innerHTML = renderedLine === '' ? ' ' : renderedLine;
        } else {
            row.textContent = lineText === '' ? ' ' : lineText;
        }

        codeViewer.appendChild(row);
    });
}

function resetTimelineState() {
    isTimelineActive = false;
    pipelineSteps = [];
    variableColorMap = {};
    currentFrameIndex = 0;
    predictionTarget = null;
    predictionAttemptCounts = {};
    revealedPredictionKeys = new Set();
    lastLessonResult = null;
    slider.max = 0;
    slider.value = 0;
    slider.disabled = true;
    stepCounter.textContent = "0/0";
    syncEditorRendering();
    renderConceptTags([]);
    resetPredictionPanel();
    renderLessonStatus(null);
    renderTeacherInsights();
    renderInitialConsole();
}

function populateLessonSelect() {
    lessonSelect.innerHTML = Object.entries(LESSONS)
        .map(([id, lesson]) => `<option value="${id}">${escapeHtml(lesson.title)}</option>`)
        .join('');
    lessonSelect.value = activeLessonId;
}

function populateTaskSelect(topicId) {
    const tasks = getTasksForTopic(topicId);
    exampleSelect.innerHTML = tasks
        .map(task => `<option value="${task.id}">${escapeHtml(task.title)}</option>`)
        .join('');

    if (!tasks.some(task => task.id === activeTaskId)) {
        activeTaskId = tasks[0]?.id || "";
    }

    exampleSelect.value = activeTaskId;
}

function setActiveLesson(id, shouldLog = true) {
    activeContentMode = "practice-task";
    activeLessonId = id;
    lessonSelect.value = id;
    activeTaskId = getTasksForTopic(id)[0]?.id || "";
    populateTaskSelect(id);
    setActiveTask(activeTaskId, false);

    if (shouldLog) {
        logStudentAction("select", "Topic", {
            selectedTopicId: id,
            selectedTopicTitle: LESSONS[id].title
        });
    }
}

function setActiveTask(taskId, shouldLog = true) {
    const task = getTasksForTopic(activeLessonId).find(item => item.id === taskId);
    if (!task) return;

    activeContentMode = "practice-task";
    activeTaskId = taskId;
    exampleSelect.value = taskId;
    codeInput.value = task.starterCode;
    resetTimelineState();
    renderLessonGoal();

    if (shouldLog) {
        logStudentAction("select", "Practice Task", {
            selectedTaskId: taskId,
            selectedTaskTitle: task.title
        });
    }
}

function renderLessonGoal() {
    const topic = LESSONS[activeLessonId];
    const task = getActiveTask();
    if (!task) return;

    lessonGoal.innerHTML = `
        <div class="lesson-title">${escapeHtml(topic.title)} / ${escapeHtml(task.title)}</div>
        <div class="lesson-objective">${escapeHtml(task.objective)}</div>
        <div class="lesson-concept">Focus: ${escapeHtml(topic.concept)}</div>
    `;
}

codeInput.addEventListener('input', resetTimelineState);

codeInput.addEventListener('scroll', () => {
    codeViewer.scrollTop = codeInput.scrollTop;
    codeViewer.scrollLeft = codeInput.scrollLeft;
    gutterZone.scrollTop = codeInput.scrollTop;
});

exampleSelect.addEventListener('change', () => {
    setActiveTask(exampleSelect.value, true);
});

lessonSelect.addEventListener('change', () => {
    setActiveLesson(lessonSelect.value, true);
});

btnCheckLesson.addEventListener('click', () => {
    if (!pipelineSteps.length) {
        logStudentAction("button", "Check Task Goal", { result: "no_trace" });
        renderLessonStatus({
            passed: false,
            criteria: [{ passed: false, label: "Run the program before checking the task." }]
        });
        return;
    }
    lastLessonResult = evaluateLesson(getActiveTask(), pipelineSteps);
    logStudentAction("button", "Check Task Goal", {
        result: lastLessonResult.passed ? "passed" : "failed",
        criteria: lastLessonResult.criteria
    });
    renderLessonStatus(lastLessonResult);
    renderTeacherInsights();
});

btnExportReport.addEventListener('click', exportTeacherReport);
btnPresentationMode.addEventListener('click', togglePresentationMode);

function initializeVariableColors(steps) {
    variableColorMap = {};
    let colorIndex = 0;

    steps.forEach(frame => {
        const snapshots = [frame.variables || {}, frame.beforeVariables || {}, frame.afterVariables || {}];
        snapshots.forEach(vars => {
            for (const varName of Object.keys(vars)) {
                if (!variableColorMap[varName]) {
                    variableColorMap[varName] = BRIGHT_PALETTE[colorIndex % BRIGHT_PALETTE.length];
                    colorIndex++;
                }
            }
        });
    });
}

btnRun.addEventListener('click', async () => {
    const code = codeInput.value;
    logStudentAction("button", "Compile & Trace", {
        codeLength: code.length
    });
    btnRun.textContent = "Tracing...";
    btnRun.disabled = true;

    try {
        const response = await fetch('/api/execution/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) throw new Error("Backend infrastructure execution alert.");

        pipelineSteps = await response.json();

        if (!pipelineSteps || pipelineSteps.length === 0) {
            throw new Error("No trace telemetry returned.");
        }

        isTimelineActive = true;
        initializeVariableColors(pipelineSteps);

        slider.max = pipelineSteps.length - 1;
        slider.value = 0;
        slider.disabled = pipelineSteps.length <= 1;

        renderFrame(0);
        const task = getActiveTask();
        lastLessonResult = evaluateLesson(task, pipelineSteps);
        renderLessonStatus(lastLessonResult);
        exerciseTrainingRecords.push({
            timestamp: new Date().toISOString(),
            topicId: activeLessonId,
            topicTitle: LESSONS[activeLessonId].title,
            taskId: task.id,
            taskTitle: task.title,
            focusConcept: LESSONS[activeLessonId].concept,
            traceSteps: pipelineSteps.length,
            goalPassed: lastLessonResult.passed,
            criteria: lastLessonResult.criteria
        });
        renderTeacherInsights();
    } catch (err) {
        isTimelineActive = false;
        variableColorMap = {};
        syncEditorRendering();
        renderConceptTags([]);
        resetPredictionPanel();
        renderLessonStatus(null);
        consoleOutput.innerHTML = `<span style="color: #f85149;">Compilation Core Error: ${escapeHtml(err.message)}</span>`;
    } finally {
        btnRun.textContent = "Compile & Trace";
        btnRun.disabled = false;
    }
});

slider.addEventListener('input', (event) => {
    renderFrame(parseInt(event.target.value));
});

btnCheckPrediction.addEventListener('click', checkPrediction);
btnRevealAnswer.addEventListener('click', revealAnswer);
btnOpenGuide.addEventListener('click', () => startGuide(true));
btnGuideNext.addEventListener('click', advanceGuide);
btnGuidePrev.addEventListener('click', previousGuide);
btnGuideSkip.addEventListener('click', completeGuide);
window.addEventListener('resize', positionGuideCard);
window.addEventListener('scroll', positionGuideCard, true);
window.addEventListener('keydown', (event) => {
    if (event.key === "Escape" && presentationMode) {
        setPresentationMode(false);
    }
});
predictionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        checkPrediction();
    }
});

function renderFrame(index) {
    if (!pipelineSteps || pipelineSteps.length === 0 || index >= pipelineSteps.length) return;

    currentFrameIndex = index;

    const frame = pipelineSteps[index];
    const beforeVars = frame.beforeVariables || frame.previousVariables || {};
    const afterVars = frame.afterVariables || frame.variables || {};
    const changes = frame.changes || [];
    predictionTarget = getPredictionTarget(frame);

    renderConsole(frame);
    renderConceptTags(frame.concepts || [], frame.scopeName);

    stepCounter.textContent = `${index + 1}/${pipelineSteps.length}`;

    syncEditorRendering(frame.line);
    renderScopeGrid(afterVars, frame);
    renderPredictionPanel(frame);
}

function renderConsole(frame) {
    const concepts = (frame.concepts || []).join(", ") || "No concept tag";
    const scope = frame.scopeName && frame.scopeName !== "<module>" ? frame.scopeName : "global";
    const source = frame.sourceLine ? frame.sourceLine.trim() : "";
    const target = getPredictionTarget(frame);
    const showTargetAnswer = shouldShowPredictionAnswer(frame, target);
    const changeSummary = (frame.changes || []).length
        ? frame.changes.map(change => {
            const beforeValue = change.changeType === "initialized" ? "not allocated" : change.before;
            const isPredictionTarget = target && change.name === target.name;
            const afterValue = isPredictionTarget && !showTargetAnswer
                ? "hidden until prediction is checked"
                : (change.changeType === "removed" ? "removed" : change.after);
            return `${change.name}: ${beforeValue} -> ${afterValue}`;
        }).join("; ")
        : "No tracked variable change";

    const rows = [
        `<div class="console-row trace-head">Step ${escapeHtml(frame.stepNumber)} / Line ${escapeHtml(frame.line)}</div>`,
        `<div class="console-row trace-line">code: ${escapeHtml(source || "(program transition)")}</div>`,
        `<div class="console-row trace-meta">scope: ${escapeHtml(scope)} | concept: ${escapeHtml(concepts)}</div>`,
        `<div class="console-row trace-change">change: ${escapeHtml(changeSummary)}</div>`
    ];

    const previousFrame = pipelineSteps[currentFrameIndex - 1];
    const nextFrame = pipelineSteps[currentFrameIndex + 1];
    if (previousFrame || nextFrame) {
        rows.push(`<div class="console-row trace-output-label">timeline context</div>`);
        if (previousFrame) {
            rows.push(`<div class="console-row muted">previous: Line ${escapeHtml(previousFrame.line)} | ${escapeHtml((previousFrame.sourceLine || "").trim() || "(program transition)")}</div>`);
        }
        rows.push(`<div class="console-row trace-line">current: Line ${escapeHtml(frame.line)} | ${escapeHtml(source || "(program transition)")}</div>`);
        if (nextFrame) {
            rows.push(`<div class="console-row muted">next: Line ${escapeHtml(nextFrame.line)} | ${escapeHtml((nextFrame.sourceLine || "").trim() || "(program transition)")}</div>`);
        }
    }

    if (frame.stdout) {
        const stdoutRows = String(frame.stdout).trimEnd().split('\n');
        rows.push(`<div class="console-row trace-output-label">stdout</div>`);
        rows.push(...stdoutRows.map(line => `<div class="console-row">${escapeHtml(line)}</div>`));
    }

    const explanation = formatExplanation(frame, target, showTargetAnswer);
    if (explanation) {
        rows.push(`<div class="console-row trace-output-label">step explanation</div>`);
        rows.push(`<div class="console-row trace-explanation">${explanation}</div>`);
    }

    consoleOutput.innerHTML = rows.join('');

    if (frame.error) {
        const title = frame.friendlyErrorTitle || frame.errorType || "Runtime Error";
        const message = frame.friendlyErrorMessage || frame.error;
        consoleOutput.innerHTML += `
            <div class="console-row error">${escapeHtml(title)}</div>
            <div class="console-row error-detail">${escapeHtml(message)}</div>
            <div class="console-row muted">Raw: ${escapeHtml(frame.error)}</div>
        `;
    }
}

function formatExplanation(frame, target = null, showTargetAnswer = true) {
    let processedExplanation = escapeHtml(frame.explanation || "");
    if (target && !showTargetAnswer) {
        const answerText = escapeHtml(String(target.changeType === "removed" ? "removed" : target.after));
        if (answerText) {
            const quotedAnswer = `&quot;${answerText}&quot;`;
            processedExplanation = processedExplanation.replace(
                new RegExp(escapeRegExp(quotedAnswer), "g"),
                "&quot;hidden until prediction is checked&quot;"
            );
        }
    }
    for (const [varName, color] of Object.entries(variableColorMap)) {
        const regex = new RegExp(`\`${escapeRegExp(escapeHtml(varName))}\``, 'g');
        processedExplanation = processedExplanation.replace(regex, `<code style="color: ${color}; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius:3px;">${escapeHtml(varName)}</code>`);
    }
    return processedExplanation;
}

function renderConceptTags(concepts, scopeName = "") {
    if (!conceptPanel) return;

    const tags = [...(concepts || [])];
    if (scopeName && scopeName !== "<module>") {
        tags.push(`Scope: ${scopeName}`);
    }

    if (tags.length === 0) {
        conceptPanel.innerHTML = `<div class="concept-empty">No concept tag for this step yet.</div>`;
        return;
    }

    conceptPanel.innerHTML = tags
        .map(concept => `<span class="concept-chip">${escapeHtml(concept)}</span>`)
        .join('');
}

function renderScopeGrid(vars, frame = null) {
    scopeGrid.innerHTML = '';

    if (Object.keys(vars).length === 0) {
        scopeGrid.innerHTML = `<div style="color: #8b949e; font-size: 12px; font-style: italic;">No variables allocated after this highlighted line.</div>`;
        return;
    }

    const target = getPredictionTarget(frame);
    const showTargetAnswer = shouldShowPredictionAnswer(frame, target);

    for (const [key, value] of Object.entries(vars)) {
        const varColor = variableColorMap[key] || "#c9d1d9";
        const shouldMask = target && key === target.name && !showTargetAnswer;
        const displayValue = getMaskedValue(value, shouldMask);
        const card = document.createElement('div');
        card.className = 'variable-card';
        card.style.border = `1px solid ${varColor}`;
        card.style.background = `rgba(${hexToRgb(varColor)}, 0.04)`;
        card.innerHTML = `<span class="name" style="color: ${varColor}">${escapeHtml(key)}</span> = <span class="value" style="color: #ffffff; font-weight: bold; background: rgba(${hexToRgb(varColor)}, 0.2); padding: 1px 6px; border-radius: 4px;">${escapeHtml(displayValue)}</span>`;
        scopeGrid.appendChild(card);
    }
}

function renderPredictionPanel(frame) {
    const target = getPredictionTarget(frame);

    predictionTarget = target || null;
    predictionInput.value = "";
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = !target;

    if (!target) {
        predictionPrompt.textContent = "No variable changes on this step.";
        return;
    }

    const attemptCount = predictionAttemptCounts[getPredictionKey(frame, target)] || 0;
    predictionPrompt.textContent = `Guess the new value of ${target.name}. Attempts used: ${attemptCount}/3.`;
}

function checkPrediction() {
    const frame = pipelineSteps[currentFrameIndex];
    if (!frame) {
        logStudentAction("button", "Check Guess", { result: "no_trace" });
        predictionFeedback.textContent = "Run the code first, then check a prediction.";
        predictionFeedback.className = "prediction-feedback muted";
        return;
    }

    if (!predictionTarget) {
        predictionTarget = getPredictionTarget(frame);
    }

    if (!predictionTarget) {
        logStudentAction("button", "Check Guess", {
            result: "no_variable_change",
            stepNumber: frame.stepNumber,
            line: frame.line
        });
        predictionFeedback.textContent = "This step does not change a tracked variable, so there is nothing to check.";
        predictionFeedback.className = "prediction-feedback muted";
        return;
    }

    const guess = predictionInput.value.trim();
    const expected = predictionTarget.changeType === "removed" ? "removed" : String(predictionTarget.after).trim();
    const isCorrect = guess === expected;
    const predictionKey = getPredictionKey(frame, predictionTarget);
    const attemptNumber = (predictionAttemptCounts[predictionKey] || 0) + 1;
    predictionAttemptCounts[predictionKey] = attemptNumber;
    const answerShouldBeShown = isCorrect || attemptNumber >= 3;

    if (answerShouldBeShown) {
        revealedPredictionKeys.add(predictionKey);
    }

    predictionAttempts.push({
        timestamp: new Date().toISOString(),
        topicId: activeLessonId,
        topicTitle: LESSONS[activeLessonId]?.title || "",
        taskId: getActiveTask()?.id || "",
        taskTitle: getActiveTask()?.title || "",
        contentMode: activeContentMode,
        correct: isCorrect,
        attemptNumber,
        answerShown: answerShouldBeShown,
        stepNumber: frame.stepNumber,
        line: frame.line,
        sourceLine: frame.sourceLine,
        scopeName: frame.scopeName,
        concepts: frame.concepts || [],
        variable: predictionTarget.name,
        guess,
        expected
    });

    logStudentAction("button", "Check Guess", {
        result: isCorrect ? "correct" : "wrong",
        attemptNumber,
        answerShown: answerShouldBeShown,
        stepNumber: frame.stepNumber,
        line: frame.line,
        variable: predictionTarget.name,
        guess
    });

    if (isCorrect) {
        predictionFeedback.textContent = `Correct. The correct answer is ${expected}.`;
        predictionFeedback.className = "prediction-feedback good";
    } else if (attemptNumber >= 3) {
        predictionFeedback.textContent = `Not quite. After 3 tries, the correct answer is ${expected}.`;
        predictionFeedback.className = "prediction-feedback needs-work";
    } else {
        predictionFeedback.textContent = `Not quite. Try again before revealing the answer. Attempt ${attemptNumber}/3.`;
        predictionFeedback.className = "prediction-feedback needs-work";
    }
    predictionPrompt.textContent = `Guess the new value of ${predictionTarget.name}. Attempts used: ${attemptNumber}/3.`;

    if (frame) {
        renderConsole(frame);
        renderScopeGrid(frame.afterVariables || frame.variables || {}, frame);
    }
    renderTeacherInsights();
}

function revealAnswer() {
    const frame = pipelineSteps[currentFrameIndex];
    if (!frame) return;

    const target = predictionTarget || getPredictionTarget(frame);
    if (!target) return;

    const expected = target.changeType === "removed" ? "removed" : String(target.after).trim();
    revealedPredictionKeys.add(getPredictionKey(frame, target));
    logStudentAction("button", "Reveal", {
        stepNumber: frame.stepNumber,
        line: frame.line,
        variable: target.name
    });

    predictionFeedback.textContent = `Answer revealed. The correct answer is ${expected}.`;
    predictionFeedback.className = "prediction-feedback muted";
    renderConsole(frame);
    renderScopeGrid(frame.afterVariables || frame.variables || {}, frame);
}

function resetPredictionPanel() {
    predictionTarget = null;
    predictionPrompt.textContent = "Run code to make a prediction.";
    predictionInput.value = "";
    predictionInput.disabled = false;
    predictionFeedback.textContent = "";
    predictionFeedback.className = "prediction-feedback";
    btnCheckPrediction.disabled = false;
    btnRevealAnswer.disabled = true;
}

function evaluateLesson(lesson, steps) {
    const finalVars = getFinalVariables(steps);
    const stdout = getFinalStdout(steps);
    const concepts = getConceptCoverage(steps);
    const hasError = steps.some(step => step.error);

    const criteria = lesson.checks.map(check => {
        if (check.type === "noErrors") {
            return { passed: !hasError, label: hasError ? "Program must finish without errors." : "Program finished without errors." };
        }

        if (check.type === "variableEquals") {
            const actual = normalizeValue(finalVars[check.variable]);
            const expected = normalizeValue(check.expected);
            return {
                passed: actual === expected,
                label: `${check.variable} should finish as ${expected}. Actual: ${actual || "not allocated"}.`
            };
        }

        if (check.type === "stdoutContains") {
            const passed = stdout.includes(check.text);
            return { passed, label: `Console output should include ${check.text}.` };
        }

        if (check.type === "conceptSeen") {
            const passed = concepts.has(check.concept);
            return { passed, label: `Trace should include concept: ${check.concept}.` };
        }

        if (check.type === "errorCategory") {
            const passed = steps.some(step => step.errorCategory === check.expected);
            return {
                passed,
                label: passed
                    ? `Trace identified expected error: ${check.expected}.`
                    : `Trace should identify error: ${check.expected}.`
            };
        }

        return { passed: false, label: "Unknown check." };
    });

    return {
        passed: criteria.every(item => item.passed),
        criteria,
        finalVars,
        stdout,
        concepts: [...concepts]
    };
}

function getFinalVariables(steps) {
    if (!steps.length) return {};
    const last = steps[steps.length - 1];
    return last.afterVariables || last.variables || {};
}

function getFinalStdout(steps) {
    if (!steps.length) return "";
    return String(steps[steps.length - 1].stdout || "");
}

function getConceptCoverage(steps) {
    return new Set(steps.flatMap(step => step.concepts || []));
}

function renderLessonStatus(result) {
    if (!result) {
        lessonStatus.innerHTML = `<div class="lesson-status muted">Run the program to check this task against the trace.</div>`;
        return;
    }

    const statusClass = result.passed ? "passed" : "failed";
    const heading = result.passed ? "Task goal met" : "Task goal not met yet";
    lessonStatus.innerHTML = `
        <div class="lesson-status ${statusClass}">
            <strong>${heading}</strong>
            ${result.criteria.map(item => `<div>${item.passed ? "[ok]" : "[fix]"} ${escapeHtml(item.label)}</div>`).join('')}
        </div>
    `;
}

function renderTeacherInsights() {
    if (!teacherInsights) return;

    const wrongAttempts = predictionAttempts.filter(item => !item.correct);
    const failedCriteria = lastLessonResult?.criteria?.filter(item => !item.passed) || [];
    const totalPredictions = predictionAttempts.length;
    const correctPredictions = predictionAttempts.filter(item => item.correct).length;
    const trainedTasks = new Set(exerciseTrainingRecords.map(item => `${item.topicId}:${item.taskId}`)).size;

    if (!wrongAttempts.length && !failedCriteria.length) {
        teacherInsights.innerHTML = `
            <div class="teacher-empty">
                No misunderstanding signal yet. Trained tasks: ${trainedTasks}. Predictions: ${correctPredictions}/${totalPredictions} correct.
            </div>
        `;
        return;
    }

    const wrongHtml = wrongAttempts.map(item => {
        const expectedText = item.answerShown ? item.expected : "hidden until answer is shown";
        return `
        <div class="teacher-insight">
            <strong>Step ${escapeHtml(item.stepNumber)} / Line ${escapeHtml(item.line)}</strong>
            <span>${escapeHtml(item.variable)} guessed "${escapeHtml(item.guess)}", expected "${escapeHtml(expectedText)}".</span>
            <small>${escapeHtml((item.concepts || []).join(", ") || "No concept tag")}</small>
        </div>
    `;
    }).join('');

    const failedHtml = failedCriteria.map(item => `
        <div class="teacher-insight">
            <strong>Goal gap</strong>
            <span>${escapeHtml(item.label)}</span>
        </div>
    `).join('');

    teacherInsights.innerHTML = wrongHtml + failedHtml;
}

function exportTeacherReport() {
    downloadJson("ssp-student-activity-report.json", {
        exportedAt: new Date().toISOString(),
        operationTimeline: studentActionLog.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            actionType: item.actionType,
            label: item.label,
            topicTitle: item.topicTitle,
            taskTitle: item.taskTitle,
            contentMode: item.contentMode,
            stepIndex: item.stepIndex,
            result: item.result || "",
            details: item
        })),
        trainedExerciseTable: exerciseTrainingRecords.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            topicId: item.topicId,
            topicTitle: item.topicTitle,
            taskId: item.taskId,
            taskTitle: item.taskTitle,
            focusConcept: item.focusConcept,
            traceSteps: item.traceSteps,
            goalPassed: item.goalPassed,
            criteriaSummary: item.criteria.map(check => `${check.passed ? "pass" : "fix"}: ${check.label}`).join(" | ")
        })),
        predictionResultTable: predictionAttempts.map((item, index) => ({
            order: index + 1,
            time: item.timestamp,
            topicTitle: item.topicTitle,
            taskTitle: item.taskTitle,
            contentMode: item.contentMode,
            stepNumber: item.stepNumber,
            line: item.line,
            variable: item.variable,
            guess: item.guess,
            expectedAnswer: item.expected,
            result: item.correct ? "correct" : "wrong",
            attemptNumber: item.attemptNumber,
            answerShownToStudent: item.answerShown,
            concepts: (item.concepts || []).join(", ")
        }))
    });
}

function togglePresentationMode() {
    setPresentationMode(!presentationMode);
}

function setPresentationMode(enabled) {
    presentationMode = enabled;
    document.body.classList.toggle("presentation-mode", presentationMode);
    btnPresentationMode.textContent = presentationMode ? "Exit Presentation" : "Presentation Mode";
}

function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function maybeStartGuide() {
    if (localStorage.getItem(GUIDE_KEY) === "true") return;
    startGuide(false);
}

function startGuide(force = false) {
    if (force) {
        localStorage.removeItem(GUIDE_KEY);
    }

    if (!force && localStorage.getItem(GUIDE_KEY) === "true") return;
    guideIndex = 0;
    guideOverlay.classList.add("visible");
    renderGuideStep();
}

function renderGuideStep() {
    const step = GUIDE_STEPS[guideIndex];
    document.querySelectorAll(".guide-focus").forEach(element => element.classList.remove("guide-focus"));

    guideTitle.textContent = step.title;
    guideBody.textContent = step.body;
    guideStep.textContent = `${guideIndex + 1} / ${GUIDE_STEPS.length}`;
    btnGuidePrev.disabled = guideIndex === 0;
    btnGuideNext.textContent = guideIndex === GUIDE_STEPS.length - 1 ? "Finish" : "Next";

    const focusTarget = document.querySelector(step.focus);
    if (focusTarget) {
        focusTarget.classList.add("guide-focus");
        focusTarget.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }

    window.setTimeout(positionGuideCard, 260);
}

function advanceGuide() {
    if (guideIndex >= GUIDE_STEPS.length - 1) {
        completeGuide();
        return;
    }

    guideIndex++;
    renderGuideStep();
}

function previousGuide() {
    if (guideIndex === 0) return;
    guideIndex--;
    renderGuideStep();
}

function positionGuideCard() {
    if (!guideOverlay.classList.contains("visible")) return;

    const step = GUIDE_STEPS[guideIndex];
    const focusTarget = document.querySelector(step.focus);
    const cardRect = guideCard.getBoundingClientRect();
    const margin = 14;

    if (!focusTarget) {
        guideCard.style.left = `${Math.max(margin, (window.innerWidth - cardRect.width) / 2)}px`;
        guideCard.style.top = `${Math.max(margin, (window.innerHeight - cardRect.height) / 2)}px`;
        return;
    }

    const targetRect = focusTarget.getBoundingClientRect();
    const placement = step.placement || "right";
    let left = targetRect.right + margin;
    let top = targetRect.top + (targetRect.height - cardRect.height) / 2;

    if (placement === "left") {
        left = targetRect.left - cardRect.width - margin;
    } else if (placement === "top") {
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        top = targetRect.top - cardRect.height - margin;
    } else if (placement === "bottom") {
        left = targetRect.left + (targetRect.width - cardRect.width) / 2;
        top = targetRect.bottom + margin;
    }

    if (left + cardRect.width > window.innerWidth - margin) {
        left = targetRect.left - cardRect.width - margin;
    }

    if (left < margin) {
        left = margin;
    }

    if (top + cardRect.height > window.innerHeight - margin) {
        top = window.innerHeight - cardRect.height - margin;
    }

    if (top < margin) {
        top = margin;
    }

    guideCard.style.left = `${left}px`;
    guideCard.style.top = `${top}px`;
}

function completeGuide() {
    localStorage.setItem(GUIDE_KEY, "true");
    guideOverlay.classList.remove("visible");
    document.querySelectorAll(".guide-focus").forEach(element => element.classList.remove("guide-focus"));
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

populateLessonSelect();
setActiveLesson(activeLessonId, false);
syncEditorRendering();
renderConceptTags([]);
resetPredictionPanel();
renderLessonStatus(null);
renderTeacherInsights();
renderInitialConsole();
maybeStartGuide();
