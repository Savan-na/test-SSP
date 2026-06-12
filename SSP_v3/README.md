# SSP v3: Programming Flow Visualizer

SSP v3 是一个面向编程初学者的“程序执行显微镜”。它不把重点放在替学生写代码，而是帮助学生看清楚代码每一步到底发生了什么：当前执行哪一行、变量如何变化、循环如何推进、错误发生在哪里，以及自己正在练习哪个编程概念。

底层执行结果来自本地 Python trace，不依赖 AI 猜测执行结果；前端教学层负责把真实执行轨迹转化成行高亮、变量变化、概念标签、预测练习、课程目标检查和教师报告。

## 学生视角操作流程

1. 启动系统后，浏览器打开页面。第一次使用会出现指导窗口，它会贴在当前要操作的按钮或区域旁边。

2. 在 `Topic` 中选择一个知识主题，例如 `Accumulator Pattern`。

3. 在 `Practice Task` 中选择这个主题下的一道练习题。选择后系统会自动把 starter code 放到左侧编辑器里。

4. 阅读任务目标，例如：

   ```text
   Make the final total_sum equal 60.
   ```

5. 阅读左侧代码，先尝试在脑中判断程序会如何执行。

6. 点击 `Compile & Trace`。系统会调用后端执行 Python，并生成真实的执行时间轴。

7. 查看左侧代码区：

   - 左侧会显示行号。
   - 当前执行行会被高亮。
   - 变量名会按颜色标记。

8. 查看右侧 `REAL-TIME TELEMETRY CONSOLE`：

   - 当前 Step / Line
   - 当前代码行
   - 当前作用域
   - 当前概念标签
   - 本步变量变化
   - 上一步 / 当前步 / 下一步的 timeline context
   - 如果代码有 `print()`，也会显示 stdout
   - 当前步骤的解释说明

9. 拖动 `Time-Travel Debugger` 滑块，逐步观察程序执行过程。

10. 查看 `Concept` 标签，理解当前步骤涉及的概念，例如：

    - Variable assignment
    - List traversal
    - Loop
    - Condition
    - Accumulator
    - Function call
    - Scope
    - Recursion

11. 使用 `Prediction Practice`：

    - 在输入框中猜测当前步骤之后某个变量的新值。
    - 点击 `Check Guess` 查看是否正确。
    - 前 2 次错误只提示正误，不给出答案。
    - 第 3 次仍然错误时，系统才显示正确答案。
    - 任何一次答对时，系统都会明确说明这是正确答案。
    - 如果卡住，可以主动点击 `Reveal` 显示答案。

12. 点击 `Check Task Goal`。系统会根据真实执行轨迹判断是否完成当前任务目标，而不是简单比对代码文本。

13. 如果目标没有完成，继续修改左侧代码，再次点击 `Compile & Trace`。

14. 完成后，可以继续选择同一主题下的其他任务，或者切换到新的 Topic。

## 项目结构

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

## 运行方式

进入主项目目录：

```powershell
cd D:\Desktop\test-SSP\SSP_v3\LoopVisualizerSystem
```

启动 ASP.NET Core 服务：

```powershell
dotnet run --urls http://localhost:5057
```

浏览器打开：

```text
http://localhost:5057
```

## 环境要求

需要安装：

- .NET SDK 9
- Python，并且 PowerShell 中可以直接运行 `python`

检查 Python：

```powershell
python --version
```

如果 `python` 命令不可用，页面可以打开，但点击 `Compile & Trace` 时后端无法调用 Python 执行引擎。

## 各部分作用

### `Program.cs`

ASP.NET Core 应用入口。

主要职责：

- 注册 Controller
- 启用静态文件服务
- 让浏览器访问 `wwwroot/index.html`
- 映射后端 API

核心流程：

```csharp
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.Run();
```

### `Controllers/ExecutionController.cs`

后端主控制器，负责接收前端提交的 Python 代码，并返回教学化后的执行轨迹。

主要职责：

- 接收 `POST /api/execution/run`
- 将学生代码写入临时 `.py` 文件
- 调用 `Engine/trace_engine.py`
- 反序列化 Python trace 返回的 JSON
- 生成每一步的教学数据

返回给前端的数据包括：

- `line`: 当前执行行号
- `sourceLine`: 当前源码行内容
- `scopeName`: 当前作用域
- `variables`: 当前变量快照
- `beforeVariables`: 当前高亮行执行前的变量状态
- `afterVariables`: 当前高亮行执行后的变量状态
- `changes`: 本步变量变化
- `concepts`: 当前涉及的编程概念标签
- `stdout`: 标准输出
- `error`: 原始错误
- `friendlyErrorTitle`: 初学者友好的错误标题
- `friendlyErrorMessage`: 初学者友好的错误解释

