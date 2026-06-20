const QUALITY_STUDIO_RECORDS_KEY = "ssp_v1_quality_studio_records";
const QUALITY_STUDIO_PROGRESS_KEY = "ssp_v1_quality_studio_progress";
const QUALITY_STUDIO_DRAFTS_KEY = "ssp_v1_quality_studio_drafts";
const QUALITY_STUDIO_ACTIVE_KEY = "ssp_v1_quality_studio_active";

const QUALITY_DIMENSIONS = [
    { id: "correctness", label: "Correctness", description: "Meets the full contract, including boundaries." },
    { id: "readability", label: "Readability", description: "Makes intent and control flow easy to understand." },
    { id: "maintainability", label: "Maintainability", description: "Can be changed safely without duplicating rules." },
    { id: "simplicity", label: "Simplicity", description: "Uses no unnecessary mechanism; this is not merely line count." },
    { id: "efficiency", label: "Performance & resources", description: "Uses time and memory appropriately for expected scale." },
    { id: "security", label: "Security", description: "Avoids exposing secrets or creating unsafe behavior." },
    { id: "testability", label: "Testability", description: "Lets tests control inputs and observe results directly." }
];

const QUALITY_STUDIO_TASKS = [
    {
        id: "quality-nested-label",
        title: "When the shortest line hides the decision tree",
        category: "Readability and maintainability",
        difficulty: "Foundation",
        requirement: "delivery_label(weight, express) returns express-heavy when express is true and weight is over 10; express for other express deliveries; standard-heavy for non-express weight over 10; otherwise standard.",
        constraints: ["All four outcomes must remain correct.", "Optimize for a reviewer understanding the branch order, not for the fewest physical lines."],
        versionALabel: "Nested one-line expression",
        versionBLabel: "Explicit decision order",
        versionA: `def delivery_label(weight, express):
    return "express-heavy" if express and weight > 10 else "express" if express else "standard-heavy" if weight > 10 else "standard"`,
        versionB: `def delivery_label(weight, express):
    if express:
        if weight > 10:
            return "express-heavy"
        return "express"
    if weight > 10:
        return "standard-heavy"
    return "standard"`,
        starterCode: `def delivery_label(weight, express):
    return "express-heavy" if express and weight > 10 else "express" if express else "standard-heavy" if weight > 10 else "standard"`,
        overall: "B",
        focusDimensions: ["readability", "maintainability", "simplicity"],
        expectations: { correctness: "Same", readability: "B", maintainability: "B", simplicity: "B", efficiency: "Same", security: "Same", testability: "Same" },
        feedback: {
            correctness: "Both versions implement the same four outcomes.",
            readability: "Version B exposes the priority of express and heavy decisions without decoding chained conditional expressions.",
            maintainability: "A future rule can be inserted into the explicit branches with less risk of changing an unrelated outcome.",
            simplicity: "Conceptual simplicity matters more than one physical line; the chained expression compresses several decisions into one statement.",
            efficiency: "Both perform a constant number of comparisons.",
            security: "Neither version handles sensitive data or an external security boundary.",
            testability: "Both are pure functions with controllable inputs and observable returns."
        },
        rules: [{ type: "no-nested-conditional", label: "Avoid a return statement containing multiple chained conditional expressions." }],
        tests: [
            { id: "label-express-heavy", name: "Express heavy", expression: "delivery_label(12, True)", expectedExpression: "'express-heavy'" },
            { id: "label-express", name: "Express normal", expression: "delivery_label(5, True)", expectedExpression: "'express'" },
            { id: "label-standard-heavy", name: "Standard heavy", expression: "delivery_label(12, False)", expectedExpression: "'standard-heavy'" },
            { id: "label-standard", name: "Standard normal", expression: "delivery_label(5, False)", expectedExpression: "'standard'" }
        ],
        solution: `def delivery_label(weight, express):
    if express:
        if weight > 10:
            return "express-heavy"
        return "express"
    if weight > 10:
        return "standard-heavy"
    return "standard"`,
        reasonKeywords: ["readability", "branch", "maintain", "decision", "clarity"]
    },
    {
        id: "quality-variable-total",
        title: "Replace a fixed example with a general rule",
        category: "Correctness and maintainability",
        difficulty: "Foundation",
        requirement: "total_score(scores) returns the sum for a list of any length, including an empty list.",
        constraints: ["Do not assume the list contains exactly three items.", "The implementation must express the summing rule once."],
        versionALabel: "Works for one sample shape",
        versionBLabel: "Works for the contract",
        versionA: `def total_score(scores):
    return scores[0] + scores[1] + scores[2]`,
        versionB: `def total_score(scores):
    return sum(scores)`,
        starterCode: `def total_score(scores):
    return scores[0] + scores[1] + scores[2]`,
        overall: "B",
        focusDimensions: ["correctness", "maintainability", "simplicity", "testability"],
        expectations: { correctness: "B", readability: "B", maintainability: "B", simplicity: "B", efficiency: "B", security: "Same", testability: "B" },
        feedback: {
            correctness: "Version A raises IndexError for short lists and ignores items after index 2.",
            readability: "sum(scores) states the intended operation directly.",
            maintainability: "Version B needs no code change when the input length changes.",
            simplicity: "The built-in removes repeated index mechanics without hiding the intent.",
            efficiency: "Version B traverses the actual list once; Version A is not a valid scalable implementation of the contract.",
            security: "No security boundary differs between the versions.",
            testability: "Version B can be tested across empty, short, and long lists under the same interface."
        },
        rules: [{ type: "scalable-sequence", label: "Use iteration or sum() instead of fixed literal indexes." }],
        tests: [
            { id: "total-normal", name: "Three scores", expression: "total_score([10, 20, 30])", expectedExpression: "60" },
            { id: "total-empty", name: "Empty list", expression: "total_score([])", expectedExpression: "0" },
            { id: "total-long", name: "Longer list", expression: "total_score([1, 2, 3, 4, 5])", expectedExpression: "15" }
        ],
        solution: `def total_score(scores):
    return sum(scores)`,
        reasonKeywords: ["length", "sum", "index", "maintain", "empty"]
    },
    {
        id: "quality-membership-scale",
        title: "Pay once for repeated membership checks",
        category: "Performance and resources",
        difficulty: "Applied",
        requirement: "allowed_ids(requested, blocked) returns requested IDs that are not blocked. Both inputs may contain thousands of IDs.",
        constraints: ["Preserve requested order.", "Avoid rescanning the entire blocked list for every requested ID."],
        versionALabel: "Repeated list membership",
        versionBLabel: "Prepared membership set",
        versionA: `def allowed_ids(requested, blocked):
    return [item for item in requested if item not in blocked]`,
        versionB: `def allowed_ids(requested, blocked):
    blocked_set = set(blocked)
    return [item for item in requested if item not in blocked_set]`,
        starterCode: `def allowed_ids(requested, blocked):
    return [item for item in requested if item not in blocked]`,
        overall: "B",
        focusDimensions: ["efficiency"],
        expectations: { correctness: "Same", readability: "B", maintainability: "Same", simplicity: "A", efficiency: "B", security: "Same", testability: "Same" },
        feedback: {
            correctness: "Both preserve requested order and return the same values.",
            readability: "blocked_set documents that this collection is used for membership lookup.",
            maintainability: "Both centralize the filtering rule in one expression.",
            simplicity: "Version A has less setup and is reasonable for tiny inputs, but the stated scale changes the overall trade-off.",
            efficiency: "List membership is linear per request; preparing a set makes average membership constant time after one conversion.",
            security: "The data operation introduces no different security boundary.",
            testability: "Both versions are pure and share the same interface."
        },
        rules: [{ type: "set-membership", label: "Prepare a set or dictionary for repeated blocked-ID membership checks." }],
        tests: [
            { id: "allowed-normal", name: "Normal membership", expression: "allowed_ids([1, 2, 3, 4], [2, 4])", expectedExpression: "[1, 3]" },
            { id: "allowed-empty", name: "Empty request", expression: "allowed_ids([], [1, 2])", expectedExpression: "[]" },
            { id: "allowed-order", name: "Order preserved", expression: "allowed_ids([5, 1, 4, 2], [4])", expectedExpression: "[5, 1, 2]" }
        ],
        solution: `def allowed_ids(requested, blocked):
    blocked_set = set(blocked)
    return [item for item in requested if item not in blocked_set]`,
        reasonKeywords: ["set", "membership", "linear", "performance", "scale"]
    },
    {
        id: "quality-secret-output",
        title: "Remove a secret from diagnostic output",
        category: "Security",
        difficulty: "Applied",
        requirement: "build_login_event(username, password) returns a login-attempt event. Passwords must never be printed or logged.",
        constraints: ["The returned event must not contain the password.", "Debug convenience does not justify exposing a credential."],
        versionALabel: "Leaks a credential",
        versionBLabel: "Keeps the same result safely",
        versionA: `def build_login_event(username, password):
    print("login password:", password)
    return {"user": username, "status": "attempted"}`,
        versionB: `def build_login_event(username, password):
    return {"user": username, "status": "attempted"}`,
        starterCode: `def build_login_event(username, password):
    print("login password:", password)
    return {"user": username, "status": "attempted"}`,
        overall: "B",
        focusDimensions: ["security"],
        expectations: { correctness: "Same", readability: "B", maintainability: "B", simplicity: "B", efficiency: "Same", security: "B", testability: "B" },
        feedback: {
            correctness: "Both return the required event, so output-only tests can miss the leak.",
            readability: "Version B contains only behavior required by the function contract.",
            maintainability: "Removing unsafe incidental output prevents future callers inheriting the leak.",
            simplicity: "The print statement adds behavior without product value.",
            efficiency: "The small output cost is not the important difference.",
            security: "Version A exposes a credential to consoles, captured logs, and monitoring systems.",
            testability: "Version B has no extra stdout side effect that tests must capture or suppress."
        },
        rules: [{ type: "no-secret-output", label: "Do not print or log credentials in the repaired function." }],
        tests: [
            { id: "login-alice", name: "Alice event", expression: "build_login_event('alice', 'secret')", expectedExpression: "{'user': 'alice', 'status': 'attempted'}" },
            { id: "login-empty-user", name: "Empty username", expression: "build_login_event('', 'hidden')", expectedExpression: "{'user': '', 'status': 'attempted'}" }
        ],
        solution: `def build_login_event(username, password):
    return {"user": username, "status": "attempted"}`,
        reasonKeywords: ["password", "secret", "log", "security", "side effect"]
    },
    {
        id: "quality-injected-rate",
        title: "Make a changing policy controllable in tests",
        category: "Testability and maintainability",
        difficulty: "Challenge",
        requirement: "calculate_tax(amount, rate=0.1) returns amount times the supplied rate. Different callers and tests must be able to provide different rates.",
        constraints: ["Keep 0.1 as the convenient default.", "Do not require tests to mutate global state."],
        versionALabel: "Hidden global policy",
        versionBLabel: "Injected policy with a default",
        versionA: `TAX_RATE = 0.1

def calculate_tax(amount):
    return amount * TAX_RATE`,
        versionB: `def calculate_tax(amount, rate=0.1):
    return amount * rate`,
        starterCode: `TAX_RATE = 0.1

def calculate_tax(amount):
    return amount * TAX_RATE`,
        overall: "B",
        focusDimensions: ["correctness", "maintainability", "testability"],
        expectations: { correctness: "B", readability: "B", maintainability: "B", simplicity: "B", efficiency: "Same", security: "Same", testability: "B" },
        feedback: {
            correctness: "Version A cannot satisfy callers that supply another rate through the required interface.",
            readability: "Version B makes the policy dependency visible in the function signature.",
            maintainability: "Callers can vary policy without coordinating mutation of shared global state.",
            simplicity: "The default parameter provides convenience without a separate global variable.",
            efficiency: "Both perform one multiplication.",
            security: "Neither version changes a security boundary.",
            testability: "Version B lets each test provide its own rate independently and avoids test-order coupling."
        },
        rules: [{ type: "injectable-rate", label: "Expose the tax rate as a function parameter with a 0.1 default." }],
        tests: [
            { id: "tax-default", name: "Default rate", expression: "calculate_tax(200)", expectedExpression: "20.0" },
            { id: "tax-custom", name: "Custom rate", expression: "calculate_tax(200, 0.2)", expectedExpression: "40.0" },
            { id: "tax-zero", name: "Zero rate", expression: "calculate_tax(200, 0)", expectedExpression: "0" }
        ],
        solution: `def calculate_tax(amount, rate=0.1):
    return amount * rate`,
        reasonKeywords: ["parameter", "global", "test", "rate", "dependency"]
    },
    {
        id: "quality-direct-boolean",
        title: "Prefer the direct boolean rule",
        category: "Useful simplicity",
        difficulty: "Challenge",
        requirement: "is_adult(age) returns whether age is at least 18.",
        constraints: ["Return a boolean.", "Do not add branches that merely translate a boolean expression back into True or False."],
        versionALabel: "Direct expression",
        versionBLabel: "Redundant branch",
        versionA: `def is_adult(age):
    return age >= 18`,
        versionB: `def is_adult(age):
    if age >= 18:
        return True
    else:
        return False`,
        starterCode: `def is_adult(age):
    if age >= 18:
        return True
    else:
        return False`,
        overall: "A",
        focusDimensions: ["readability", "maintainability", "simplicity"],
        expectations: { correctness: "Same", readability: "A", maintainability: "A", simplicity: "A", efficiency: "Same", security: "Same", testability: "Same" },
        feedback: {
            correctness: "Both return the same boolean at and around the boundary.",
            readability: "Version A states the rule directly: adulthood is the result of age >= 18.",
            maintainability: "There is one expression to change if the policy boundary changes.",
            simplicity: "Here the shorter version removes redundant control flow without compressing multiple ideas.",
            efficiency: "The branch difference is negligible and both are constant time.",
            security: "No security behavior differs.",
            testability: "Both are pure functions with the same interface."
        },
        rules: [{ type: "direct-boolean", label: "Return the boolean comparison directly instead of translating it through if/else." }],
        tests: [
            { id: "adult-boundary", name: "Adult boundary", expression: "is_adult(18)", expectedExpression: "True" },
            { id: "adult-below", name: "Below boundary", expression: "is_adult(17)", expectedExpression: "False" },
            { id: "adult-above", name: "Above boundary", expression: "is_adult(30)", expectedExpression: "True" }
        ],
        solution: `def is_adult(age):
    return age >= 18`,
        reasonKeywords: ["boolean", "direct", "branch", "simple", "readability"]
    }
];

