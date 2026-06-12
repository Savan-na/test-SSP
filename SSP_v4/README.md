# SSP v3: Python Trace Practice Board

SSP v3 is a local learning tool for beginner Python programming. It helps students inspect how code runs step by step: which line executes, how variables change, why an error happens, and which programming idea the task is practicing.

The execution result comes from a local Python tracing engine, not from AI guessing. The ASP.NET Core backend runs the trace engine, and the frontend turns the trace into code highlighting, variable cards, a timeline slider, step explanations, task goals, and final-value questions.

## Run The App

Stop any old backend process first, then start the backend from the main project directory:

```powershell
cd D:\Desktop\test-SSP\SSP_v3\LoopVisualizerSystem
dotnet run --urls http://127.0.0.1:5057
```

Open this URL in the browser:

```text
http://127.0.0.1:5057/?v=latest
```

If the browser still shows an old interface:

1. Stop the old `dotnet run` terminal with `Ctrl+C`, then run the command above again.
2. Force refresh the browser with `Ctrl+F5`, or open the URL in an incognito/private window.
3. If port `5057` is already occupied, inspect the process:

   ```powershell
   Get-NetTCPConnection -LocalPort 5057 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,State,OwningProcess
   ```

   After confirming it is an old `dotnet` or `LoopVisualizerSystem` process, stop that PID:

   ```powershell
   Stop-Process -Id <PID> -Force
   ```

## Requirements

- .NET SDK 9
- Python available as `python` from PowerShell

Check Python with:

```powershell
python --version
```

If `python` is not available, the page can still open, but `Compile & Run` cannot generate a trace.

## Current Learning Flow

1. Choose a topic.
2. Choose a practice task.
3. Read the topic knowledge point and programming algorithm summary.
4. Read the student learning goal in the Practice Task panel.
5. Edit the Python code.
6. Click `Compile & Run`.
7. Use the timeline slider to inspect executed steps.
8. Read variable values and the step explanation at the bottom.
9. Answer the final-value questions in the Practice Task panel.

Final-value questions allow three attempts. On the third attempt, the correct answer is shown whether the student's answer is correct or not.

## Topics And Tasks

Each topic now has at least five practice tasks:

- Variable Assignment
- If / Else
- For Loop
- While Loop
- List Traversal
- Accumulator Pattern
- Nested Loop
- Function Call
- Recursion Intro
- Simple
- Medium
- Complex

The Simple, Medium, and Complex topic options provide mixed-concept practice:

- Simple tasks combine two concepts.
- Medium tasks combine about four concepts.
- Complex tasks include algorithmic code, fill-in-the-blank code, or code-writing prompts.

For fill-in-the-blank tasks, `Compile & Run` stays disabled until every blank token such as `___1___` is replaced in the editor.

## Project Structure

```text
SSP_v3/
  README.md
  LoopVisualizerSystem/
    LoopVisualizerSystem.csproj
    Program.cs
    Controllers/
      ExecutionController.cs
    Engine/
      trace_engine.py
    wwwroot/
      index.html
      app.js
```

## Backend Overview

`Program.cs` configures the ASP.NET Core app:

- Registers controllers
- Serves static frontend files from `wwwroot`
- Sends no-cache headers for static files so updated UI assets are loaded reliably
- Maps backend API routes

`Controllers/ExecutionController.cs` handles `POST /api/execution/run`:

- Receives Python code from the frontend
- Writes the code to a temporary `.py` file
- Runs `Engine/trace_engine.py`
- Reads JSON trace output
- Adds teaching metadata such as concepts, variable changes, friendly errors, and explanations

`Engine/trace_engine.py` is the Python tracing engine:

- Uses `compile()` to catch syntax and indentation errors
- Uses `sys.settrace()` to capture line-by-line execution
- Records line number, scope, variables, stdout, and runtime errors
- Stops possible infinite loops with a maximum step count

## Frontend Overview

`wwwroot/index.html` defines the interface:

- Topic and task selection
- Knowledge point and algorithm summary
- Code editor with line numbers
- Practice Task panel with learning goal, fill-in-the-blank gate, and final-value questions
- Run timeline
- Variable display
- Step explanation display
- Guided walkthrough overlay

`wwwroot/app.js` handles the interaction:

- Loads topics and practice tasks
- Calls `/api/execution/run`
- Renders trace frames
- Highlights the active code line
- Colors tracked variables
- Shows variable cards and step explanations
- Enforces fill-in-the-blank completion before compiling
- Tracks final-value question attempts
- Reveals correct final-value answers after the third attempt

## Testing Suggestions

Use the default Accumulator Pattern task:

```python
total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum = number
```

Expected behavior:

- The app opens through `http://127.0.0.1:5057/?v=latest`.
- `Compile & Run` calls the backend.
- The active code line is highlighted.
- Variable cards update as the timeline moves.
- The final-value question appears under Practice Task.
- A wrong answer can be tried twice.
- The third attempt reveals the correct final value.

For a Complex fill-in-the-blank task:

- The run button should show `Fill Blanks First` while blank tokens remain.
- After replacing all blank tokens, `Compile & Run` should become available.