### 概念标签识别

`ExecutionController.cs` 会根据源码行自动识别概念：

- `Variable assignment`: 变量赋值
- `List / sequence`: 列表或序列
- `List traversal`: 列表遍历
- `Loop`: `for` / `while` 循环
- `Condition`: `if` / `elif` / `else`
- `Accumulator`: 累加器模式
- `Nested loop`: 嵌套循环
- `Function definition`: 函数定义
- `Function call`: 函数调用
- `Scope`: 作用域
- `Recursion`: 递归

这些标签会显示在前端 `Concept` 区域，帮助学生知道自己当前正在学习什么。

### 错误诊断

后端会把原始 Python 错误转化成初学者更容易理解的解释。

支持的错误类型包括：

- 语法错误
- 缩进错误
- 变量未定义
- 类型错误
- 循环对象不可迭代
- 无限循环风险
- 普通运行时错误

例如：

```python
for item in 5:
    print(item)
```

系统会解释为：`for` 循环需要能被遍历的对象，例如列表、字符串或 `range`，单个数字不能直接遍历。

### `Engine/trace_engine.py`

Python 执行追踪引擎。

主要职责：

- 使用 `compile()` 捕获语法和缩进错误
- 使用 `sys.settrace()` 捕获逐行执行事件
- 记录每一步的行号、作用域、变量快照和 stdout
- 捕获运行时错误
- 设置最大执行步数，发现可能无限循环时停止执行
- 返回 JSON 给 C# 后端

它是系统中“真相来源”的部分。变量值、执行顺序、错误信息都来自真实 Python 运行，而不是模型猜测。

### `wwwroot/index.html`

前端页面结构和样式。

主要区域：

- 左侧代码编辑器
- 左侧行号栏
- 当前行高亮层
- 右侧 telemetry console
- 变量状态矩阵
- 时间轴滑块
- 概念标签区
- 课程练习区
- 预测练习区
- 教师模式工具区
- 首次使用指导卡片

### `wwwroot/app.js`

前端核心交互逻辑。

主要职责：

- 调用后端 `/api/execution/run`
- 渲染执行步骤
- 同步代码行号和高亮
- 渲染变量颜色
- 渲染 telemetry console
- 渲染概念标签
- 处理预测练习
- 管理课程关卡
- 根据 trace 判断课程目标是否完成
- 记录学生关键操作和时间
- 导出学生课堂活动报告
- 切换课堂投屏模式
- 管理首次使用指导模式

## 功能模块说明

### 1. 代码编辑器和行号

左侧编辑器使用双层结构：

- `textarea` 负责真实输入
- `code-viewer` 负责渲染带颜色和高亮的代码
- `gutter-zone` 负责显示行号

这样学生可以正常输入代码，同时系统可以对变量名和当前执行行进行可视化标记。

### 2. Time-Travel Debugger

`Time-Travel Debugger` 是时间轴滑块。

每拖动一步，系统会更新：

- 当前高亮行
- 右侧 telemetry console
- 变量状态矩阵
- 当前概念标签
- 预测练习目标

### 3. REAL-TIME TELEMETRY CONSOLE

这个区域不是普通终端，而是教学遥测窗口。

即使代码没有 `print()`，它也会显示：

- Step
- Line
- 当前代码
- Scope
- Concept
- Change
- Timeline context
- Step explanation

如果代码有 `print()`，stdout 会额外显示在该区域。每一步的自然语言解释和 previous/current/next context 也会跟在 telemetry 内容里，学生不需要再去页面下方找单独的说明卡片。

### 4. Variable State After Current Line

显示当前高亮行执行后的变量状态。

例如：

```text
number = 30
total_sum = 60
```

### 5. Concept 标签

显示当前步骤正在练习的概念。

学生不只是看到“代码运行了”，还能看到“我正在学习循环、条件、累加器、函数调用或作用域”。

### 6. Prediction Practice

预测练习用于训练学生的程序追踪能力。

流程：

1. 选择某一步。
2. 输入你认为变量会变成的值。
3. 点击 `Check Guess`。
4. 系统根据真实 trace 判断是否正确。

规则：

- 默认隐藏当前预测目标的答案。
- 第 1 次和第 2 次猜错时，只提示“错误，请再试一次”，不会给出正确答案。
- 第 3 次仍然猜错时，系统才给出正确答案。
- 只要猜对，系统会明确提示“这是正确答案”。
- `Reveal` 用于学生主动查看答案。