let activeQualityTaskId = QUALITY_STUDIO_TASKS[0].id;
let loadedQualityTaskId = null;
let qualityLastResult = null;
let qualityRunning = false;
let qualitySessionMessage = "";
let qualityDraftTimer = null;

const qualityTaskSelect = document.getElementById("quality-task-select");
const qualityProgressLabel = document.getElementById("quality-progress-label");
const qualitySessionState = document.getElementById("quality-session-state");
const qualityRequirement = document.getElementById("quality-requirement");
const qualityVersionALabel = document.getElementById("quality-version-a-label");
const qualityVersionBLabel = document.getElementById("quality-version-b-label");
const qualityVersionA = document.getElementById("quality-version-a");
const qualityVersionB = document.getElementById("quality-version-b");
const qualityDimensionList = document.getElementById("quality-dimension-list");
const qualityOverallChoice = document.getElementById("quality-overall-choice");
const qualityCodeInput = document.getElementById("quality-code-input");
const qualityExplanation = document.getElementById("quality-explanation");
const qualityResults = document.getElementById("quality-results");
const qualityHistory = document.getElementById("quality-history");
const dashboardQualityEvidence = document.getElementById("dashboard-quality-evidence");
const btnQualityPause = document.getElementById("btn-quality-pause");
const btnQualityLast = document.getElementById("btn-quality-last");
const btnQualityRetry = document.getElementById("btn-quality-retry");
const btnQualityNext = document.getElementById("btn-quality-next");
const btnQualityEvaluate = document.getElementById("btn-quality-evaluate");

