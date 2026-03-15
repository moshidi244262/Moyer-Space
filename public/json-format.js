// ==========================================
// JsonFormat - JSON 格式化工具 (Moyer Space 模块 - 终极专业版 MAX)
// 动态挂载到 window.AppTools.JsonFormat
// ==========================================

window.AppTools = window.AppTools || {};

window.AppTools.JsonFormat = ({ showToast }) => {
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    const e = React.createElement; // 简化代码编写
    
    // ==========================================
    // 绝对防御：防崩溃图标注入 (解决 React Error #130 白屏问题)
    // ==========================================
    const IconsSrc = (typeof window !== 'undefined' && window.Icons) || (typeof Icons !== 'undefined' ? Icons : {});
    const globalCopyToClipboard = (typeof window !== 'undefined' && window.copyToClipboard) || (typeof copyToClipboard !== 'undefined' ? copyToClipboard : () => {});
    const Fragment = React.Fragment || "div"; // 防御性 Fragment

    // 标准图标安全降级
    const FileText = IconsSrc.FileText || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), e("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), e("polyline", { points: "10 9 9 9 8 9" })));
    const LayoutGrid = IconsSrc.LayoutGrid || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("rect", { x: "3", y: "3", width: "7", height: "7" }), e("rect", { x: "14", y: "3", width: "7", height: "7" }), e("rect", { x: "14", y: "14", width: "7", height: "7" }), e("rect", { x: "3", y: "14", width: "7", height: "7" })));
    const X = IconsSrc.X || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), e("line", { x1: "6", y1: "6", x2: "18", y2: "18" })));
    const Copy = IconsSrc.Copy || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), e("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })));
    const Info = IconsSrc.Info || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("circle", { cx: "12", cy: "12", r: "10" }), e("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), e("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })));
    const Check = IconsSrc.Check || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("polyline", { points: "20 6 9 17 4 12" })));
    const Download = IconsSrc.Download || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), e("polyline", { points: "7 10 12 15 17 10" }), e("line", { x1: "12", y1: "15", x2: "12", y2: "3" })));
    const Search = IconsSrc.Search || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("circle", { cx: "11", cy: "11", r: "8" }), e("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })));
    const Plus = IconsSrc.Plus || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("line", { x1: "12", y1: "5", x2: "12", y2: "19" }), e("line", { x1: "5", y1: "12", x2: "19", y2: "12" })));
    const Box = IconsSrc.Box || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" }), e("polyline", { points: "3.27 6.96 12 12.01 20.73 6.96" }), e("line", { x1: "12", y1: "22.08", x2: "12", y2: "12" })));
    const Minus = IconsSrc.Minus || (p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("line", { x1: "5", y1: "12", x2: "19", y2: "12" })));

    // 高级专属图标组件
    const IconSort = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4" }));
    const IconTree = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M10 3h4v4h-4zM2 17h4v4H2zM18 17h4v4h-4zM12 7v5M12 12H4v5M12 12h8v5" }));
    const IconType = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("polyline", { points: "4 7 4 4 20 4 20 7" }), e("line", { x1: "9", y1: "20", x2: "15", y2: "20" }), e("line", { x1: "12", y1: "4", x2: "12", y2: "20" }));
    const IconCompress = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "m15 15 6 6m-6-6v4m0-4h4M9 9 3 3m6 6V5m0 4H5" })); 
    const IconDiff = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M16 3h5v5M8 3H3v5M21 3l-6 6M3 3l6 6M16 21h5v-5M8 21H3v-5M21 21l-6-6M3 21l6-6" }));
    const IconSchema = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("path", { d: "M16 13H8M16 17H8M10 9H8" }));
    const IconUpload = p => e("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", ...p }, e("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" }));

    // ==========================================
    // 状态管理
    // ==========================================
    const [input, setInput] = useState(() => localStorage.getItem('moyer_json_input_pro') || '');
    const [compareInput, setCompareInput] = useState(''); 
    const [parsedData, setParsedData] = useState(null); 
    const [parsedCompareData, setParsedCompareData] = useState(null); 
    
    const [rawOutput, setRawOutput] = useState('');
    const [outputHtml, setOutputHtml] = useState('');
    const [errorDetails, setErrorDetails] = useState(null);
    const [isErrorDismissed, setIsErrorDismissed] = useState(false); 
    const [isLargeFile, setIsLargeFile] = useState(false);
    
    const [viewMode, setViewMode] = useState('code'); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const [queryPath, setQueryPath] = useState('');
    const [queryResult, setQueryResult] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [treeSearchTerm, setTreeSearchTerm] = useState('');
    const [treeState, setTreeState] = useState({ id: 0, action: 'default' }); 

    const [schemaInput, setSchemaInput] = useState('{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string" }\n  },\n  "required": ["name"]\n}');
    const [schemaErrors, setSchemaErrors] = useState(null);

    const workerRef = useRef(null);
    const lineNumRef = useRef(null);
    const compareLineNumRef = useRef(null);
    const fileInputRef = useRef(null);

    // ==========================================
    // 生命周期与副作用管理
    // ==========================================
    useEffect(() => { localStorage.setItem('moyer_json_input_pro', input); }, [input]);

    useEffect(() => {
        const timer = setTimeout(() => { setTreeSearchTerm(searchInput); }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        setIsErrorDismissed(false); 
        if (!input.trim()) { setErrorDetails(null); setParsedData(null); return; }
        const timer = setTimeout(() => {
            try { setParsedData(JSON.parse(input)); setErrorDetails(null); } 
            catch (e) { handleErrorStr(e.message); setParsedData(null); }
        }, 500);
        return () => clearTimeout(timer);
    }, [input]);

    useEffect(() => {
        if (!compareInput.trim()) { setParsedCompareData(null); return; }
        const timer = setTimeout(() => {
            try { setParsedCompareData(JSON.parse(compareInput)); } catch (e) { setParsedCompareData(null); }
        }, 500);
        return () => clearTimeout(timer);
    }, [compareInput]);


    // ==========================================
    // 基础工具函数
    // ==========================================
    const convertToJson = (type) => {
        if (!input.trim()) return;
        try {
            let res = {};
            if (type === 'url') {
                const params = new URLSearchParams(input.split('?')[1] || input);
                for (let [k, v] of params.entries()) res[k] = isNaN(v) ? v : Number(v);
            } else if (type === 'yaml_basic') {
                const lines = input.split('\n');
                let result = {};
                lines.forEach(line => {
                    const match = line.match(/^\s*([^:]+):\s*(.*)\s*$/);
                    if (match) {
                        let val = match[2].trim();
                        if (val === 'true') val = true;
                        else if (val === 'false') val = false;
                        else if (!isNaN(val) && val !== '') val = Number(val);
                        else val = val.replace(/^['"]|['"]$/g, '');
                        result[match[1].trim()] = val;
                    }
                });
                res = result;
            }
            setInput(JSON.stringify(res, null, 4));
            showToast('转换成功', 'success');
        } catch (err) { showToast('转换失败，格式不支持', 'error'); }
    };

    const handleEscape = () => {
        if (!input) return;
        const escaped = input.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
        setInput(`"${escaped}"`); showToast('转义成功', 'success');
    };
    
    const handleUnescape = () => {
        if (!input) return;
        try {
            let unescaped = input.trim();
            if (unescaped.startsWith('"') && unescaped.endsWith('"')) unescaped = JSON.parse(unescaped);
            else unescaped = unescaped.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r');
            const parsed = typeof unescaped === 'string' ? JSON.parse(unescaped) : unescaped;
            setInput(JSON.stringify(parsed, null, 4)); showToast('反转义并美化成功', 'success');
        } catch (e) {
            setInput(input.replace(/\\"/g, '"').replace(/\\\\/g, '\\')); showToast('执行了强制基础反转义', 'info');
        }
    };

    const handleExportFile = () => {
        const textToDownload = viewMode === 'ts' ? generateTypeScript : rawOutput;
        const ext = viewMode === 'ts' ? 'ts' : 'json';
        if (!textToDownload) return showToast('没有可导出的内容', 'info');
        const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `moyer_export_${Date.now()}.${ext}`;
        a.click(); URL.revokeObjectURL(url);
        showToast(`已导出 .${ext} 文件`, 'success');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => { setInput(evt.target.result); showToast('文件导入成功', 'success'); };
        reader.readAsText(file);
        if (e.target.value) e.target.value = ''; 
    };
    
    // ==========================================
    // 核心引擎：高级查询 / 差异对比 / Schema验证
    // ==========================================

    const safeGetByPath = (obj, pathStr) => {
        if (!pathStr || !obj) return undefined;
        try {
            const keys = [];
            let current = '', inQuotes = false;
            for (let i = 0; i < pathStr.length; i++) {
                const char = pathStr[i];
                if (char === '"' || char === "'") inQuotes = !inQuotes;
                else if (!inQuotes && (char === '.' || char === '[' || char === ']')) {
                    if (current) keys.push(current);
                    current = '';
                } else current += char;
            }
            if (current) keys.push(current);

            let currentObj = obj;
            for (let key of keys) {
                if (currentObj === null || currentObj === undefined) return undefined;
                if (key.startsWith('?') && Array.isArray(currentObj)) {
                    let match = key.match(/\?([^><=!]+)([><=!]+)(.+)/);
                    if(match) {
                        let k = match[1], op = match[2], v = match[3];
                        if(v === 'true') v = true; else if(v==='false') v = false; else if(!isNaN(v)) v = Number(v); else v = v.replace(/^['"]|['"]$/g, '');
                        currentObj = currentObj.filter(item => {
                            let itemV = item[k];
                            if(op === '>') return itemV > v; if(op === '<') return itemV < v;
                            if(op === '>=') return itemV >= v; if(op === '<=') return itemV <= v;
                            if(op === '==' || op === '=') return itemV == v; if(op === '!=') return itemV != v;
                            return false;
                        });
                    }
                    continue; 
                }
                if (Array.isArray(currentObj) && isNaN(key)) {
                    let mapped = currentObj.map(item => item && item[key]).filter(x => x !== undefined);
                    currentObj = mapped.length > 0 ? mapped : currentObj[key];
                } else {
                    currentObj = currentObj[key];
                }
            }
            return currentObj;
        } catch (e) { return undefined; }
    };

    const setByPathAndUpdate = (pathStr, val) => {
        if (!parsedData) return;
        try {
            let newData = JSON.parse(JSON.stringify(parsedData));
            const keys = []; let currentStr = '', inQuotes = false;
            for (let i = 0; i < pathStr.length; i++) {
                const char = pathStr[i];
                if (char === '"' || char === "'") inQuotes = !inQuotes;
                else if (!inQuotes && (char === '.' || char === '[' || char === ']')) {
                    if (currentStr) keys.push(currentStr); currentStr = '';
                } else currentStr += char;
            }
            if (currentStr) keys.push(currentStr);

            let current = newData;
            for(let i=0; i<keys.length - 1; i++) { current = current[keys[i]]; }
            current[keys[keys.length-1]] = val;
            
            setParsedData(newData);
            setInput(JSON.stringify(newData, null, 4));
            showToast('已同步修改到源码', 'success');
        } catch(e) { showToast('修改失败，路径异常', 'error'); }
    };

    const deepEqual = (a, b) => {
        if (a === b) return true;
        if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
        let keysA = Object.keys(a), keysB = Object.keys(b);
        if (keysA.length !== keysB.length) return false;
        for (let k of keysA) if (!deepEqual(a[k], b[k])) return false;
        return true;
    };

    const generateDiff = useCallback((oldObj, newObj) => {
        if (oldObj === newObj) return { type: 'equal', val: oldObj };
        if (typeof oldObj !== typeof newObj || Array.isArray(oldObj) !== Array.isArray(newObj)) {
            return { type: 'changed', oldVal: oldObj, newVal: newObj };
        }
        if (typeof oldObj !== 'object' || oldObj === null || newObj === null) {
            return oldObj === newObj ? { type: 'equal', val: oldObj } : { type: 'changed', oldVal: oldObj, newVal: newObj };
        }

        const isArr = Array.isArray(oldObj);
        const diffObj = isArr ? [] : {};
        let hasChanges = false;

        if (isArr) {
            let m = oldObj.length, n = newObj.length;
            // 降低阈值防止白屏，如果数据太大，采用简单对比
            if (m * n > 25000) { 
                const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
                allKeys.forEach(key => {
                    if (!(key in oldObj)) { diffObj[key] = { type: 'added', val: newObj[key] }; hasChanges = true; } 
                    else if (!(key in newObj)) { diffObj[key] = { type: 'removed', val: oldObj[key] }; hasChanges = true; } 
                    else {
                        const childDiff = generateDiff(oldObj[key], newObj[key]);
                        diffObj[key] = childDiff;
                        if (childDiff.type !== 'equal') hasChanges = true;
                    }
                });
            } else {
                let dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
                for (let i = 1; i <= m; i++) {
                    for (let j = 1; j <= n; j++) {
                        if (deepEqual(oldObj[i - 1], newObj[j - 1])) dp[i][j] = dp[i - 1][j - 1] + 1;
                        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                    }
                }
                let i = m, j = n, lcs = [];
                while (i > 0 && j > 0) {
                    if (deepEqual(oldObj[i - 1], newObj[j - 1])) {
                        lcs.unshift({ oldIdx: i - 1, newIdx: j - 1 }); i--; j--;
                    } else if (dp[i - 1][j] > dp[i][j - 1]) i--; else j--;
                }
                
                let o = 0, n_idx = 0, lcsIdx = 0, outIdx = 0;
                while(o < m || n_idx < n) {
                    let currentLCS = lcs[lcsIdx];
                    if (currentLCS && currentLCS.oldIdx === o && currentLCS.newIdx === n_idx) {
                        diffObj[outIdx++] = { type: 'equal', val: oldObj[o] }; o++; n_idx++; lcsIdx++;
                    } else if (o < m && (!currentLCS || currentLCS.oldIdx > o)) {
                        diffObj[outIdx++] = { type: 'removed', val: oldObj[o] }; o++; hasChanges = true;
                    } else if (n_idx < n && (!currentLCS || currentLCS.newIdx > n_idx)) {
                        diffObj[outIdx++] = { type: 'added', val: newObj[n_idx] }; n_idx++; hasChanges = true;
                    } else {
                        // 防御性步进
                        if (o < m) o++; if (n_idx < n) n_idx++;
                    }
                }
            }
        } else {
            const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
            allKeys.forEach(key => {
                if (!(key in oldObj)) { diffObj[key] = { type: 'added', val: newObj[key] }; hasChanges = true; } 
                else if (!(key in newObj)) { diffObj[key] = { type: 'removed', val: oldObj[key] }; hasChanges = true; } 
                else {
                    const childDiff = generateDiff(oldObj[key], newObj[key]);
                    diffObj[key] = childDiff;
                    if (childDiff && childDiff.type !== 'equal') hasChanges = true;
                }
            });
        }

        return hasChanges ? { type: 'object', val: diffObj, isArr } : { type: 'equal', val: oldObj };
    }, []);

    const validateSchemaData = (data, schema, path="root") => {
        let errors = [];
        if(!schema) return errors;
        if(schema.type) {
            let typeMismatch = false;
            if(schema.type === 'array' && !Array.isArray(data)) { errors.push(`[${path}] 必须是 Array 类型`); typeMismatch = true; }
            else if(schema.type === 'object' && (typeof data !== 'object' || data===null || Array.isArray(data))) { errors.push(`[${path}] 必须是 Object 类型`); typeMismatch = true; }
            else if(schema.type !== 'array' && schema.type !== 'object' && typeof data !== schema.type) { errors.push(`[${path}] 必须是 ${schema.type} 类型 (当前: ${typeof data})`); typeMismatch = true; }
            
            if(typeMismatch) return errors;
        }
        if(schema.type === 'object' && typeof data === 'object' && data) {
            if(schema.required) schema.required.forEach(req => { if(!(req in data)) errors.push(`[${path}] 缺少必填字段: "${req}"`) });
            if(schema.properties) {
                for(let key in schema.properties) {
                    if(key in data) errors = errors.concat(validateSchemaData(data[key], schema.properties[key], `${path}.${key}`));
                }
            }
        }
        if(schema.type === 'array' && Array.isArray(data) && schema.items) {
            data.forEach((item, idx) => errors = errors.concat(validateSchemaData(item, schema.items, `${path}[${idx}]`)));
        }
        return errors;
    };

    const runSchemaValidation = () => {
        try {
            const schema = JSON.parse(schemaInput);
            if (!parsedData) return setSchemaErrors(["请先在左侧输入需要验证的 JSON 数据"]);
            const errors = validateSchemaData(parsedData, schema);
            setSchemaErrors(errors.length ? errors : []); 
        } catch(e) { setSchemaErrors(["Schema 配置解析失败，请检查格式: " + e.message]); }
    };

    // ==========================================
    // Web Worker 及其他效应
    // ==========================================
    useEffect(() => {
        const workerCode = `
            function sortObjectKeys(obj) {
                if (obj === null || typeof obj !== 'object') return obj;
                if (Array.isArray(obj)) return obj.map(sortObjectKeys);
                return Object.keys(obj).sort().reduce((acc, key) => { acc[key] = sortObjectKeys(obj[key]); return acc; }, {});
            }
            function createHighlightHtml(val, compress = false, indentLevel = 0) {
                const spaces = compress ? '' : ' '.repeat(indentLevel * 4);
                const nextSpaces = compress ? '' : ' '.repeat((indentLevel + 1) * 4);
                const br = compress ? '' : '\\n'; const spaceAfterColon = compress ? '' : ' ';
                if (val === null) return '<span class="text-slate-400 dark:text-slate-500 italic">null</span>';
                if (typeof val === 'boolean') return '<span class="text-amber-600 dark:text-amber-400 font-bold">' + val + '</span>';
                if (typeof val === 'number') return '<span class="text-blue-600 dark:text-blue-400">' + val + '</span>';
                if (typeof val === 'string') return '<span class="text-emerald-600 dark:text-emerald-400 break-words">' + JSON.stringify(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</span>';
                if (Array.isArray(val)) {
                    if (val.length === 0) return '[]'; let html = '[' + br;
                    for (let i = 0; i < val.length; i++) html += nextSpaces + createHighlightHtml(val[i], compress, indentLevel + 1) + (i < val.length - 1 ? ',' : '') + br;
                    return html + spaces + ']';
                }
                if (typeof val === 'object') {
                    const keys = Object.keys(val); if (keys.length === 0) return '{}'; let html = '{' + br;
                    for (let i = 0; i < keys.length; i++) {
                        const escapedKey = JSON.stringify(keys[i]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        html += nextSpaces + '<span class="text-purple-600 dark:text-purple-400 font-bold">' + escapedKey + '</span>:' + spaceAfterColon + createHighlightHtml(val[keys[i]], compress, indentLevel + 1) + (i < keys.length - 1 ? ',' : '') + br;
                    }
                    return html + spaces + '}';
                } return '';
            }
            self.onmessage = function(e) {
                try {
                    const { input, compress, sort } = e.data;
                    let parsed = JSON.parse(input);
                    if (sort) parsed = sortObjectKeys(parsed);
                    const spaces = compress ? 0 : 4;
                    const formatted = JSON.stringify(parsed, null, spaces);
                    let outputHtml = ''; let isLargeFile = formatted.length > 100000;
                    if (!isLargeFile) outputHtml = createHighlightHtml(parsed, compress);
                    self.postMessage({ type: 'SUCCESS', payload: { rawOutput: formatted, outputHtml, isLargeFile, parsed } });
                } catch(err) { self.postMessage({ type: 'ERROR', message: err.message }); }
            };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob); 
        workerRef.current = new Worker(workerUrl);

        workerRef.current.onmessage = (e) => {
            setIsProcessing(false);
            if (e.data.type === 'SUCCESS') {
                const { rawOutput, outputHtml, isLargeFile, parsed } = e.data.payload;
                setRawOutput(rawOutput); setOutputHtml(outputHtml); setIsLargeFile(isLargeFile);
                setParsedData(parsed); setErrorDetails(null); showToast('处理完成', 'success');
                setQueryResult(null); setQueryPath('');
            } else {
                handleErrorStr(e.data.message); showToast('JSON 格式错误', 'error');
            }
        };
        return () => { if (workerRef.current) workerRef.current.terminate(); URL.revokeObjectURL(workerUrl); };
    }, []);

    const handleErrorStr = (errMsg) => {
        let details = { message: errMsg, line: null, col: null };
        const posMatch = errMsg.match(/position\s+(\d+)/i);
        if (posMatch && !isNaN(posMatch[1])) {
            const pos = parseInt(posMatch[1], 10);
            const prefix = input.slice(0, pos);
            const lines = prefix.split('\n');
            details.line = lines.length; details.col = lines[lines.length - 1].length + 1;
        }
        details.message = errMsg; setErrorDetails(details); setIsErrorDismissed(false); 
    };

    // ==========================================
    // 组件: 交互式树形视图 (加入双击原地编辑功能)
    // ==========================================
    const JsonTreeNode = ({ keyName, value, isLast, level = 0, treeState, searchTerm = '', currentPath = '' }) => {
        const CHUNK_SIZE = 100;
        const isObj = value !== null && typeof value === 'object';
        const isArray = Array.isArray(value);
        const isEmpty = isObj && Object.keys(value).length === 0;
        const objectKeys = isObj ? Object.keys(value) : [];

        const doesMatchSearch = useCallback((val, key, term) => {
            if (!term) return false; const lowerTerm = term.toLowerCase();
            if (key !== undefined && String(key).toLowerCase().includes(lowerTerm)) return true;
            if (val === null) return "null".includes(lowerTerm);
            if (typeof val !== 'object') return String(val).toLowerCase().includes(lowerTerm);
            for (let k in val) if (doesMatchSearch(val[k], k, term)) return true;
            return false;
        }, []);
        const isMatch = searchTerm ? doesMatchSearch(value, keyName, searchTerm) : false;
        const selfMatch = searchTerm && ((keyName !== undefined && String(keyName).toLowerCase().includes(searchTerm.toLowerCase())) || (!isObj && String(value).toLowerCase().includes(searchTerm.toLowerCase())));

        let initialExpanded = level < 2 || isMatch;
        if (treeState.action === 'expand') initialExpanded = true;
        if (treeState.action === 'collapse') initialExpanded = false;

        const [expanded, setExpanded] = useState(initialExpanded);
        useEffect(() => { if(isMatch) setExpanded(true); }, [searchTerm, isMatch]);

        const [isEditing, setIsEditing] = useState(false);
        const [editVal, setEditVal] = useState("");

        const handleDbClick = () => {
            if (isObj) return; 
            setEditVal(JSON.stringify(value));
            setIsEditing(true);
        };
        const handleEditSave = (e) => {
            if (e && e.type === 'keydown' && e.key !== 'Enter') return;
            setIsEditing(false);
            let valToSave;
            try { valToSave = JSON.parse(editVal); } catch(err) { valToSave = editVal.replace(/^"|"$/g, ''); }
            setByPathAndUpdate(currentPath, valToSave);
        };

        const highlightText = (text) => {
            if (!searchTerm || !text) return text;
            const safeTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const parts = String(text).split(new RegExp(`(${safeTerm})`, 'gi'));
            return parts.map((part, i) => part.toLowerCase() === searchTerm.toLowerCase() ? e("mark", { key: i, className: "bg-yellow-300 dark:bg-yellow-600/60 text-black dark:text-white rounded px-0.5" }, part) : part);
        };

        const renderValue = () => {
            if (isEditing) {
                return e("input", { 
                    autoFocus: true, value: editVal, onChange: e => setEditVal(e.target.value),
                    onBlur: handleEditSave, onKeyDown: handleEditSave,
                    className: "px-1 border border-indigo-400 rounded outline-none text-slate-800 bg-white shadow-sm w-32" 
                });
            }
            if (value === null) return e("span", { className: "text-slate-400 italic cursor-text", onDoubleClick: handleDbClick, title: "双击编辑" }, "null");
            if (typeof value === 'boolean') return e("span", { className: "text-amber-500 font-bold cursor-text", onDoubleClick: handleDbClick, title: "双击编辑" }, String(value));
            if (typeof value === 'number') return e("span", { className: "text-blue-500 cursor-text", onDoubleClick: handleDbClick, title: "双击编辑" }, highlightText(value));
            if (typeof value === 'string') return e("span", { className: "text-emerald-500 break-all cursor-text", onDoubleClick: handleDbClick, title: "双击编辑" }, '"', highlightText(value), '"');
            return null;
        };

        const getChildPath = (k) => {
            let keyStr = String(k); let isPropValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(keyStr);
            if (!currentPath) return isPropValid ? keyStr : `["${keyStr}"]`; 
            if (isArray) return `${currentPath}[${keyStr}]`;
            return isPropValid ? `${currentPath}.${keyStr}` : `${currentPath}["${keyStr}"]`;
        };

        const toggleIcon = e("span", { onClick: () => !isEmpty && setExpanded(!expanded), className: `inline-flex items-center justify-center w-4 h-4 mr-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer transition-transform ${expanded ? 'rotate-90' : ''} ${isEmpty ? 'opacity-0 cursor-default' : ''}` }, "▶");

        return e("div", { className: `font-mono text-sm leading-6 ${selfMatch ? 'bg-yellow-50/50 dark:bg-yellow-900/20 -mx-1 px-1 rounded' : ''}` },
            e("div", { className: "flex items-start group relative" },
                isObj && toggleIcon, !isObj && e("span", { className: "w-5 inline-block" }),
                keyName !== undefined && e("span", { className: "text-purple-600 dark:text-purple-400 font-bold mr-1" }, '"', highlightText(keyName), '":'),
                !isObj && e("span", null, renderValue(), !isLast && ","),
                isObj && e("span", { className: "text-slate-500 dark:text-slate-400 cursor-pointer", onClick: () => setExpanded(!expanded) }, isArray ? "[" : "{", !expanded && !isEmpty && ` ... ${isArray ? ']' : '}'}${!isLast ? ',' : ''}`, isEmpty && (isArray ? "]" : "}") + (!isLast ? "," : "")),
                isObj && !expanded && isArray && !isEmpty && e("span", { className: "ml-2 text-xs text-slate-400 opacity-50" }, `// ${value.length} items`),
                currentPath && e("button", { onClick: (e) => { e.stopPropagation(); globalCopyToClipboard(currentPath); showToast('已复制路径', 'success'); }, className: "ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-indigo-500 outline-none flex items-center justify-center pt-1.5", title: "复制 JSONPath" }, e(Copy, { size: 14 }))
            ),
            isObj && expanded && !isEmpty && e("div", { className: "pl-4 border-l border-slate-200 dark:border-slate-700/50 ml-2 py-1" },
                objectKeys.length > CHUNK_SIZE 
                ? Array.from({ length: Math.ceil(objectKeys.length / CHUNK_SIZE) }).map((_, chunkIdx) => e(JsonTreeChunk, { key: chunkIdx, chunkIdx, chunkKeys: objectKeys.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE), value, isArray, level: level + 1, treeState, searchTerm, chunkSize: CHUNK_SIZE, total: objectKeys.length, isLastChunk: chunkIdx === Math.ceil(objectKeys.length / CHUNK_SIZE) - 1, currentPath }))
                : objectKeys.map((k, idx, arr) => e(JsonTreeNode, { key: k, keyName: isArray ? undefined : k, value: value[k], isLast: idx === arr.length - 1, level: level + 1, treeState, searchTerm, currentPath: getChildPath(k) }))
            ),
            isObj && expanded && !isEmpty && e("div", { className: "flex items-center" }, e("span", { className: "w-5 inline-block" }), e("span", { className: "text-slate-500 dark:text-slate-400" }, isArray ? "]" : "}", !isLast && ","))
        );
    };

    const JsonTreeChunk = ({ chunkIdx, chunkKeys, value, isArray, level, treeState, searchTerm, chunkSize, total, isLastChunk, currentPath }) => {
        const [expanded, setExpanded] = useState(treeState.action === 'expand' || !!searchTerm);
        useEffect(() => { if (searchTerm) setExpanded(true); }, [searchTerm]);
        const start = chunkIdx * chunkSize, end = Math.min(start + chunkSize - 1, total - 1);
        const getChildPath = (k) => {
            let keyStr = String(k); let isPropValid = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(keyStr);
            if (!currentPath) return isPropValid ? keyStr : `["${keyStr}"]`; 
            if (isArray) return `${currentPath}[${keyStr}]`; return isPropValid ? `${currentPath}.${keyStr}` : `${currentPath}["${keyStr}"]`;
        };
        if (!expanded) return e("div", { className: "flex items-center text-slate-400 hover:text-indigo-500 cursor-pointer text-xs my-1 font-mono", onClick: () => setExpanded(true) }, e("span", { className: "mr-2 inline-block w-4 text-center" }, "▶"), e("span", { className: "bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" }, `[ ${start} ... ${end} ]`));
        return e(Fragment, null, e("div", { className: "flex items-center text-slate-300 dark:text-slate-600 text-xs my-1 cursor-pointer hover:text-indigo-400", onClick: () => setExpanded(false) }, e("span", { className: "mr-2 inline-block w-4 text-center" }, "▼"), `[ ${start} ... ${end} ]`), chunkKeys.map((k, idx) => e(JsonTreeNode, { key: k, keyName: isArray ? undefined : k, value: value[k], isLast: isLastChunk && idx === chunkKeys.length - 1, level, treeState, searchTerm, currentPath: getChildPath(k) })));
    };

    // ==========================================
    // 组件: Diff 视图分段引擎 (防白屏专属技术)
    // ==========================================
    const DiffTreeChunk = ({ chunkIdx, chunkKeys, val, isArr, chunkSize, total, isLastChunk }) => {
        const [expanded, setExpanded] = useState(false); // 默认收起释放内存
        const start = chunkIdx * chunkSize, end = Math.min(start + chunkSize - 1, total - 1);
        
        if (!expanded) return e("div", { className: "flex items-center text-slate-400 hover:text-indigo-500 cursor-pointer text-xs my-1 font-mono", onClick: () => setExpanded(true) }, e("span", { className: "mr-2 inline-block w-4 text-center" }, "▶"), e("span", { className: "bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" }, `[ ${start} ... ${end} ] (有差异折叠项)`));
        return e(Fragment, null, e("div", { className: "flex items-center text-slate-300 dark:text-slate-600 text-xs my-1 cursor-pointer hover:text-indigo-400", onClick: () => setExpanded(false) }, e("span", { className: "mr-2 inline-block w-4 text-center" }, "▼"), `[ ${start} ... ${end} ]`), chunkKeys.map((k, idx) => e(DiffViewerNode, { key: k, keyName: isArr ? `[${k}]` : `"${k}"`, nodeData: val[k], isLast: isLastChunk && idx === chunkKeys.length - 1 })));
    };

    const DiffViewerNode = ({ keyName, nodeData, isLast }) => {
        if (!nodeData) return null;
        const { type, val, oldVal, newVal, isArr } = nodeData;
        const getBg = (t) => {
            if(t==='added') return 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
            if(t==='removed') return 'bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through opacity-70';
            if(t==='changed') return 'bg-yellow-100/50 dark:bg-yellow-900/30';
            return 'text-slate-500 dark:text-slate-400';
        };
        
        if (type === 'equal' || type === 'added' || type === 'removed') {
            // 安全处理大数据字符串展示
            const displayVal = typeof val === 'object' && val !== null ? (isArr ? `Array(${val.length})` : 'Object') : JSON.stringify(val);
            return e("div", { className: `font-mono text-sm pl-4 py-0.5 ${getBg(type)} rounded-sm flex` }, e("span", {className: "w-4 shrink-0 font-bold"}, type === 'added' ? '+' : type === 'removed' ? '-' : ' '), keyName !== undefined && e("span", { className: "font-bold mr-1" }, `${keyName}: `), e("span", {className: "break-all"}, displayVal), !isLast && ",");
        }

        if (type === 'changed') return e("div", { className: "font-mono text-sm flex flex-col pl-4 py-1" }, e("div", { className: "bg-red-100/30 dark:bg-red-900/20 text-red-600 dark:text-red-400 line-through flex rounded-t-sm" }, e("span", {className: "w-4 shrink-0 font-bold"}, '-'), keyName !== undefined && e("span", { className: "mr-1" }, `${keyName}: `), e("span", null, JSON.stringify(oldVal)), !isLast && ","), e("div", { className: "bg-emerald-100/40 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex rounded-b-sm font-bold" }, e("span", {className: "w-4 shrink-0 font-bold"}, '+'), keyName !== undefined && e("span", { className: "mr-1" }, `${keyName}: `), e("span", null, JSON.stringify(newVal)), !isLast && ","));
        
        if (type === 'object') {
            const CHUNK_SIZE = 100;
            const keys = Object.keys(val);
            return e("div", { className: "font-mono text-sm pl-4 py-0.5 flex flex-col" }, 
                e("div", {className: "flex"}, e("span", {className: "w-4 shrink-0"}, ' '), keyName !== undefined && e("span", { className: "font-bold mr-1 text-slate-700 dark:text-slate-300" }, `${keyName}: `), e("span", {className: "text-slate-500"}, isArr ? "[" : "{")), 
                e("div", { className: "pl-2 border-l border-slate-200 dark:border-slate-700 ml-6" }, 
                    keys.length > CHUNK_SIZE 
                    ? Array.from({ length: Math.ceil(keys.length / CHUNK_SIZE) }).map((_, chunkIdx) => e(DiffTreeChunk, { key: chunkIdx, chunkIdx, chunkKeys: keys.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE), val, isArr, chunkSize: CHUNK_SIZE, total: keys.length, isLastChunk: chunkIdx === Math.ceil(keys.length / CHUNK_SIZE) - 1 }))
                    : keys.map((k, idx) => e(DiffViewerNode, { key: k, keyName: isArr ? `[${k}]` : `"${k}"`, nodeData: val[k], isLast: idx === keys.length - 1 }))
                ), 
                e("div", {className: "flex"}, e("span", {className: "w-4 shrink-0 ml-4"}, ' '), e("span", {className: "text-slate-500"}, isArr ? "]" : "}", !isLast && ","))
            );
        } return null;
    };


    // ==========================================
    // 事件交互与核心触发
    // ==========================================
    const processJson = (compress = false, sort = false) => {
        if (!input.trim()) return showToast('请输入 JSON 文本', 'info');
        setIsProcessing(true); workerRef.current.postMessage({ input, compress, sort });
        if(viewMode === 'diff' || viewMode === 'schema') setViewMode('code'); 
    };

    const handleClear = () => {
        setInput(''); setOutputHtml(''); setRawOutput(''); setErrorDetails(null); setIsErrorDismissed(false);
        setParsedData(null); setIsLargeFile(false); setQueryPath(''); setQueryResult(null);
        setSearchInput(''); setTreeSearchTerm(''); setCompareInput(''); setParsedCompareData(null); setSchemaErrors(null);
        localStorage.removeItem('moyer_json_input_pro'); 
        showToast('面板与缓存已清空', 'info');
    };

    const handleQuery = () => {
        if (!parsedData || !queryPath.trim()) { setQueryResult(null); return; }
        const result = safeGetByPath(parsedData, queryPath);
        setQueryResult({ found: result !== undefined, data: result });
    };

    // TS 类型生成 (支持联合类型)
    const generateTypeScript = useMemo(() => {
        if (!parsedData) return "";
        const interfaces = []; const seenNames = new Set(); 
        const getValidName = (base) => {
            let name = base.charAt(0).toUpperCase() + base.slice(1).replace(/[^a-zA-Z0-9]/g, '');
            if (!name) name = "Type"; let finalName = name, count = 1;
            while (seenNames.has(finalName)) { finalName = name + count; count++; }
            seenNames.add(finalName); return finalName;
        };
        const mergeForTypeScript = (target, source) => {
            if (target === null || target === undefined) return source;
            if (source === null || source === undefined) return target;
            if (Array.isArray(target) && Array.isArray(source)) return [...target, ...source]; 
            if (typeof target === 'object' && typeof source === 'object' && !Array.isArray(target) && !Array.isArray(source)) {
                const result = { ...target };
                for (const key in source) {
                    if (key in result) result[key] = mergeForTypeScript(result[key], source[key]); 
                    else result[key] = source[key];
                }
                return result;
            }
            return target;
        };
        function traverse(current, name, optionalKeys = new Set()) {
            if (current === null) return 'any';
            if (Array.isArray(current)) {
                if (current.length === 0) return 'any[]';
                let primitiveTypes = new Set(), hasObject = false, mergedObj = {}, keyPresence = {}, totalObjs = 0;
                current.forEach(item => {
                    if(item === null) primitiveTypes.add('null');
                    else if(typeof item !== 'object') primitiveTypes.add(typeof item);
                    else if(Array.isArray(item)) primitiveTypes.add('any[]');
                    else {
                        hasObject = true; totalObjs++;
                        Object.keys(item).forEach(k => {
                            keyPresence[k] = (keyPresence[k] || 0) + 1;
                            mergedObj[k] = mergeForTypeScript(mergedObj[k], item[k]);
                        });
                    }
                });
                let optKeys = new Set();
                Object.keys(keyPresence).forEach(k => { if(keyPresence[k] < totalObjs) optKeys.add(k); });
                if (hasObject) primitiveTypes.add(traverse(mergedObj, name + 'Item', optKeys));
                if (primitiveTypes.size === 1) return Array.from(primitiveTypes)[0] + '[]';
                return `(${Array.from(primitiveTypes).join(' | ')})[]`; 
            }
            if (typeof current === 'object') {
                const typeName = getValidName(name); let fields = [];
                for (let key in current) {
                    let propName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
                    let isOptional = optionalKeys.has(key) ? '?' : ''; 
                    fields.push(`  ${propName}${isOptional}: ${traverse(current[key], key)};`);
                }
                interfaces.push(`export interface ${typeName} {\n${fields.join('\n')}\n}`);
                return typeName;
            }
            return typeof current;
        }
        traverse(parsedData, "Root");
        return interfaces.reverse().join('\n\n'); 
    }, [parsedData]);

    // 修复点：将 Diff 计算从 Render 周期中剥离出来，并增加异常捕获
    const diffResult = useMemo(() => {
        if (!parsedData || !parsedCompareData || viewMode !== 'diff') return null;
        try {
            return generateDiff(parsedData, parsedCompareData);
        } catch (err) {
            console.error("Diff computation failed:", err);
            return { type: 'error', message: err.message };
        }
    }, [parsedData, parsedCompareData, viewMode, generateDiff]);


    const getLineNumbers = (text) => Array.from({ length: Math.max(text.split('\n').length, 1) }, (_, i) => i + 1).join('\n');
    
    // ==========================================
    // UI 渲染树
    // ==========================================
    return e("div", { className: "min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 md:p-8 font-sans transition-colors duration-300 flex flex-col" },
        
        e("div", { className: "max-w-[1600px] w-full mx-auto mb-6 flex items-center justify-between shrink-0" },
            e("div", null,
                e("h1", { className: "text-2xl md:text-3xl font-bold flex items-center gap-3 text-slate-800 dark:text-white" },
                    e(FileText, { className: "text-amber-500", size: 32 }), "JSON 工具箱 PRO MAX"
                ),
                e("p", { className: "text-sm md:text-base text-slate-500 dark:text-slate-400 mt-2 font-medium" }, "LCS 对比算法 · 文件拖拽导入 · 就地编辑 · Schema 校验")
            ),
            e("button", { onClick: () => window.location.href = '?', className: "px-4 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2 font-bold backdrop-blur-md" }, e(X, { size: 18 }), e("span", { className: "hidden sm:inline" }, "关闭工具"))
        ),

        e("div", { className: "max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px] pb-10" },
            
            e("div", { 
                onDragOver: e => { e.preventDefault(); setIsDragging(true); },
                onDragLeave: e => { e.preventDefault(); setIsDragging(false); },
                onDrop: e => { e.preventDefault(); setIsDragging(false); handleFileUpload(e); },
                className: `flex-[4] flex flex-col glass-panel rounded-2xl border ${isDragging ? 'border-indigo-500 shadow-indigo-500/20' : 'border-white/50 dark:border-slate-700/50'} shadow-xl overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl relative transition-all` 
            },
                isDragging && e("div", { className: "absolute inset-0 bg-indigo-500/10 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-indigo-500 m-2 rounded-xl text-indigo-600 font-bold text-xl" }, e(Download, { size: 48, className: "mb-4 animate-bounce" }), "释放鼠标导入 JSON 文件"),
                
                e("div", { className: "p-3 border-b border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-2" },
                    e("div", { className: "flex items-center gap-2" },
                        e("span", { className: "text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2" }, e(LayoutGrid, { size: 16 }), viewMode === 'diff' ? "旧数据 (Original)" : "数据源"),
                        viewMode !== 'diff' && e("select", { onChange: (e) => { convertToJson(e.target.value); e.target.value=''; }, className: "text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-pointer" }, e("option", {value: "", hidden: true}, "转换格式..."), e("option", {value: "url"}, "URL Params 转 JSON"), e("option", {value: "yaml_basic"}, "精简 YAML 转 JSON"))
                    ),
                    e("div", { className: "flex items-center gap-1.5" },
                        e("button", { onClick: () => fileInputRef.current.click(), className: "px-2 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:text-indigo-600 flex items-center gap-1" }, e(IconUpload, {size:12}), "导入"),
                        e("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, accept: ".json,.txt", className: "hidden" }),
                        e("button", { onClick: handleEscape, className: "px-2 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:text-indigo-600" }, "转义"),
                        e("button", { onClick: handleUnescape, className: "px-2 py-1.5 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:text-indigo-600" }, "反转义"),
                        e("div", { className: "w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" }),
                        e("button", { onClick: handleClear, className: "p-1.5 text-slate-500 hover:text-red-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-300 rounded-lg shadow-sm" }, e(X, { size: 14 }))
                    )
                ),
                
                e("div", { className: "flex-1 flex overflow-hidden relative" },
                    e("div", { ref: lineNumRef, className: "w-10 shrink-0 bg-slate-100/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 text-right pr-2 pt-4 pb-4 font-mono text-xs leading-relaxed text-slate-400 select-none hidden sm:block", style: { whiteSpace: 'pre' } }, getLineNumbers(input)),
                    e("textarea", {
                        onScroll: (e) => lineNumRef.current && (lineNumRef.current.scrollTop = e.target.scrollTop),
                        wrap: "off", className: "flex-1 w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-xs md:text-sm leading-relaxed custom-scrollbar",
                        style: { whiteSpace: 'pre !important', overflowWrap: 'normal', wordWrap: 'normal' },
                        placeholder: "在此粘贴待处理的 JSON 字符串或直接将文件拖拽至此...", value: input, onChange: (e) => setInput(e.target.value), spellCheck: "false"
                    })
                ),

                viewMode === 'diff' && e(Fragment, null, 
                    e("div", { className: "p-2 border-y border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 flex items-center" }, e("span", { className: "text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2" }, e(Plus, { size: 16 }), "新数据 (Compare Target)")),
                    e("div", { className: "flex-1 flex overflow-hidden relative" },
                        e("div", { ref: compareLineNumRef, className: "w-10 shrink-0 bg-slate-100/50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 text-right pr-2 pt-4 pb-4 font-mono text-xs leading-relaxed text-slate-400 select-none hidden sm:block", style: { whiteSpace: 'pre' } }, getLineNumbers(compareInput)),
                        e("textarea", {
                            onScroll: (e) => compareLineNumRef.current && (compareLineNumRef.current.scrollTop = e.target.scrollTop),
                            wrap: "off", className: "flex-1 w-full h-full p-4 bg-transparent outline-none resize-none font-mono text-xs md:text-sm leading-relaxed custom-scrollbar",
                            style: { whiteSpace: 'pre !important', overflowWrap: 'normal', wordWrap: 'normal' },
                            placeholder: "在此粘贴用于对比的新 JSON...", value: compareInput, onChange: (e) => setCompareInput(e.target.value), spellCheck: "false"
                        })
                    )
                )
            ),

            e("div", { className: "flex lg:flex-col justify-center gap-3 shrink-0" },
                e("button", { onClick: () => processJson(false, false), disabled: isProcessing, className: "flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 lg:py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50" }, e(FileText, { size: 20 }), e("span", { className: "lg:hidden xl:inline" }, "解析美化")),
                e("button", { onClick: () => processJson(false, true), disabled: isProcessing, className: "flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 lg:py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50" }, e(IconSort, { size: 20 }), e("span", { className: "lg:hidden xl:inline" }, "排序美化")),
                e("button", { onClick: () => processJson(true, false), disabled: isProcessing, className: "flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 lg:py-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-black text-white font-bold shadow-lg shadow-slate-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50" }, e(IconCompress, { size: 20 }), e("span", { className: "lg:hidden xl:inline" }, "一键压缩"))
            ),

            e("div", { className: "flex-[5] flex flex-col glass-panel rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl overflow-hidden bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl relative" },
                e("div", { className: "p-2 border-b border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar" },
                    e("div", { className: "flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0" },
                        [ { id: 'code', icon: FileText, label: '代码' }, { id: 'tree', icon: IconTree, label: '结构树' }, { id: 'ts', icon: IconType, label: 'TS 类型' }, { id: 'query', icon: Search, label: '条件提取' }, { id: 'diff', icon: IconDiff, label: 'Diff 对比' }, { id: 'schema', icon: IconSchema, label: 'Schema 验证' }
                        ].map(tab => e("button", { key: tab.id, onClick: () => setViewMode(tab.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${viewMode === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}` }, e(tab.icon, { size: 14 }), tab.label))
                    ),
                    e("div", { className: "flex items-center gap-1.5 shrink-0" },
                        e("button", { onClick: handleExportFile, className: "px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-teal-600 rounded-lg transition-all flex items-center gap-1.5 shadow-sm" }, e(Download, { size: 14 }), e("span", { className: "hidden sm:inline" }, "导出文件")),
                        e("button", { onClick: async () => { const t = viewMode==='ts'?generateTypeScript : viewMode==='query'?JSON.stringify(queryResult?.data,null,2) : rawOutput; globalCopyToClipboard(t); showToast('已复制'); }, className: "px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-md" }, e(Copy, { size: 14 }), e("span", { className: "hidden sm:inline" }, "复制输出"))
                    )
                ),
                
                errorDetails && !isErrorDismissed && e("div", { className: "absolute top-[52px] left-0 w-full p-3 bg-red-500/95 backdrop-blur-md text-white text-xs font-mono shadow-md z-20 flex items-start justify-between gap-2" }, e("div", { className: "flex items-start gap-2 flex-1" }, e(Info, { size: 18, className: "shrink-0 mt-0.5" }), e("div", { className: "flex flex-col gap-1" }, errorDetails.line && e("span", { className: "font-black bg-white/20 px-2 py-0.5 rounded w-max" }, `🚨 第 ${errorDetails.line} 行, 第 ${errorDetails.col} 列`), e("span", { className: "break-all font-bold" }, errorDetails.message))), e("button", { onClick: () => setIsErrorDismissed(true), className: "shrink-0 p-1 hover:bg-white/20 rounded" }, e(X, { size: 16 }))),

                e("div", { className: "flex-1 w-full relative overflow-hidden bg-[#fbfbfb] dark:bg-[#0d1117] rounded-b-2xl flex flex-col" },
                    
                    viewMode === 'code' && e(Fragment, null, 
                        isProcessing && e("div", { className: "absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10" }, e("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" })),
                        isLargeFile ? e("textarea", { readOnly: true, value: rawOutput, className: "w-full h-full p-4 font-mono text-sm custom-scrollbar bg-transparent outline-none resize-none" }) : e("pre", { className: "w-full h-full p-4 overflow-auto font-mono text-sm custom-scrollbar leading-relaxed", dangerouslySetInnerHTML: { __html: outputHtml || '<span class="text-slate-400/50 italic">请先在左侧输入并点击处理按钮...</span>' } })
                    ),

                    viewMode === 'tree' && e("div", { className: "w-full h-full flex flex-col bg-white dark:bg-[#0d1117]" },
                        parsedData && e("div", { className: "px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50" }, e("div", { className: "relative w-48 lg:w-64" }, e(Search, { size: 14, className: "absolute left-2.5 top-2 text-slate-400" }), e("input", { type: "text", placeholder: "搜索节点...", value: searchInput, onChange: e => setSearchInput(e.target.value), className: "w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md outline-none focus:border-indigo-400" })), e("div", { className: "flex gap-2" }, e("button", { onClick: () => { setSearchInput(''); setTreeSearchTerm(''); setTreeState({ id: Date.now(), action: 'expand' }); }, className: "px-3 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:text-indigo-600" }, "全展开"), e("button", { onClick: () => { setSearchInput(''); setTreeSearchTerm(''); setTreeState({ id: Date.now(), action: 'collapse' }); }, className: "px-3 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-md shadow-sm hover:text-indigo-600" }, "全折叠"))),
                        e("div", { className: "flex-1 p-4 overflow-auto custom-scrollbar" }, !parsedData ? e("span", { className: "text-slate-400/50 italic font-mono text-sm" }, "等待解析树结构...") : e(JsonTreeNode, { key: treeState.id, value: parsedData, isLast: true, treeState, searchTerm: treeSearchTerm, currentPath: "" }))
                    ),

                    viewMode === 'ts' && e("div", { className: "w-full h-full p-4 overflow-auto custom-scrollbar" }, !parsedData ? e("span", { className: "text-slate-400/50 italic font-mono text-sm" }, "等待生成...") : e("pre", { className: "font-mono text-sm text-indigo-600 dark:text-indigo-400 leading-relaxed" }, generateTypeScript)),

                    viewMode === 'query' && e("div", { className: "w-full h-full flex flex-col bg-slate-50 dark:bg-[#0d1117]" },
                        e("div", { className: "p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2" }, e("input", { type: "text", value: queryPath, onChange: e => setQueryPath(e.target.value), onKeyDown: e => e.key === 'Enter' && handleQuery(), placeholder: '高级提取如: users[?age>18].name', className: "flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none outline-none font-mono text-sm" }), e("button", { onClick: handleQuery, className: "px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm" }, "提取")),
                        e("div", { className: "flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm" }, !parsedData ? e("span", { className: "text-slate-400/50 italic" }, "请先输入数据") : !queryResult ? e("span", { className: "text-slate-400/50 italic" }, "在此查看高级提取结果") : !queryResult.found ? e("span", { className: "text-red-500 font-bold" }, "未找到匹配数据") : e("div", { className: "bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm" }, e(JsonTreeNode, { value: queryResult.data, isLast: true, treeState: {action: 'expand'} })))
                    ),

                    viewMode === 'diff' && e("div", { className: "w-full h-full flex flex-col bg-white dark:bg-[#0d1117]" },
                        (!parsedData || !parsedCompareData) ? e("div", { className: "flex-1 flex items-center justify-center p-4 text-center text-slate-400 italic font-mono text-sm" }, "请确保左侧【旧数据】与【新数据】均已输入，系统将自动使用 LCS 算法比对差异。") :
                        (() => {
                            if (!diffResult) return e("div", { className: "flex-1 flex items-center justify-center" }, "计算对比中...");
                            if (diffResult.type === 'error') return e("div", { className: "flex-1 flex items-center justify-center text-red-500 font-mono" }, `对比计算出错: ${diffResult.message}`);
                            if (diffResult.type === 'equal') return e("div", { className: "flex-1 flex items-center justify-center p-10" }, e("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex flex-col items-center gap-4 shadow-sm" }, e(Check, { size: 48 }), e("span", { className: "text-lg font-bold" }, "🎉 完美！两份数据完全一致")));
                            return e("div", { className: "flex-1 p-4 overflow-auto custom-scrollbar" }, e(DiffViewerNode, { nodeData: diffResult, isLast: true }));
                        })()
                    ),

                    viewMode === 'schema' && e("div", { className: "w-full h-full flex flex-col bg-slate-50 dark:bg-[#0d1117]" },
                        e("div", { className: "h-1/2 border-b border-slate-200 dark:border-slate-700 flex flex-col" },
                            e("div", { className: "p-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 flex justify-between items-center" }, 
                                "在此配置 JSON Schema 规则：", 
                                e("button", { onClick: runSchemaValidation, className: "px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm" }, "立即验证")
                            ),
                            e("textarea", { value: schemaInput, onChange: e => setSchemaInput(e.target.value), className: "flex-1 w-full p-4 font-mono text-sm resize-none outline-none bg-white dark:bg-[#0d1117] custom-scrollbar", spellCheck: false })
                        ),
                        e("div", { className: "flex-1 p-4 overflow-auto custom-scrollbar font-mono text-sm" },
                            !schemaErrors ? e("span", { className: "text-slate-400 italic" }, "点击右上角按钮进行验证") :
                            schemaErrors.length === 0 ? e("div", { className: "text-emerald-600 font-bold flex items-center gap-2" }, e(Check, { size: 18 }), "校验通过！当前数据符合 Schema 规范。") :
                            e("div", { className: "text-red-500 flex flex-col gap-2" }, e("div", { className: "font-bold mb-2 flex items-center gap-2" }, e(X, { size: 18 }), `发现 ${schemaErrors.length} 个校验错误：`), schemaErrors.map((err, i) => e("div", { key: i, className: "bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-800/50" }, "🔴 ", err)))
                        )
                    )
                )
            )
        )
    );
};
