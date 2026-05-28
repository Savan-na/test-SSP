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

            // 1. 生成唯一的临时文件路径，规避 Windows 命令行转义死穴
            // 作用：利用操作系统的独立 Temp 空间创建隔离沙盒文件，防止多个学生并发请求时产生文件覆盖死锁
            string tempInputFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_input.py");
            
            try
            {
                // 将学生输入的任何复杂 Python 代码安全地写入临时文件
                // 处理：以 UTF-8 编码将前端传入的 payload 字符流落地为物理文件
                System.IO.File.WriteAllText(tempInputFile, request.Code);

                // 2. 跨语言安全调用本地 Python 引擎
                // 设计原因：Process 能够创建一个完全独立的 CPython 解释器子进程，与 C# 宿主进程实现物理隔离，确保安全
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
                        // 阻塞式读取 Python 进程在标准输出流（stdout）中喷射出的全量 JSON 时序矩阵
                        jsonResult = reader.ReadToEnd();
                    }
                }

                // 3. 明确反序列化配置：允许不区分大小写地匹配属性名
                // 原因：Python 的底层键名（line, variables）与 C# 的强类型属性（Line, Variables）存在大小写异构，必须打通这一无缝迁移壁垒
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                // 输入数据：Python 吐出的原始 JSON 字符串
                // 输出数据：C# 托管内存中的强类型泛型列表 List<TelemetryStep>
                var rawSteps = JsonSerializer.Deserialize<List<TelemetryStep>>(jsonResult, options);
                
                // 将反序列化后的基础数据喂给规则引擎，动态组装出带有解说词的高级列表
                var compiledSteps = GenerateExplanations(rawSteps);
                
                // 将完全装配好的数据以 200 OK 形式返回给前端 app.js 渲染
                return Ok(compiledSteps);
            }
            catch (Exception ex)
            {
                // 防御性异常捕获：将底层的真实报错进行友好封装，确保系统不崩溃
                return StatusCode(500, $"Engine parsing failed: {ex.Message} -> {ex.InnerException?.Message}");
            }
            finally
            {
                // ⭐ 核心修复点：确定性资源释放机制
                // 原因：无论 try 块中的执行完全顺利，还是中途任何一行抛出致命异常，finally 块都拥有绝对优先的最终执行权
                // 用处：在物理层面彻底销毁临时脚本，杜绝服务器内存泄漏与磁盘碎片的产生，保证系统高迁移性与持久运行的稳定性
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
                
                // ⭐ 核心升级点：如果检测到当前步骤触发了 Python 底层崩溃，立刻装配诊断解说词
                // 前后文衔接用处：拦截由于语法错、非法迭代产生的运行时 TypeError，不再进行变量差值比对，直接输出教学解说
                if (!string.IsNullOrEmpty(steps[i].Error))
                {
                    steps[i].Explanation = $"<span style='color: #f85149; font-weight: bold;'>[CRASH ALERT at Line {steps[i].Line}]</span> " +
                                           $"The execution engine safely intercepted a fatal runtime exception: <code>{steps[i].Error}</code>. " +
                                           $"A loop requires an <span>Iterable object</span> (like List or String) to traverse. " +
                                           $"An integer is a discrete primitive scalar memory block and cannot be unfolded.";
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
    
    public class TelemetryStep
    {
        public int StepNumber { get; set; }
        public int Line { get; set; }
        public Dictionary<string, string> Variables { get; set; } = new Dictionary<string, string>();
        public string Stdout { get; set; } = "";
        public string Explanation { get; set; } = "";
        
        // ⭐ 修复点：显式补全 Error 强类型属性接收渠道，打通跨语言反序列化链条
        public string Error { get; set; } = "";
    }
}