function getQualityTask(taskId = activeQualityTaskId) {
    return QUALITY_STUDIO_TASKS.find(task => task.id === taskId) || QUALITY_STUDIO_TASKS[0];
}

function getQualityRecords() {
    const records = readJsonStorage(QUALITY_STUDIO_RECORDS_KEY, []);
    return Array.isArray(records) ? records : [];
}

function getQualityProgress() {
    const progress = readJsonStorage(QUALITY_STUDIO_PROGRESS_KEY, []);
    return new Set(Array.isArray(progress) ? progress : []);
}

function getQualityDrafts() {
    const drafts = readJsonStorage(QUALITY_STUDIO_DRAFTS_KEY, {});
    return drafts && typeof drafts === "object" && !Array.isArray(drafts) ? drafts : {};
}

function getQualityDraft(taskId = activeQualityTaskId) {
    return getQualityDrafts()[taskId] || null;
}

function writeQualityDraft(taskId, draft) {
    const drafts = getQualityDrafts();
    drafts[taskId] = draft;
    writeJsonStorage(QUALITY_STUDIO_DRAFTS_KEY, drafts);
}

function removeQualityDraft(taskId = activeQualityTaskId) {
    const drafts = getQualityDrafts();
    delete drafts[taskId];
    writeJsonStorage(QUALITY_STUDIO_DRAFTS_KEY, drafts);
}

