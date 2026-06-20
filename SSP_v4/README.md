# SSP v4

## AI Code Review Lab

顶部的 `Review Lab` 是面向 AI 时代的代码理解与审查训练区。它不要求学生从零手写所有代码，而是要求学生完成一条完整的工程判断链：

1. 阅读需求和工程约束；
2. 判断 AI 生成代码中真正存在的问题，排除看似合理的错误说法；
3. 选择能够证明正常情况和边界情况的测试；
4. 修改代码，并用自己的语言解释缺陷、测试和修复理由；
5. 点击 `Evaluate Review & Fix`，由后端真实运行测试并生成能力证据。

第二阶段目前包含 10 个递进挑战，按照 `Starter`、`Developing`、`Applied` 和 `Challenge` 分组。除空输入、负数假设、阈值边界、重复代码重构、语法与返回值契约外，还覆盖错误测试预期、集合破坏顺序、异常捕获过宽、二次方复杂度和尾部数据丢失。

Review Lab 现在提供完整的训练闭环：

1. 学生的代码、诊断选择、测试选择和解释会自动保存为草稿；
2. `Save & Pause` 可以暂时返回 Practice，下次进入时继续原挑战；
3. `Attempt History` 保存正式评测证据，可以重新打开某一次代码和判断进行复盘；
4. `Start New Attempt` 会从原始 AI 代码重新挑战，但不会删除已经取得的能力证据；
5. 每次失败都会分别解释漏选的真实问题、误选说法、缺失测试、无效测试、运行失败和结构约束；
6. 缺少 Python 或服务中断属于环境问题，不记为学生失败，也不会触发答案揭示；
7. 连续 3 次真正的未通过尝试后，才显示一份参考修复和详细解释。

系统接受满足需求的不同正确实现，不要求与参考答案逐字一致。每道题还包含未直接展示的附加测试，用于防止只针对示例写死答案。

完成记录会同步显示在 Dashboard 的 `AI Review Evidence` 中。导出全部 Topic 的报告时，也会附带问题诊断、测试设计、可执行修复、代码结构和书面解释等证据。只导出某一个 Practice Topic 时，报告仍只聚焦该 Topic 的 Level 数据。

## Code Quality Studio（第三阶段）

顶部的 `Quality Studio` 用于训练“代码能运行之后，还应该如何判断质量”。学生不会只看一个标准答案，而是先比较 Version A 与 Version B，再从七个维度分别判断：

1. Correctness：是否满足完整需求和边界情况；
2. Readability：其他工程师能否快速理解意图；
3. Maintainability：需求变化时能否安全修改；
4. Simplicity：是否删除了不必要的机制，而不仅仅是行数更少；
5. Performance & resources：时间和内存是否适合预期规模；
6. Security：是否泄露秘密或引入危险行为；
7. Testability：测试能否控制输入并观察结果。

当前提供 6 个质量挑战，覆盖嵌套条件表达式、固定长度代码、集合查询性能、密码日志泄露、全局配置依赖和冗余布尔分支。题库刻意同时包含“较长代码更清楚”和“短代码更合理”的案例，防止学生把代码质量误解为单纯追求最少行数。

每道题的完整流程是：比较两个版本、完成七维判断、选择当前工程情境下更好的总体方案、重构较弱版本、解释具体权衡，然后点击 `Evaluate Quality Decision`。系统会综合检查重点维度判断、隐藏行为测试、代码结构和书面解释。草稿、暂停继续、历史复盘和重新挑战均与 Review Lab 一致。

Quality Studio 的结果会进入 Dashboard 的 `Code Quality Evidence`，并进入全局导出报告；单独导出某一个 Practice Topic 时不会混入独立的质量训练数据。

## 运行前确认

这个项目需要 .NET 和 Python 3。打开 PowerShell 后可以先确认：

```powershell
dotnet --version
python --version
```

如果 `python --version` 找不到 Python，也可以试：

```powershell
py -3 --version
```

在 **PowerShell terminal** 里输入：

```powershell
cd "D:\Desktop\test-SSP\SSP_v4\LoopVisualizerSystem"
dotnet run --urls "http://127.0.0.1:5057"
```

然后不要关掉这个 terminal，让它继续运行。

在 **Edge 地址栏** 里输入这个，不是在 Edge 控制台里输入：

```text
http://127.0.0.1:5057/?v=latest
```

如果 `5057` 被占用了，就把 terminal 命令改成：

```powershell
dotnet run --urls "http://127.0.0.1:5058"
```

然后 Edge 里打开：

```text
http://127.0.0.1:5058/?v=latest
```

停止运行时，在 terminal 里按 `Ctrl+C`。

## 常见故障

不要直接双击 `wwwroot/index.html`，也不要用 `file://.../index.html` 打开页面。这样只能看到静态界面，`Compile & Run` 无法连接后端，会出现 `Failed to fetch` 或类似错误。

必须先运行上面的 `dotnet run`，再在 Edge 里打开 `http://127.0.0.1:5057/` 或对应端口。

## 当前练习结构

每个 `Practice Topic` 现在都有统一的 5 个 Level，并且所有 Topic 都遵守同一套难度梯度：

