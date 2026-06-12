using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace LoopVisualizerSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExecutionController : ControllerBase
    {
        [HttpPost("run")]
        public IActionResult ExecuteCode([FromBody] CodeRequest request)
        {
            if (string.IsNullOrEmpty(request.Code))
            {
                return BadRequest("Code workspace cannot be empty.");
            }

            string tempInputFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_input.py");

            try
            {
                System.IO.File.WriteAllText(tempInputFile, request.Code);

                ProcessStartInfo start = new ProcessStartInfo
                {
                    FileName = "python",
                    Arguments = $"Engine/trace_engine.py \"{tempInputFile}\"",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };

                string jsonResult = "";
                using (Process process = Process.Start(start) ?? throw new InvalidOperationException("Python tracing process could not be started."))
                {
                    using StreamReader reader = process.StandardOutput;
                    jsonResult = reader.ReadToEnd();
                }

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var rawSteps = JsonSerializer.Deserialize<List<TelemetryStep>>(jsonResult, options);
                var compiledSteps = GenerateExplanations(rawSteps, request.Code);
                return Ok(compiledSteps);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Engine parsing failed: {ex.Message} -> {ex.InnerException?.Message}");
            }
            finally
            {
                if (System.IO.File.Exists(tempInputFile))
                {
                    System.IO.File.Delete(tempInputFile);
                }
            }
        }

        private List<TelemetryStep> GenerateExplanations(List<TelemetryStep>? steps, string code)
        {
            if (steps == null || steps.Count == 0) return new List<TelemetryStep>();

            string[] sourceLines = code.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
            var lastVariablesByScope = new Dictionary<string, Dictionary<string, string>>();

            for (int i = 0; i < steps.Count; i++)
            {
                var beforeVars = steps[i].Variables ?? new Dictionary<string, string>();
                string currentScope = ScopeKey(steps[i].ScopeName);
                string afterScope = i + 1 < steps.Count ? ScopeKey(steps[i + 1].ScopeName) : currentScope;
                var afterVars = i + 1 < steps.Count ? steps[i + 1].Variables ?? new Dictionary<string, string>() : beforeVars;
                var compareBeforeVars = currentScope == afterScope
                    ? beforeVars
                    : lastVariablesByScope.GetValueOrDefault(afterScope, new Dictionary<string, string>());

                steps[i].StepNumber = i + 1;
                steps[i].SourceLine = GetSourceLine(sourceLines, steps[i].Line);
                steps[i].Concepts = DetectConcepts(sourceLines, steps[i].Line);
                steps[i].PreviousVariables = i > 0
                    ? new Dictionary<string, string>(steps[i - 1].Variables)
                    : new Dictionary<string, string>();
                steps[i].BeforeVariables = new Dictionary<string, string>(compareBeforeVars);
                steps[i].AfterVariables = new Dictionary<string, string>(afterVars);
                steps[i].Changes = BuildVariableChanges(compareBeforeVars, afterVars);

                if (!string.IsNullOrEmpty(steps[i].Error))
                {
                    ApplyFriendlyError(steps[i]);
                    lastVariablesByScope[currentScope] = new Dictionary<string, string>(beforeVars);
                    continue;
                }

                steps[i].Explanation = BuildStepExplanation(steps[i]);
                lastVariablesByScope[currentScope] = new Dictionary<string, string>(beforeVars);
            }

            return steps;
        }

        private static string GetSourceLine(string[] sourceLines, int lineNumber)
        {
            if (lineNumber <= 0 || lineNumber > sourceLines.Length) return "";
            return sourceLines[lineNumber - 1];
        }

        private static string ScopeKey(string? scopeName)
        {
            return string.IsNullOrWhiteSpace(scopeName) ? "<module>" : scopeName;
        }

        private static List<string> DetectConcepts(string[] sourceLines, int lineNumber)
        {
            var concepts = new List<string>();
            string line = GetSourceLine(sourceLines, lineNumber);
            string trimmed = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmed)) return concepts;

            if (IsAssignment(trimmed)) concepts.Add("Variable assignment");
            if (trimmed.Contains("[") && trimmed.Contains("]") || trimmed.Contains("list(") || trimmed.Contains("range(")) concepts.Add("List / sequence");
            if (StartsWithKeyword(trimmed, "for") || StartsWithKeyword(trimmed, "while")) concepts.Add("Loop");
            if (StartsWithKeyword(trimmed, "for") && trimmed.Contains(" in ")) concepts.Add("List traversal");
            if (StartsWithKeyword(trimmed, "if") || StartsWithKeyword(trimmed, "elif") || trimmed == "else:") concepts.Add("Condition");
            if (trimmed.Contains("+=") || Regex.IsMatch(trimmed, @"\b(\w+)\s*=\s*\1\s*[+\-*/]")) concepts.Add("Accumulator");
            if (StartsWithKeyword(trimmed, "def")) concepts.Add("Function definition");
            if (LooksLikeFunctionCall(trimmed)) concepts.Add("Function call");
            if (line.Length > line.TrimStart().Length || StartsWithKeyword(trimmed, "def")) concepts.Add("Scope");
            if (IsNestedLoop(sourceLines, lineNumber)) concepts.Add("Nested loop");
            if (IsRecursiveLine(sourceLines, lineNumber)) concepts.Add("Recursion");

            return concepts.Distinct().ToList();
        }

        private static bool StartsWithKeyword(string trimmed, string keyword)
        {
            return trimmed == keyword || trimmed.StartsWith(keyword + " ") || trimmed.StartsWith(keyword + ":");
        }

        private static bool IsAssignment(string trimmed)
        {
            if (trimmed.StartsWith("if ") || trimmed.StartsWith("elif ") || trimmed.StartsWith("while ")) return false;
            if (trimmed.Contains("==") || trimmed.Contains("!=") || trimmed.Contains("<=") || trimmed.Contains(">=")) return false;
            return Regex.IsMatch(trimmed, @"(^|[^=!<>])=[^=]") || trimmed.Contains("+=") || trimmed.Contains("-=") || trimmed.Contains("*=") || trimmed.Contains("/=");
        }

        private static bool LooksLikeFunctionCall(string trimmed)
        {
            if (StartsWithKeyword(trimmed, "if") || StartsWithKeyword(trimmed, "for") || StartsWithKeyword(trimmed, "while") || StartsWithKeyword(trimmed, "def") || StartsWithKeyword(trimmed, "class"))
            {
                return false;
            }

            return Regex.IsMatch(trimmed, @"\b[A-Za-z_]\w*\s*\(");
        }

        private static bool IsNestedLoop(string[] sourceLines, int lineNumber)
        {
            string currentLine = GetSourceLine(sourceLines, lineNumber);
            string currentTrimmed = currentLine.Trim();
            if (!StartsWithKeyword(currentTrimmed, "for") && !StartsWithKeyword(currentTrimmed, "while")) return false;

            int currentIndent = currentLine.Length - currentLine.TrimStart().Length;
            for (int i = lineNumber - 2; i >= 0; i--)
            {
                string previousLine = sourceLines[i];
                string previousTrimmed = previousLine.Trim();
                int previousIndent = previousLine.Length - previousLine.TrimStart().Length;

                if (previousIndent < currentIndent && (StartsWithKeyword(previousTrimmed, "for") || StartsWithKeyword(previousTrimmed, "while")))
                {
                    return true;
                }
            }

            return false;
        }

        private static bool IsRecursiveLine(string[] sourceLines, int lineNumber)
        {
            string currentLine = GetSourceLine(sourceLines, lineNumber);
            int currentIndent = currentLine.Length - currentLine.TrimStart().Length;

            for (int i = lineNumber - 2; i >= 0; i--)
            {
                string previousLine = sourceLines[i];
                string previousTrimmed = previousLine.Trim();
                int previousIndent = previousLine.Length - previousLine.TrimStart().Length;

                if (previousIndent < currentIndent && StartsWithKeyword(previousTrimmed, "def"))
                {
                    var match = Regex.Match(previousTrimmed, @"def\s+([A-Za-z_]\w*)\s*\(");
                    return match.Success && currentLine.Contains(match.Groups[1].Value + "(");
                }
            }

            return false;
        }

        private static string BuildStepExplanation(TelemetryStep step)
        {
            var parts = new List<string>();
            string sourceLine = WebUtility.HtmlEncode(step.SourceLine.Trim());

            if (!string.IsNullOrEmpty(sourceLine))
            {
                parts.Add($"[Line {step.Line}] Python is about to run <code>{sourceLine}</code>.");
            }
            else
            {
                parts.Add($"[Line {step.Line}] Python is moving through this part of the program.");
            }

            if (step.Concepts.Count > 0)
            {
                parts.Add(ConceptSentence(step.Concepts));
            }

            if (ScopeKey(step.ScopeName) != "<module>")
            {
                parts.Add($"Current scope: <code>{WebUtility.HtmlEncode(step.ScopeName)}</code>.");
            }

            if (step.Changes.Count > 0)
            {
                var readableChanges = step.Changes.Select(DescribeChange);
                parts.Add("After this line runs, " + string.Join(", ", readableChanges) + ".");
            }
            else
            {
                parts.Add("After this line runs, no tracked variable value changes.");
            }

            return string.Join(" ", parts);
        }

        private static string ConceptSentence(List<string> concepts)
        {
            if (concepts.Contains("Condition"))
            {
                return "This is a condition: the program is asking a true/false question before choosing a path.";
            }

            if (concepts.Contains("Nested loop"))
            {
                return "This is a nested loop: one loop is running inside another loop.";
            }

            if (concepts.Contains("Recursion"))
            {
                return "This is recursion: a function is solving a smaller version of its own problem.";
            }

            if (concepts.Contains("List traversal"))
            {
                return "This is list traversal: Python is visiting each item in a sequence one by one.";
            }

            if (concepts.Contains("Loop"))
            {
                return "This is a loop step: Python is deciding whether to start or continue another repetition.";
            }

            if (concepts.Contains("Function definition"))
            {
                return "This defines a function, which stores reusable instructions for later.";
            }

            if (concepts.Contains("Function call"))
            {
                return "This is a function call: Python runs a named action and then comes back here.";
            }

            if (concepts.Contains("Accumulator"))
            {
                return "This is an accumulator pattern: a variable keeps a running total or combined result.";
            }

            if (concepts.Contains("Variable assignment"))
            {
                return "This is assignment: Python stores a value under a variable name.";
            }

            return "Concept tags below show what programming idea this line is practicing.";
        }

        private static List<VariableChange> BuildVariableChanges(
            Dictionary<string, string> beforeVars,
            Dictionary<string, string> afterVars)
        {
            var changes = new List<VariableChange>();

            foreach (var kvp in afterVars)
            {
                if (!beforeVars.ContainsKey(kvp.Key))
                {
                    changes.Add(new VariableChange
                    {
                        Name = kvp.Key,
                        Before = "",
                        After = kvp.Value,
                        ChangeType = "initialized"
                    });
                }
                else if (beforeVars[kvp.Key] != kvp.Value)
                {
                    changes.Add(new VariableChange
                    {
                        Name = kvp.Key,
                        Before = beforeVars[kvp.Key],
                        After = kvp.Value,
                        ChangeType = "updated"
                    });
                }
            }

            foreach (var kvp in beforeVars)
            {
                if (!afterVars.ContainsKey(kvp.Key))
                {
                    changes.Add(new VariableChange
                    {
                        Name = kvp.Key,
                        Before = kvp.Value,
                        After = "",
                        ChangeType = "removed"
                    });
                }
            }

            return changes;
        }

        private static string DescribeChange(VariableChange change)
        {
            string name = WebUtility.HtmlEncode(change.Name);
            string before = WebUtility.HtmlEncode(change.Before);
            string after = WebUtility.HtmlEncode(change.After);

            return change.ChangeType switch
            {
                "initialized" => $"variable `{name}` is created with <span>\"{after}\"</span>",
                "updated" => $"variable `{name}` changes from \"{before}\" to <span>\"{after}\"</span>",
                "removed" => $"variable `{name}` leaves the current scope",
                _ => $"variable `{name}` changes"
            };
        }

        private static void ApplyFriendlyError(TelemetryStep step)
        {
            string raw = step.Error;
            string type = string.IsNullOrWhiteSpace(step.ErrorType) ? raw.Split(':')[0] : step.ErrorType;

            (string category, string title, string message) = ClassifyError(type, raw);
            step.ErrorCategory = category;
            step.FriendlyErrorTitle = title;
            step.FriendlyErrorMessage = message;
            step.Explanation = $"<span style='color: #f85149; font-weight: bold;'>[{WebUtility.HtmlEncode(title)} at Line {step.Line}]</span> " +
                               WebUtility.HtmlEncode(message);
        }

        private static (string Category, string Title, string Message) ClassifyError(string errorType, string rawError)
        {
            string raw = rawError.ToLowerInvariant();

            if (errorType == "StepLimitError")
            {
                return (
                    "infinite-loop-risk",
                    "Possible Infinite Loop",
                    "The program ran for too many steps without finishing. Check whether a while loop condition ever becomes false."
                );
            }

            if (errorType == "IndentationError" || raw.Contains("indent"))
            {
                return (
                    "indentation",
                    "Indentation Problem",
                    "Python uses spaces to decide which lines belong together. Check the spaces before this line and the line above it."
                );
            }

            if (errorType == "SyntaxError")
            {
                return (
                    "syntax",
                    "Syntax Error",
                    "Python could not understand the shape of this line. Look for a missing colon, bracket, quote, or an incomplete statement."
                );
            }

            if (errorType == "NameError")
            {
                return (
                    "undefined-variable",
                    "Undefined Variable",
                    "This name has not been created yet. Check spelling, or assign a value to the variable before using it."
                );
            }

            if (errorType == "TypeError" && (raw.Contains("not iterable") || raw.Contains("object is not iterable")))
            {
                return (
                    "not-iterable",
                    "Loop Object Is Not Iterable",
                    "A for loop needs something it can walk through, such as a list, string, or range. A single number cannot be used directly."
                );
            }

            if (errorType == "TypeError")
            {
                return (
                    "type-error",
                    "Type Error",
                    "The operation does not match the kind of value being used. Check whether you are mixing numbers, strings, lists, or other types."
                );
            }

            return (
                "runtime",
                "Runtime Error",
                "The program started running, but something went wrong on this line. Use the variable state to inspect what value caused the issue."
            );
        }
    }

    public class CodeRequest { public string? Code { get; set; } }

    public class TelemetryStep
    {
        public int StepNumber { get; set; }
        public int Line { get; set; }
        public string ScopeName { get; set; } = "<module>";
        public string EventType { get; set; } = "line";
        public string SourceLine { get; set; } = "";
        public Dictionary<string, string> Variables { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, string> PreviousVariables { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, string> BeforeVariables { get; set; } = new Dictionary<string, string>();
        public Dictionary<string, string> AfterVariables { get; set; } = new Dictionary<string, string>();
        public List<VariableChange> Changes { get; set; } = new List<VariableChange>();
        public List<string> Concepts { get; set; } = new List<string>();
        public string Stdout { get; set; } = "";
        public string Explanation { get; set; } = "";
        public string Error { get; set; } = "";
        public string ErrorType { get; set; } = "";
        public string ErrorCategory { get; set; } = "";
        public string FriendlyErrorTitle { get; set; } = "";
        public string FriendlyErrorMessage { get; set; } = "";
    }

    public class VariableChange
    {
        public string Name { get; set; } = "";
        public string Before { get; set; } = "";
        public string After { get; set; } = "";
        public string ChangeType { get; set; } = "";
    }
}