function getQualityAnswers() {
    return QUALITY_DIMENSIONS.reduce((answers, dimension) => {
        answers[dimension.id] = document.querySelector(`input[name="quality-${dimension.id}"]:checked`)?.value || "";
        return answers;
    }, {});
}

function getQualityOverallAnswer() {
    return document.querySelector('input[name="quality-overall"]:checked')?.value || "";
}

function saveQualityDraft(options = {}) {
    if (!qualityCodeInput || loadedQualityTaskId !== activeQualityTaskId) return null;
    const answers = getQualityAnswers();
    const overall = getQualityOverallAnswer();
    const matchesAcceptedAttempt = qualityLastResult?.passed
        && qualityLastResult.taskId === activeQualityTaskId
        && qualityCodeInput.value === (qualityLastResult.submittedCode || "")
        && qualityExplanation.value === (qualityLastResult.explanation || "")
        && QUALITY_DIMENSIONS.every(dimension => answers[dimension.id] === qualityLastResult.answers?.[dimension.id])
        && overall === qualityLastResult.overall;
    if (matchesAcceptedAttempt && !options.force) {
        removeQualityDraft(activeQualityTaskId);
        if (options.announce) qualitySessionMessage = "Completed attempt saved in history; there is no unfinished draft.";
        renderQualitySessionState();
        return null;
    }
    const draft = {
        code: qualityCodeInput.value,
        explanation: qualityExplanation.value,
        answers,
        overall,
        updatedAt: new Date().toISOString()
    };
    writeQualityDraft(activeQualityTaskId, draft);
    localStorage.setItem(QUALITY_STUDIO_ACTIVE_KEY, activeQualityTaskId);
    if (options.announce) qualitySessionMessage = "Draft saved. Return to Quality Studio to continue.";
    renderQualitySessionState();
    return draft;
}

function scheduleQualityDraftSave() {
    clearTimeout(qualityDraftTimer);
    qualityDraftTimer = setTimeout(() => {
        qualitySessionMessage = "Draft autosaved.";
        saveQualityDraft();
    }, 350);
}

function setActiveQualityTask(taskId) {
    if (loadedQualityTaskId === activeQualityTaskId) saveQualityDraft();
    activeQualityTaskId = getQualityTask(taskId).id;
    localStorage.setItem(QUALITY_STUDIO_ACTIVE_KEY, activeQualityTaskId);
    loadedQualityTaskId = null;
    qualityLastResult = null;
    qualitySessionMessage = "";
    renderQualityStudio();
}

function renderQualityChoice(name, selected = "") {
    return ["A", "B", "Same"].map(value => `
        <label>
            <input type="radio" name="${escapeHtml(name)}" value="${value}" ${selected === value ? "checked" : ""}>
            <span>${value === "Same" ? "Same" : `Version ${value}`}</span>
        </label>
    `).join("");
}