1. Level 1: 缺少一个关键表达式、条件、函数调用或递归调用，学生在 `Fill-in-the-blank gate` 里填写空格；
2. Level 2: 缺少一行完整代码，学生需要把 `pass` 或占位行替换成一行有效 Python；
3. Level 3: 从较少提示出发，写出一段完整可运行代码；
4. Level 4: 给出冗杂代码，学生要用当前 Topic 的算法把它精炼，例如把重复加法改成 `for` + `range()`；
5. Level 5: 给出无法顺利运行的错误代码，学生需要修复运行错误并让目标变量正确。

学生不需要手动选择学习模式。现在的主流程是：

1. 在 `Practice Topic` 里选择想练的知识点；
2. 系统自动加载这个知识点当前训练批次里的下一关；
3. 学生按 Level 1 到 Level 5 顺序完成；
4. 每次 `Compile & Run` 后，系统自动判断当前关卡是否完成。

`Practice Path` 会在当前题目下方显示一张操作清单，告诉学生这关应该在哪里输入、需要补什么类型的代码片段、什么时候点击 `Compile & Run`，以及用哪个目标变量判断是否通过。

如果某个 Topic 的 5 个 Level 已经全部通关，下次打开这个 Topic 时会弹窗询问：

1. `Update Questions`: 从题库里刷新下一套当前训练批次；
2. `Repeat Last Set`: 保留上一套题，用于复习。

每个 `Practice Topic` 至少准备了 5 套完整题组。每套题组都包含 Level 1 到 Level 5，所以学生可以连续训练 5 次完全不同的任务路径。5 套都完成后，再点击 `Update Questions` 或通关弹窗里的刷新按钮时，系统会进入复习循环，重复之前练习过的题组。

点击 `Question Bank` 可以查看全量题库。题库按 Topic 和 Level 展示所有已存题目，并标出每道题属于 `Set 1`、`Set 2`、`Set 3`、`Set 4` 还是 `Set 5`，也会标出哪些题属于当前训练批次、哪些题已经完成。点击 `Update Questions` 会刷新该 Topic 当前训练批次，题库和 Dashboard 会同步更新。

点击 `Dashboard` 可以查看 Practice Pattern Tree 和 Learning Tree。Dashboard 只展示学生当前正在训练或接下来要训练的那一批题目，不会把全量题库全部铺开。

Practice Pattern Tree 的结构是：

1. `Start` 是初始节点；
2. 初始节点连接到每个 Practice Topic 节点；
3. 每个 Topic 节点继续连接到它下面的 Level 节点；
4. 每个 Level 节点继续连接到该 Level 下的题目节点。

学生完成一个题目后，对应题目节点会点亮；某个 Level 下当前训练批次的题目全部完成后，Level 节点会点亮；整个 Topic 当前批次全部完成后，Topic 主节点会点亮。如果以后某个 Topic 增加了 Level 6、Level 7，Dashboard 会根据任务数据自动增加对应圆圈节点。

`Code` 和 `Run Timeline` 始终上下排列：先看代码和运行按钮，再看填空确认区，最后看运行轨迹。

## 导出学习报告

点击 `Export Report` 后先选择导出范围，再选择导出格式。

导出范围：

1. `All Practice Topics`: 生成全局学习报告；
2. 某一个 Topic: 只生成该 Topic 各 Level 的复盘报告。

导出格式：

1. `Print PDF`: 打开一份适合打印的学习报告，并启动浏览器打印窗口。想保存 PDF 时，在打印窗口里选择 `Save as PDF`。
2. `Open HTML`: 在新标签页打开一份可阅读的 HTML 学习报告。

报告不是原始 JSON 日志，而是给老师和学生复盘用的摘要：包含学习概览、Topic 进度、能力地图、误解信号、下一步建议和最近练习证据。

## Debug Detective 怎么判断

Level 5 不是要求学生代码和标准答案一模一样。学生可以用不同写法，只要 `Compile & Run` 后 trace 能证明：

- 程序可以顺利运行；
- 目标变量的最终值正确；
- 不是直接写死最终答案；
- 运行过程能体现这一题需要训练的概念，比如条件、循环、累加器、递归等。

如果结果不对，系统会尽量按情况给反馈：比如程序仍然报错、目标变量没有创建、数值偏小、数值偏大、条件判断方向不对、只写死答案但没有修复过程，或者最终值接近但 trace 缺少必要的过程证据。

点击 `Show fix` 时，反馈会优先给出真正可用的提示，例如：

1. 正确答案中需要的 Python 内置函数，比如 `len()`、`range()`；
2. 一份可运行的参考答案；
3. 对运行错误的具体修复方式，比如变量名拼错、变量未定义、列表索引越界。

## 填空题怎么填写

如果 Code 里出现 `___1___`、`___2___` 这样的占位符，不需要在 Code 里手动删除它。

请在 `Code` 下方、`Run Timeline` 上方的 `Fill-in-the-blank gate` 里填写答案。输入后，Code 会自动同步更新。

注意：输入的是 Python 代码片段。如果答案是字符串，需要自己带引号，例如：

```python
"Ada"
```

## 函数提示

如果题目需要用到 Python 内置函数，题面会自动显示函数提示，包括：

1. 函数名；
2. 一个很短的示例；
3. 这个函数的用途。

例如题目代码里出现 `range()` 或 `len()` 时，系统会在任务说明中显示对应提示，帮助学生知道它不是随便出现的语法。
