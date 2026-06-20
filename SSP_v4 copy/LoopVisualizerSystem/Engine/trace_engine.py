import io
import json
import sys
import traceback


class TraceStepLimit(Exception):
    pass


class TraceEngine:
    def __init__(self, filename, max_steps=1200):
        self.filename = filename
        self.max_steps = max_steps
        self.steps = []
        self.stdout_buffer = io.StringIO()
        self.has_crashed = False
        self.last_line = 0
        self.last_variables = {}

    def capture_variables(self, frame):
        return {
            key: str(value)
            for key, value in frame.f_locals.items()
            if not key.startswith("__") and not callable(value)
        }

    def append_step(self, line, variables, error="", error_type="", scope_name="<module>", event_type="line"):
        self.steps.append({
            "line": line,
            "scopeName": scope_name,
            "eventType": event_type,
            "variables": variables,
            "stdout": self.stdout_buffer.getvalue(),
            "error": error,
            "errorType": error_type
        })

    def trace_lines(self, frame, event, arg):
        if self.has_crashed:
            return None

        if frame.f_code.co_filename != self.filename:
            return self.trace_lines

        if event == "line":
            variables = self.capture_variables(frame)
            self.last_line = frame.f_lineno
            self.last_variables = variables
            self.append_step(frame.f_lineno, variables, scope_name=frame.f_code.co_name)

            if len(self.steps) >= self.max_steps:
                raise TraceStepLimit(
                    f"Execution stopped after {self.max_steps} traced steps. "
                    "This usually means a loop may never finish."
                )

        if event == "return" and frame.f_code.co_name == "<module>":
            variables = self.capture_variables(frame)
            if variables != self.last_variables:
                self.last_variables = variables
                self.append_step(self.last_line, variables, scope_name=frame.f_code.co_name, event_type="return")

        return self.trace_lines

    def user_error_line(self, exc_tb):
        tb_details = traceback.extract_tb(exc_tb)
        user_frames = [item for item in tb_details if item.filename == self.filename]
        if user_frames:
            return user_frames[-1].lineno
        return self.last_line

    def execute(self, code_string):
        try:
            compiled_code = compile(code_string, self.filename, "exec")
        except SyntaxError as error:
            error_type = type(error).__name__
            self.append_step(
                error.lineno or 0,
                {},
                f"{error_type}: {error.msg}",
                error_type
            )
            return self.steps

        old_stdout = sys.stdout
        sys.stdout = self.stdout_buffer
        sys.settrace(self.trace_lines)

        try:
            global_space = {"__name__": "__main__"}
            exec(compiled_code, global_space, global_space)
        except TraceStepLimit as error:
            self.has_crashed = True
            sys.settrace(None)
            self.append_step(
                self.last_line,
                self.last_variables,
                f"StepLimitError: {str(error)}",
                "StepLimitError"
            )
        except Exception as error:
            self.has_crashed = True
            sys.settrace(None)

            exc_type, _, exc_tb = sys.exc_info()
            error_line = self.user_error_line(exc_tb)
            error_type = exc_type.__name__ if exc_type else "RuntimeError"

            self.append_step(
                error_line,
                self.last_variables,
                f"{error_type}: {str(error)}",
                error_type
            )
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout

        return self.steps


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file_path = sys.argv[1]

        with open(target_file_path, "r", encoding="utf-8") as f:
            student_code = f.read()

        engine = TraceEngine(target_file_path)
        trace_result = engine.execute(student_code)
        print(json.dumps(trace_result, ensure_ascii=False))