function renderQualityStudio() {
    if (!qualityTaskSelect || !qualityRequirement) return;
    const task = getQualityTask();
    const progress = getQualityProgress();
    const draft = getQualityDraft(task.id);
    const answers = draft?.answers || qualityLastResult?.answers || {};
    const overall = draft?.overall || qualityLastResult?.overall || "";
    const difficultyOrder = ["Foundation", "Applied", "Challenge"];

    qualityTaskSelect.innerHTML = difficultyOrder.map(difficulty => {
        const tasks = QUALITY_STUDIO_TASKS.filter(item => item.difficulty === difficulty);
        if (!tasks.length) return "";
        return `<optgroup label="${difficulty}">${tasks.map(item => {
            const index = QUALITY_STUDIO_TASKS.findIndex(candidate => candidate.id === item.id);
            return `<option value="${escapeHtml(item.id)}" ${item.id === task.id ? "selected" : ""}>${progress.has(item.id) ? "Completed - " : ""}${index + 1}. ${escapeHtml(item.title)}</option>`;
        }).join("")}</optgroup>`;
    }).join("");

    qualityProgressLabel.innerHTML = `<strong>${progress.size}/${QUALITY_STUDIO_TASKS.length} quality challenges demonstrated</strong>&nbsp; Passing requires focused judgment, executable behavior, engineering structure, and a defended trade-off.`;
    qualityRequirement.innerHTML = `
        <h2>${escapeHtml(task.title)}</h2>
        <p><strong>${escapeHtml(task.category)}</strong> · ${escapeHtml(task.difficulty)}</p>
        <p>${escapeHtml(task.requirement)}</p>
        <ul class="review-constraint-list">${task.constraints.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    `;
    qualityVersionALabel.textContent = task.versionALabel;
    qualityVersionBLabel.textContent = task.versionBLabel;
    qualityVersionA.textContent = task.versionA;
    qualityVersionB.textContent = task.versionB;
    qualityDimensionList.innerHTML = QUALITY_DIMENSIONS.map(dimension => `
        <div class="quality-dimension-row">
            <div class="quality-dimension-copy">
                <strong>${escapeHtml(dimension.label)}</strong>
                <span>${escapeHtml(dimension.description)}</span>
            </div>
            <span class="quality-focus-tag">${task.focusDimensions.includes(dimension.id) ? "Focus dimension" : "Supporting judgment"}</span>
            <div class="quality-choice">${renderQualityChoice(`quality-${dimension.id}`, answers[dimension.id])}</div>
        </div>
    `).join("");
    qualityOverallChoice.innerHTML = renderQualityChoice("quality-overall", overall);

    if (loadedQualityTaskId !== task.id) {
        qualityCodeInput.value = draft?.code ?? task.starterCode;
        qualityExplanation.value = draft?.explanation ?? "";
        loadedQualityTaskId = task.id;
    }

    renderQualitySessionState();
    renderQualityResult(qualityLastResult);
    renderQualityHistory();
}

function getQualityTaskAttempts(taskId = activeQualityTaskId) {
    return getQualityRecords()
        .map((record, storageIndex) => ({ record, storageIndex }))
        .filter(item => item.record.taskId === taskId);
}

function renderQualitySessionState() {
    if (!qualitySessionState) return;
    const draft = getQualityDraft();
    const attempts = getQualityTaskAttempts();
    const completed = getQualityProgress().has(activeQualityTaskId);
    qualitySessionState.innerHTML = `
        <span><strong>${escapeHtml(qualitySessionMessage || (draft ? `Draft saved ${new Date(draft.updatedAt).toLocaleString()}` : "No saved draft yet"))}</strong></span>
        <span>${completed ? "Challenge demonstrated; new attempts remain available for review." : `${attempts.length} evaluated attempt${attempts.length === 1 ? "" : "s"}.`}</span>
    `;
    if (btnQualityLast) btnQualityLast.disabled = attempts.length === 0;
}

function evaluateQualityRules(task, code) {
    const source = String(code || "");
    return (task.rules || []).map(rule => {
        let passed = true;
        if (rule.type === "no-nested-conditional") passed = !/return[^\n]*\bif\b[^\n]*\belse\b[^\n]*\bif\b/.test(source);
        if (rule.type === "scalable-sequence") passed = /\bsum\s*\(|\bfor\b|\bwhile\b/.test(source) && !/scores\s*\[\s*[012]\s*\]/.test(source);
        if (rule.type === "set-membership") passed = /\b(?:set|frozenset)\s*\(|dict\.fromkeys\s*\(|\{[^}\n]*\bfor\b[^}\n]*\bin\b[^}\n]*\}/.test(source);
        if (rule.type === "no-secret-output") passed = !/\bprint\s*\(|\blogging\s*\.|\blogger\s*\./.test(source);
        if (rule.type === "injectable-rate") passed = /def\s+calculate_tax\s*\(\s*[^,\n]+,\s*[^)\n]*=\s*0\.1\s*\)/.test(source);
        if (rule.type === "direct-boolean") passed = /return\s+\(?\s*(?:[A-Za-z_]\w*\s*>=\s*18|18\s*<=\s*[A-Za-z_]\w*)\s*\)?/.test(source) && !/\bif\b/.test(source);
        return { ...rule, passed };
    });
}

function assessQualityJudgment(task, answers, overall) {
    const dimensionResults = QUALITY_DIMENSIONS.map(dimension => ({
        id: dimension.id,
        label: dimension.label,
        selected: answers[dimension.id] || "Not answered",
        expected: task.expectations[dimension.id],
        passed: answers[dimension.id] === task.expectations[dimension.id],
        focused: task.focusDimensions.includes(dimension.id),
        feedback: task.feedback[dimension.id]
    }));
    return {
        dimensionResults,
        allAnswered: dimensionResults.every(item => item.selected !== "Not answered"),
        focusPassed: dimensionResults.filter(item => item.focused).every(item => item.passed),
        overallPassed: overall === task.overall,
        correctCount: dimensionResults.filter(item => item.passed).length
    };
}

