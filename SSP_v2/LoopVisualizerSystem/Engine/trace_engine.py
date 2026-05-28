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
        # 如果已经触发了崩溃熔断，停止记录后续任何步骤
        if self.has_crashed:
            return None
            
        if event == 'line':
            # 过滤系统内置对象，仅捕获学生定义的局部变量快照
            local_vars = {k: str(v) for k, v in frame.f_locals.items() if not k.startswith('__')}
            current_stdout = self.stdout_buffer.getvalue()
            
            self.steps.append({
                "line": frame.f_lineno,
                "variables": local_vars,
                "stdout": current_stdout,
                "error": "" # 默认为空，代表此行目前安全执行
            })
        return self.trace_lines

    def execute(self, code_string):
        old_stdout = sys.stdout
        sys.stdout = self.stdout_buffer
        
        # 激活全局运行时行号追踪器
        sys.settrace(self.trace_lines)
        
        try:
            global_space = {}
            # 执行学生输入的任何未知代码
            exec(code_string, global_space, global_space)
        except Exception as e:
            # ⭐ 核心熔断点：捕获由于非法语法或类型错误引发的真实运行时崩溃
            self.has_crashed = True
            sys.settrace(None) # 立即熔断追踪器
            
            # 获取精确发生错误的行号
            exc_type, exc_value, exc_tb = sys.exc_info()
            tb_details = traceback.extract_tb(exc_tb)
            # 过滤出 exec 内部真实的错误行
            error_line = tb_details[-1].lineno if tb_details else 0
            
            # 向时序矩阵追加一帧致命错误快照，用来衔接前端红字喷射逻辑
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
        # 将标准 JSON 时序矩阵安全的吐给 C# 后端，没有任何杂质
        print(json.dumps(trace_result))