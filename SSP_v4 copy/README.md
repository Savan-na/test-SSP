# SSP v4

SSP v4 is a local education platform for programming practice, AI code review, and code quality training.
This README is the main project documentation. For a deeper technical reference, see `README_technical.md`.

## System Architecture

The solution consists of:

- A .NET 9 web application under `LoopVisualizerSystem` that serves static frontend files and exposes REST API endpoints under `api/`.
- A Python trace engine in `LoopVisualizerSystem/Engine/trace_engine.py` that executes submitted Python code, captures runtime traces, and returns JSON output.
- Frontend assets in `LoopVisualizerSystem/wwwroot` that provide the user interface, send code to the backend, and render execution results.

The backend writes temporary Python files to the OS temp directory and runs them through the local Python interpreter.

## Main Training Modules

### Practice

A structured coding practice module with topic-based challenges. Learners progress through levels 1 to 5, use the Fill-in-the-blank gate, and validate code with `Compile & Run`.

### AI Code Review

A code inspection module where learners read AI-generated solutions, identify real defects, select diagnostic tests, and propose fixes.

### Code Quality Check

A quality review module where learners compare two implementations, evaluate them across several dimensions, and justify the better design.

## Dependencies

- .NET 9 SDK
- Python 3
- `python` or `py -3` must be available in the system PATH

## Runtime Constraints

- This project is intended for local sandbox use only.
- It is not designed for production deployment.
- The backend executes submitted Python code directly, so the environment should be controlled.

## Getting Started

Open PowerShell and verify the runtime environment:

```powershell
dotnet --version
python --version
```

If `python --version` is not available, verify Python with:

```powershell
py -3 --version
```

Then run the application:

```powershell
cd "D:\Desktop\test-SSP\SSP_v4\LoopVisualizerSystem"
dotnet run --urls "http://127.0.0.1:5057"
```

Keep the terminal open while the application runs.

Open the app in Edge using the browser address bar (not the console):

```text
http://127.0.0.1:5057/?v=latest
```

If port `5057` is unavailable, use a different port:

```powershell
dotnet run --urls "http://127.0.0.1:5058"
```

Then open:

```text
http://127.0.0.1:5058/?v=latest
```

Stop the application by pressing `Ctrl+C` in the terminal.

## Notes

Do not open `wwwroot/index.html` directly or use `file://.../index.html`. That only loads a static page and prevents the frontend from connecting to the backend.