async function evaluateQualityStudio() {
    if (qualityRunning) return;
    const task = getQualityTask();
    const code = qualityCodeInput.value;
    const explanation = qualityExplanation.value.trim();
    const answers = getQualityAnswers();
    const overall = getQualityOverallAnswer();
    const judgment = assessQualityJudgment(task, answers, overall);
    const ruleResults = evaluateQualityRules(task, code);
    const structurePassed = code.trim() !== task.starterCode.trim() && ruleResults.every(rule => rule.passed);
    const normalizedExplanation = explanation.toLowerCase();
    const explanationSpecific = [...task.reasonKeywords, ...task.focusDimensions]
        .some(keyword => normalizedExplanation.includes(String(keyword).toLowerCase()));
    const explanationPassed = explanation.length >= 70 && (explanationSpecific || explanation.length >= 130);
    saveQualityDraft();

    qualityRunning = true;
    btnQualityEvaluate.disabled = true;
    btnQualityEvaluate.textContent = "Evaluating Quality Evidence...";
    qualityResults.innerHTML = `<div class="review-feedback-box">Running the refactor against normal and boundary behavior checks...</div>`;

    let responseData = { passed: false, tests: [], error: "" };
    try {
        const response = await fetch("/api/execution/review-tests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, tests: task.tests })
        });
        const text = await response.text();
        if (!response.ok) throw new Error(text || `Quality test request failed (${response.status}).`);
        responseData = JSON.parse(text);
    } catch (error) {
        responseData = { passed: false, tests: [], error: error.message || "The quality test engine could not run." };
    } finally {
        qualityRunning = false;
        btnQualityEvaluate.disabled = false;
        btnQualityEvaluate.textContent = "Evaluate Quality Decision";
    }

    const infrastructureFailure = /Python 3 is not available|No installed Python|Failed to fetch|test request failed \(404\)/i.test(responseData.error || "");
    const runtimePassed = Boolean(responseData.passed);
    const passed = !infrastructureFailure
        && judgment.allAnswered
        && judgment.focusPassed
        && judgment.overallPassed
        && runtimePassed
        && structurePassed
        && explanationPassed;
    const priorAttempts = getQualityTaskAttempts().length;
    const result = {
        timestamp: new Date().toISOString(),
        taskId: task.id,
        title: task.title,
        focusDimensions: task.focusDimensions,
        answers,
        overall,
        submittedCode: code,
        explanation,
        ...judgment,
        ruleResults,
        structurePassed,
        explanationPassed,
        runtimePassed,
        infrastructureFailure,
        tests: Array.isArray(responseData.tests) ? responseData.tests : [],
        engineError: responseData.error || "",
        attemptNumber: priorAttempts + 1,
        passed
    };

    if (!infrastructureFailure) recordQualityAttempt(result);
    if (passed) removeQualityDraft(task.id);
    qualityLastResult = result;
    qualitySessionMessage = infrastructureFailure
        ? "Environment check failed; this was not counted as a student attempt."
        : passed
            ? "Quality evidence accepted and saved."
            : "Attempt saved. Use the dimension and runtime feedback to revise it.";
    renderQualityStudio();
    renderQualityDashboardEvidence();
}

function recordQualityAttempt(record) {
    const records = getQualityRecords();
    records.push(record);
    writeJsonStorage(QUALITY_STUDIO_RECORDS_KEY, records.slice(-120));
    if (record.passed) {
        const progress = getQualityProgress();
        progress.add(record.taskId);
        writeJsonStorage(QUALITY_STUDIO_PROGRESS_KEY, [...progress]);
    }
    studentActionLog.push({
        timestamp: record.timestamp,
        actionType: "quality-evaluation",
        label: record.title,
        topicId: "quality-studio",
        topicTitle: "Code Quality Studio",
        taskId: record.taskId,
        taskTitle: record.title,
        contentMode: "quality-studio",
        result: record.passed ? "passed" : "needs-revision"
    });
}

function getQualityNextAction(result) {
    if (result.infrastructureFailure) return "Restore the Python execution environment, then evaluate the saved draft again.";
    if (!result.allAnswered) return "Make a judgment for every quality dimension; supporting dimensions reveal trade-offs even when they do not control this challenge's pass condition.";
    if (!result.focusPassed) return "Recompare the focus dimensions using the stated input scale and constraints, not line count alone.";
    if (!result.overallPassed) return "Reconsider which version best fits this specific engineering context after balancing the focus dimensions.";
    if (!result.runtimePassed) return "Fix the first failing behavior check before arguing that the refactor has better quality.";
    if (!result.structurePassed) return (result.ruleResults || []).find(rule => !rule.passed)?.label || "Make the requested quality improvement visible in the code structure.";
    if (!result.explanationPassed) return "Explain the concrete trade-off, name at least one focus dimension, and cite code or test evidence.";
    return "Continue to the next scenario and look for a case where a different trade-off wins.";
}

