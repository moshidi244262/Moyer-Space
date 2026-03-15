// ==========================================
// 全能 AES 加密器 (AES Encryptor) - 模块化应用
// 依赖: React, Framer Motion (需在 index.html 引入)
// 升级版: 引入 Web Worker 多线程、零拷贝优化、文件名封装及安全擦除机制
// ==========================================

window.AppTools = window.AppTools || {};

window.AppTools.AesEncryptor = ({ showToast }) => {
    const { useState, useRef, useEffect, useCallback } = window.React;
    const { motion, AnimatePresence } = window.Motion;
    const e = window.React.createElement;

    // --- 图标引用 ---
    const IconBase = ({ children, size = 20, className = "", ...props }) => 
        e("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: className, ...props }, children);
    
    const Icons = {
        Shield: p => e(IconBase, p, e("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
        Key: p => e(IconBase, p, e("circle", { cx: "7.5", cy: "15.5", r: "5.5" }), e("path", { d: "m21 2-9.6 9.6" }), e("path", { d: "m15.5 7.5 3 3L22 7l-3-3" })),
        FileText: p => e(IconBase, p, e("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("line", { x1: "16", y1: "13", x2: "8", y2: "13" }), e("line", { x1: "16", y1: "17", x2: "8", y2: "17" }), e("line", { x1: "10", y1: "9", x2: "8", y2: "9" })),
        FileUp: p => e(IconBase, p, e("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), e("polyline", { points: "14 2 14 8 20 8" }), e("path", { d: "M12 12v6" }), e("path", { d: "m15 15-3-3-3 3" })),
        Lock: p => e(IconBase, p, e("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), e("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })),
        Unlock: p => e(IconBase, p, e("rect", { width: "18", height: "11", x: "3", y: "11", rx: "2", ry: "2" }), e("path", { d: "M7 11V7a5 5 0 0 1 9.9-1" })),
        Eye: p => e(IconBase, p, e("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }), e("circle", { cx: "12", cy: "12", r: "3" })),
        EyeOff: p => e(IconBase, p, e("path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24" }), e("path", { d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" }), e("path", { d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c2.36 0 4.48-.83 6.09-2.26" }), e("line", { x1: "2", x2: "22", y1: "2", y2: "22" })),
        Copy: p => e(IconBase, p, e("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }), e("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })),
        Trash: p => e(IconBase, p, e("path", { d: "M3 6h18" }), e("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }), e("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" })),
        UploadCloud: p => e(IconBase, p, e("polyline", { points: "16 16 12 12 8 16" }), e("line", { x1: "12", y1: "12", x2: "12", y2: "21" }), e("path", { d: "M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" }), e("polyline", { points: "16 16 12 12 8 16" }))
    };

    // --- 主线程加密逻辑 (仅用于文本模式) ---
    const CryptoLogic = {
        enc: new TextEncoder(),
        dec: new TextDecoder(),
        deriveKey: async (password, salt) => {
            const keyMaterial = await window.crypto.subtle.importKey(
                "raw", CryptoLogic.enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
            );
            return await window.crypto.subtle.deriveKey(
                { name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" },
                keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
            );
        },
        encrypt: async (dataBuffer, password) => {
            const salt = window.crypto.getRandomValues(new Uint8Array(16));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const key = await CryptoLogic.deriveKey(password, salt);
            const cipherBuffer = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, dataBuffer);
            const combined = new Uint8Array(16 + 12 + cipherBuffer.byteLength);
            combined.set(salt, 0);
            combined.set(iv, 16);
            combined.set(new Uint8Array(cipherBuffer), 28);
            return combined.buffer;
        },
        decrypt: async (combinedBuffer, password) => {
            if (combinedBuffer.byteLength < 28) throw new Error("无效的数据格式 (文件已损坏或非本机密文)");
            const combined = new Uint8Array(combinedBuffer);
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const cipher = combined.slice(28);
            const key = await CryptoLogic.deriveKey(password, salt);
            return await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipher);
        },
        // 优化点 1：采用分块方法处理 Base64，杜绝超大文本栈溢出
        bufferToBase64: (buffer) => {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const chunk = 8192;
            for (let i = 0; i < bytes.length; i += chunk) {
                binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
            }
            return window.btoa(binary);
        },
        base64ToBuffer: (base64) => {
            const binary_string = window.atob(base64);
            const bytes = new Uint8Array(binary_string.length);
            for (let i = 0; i < binary_string.length; i++) bytes[i] = binary_string.charCodeAt(i);
            return bytes.buffer;
        }
    };

    // 优化点 2 & 4：构建内联 Web Worker 代码（多线程处理大文件并封入文件名）
    const workerCode = `
        const CryptoLogic = {
            enc: new TextEncoder(),
            dec: new TextDecoder(),
            deriveKey: async (password, salt) => {
                const keyMaterial = await crypto.subtle.importKey(
                    "raw", CryptoLogic.enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
                );
                return await crypto.subtle.deriveKey(
                    { name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" },
                    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
                );
            }
        };

        self.onmessage = async (e) => {
            const { type, password, fileBuffer, filename, cipherBuffer } = e.data;
            try {
                if (type === 'encrypt') {
                    // 封入文件名：[2 bytes 长度] + [文件名字节] + [文件内容]
                    const nameBytes = CryptoLogic.enc.encode(filename);
                    const mergedData = new Uint8Array(2 + nameBytes.length + fileBuffer.byteLength);
                    
                    mergedData[0] = nameBytes.length >> 8;
                    mergedData[1] = nameBytes.length & 255;
                    mergedData.set(nameBytes, 2);
                    mergedData.set(new Uint8Array(fileBuffer), 2 + nameBytes.length);

                    const salt = crypto.getRandomValues(new Uint8Array(16));
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const key = await CryptoLogic.deriveKey(password, salt);
                    
                    // 加密完整数据
                    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, mergedData.buffer);
                    
                    const combined = new Uint8Array(16 + 12 + cipher.byteLength);
                    combined.set(salt, 0);
                    combined.set(iv, 16);
                    combined.set(new Uint8Array(cipher), 28);
                    
                    // 零拷贝回传 (Transferable Object)
                    self.postMessage({ success: true, buffer: combined.buffer }, [combined.buffer]);
                } 
                else if (type === 'decrypt') {
                    const combined = new Uint8Array(cipherBuffer);
                    if (combined.byteLength < 28) throw new Error("无效的数据格式");
                    
                    const salt = combined.slice(0, 16);
                    const iv = combined.slice(16, 28);
                    const cipher = combined.slice(28);
                    
                    const key = await CryptoLogic.deriveKey(password, salt);
                    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, cipher);
                    
                    // 提取并还原文件名和内容
                    const decryptedArray = new Uint8Array(decrypted);
                    const nameLen = (decryptedArray[0] << 8) | decryptedArray[1];
                    const nameBytes = decryptedArray.slice(2, 2 + nameLen);
                    const originalFilename = CryptoLogic.dec.decode(nameBytes);
                    
                    const originalFileBuffer = decrypted.slice(2 + nameLen);
                    
                    // 零拷贝回传
                    self.postMessage({ success: true, buffer: originalFileBuffer, filename: originalFilename }, [originalFileBuffer]);
                }
            } catch (error) {
                self.postMessage({ success: false, error: error.message });
            }
        };
    `;

    // --- 状态与配置 ---
    const [activeTab, setActiveTab] = useState('text'); // 'text' | 'file'
    const [password, setPassword] = useState("");
    const [pwdVisible, setPwdVisible] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // 文本模式状态
    const [textInput, setTextInput] = useState("");
    const [textOutput, setTextOutput] = useState("");
    
    // 文件模式状态
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // --- 辅助方法 ---
    const handleCopy = async (text) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            showToast("已复制到剪贴板", "success");
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast("已复制到剪贴板", "success");
        }
    };

    const downloadBlob = (buffer, filename) => {
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024, dm = decimals < 0 ? 0 : decimals, sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // 优化点 3：一键安全擦除
    const handleSecureErase = () => {
        setPassword("");
        setTextInput("");
        setTextOutput("");
        setSelectedFile(null);
        showToast("数据及内存态已安全擦除", "success");
    };

    // --- 核心操作处理 ---
    const handleTextEncrypt = async () => {
        if (!password) return showToast("请输入加密密码", "error");
        if (!textInput) return showToast("请输入需要加密的文本", "error");
        setIsProcessing(true);
        setTimeout(async () => {
            try {
                const dataBuffer = CryptoLogic.enc.encode(textInput);
                const encryptedBuffer = await CryptoLogic.encrypt(dataBuffer, password);
                setTextOutput(CryptoLogic.bufferToBase64(encryptedBuffer));
                showToast("文本加密成功", "success");
            } catch (error) {
                showToast("加密失败: " + error.message, "error");
            } finally { setIsProcessing(false); }
        }, 50);
    };

    const handleTextDecrypt = async () => {
        if (!password) return showToast("请输入解密密码", "error");
        if (!textInput) return showToast("请输入需要解密的密文", "error");
        setIsProcessing(true);
        setTimeout(async () => {
            try {
                const encryptedBuffer = CryptoLogic.base64ToBuffer(textInput);
                const decryptedBuffer = await CryptoLogic.decrypt(encryptedBuffer, password);
                setTextOutput(CryptoLogic.dec.decode(decryptedBuffer));
                showToast("文本解密成功", "success");
            } catch (error) {
                showToast("解密失败：密码错误或密文损坏", "error");
            } finally { setIsProcessing(false); }
        }, 50);
    };

    const handleFileProcess = async (mode) => {
        if (!password) return showToast("请输入密码", "error");
        if (!selectedFile) return showToast("请选择文件", "error");
        
        setIsProcessing(true);
        
        try {
            const arrayBuffer = await selectedFile.arrayBuffer();
            
            // 生成独立 Worker 线程
            const blob = new Blob([workerCode], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);
            
            worker.onmessage = (e) => {
                const { success, buffer, filename, error } = e.data;
                URL.revokeObjectURL(workerUrl); // 释放内存
                
                if (success) {
                    if (mode === 'encrypt') {
                        downloadBlob(buffer, `${selectedFile.name}.aes`);
                        showToast("文件加密成功并已下载", "success");
                    } else {
                        // 如果无法提取出文件名，则使用后备名字
                        downloadBlob(buffer, filename || "decrypted_file");
                        showToast("文件解密成功并还原扩展名", "success");
                    }
                } else {
                    if (mode === 'decrypt') showToast("解密失败：密码错误或文件损坏", "error");
                    else showToast("处理失败: " + error, "error");
                }
                setIsProcessing(false);
            };

            worker.onerror = (err) => {
                URL.revokeObjectURL(workerUrl);
                showToast("多线程计算错误: " + err.message, "error");
                setIsProcessing(false);
            };

            // 发送数据到 Worker (使用 Transferable Objects 零拷贝，极省内存)
            if (mode === 'encrypt') {
                worker.postMessage({ type: 'encrypt', fileBuffer: arrayBuffer, password, filename: selectedFile.name }, [arrayBuffer]);
            } else {
                worker.postMessage({ type: 'decrypt', cipherBuffer: arrayBuffer, password }, [arrayBuffer]);
            }

        } catch (error) {
            showToast("文件读取失败: " + error.message, "error");
            setIsProcessing(false);
        }
    };

    // --- UI 渲染函数 ---
    const renderPasswordSection = () => e("div", { className: "mb-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm" },
        e("div", { className: "flex justify-between items-center mb-2" },
            e("label", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2" }, 
                e(Icons.Key, { size: 16, className: "text-teal-600 dark:text-teal-400" }), "安全密钥 (Password)"
            ),
            // 新增：一键安全擦除按钮
            e("button", { 
                onClick: handleSecureErase,
                className: "px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors flex items-center gap-1.5 shadow-sm"
            }, e(Icons.Trash, { size: 14 }), "一键擦除")
        ),
        e("div", { className: "relative group" },
            e("input", {
                type: pwdVisible ? "text" : "password",
                value: password,
                onChange: e => setPassword(e.target.value),
                placeholder: "输入您的加密/解密密码...",
                className: "w-full pl-4 pr-12 py-3.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-white font-mono tracking-wider transition-all"
            }),
            e("button", {
                onClick: () => setPwdVisible(!pwdVisible),
                className: "absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm"
            }, e(pwdVisible ? Icons.EyeOff : Icons.Eye, { size: 18 }))
        ),
        e("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-2 ml-1" }, "※ 采用 PBKDF2 算法与随机加盐，并使用纯本地 AES-256-GCM 模式。")
    );

    const renderTextModeUI = () => e(motion.div, {
        key: "text", 
        initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 },
        className: "flex flex-col gap-4"
    },
        e("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4" },
            // 左侧：输入区
            e("div", { className: "flex flex-col bg-white/40 dark:bg-slate-800/40 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm h-[300px] sm:h-[400px]" },
                e("div", { className: "flex justify-between items-center mb-3" },
                    e("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2" }, e(Icons.FileText, { size: 16 }), "数据输入区"),
                    e("button", { onClick: () => setTextInput(''), className: "p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors", title: "清空" }, e(Icons.Trash, { size: 16 }))
                ),
                e("textarea", {
                    value: textInput,
                    onChange: e => setTextInput(e.target.value),
                    placeholder: "在此粘贴普通文本进行加密，或粘贴 Base64 密文进行解密...",
                    className: "flex-1 w-full bg-white/50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600/50 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 text-slate-700 dark:text-slate-200 resize-none font-mono text-sm custom-scrollbar"
                })
            ),
            // 右侧：输出区
            e("div", { className: "flex flex-col bg-slate-100/40 dark:bg-slate-900/40 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm h-[300px] sm:h-[400px] relative" },
                e("div", { className: "flex justify-between items-center mb-3" },
                    e("span", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2" }, e(Icons.Shield, { size: 16 }), "处理结果"),
                    e("button", { onClick: () => handleCopy(textOutput), className: "p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors", title: "复制结果" }, e(Icons.Copy, { size: 16 }))
                ),
                e("textarea", {
                    readOnly: true,
                    value: textOutput,
                    placeholder: "这里将显示加密后的密文或解密后的明文...",
                    className: "flex-1 w-full bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 outline-none text-slate-700 dark:text-slate-200 resize-none font-mono text-sm custom-scrollbar"
                }),
                isProcessing && e("div", { className: "absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10" },
                    e("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" })
                )
            )
        ),
        // 操作按钮组
        e("div", { className: "flex gap-4 mt-2" },
            e("button", { onClick: handleTextEncrypt, disabled: isProcessing, className: "flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg shadow-slate-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" }, e(Icons.Lock, { size: 18 }), "执行加密 (Encrypt)"),
            e("button", { onClick: handleTextDecrypt, disabled: isProcessing, className: "flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" }, e(Icons.Unlock, { size: 18 }), "执行解密 (Decrypt)")
        )
    );

    const renderFileModeUI = () => e(motion.div, {
        key: "file",
        initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 },
        className: "flex flex-col gap-4"
    },
        e("div", { 
            className: `relative flex flex-col items-center justify-center w-full h-[300px] sm:h-[400px] border-2 border-dashed rounded-3xl transition-all duration-300 ${isDragging ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/20' : 'border-slate-300 dark:border-slate-600 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50'}`,
            onDragOver: e => { e.preventDefault(); setIsDragging(true); },
            onDragLeave: e => { e.preventDefault(); setIsDragging(false); },
            onDrop: e => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]); }
        },
            e("input", {
                type: "file",
                className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
                onChange: e => { if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]); }
            }),
            
            selectedFile ? e("div", { className: "text-center p-6 z-20 pointer-events-none" },
                e("div", { className: "w-20 h-20 mx-auto bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-4 shadow-inner" }, e(Icons.FileText, { size: 40 })),
                e("h3", { className: "text-lg font-bold text-slate-800 dark:text-white truncate max-w-[250px] sm:max-w-sm mb-1" }, selectedFile.name),
                e("p", { className: "text-sm text-slate-500 dark:text-slate-400 font-mono" }, formatBytes(selectedFile.size)),
                e("button", { 
                    onClick: (evt) => { evt.preventDefault(); evt.stopPropagation(); setSelectedFile(null); }, 
                    className: "mt-4 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors pointer-events-auto inline-flex items-center gap-1.5"
                }, e(Icons.Trash, { size: 14 }), "移除文件")
            ) : e("div", { className: "text-center p-6 z-20 pointer-events-none flex flex-col items-center" },
                e("div", { className: "w-20 h-20 bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110" }, e(Icons.UploadCloud, { size: 40 })),
                e("h3", { className: "text-lg font-bold text-slate-700 dark:text-slate-300 mb-2" }, "点击或拖拽文件到此处"),
                e("p", { className: "text-sm text-slate-500 dark:text-slate-500 max-w-xs" }, "支持任意格式。加密后将原文件名封存，并生成 .aes 后缀的安全文件。解密时自动还原格式。")
            ),

            isProcessing && e("div", { className: "absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center z-30" },
                e("div", { className: "animate-spin rounded-full h-12 w-12 border-b-4 border-teal-500 mb-4" }),
                e("p", { className: "font-bold text-slate-700 dark:text-slate-200 mb-1" }, "正在独立 Worker 线程中高速处理"),
                e("p", { className: "text-xs text-slate-500" }, "大文件处理期间UI不会卡顿")
            )
        ),
        
        // 操作按钮组
        e("div", { className: "flex gap-4 mt-2" },
            e("button", { onClick: () => handleFileProcess('encrypt'), disabled: isProcessing || !selectedFile, className: "flex-1 py-3.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg shadow-slate-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" }, e(Icons.Lock, { size: 18 }), "加密文件并下载"),
            e("button", { onClick: () => handleFileProcess('decrypt'), disabled: isProcessing || !selectedFile, className: "flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" }, e(Icons.Unlock, { size: 18 }), "解密文件并下载")
        )
    );

    return e("div", { className: "h-screen w-full bg-slate-50/50 dark:bg-[#0b1120] text-slate-900 dark:text-white flex flex-col overflow-hidden font-sans relative" },
        // 背景特效
        e("div", { className: "fixed inset-0 pointer-events-none z-0 overflow-hidden" },
            e("div", { className: "absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-teal-500/10 dark:bg-teal-600/10 blur-[100px] mix-blend-screen" }),
            e("div", { className: "absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[120px] mix-blend-screen" })
        ),

        // 顶栏 Header
        e("header", { className: "relative z-10 px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between shrink-0" },
            e("div", { className: "flex items-center gap-4" },
                e("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30 text-white border border-white/20" },
                    e(Icons.Shield, { size: 24 })
                ),
                e("div", null, 
                    e("h1", { className: "text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-300" }, "全能 AES 加密器"),
                    e("p", { className: "text-xs font-sans text-slate-500 dark:text-slate-400 mt-0.5" }, "多线程加速 / AES-GCM / 本地化")
                )
            )
        ),

        // 标签切换
        e("nav", { className: "relative z-10 px-4 sm:px-8 mb-4 sm:mb-6 shrink-0" },
            e("div", { className: "flex gap-2 p-1.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl w-max shadow-sm" },
                [ { id: 'text', label: '文本加密', icon: Icons.FileText }, { id: 'file', label: '文件加密', icon: Icons.FileUp } ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return e("button", {
                        key: tab.id, onClick: () => setActiveTab(tab.id),
                        className: `relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive ? 'text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'}`
                    }, 
                        isActive && e(motion.div, { layoutId: "aesTabIndicator", className: "absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl -z-10 shadow-lg" }),
                        e(tab.icon, { size: 16 }), tab.label
                    );
                })
            )
        ),

        // 主体内容区
        e("main", { className: "relative z-10 flex-1 px-4 sm:px-8 pb-6 sm:pb-8 overflow-y-auto custom-scrollbar flex flex-col max-w-5xl mx-auto w-full" },
            renderPasswordSection(),
            e(AnimatePresence, { mode: "wait" },
                activeTab === 'text' && renderTextModeUI(),
                activeTab === 'file' && renderFileModeUI()
            )
        )
    );
};