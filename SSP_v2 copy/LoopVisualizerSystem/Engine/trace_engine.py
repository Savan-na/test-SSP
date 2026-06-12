import sys
import json
import io
import traceback

class TraceEngine:
    def __init__(self):
        self.steps = []
        self.stdout_buffer = io.StringIO()
        self.has_crashed = False

    def trace_lines(self, frame, event, arg):
        if self.has_crashed:
            return None
        if event == 'line':
            # 过滤内置对象，仅捕获用户定义的局部变量快照
            local_vars = {k: str(v) for k, v in frame.f_locals.items() if not k.startswith('__')}
            current_stdout = self.stdout_buffer.getvalue()
            
            self.steps.append({
                "line": frame.f_lineno,
                "variables": local_vars,
                "stdout": current_stdout,
                "error": ""
            })
        return self.trace_lines

    def execute(self, code_string):
        old_stdout = sys.stdout
        sys.stdout = self.stdout_buffer
        sys.settrace(self.trace_lines)
        
        try:
            global_space = {}
            exec(code_string, global_space, global_space)
        except Exception as e:
            # 核心熔断点：安全捕获残缺代码或类型错误，保留历史步骤
            self.has_crashed = True
            sys.settrace(None)
            
            exc_type, exc_value, exc_tb = sys.exc_info()
            tb_details = traceback.extract_tb(exc_tb)
            error_line = tb_details[-1].lineno if tb_details else 0
            
            self.steps.append({
                "line": error_line,
                "variables": self.steps[-1]["variables"] if self.steps else {},
                "stdout": self.stdout_buffer.getvalue(),
                "error": f"{exc_type.__name__}: {str(e)}"
            })
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout

        return self.steps

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_file_path = sys.argv[1]
        
        with open(target_file_path, "r", encoding="utf-8") as f:
            student_code = f.read()
            
        engine = TraceEngine()
        trace_result = engine.execute(student_code)
        print(json.dumps(trace_result))