function renderQualityResult(result) {
    if (!qualityResults) return;
    if (!result) {
        qualityResults.innerHTML = `<div class="review-feedback-box">Judge all seven dimensions, choose the better overall version for this context, refactor the weaker code, and defend the trade-off with evidence.</div>`;
        return;
    }
    const task = getQualityTask(result.taskId);
    const attempts = getQualityTaskAttempts().filter(item => !item.record.passed).length;
    const showReference = !result.passed && !result.infrastructureFailure && attempts >= 3;
    const dimensionRows = (result.dimensionResults || []).map(item => `
        <div class="quality-score-cell ${item.passed ? "pass" : "fix"}">
            <strong>${item.passed ? "PASS" : "REVIEW"} · ${escapeHtml(item.label)}${item.focused ? " · FOCUS" : ""}</strong>
            <span>Your choice: ${escapeHtml(item.selected)}. Expected: ${escapeHtml(item.expected)}. ${escapeHtml(item.feedback)}</span>
        </div>
    `).join("");
    const testRows = result.tests?.length
        ? result.tests.map(test => `<div class="review-test-result ${test.passed ? "pass" : ""}"><strong>${test.passed ? "PASS" : "FIX"}</strong><span><strong>${escapeHtml(test.name)}</strong><br>${escapeHtml(test.error || `Actual ${test.actual}; expected ${test.expected}.`)}</span></div>`).join("")
        : `<div class="review-test-result"><strong>FIX</strong><span>${escapeHtml(result.engineError || "No runtime evidence was returned.")}</span></div>`;
    const ruleFeedback = (result.ruleResults || []).filter(rule => !rule.passed);

    qualityResults.innerHTML = `
        <div class="review-result-heading">
            <strong>${result.infrastructureFailure ? "Environment not ready" : result.passed ? "Quality evidence accepted" : "Quality decision needs revision"}</strong>
            <span>${result.infrastructureFailure ? "Not counted" : `Attempt ${result.attemptNumber}`} · ${new Date(result.timestamp).toLocaleString()}</span>
        </div>
        <div class="review-feedback-box ${result.passed ? "passed" : "failed"}">
            ${result.infrastructureFailure
                ? "The execution environment could not verify the refactor. The draft remains saved and no failed attempt was recorded."
                : result.passed
                    ? `The refactor works, the focus judgments are supported, and ${result.correctCount}/7 dimension judgments match the scenario evidence.`
                    : `${result.correctCount}/7 dimension judgments match the scenario evidence. Passing depends on all focus dimensions, the overall decision, working code, structure, and explanation.`}
        </div>
        <div class="quality-score-grid">${dimensionRows}</div>
        ${ruleFeedback.length ? `<div class="review-feedback-box failed"><strong>Engineering structure</strong>${ruleFeedback.map(rule => `<p>${escapeHtml(rule.label)}</p>`).join("")}</div>` : ""}
        <div class="review-test-results">${testRows}</div>
        <div class="review-feedback-box review-next-action"><strong>Next action</strong><p>${escapeHtml(getQualityNextAction(result))}</p></div>
        ${showReference ? `<div class="review-feedback-box failed"><strong>Reference refactor after three attempts</strong><p>This is one defensible implementation, not the only accepted wording.</p><pre>${escapeHtml(task.solution)}</pre></div>` : ""}
    `;
}

function renderQualityHistory() {
    if (!qualityHistory) return;
    const attempts = getQualityTaskAttempts().slice(-6).reverse();
    if (!attempts.length) {
        qualityHistory.innerHTML = `<div class="review-history-empty">No evaluated quality attempt yet. Autosaved drafts are not counted as evidence.</div>`;
        return;
    }
    qualityHistory.innerHTML = attempts.map(({ record, storageIndex }) => `
        <div class="quality-history-row ${record.passed ? "passed" : ""}">
            <strong>#${record.attemptNumber || storageIndex + 1}</strong>
            <div><strong>${record.passed ? "Evidence accepted" : "Revision needed"}</strong><br><span>${new Date(record.timestamp).toLocaleString()}</span></div>
            <span>${record.correctCount || 0}/7 dimensions</span>
            <button class="secondary-btn" type="button" data-quality-record-index="${storageIndex}">Review</button>
        </div>
    `).join("");
}

function loadQualityAttempt(storageIndex) {
    const record = getQualityRecords()[Number(storageIndex)];
    if (!record) return;
    if (loadedQualityTaskId === activeQualityTaskId) saveQualityDraft();
    activeQualityTaskId = getQualityTask(record.taskId).id;
    localStorage.setItem(QUALITY_STUDIO_ACTIVE_KEY, activeQualityTaskId);
    writeQualityDraft(activeQualityTaskId, {
        code: record.submittedCode || getQualityTask(record.taskId).starterCode,
        explanation: record.explanation || "",
        answers: record.answers || {},
        overall: record.overall || "",
        updatedAt: new Date().toISOString()
    });
    loadedQualityTaskId = null;
    qualityLastResult = record;
    qualitySessionMessage = `Reviewing attempt ${record.attemptNumber || ""}.`;
    renderQualityStudio();
}

function reviewLastQualityAttempt() {
    const attempts = getQualityTaskAttempts();
    if (attempts.length) loadQualityAttempt(attempts[attempts.length - 1].storageIndex);
}

function startNewQualityAttempt() {
    removeQualityDraft();
    loadedQualityTaskId = null;
    qualityLastResult = null;
    qualitySessionMessage = getQualityProgress().has(activeQualityTaskId)
        ? "New attempt started; previous mastery evidence remains in history."
        : "New attempt started from the weaker implementation.";
    renderQualityStudio();
}

function openNextQualityTask() {
    const progress = getQualityProgress();
    const index = QUALITY_STUDIO_TASKS.findIndex(task => task.id === activeQualityTaskId);
    const next = QUALITY_STUDIO_TASKS.find((task, taskIndex) => taskIndex > index && !progress.has(task.id))
        || QUALITY_STUDIO_TASKS.find(task => !progress.has(task.id))
        || QUALITY_STUDIO_TASKS[(index + 1) % QUALITY_STUDIO_TASKS.length];
    setActiveQualityTask(next.id);
}

function pauseQualityStudio() {
    saveQualityDraft({ announce: true });
    setActiveView("practice");
}

