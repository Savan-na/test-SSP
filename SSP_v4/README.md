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