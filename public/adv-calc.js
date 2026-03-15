// ==========================================
// 高级计算器 (Advanced Calculator) - 模块化应用
// 依赖: React, Framer Motion, math.js (需在 index.html 引入)
// 动态依赖: KaTeX (系统将自动加载)
// ==========================================

window.AppTools = window.AppTools || {};

window.AppTools.AdvancedCalc = ({ showToast }) => {
    const { useState, useEffect, useRef, useMemo } = window.React;
    const { motion, AnimatePresence } = window.Motion;

    // --- 图标引用 ---
    const IconBase = ({ children, size = 20, className = "", ...props }) => 
        React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, ...props }, children);
    
    const LocalIcons = {
        Delete: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" }), React.createElement("line", { x1: "18", y1: "9", x2: "12", y2: "15" }), React.createElement("line", { x1: "12", y1: "9", x2: "18", y2: "15" })),
        History: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), React.createElement("path", { d: "M3 3v5h5" }), React.createElement("path", { d: "M12 7v5l4 2" })),
        Settings: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "3" }), React.createElement("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })),
        Info: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })),
        Close: p => React.createElement(IconBase, p, React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })),
        Search: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "11", cy: "11", r: "8" }), React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })),
        Ruler: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" }), React.createElement("path", { d: "m14.5 12.5 2-2" }), React.createElement("path", { d: "m11.5 9.5 2-2" }), React.createElement("path", { d: "m8.5 6.5 2-2" }), React.createElement("path", { d: "m17.5 15.5 2-2" })),
        Function: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 3v18h18" }), React.createElement("path", { d: "M18 17V9" }), React.createElement("path", { d: "M13 17V5" }), React.createElement("path", { d: "M8 17v-3" })),
        Library: p => React.createElement(IconBase, p, React.createElement("path", { d: "m16 6 4 14" }), React.createElement("path", { d: "M12 6v14" }), React.createElement("path", { d: "M8 8v12" }), React.createElement("path", { d: "M4 4v16" }))
    };

    // --- 状态与配置 ---
    const TABS = [
        { id: 'scientific', label: '科学/工程综合计算' },
        { id: 'programmer', label: '程序员', isBeta: true },
        { id: 'matrix', label: '矩阵与向量', isBeta: true }
    ];

    const [activeTab, setActiveTab] = useState('scientific');
    const [mathEngine, setMathEngine] = useState(null);
    const [katexLoaded, setKatexLoaded] = useState(false);

    useEffect(() => {
        // 挂载 math.js
        if (window.math) {
            setMathEngine(window.math);
        } else {
            showToast("检测到 math.js 未加载，可能会影响高级计算功能。", "error");
        }

        // 动态加载 KaTeX 以支持 LaTeX 美化输出
        if (!document.getElementById('katex-css')) {
            const link = document.createElement('link');
            link.id = 'katex-css'; link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.css';
            document.head.appendChild(link);
        }
        if (!document.getElementById('katex-js') && !window.katex) {
            const script = document.createElement('script');
            script.id = 'katex-js'; script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/katex.min.js';
            script.onload = () => setKatexLoaded(true);
            document.body.appendChild(script);
        } else if (window.katex) {
            setKatexLoaded(true);
        }
    }, []);

    // --- 子组件：交互式函数绘图板 ---
    const FunctionPlotter = ({ expression, engine }) => {
        const canvasRef = useRef(null);
        
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas || !engine || !expression) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            ctx.clearRect(0, 0, width, height);
            
            // 绘制网格和坐标轴
            ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
            ctx.lineWidth = 1;
            for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
            for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
            
            ctx.strokeStyle = 'rgba(156, 163, 175, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, height/2); ctx.lineTo(width, height/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke();

            // 编译方程并绘制
            try {
                // 如果包含等号，只绘制左边减去右边
                let plotExpr = expression;
                if (plotExpr.includes('=')) {
                    const parts = plotExpr.split('=');
                    plotExpr = `(${parts[0]}) - (${parts[1]})`;
                }
                
                const compiled = engine.compile(plotExpr);
                ctx.strokeStyle = '#6366f1'; 
                ctx.lineWidth = 2.5;
                ctx.lineJoin = 'round';
                ctx.beginPath();
                
                const rangeX = 20; // x from -10 to 10
                const scaleX = width / rangeX;
                const scaleY = height / 20; // y from -10 to 10
                
                let first = true;
                for (let px = 0; px < width; px += 2) {
                    let x = (px - width/2) / scaleX;
                    try {
                        let y = compiled.evaluate({ x });
                        if (typeof y === 'number' && !isNaN(y)) {
                            let py = height/2 - y * scaleY;
                            if (first) { ctx.moveTo(px, py); first = false; }
                            else { ctx.lineTo(px, py); }
                        }
                    } catch (err) { /* 忽略无效求值点 */ }
                }
                ctx.stroke();
            } catch(e) {
                // 公式无法绘制
            }
        }, [expression, engine]);

        return React.createElement("div", { className: "w-full aspect-square rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 overflow-hidden relative shadow-inner" },
            React.createElement("canvas", { ref: canvasRef, className: "w-full h-full" }),
            React.createElement("div", { className: "absolute bottom-2 right-3 text-[10px] font-bold text-slate-400 bg-white/80 dark:bg-slate-900/80 px-2 py-1 rounded backdrop-blur-md" }, "x ∈ [-10, 10]")
        );
    };

    // --- 子组件：科学/工程计算模式 ---
    const ScientificMode = () => {
        const [expression, setExpression] = useState("");
        const [displayResult, setDisplayResult] = useState("");
        const [livePreview, setLivePreview] = useState("");
        const [texPreview, setTexPreview] = useState("");
        const [angleMode, setAngleMode] = useState("deg"); 
        const [isShifted, setIsShifted] = useState(false);
        const [memory, setMemory] = useState(0);
        const [history, setHistory] = useState([]);
        const [showHistory, setShowHistory] = useState(false);
        const [sidebarTab, setSidebarTab] = useState('none'); // 'none', 'manual', 'units', 'constants', 'plot'
        const [sidebarSearch, setSidebarSearch] = useState(""); 
        
        const [cursorPos, setCursorPos] = useState({ start: null, end: null });
        const displayRef = useRef(null);

        useEffect(() => {
            if (displayRef.current && document.activeElement !== displayRef.current) {
                displayRef.current.scrollLeft = displayRef.current.scrollWidth;
            }
        }, [expression]);

        // 核心：高级解析、牛顿求解器与 LaTeX 渲染
        const evaluateExpression = (expr) => {
            if (!mathEngine || !expr) return { res: "", tex: "" };
            try {
                let evalStr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
                evalStr = evalStr.replace(/%/g, '/100'); 
                evalStr = evalStr.replace(/√\(/g, 'sqrt(').replace(/∛\(/g, 'cbrt(');
                evalStr = evalStr.replace(/φ/g, '1.618033988749895').replace(/Nₐ/g, '6.02214076e23').replace(/c/g, '299792458').replace(/G/g, '6.67430e-11');

                // 括号自动闭合处理
                const openParens = (evalStr.match(/\(/g) || []).length;
                const closeParens = (evalStr.match(/\)/g) || []).length;
                if (openParens > closeParens) evalStr += ')'.repeat(openParens - closeParens);

                let scope = {};
                if (angleMode === 'deg') {
                    ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'].forEach(fn => {
                        scope[fn] = (x) => mathEngine[fn](mathEngine.unit(x, 'deg'));
                    });
                    ['asin', 'acos', 'atan', 'asec', 'acsc', 'acot'].forEach(fn => {
                        scope[fn] = (x) => mathEngine[fn](x) * 180 / Math.PI;
                    });
                }

                let resultStr = "";
                let latexStr = "";

                // 解析 LaTeX
                try {
                    latexStr = mathEngine.parse(evalStr).toTex({parenthesis: 'auto', implicit: 'show'});
                } catch(e) { latexStr = ""; }

                // 求解器模式：识别等号进行牛顿-拉弗森迭代
                if (evalStr.includes('=')) {
                    const parts = evalStr.split('=');
                    if (parts.length === 2 && parts[0] && parts[1]) {
                        const eq = `(${parts[0]}) - (${parts[1]})`;
                        const compiled = mathEngine.compile(eq);
                        const deriv = mathEngine.derivative(eq, 'x'); // 仅支持 x 作为未知数求解
                        
                        let x = 1; // 初始猜测值
                        let solved = false;
                        for(let i=0; i<30; i++){
                            let fx = compiled.evaluate({x});
                            let dfx = deriv.evaluate({x});
                            if (Math.abs(fx) < 1e-12) { solved = true; break; }
                            if (dfx === 0) break;
                            x = x - fx/dfx;
                        }
                        if (solved) {
                            resultStr = `x ≈ ${mathEngine.format(x, { precision: 10 })}`;
                            latexStr += ` \\implies x \\approx ${mathEngine.format(x, { precision: 6 })}`;
                        } else {
                            resultStr = "求解迭代未收敛";
                        }
                    }
                } 
                // 普通计算模式
                else {
                    const res = mathEngine.evaluate(evalStr, scope);
                    
                    if (res !== undefined) {
                        if (typeof res === 'number' && !isNaN(res)) {
                            // 极小值归零
                            let finalRes = Math.abs(res) < 1e-14 ? 0 : res;
                            resultStr = mathEngine.format(finalRes, { precision: 14, lowerExp: -12, upperExp: 15 });
                        } else if (res.isUnit) {
                            // 格式化量纲单位输出
                            resultStr = mathEngine.format(res, { precision: 10 });
                        } else {
                            resultStr = mathEngine.format(res);
                        }
                    }
                }

                return { res: resultStr, tex: latexStr };
            } catch (e) {
                return { res: "", tex: "" };
            }
        };

        // 实时评估与渲染
        useEffect(() => {
            const { res, tex } = evaluateExpression(expression);
            setLivePreview(res);
            setTexPreview(tex);
        }, [expression, mathEngine, angleMode]);

        // 按钮点击处理
        const handleInput = (val, type = 'char') => {
            let currentExpr = expression;
            let currentStart = cursorPos.start !== null ? cursorPos.start : expression.length;
            let currentEnd = cursorPos.end !== null ? cursorPos.end : expression.length;
            
            if (displayResult && type !== 'operator') {
                currentExpr = "";
                currentStart = 0; currentEnd = 0;
                setDisplayResult("");
            } else if (displayResult && type === 'operator') {
                currentExpr = displayResult;
                currentStart = currentExpr.length; currentEnd = currentExpr.length;
                setDisplayResult("");
            }

            if (val === '±') {
                if (currentExpr) {
                    setExpression(`-(${currentExpr})`);
                    setCursorPos({ start: currentExpr.length + 3, end: currentExpr.length + 3 });
                } else {
                    setExpression("-"); setCursorPos({ start: 1, end: 1 });
                }
                return;
            }

            const newExpr = currentExpr.substring(0, currentStart) + val + currentExpr.substring(currentEnd);
            setExpression(newExpr);
            const newPos = currentStart + val.length;
            setCursorPos({ start: newPos, end: newPos });
        };

        const handleAction = (action) => {
            switch(action) {
                case 'AC':
                    setExpression(""); setDisplayResult(""); setLivePreview(""); setTexPreview("");
                    setCursorPos({ start: null, end: null });
                    break;
                case 'DEL':
                    if (displayResult) {
                        setExpression(""); setDisplayResult(""); setCursorPos({ start: null, end: null });
                        return;
                    }
                    const start = cursorPos.start !== null ? cursorPos.start : expression.length;
                    const end = cursorPos.end !== null ? cursorPos.end : expression.length;
                    
                    if (start === end && start > 0) {
                        setExpression(expression.substring(0, start - 1) + expression.substring(end));
                        setCursorPos({ start: start - 1, end: start - 1 });
                    } else if (start !== end) {
                        setExpression(expression.substring(0, start) + expression.substring(end));
                        setCursorPos({ start: start, end: start });
                    }
                    setDisplayResult("");
                    break;
                case '=':
                    if (livePreview) {
                        setDisplayResult(livePreview);
                        setHistory(prev => [{ expr: expression, res: livePreview, tex: texPreview }, ...prev].slice(0, 20)); 
                    } else if (expression) {
                        setDisplayResult("Error");
                    }
                    break;
            }
        };

        // 全局键盘监听
        useEffect(() => {
            const handleKeyDown = (e) => {
                const activeTag = document.activeElement?.tagName;
                const isDisplayFocused = document.activeElement === displayRef.current;
                if (activeTag === 'INPUT' && !isDisplayFocused) return;

                if (e.key === 'Enter') {
                    e.preventDefault(); handleAction('=');
                } else if (e.key === 'Escape') {
                    e.preventDefault(); handleAction('AC');
                } else if (e.key === 'Backspace') {
                    if (!isDisplayFocused) { e.preventDefault(); handleAction('DEL'); }
                } else if (!isDisplayFocused) {
                    const keyMap = { '*': '×', '/': '÷', '-': '-', '+': '+', '.': '.', '%': '%', '=': '=' };
                    if (/^[0-9x]$/.test(e.key) || keyMap[e.key]) {
                        e.preventDefault();
                        handleInput(keyMap[e.key] || e.key, /^[0-9.x]$/.test(e.key) ? 'char' : 'operator');
                    } else if (e.key === '(' || e.key === ')') {
                        e.preventDefault(); handleInput(e.key, 'func');
                    }
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [expression, displayResult, livePreview, cursorPos]);

        const handleMemory = (action) => {
            // 解析潜在的字符串，例如 "x ≈ 3" 提取数字
            let valStr = displayResult || livePreview || "0";
            if (valStr.includes("≈")) valStr = valStr.split("≈")[1].trim();
            const val = Number(valStr) || 0;

            switch(action) {
                case 'MC': setMemory(0); showToast("记忆已清除", "info"); break;
                case 'MR': handleInput(memory.toString(), 'char'); break;
                case 'M+': setMemory(m => m + val); showToast(`已累加至记忆: ${val}`, "success"); break;
                case 'M-': setMemory(m => m - val); showToast(`已从记忆递减: ${val}`, "success"); break;
                case 'MS': setMemory(val); showToast(`已存储至记忆: ${val}`, "success"); break;
            }
        };

        // UI 核心样式
        const BTN_CLASSES = {
            base: "relative flex items-center justify-center font-sans rounded-2xl text-[15px] sm:text-lg transition-all duration-200 active:scale-95 overflow-hidden shadow-sm",
            num: "bg-white/10 hover:bg-white/20 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md font-semibold",
            op: "bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-500/15 dark:hover:bg-indigo-500/25 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-500/30 font-bold",
            func: "bg-slate-50/60 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 text-sm md:text-[15px] font-medium",
            action: "bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-500/15 dark:hover:bg-rose-500/25 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/30 font-bold",
            equal: "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 border-none font-bold text-2xl"
        };

        // 优化按键布局：加入了方程和单位求解常用键 (x, =)
        const funcGridNormal = [
            { label: '(', val: '(' }, { label: ')', val: ')' }, { label: 'x', val: 'x' }, { label: '=', val: '=' },
            { label: 'sin', val: 'sin(' }, { label: 'cos', val: 'cos(' }, { label: 'tan', val: 'tan(' }, { label: 'xⁿ', val: '^' },
            { label: 'ln', val: 'log(' }, { label: 'log', val: 'log10(' }, { label: 'x²', val: '^2' }, { label: '1/x', val: '1/' },
            { label: '√', val: '√(' }, { label: '∛', val: '∛(' }, { label: '|x|', val: 'abs(' }, { label: 'e', val: 'e' },
            { label: 'π', val: 'π' }, { label: 'n!', val: '!' }, { label: 'EXP', val: 'e' }, { label: 'rand', val: 'random(' }
        ];

        const funcGridShifted = [
            { label: '[', val: '[' }, { label: ']', val: ']' }, { label: 'y', val: 'y' }, { label: '==', val: '==' },
            { label: 'sin⁻¹', val: 'asin(' }, { label: 'cos⁻¹', val: 'acos(' }, { label: 'tan⁻¹', val: 'atan(' }, { label: '10ⁿ', val: '10^(' },
            { label: 'sinh', val: 'sinh(' }, { label: 'cosh', val: 'cosh(' }, { label: 'tanh', val: 'tanh(' }, { label: 'eⁿ', val: 'e^(' },
            { label: 'ceil', val: 'ceil(' }, { label: 'floor', val: 'floor(' }, { label: 'ⁿ√x', val: 'nthRoot(' }, { label: 'φ', val: 'φ' },
            { label: 'nPr', val: ' permutations(' }, { label: 'nCr', val: ' combinations(' }, { label: 'lcm', val: 'lcm(' }, { label: 'gcd', val: 'gcd(' }
        ];

        // 高级侧边栏数据源
        const sidebarData = {
            manual: [
                { category: "基础函数 (1st)", items: [ { sym: "sin、cos、tan", desc: "三角函数" }, { sym: "ln、log", desc: "自然对数、常用对数" }, { sym: "x²、xⁿ", desc: "平方、自定义次幂" }, { sym: "√、∛", desc: "平方根、立方根" }, { sym: "|x|", desc: "绝对值" }, { sym: "1/x", desc: "倒数 (取 x 的倒数)" }, { sym: "n!", desc: "阶乘 (如 5! = 120)" }, { sym: "x、=", desc: "方程求解 (含=的表达式触发牛顿法)" } ] },
                { category: "进阶与常数 (2nd)", items: [ { sym: "sin⁻¹、cos⁻¹、tan⁻¹", desc: "反三角函数" }, { sym: "sinh、cosh、tanh", desc: "双曲函数" }, { sym: "nPr、nCr", desc: "排列数、组合数" }, { sym: "ceil、floor", desc: "向上取整、向下取整" }, { sym: "lcm、gcd", desc: "最小公倍数、最大公约数" } ] },
                { category: "状态与记忆 (控制栏)", items: [ { sym: "DEG、RAD", desc: "角度状态：角度制、弧度制切换" }, { sym: "MC", desc: "Memory Clear：清除记忆" }, { sym: "MR", desc: "Memory Recall：呼出记忆值" }, { sym: "M+", desc: "Memory Add：加到记忆值中" }, { sym: "M-", desc: "Memory Subtract：从记忆值中减去" }, { sym: "MS", desc: "Memory Store：存储当前记忆" } ] }
            ],
            units: [
                { category: "长度与面积 (Length & Area)", items: [ { sym: "m", desc: "米 (Meter)" }, { sym: "cm", desc: "厘米 (Centimeter)" }, { sym: "in", desc: "英寸 (Inch)" }, { sym: "ft", desc: "英尺 (Foot)" }, { sym: "m2", desc: "平方米" }, { sym: "sqin", desc: "平方英寸" } ] },
                { category: "质量与力 (Mass & Force)", items: [ { sym: "kg", desc: "千克 (Kilogram)" }, { sym: "g", desc: "克 (Gram)" }, { sym: "lb", desc: "磅 (Pound)" }, { sym: "N", desc: "牛顿 (Newton)" }, { sym: "lbf", desc: "磅力 (Pound-force)" } ] },
                { category: "压力与能量 (Pressure & Energy)", items: [ { sym: "Pa", desc: "帕斯卡 (Pascal)" }, { sym: "bar", desc: "巴 (Bar)" }, { sym: "psi", desc: "磅/平方英寸 (PSI)" }, { sym: "atm", desc: "标准大气压" }, { sym: "J", desc: "焦耳 (Joule)" }, { sym: "eV", desc: "电子伏特" } ] },
                { category: "功率与电学 (Power & Elec)", items: [ { sym: "W", desc: "瓦特 (Watt)" }, { sym: "hp", desc: "马力 (Horsepower)" }, { sym: "A", desc: "安培 (Ampere)" }, { sym: "V", desc: "伏特 (Volt)" }, { sym: "ohm", desc: "欧姆 (Ohm)" } ] }
            ],
            constants: [
                { category: "物理与化学常数", items: [ { sym: "c", desc: "光速 (Speed of light)", val: "299792458 m/s" }, { sym: "G", desc: "万有引力常数", val: "6.674e-11 m³/kg·s²" }, { sym: "Nₐ", desc: "阿伏伽德罗常数", val: "6.022e23 /mol" }, { sym: "R", desc: "理想气体常数", val: "8.314 J/mol·K" }, { sym: "e_charge", desc: "基本电荷 (元电荷)", val: "1.602e-19 C" }, { sym: "h", desc: "普朗克常数", val: "6.626e-34 J·s" } ] }
            ]
        };

        const currentSidebarList = sidebarTab !== 'none' && sidebarTab !== 'plot' ? sidebarData[sidebarTab].map(section => ({
            ...section,
            items: section.items.filter(item => 
                item.sym.toLowerCase().includes(sidebarSearch.toLowerCase()) || 
                item.desc.toLowerCase().includes(sidebarSearch.toLowerCase())
            )
        })).filter(section => section.items.length > 0) : [];

        return React.createElement("div", { className: "flex flex-col h-full max-w-6xl mx-auto relative w-full" },
            
            // 全局悬浮控制面板 (右侧浮动抽屉呼出按钮群)
            React.createElement("div", { className: "fixed top-5 right-5 sm:top-6 sm:right-8 z-50 flex flex-col gap-2" },
                [
                    { id: 'manual', icon: LocalIcons.Info, label: '说明', color: 'indigo' },
                    { id: 'units', icon: LocalIcons.Ruler, label: '量纲', color: 'emerald' },
                    { id: 'constants', icon: LocalIcons.Library, label: '常数', color: 'amber' },
                    { id: 'plot', icon: LocalIcons.Function, label: '绘图', color: 'rose' }
                ].map(btn => 
                    React.createElement(motion.button, {
                        key: btn.id, initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 },
                        onClick: () => setSidebarTab(prev => prev === btn.id ? 'none' : btn.id),
                        className: `w-12 h-12 sm:w-auto sm:px-4 sm:py-2.5 rounded-full shadow-lg border transition-all flex items-center justify-center gap-2 group
                            ${sidebarTab === btn.id ? `bg-${btn.color}-500 text-white border-${btn.color}-500` : `bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-${btn.color}-500 border-slate-200 dark:border-slate-700 backdrop-blur-md`}`,
                        title: btn.label
                    },
                        React.createElement(btn.icon, { size: 18, className: "group-hover:scale-110 transition-transform" }),
                        React.createElement("span", { className: "hidden sm:inline font-bold text-sm" }, btn.label)
                    )
                )
            ),

            // 显示器区域 (Screen)
            React.createElement("div", { className: "relative mb-4 p-5 sm:p-6 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 border border-white/60 dark:border-slate-700/50 shadow-xl backdrop-blur-2xl overflow-hidden group shrink-0" },
                React.createElement("div", { className: "absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full" }),
                React.createElement("div", { className: "absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full" }),
                
                React.createElement("div", { className: "flex justify-between items-center mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 z-10 relative" },
                    React.createElement("div", { className: "flex items-center gap-3" },
                        React.createElement("button", { 
                            onClick: () => setAngleMode(a => a === 'deg' ? 'rad' : 'deg'),
                            className: "px-3 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800/80 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase shadow-inner"
                        }, angleMode),
                        memory !== 0 && React.createElement("span", { className: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded shadow-sm" }, "M")
                    ),
                    React.createElement("button", { 
                        onClick: () => setShowHistory(!showHistory),
                        className: `p-1.5 rounded-full transition-colors ${showHistory ? 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-500/20' : 'hover:bg-white/50 dark:hover:bg-slate-800'}` 
                    }, React.createElement(LocalIcons.History, { size: 18 }))
                ),

                React.createElement(AnimatePresence, null, showHistory && 
                    React.createElement(motion.div, {
                        initial: { opacity: 0, height: 0, y: -10 }, animate: { opacity: 1, height: 'auto', y: 0 }, exit: { opacity: 0, height: 0, y: -10 },
                        className: "absolute top-14 left-0 w-full z-20 px-6 overflow-hidden"
                    },
                        React.createElement("div", { className: "bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 max-h-64 overflow-y-auto custom-scrollbar" },
                            history.length === 0 ? React.createElement("p", { className: "text-center text-sm text-slate-400 font-sans" }, "暂无计算记录") :
                            history.map((h, i) => React.createElement("div", { key: `hist-${i}`, className: "mb-3 last:mb-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 p-3 rounded-xl transition-colors", onClick: () => { setExpression(h.expr); setDisplayResult(h.res); setShowHistory(false); } },
                                React.createElement("div", { className: "text-sm text-slate-500 dark:text-slate-400 font-sans font-medium text-right mb-1" }, h.expr),
                                katexLoaded && h.tex ? React.createElement("div", { dangerouslySetInnerHTML: {__html: window.katex.renderToString(`${h.tex} = ${h.res}`, {displayMode: true, throwOnError: false})}, className: "text-right text-slate-800 dark:text-white" }) :
                                React.createElement("div", { className: "text-base text-slate-800 dark:text-slate-200 font-bold font-sans text-right" }, "=", h.res)
                            ))
                        )
                    )
                ),

                React.createElement("div", { className: "flex flex-col items-end justify-end h-28 sm:h-32 relative z-10" },
                    React.createElement("input", { 
                        ref: displayRef,
                        type: "text",
                        value: expression,
                        onChange: (e) => { setExpression(e.target.value); setDisplayResult(""); },
                        onSelect: (e) => { setCursorPos({ start: e.target.selectionStart, end: e.target.selectionEnd }); },
                        placeholder: "0",
                        className: "w-full text-right bg-transparent outline-none overflow-x-auto hide-scrollbar text-2xl sm:text-3xl font-sans font-medium text-slate-700 dark:text-slate-300 mb-1 tracking-wide placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    }),
                    
                    React.createElement("div", { className: "w-full text-right overflow-hidden relative flex flex-col items-end" },
                        // 若开启 LaTeX 美化，则在底层显示渲染的 LaTeX
                        (katexLoaded && texPreview) && React.createElement("div", { 
                            className: "opacity-40 pointer-events-none mb-1 text-sm sm:text-base", 
                            dangerouslySetInnerHTML: {__html: window.katex.renderToString(texPreview, {throwOnError: false})} 
                        }),
                        
                        React.createElement(motion.input, {
                            key: displayResult ? "result" : "preview",
                            initial: { y: 10, opacity: 0 }, animate: { y: 0, opacity: 1 },
                            readOnly: true,
                            value: displayResult || livePreview || "=",
                            onClick: (e) => {
                                if (displayResult) {
                                    const clickStart = e.target.selectionStart;
                                    const clickEnd = e.target.selectionEnd;
                                    // 过滤出方程求解文本中的 x 等于部分
                                    let expRes = displayResult;
                                    if(expRes.includes("≈")) expRes = expRes.split("≈")[1].trim();
                                    
                                    setExpression(expRes); setDisplayResult("");
                                    setTimeout(() => {
                                        if (displayRef.current) {
                                            displayRef.current.focus();
                                            displayRef.current.selectionStart = clickStart; displayRef.current.selectionEnd = clickEnd;
                                            setCursorPos({ start: clickStart, end: clickEnd });
                                        }
                                    }, 10);
                                }
                            },
                            className: `w-full text-right bg-transparent outline-none truncate font-sans font-bold ${displayResult ? 'text-4xl sm:text-5xl text-slate-800 dark:text-white drop-shadow-[0_0_15px_rgba(99,102,241,0.2)] cursor-text' : 'text-2xl sm:text-3xl text-indigo-500/50 dark:text-indigo-400/50 pointer-events-none'}`
                        })
                    )
                )
            ),

            // 记忆控制条
            React.createElement("div", { className: "flex gap-2 sm:gap-4 mb-4 overflow-x-auto hide-scrollbar shrink-0" },
                ['MC', 'MR', 'M+', 'M-', 'MS'].map((m, idx) => 
                    React.createElement("button", { 
                        key: `mem-${idx}`, onClick: () => handleMemory(m),
                        className: "flex-1 min-w-[3.5rem] py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/40 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-700/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 transition-colors backdrop-blur-sm"
                    }, m)
                )
            ),

            // 键盘区域
            React.createElement("div", { className: "flex-1 flex flex-col md:flex-row gap-4 min-h-0" },
                React.createElement("div", { className: "flex flex-col md:w-[55%] lg:w-1/2 bg-white/20 dark:bg-slate-800/20 p-3 sm:p-4 rounded-3xl border border-white/40 dark:border-slate-700/30 backdrop-blur-md shadow-inner" },
                    React.createElement("div", { className: "flex justify-start mb-3" },
                        React.createElement("button", {
                            onClick: () => setIsShifted(!isShifted),
                            className: `px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${isShifted ? 'bg-indigo-600 text-white shadow-indigo-500/40' : 'bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`
                        }, "2nd", isShifted ? "启用中" : "换挡")
                    ),
                    React.createElement("div", { className: "flex-1 overflow-x-auto hide-scrollbar" },
                        React.createElement("div", { className: "grid grid-rows-4 grid-flow-col md:grid-rows-[5] md:grid-flow-row md:grid-cols-4 gap-2 sm:gap-3 h-full min-w-max md:min-w-0" },
                            (isShifted ? funcGridShifted : funcGridNormal).map((btn, idx) => 
                                React.createElement("button", { 
                                    key: `func-${isShifted ? 'shift' : 'norm'}-${idx}`, 
                                    onClick: () => handleInput(btn.val, 'func'),
                                    className: `min-w-[4.5rem] md:min-w-0 h-12 md:h-auto ${BTN_CLASSES.base} ${BTN_CLASSES.func}`
                                }, React.createElement("span", { dangerouslySetInnerHTML: { __html: btn.label } }))
                            )
                        )
                    )
                ),

                React.createElement("div", { className: "flex-1 grid grid-cols-4 gap-2 sm:gap-3 auto-rows-fr bg-white/20 dark:bg-slate-800/20 p-3 sm:p-4 rounded-3xl border border-white/40 dark:border-slate-700/30 backdrop-blur-md shadow-inner" },
                    React.createElement("button", { onClick: () => handleAction('AC'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.action} text-lg` }, "AC"),
                    React.createElement("button", { onClick: () => handleAction('DEL'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.action}` }, React.createElement(LocalIcons.Delete, { size: 20 })),
                    React.createElement("button", { onClick: () => handleInput('%', 'operator'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.op}` }, "%"),
                    React.createElement("button", { onClick: () => handleInput('÷', 'operator'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.op} text-2xl` }, "÷"),

                    ['7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+'].map((item, idx) => {
                        const isOp = ['×', '-', '+'].includes(item);
                        return React.createElement("button", { 
                            key: `numpad-${idx}`, 
                            onClick: () => handleInput(item, isOp ? 'operator' : 'char'),
                            className: `${BTN_CLASSES.base} ${isOp ? `${BTN_CLASSES.op} text-2xl` : `${BTN_CLASSES.num} text-xl`}`
                        }, item)
                    }),

                    React.createElement("button", { onClick: () => handleInput('±', 'char'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.num}` }, "±"),
                    React.createElement("button", { onClick: () => handleInput('0', 'char'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.num} text-xl` }, "0"),
                    React.createElement("button", { onClick: () => handleInput('.', 'char'), className: `${BTN_CLASSES.base} ${BTN_CLASSES.num} text-2xl` }, "."),
                    React.createElement("button", { onClick: () => handleAction('='), className: `${BTN_CLASSES.base} ${BTN_CLASSES.equal}` }, "=")
                )
            ),

            // 高级侧边栏 (抽屉引擎：承载所有复杂功能面板)
            React.createElement(AnimatePresence, null, sidebarTab !== 'none' && 
                React.createElement(motion.div, {
                    initial: { x: "100%", opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: "100%", opacity: 0 },
                    transition: { type: "spring", stiffness: 300, damping: 30 },
                    className: "fixed right-0 top-0 bottom-0 z-[100] w-[320px] sm:w-[400px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-l border-white/50 dark:border-slate-700/50 shadow-2xl flex flex-col"
                },
                    React.createElement("div", { className: "p-5 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0" },
                        React.createElement("div", { className: "flex justify-between items-center mb-4 mt-2" },
                            React.createElement("h3", { className: "text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white" }, 
                                sidebarTab === 'manual' ? React.createElement(LocalIcons.Info, { className: "text-indigo-500" }) :
                                sidebarTab === 'units' ? React.createElement(LocalIcons.Ruler, { className: "text-emerald-500" }) :
                                sidebarTab === 'constants' ? React.createElement(LocalIcons.Library, { className: "text-amber-500" }) :
                                React.createElement(LocalIcons.Function, { className: "text-rose-500" }),
                                sidebarTab === 'manual' ? "符号说明书" : sidebarTab === 'units' ? "工程量纲与单位" : sidebarTab === 'constants' ? "物理常数库" : "交互式绘图板"
                            ),
                            React.createElement("button", { onClick: () => setSidebarTab('none'), className: "p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" }, React.createElement(LocalIcons.Close, { size: 18 }))
                        ),
                        sidebarTab !== 'plot' && React.createElement("div", { className: "relative" },
                            React.createElement(LocalIcons.Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
                            React.createElement("input", { type: "text", placeholder: "搜索内容...", value: sidebarSearch, onChange: e => setSidebarSearch(e.target.value), className: "w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 outline-none focus:border-indigo-400 text-sm font-sans" })
                        )
                    ),
                    
                    React.createElement("div", { className: "flex-1 overflow-y-auto custom-scrollbar p-5" },
                        // 绘图模式视图
                        sidebarTab === 'plot' ? React.createElement("div", { className: "flex flex-col gap-4 h-full" },
                            React.createElement("p", { className: "text-sm text-slate-500 dark:text-slate-400" }, "在主屏幕输入含未知数 ", React.createElement("code", {className: "bg-slate-100 dark:bg-slate-800 px-1 rounded"}, "x"), " 的表达式，即可在此预览其实时函数图像。"),
                            React.createElement(FunctionPlotter, { expression: expression, engine: mathEngine }),
                            React.createElement("div", { className: "mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50" },
                                React.createElement("h4", { className: "text-rose-600 dark:text-rose-400 font-bold text-sm mb-1" }, "工程师 Tips："),
                                React.createElement("p", { className: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed" }, "当你在此观察波动曲线时，尝试修改主表达式中的常数项，图表会进行全动态无缝重绘，这对于分析反应器传热波峰极其有用。")
                            )
                        ) :
                        // 列表模式视图 (单位、常数、说明)
                        React.createElement("div", { className: "space-y-6" },
                            currentSidebarList.length === 0 ? React.createElement("p", { className: "text-center text-sm text-slate-400 font-sans mt-4" }, "未找到匹配项") :
                            currentSidebarList.map((section, idx) => 
                                React.createElement("div", { key: `sec-${idx}` },
                                    React.createElement("h4", { className: `text-sm font-bold mb-3 border-b pb-2 font-sans
                                        ${sidebarTab === 'units' ? 'text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' : 
                                          sidebarTab === 'constants' ? 'text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' : 
                                          'text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50'}` 
                                    }, section.category),
                                    React.createElement("div", { className: "flex flex-col gap-2" },
                                        section.items.map((item, i) => 
                                            React.createElement("div", { 
                                                key: `item-${i}`, 
                                                onClick: () => { if (sidebarTab === 'units' || sidebarTab === 'constants') { handleInput(` ${item.sym}`, 'char'); } },
                                                className: `flex flex-col p-3 rounded-xl border border-slate-100/50 dark:border-slate-700/50 transition-all ${sidebarTab !== 'manual' ? 'hover:bg-slate-100 dark:hover:bg-slate-700/80 cursor-pointer shadow-sm active:scale-95' : 'bg-slate-50/80 dark:bg-slate-800/50'}` 
                                            },
                                                React.createElement("div", { className: "flex justify-between items-center mb-1" },
                                                    React.createElement("span", { className: "font-sans font-bold text-slate-800 dark:text-slate-200 text-[15px]" }, item.sym),
                                                    item.val && React.createElement("span", { className: "text-xs font-mono text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded" }, item.val)
                                                ),
                                                React.createElement("span", { className: "text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans" }, item.desc)
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    };

    const UnderConstruction = ({ title }) => (
        React.createElement("div", { className: "flex flex-col items-center justify-center h-full opacity-60 space-y-4" },
            React.createElement("div", { className: "w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shadow-inner" },
                React.createElement(LocalIcons.Settings, { size: 40, className: "text-slate-400 animate-spin-slow" })
            ),
            React.createElement("h3", { className: "text-xl font-bold dark:text-white tracking-widest" }, title),
            React.createElement("p", { className: "text-sm text-slate-500 font-sans" }, "SYSTEM_BUILDING_IN_PROGRESS...")
        )
    );

    return React.createElement("div", { className: "h-screen w-full bg-slate-50/50 dark:bg-[#0b1120] text-slate-900 dark:text-white flex flex-col overflow-hidden font-sans" },
        React.createElement("div", { className: "fixed inset-0 pointer-events-none z-0 overflow-hidden" },
            React.createElement("div", { className: "absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[100px] mix-blend-screen" }),
            React.createElement("div", { className: "absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[120px] mix-blend-screen" }),
            React.createElement("div", { className: "absolute top-[40%] right-[-20%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[100px] mix-blend-screen" })
        ),

        React.createElement("header", { className: "relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0" },
            React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white border border-white/20" },
                    React.createElement(IconBase, { size: 24 }, React.createElement("rect", { x: "4", y: "4", width: "16", height: "16", rx: "2", ry: "2" }), React.createElement("rect", { x: "9", y: "9", width: "6", height: "6" }), React.createElement("line", { x1: "9", y1: "1", x2: "9", y2: "4" }), React.createElement("line", { x1: "15", y1: "1", x2: "15", y2: "4" }))
                ),
                React.createElement("div", null, 
                    React.createElement("h1", { className: "text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300" }, "高级计算矩阵"),
                    React.createElement("p", { className: "text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5" }, "ADVANCED_CALC_SYSTEM_v3.0_PRO")
                )
            )
        ),

        React.createElement("nav", { className: "relative z-10 px-4 sm:px-8 mb-4 sm:mb-6 shrink-0" },
            React.createElement("div", { className: "flex gap-2 overflow-x-auto hide-scrollbar p-1.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl w-max max-w-full shadow-sm" },
                TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return React.createElement("button", {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        className: `relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${isActive ? 'text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`
                    }, 
                        isActive && React.createElement(motion.div, { layoutId: "activeTab", className: "absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl -z-10 shadow-lg" }),
                        tab.label,
                        tab.isBeta && React.createElement("span", { className: `ml-2 text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}` }, "WIP")
                    );
                })
            )
        ),

        React.createElement("main", { className: "relative z-10 flex-1 px-4 sm:px-8 pb-6 sm:pb-8 overflow-hidden flex flex-col" },
            React.createElement(AnimatePresence, { mode: "wait" },
                activeTab === 'scientific' && React.createElement(motion.div, { key: "scientific", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 }, className: "h-full" },
                    React.createElement(ScientificMode, null)
                ),
                activeTab !== 'scientific' && React.createElement(motion.div, { key: "other", initial: { opacity: 0, scale: 0.98 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.98 }, transition: { duration: 0.2 }, className: "h-full" },
                    React.createElement(UnderConstruction, { title: TABS.find(t => t.id === activeTab)?.label })
                )
            )
        )
    );
};