function renderQualityDashboardEvidence() {
    if (!dashboardQualityEvidence) return;
    const records = getQualityRecords();
    const progress = getQualityProgress();
    const rows = QUALITY_DIMENSIONS.map(dimension => {
        const focusedRecords = records.filter(record => (record.focusDimensions || []).includes(dimension.id));
        const correct = focusedRecords.filter(record => record.dimensionResults?.find(item => item.id === dimension.id)?.passed).length;
        const demonstrated = focusedRecords.some(record => record.passed && record.dimensionResults?.find(item => item.id === dimension.id)?.passed);
        const state = demonstrated ? "Demonstrated" : correct ? "Developing" : focusedRecords.length ? "Needs revision" : "Not observed";
        return { ...dimension, state, evidence: focusedRecords.length ? `${correct}/${focusedRecords.length} focus judgments supported by evidence.` : "No focused challenge attempted yet." };
    });
    dashboardQualityEvidence.innerHTML = `
        <div class="review-dashboard">
            <div class="review-dashboard-summary"><strong>${progress.size}/${QUALITY_STUDIO_TASKS.length} quality challenges demonstrated.</strong> Evidence combines comparison judgment, executable refactoring, structural checks, and written trade-off reasoning.</div>
            <div class="review-ability-list">${rows.map(row => `<div class="review-ability-row"><strong>${escapeHtml(row.label)}</strong><span>${escapeHtml(row.evidence)}</span><span class="review-evidence-state">${escapeHtml(row.state)}</span></div>`).join("")}</div>
        </div>
    `;
}

function buildQualityStudioReportData() {
    const records = getQualityRecords();
    const progress = getQualityProgress();
    const drafts = getQualityDrafts();
    return {
        completed: progress.size,
        total: QUALITY_STUDIO_TASKS.length,
        attempts: records.length,
        drafts: Object.keys(drafts).length,
        dimensions: QUALITY_DIMENSIONS.map(dimension => {
            const focused = records.filter(record => (record.focusDimensions || []).includes(dimension.id));
            const correct = focused.filter(record => record.dimensionResults?.find(item => item.id === dimension.id)?.passed).length;
            return { label: dimension.label, correct, attempts: focused.length, demonstrated: focused.some(record => record.passed) };
        }),
        tasks: QUALITY_STUDIO_TASKS.map(task => {
            const attempts = records.filter(record => record.taskId === task.id);
            return { title: task.title, category: task.category, attempts: attempts.length, status: progress.has(task.id) ? "Demonstrated" : attempts.length ? "Needs revision" : drafts[task.id] ? "In progress" : "Not observed" };
        })
    };
}

function renderQualityStudioReportHtml(report) {
    return `
        <p class="muted"><strong>${report.completed}/${report.total}</strong> quality challenges demonstrated across ${report.attempts} evaluated attempts; ${report.drafts} drafts are in progress.</p>
        <div class="ability-grid">${report.dimensions.map(item => `<div class="ability-card"><strong>${escapeHtml(item.label)}</strong><span class="status-pill ${item.demonstrated ? "independent" : item.attempts ? "developing" : "not-started"}">${item.demonstrated ? "Demonstrated" : item.attempts ? "Developing" : "Not observed"}</span><span class="small-note">${item.correct}/${item.attempts} focused judgments supported.</span></div>`).join("")}</div>
        <div class="matrix-wrap" style="margin-top:12px"><table><thead><tr><th>Scenario</th><th>Quality focus</th><th>Status</th><th>Attempts</th></tr></thead><tbody>${report.tasks.map(task => `<tr><td><strong>${escapeHtml(task.title)}</strong></td><td>${escapeHtml(task.category)}</td><td>${escapeHtml(task.status)}</td><td>${task.attempts}</td></tr>`).join("")}</tbody></table></div>
    `;
}

function resetQualityStudioProgress() {
    localStorage.removeItem(QUALITY_STUDIO_RECORDS_KEY);
    localStorage.removeItem(QUALITY_STUDIO_PROGRESS_KEY);
    localStorage.removeItem(QUALITY_STUDIO_DRAFTS_KEY);
    localStorage.removeItem(QUALITY_STUDIO_ACTIVE_KEY);
    activeQualityTaskId = QUALITY_STUDIO_TASKS[0].id;
    loadedQualityTaskId = null;
    qualityLastResult = null;
    qualitySessionMessage = "";
    renderQualityStudio();
    renderQualityDashboardEvidence();
}

qualityTaskSelect?.addEventListener("change", () => setActiveQualityTask(qualityTaskSelect.value));
btnQualityPause?.addEventListener("click", pauseQualityStudio);
btnQualityLast?.addEventListener("click", reviewLastQualityAttempt);
btnQualityRetry?.addEventListener("click", startNewQualityAttempt);
btnQualityNext?.addEventListener("click", openNextQualityTask);
btnQualityEvaluate?.addEventListener("click", evaluateQualityStudio);
qualityCodeInput?.addEventListener("input", scheduleQualityDraftSave);
qualityExplanation?.addEventListener("input", scheduleQualityDraftSave);
qualityDimensionList?.addEventListener("change", scheduleQualityDraftSave);
qualityOverallChoice?.addEventListener("change", scheduleQualityDraftSave);
qualityHistory?.addEventListener("click", event => {
    const button = event.target.closest("[data-quality-record-index]");
    if (button) loadQualityAttempt(button.dataset.qualityRecordIndex);
});

const savedQualityTaskId = localStorage.getItem(QUALITY_STUDIO_ACTIVE_KEY);
if (savedQualityTaskId && QUALITY_STUDIO_TASKS.some(task => task.id === savedQualityTaskId)) activeQualityTaskId = savedQualityTaskId;
renderQualityStudio();
renderQualityDashboardEvidence();
