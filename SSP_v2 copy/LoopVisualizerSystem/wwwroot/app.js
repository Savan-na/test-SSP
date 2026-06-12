let pipelineSteps = [];
let variableColorMap = {};
let isTimelineActive = false;

// 工业级暗色高对比度亮色调色盘
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

// 核心渲染逻辑：同步行号、高亮线和关键字染色
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
        
        // 如果编译成功进入时间轴状态，触发关键变量名精准着色
        if (isTimelineActive && Object.keys(variableColorMap).length > 0) {
            let escapeHtml = lineText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            for (const [varName, color] of Object.entries(variableColorMap)) {
                const regex = new RegExp(`\\b${varName}\\b`, 'g');
                escapeHtml = escapeHtml.replace(regex, `<span style="color: ${color}; font-weight: bold;">${varName}</span>`);
            }
            row.innerHTML = escapeHtml === '' ? ' ' : escapeHtml;
        } else {
            row.textContent = lineText === '' ? ' ' : lineText;
        }
        codeViewer.appendChild(row);
    });
}

// 监听任何键盘键入、删除、粘贴，随时刷新界面
codeInput.addEventListener('input', () => {
    isTimelineActive = false;
    variableColorMap = {};
    syncEditorRendering();
});

// 精准同步双层滚动条
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
        
        if (pipelineSteps.length === 0) {
            throw new Error("No trace telemetry returned.");
        }

        isTimelineActive = true;
        initializeVariableColors(pipelineSteps);

        slider.max = pipelineSteps.length - 1;
        slider.value = 0;
        slider.disabled = pipelineSteps.length <= 1;
        
        renderFrame(0);
    } catch (err) {
        isTimelineActive = false;
        variableColorMap = {};
        syncEditorRendering();
        consoleOutput.innerHTML = `<div class="console-row" style="color: #f85149;">Compilation Core Error: ${err.message}</div>`;
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

    // 1. 渲染优雅换行排版的标准输出
    if (frame.stdout) {
        const stdoutLines = frame.stdout.trim().split('\n');
        consoleOutput.innerHTML = stdoutLines.map(l => `<div class="console-row">${l}</div>`).join('');
    } else {
        consoleOutput.innerHTML = `<div class="console-row" style="color: #8b949e;">>>> Iterator matrix allocated. Running tracking metrics...</div>`;
    }
    
    if (frame.error) {
        consoleOutput.innerHTML += `<div class="console-row" style="color: #f85149; font-weight: bold;">[Runtime Crash Log]: ${frame.error}</div>`;
    }
    
    // 2. 渲染解说词并绑定颜色
    let processedExplanation = frame.explanation || "";
    for (const [varName, color] of Object.entries(variableColorMap)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExplanation = processedExplanation.replace(regex, `<code style="color: ${color}; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius:3px;">${varName}</code>`);
    }
    explanationText.innerHTML = processedExplanation;
    
    stepCounter.textContent = `Steps: ${index + 1} / ${pipelineSteps.length}`;
    
    // 3. 驱动左侧双层编辑器高亮当前行
    syncEditorRendering(frame.line);

    // 4. 渲染右侧卡片网格，达成视觉强对齐
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

// 页面首开加载
syncEditorRendering();