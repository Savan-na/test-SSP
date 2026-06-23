# SSP v4 - Technical Overview

SSP v4 is an integrated programming learning platform designed to help students systematically master software development through three main training modules.

## System Architecture

The solution is composed of:

- A .NET 9 web application in `LoopVisualizerSystem` that serves static frontend assets and provides REST API endpoints.
- A Python trace engine in `LoopVisualizerSystem/Engine/trace_engine.py` that executes submitted Python code and returns JSON traces.
- Frontend assets in `LoopVisualizerSystem/wwwroot` that implement the user interface and manage learning flows.

The backend writes temporary Python files to the OS temp directory, executes them through the local Python interpreter, and parses the output.

## Dependencies and Runtime Constraints

- .NET 9 SDK
- Python 3
- `python` or `py -3` must be available in PATH

This project is intended for local sandbox use only and is not suitable for production deployment.

## Three Main Training Modules

### Practice (Phase 1) - Core Coding Training

**Goal:** Build programming skills from the ground up with a structured progression.

**Workflow:**

1. Select a topic in **Practice Topic** (such as conditionals, loops, recursion).
2. The system loads the next challenge in the current topic batch.
3. Work through levels **1 through 5** in order, each with increasing difficulty.
4. Run code using **Compile & Run** to verify correctness.
5. After completing all levels for a topic, choose to refresh with a new question set or review the previous one.

**Difficulty Design:**

- **Level 1:** Fill in a missing expression or call using the Fill-in-the-blank gate.
- **Level 2:** Replace a placeholder line with a valid Python statement.
- **Level 3:** Write complete runnable code with minimal hints.
- **Level 4:** Refactor verbose code into a more concise implementation using the target concept.
- **Level 5:** Fix broken code and ensure the final logic and output are correct.

**Key Features:**

- **Practice Path:** Provides step-by-step guidance for each challenge so learners know what code to enter, when to run it, and what the pass conditions are.
- **Question Bank:** Provides the full question repository organized by topic and level, with metadata for the current batch and completion status.
- **Dashboard:** Visualizes progress in a tree layout; nodes light up as challenges, levels, and topics are completed.
- **Question Set Loop:** Each topic includes at least five complete sets of challenges, enabling repeated training and review cycles.

---

### AI Code Review (Phase 2) - Code Inspection and Diagnostic Training

**Goal:** Train learners to read AI-generated code, identify real defects, and produce reliable fixes. This module emphasizes engineering judgment over writing code from scratch.

**Workflow:**

1. Open `AI Code Review` and select a challenge (10 challenges across Starter, Developing, Applied, and Challenge groups).
2. **Read requirements and constraints** to understand the target behavior.
3. **Identify real code issues** in the AI-generated solution and reject plausible but incorrect claims.
4. **Choose test cases** that cover normal scenarios and edge cases.
5. **Fix the code** and document the defect, the test strategy, and the remediation.
6. Click **Evaluate Review & Fix** to run the backend evaluation and generate evidence.

**Coverage Areas:**

Includes edge cases such as empty input, negative values, boundary thresholds, duplicated logic, syntax and return contract issues, incorrect test expectations, collection order problems, overly broad exception handling, quadratic complexity, and lost tail data.

**Training Loop:**

- **Auto-save:** Code, diagnosis choices, selected tests, and explanations are preserved as drafts.
- **Save & Pause:** Return to Practice temporarily and resume the same challenge later.
- **Attempt History:** Store formal evaluation evidence and reopen prior attempts for review.
- **Start New Attempt:** Restart from the original AI code without discarding existing evidence.
- **Detailed feedback:** The system separately explains missed issues, wrong diagnoses, missing or invalid tests, runtime failures, and structural constraints.
- **Adaptive help:** Only after three real failing attempts does the system reveal a reference fix and detailed explanation.

**Evaluation Standard:**

The platform accepts multiple valid implementations that satisfy the requirements. Hidden additional tests prevent overfitting to the example. Environment issues like missing Python or service disruptions are not counted as learner failures.

---

### Code Quality Check (Phase 3) - Code Quality Review Training

**Goal:** Teach learners to evaluate code quality once correctness has been established and to understand engineering trade-offs.

**Workflow:**

