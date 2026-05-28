import sys
import json
import io
import traceback
import ast

class ASTParser(ast.NodeVisitor):
    def __init__(self):
        self.bright_colors = {
            "For": "#ff7b72",       # Loop segment - Coral Red
            "Name": "#58a6ff",      # Variable references - Bright Blue
            "List": "#3fb950",      # Iterable data containers - Neon Green
            "Constant": "#d29922",  # Static primitive values - Amber Yellow
            "Assign": "#e2a6ff"     # Memory allocations - Radiant Purple
        }

    def convert(self, node):
        node_type = type(node).__name__
        name = node_type
        color = "#c9d1d9"
        line_num = getattr(node, 'lineno', 0)
        
        # Explicit renaming for intuitive student comprehension
        if isinstance(node, ast.For):
            name = "Loop Structure (for)"
            color = self.bright_colors["For"]
        elif isinstance(node, ast.Name):
            name = f"Variable: {node.id}"
            color = self.bright_colors["Name"]
        elif isinstance(node, ast.Constant):
            name = f"Value: {node.value}"
            color = self.bright_colors["Constant"]
        elif isinstance(node, ast.List):
            name = "Iterable Matrix [List]"
            color = self.bright_colors["List"]
        elif isinstance(node, ast.Assign):
            # Optimizing terminology from 'Assignment' to 'Variable Allocation'
            name = "Variable Allocation (=)"
            color = self.bright_colors["Assign"]

        result = {
            "name": name,
            "color": color,
            "line": line_num,
            "children": []
        }

        for child in ast.iter_child_nodes(node):
            # Pure architectural filter to remove zero-increment structural redundancy
            if type(child).__name__ in ["Load", "Store", "Module", "Expr"]:
                continue
            
            # If the child node is a module wrapper, unwrap it directly to keep tree clean
            child_structure = self.convert(child)
            result["children"].append(child_structure)
            
        return result

class TraceEngine:
    def __init__(self):
        self.steps = []
        self.stdout_buffer = io.StringIO()
        self.has_crashed = False

    def trace_lines(self, frame, event, arg):
        if self.has_crashed:
            return None
        if event == 'line':
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
        
        try:
            root_node = ast.parse(student_code)
            ast_parser = ASTParser()
            
            # Clean up the root node hierarchy if it's wrapped in a Module node
            raw_tree = ast_parser.convert(root_node)
            if raw_tree["name"] == "Module" and len(raw_tree["children"]) > 0:
                ast_tree = raw_tree["children"][0]
            else:
                ast_tree = raw_tree
        except:
            ast_tree = {"name": "Syntax Processing Error", "color": "#f85149", "line": 0, "children": []}

        output_payload = {
            "steps": trace_result,
            "astTree": ast_tree
        }
        print(json.dumps(output_payload))