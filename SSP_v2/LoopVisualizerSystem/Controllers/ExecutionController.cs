using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text.Json;
using System.IO;

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
                using (Process process = Process.Start(start))
                {
                    using (StreamReader reader = process.StandardOutput)
                    {
                        jsonResult = reader.ReadToEnd();
                    }
                }

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                // ⭐ 调整解析目标为全量载荷模型
                var payload = JsonSerializer.Deserialize<PythonResponsePayload>(jsonResult, options);
                
                if (payload != null && payload.Steps != null)
                {
                    payload.Steps = GenerateExplanations(payload.Steps);
                }
                
                return Ok(payload);
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

        private List<TelemetryStep> GenerateExplanations(List<TelemetryStep> steps)
        {
            if (steps == null || steps.Count == 0) return new List<TelemetryStep>();

            for (int i = 0; i < steps.Count; i++)
            {
                steps[i].StepNumber = i + 1;
                
                if (!string.IsNullOrEmpty(steps[i].Error))
                {
                    steps[i].Explanation = $"<span style='color: #f85149; font-weight: bold;'>[CRASH ALERT at Line {steps[i].Line}]</span> " +
                                           $"The execution engine safely intercepted a fatal runtime exception: <code>{steps[i].Error}</code>. " +
                                           $"A loop requires an <span>Iterable object</span> to traverse.";
                    continue;
                }

                if (i == 0)
                {
                    steps[i].Explanation = "Virtual container initialized. Interpreter loaded the baseline instructions into memory stack.";
                    continue;
                }

                var prevVars = steps[i - 1].Variables;
                var currVars = steps[i].Variables;

                List<string> changes = new List<string>();
                foreach (var kvp in currVars)
                {
                    if (!prevVars.ContainsKey(kvp.Key))
                    {
                        changes.Add($"Variable `{kvp.Key}` was initialized and allocated to <span>\"{kvp.Value}\"</span>");
                    }
                    else if (prevVars[kvp.Key] != kvp.Value)
                    {
                        changes.Add($"Variable `{kvp.Key}` mutated from \"{prevVars[kvp.Key]}\" to <span>\"{kvp.Value}\"</span>");
                    }
                }

                if (changes.Count > 0)
                {
                    steps[i].Explanation = $"[Line {steps[i].Line}] Control flow executed. " + string.Join(", ", changes) + ".";
                }
                else
                {
                    steps[i].Explanation = $"[Line {steps[i].Line}] Pointer advanced forward. Internal variable state memory matrix remained stable.";
                }
            }
            return steps;
        }
    }

    public class CodeRequest { public string Code { get; set; } }
    
    // ⭐ 新增：统一的数据交互载荷类
    public class PythonResponsePayload
    {
        public List<TelemetryStep>? Steps { get; set; }
        public object? AstTree { get; set; }
    }
    
    public class TelemetryStep
    {
        public int StepNumber { get; set; }
        public int Line { get; set; }
        public Dictionary<string, string> Variables { get; set; } = new Dictionary<string, string>();
        public string Stdout { get; set; } = "";
        public string Explanation { get; set; } = "";
        public string Error { get; set; } = "";
    }
}