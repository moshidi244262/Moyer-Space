// 挂载到全局工具空间
window.AppTools = window.AppTools || {};

window.AppTools.HashCalc = ({ showToast }) => {
    // 解构全局 React 钩子
    const { useState, useEffect, useCallback, useRef } = window.React || React;
    const e = (window.React || React).createElement;
    
    // 如果系统自带的 motion 存在就使用，否则 fallback 为普通的 div
    const motion = window.Motion ? window.Motion.motion : { div: 'div' };

    // 辅助函数：处理图标的统一属性，解决 SVG 缺少宽高导致异常放大的问题
    const getIconProps = (p) => {
        const { size = 24, className = "", ...rest } = p;
        return { 
            ...rest, 
            width: size, 
            height: size, 
            viewBox: "0 0 24 24", 
            fill: "none", 
            stroke: "currentColor", 
            strokeWidth: "2", 
            strokeLinecap: "round", 
            strokeLinejoin: "round", 
            className 
        };
    };

    // --- 组件内部独立使用的 Icons ---
    const LocalIcons = {
        Shield: p => e("svg", getIconProps(p), e("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
        FileText: p => e("svg", getIconProps(p), e("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("line", { x1: "16", x2: "8", y1: "13", y2: "13" }), e("line", { x1: "16", x2: "8", y1: "17", y2: "17" }), e("line", { x1: "10", x2: "8", y1: "9", y2: "9" })),
        Upload: p => e("svg", getIconProps(p), e("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), e("polyline", { points: "17 8 12 3 7 8" }), e("line", { x1: "12", x2: "12", y1: "3", y2: "15" })),
        File: p => e("svg", getIconProps(p), e("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }), e("polyline", { points: "14 2 14 8 20 8" })),
        FileArchive: p => e("svg", getIconProps(p), e("path", { d: "M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" }), e("polyline", { points: "14 2 14 8 20 8" }), e("path", { d: "M10 12v.01" }), e("path", { d: "M10 16v.01" }), e("path", { d: "M10 20v.01" }), e("path", { d: "M14 16v.01" }), e("path", { d: "M14 20v.01" })),
        FileImage: p => e("svg", getIconProps(p), e("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("circle", { cx: "10", cy: "13", r: "2" }), e("path", { d: "m20 17-1.09-1.09a2 2 0 0 0-2.82 0L10 22" })),
        Terminal: p => e("svg", getIconProps(p), e("polyline", { points: "4 17 10 11 4 5" }), e("line", { x1: "12", x2: "20", y1: "19", y2: "19" })),
        Copy: p => e("svg", getIconProps(p), e("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }), e("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })),
        Check: p => e("svg", getIconProps(p), e("polyline", { points: "20 6 9 17 4 12" })),
        CheckCircle: p => e("svg", getIconProps(p), e("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }), e("polyline", { points: "22 4 12 14.01 9 11.01" })),
        XCircle: p => e("svg", getIconProps(p), e("circle", { cx: "12", cy: "12", r: "10" }), e("line", { x1: "15", x2: "9", y1: "9", y2: "15" }), e("line", { x1: "9", x2: "15", y1: "9", y2: "15" })),
        RefreshCw: p => e("svg", getIconProps(p), e("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), e("path", { d: "M3 3v5h5" }))
    };

    // --- 状态定义 ---
    const [scriptsLoaded, setScriptsLoaded] = useState(false);
    
    // 文本相关
    const [textInput, setTextInput] = useState("");
    const [textHash, setTextHash] = useState({ md5: "", sha1: "", sha256: "", sha512: "" });
    
    // 文件相关
    const [file, setFile] = useState(null);
    const [fileHash, setFileHash] = useState({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "idle" }); 
    const [isDragging, setIsDragging] = useState(false);
    const [compareHash, setCompareHash] = useState("");
    
    const workerRef = useRef(null);
    const [copiedKey, setCopiedKey] = useState(null);

    // --- 辅助函数 ---
    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (filename) => {
        if (!filename) return LocalIcons.File;
        const ext = filename.split('.').pop().toLowerCase();
        if (['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(ext)) return LocalIcons.FileArchive;
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return LocalIcons.FileImage;
        if (['exe', 'msi', 'sh', 'bat', 'cmd', 'apk'].includes(ext)) return LocalIcons.Terminal;
        return LocalIcons.File;
    };

    const handleCopy = async (text, id) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed"; textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        setCopiedKey(id);
        showToast("哈希值已复制", "success");
        setTimeout(() => setCopiedKey(null), 1500);
    };

    const handleClearText = () => {
        setTextInput("");
        setTextHash({ md5: "", sha1: "", sha256: "", sha512: "" });
    };

    const handleClearFile = () => {
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }
        setFile(null);
        setFileHash({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "idle" });
        setCompareHash("");
    };

    // --- 动态加载依赖 & 解决路径兼容 ---
    useEffect(() => {
        const basePath = window.location.pathname.replace(/\/[^\/]*$/, '/');
        const getAbsoluteUrl = (relPath) => new URL(basePath + relPath, window.location.href).href;

        const loadScript = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement("script");
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error(`无法加载脚本: ${src}`));
            document.head.appendChild(s);
        });

        // 保存绝对路径到 window 上供 Web Worker 使用
        window.__HASH_LIBS = [
            getAbsoluteUrl("lib/spark-md5.min.js"),
            getAbsoluteUrl("lib/crypto-js.min.js")
        ];

        Promise.all(window.__HASH_LIBS.map(loadScript))
        .then(() => setScriptsLoaded(true))
        .catch(err => {
            console.error(err);
            showToast("依赖库加载失败，请检查 lib 目录下是否存在对应JS文件", "error");
        });

        return () => {
            if (workerRef.current) workerRef.current.terminate();
        };
    }, []);

    // --- 文本哈希实时计算 (防抖优化) ---
    useEffect(() => {
        if (!scriptsLoaded) return;
        if (!textInput) {
            setTextHash({ md5: "", sha1: "", sha256: "", sha512: "" });
            return;
        }
        const timer = setTimeout(() => {
            const md5 = window.SparkMD5.hash(textInput);
            const sha1 = window.CryptoJS.SHA1(textInput).toString();
            const sha256 = window.CryptoJS.SHA256(textInput).toString();
            const sha512 = window.CryptoJS.SHA512(textInput).toString();
            setTextHash({ md5, sha1, sha256, sha512 });
        }, 300);
        return () => clearTimeout(timer);
    }, [textInput, scriptsLoaded]);

    // --- 大文件切片计算 (Web Worker 工业级方案) ---
    const calculateFileHash = (selectedFile) => {
        if (!selectedFile) return;
        if (!scriptsLoaded) {
            showToast("依赖库尚未加载完毕，请稍后再试", "error");
            return;
        }
        
        if (workerRef.current) workerRef.current.terminate();
        
        setFileHash({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "hashing" });
        
        // 构建内联 Web Worker
        const workerCode = `
            self.onmessage = async function(e) {
                const { file, libUrls } = e.data;
                try {
                    // 在子线程导入库文件
                    self.importScripts(...libUrls);
                    
                    const sparkMd5 = new self.SparkMD5.ArrayBuffer();
                    const sha1Algo = self.CryptoJS.algo.SHA1.create();
                    const sha256Algo = self.CryptoJS.algo.SHA256.create();
                    const sha512Algo = self.CryptoJS.algo.SHA512.create();

                    const chunkSize = 5 * 1024 * 1024; // 2MB 切片
                    let offset = 0;

                    while (offset < file.size) {
                        const chunk = file.slice(offset, offset + chunkSize);
                        const buffer = await chunk.arrayBuffer();
                        
                        sparkMd5.append(buffer);
                        const wordArr = self.CryptoJS.lib.WordArray.create(buffer);
                        sha1Algo.update(wordArr);
                        sha256Algo.update(wordArr);
                        sha512Algo.update(wordArr);

                        offset += buffer.byteLength;
                        
                        // 定期向主线程发送进度
                        const progress = Math.min(100, Math.round((offset / file.size) * 100));
                        self.postMessage({ type: 'progress', progress });
                    }

                    self.postMessage({
                        type: 'done',
                        result: {
                            md5: sparkMd5.end(),
                            sha1: sha1Algo.finalize().toString(),
                            sha256: sha256Algo.finalize().toString(),
                            sha512: sha512Algo.finalize().toString()
                        }
                    });
                } catch (err) {
                    self.postMessage({ type: 'error', error: err.message });
                }
            };
        `;

        try {
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            workerRef.current = worker;

            worker.onmessage = (e) => {
                const { type, progress, result, error } = e.data;
                if (type === 'progress') {
                    setFileHash(prev => ({ ...prev, progress }));
                } else if (type === 'done') {
                    setFileHash({ ...result, progress: 100, status: "done" });
                    showToast("文件提取完成，界面无卡顿", "success");
                    URL.revokeObjectURL(workerUrl);
                } else if (type === 'error') {
                    console.error("Worker Error:", error);
                    setFileHash({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "error" });
                    showToast("计算出错: " + error, "error");
                    URL.revokeObjectURL(workerUrl);
                }
            };

            worker.onerror = (err) => {
                console.error("Worker Execution Error:", err);
                setFileHash({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "error" });
                showToast("Worker 运行异常，可能是 CSP 策略限制", "error");
            };

            // 发送数据给 Worker 开始计算
            worker.postMessage({ file: selectedFile, libUrls: window.__HASH_LIBS });

        } catch (e) {
            console.error("Failed to create Web Worker:", e);
            showToast("浏览器环境限制了 Web Worker，请检查配置", "error");
            setFileHash({ md5: "", sha1: "", sha256: "", sha512: "", progress: 0, status: "error" });
        }
    };

    // --- 事件处理 ---
    const onFileSelect = (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
            setFile(f);
            calculateFileHash(f);
        }
        e.target.value = '';
    };

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const f = e.dataTransfer.files[0];
            setFile(f);
            calculateFileHash(f);
        }
    };

    // --- 可复用的哈希展示行组件 ---
    const HashResultRow = (label, value, uniqueId) => {
        const isCopied = copiedKey === uniqueId;
        return e("div", { className: "flex flex-col gap-1.5 mt-3" },
            e("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1" }, label),
            e("div", { className: "flex items-center gap-2 group" },
                e("input", { 
                    readOnly: true, 
                    value: value || "", 
                    placeholder: "等待计算结果...", 
                    className: "flex-1 px-4 py-2 text-sm font-mono rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 outline-none text-slate-700 dark:text-slate-300 transition-all focus:border-purple-400 dark:focus:border-purple-500 shadow-sm" 
                }),
                e("button", {
                    onClick: () => handleCopy(value, uniqueId),
                    disabled: !value,
                    title: "复制",
                    className: `p-2 rounded-xl transition-all flex items-center justify-center transform-gpu ${
                        value 
                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-600 dark:bg-purple-900/40 dark:hover:bg-purple-800/60 dark:text-purple-400 hover:scale-[1.05] active:scale-[0.95] cursor-pointer shadow-sm' 
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed opacity-70'
                    }`
                }, isCopied ? e(LocalIcons.Check, { size: 16 }) : e(LocalIcons.Copy, { size: 16 }))
            )
        );
    };

    // --- 校验状态计算 ---
    const isComparing = compareHash.trim().length > 0;
    const matchKey = isComparing ? ['md5', 'sha1', 'sha256', 'sha512'].find(k => fileHash[k] && fileHash[k].toLowerCase() === compareHash.trim().toLowerCase()) : null;
    const isMatch = !!matchKey;

    // --- 页面渲染 ---
    return e(motion.div, { 
        initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 },
        className: "h-full w-full flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar" 
    },
        // 头部标题
        e("div", { className: "flex items-center gap-4 mb-8" },
            e("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 shrink-0" },
                e(LocalIcons.Shield, { size: 24 })
            ),
            e("div", null,
                e("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white" }, "指纹核对中心"),
                e("p", { className: "text-sm text-slate-500 dark:text-slate-400 mt-1" }, "支持 Web Worker 的高性能哈希计算与文件校验引擎")
            )
        ),
        
        // 主体双列布局
        e("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12" },
            
            // 左侧：文本哈希
            e("div", { className: "glass-panel p-6 sm:p-8 rounded-3xl flex flex-col relative overflow-hidden group shadow-xl h-fit" },
                e("div", { className: "absolute -right-10 -top-10 w-40 h-40 bg-purple-500 opacity-5 dark:opacity-10 rounded-full blur-3xl pointer-events-none transition-all group-hover:opacity-10 dark:group-hover:opacity-20" }),
                
                e("div", { className: "flex justify-between items-center mb-4" },
                    e("h2", { className: "text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2" }, 
                        e(LocalIcons.FileText, { size: 20, className: "text-purple-500" }), "文本特征提取"
                    ),
                    e("button", {
                        onClick: handleClearText,
                        title: "清空内容",
                        className: "p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                    }, e(LocalIcons.RefreshCw, { size: 16 }))
                ),

                e("textarea", {
                    className: "w-full h-32 p-4 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-300 resize-none transition-all focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400 custom-scrollbar text-sm shadow-inner mb-2",
                    placeholder: "在此输入需要计算哈希的文本...",
                    value: textInput,
                    onChange: (e) => setTextInput(e.target.value)
                }),
                
                HashResultRow("MD5", textHash.md5, "text-md5"),
                HashResultRow("SHA-1", textHash.sha1, "text-sha1"),
                HashResultRow("SHA-256", textHash.sha256, "text-sha256"),
                HashResultRow("SHA-512", textHash.sha512, "text-sha512")
            ),
            
            // 右侧：文件哈希与校验
            e("div", { className: "glass-panel p-6 sm:p-8 rounded-3xl flex flex-col relative overflow-hidden group shadow-xl h-fit" },
                 e("div", { className: "absolute -left-10 -bottom-10 w-40 h-40 bg-pink-500 opacity-5 dark:opacity-10 rounded-full blur-3xl pointer-events-none transition-all group-hover:opacity-10 dark:group-hover:opacity-20" }),
                 
                 e("div", { className: "flex justify-between items-center mb-4" },
                    e("h2", { className: "text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2" }, 
                        e(LocalIcons.Upload, { size: 20, className: "text-pink-500" }), "文件安全校验"
                    ),
                    e("button", {
                        onClick: handleClearFile,
                        title: "重置文件与对比结果",
                        className: "p-2 text-slate-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/30 rounded-full transition-colors"
                    }, e(LocalIcons.RefreshCw, { size: 16 }))
                 ),
                 
                 // 拖拽上传区域
                 e("label", {
                     onDragOver: handleDragOver,
                     onDragLeave: handleDragLeave,
                     onDrop: handleDrop,
                     className: `relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden ${
                        isDragging ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-600 hover:border-purple-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                     }`
                 },
                     e("div", { className: "flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none z-10" },
                         e(LocalIcons.Upload, { size: 32, className: `mb-3 transition-colors duration-300 ${isDragging ? 'text-pink-500' : 'text-slate-400'}` }),
                         e("p", { className: "mb-1 text-sm text-slate-600 dark:text-slate-300" }, 
                            e("span", { className: "font-bold text-purple-600 dark:text-purple-400" }, "点击选择文件"), " 或拖动到此处"
                         )
                     ),
                     fileHash.status === 'hashing' && e("div", { 
                        className: "absolute bottom-0 left-0 h-full bg-purple-500/5 dark:bg-purple-500/10 pointer-events-none transition-all duration-300",
                        style: { width: `${fileHash.progress}%` }
                     }),
                     e("input", { type: "file", className: "hidden", onChange: onFileSelect })
                 ),
                 
                 // 文件信息展示
                 file && e("div", { className: "p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2 mt-4 shadow-sm" },
                     e("div", { className: "flex items-center justify-between" },
                         e("div", { className: "flex items-center gap-2 overflow-hidden flex-1 mr-3" },
                             // 动态图标展示
                             e("div", { className: "text-purple-500 flex-shrink-0" }, e(getFileIcon(file.name), { size: 18 })),
                             e("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-200 truncate" }, file.name)
                         ),
                         e("span", { className: "text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex-shrink-0" }, formatBytes(file.size))
                     ),
                     // 进度条
                     (fileHash.status === 'hashing') && e("div", { className: "w-full mt-1" },
                         e("div", { className: "flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1" },
                             e("span", null, "Web Worker 线程加速计算中..."),
                             e("span", { className: "text-purple-500" }, `${fileHash.progress}%`)
                         ),
                         e("div", { className: "w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden" },
                             e("div", { 
                                 className: "bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out", 
                                 style: { width: `${fileHash.progress}%` } 
                             })
                         )
                     )
                 ),
                 
                 e("div", { className: file ? "mt-1" : "mt-2 opacity-50 pointer-events-none transition-opacity duration-500" },
                    HashResultRow("MD5", fileHash.md5, "file-md5"),
                    HashResultRow("SHA-1", fileHash.sha1, "file-sha1"),
                    HashResultRow("SHA-256", fileHash.sha256, "file-sha256"),
                    HashResultRow("SHA-512", fileHash.sha512, "file-sha512")
                 ),

                 // --- 专属哈希比对校验框 ---
                 e("div", { className: `mt-6 pt-5 border-t border-slate-200 dark:border-slate-700 transition-all duration-500 ${fileHash.status === 'done' ? 'opacity-100 transform translate-y-0' : 'opacity-40 pointer-events-none transform translate-y-2'}` },
                    e("label", { className: "text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2" }, "官方校验对比 (粘贴官网指纹以验证一致性)"),
                    e("div", { className: "flex flex-col gap-3" },
                        e("div", { className: "relative flex items-center" },
                            e("input", { 
                                type: "text",
                                value: compareHash,
                                onChange: (e) => setCompareHash(e.target.value),
                                placeholder: "粘贴 MD5 / SHA-1 / SHA-256 / SHA-512...",
                                className: `w-full pl-4 pr-10 py-3 text-sm font-mono rounded-xl bg-white/60 dark:bg-slate-900/60 border outline-none transition-all shadow-sm ${
                                    !isComparing ? 'border-slate-200 dark:border-slate-700 focus:border-purple-400 text-slate-700 dark:text-slate-300' :
                                    isMatch ? 'border-emerald-500 focus:border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 
                                    'border-red-400 focus:border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20'
                                }` 
                            }),
                            isComparing && e("div", { className: `absolute right-3 ${isMatch ? 'text-emerald-500' : 'text-red-500'}` },
                                isMatch ? e(LocalIcons.CheckCircle, { size: 20 }) : e(LocalIcons.XCircle, { size: 20 })
                            )
                        ),
                        isComparing && e("div", { className: `text-sm font-bold flex items-center gap-1.5 ${isMatch ? 'text-emerald-500' : 'text-red-500'}` },
                            isMatch ? `校验成功！与本地 ${matchKey.toUpperCase()} 指纹完全一致，文件安全。` : "警告：指纹不符！文件可能已被篡改或损坏。"
                        )
                    )
                 )
            )
        )
    );
};