1. Enter `Code Quality Check` and select a quality challenge (6 challenges available).
2. **Compare two versions**: Version A and Version B implement the same behavior with different quality characteristics.
3. **Evaluate both versions** across seven dimensions.
4. **Choose the better overall solution** based on context and constraints.
5. **Refactor the weaker version** to improve it.
6. **Explain the trade-offs** in writing.
7. Click **Evaluate Quality Decision** to validate the assessment, hidden tests, code structure, and explanation.

**Seven evaluation dimensions:**

1. **Correctness:** Does the code satisfy all requirements and edge cases?
2. **Readability:** Can other developers quickly understand the intent?
3. **Maintainability:** Can the code be safely changed when requirements evolve?
4. **Simplicity:** Does it avoid unnecessary complexity, not just fewer lines?
5. **Performance & Resources:** Is runtime and memory usage appropriate for the expected scale?
6. **Security:** Does it avoid leaking secrets or introducing dangerous behaviors?
7. **Testability:** Can the code be tested with controlled input and observable outputs?

**Challenge design:**

The question set deliberately includes cases where longer code is clearer and cases where shorter code is better, preventing learners from equating quality with minimalist style. Coverage includes nested conditionals, collection query performance, sensitive logging, global dependency coupling, and redundant boolean branches.

**Key behavior:**

This module uses the same training workflow as AI Code Review: draft saving, pause/resume, attempt history, and restart are all supported.

---

## Progress Tracking and Reporting

### Dashboard and visualization

- **Practice Pattern Tree:** Shows learning progress in a tree structure from the start node to topics, levels, and individual challenges.
- **Learning Tree:** Displays only the current and upcoming training content so the learner is not overwhelmed by the full question repository.

### Export reports

Use **Export Report** to choose the report scope and output format.

**Report scope:**
- `All Practice Topics`: generate a global learning report.
- A single topic: generate a review report focused on that topic only.

**Output formats:**
- `Print PDF`: open a print-friendly report window; save as PDF from the browser print dialog.
- `Open HTML`: open a readable HTML report in a new tab.

**Report content:**

Learning overview, topic progress, ability map, misconception signals, next-step suggestions, and recent practice evidence.

---

## Additional Features

### Fill-in-the-blank gate

If code contains placeholders like `___1___`, `___2___`, do not remove them manually from the code.

Enter the answer in the **Fill-in-the-blank gate** below the code and above the Run Timeline. The code updates automatically after you fill in the expression.

> Note: The input must be a Python code snippet. If the answer is a string, include quotes, for example:
>
> ```python
> "Ada"
> ```

### Debug Detective evaluation logic

Level 5 does not require exact code matching. Different implementations are acceptable if the result proves that:

- the program runs successfully
- the target variable ends with the correct value
- the solution is not hard-coded to the answer
- the execution trace demonstrates the intended concept (conditional, loop, recursion, etc.)

The system provides detailed guidance when results are incorrect, such as missing built-ins, reference solutions, or specific fix suggestions.

### Function hints

When a challenge requires Python built-in functions, the platform automatically displays hints, including the function name, a short example, and its purpose.

---

## Running the System

### Environment requirements

The platform requires .NET 9 and Python 3. Verify them in PowerShell:

```powershell
dotnet --version
python --version
```

If `python --version` is not available, use:

```powershell
py -3 --version
```

### Launch instructions

In a PowerShell terminal, run:

```powershell
cd "D:\Desktop\test-SSP\SSP_v4\LoopVisualizerSystem"
dotnet run --urls "http://127.0.0.1:5057"
```

Keep the terminal open while the application is running.

Open the app in the Edge address bar (do not type this in the console):

```text
http://127.0.0.1:5057/?v=latest
```

If port `5057` is occupied, use a different port:

```powershell
dotnet run --urls "http://127.0.0.1:5058"
```

Then open:

```text
http://127.0.0.1:5058/?v=latest
```

Stop the application by pressing `Ctrl+C` in the terminal.

### Common issue

Do not open `wwwroot/index.html` directly or use `file://.../index.html`. That only loads a static page and prevents `Compile & Run` from connecting to the backend, causing `Failed to fetch` or similar errors.

Start the app with `dotnet run` first, then open the app URL in Edge.
