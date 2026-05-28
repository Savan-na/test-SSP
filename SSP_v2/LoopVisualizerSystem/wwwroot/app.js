let pipelineSteps = [];
let variableColorMap = {};
// 标记当前系统是否处于成功运行的 Timeline 状态
let isTimelineActive = false;

const BRIGHT_PALETTE = ["#ff7b72", "#3fb950", "#d29922", "#a5d6ff", "#f274c5", "#58a6ff", "#ffc600", "#e2a6ff"];

const btnRun = document.getElementById('btn-run');
const slider = document.getElementById('trace-slider');
const consoleOutput = document.getElementById('console-output');
const scopeGrid = document.getElementById('scope-grid');
const explanationText = document.getElementById('explanation-text');
const stepCounter = document.getElementById('step-counter');

const codeInput = document.getElementById('code-input');
const codeViewer = document.getElementById('code-viewer');
const gutterZone = document.getElementById('gutter-zone');

// ⭐ 核心渲染逻辑：把学生的文本拆成行，动态同步到行号带和渲染层
function syncEditorRendering(highlightLineNum = -1) {
    const text = codeInput.value;
    const lines = text.split('\n');
    
    gutterZone.innerHTML = '';
    codeViewer.innerHTML = '';
    
    lines.forEach((lineText, index) => {
        const lineNum = index + 1;
        
        // 1. 同步生成左侧灰色行号
        const gutterNum = document.createElement('div');
        gutterNum.className = 'gutter-num';
        gutterNum.id = `gutter-num-${lineNum}`;
        gutterNum.textContent = lineNum;
        if (lineNum === highlightLineNum) {
            gutterNum.classList.add('active-num');
        }
        gutterZone.appendChild(gutterNum);
        
        // 2. 同步生成底层的渲染行
        const row = document.createElement('div');
        row.className = 'render-line-row';
        row.id = `render-row-${lineNum}`;
        if (lineNum === highlightLineNum) {
            row.classList.add('active-row');
        }
        
        // ⭐ 核心逻辑分支：如果编译成功激活了时间轴，则对关键变量进行着色渲染
        if (isTimelineActive && Object.keys(variableColorMap).length > 0) {
            let escapeHtml = lineText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            
            // 利用单词边界（Word Boundary）正则，精准捕捉并染色代码中的特定变量名
            for (const [varName, color] of Object.entries(variableColorMap)) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                escapeHtml = escapeHtml.replace(regex, `<span style="color: ${color}; font-weight: bold;">${varName}</span>`);
            }
            row.innerHTML = escapeHtml === '' ? ' ' : escapeHtml;
        } else {
            // 如果没编译或编译失败，显示无变色的纯净普通文本
            row.textContent = lineText === '' ? ' ' : lineText;
        }
        
        codeViewer.appendChild(row);
    });
}

// 监听键盘的任意输入（支持键盘上所有按键、删除、复制粘贴和回车）
codeInput.addEventListener('input', () => {
    // 只要代码发生改动，立刻自动退出高亮变色状态，变成可正常编辑的普通代码状态
    isTimelineActive = false;
    variableColorMap = {};
    syncEditorRendering();
});

// 同步滚动条：确保 textarea 产生横向或纵向滚动时，底层的渲染层和左侧的行号跟着毫米级对齐
codeInput.addEventListener('scroll', () => {
    codeViewer.scrollTop = codeInput.scrollTop;
    codeViewer.scrollLeft = codeInput.scrollLeft;
    gutterZone.scrollTop = codeInput.scrollTop;
});

function initializeVariableColors(steps) {
    variableColorMap = {};
    let colorIndex = 0;
    steps.forEach(frame => {
        const vars = frame.variables || {};
        for (const varName of Object.keys(vars)) {
            if (!variableColorMap[varName]) {
                variableColorMap[varName] = BRIGHT_PALETTE[colorIndex % BRIGHT_PALETTE.length];
                colorIndex++;
            }
        }
    });
}

btnRun.addEventListener('click', async () => {
    const code = codeInput.value;
    btnRun.textContent = "Tracing...";
    btnRun.disabled = true;

    try {
        const response = await fetch('/api/execution/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });

        if (!response.ok) throw new Error("Backend infrastructure execution alert.");

        pipelineSteps = await response.json();
        
        if (!pipelineSteps || pipelineSteps.length === 0) {
            throw new Error("No trace telemetry returned.");
        }

        // ⭐ 编译成功：激活色彩映射，允许左侧关键变量进行颜色突变高亮
        isTimelineActive = true;
        initializeVariableColors(pipelineSteps);

        slider.max = pipelineSteps.length - 1;
        slider.value = 0;
        slider.disabled = pipelineSteps.length <= 1;
        
        renderFrame(0);
    } catch (err) {
        // ⭐ 编译失败：保持代码原本的状态，绝不改变任何变量的颜色
        isTimelineActive = false;
        variableColorMap = {};
        syncEditorRendering();
        consoleOutput.innerHTML = `<span style="color: #f85149;">Compilation Core Error: ${err.message}</span>`;
    } finally {
        btnRun.textContent = "Compile & Trace";
        btnRun.disabled = false;
    }
});

slider.addEventListener('input', (e) => {
    renderFrame(parseInt(e.target.value));
});

function renderFrame(index) {
    if (!pipelineSteps || pipelineSteps.length === 0 || index >= pipelineSteps.length) return;
    
    const frame = pipelineSteps[index];

    // 1. 渲染控制台标准输出
    consoleOutput.innerHTML = frame.stdout ? frame.stdout : `>>> Iterator matrix allocated. Running tracking metrics...`;
    if (frame.error) {
        consoleOutput.innerHTML += `<br><span style="color: #f85149; font-weight: bold; font-family: monospace;">\n\n[Runtime Crash Log]:\n>>> ${frame.error}</span>`;
    }
    
    // 2. 渲染解说词并同步上色
    let processedExplanation = frame.explanation || "";
    for (const [varName, color] of Object.entries(variableColorMap)) {
        const regex = new RegExp(`\`${varName}\``, 'g');
        processedExplanation = processedExplanation.replace(regex, `<code style="color: ${color}; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius:3px;">${varName}</code>`);
    }
    explanationText.innerHTML = processedExplanation;
    
    // 3. 步数指示器更新
    stepCounter.textContent = `Steps: ${index + 1} / ${pipelineSteps.length}`;

    // 4. ⭐ 触发左侧联动：重绘行号与底层，并高亮当前的 frame.line
    syncEditorRendering(frame.line);

    // 5. 动态渲染右侧卡片
    scopeGrid.innerHTML = '';
    const vars = frame.variables || {}; 
    
    if (Object.keys(vars).length === 0) {
        scopeGrid.innerHTML = `<div style="color: #8b949e; font-size: 12px; font-style: italic;">No variables allocated in current local stack frame.</div>`;
    } else {
        for (const [key, value] of Object.entries(vars)) {
            const varColor = variableColorMap[key] || "#c9d1d9";
            const card = document.createElement('div');
            card.className = 'variable-card';
            card.style.border = `1px solid ${varColor}`;
            card.style.background = `rgba(${hexToRgb(varColor)}, 0.04)`;
            card.innerHTML = `<span class="name" style="color: ${varColor}">${key}</span> = <span class="value" style="color: #ffffff; font-weight: bold; background: rgba(${hexToRgb(varColor)}, 0.2); padding: 1px 6px; border-radius: 4px;">${value}</span>`;
            scopeGrid.appendChild(card);
        }
    }
}

function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

// 页面首次加载，初始化普通代码状态的行号与排版
syncEditorRendering();