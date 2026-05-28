let pipelineSteps = [];
let variableColorMap = {};
let isTimelineActive = false;
let currentASTData = null;

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

function syncEditorRendering(highlightLineNum = -1) {
    const text = codeInput.value;
    const lines = text.split('\n');
    
    gutterZone.innerHTML = '';
    codeViewer.innerHTML = '';
    
    lines.forEach((lineText, index) => {
        const lineNum = index + 1;
        
        const gutterNum = document.createElement('div');
        gutterNum.className = 'gutter-num';
        gutterNum.id = `gutter-num-${lineNum}`;
        gutterNum.textContent = lineNum;
        if (lineNum === highlightLineNum) {
            gutterNum.classList.add('active-num');
        }
        gutterZone.appendChild(gutterNum);
        
        const row = document.createElement('div');
        row.className = 'render-line-row';
        row.id = `render-row-${lineNum}`;
        if (lineNum === highlightLineNum) {
            row.classList.add('active-row');
        }
        
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

// ⭐ 核心重构：D3 看板防出界微调引擎
function renderASTTree(treeData, activeLineNum = -1) {
    const stage = document.getElementById('ast-stage');
    stage.innerHTML = ''; 

    if (!treeData) return;

    const width = stage.clientWidth;
    const height = stage.clientHeight;

    // 将基础平移（translate）的 X 轴向右拉伸到 120 像素，为左侧预留足够身位
    const svg = d3.select("#ast-stage")
                  .append("svg")
                  .attr("width", width)
                  .attr("height", height)
                  .append("g")
                  .attr("transform", "translate(120,0)");

    const root = d3.hierarchy(treeData);
    
    // ⭐ 防出界精髓：将树的可用最大宽度收缩为 width - 280，强行把最右侧节点往左挤，绝不出界
    const treeLayout = d3.tree().size([height - 40, width - 280]);
    treeLayout(root);

    svg.selectAll(".link")
       .data(root.links())
       .enter()
       .append("path")
       .attr("class", "link")
       .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x))
       .style("stroke", d => (d.target.data.line === activeLineNum) ? "#58a6ff" : "#30363d")
       .style("stroke-width", d => (d.target.data.line === activeLineNum) ? "2.5px" : "1.5px")
       .style("transition", "all 0.15s ease");

    const node = svg.selectAll(".node")
                    .data(root.descendants())
                    .enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("r", d => (d.data.line === activeLineNum) ? 9 : 6) 
        .attr("stroke", d => (d.data.line === activeLineNum) ? "#ffffff" : (d.data.color || "#58a6ff")) 
        .style("fill", d => (d.data.line === activeLineNum) ? "#58a6ff" : "#21262d") 
        .style("filter", d => (d.data.line === activeLineNum) ? "drop-shadow(0px 0px 6px #58a6ff)" : "none") 
        .style("transition", "all 0.15s ease");

    node.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children ? -14 : 14)
        .style("text-anchor", d => d.children ? "end" : "start")
        .style("fill", d => (d.data.line === activeLineNum) ? "#ffffff" : "#c9d1d9")
        .style("font-weight", d => (d.data.line === activeLineNum) ? "bold" : "normal")
        .text(d => d.data.name);
}

codeInput.addEventListener('input', () => {
    isTimelineActive = false;
    variableColorMap = {};
    currentASTData = null;
    syncEditorRendering();
    document.getElementById('ast-stage').innerHTML = '';
});

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

        const payload = await response.json();
        pipelineSteps = payload.steps || [];
        
        if (pipelineSteps.length === 0) {
            throw new Error("No trace telemetry returned.");
        }

        isTimelineActive = true;
        initializeVariableColors(pipelineSteps);
        currentASTData = payload.astTree;

        slider.max = pipelineSteps.length - 1;
        slider.value = 0;
        slider.disabled = pipelineSteps.length <= 1;
        
        renderFrame(0);
    } catch (err) {
        isTimelineActive = false;
        variableColorMap = {};
        currentASTData = null;
        syncEditorRendering();
        document.getElementById('ast-stage').innerHTML = '';
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

    // 1. ⭐ 优化控制台物理换行：将流文本按行包装，提供舒适的空白间隔
    if (frame.stdout) {
        const stdoutLines = frame.stdout.trim().split('\n');
        consoleOutput.innerHTML = stdoutLines.map(l => `<div class="console-row">${l}</div>`).join('');
    } else {
        consoleOutput.innerHTML = `<div class="console-row" style="color: #8b949e;">>>> Iterator matrix allocated. Running tracking metrics...</div>`;
    }
    
    if (frame.error) {
        consoleOutput.innerHTML += `<div class="console-row" style="color: #f85149; font-weight: bold;">[Runtime Crash Log]: ${frame.error}</div>`;
    }
    
    // 2. 渲染解说词
    let processedExplanation = frame.explanation || "";
    for (const [varName, color] of Object.entries(variableColorMap)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExplanation = processedExplanation.replace(regex, `<code style="color: ${color}; background: rgba(255,255,255,0.05); padding: 2px 4px; border-radius:3px;">${varName}</code>`);
    }
    explanationText.innerHTML = processedExplanation;
    
    // 3. 步数指示器更新
    stepCounter.textContent = `Steps: ${index + 1} / ${pipelineSteps.length}`;
    
    syncEditorRendering(frame.line);

    if (currentASTData) {
        renderASTTree(currentASTData, frame.line);
    }

    // 4. 渲染卡片
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

syncEditorRendering();