这个功能的目标是让学生主动思考，而不是被动观看动画。原来的 `Variable Change After Highlighted Line` 面板已经移除，因为它会在预测前直接暴露答案；必要的变量变化信息现在合并到 telemetry console，并会在预测答案公开前隐藏目标值。

### 7. Topic / Practice Task

练习模式采用两级结构：

- `Topic`: 知识主题，例如变量赋值、条件判断、循环、累加器、函数调用。
- `Practice Task`: 当前主题下的一道具体练习题或错误观察题。

当前内置 Topic 包括：

- Variable Assignment
- If / Else
- For Loop
- While Loop
- List Traversal
- Accumulator Pattern
- Nested Loop
- Function Call
- Recursion Intro

每个 Practice Task 包含：

- 标题
- 目标描述
- starter code
- trace-based checks

系统判断学生是否完成任务时，会检查真实执行轨迹，例如：

- 程序是否无错误完成
- 最终变量是否达到目标值
- trace 中是否出现对应概念
- stdout 是否包含目标内容
- 是否出现预期错误类型，例如 undefined variable、not iterable 或 infinite-loop-risk

它不会简单比对学生代码文本。

### 8. Teacher Mode

教师模式面向课堂使用。

当前支持：

- `Export Student Activity`: 导出学生课堂活动报告 JSON
- `Presentation Mode`: 切换课堂投屏模式

学生课堂活动报告会包含：

- `operationTimeline`: 学生按键和选择操作的时间线
- `trainedExerciseTable`: 学生训练过的 Topic / Practice Task、运行时间、目标是否通过
- `predictionResultTable`: 每次预测的题目、步骤、变量、猜测值、正确答案、正确或错误、答案是否已展示

### 9. 首次使用指导模式

首次打开页面时，系统会显示一个浮动指导卡片。

特点：

- 不暗化页面
- 不遮住整个界面
- 会移动到当前需要操作的按钮或区域旁边
- 当前目标区域会高亮
- 支持 `Previous`
- 支持 `Next`
- 支持 `Skip`
- 完成或跳过后不再自动出现

浏览器本地存储 key：

```text
ssp_first_run_guide_completed
```

如果想重新显示指导，可以在浏览器控制台执行：

```js
localStorage.removeItem("ssp_first_run_guide_completed")
```

然后刷新页面。

## 教师导出的文件

### `ssp-student-activity-report.json`

点击 `Export Student Activity` 会导出学生课堂活动报告。

报告包含三张表：

- `operationTimeline`: 学生按键和选择操作的时间线，例如选择课程、运行代码、检查目标、检查预测、主动 reveal。
- `trainedExerciseTable`: 学生训练过的课程题目、运行时间、重点概念、执行步数、目标是否通过。
- `predictionResultTable`: 每次预测的课程、步骤、变量、学生猜测、正确答案、正确或错误、尝试次数、答案是否已展示。

## 测试建议

### 测试基础追踪

使用默认累加器代码：

```python
total_sum = 0
numbers = [10, 20, 30]

for number in numbers:
    total_sum += number
```

预期：

- 行号显示正常
- 当前执行行高亮
- `total_sum` 从 `0` 逐步变成 `60`
- 概念标签出现 `Accumulator`
- `Check Task Goal` 通过

### 测试 if/else

加载 `If / Else` 课程。

预期：

- 条件判断行显示 `Condition`
- 修改 `score` 后，`result` 变化不同

### 测试错误诊断

加载 `Loop Error` 示例：

```python
for item in 5:
    print(item)
```

预期：

- 系统显示循环对象不可迭代的友好解释

### 测试无限循环风险

加载 `Infinite Loop Risk` 示例。

预期：

- 执行超过最大步数后停止
- 系统提示可能存在无限循环

## 设计原则

1. 真实执行优先：执行结果来自 Python trace。
2. 教学解释基于 trace：解释、标签和反馈都围绕真实状态生成。
3. 鼓励主动预测：学生先猜，再验证。
4. 不以代码文本作为唯一答案：课程目标通过最终变量、stdout、概念覆盖等 trace 信息判断。
5. 面向课堂扩展：通过教师模式支持学生操作记录导出和课堂投屏。

## 当前限制

- 当前主要支持 Python。
- 后端调用的是 `python` 命令，因此系统环境必须能直接运行 `python`。
- 教师活动报告目前在浏览器端生成 JSON，尚未接入数据库或班级账号系统。
- 练习关卡目前写在 `wwwroot/app.js` 中，后续可以迁移到独立 JSON 或数据库。
- 目前没有接入 AI 解释层；所有解释是规则和 trace 数据生成的。
