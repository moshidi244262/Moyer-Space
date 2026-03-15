// ==========================================
// 动态侧边栏模块: 山海阁 (古朴木制书柜) + 自动化炼器炉
// ==========================================

window.AppModules = window.AppModules || {};

window.AppModules.ShanHaiGe = ({ showToast, searchQuery, Icons, mainData, TiltCard, HighlightText }) => {
    const { useState, useMemo, useEffect } = window.React;
    const { motion, AnimatePresence } = window.Motion;
    const e = window.React.createElement;

    // 初始展示数据
    const [books, setBooks] = useState([
        { 
            id: 1, title: "大奉打更人", author: "卖报小郎君", category: "网络小说", tags: ["仙侠", "穿越"], 
            cover: null, isEncryptedCover: false, color: "from-blue-800 to-slate-900", status: "已完结",
            desc: "这个世界，有儒；有道；有佛；有妖；有术士。警校毕业的许七安幽幽醒来..."
        },
        { 
            id: 2, title: "诡秘之主", author: "爱潜水的乌贼", category: "网络小说", tags: ["克苏鲁", "奇幻"], 
            cover: null, isEncryptedCover: false, color: "from-purple-800 to-slate-900", status: "已完结",
            desc: "蒸汽与机械的浪潮中，谁能触及非凡？历史和黑暗的迷雾里，又是谁在耳语？我醒来，看到的是满墙的血..."
        },
        { 
            id: 3, title: "白洁", author: "佚名", category: "成人小说", tags: ["经典", "无删减"], 
            cover: null, isEncryptedCover: true, color: "from-rose-900 to-black", status: "已完结",
            desc: "一段不为人知的往事，在那风雨交加的夜晚，到底发生了什么..."
        },
        { 
            id: 4, title: "三国演义", author: "罗贯中", category: "经典书籍", tags: ["历史", "名著"], 
            cover: null, isEncryptedCover: false, color: "from-stone-700 to-stone-900", status: "已完结",
            desc: "滚滚长江东逝水，浪花淘尽英雄。是非成败转头空。青山依旧在，几度夕阳红。"
        },
        { 
            id: 5, title: "金瓶梅", author: "兰陵笑笑生", category: "成人小说", tags: ["古典", "世情"], 
            cover: null, isEncryptedCover: true, color: "from-red-900 to-black", status: "已完结",
            desc: "借《水浒传》中武松杀嫂一段故事为引子，通过对兼有官僚、恶霸、富商三种身份的西门庆及其家庭生活的描述，揭露了当时的社会现实。"
        }
    ]);

    const categories = ["全部", "网络小说", "成人小说", "经典书籍"];
    const [activeCategory, setActiveCategory] = useState("全部");
    
    // 状态控制
    const [isAdultUnlocked, setIsAdultUnlocked] = useState(false);
    const [showAdultLock, setShowAdultLock] = useState(false);
    const [selectedBook, setSelectedBook] = useState(null);
    const [isForgeOpen, setIsForgeOpen] = useState(false);

    // 核心过滤逻辑 (包含权限拦截与全局搜索)
    const filteredBooks = useMemo(() => {
        let result = books;
        
        // 权限过滤：未解锁时全局隐藏成人小说
        if (!isAdultUnlocked) {
            result = result.filter(b => b.category !== "成人小说");
        }

        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(b => 
                b.title.toLowerCase().includes(lowerQ) || 
                b.author.toLowerCase().includes(lowerQ) || 
                b.desc.toLowerCase().includes(lowerQ)
            );
        } else if (activeCategory !== "全部") {
            result = result.filter(b => b.category === activeCategory);
        }
        return result;
    }, [books, searchQuery, activeCategory, isAdultUnlocked]);

    const handleCategoryClick = (cat) => {
        if (cat === "成人小说" && !isAdultUnlocked) {
            setShowAdultLock(true);
        } else {
            setActiveCategory(cat);
        }
    };

    // ==========================================
    // 组件 1: 禁忌结界 (AES 密码解锁框)
    // ==========================================
    const AdultLockModal = ({ onClose }) => {
        const [pwd, setPwd] = useState("");
        const [isVerifying, setIsVerifying] = useState(false);
        const [error, setError] = useState(false);

        const handleVerify = () => {
            setIsVerifying(true);
            // 模拟 AES 验证延迟
            setTimeout(() => {
                if (pwd === "123456") {
                    setIsAdultUnlocked(true);
                    setActiveCategory("成人小说");
                    showToast("结界已破除，欢迎进入极乐净土", "success");
                    onClose();
                } else {
                    setError(true);
                    setPwd("");
                    setTimeout(() => setError(false), 500);
                }
                setIsVerifying(false);
            }, 800);
        };

        return e("div", { className: "fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" },
            e(motion.div, {
                initial: { scale: 0.9, opacity: 0 }, animate: { scale: 1, opacity: 1 },
                className: "bg-[#2d241c] p-8 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-sm border-2 border-[#4a3b2e] text-center relative"
            },
                e("button", { onClick: onClose, className: "absolute top-3 right-3 text-[#a67b5b] hover:text-rose-500 transition-colors" }, e(Icons.X, { size: 20 })),
                e("div", { className: "w-16 h-16 mx-auto bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-4 border border-rose-800" }, 
                    e(Icons.Lock, { size: 32 })
                ),
                e("h3", { className: "text-xl font-bold text-[#d3bca0] mb-2 font-serif tracking-widest" }, "禁忌结界"),
                e("p", { className: "text-xs text-[#a67b5b] mb-6 leading-relaxed" }, "此区域受高阶 AES 阵法封印，包含非全年龄内容。<br/>请输入通行秘钥 (默认: 123456)"),
                
                e("div", { className: `relative mb-6 ${error ? 'animate-shake' : ''}` },
                    e("input", { 
                        type: "password", value: pwd, onChange: e => setPwd(e.target.value), onKeyDown: e => e.key === 'Enter' && handleVerify(),
                        placeholder: "输入秘钥...", autoFocus: true,
                        className: `w-full p-3 rounded bg-black/40 border text-center font-mono tracking-widest outline-none text-[#d3bca0] ${error ? 'border-rose-500 text-rose-500' : 'border-[#4a3b2e] focus:border-[#a67b5b]'}` 
                    })
                ),
                
                e("button", {
                    onClick: handleVerify, disabled: isVerifying || !pwd,
                    className: `w-full py-3 rounded font-bold shadow-md transition-all flex justify-center items-center gap-2 ${isVerifying || !pwd ? 'bg-black/50 text-[#5c4a3d] border border-[#3d3126]' : 'bg-[#8b5a2b] hover:bg-[#6b4e31] text-white border border-[#a67b5b]'}`
                }, 
                    isVerifying ? e("div", { className: "animate-spin w-5 h-5 border-2 border-[#d3bca0] border-b-transparent rounded-full" }) : e(Icons.Key, { size: 18 }),
                    isVerifying ? "AES-256 解密中..." : "破除封印"
                )
            )
        );
    };

    // ==========================================
    // 组件 2: 书籍卡片 (无文字封面纯视觉效果)
    // ==========================================
    const BookCard = ({ book, onClick }) => {
        const coverStyle = book.color || "from-amber-800 to-amber-950";
        return e("div", { 
            className: "group relative w-20 h-32 sm:w-24 sm:h-36 md:w-28 md:h-40 cursor-pointer transform-gpu transition-transform duration-300 hover:-translate-y-3 hover:scale-105 z-10",
            onClick: onClick
        },
            // 书本阴影和厚度效果
            e("div", { className: "absolute inset-0 bg-black/50 rounded-sm shadow-[6px_6px_15px_rgba(0,0,0,0.7)] translate-x-1.5 translate-y-1.5 -z-10" }),
            e("div", { className: "absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/50 to-transparent z-20 rounded-l-sm pointer-events-none" }),
            
            // 封面主体
            e("div", { className: `w-full h-full rounded-sm shadow-sm overflow-hidden relative flex flex-col items-center justify-center bg-gradient-to-br ${coverStyle}` },
                book.cover ? e("img", { src: book.cover, className: "absolute inset-0 w-full h-full object-cover" }) : 
                e(React.Fragment, null, 
                    // 仅保留古籍纹理，不放置文字
                    e("div", { className: "absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')] bg-repeat" })
                ),
                
                // 涉密/加密标志
                (book.isEncryptedCover || book.category === "成人小说") && e("div", { className: "absolute top-1 right-1 p-0.5 bg-black/60 backdrop-blur-md rounded-full text-rose-500 border border-rose-900/50 shadow-sm" }, e(Icons.Lock, { size: 10 })),
                
                // Hover 交互遮罩
                e("div", { className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]" },
                    e("div", { className: "w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-[#d3bca0] shadow-xl border border-white/20 transform scale-50 group-hover:scale-100 transition-transform duration-300" },
                        e(Icons.Eye, { size: 16 })
                    )
                )
            )
        );
    };

    // ==========================================
    // 组件 3: 书籍详情卷轴
    // ==========================================
    const BookDetailsModal = ({ book, onClose }) => {
        return e("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            e(motion.div, { 
                initial: { scale: 0.95, opacity: 0, y: 20 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.95, opacity: 0, y: 20 },
                className: "bg-[#2A2118] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative border-2 border-[#4a3b2e]"
            },
                e("button", { onClick: onClose, className: "absolute top-4 right-4 p-2 text-[#a67b5b] hover:text-rose-500 z-10 transition-colors bg-black/20 rounded-full" }, e(Icons.X, { size: 20 })),
                
                e("div", { className: "p-6 md:p-8 flex-1 overflow-y-auto flex flex-col md:flex-row gap-8 custom-scrollbar relative" },
                    e("div", { className: "absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')] pointer-events-none" }),
                    
                    e("div", { className: "w-32 h-48 md:w-48 md:h-72 shrink-0 rounded-sm shadow-[0_10px_20px_rgba(0,0,0,0.8)] mx-auto md:mx-0 relative overflow-hidden bg-gradient-to-br " + (book.color || "from-amber-800 to-amber-950") },
                        book.cover ? e("img", { src: book.cover, className: "w-full h-full object-cover" }) : 
                        e("div", { className: "w-full h-full flex items-center justify-center border-4 border-white/5 m-1 bg-black/20" },
                             e("h3", { className: "text-[#d3bca0] font-serif text-2xl font-bold tracking-[0.3em]", style: { writingMode: 'vertical-rl', textOrientation: 'upright' } }, book.title)
                        ),
                        e("div", { className: "absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/60 to-transparent pointer-events-none" })
                    ),

                    e("div", { className: "flex-1 flex flex-col relative z-10" },
                        e("h2", { className: "text-2xl md:text-3xl font-bold text-[#d3bca0] mb-3 font-serif drop-shadow-md" }, book.title),
                        e("p", { className: "text-[#a67b5b] font-medium mb-5 flex items-center gap-2" }, e(Icons.User, { size: 16 }), "著者： " + book.author),
                        
                        e("div", { className: "flex flex-wrap gap-2 mb-6" },
                            e("span", { className: "px-2 py-1 text-xs font-bold rounded bg-[#8b5a2b] text-white shadow-sm" }, book.category),
                            e("span", { className: "px-2 py-1 text-xs font-bold rounded bg-black/40 text-[#a67b5b] border border-[#4a3b2e]" }, book.status),
                            book.tags.map((tag, i) => e("span", { key: i, className: "px-2 py-1 text-xs rounded border border-[#4a3b2e] text-[#a67b5b] bg-[#3d3126]/50" }, tag))
                        ),
                        
                        e("div", { className: "flex-1" },
                            e("h3", { className: "text-sm font-bold text-[#a67b5b] mb-3 border-b border-[#4a3b2e] pb-2 flex items-center gap-2" }, e(Icons.FileText, { size: 16 }), "卷宗简述"),
                            e("p", { className: "text-sm text-[#d3bca0] leading-relaxed whitespace-pre-wrap opacity-90" }, book.desc)
                        )
                    )
                ),
                
                e("div", { className: "p-5 border-t border-[#4a3b2e] bg-black/40 flex gap-4 justify-center relative z-10" },
                    e("button", { 
                        onClick: () => { onClose(); showToast("正在唤醒阅读法阵... (阅读器开发中)"); },
                        className: "flex-1 py-3 bg-gradient-to-r from-[#8b5a2b] to-[#6b4e31] hover:from-[#a67b5b] hover:to-[#8b5a2b] text-white font-bold rounded-lg shadow-lg shadow-[#8b5a2b]/20 transition-all transform hover:scale-[1.02] flex justify-center items-center gap-2"
                    }, e(Icons.BookOpen, { size: 18 }), "开始阅读"),
                    e("button", { 
                        onClick: () => { onClose(); showToast("寻回书签录像... (阅读器开发中)"); },
                        className: "flex-1 py-3 bg-[#2d241c] hover:bg-[#3d3126] border border-[#8b5a2b] text-[#d3bca0] hover:text-white font-bold rounded-lg shadow-lg transition-all flex justify-center items-center gap-2"
                    }, e(Icons.RefreshCw, { size: 18 }), "继续阅读")
                )
            )
        );
    };

    // ==========================================
    // 核心加密与直传工具函数 (法阵内核恢复)
    // ==========================================
    const urlsafeBase64Encode = (uint8Array) => {
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) binary += String.fromCharCode(uint8Array[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
    };

    const generateQiniuToken = async (ak, sk, bucket, key) => {
        const deadline = Math.floor(Date.now() / 1000) + 3600;
        const putPolicy = JSON.stringify({ scope: `${bucket}:${key}`, deadline });
        const encodedPutPolicy = urlsafeBase64Encode(new TextEncoder().encode(putPolicy));
        const keyData = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(sk), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
        const sign = await window.crypto.subtle.sign("HMAC", keyData, new TextEncoder().encode(encodedPutPolicy));
        const encodedSign = urlsafeBase64Encode(new Uint8Array(sign));
        return `${ak}:${encodedSign}:${encodedPutPolicy}`;
    };

    const encryptFileToBlob = async (file, password) => {
        const arrayBuffer = await file.arrayBuffer();
        const nameBytes = new TextEncoder().encode(file.name);
        const mergedData = new Uint8Array(2 + nameBytes.length + arrayBuffer.byteLength);
        mergedData[0] = nameBytes.length >> 8;
        mergedData[1] = nameBytes.length & 255;
        mergedData.set(nameBytes, 2);
        mergedData.set(new Uint8Array(arrayBuffer), 2 + nameBytes.length);

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const keyMaterial = await window.crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
        const key = await window.crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: 200000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
        const cipher = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, mergedData.buffer);

        const combined = new Uint8Array(16 + 12 + cipher.byteLength);
        combined.set(salt, 0);
        combined.set(iv, 16);
        combined.set(new Uint8Array(cipher), 28);
        return new Blob([combined.buffer], { type: "application/octet-stream" });
    };

    const uploadToQiniu = async (blob, fileName, config) => {
        const token = await generateQiniuToken(config.ak, config.sk, config.bucket, fileName);
        const formData = new FormData();
        formData.append('file', blob);
        formData.append('key', fileName);
        formData.append('token', token);
        const uploadUrl = config.regionUrl || "https://upload.qiniup.com";
        const res = await fetch(uploadUrl, { method: 'POST', body: formData });
        if (!res.ok) throw new Error("七牛云上传失败: " + await res.text());
        
        let domainUrl = config.domain.replace(/\/$/, '');
        if (domainUrl.startsWith('http://')) {
            domainUrl = domainUrl.replace('http://', 'https://');
        } else if (!domainUrl.startsWith('https://') && !domainUrl.startsWith('/')) {
            domainUrl = 'https://' + domainUrl;
        }
        return `${domainUrl}/${fileName}`;
    };

    // ==========================================
    // 组件 4: 炼器炉 (真实业务 + 古风UI)
    // ==========================================
    const ForgeModal = ({ onClose }) => {
        const defaultCfg = { ak: '', sk: '', bucket: 'moyermymusicplayer', domain: 'https://moyermusic.cn', regionUrl: 'https://upload.qiniup.com' };
        const [qiniuCfg, setQiniuCfg] = useState(() => JSON.parse(localStorage.getItem('moyer_qiniu_cfg')) || defaultCfg);
        const [showConfig, setShowConfig] = useState(false);

        const [formData, setFormData] = useState({ title: '', author: '', category: '网络小说', tags: '', status: '连载中', desc: '' });
        const [files, setFiles] = useState({ book: null, cover: null });
        const [password, setPassword] = useState('');
        
        const [isForging, setIsForging] = useState(false);
        const [forgeStatus, setForgeStatus] = useState('');
        const [generatedJson, setGeneratedJson] = useState("");

        const saveConfig = () => {
            localStorage.setItem('moyer_qiniu_cfg', JSON.stringify(qiniuCfg));
            showToast("七牛云灵阵配置已稳固", "success");
            setShowConfig(false);
        };

        const processEncryptionAndUpload = async () => {
            if (!password) return showToast("必须注入灵力 (输入秘钥)", "error");
            if (!formData.title) return showToast("书名不可为空", "error");
            if (!files.book) return showToast("必须放入古籍残卷", "error");
            if (!qiniuCfg.ak || !qiniuCfg.sk || !qiniuCfg.bucket || !qiniuCfg.domain) {
                setShowConfig(true);
                return showToast("请先完善七牛云通信阵法！", "error");
            }
            
            setIsForging(true);
            try {
                const timestamp = Date.now();
                
                setForgeStatus("凝练本地法阵 (加密书籍)...");
                const bookBlob = await encryptFileToBlob(files.book, password);
                let coverBlob = null;
                if (files.cover) {
                    setForgeStatus("凝练本地法阵 (加密书封)...");
                    coverBlob = await encryptFileToBlob(files.cover, password);
                }

                setForgeStatus("破空飞升 (传输书籍至云端)...");
                const bookKey = `books/${timestamp}_book.aes`;
                const bookUrl = await uploadToQiniu(bookBlob, bookKey, qiniuCfg);

                let coverUrl = null;
                if (coverBlob) {
                    setForgeStatus("破空飞升 (传输书封至云端)...");
                    const coverKey = `covers/${timestamp}_cover.aes`;
                    coverUrl = await uploadToQiniu(coverBlob, coverKey, qiniuCfg);
                }

                setForgeStatus("凝结天地法则 (生成 JSON)...");
                const tagsArr = formData.tags.split(/[,，\s]+/).filter(t => t.trim());
                const tagsStr = JSON.stringify(tagsArr);
                
                // 将格式拼装为一模一样的纯 JS 对象格式（完美复刻您的原始代码结构）
                const jsString = `{ 
    id: ${timestamp}, title: "${formData.title}", author: "${formData.author || "佚名"}", category: "${formData.category}", tags: ${tagsStr}, 
    cover: ${coverUrl ? `"${coverUrl}"` : "null"}, isEncryptedCover: ${!!files.cover}, color: "from-amber-800 to-amber-950", status: "${formData.status}", file: ${bookUrl ? `"${bookUrl}"` : "null"},
    desc: "${formData.desc}"
},`;
                
                setGeneratedJson(jsString);
                showToast("✅ 炼器大成！法宝已上云，请获取法则代码！", "success");

            } catch (err) {
                showToast("炼器失败：" + err.message, "error");
            } finally {
                setIsForging(false);
                setForgeStatus("");
            }
        };

        const handleCopyJson = () => {
            const textArea = document.createElement("textarea");
            textArea.value = generatedJson;
            textArea.style.position = "absolute"; textArea.style.left = "-9999px";
            document.body.appendChild(textArea); textArea.select();
            try {
                document.execCommand('copy');
                showToast("法则代码已稳固复制到剪贴板！", "success");
            } catch(e) {
                showToast("复制失败，请手动选取文本框内容复制", "error");
            }
            document.body.removeChild(textArea);
        };

        return e("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" },
            e(motion.div, { 
                initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.95, opacity: 0 },
                className: "bg-[#2A2118] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col relative border-2 border-[#4a3b2e]"
            },
                e("div", { className: "p-6 border-b border-[#4a3b2e] bg-black/20 flex justify-between items-center" },
                    e("h2", { className: "text-xl font-bold flex items-center gap-2 text-[#d3bca0] font-serif tracking-widest" }, 
                        e(Icons.Wrench, { className: "text-[#a67b5b]" }), 
                        showConfig ? "七牛云通信阵法配置" : "山海阁 · 自动化炼器炉"
                    ),
                    e("div", { className: "flex items-center gap-2" },
                        !showConfig && e("button", { onClick: () => setShowConfig(true), className: "p-2 text-[#a67b5b] hover:text-[#d3bca0] bg-black/30 rounded-full transition-colors", title: "配置七牛云" }, e(Icons.Shield, { size: 20 })),
                        e("button", { onClick: onClose, className: "p-2 text-[#a67b5b] hover:text-rose-500 transition-colors bg-black/30 rounded-full" }, e(Icons.X, { size: 20 }))
                    )
                ),
                
                e("div", { className: "p-6 overflow-y-auto flex-1 custom-scrollbar" },
                    showConfig ? (
                        // 配置视图
                        e("div", { className: "space-y-4 max-w-lg mx-auto" },
                            e("div", { className: "p-4 bg-[#8b5a2b]/20 text-[#a67b5b] rounded-xl text-sm mb-4 border border-[#8b5a2b]/30" },
                                "⚠️ 法阵秘钥保存在本地神识中。请确保七牛云 Bucket 的跨域设置 (CORS) 已允许 POST 请求。"
                            ),
                            e("div", null, e("label", {className:"text-xs font-bold text-[#a67b5b] mb-1 block"}, "AccessKey (AK)"), e("input", { value: qiniuCfg.ak, onChange: e => setQiniuCfg({...qiniuCfg, ak: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none text-[#d3bca0] focus:border-[#a67b5b]" })),
                            e("div", null, e("label", {className:"text-xs font-bold text-[#a67b5b] mb-1 block"}, "SecretKey (SK)"), e("input", { type: "password", value: qiniuCfg.sk, onChange: e => setQiniuCfg({...qiniuCfg, sk: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none text-[#d3bca0] focus:border-[#a67b5b]" })),
                            e("div", null, e("label", {className:"text-xs font-bold text-[#a67b5b] mb-1 block"}, "空间名称 (Bucket)"), e("input", { value: qiniuCfg.bucket, onChange: e => setQiniuCfg({...qiniuCfg, bucket: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none text-[#d3bca0] focus:border-[#a67b5b]" })),
                            e("div", null, e("label", {className:"text-xs font-bold text-[#a67b5b] mb-1 block"}, "访问域名 (Domain)"), e("input", { value: qiniuCfg.domain, onChange: e => setQiniuCfg({...qiniuCfg, domain: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none text-[#d3bca0] focus:border-[#a67b5b]" })),
                            e("div", null, e("label", {className:"text-xs font-bold text-[#a67b5b] mb-1 block"}, "上传节点 (Region URL)"), e("input", { value: qiniuCfg.regionUrl, onChange: e => setQiniuCfg({...qiniuCfg, regionUrl: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none text-[#d3bca0] focus:border-[#a67b5b]" })),
                            e("div", { className: "flex gap-4 pt-4" },
                                e("button", { onClick: () => setShowConfig(false), className: "flex-1 p-3 rounded-xl font-bold bg-[#3d3126] text-[#a67b5b] hover:text-[#d3bca0] transition-colors" }, "取消"),
                                e("button", { onClick: saveConfig, className: "flex-1 p-3 rounded-xl font-bold bg-[#8b5a2b] hover:bg-[#a67b5b] text-white transition-colors" }, "铭刻法阵")
                            )
                        )
                    ) : generatedJson ? (
                        // 成功页面：显示 JSON 并提供复制按钮
                        e("div", { className: "space-y-6 flex flex-col h-full" },
                            e("div", { className: "p-4 bg-emerald-900/20 text-emerald-400 rounded-xl flex items-center justify-center gap-3 border border-emerald-800/50" },
                                e(Icons.Check, { size: 24 }), e("span", { className: "font-bold tracking-wider" }, "天劫已过，法宝大成！")
                            ),
                            e("textarea", { 
                                readOnly: true, value: generatedJson, 
                                className: "flex-1 w-full p-4 rounded-xl bg-black/50 border border-[#4a3b2e] font-mono text-sm text-[#d3bca0] custom-scrollbar resize-none h-64 focus:outline-none" 
                            }),
                            e("div", { className: "flex gap-4 pt-2" },
                                e("button", { onClick: () => { setGeneratedJson(""); setFormData({ title: '', author: '', category: '网络小说', tags: '', status: '连载中', desc: '' }); setFiles({book: null, cover: null}); }, className: "flex-1 p-3 rounded-xl font-bold bg-[#3d3126] text-[#a67b5b] hover:text-[#d3bca0] hover:bg-[#4a3b2e] transition-colors" }, "继续炼制"),
                                e("button", { onClick: handleCopyJson, className: "flex-1 p-3 rounded-xl font-bold bg-[#8b5a2b] hover:bg-[#a67b5b] text-white shadow-lg transition-colors flex items-center justify-center gap-2" }, e(Icons.Copy, { size: 18 }), "一键复制法则")
                            )
                        )
                    ) : (
                        // 炼制表单
                        e("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6" },
                            e("div", { className: "space-y-4" },
                                e("div", { className: "p-4 border-2 border-dashed border-[#4a3b2e] rounded-xl flex flex-col items-center justify-center text-center relative hover:bg-black/20 transition-colors h-32" },
                                    e("input", { type: "file", className: "absolute inset-0 opacity-0 cursor-pointer z-10", onChange: e => setFiles({...files, book: e.target.files[0]}) }),
                                    e(Icons.BookOpen, { size: 32, className: "text-[#a67b5b] mb-2" }),
                                    e("p", { className: "font-bold text-[#d3bca0] text-sm" }, files.book ? files.book.name : "拖入古籍残卷 (txt/epub)")
                                ),
                                e("div", { className: "p-4 border-2 border-dashed border-[#4a3b2e] rounded-xl flex flex-col items-center justify-center text-center relative hover:bg-black/20 transition-colors h-32" },
                                    e("input", { type: "file", accept: "image/*", className: "absolute inset-0 opacity-0 cursor-pointer z-10", onChange: e => setFiles({...files, cover: e.target.files[0]}) }),
                                    e(Icons.Info, { size: 32, className: "text-[#a67b5b] mb-2" }),
                                    e("p", { className: "font-bold text-[#d3bca0] text-sm" }, files.cover ? files.cover.name : "拖入书封画像 (jpg/png)"),
                                    e("p", { className: "text-xs text-rose-500/80 mt-1" }, "涉密书封将被自动打乱混淆")
                                )
                            ),

                            e("div", { className: "space-y-4" },
                                e("input", { placeholder: "书名 (必填)", value: formData.title, onChange: e => setFormData({...formData, title: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none focus:border-[#a67b5b] text-[#d3bca0]" }),
                                e("div", { className: "flex gap-4" },
                                    e("input", { placeholder: "著者", value: formData.author, onChange: e => setFormData({...formData, author: e.target.value}), className: "w-1/2 p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none focus:border-[#a67b5b] text-[#d3bca0]" }),
                                    e("select", { value: formData.category, onChange: e => setFormData({...formData, category: e.target.value}), className: "w-1/2 p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none focus:border-[#a67b5b] text-[#d3bca0]" },
                                        e("option", { value: "网络小说", className: "bg-[#2d241c]" }, "网络小说"), 
                                        e("option", { value: "成人小说", className: "bg-[#2d241c]" }, "成人小说"),
                                        e("option", { value: "经典书籍", className: "bg-[#2d241c]" }, "经典书籍")
                                    )
                                ),
                                e("input", { placeholder: "标签 (如: 仙侠,穿越)", value: formData.tags, onChange: e => setFormData({...formData, tags: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none focus:border-[#a67b5b] text-[#d3bca0]" }),
                                e("textarea", { placeholder: "卷宗简述...", rows: 3, value: formData.desc, onChange: e => setFormData({...formData, desc: e.target.value}), className: "w-full p-3 rounded-xl bg-black/30 border border-[#4a3b2e] outline-none focus:border-[#a67b5b] custom-scrollbar text-[#d3bca0] resize-none" }),
                                
                                e("div", { className: "relative mt-4" },
                                    e(Icons.Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-rose-500", size: 18 }),
                                    e("input", { type: "password", placeholder: "输入炼器灵力 (加密秘钥)", value: password, onChange: e => setPassword(e.target.value), className: "w-full pl-10 p-3 rounded-xl bg-rose-950/20 border border-rose-900/50 outline-none focus:border-rose-500 font-mono text-rose-400" })
                                )
                            )
                        )
                    )
                ),
                
                (!showConfig && !generatedJson) && e("div", { className: "p-6 border-t border-[#4a3b2e] bg-black/30 flex justify-end" },
                    e("button", { 
                        onClick: processEncryptionAndUpload, disabled: isForging,
                        className: `px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${isForging ? 'bg-[#3d3126] text-[#a67b5b] cursor-not-allowed' : 'bg-[#8b5a2b] hover:bg-[#a67b5b] hover:scale-[1.02]'}` 
                    }, 
                        isForging ? e("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-white" }) : e(Icons.Cpu, { size: 18 }), 
                        isForging ? forgeStatus : "起阵开炉"
                    )
                )
            )
        );
    };

    // ==========================================
    // 主渲染逻辑 (山海阁容器)
    // ==========================================
    return e("div", { className: "w-full" },
        // 头部导航栏
        e("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8" },
            e("h2", { className: "text-2xl font-bold flex items-center gap-3 text-[#5c4a3d] dark:text-[#d3bca0] font-serif" }, 
                e("div", { className: "p-2 bg-[#8b5a2b]/20 text-[#8b5a2b] dark:text-[#d3bca0] rounded-xl border border-[#8b5a2b]/30" }, e(Icons.BookOpen, { size: 24 })),
                "山海藏书阁",
                e("span", { className: "text-sm font-normal text-[#a67b5b] ml-2 font-sans" }, `共收录 ${books.length} 部典籍`)
            ),
            e("button", { 
                onClick: () => setIsForgeOpen(true),
                className: "flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4a3b2e] hover:bg-[#5c4a3d] text-[#d3bca0] text-sm font-bold rounded-xl shadow-lg transition-all border border-[#8b5a2b]/30"
            }, 
                e(Icons.Wrench, { size: 16 }), "数据炼器炉"
            )
        ),

        // 分类标签
        !searchQuery && e("div", { className: "flex gap-3 pb-2 mb-6 overflow-x-auto hide-scrollbar" },
            categories.map(cat => 
                e("button", { 
                    key: cat, onClick: () => handleCategoryClick(cat),
                    className: `px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border ${
                        activeCategory === cat 
                        ? 'bg-[#8b5a2b] text-white border-[#8b5a2b] shadow-lg shadow-[#8b5a2b]/20' 
                        : 'bg-[#f4ecd8] dark:bg-[#2d241c] text-[#8b5a2b] dark:text-[#a67b5b] border-[#d3bca0] dark:border-[#4a3b2e] hover:bg-[#e8dcc4] dark:hover:bg-[#3d3126]'
                    }`
                }, 
                    cat === "成人小说" && !isAdultUnlocked ? e("span", { className: "flex items-center gap-2" }, e(Icons.Lock, { size: 14 }), cat) : cat
                )
            )
        ),

        // 古木书架容器
        e("div", { className: "p-6 sm:p-10 bg-[#3A2214] dark:bg-[#1A0F0A] rounded-xl border-[12px] border-[#2A150A] dark:border-[#0f0805] shadow-[inset_0_20px_40px_rgba(0,0,0,0.8)] min-h-[50vh] relative overflow-hidden" },
            // 书架内部木纹背景装饰
            e("div", { className: "absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PC9yZWN0Pgo8cGF0aCBkPSJNMCAwTDggOFpNOCAwTDAgOFoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PC9wYXRoPgo8L3N2Zz4=')] pointer-events-none" }),
            
            filteredBooks.length > 0 
                ? e("div", { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-y-20 gap-x-4 sm:gap-x-8 relative z-10" },
                    filteredBooks.map(book => e("div", { key: book.id, className: "relative flex flex-col items-center justify-end h-full mb-6" },
                        e(BookCard, { book: book, onClick: () => setSelectedBook(book) }),
                        
                        // 底层木板托架
                        e("div", { className: "absolute -bottom-2 w-[140%] h-3 bg-gradient-to-b from-[#5c3a21] to-[#2A150A] dark:from-[#2a170d] dark:to-[#0f0805] shadow-[0_10px_15px_rgba(0,0,0,0.9)] z-0 rounded-sm border-t border-white/10" }),
                        
                        // 木板前面的书名铭牌
                        e("div", { className: "absolute -bottom-10 w-[120%] flex justify-center z-20" },
                            e("div", { className: "px-2 py-1 bg-[#2d241c] border border-[#4a3b2e] shadow-[0_4px_6px_rgba(0,0,0,0.6)] rounded-[3px] flex items-center justify-center" },
                                e("span", { className: "text-[#d3bca0] text-[10px] sm:text-xs font-serif font-bold tracking-widest truncate max-w-full block text-center" }, book.title)
                            )
                        )
                    ))
                )
                : e("div", { className: "py-24 text-center text-[#8b5a2b] dark:text-[#5c4a3d] flex flex-col items-center justify-center relative z-10" }, 
                    e(Icons.Ghost, { size: 56, className: "mb-6 opacity-30" }), 
                    e("p", { className: "font-serif text-xl tracking-widest" }, "此阁空空如也，毫无灵气")
                )
        ),

        // 各种弹窗系统
        e(AnimatePresence, null, showAdultLock && e(AdultLockModal, { onClose: () => setShowAdultLock(false) })),
        e(AnimatePresence, null, selectedBook && e(BookDetailsModal, { book: selectedBook, onClose: () => setSelectedBook(null) })),
        e(AnimatePresence, null, isForgeOpen && e(ForgeModal, { onClose: () => setIsForgeOpen(false) }))
    );
};