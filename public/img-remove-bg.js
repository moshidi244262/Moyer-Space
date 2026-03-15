window.AppTools = window.AppTools || {};

// === 新增：IndexedDB 跨工具微型数据库，突破 5MB 传图限制 ===
const DB_NAME = 'MoyerToolsTransferDB';
const STORE_NAME = 'imageTransfer';

const setTransferImage = (dataUrl) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(dataUrl, 'shared_image');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
    });
};

const getTransferImage = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) { resolve(null); return; }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get('shared_image');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        };
        request.onerror = () => reject(request.error);
    });
};

const clearTransferImage = () => {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) { resolve(); return; }
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete('shared_image');
            tx.oncomplete = () => resolve();
        };
    });
};
// =======================================================

window.AppTools.ImgRemoveBg = ({ showToast }) => {
    const { useState, useRef, useEffect } = React;
    const { motion } = window.Motion;

    // 状态管理
    const [isLoaded, setIsLoaded] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [maskBlob, setMaskBlob] = useState(null); 
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressStr, setProgressStr] = useState('');
    
    // 背景与特效控制状态
    const [bgMode, setBgMode] = useState('transparent'); 
    const [customColor, setCustomColor] = useState('#6366f1'); 
    const [bgImageSrc, setBgImageSrc] = useState(null);
    const [shadowBlur, setShadowBlur] = useState(0); 
    const [shadowColor, setShadowColor] = useState('#000000'); 
    const [featherAmount, setFeatherAmount] = useState(0); 

    // 视图与交互状态 
    const [sliderValue, setSliderValue] = useState(50);
    const [isSliding, setIsSliding] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [scale, setScale] = useState(1); 
    const [pan, setPan] = useState({ x: 0, y: 0 }); 
    const [isSpaceDown, setIsSpaceDown] = useState(false); 

    // 手动修正画笔状态
    const [toolMode, setToolMode] = useState('preview'); // 'preview', 'pan', 'erase', 'restore'
    const [brushSize, setBrushSize] = useState(40);
    const [cursorPos, setCursorPos] = useState(null); 
    const [isAdjustingBrush, setIsAdjustingBrush] = useState(false); 

    // 历史记录状态 
    const historyRef = useRef([]);
    const historyStepRef = useRef(-1);
    const [historyLen, setHistoryLen] = useState(0);
    const [historyIdx, setHistoryIdx] = useState(-1);

    const containerRef = useRef(null);
    const canvasWrapperRef = useRef(null); 
    const fileInputRef = useRef(null);
    const bgInputRef = useRef(null);

    // 核心渲染引擎对象
    const originalImgRef = useRef(null);
    const editCanvasRef = useRef(null); 
    const tempCanvasRef = useRef(null); 
    const featherTempCanvasRef = useRef(null); 
    const displayCanvasRef = useRef(null); 
    const bgImgCache = useRef(null); 

    // 绘制状态追踪与节流
    const isDrawingRef = useRef(false);
    const isPanningRef = useRef(false); 
    const lastPanRef = useRef({ x: 0, y: 0 }); 
    const lastPosRef = useRef({ x: 0, y: 0 });
    const scheduledRenderRef = useRef(null); 

    // 初始化内存画板
    useEffect(() => {
        editCanvasRef.current = document.createElement('canvas');
        editCanvasRef.current.getContext('2d', { willReadFrequently: true }); 
        tempCanvasRef.current = document.createElement('canvas');
        featherTempCanvasRef.current = document.createElement('canvas');
    }, []);

    // 核心修复3：直接进行原生的 Base64 解码并读取，规避 fetch (dataURL) 的长度阻断限制
    useEffect(() => {
        getTransferImage().then(transferImg => {
            if (transferImg) {
                clearTransferImage(); // 提取完销毁以节约空间
                try {
                    const arr = transferImg.split(',');
                    const mime = arr[0].match(/:(.*?);/)[1];
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while(n--){
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    const blob = new Blob([u8arr], {type: mime});
                    const file = new File([blob], "transfer_image.png", { type: mime });
                    handleFileProcess(file);
                } catch (err) {
                    console.error("加载传递的图片失败", err);
                    showToast("解析接收的图片失败", "error");
                }
            }
        }).catch(e => console.error("读取传送图片失败", e));
    }, []);

    // 1. 动态加载 ESM 模块 (优化：多CDN容灾备份)
    useEffect(() => {
        const loadLibrary = async () => {
            if (window.imglyRemoveBackground) {
                setIsLoaded(true);
                return;
            }
            try {
                let module;
                // 加入多个流行 CDN，防止单一 CDN 在国内被墙或被 CSP 拦截
                const cdns = [
                    'https://esm.sh/@imgly/background-removal@1.7.0',
                    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
                    'https://unpkg.com/@imgly/background-removal@1.7.0/dist/index.mjs'
                ];
                
                let loadSuccess = false;
                for (const cdn of cdns) {
                    try {
                        module = await import(cdn);
                        loadSuccess = true;
                        console.log(`✅ 成功从 ${cdn} 加载抠图引擎`);
                        break;
                    } catch (e) {
                        console.warn(`⚠️ 从 ${cdn} 加载失败，尝试备用节点...`, e);
                    }
                }

                if (!loadSuccess) {
                    throw new Error("所有外部 CDN 节点均加载失败。");
                }
                
                const engine = module.default?.default || module.default || module.removeBackground || module.imglyRemoveBackground;
                
                if (typeof engine === 'function') {
                    window.imglyRemoveBackground = engine;
                    setIsLoaded(true);
                } else {
                    console.error("模块导出内容异常:", module);
                    showToast("引擎加载异常，核心函数丢失，请按 F12 查看", "error");
                }
            } catch (e) {
                console.error("加载库彻底失败:", e);
                showToast("加载失败: 浏览器安全策略(CSP)拦截或网络不通", "error");
            }
        };
        loadLibrary();
    }, []);

    // 2. 交互处理：全局快捷键拦截 
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && !isSpaceDown && maskBlob) {
                e.preventDefault();
                setIsSpaceDown(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpaceDown(false);
                isPanningRef.current = false;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpaceDown, maskBlob]);

    // 2.1 交互处理：指哪缩哪 (Zoom to Pointer)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e) => {
            if (!maskBlob) return;
            e.preventDefault(); 
            
            setScale(prevScale => {
                const zoomSensitivity = 0.001; 
                const delta = -e.deltaY * zoomSensitivity;
                const newScale = Math.min(Math.max(0.2, prevScale + prevScale * delta * 5), 5);

                setPan(prevPan => {
                    const rect = container.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const cx = x - rect.width / 2;
                    const cy = y - rect.height / 2;

                    const newPanX = cx - ((cx - prevPan.x) / prevScale) * newScale;
                    const newPanY = cy - ((cy - prevPan.y) / prevScale) * newScale;

                    return { x: newPanX, y: newPanY };
                });
                
                return newScale;
            });
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [maskBlob]);

    // 2.2 交互处理：对比视图滑动控制
    useEffect(() => {
        const handleUp = () => setIsSliding(false);
        const handleMove = (e) => {
            if (!isSliding || !containerRef.current || toolMode !== 'preview') return;
            const rect = containerRef.current.getBoundingClientRect();
            let clientX = e.clientX;
            if (e.touches && e.touches.length > 0) clientX = e.touches[0].clientX;
            let x = clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            setSliderValue((x / rect.width) * 100);
        };

        if (isSliding) {
            window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchend', handleUp);
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('touchmove', handleMove, { passive: false });
        }

        return () => {
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
        };
    }, [isSliding, toolMode]);

    // 3. 图片预处理与上传 
    const handleFileProcess = (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                const MAX_DIM = 2048; 

                if (w > 4000 || h > 4000) {
                    showToast("图片分辨率过大，已自动优化尺寸以防内存溢出", "warning");
                    const ratio = MAX_DIM / Math.max(w, h);
                    w = Math.max(1, Math.round(w * ratio));
                    h = Math.max(1, Math.round(h * ratio));

                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = w;
                    tempCanvas.height = h;
                    const ctx = tempCanvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);

                    tempCanvas.toBlob((blob) => {
                        if (blob) initImageState(URL.createObjectURL(blob));
                    }, file.type, 0.95);
                } else {
                    initImageState(URL.createObjectURL(file));
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const initImageState = (url) => {
        setImageSrc(url);
        setMaskBlob(null);
        setToolMode('preview');
        setSliderValue(50);
        setBgMode('transparent');
        setShadowBlur(0);
        setFeatherAmount(0);
        setScale(1);
        setPan({ x: 0, y: 0 });
        
        historyRef.current = [];
        historyStepRef.current = -1;
        setHistoryLen(0);
        setHistoryIdx(-1);

        if (displayCanvasRef.current) {
            const ctx = displayCanvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, displayCanvasRef.current.width, displayCanvasRef.current.height);
        }
    };

    const handleFileUpload = (e) => handleFileProcess(e.target.files?.[0]);
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFileProcess(e.dataTransfer?.files?.[0]);
    };

    // 4. 高速渲染引擎：合并主体、背景、特效输出 (强化柔化性能)
    const renderFinalImage = (mode, customCol, blur, shadowCol, feather, fastMode = false) => {
        if (!editCanvasRef.current || !displayCanvasRef.current) return;
        
        const canvas = displayCanvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // 第 1 层：绘制背景
        if (mode === 'white') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
        } else if (mode === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
        } else if (mode === 'custom') {
            ctx.fillStyle = customCol;
            ctx.fillRect(0, 0, width, height);
        } else if (mode === 'image' && bgImgCache.current) {
            const bgImg = bgImgCache.current;
            const bgScale = Math.max(width / bgImg.width, height / bgImg.height);
            const w = bgImg.width * bgScale;
            const h = bgImg.height * bgScale;
            const x = (width - w) / 2;
            const y = (height - h) / 2;
            ctx.drawImage(bgImg, x, y, w, h);
        }

        ctx.save();
        
        // 渲染边缘阴影
        if (blur > 0 && !fastMode) {
            ctx.shadowColor = shadowCol;
            ctx.shadowBlur = blur * 2;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.drawImage(editCanvasRef.current, 0, 0);
        }

        // 渲染边缘柔化
        if (feather > 0) {
            if (fastMode && featherTempCanvasRef.current) {
                ctx.filter = 'none'; 
                const downScale = 0.5;
                const dw = Math.max(1, width * downScale);
                const dh = Math.max(1, height * downScale);
                const tempC = featherTempCanvasRef.current;
                
                tempC.width = dw;
                tempC.height = dh;
                const tCtx = tempC.getContext('2d');
                tCtx.clearRect(0, 0, dw, dh);
                tCtx.filter = `blur(${feather * downScale}px)`;
                tCtx.drawImage(editCanvasRef.current, 0, 0, dw, dh);

                ctx.drawImage(tempC, 0, 0, width, height);
                ctx.restore();
                return;
            } else {
                ctx.filter = `blur(${feather}px)`;
            }
        } else {
            ctx.filter = 'none';
        }

        ctx.drawImage(editCanvasRef.current, 0, 0);
        ctx.restore();
    };

    // 捕获历史记录快照
    const captureHistory = () => {
        if (!editCanvasRef.current) return;
        const ctx = editCanvasRef.current.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, editCanvasRef.current.width, editCanvasRef.current.height);
        
        const newHistory = historyRef.current.slice(0, historyStepRef.current + 1);
        newHistory.push(imageData);
        
        if (newHistory.length > 10) newHistory.shift(); 
        
        historyRef.current = newHistory;
        historyStepRef.current = newHistory.length - 1;
        setHistoryLen(newHistory.length);
        setHistoryIdx(historyStepRef.current);
    };

    const handleUndo = () => {
        if (historyIdx > 0) {
            const newIdx = historyIdx - 1;
            const imageData = historyRef.current[newIdx];
            editCanvasRef.current.getContext('2d', { willReadFrequently: true }).putImageData(imageData, 0, 0);
            
            historyStepRef.current = newIdx;
            setHistoryIdx(newIdx);
            renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, false);
        }
    };

    const handleRedo = () => {
        if (historyIdx < historyLen - 1) {
            const newIdx = historyIdx + 1;
            const imageData = historyRef.current[newIdx];
            editCanvasRef.current.getContext('2d', { willReadFrequently: true }).putImageData(imageData, 0, 0);
            
            historyStepRef.current = newIdx;
            setHistoryIdx(newIdx);
            renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, false);
        }
    };

    // 5. AI 核心推流
    const processImage = async () => {
        if (!imageSrc || !window.imglyRemoveBackground) return;

        setIsProcessing(true);
        setProgressStr('正在初始化 AI 引擎...');

        try {
            // 注释掉强制本地路径，让引擎自动回退到官方高速 CDN 获取计算模型 (wasm/onnx)
            // 这样可以彻底避免本地 /lib/models/ 目录为空导致的 "no available backend found" 错误
            const config = {
                progress: (key, current, total) => {
                    if (key === 'compute:inference') setProgressStr(`AI 深度计算推演中...`);
                    else if (total > 0) setProgressStr(`加载神经网络: ${Math.round((current / total) * 100)}%`);
                    else setProgressStr(`正在链接 ${key}...`);
                }
            };

            const blob = await window.imglyRemoveBackground(imageSrc, config);
            setMaskBlob(blob);

            const origImg = new Image();
            origImg.src = imageSrc;
            await new Promise(r => origImg.onload = r);
            originalImgRef.current = origImg;

            const maskImg = new Image();
            maskImg.src = URL.createObjectURL(blob);
            await new Promise(r => maskImg.onload = r);

            const width = origImg.width;
            const height = origImg.height;

            editCanvasRef.current.width = width;
            editCanvasRef.current.height = height;
            editCanvasRef.current.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, width, height);
            editCanvasRef.current.getContext('2d', { willReadFrequently: true }).drawImage(maskImg, 0, 0);

            tempCanvasRef.current.width = width;
            tempCanvasRef.current.height = height;

            displayCanvasRef.current.width = width;
            displayCanvasRef.current.height = height;

            setToolMode('preview');
            setScale(1);
            setPan({x: 0, y: 0});
            
            renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount);
            
            historyRef.current = [];
            historyStepRef.current = -1;
            captureHistory();
            
            showToast("智能处理成功！", "success");
        } catch (error) {
            console.error("抠图异常:", error);
            showToast("抠图失败: " + error.message, "error");
        } finally {
            setIsProcessing(false);
            setProgressStr('');
        }
    };

    // ================= 手动画笔/抓手逻辑 =================
    const getCoords = (e) => {
        const visualTarget = displayCanvasRef.current;
        if (!visualTarget) return { x: 0, y: 0 };
        
        const rect = visualTarget.getBoundingClientRect();
        const rawWidth = visualTarget.width;
        const rawHeight = visualTarget.height;
        
        const xOnScreen = e.clientX - rect.left;
        const yOnScreen = e.clientY - rect.top;

        const x = (xOnScreen / rect.width) * rawWidth;
        const y = (yOnScreen / rect.height) * rawHeight;
        
        return { x, y };
    };

    const drawSegment = (x1, y1, x2, y2) => {
        const editCtx = editCanvasRef.current.getContext('2d', { willReadFrequently: true });
        if (toolMode === 'erase') {
            editCtx.save();
            editCtx.globalCompositeOperation = 'destination-out';
            editCtx.lineCap = 'round'; editCtx.lineJoin = 'round'; editCtx.lineWidth = brushSize;
            editCtx.beginPath();
            editCtx.moveTo(x1, y1);
            editCtx.lineTo(x2, y2);
            editCtx.stroke();
            editCtx.restore();
        } else if (toolMode === 'restore') {
            const tCanvas = tempCanvasRef.current;
            const tCtx = tCanvas.getContext('2d');
            tCtx.clearRect(0, 0, tCanvas.width, tCanvas.height);
            
            tCtx.save();
            tCtx.lineCap = 'round'; tCtx.lineJoin = 'round'; tCtx.lineWidth = brushSize;
            tCtx.beginPath();
            tCtx.moveTo(x1, y1);
            tCtx.lineTo(x2, y2);
            tCtx.stroke();
            
            tCtx.globalCompositeOperation = 'source-in';
            tCtx.drawImage(originalImgRef.current, 0, 0);
            tCtx.restore();
            
            editCtx.save();
            editCtx.globalCompositeOperation = 'source-over';
            editCtx.drawImage(tCanvas, 0, 0);
            editCtx.restore();
        }
        
        if (!scheduledRenderRef.current) {
            scheduledRenderRef.current = requestAnimationFrame(() => {
                renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, true); 
                scheduledRenderRef.current = null;
            });
        }
    };

    const updateCursor = (e) => {
        if (!displayCanvasRef.current || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const canvasRect = displayCanvasRef.current.getBoundingClientRect(); 
        const currentScaleRatio = canvasRect.width / displayCanvasRef.current.width;

        setCursorPos({
            x: e.clientX - containerRect.left,
            y: e.clientY - containerRect.top,
            size: brushSize * currentScaleRatio 
        });
    };

    const handlePointerDown = (e) => {
        if (!maskBlob) return;
        e.preventDefault(); 
        
        if (isSpaceDown || toolMode === 'pan') {
            isPanningRef.current = true;
            lastPanRef.current = { x: e.clientX, y: e.clientY };
            return;
        }

        if (toolMode === 'preview') return;

        e.target.setPointerCapture(e.pointerId); 
        isDrawingRef.current = true;
        const coords = getCoords(e);
        lastPosRef.current = { x: coords.x, y: coords.y };
        updateCursor(e);
        drawSegment(coords.x, coords.y, coords.x, coords.y);
    };

    const handlePointerMove = (e) => {
        if (!maskBlob) return;
        
        if (isSpaceDown || toolMode === 'pan') {
            setCursorPos(null); 
            if (isPanningRef.current) {
                const dx = e.clientX - lastPanRef.current.x;
                const dy = e.clientY - lastPanRef.current.y;
                setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                lastPanRef.current = { x: e.clientX, y: e.clientY };
            }
            return;
        }

        if (toolMode === 'preview') return;

        updateCursor(e);
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const coords = getCoords(e);
        drawSegment(lastPosRef.current.x, lastPosRef.current.y, coords.x, coords.y);
        lastPosRef.current = { x: coords.x, y: coords.y };
    };

    const handlePointerUp = (e) => {
        if (!maskBlob) return;
        
        if (isPanningRef.current) {
            isPanningRef.current = false;
            return;
        }

        if (toolMode === 'preview') return;

        e.target.releasePointerCapture(e.pointerId);
        
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            if (scheduledRenderRef.current) {
                cancelAnimationFrame(scheduledRenderRef.current);
                scheduledRenderRef.current = null;
            }
            renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, false);
            captureHistory();
        }
    };

    const handlePointerLeave = (e) => {
        setCursorPos(null);
        if (isPanningRef.current) isPanningRef.current = false;
        
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            if (scheduledRenderRef.current) {
                cancelAnimationFrame(scheduledRenderRef.current);
                scheduledRenderRef.current = null;
            }
            renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, false);
            captureHistory();
        }
    };

    // ================= 工具栏回调与 UI 反馈 =================

    const handleBgChange = (mode) => { setBgMode(mode); renderFinalImage(mode, customColor, shadowBlur, shadowColor, featherAmount); };
    const handleColorChange = (e) => { const col = e.target.value; setCustomColor(col); if(bgMode === 'custom') renderFinalImage('custom', col, shadowBlur, shadowColor, featherAmount); };
    
    const handleShadowChange = (e) => { const val = parseInt(e.target.value); setShadowBlur(val); renderFinalImage(bgMode, customColor, val, shadowColor, featherAmount, true); };
    const handleShadowColorChange = (e) => { const col = e.target.value; setShadowColor(col); if(shadowBlur > 0) renderFinalImage(bgMode, customColor, shadowBlur, col, featherAmount, true); };
    const handleFeatherChange = (e) => { const val = parseInt(e.target.value); setFeatherAmount(val); renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, val, true); };

    const compileHighQualityEffects = () => renderFinalImage(bgMode, customColor, shadowBlur, shadowColor, featherAmount, false);

    const handleBgImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setBgImageSrc(url); setBgMode('image');
            const img = new Image();
            img.src = url;
            img.onload = () => {
                bgImgCache.current = img;
                renderFinalImage('image', customColor, shadowBlur, shadowColor, featherAmount);
            };
        }
    };

    const handleDownload = () => {
        if (!displayCanvasRef.current) return;
        const a = document.createElement('a');
        a.href = displayCanvasRef.current.toDataURL('image/png');
        a.download = `Moyer_Cutout_${new Date().getTime()}.png`;
        a.click();
    };

    // 核心修复4：使用 IndexedDB 传递图像回裁切工具，防止大尺寸 PNG 报错
    const handleGoToCrop = async () => {
        if (!displayCanvasRef.current) return;
        try {
            showToast('正在传输高质量图片数据...', 'info');
            const dataUrl = displayCanvasRef.current.toDataURL('image/png');
            await setTransferImage(dataUrl);
            window.location.href = '?tool=img-crop';
        } catch (e) {
            console.error(e);
            showToast('调用本地存储失败，无法跨工具传递，请先保存到本地', 'error');
        }
    };

    const handleCopyToClipboard = async () => {
        if (!displayCanvasRef.current) return;
        try {
            const blob = await new Promise(resolve => displayCanvasRef.current.toBlob(resolve, 'image/png'));
            if (blob) {
                await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                showToast('已复制到系统剪贴板！', 'success');
            }
        } catch (err) {
            showToast('复制失败，浏览器跨域或协议受限，请尝试直接保存图片', 'error');
        }
    };

    const resetView = () => {
        setScale(1);
        setPan({x:0, y:0});
    };

    const activeVisualMode = isSpaceDown ? 'pan' : toolMode;

    const checkerboardStyle = {
        backgroundImage: 'conic-gradient(rgba(0,0,0,0.06) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.06) 75%, transparent 75%, transparent)',
        backgroundSize: '20px 20px', backgroundColor: '#fff'
    };

    const cursorStyleClass = toolMode === 'preview' ? 'cursor-crosshair' 
                           : (isSpaceDown || toolMode === 'pan') ? (isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab') 
                           : 'cursor-none';

    let displayCursorPos = cursorPos;
    if (isAdjustingBrush && !cursorPos && displayCanvasRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const canvasRect = displayCanvasRef.current.getBoundingClientRect();
        const currentScaleRatio = canvasRect.width / displayCanvasRef.current.width;
        displayCursorPos = {
            x: containerRect.width / 2,
            y: containerRect.height / 2,
            size: brushSize * currentScaleRatio
        };
    }
    const isHoveringValidTool = (toolMode === 'erase' || toolMode === 'restore') && !isSpaceDown && toolMode !== 'pan';
    const showCursorRing = displayCursorPos && (isHoveringValidTool || isAdjustingBrush);

    return React.createElement("div", { 
        className: "min-h-screen bg-slate-50 dark:bg-slate-900 p-6 md:p-8",
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop
    },
        isDragging && React.createElement("div", { className: "fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm border-8 border-dashed border-blue-500 flex items-center justify-center transition-all" },
            React.createElement("div", { className: "bg-white dark:bg-slate-800 px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce" },
                React.createElement("svg", { width: "64", height: "64", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-blue-500 mb-4" }, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", { points: "17 8 12 3 7 8"}), React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15"})),
                React.createElement("span", { className: "text-2xl font-bold text-blue-600 dark:text-blue-400" }, "松开鼠标立即处理")
            )
        ),

        React.createElement("div", { className: "max-w-6xl mx-auto flex flex-col gap-6" },
            React.createElement("div", { className: "glass-card p-6 rounded-3xl flex items-center justify-between shadow-sm" },
                React.createElement("div", null,
                    React.createElement("h1", { className: "text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3" }, 
                        React.createElement("svg", { viewBox: "0 0 24 24", width: "24", height: "24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-blue-500" }, React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })),
                        "AI 智能抠图增强版"
                    ),
                    React.createElement("p", { className: "text-slate-500 text-sm mt-1" }, "浏览器本地运行，支持滚轮缩放、无限撤销与顺滑响应。")
                ),
                !isLoaded && React.createElement("span", { className: "flex items-center gap-2 text-sm text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-full" }, 
                    React.createElement("div", { className: "w-2 h-2 rounded-full bg-amber-500 animate-ping" }), "引擎初始化..."
                )
            ),

            React.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6" },
                // 左侧：预览工作区
                React.createElement("div", { className: "lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center relative border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden" },
                    !imageSrc ? React.createElement(React.Fragment, null,
                        React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, accept: "image/*", className: "hidden" }),
                        React.createElement("button", { onClick: () => fileInputRef.current?.click(), className: "w-64 h-64 rounded-full bg-blue-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-blue-500 hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 border-[6px] border-white dark:border-slate-700" },
                            React.createElement("svg", { viewBox: "0 0 24 24", width: "48", height: "48", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "mb-4 text-blue-500" }, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", { points: "17 8 12 3 7 8"}), React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15"})),
                            React.createElement("span", { className: "font-bold text-lg mb-1" }, "点击上传图片"),
                            React.createElement("span", { className: "text-xs text-blue-400 dark:text-slate-400 font-medium tracking-wide" }, "或将图片拖拽至此区域")
                        )
                    ) : React.createElement("div", { className: "w-full flex flex-col gap-4 h-[500px]" },
                        
                        React.createElement("div", { 
                            ref: containerRef, 
                            className: `relative w-full flex-1 rounded-2xl overflow-hidden shadow-inner select-none group ${cursorStyleClass} bg-slate-100 dark:bg-slate-900`,
                            style: { touchAction: toolMode === 'preview' ? 'auto' : 'none', ...(bgMode === 'transparent' ? checkerboardStyle : {}) },
                            onPointerDown: handlePointerDown,
                            onPointerMove: handlePointerMove,
                            onPointerUp: handlePointerUp,
                            onPointerLeave: handlePointerLeave
                        },
                            React.createElement("div", { 
                                ref: canvasWrapperRef,
                                className: "absolute inset-0 flex items-center justify-center pointer-events-none transform-gpu origin-center",
                                style: { transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` } 
                            },
                                React.createElement("canvas", { ref: displayCanvasRef, className: `max-w-full max-h-full object-contain ${!maskBlob ? 'hidden' : ''}` }),
                                !maskBlob && React.createElement("img", { src: imageSrc, className: "max-w-full max-h-full object-contain opacity-40 blur-[2px]", draggable: false })
                            ),

                            (maskBlob && toolMode === 'preview') && React.createElement("div", { className: "absolute inset-0 w-full h-full pointer-events-none overflow-hidden" },
                                React.createElement("div", { 
                                    className: "absolute top-0 bottom-0 left-0 border-r-[3px] border-white shadow-[1px_0_15px_rgba(0,0,0,0.15)] bg-slate-100 dark:bg-slate-900 flex items-center justify-center", 
                                    style: { width: `${sliderValue}%`, ...(bgMode === 'transparent' ? checkerboardStyle : {}) } 
                                },
                                    React.createElement("div", { className: "absolute flex items-center justify-center transform-gpu origin-center", style: { transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` } },
                                        React.createElement("img", { src: imageSrc, className: "max-w-full max-h-full object-contain", draggable: false })
                                    )
                                )
                            ),
                            
                            (maskBlob && toolMode === 'preview') && React.createElement("div", { className: "absolute top-0 bottom-0 w-1 flex items-center justify-center pointer-events-none z-20", style: { left: `calc(${sliderValue}% - 2px)` } },
                                React.createElement("div", { className: `w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center pointer-events-auto shadow-[0_0_15px_rgba(0,0,0,0.25)] transition-transform ${isSliding ? 'scale-110 cursor-grabbing' : 'cursor-grab hover:scale-105'}`, onPointerDown: (e) => { e.stopPropagation(); setIsSliding(true); } },
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "text-slate-600 dark:text-slate-200" }, React.createElement("path", { d: "m15 18 6-6-6-6"}), React.createElement("path", { d: "m9 6-6 6 6 6"}))
                                )
                            ),

                            maskBlob && React.createElement("div", { className: "absolute bottom-4 right-4 z-30 flex gap-2" },
                                (scale !== 1 || pan.x !== 0 || pan.y !== 0) && React.createElement("button", { 
                                    onClick: resetView, 
                                    className: "bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 p-2 rounded-lg shadow-lg hover:bg-white transition flex items-center gap-1 text-xs font-bold pointer-events-auto"
                                },
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}), React.createElement("path", { d: "M3 3v5h5"})),
                                    "重置视图"
                                )
                            ),
                            
                            showCursorRing && React.createElement("div", {
                                className: "absolute pointer-events-none rounded-full z-50",
                                style: {
                                    left: displayCursorPos.x - displayCursorPos.size / 2,
                                    top: displayCursorPos.y - displayCursorPos.size / 2,
                                    width: displayCursorPos.size,
                                    height: displayCursorPos.size,
                                    backgroundColor: toolMode === 'erase' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(5, 150, 105, 0.4)',
                                    border: '2px solid #ffffff',
                                    boxShadow: '0 0 0 1px rgba(0,0,0,0.8), inset 0 0 6px rgba(0,0,0,0.6)',
                                    transition: isAdjustingBrush ? 'width 0.1s, height 0.1s' : 'none'
                                }
                            })
                        ),

                        React.createElement("div", { className: "flex justify-between items-center w-full gap-4" },
                            React.createElement("div", { className: "text-xs font-medium text-slate-400 dark:text-slate-500 hidden sm:flex items-center gap-4" },
                                React.createElement("span", { className: "flex items-center gap-1" }, React.createElement("kbd", { className: "bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono" }, "滚轮"), " 居中缩放"),
                                React.createElement("span", { className: "flex items-center gap-1" }, React.createElement("kbd", { className: "bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono" }, "长按 Space"), " 临时抓手")
                            ),
                            React.createElement("div", { className: "flex-1 sm:flex-none flex" },
                                React.createElement("input", { type: "file", ref: fileInputRef, onChange: handleFileUpload, accept: "image/*", className: "hidden" }),
                                React.createElement("button", { onClick: () => fileInputRef.current?.click(), className: "w-full sm:w-auto px-6 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm flex justify-center items-center gap-2" }, 
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", { points: "17 8 12 3 7 8"}), React.createElement("line", { x1: "12", x2: "12", y1: "3", y2: "15"})),
                                    "重新选取"
                                )
                            )
                        )
                    ),

                    isProcessing && React.createElement("div", { className: "absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center z-40" },
                        React.createElement("div", { className: "relative w-20 h-20 mb-6" },
                            React.createElement("div", { className: "absolute inset-0 border-4 border-blue-100 dark:border-blue-900 rounded-full" }),
                            React.createElement("div", { className: "absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" })
                        ),
                        React.createElement("p", { className: "text-xl font-bold text-slate-800 dark:text-white mb-2" }, progressStr),
                        React.createElement("p", { className: "text-sm text-slate-500 max-w-[260px] text-center leading-relaxed" }, "首次运行由于计算模型载入可能需十余秒，稍后将进行毫秒级合成。")
                    )
                ),

                // 右侧：控制面板
                React.createElement("div", { className: "glass-card p-6 rounded-3xl flex flex-col overflow-y-auto max-h-[85vh] hide-scrollbar" },
                    
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2" }, 
                            React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2"}), React.createElement("circle", { cx: "8.5", cy: "8.5", r: "1.5"}), React.createElement("polyline", { points: "21 15 16 10 5 21"})),
                            "合成背景设定"
                        ),
                        React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                            [{ id: 'transparent', label: '透明底' }, { id: 'white', label: '纯白底' }, { id: 'black', label: '纯黑底' }, { id: 'custom', label: '提取色' }, { id: 'image', label: '素材图' }].map(m => 
                                React.createElement("button", { 
                                    key: m.id, 
                                    onClick: () => { if(m.id === 'image' && !bgImageSrc) bgInputRef.current?.click(); else handleBgChange(m.id); }, 
                                    className: `py-2.5 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 ${bgMode === m.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}` 
                                }, m.label)
                            )
                        ),
                        React.createElement("input", { type: "file", ref: bgInputRef, onChange: handleBgImageUpload, accept: "image/*", className: "hidden" }),
                        
                        bgMode === 'custom' && React.createElement("div", { className: "mt-3 flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" },
                            React.createElement("input", { type: "color", value: customColor, onChange: handleColorChange, className: "w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent shrink-0" }),
                            React.createElement("div", { className: "flex flex-col" },
                                React.createElement("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider" }, "拾色器代码"),
                                React.createElement("span", { className: "text-sm text-slate-700 dark:text-slate-200 font-mono font-bold" }, customColor.toUpperCase())
                            )
                        ),
                        
                        bgMode === 'image' && bgImageSrc && React.createElement("div", { className: "mt-3 flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700" },
                            React.createElement("img", { src: bgImageSrc, className: "w-10 h-10 rounded-lg object-cover bg-white" }),
                            React.createElement("div", { className: "flex flex-col flex-1" },
                                React.createElement("span", { className: "text-[10px] text-slate-400 font-bold uppercase tracking-wider" }, "自定义素材"),
                                React.createElement("button", { onClick: () => bgInputRef.current?.click(), className: "text-xs font-bold text-blue-500 hover:text-blue-600 text-left" }, "重新选择背景")
                            )
                        )
                    ),

                    React.createElement("div", { className: "mt-5 border-t border-slate-200 dark:border-slate-700 pt-5" },
                        React.createElement("div", { className: "flex justify-between items-center mb-3" },
                            React.createElement("h3", { className: "text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2" }, 
                                React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"})),
                                "细节修正工具"
                            ),
                            React.createElement("div", { className: "flex gap-1" },
                                React.createElement("button", { onClick: handleUndo, disabled: historyIdx <= 0, className: "p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "撤销 (Undo)" },
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M3 7v6h6"}), React.createElement("path", { d: "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"}))
                                ),
                                React.createElement("button", { onClick: handleRedo, disabled: historyIdx >= historyLen - 1, className: "p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors", title: "重做 (Redo)" },
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M21 7v6h-6"}), React.createElement("path", { d: "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"}))
                                )
                            )
                        ),
                        React.createElement("div", { className: "grid grid-cols-4 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl mb-3" },
                            [{ id: 'preview', label: '对比' }, { id: 'pan', label: '抓手' }, { id: 'erase', label: '橡皮' }, { id: 'restore', label: '恢复' }].map(m => {
                                const isActive = activeVisualMode === m.id;
                                let bgClass = 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50';
                                if (isActive) {
                                    if (m.id === 'erase') bgClass = 'bg-rose-500 text-white shadow-sm';
                                    else if (m.id === 'restore') bgClass = 'bg-emerald-500 text-white shadow-sm';
                                    else if (m.id === 'pan') bgClass = 'bg-amber-500 text-white shadow-sm'; 
                                    else bgClass = 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm';
                                }
                                return React.createElement("button", { 
                                    key: m.id, 
                                    onClick: () => setToolMode(m.id), 
                                    className: `py-1.5 rounded-lg text-xs font-bold transition-all ${bgClass}` 
                                }, m.label)
                            })
                        ),
                        toolMode !== 'preview' && toolMode !== 'pan' && React.createElement("div", { className: "flex flex-col gap-2 transition-all" },
                            React.createElement("div", { className: "flex justify-between items-center mt-2" },
                                React.createElement("span", { className: "text-xs font-bold text-slate-500" }, "画笔尺寸"),
                                React.createElement("span", { className: "text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" }, `${brushSize}px`)
                            ),
                            React.createElement("input", { 
                                type: "range", min: "5", max: "200", 
                                value: brushSize, 
                                onChange: (e) => setBrushSize(parseInt(e.target.value)), 
                                onPointerDown: () => setIsAdjustingBrush(true),
                                onPointerUp: () => setIsAdjustingBrush(false),
                                onPointerCancel: () => setIsAdjustingBrush(false),
                                disabled: !maskBlob, 
                                className: "w-full accent-blue-500 cursor-pointer disabled:opacity-50" 
                            })
                        )
                    ),

                    React.createElement("div", { className: "mt-5 border-t border-slate-200 dark:border-slate-700 pt-5 flex flex-col gap-4" },
                        
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex justify-between items-center mb-2" },
                                React.createElement("h3", { className: "text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2" },
                                   React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("circle", { cx: "12", cy: "12", r: "10"}), React.createElement("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"})),
                                   "边缘氛围发光"
                                ),
                                React.createElement("span", { className: "text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" }, `${shadowBlur}px`)
                            ),
                            React.createElement("div", { className: "flex gap-3 items-center" },
                                React.createElement("input", { 
                                    type: "range", min: "0", max: "50", 
                                    value: shadowBlur, 
                                    onChange: handleShadowChange, 
                                    onPointerUp: compileHighQualityEffects,
                                    onPointerCancel: compileHighQualityEffects,
                                    disabled: !maskBlob, 
                                    className: "w-full accent-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                                }),
                                React.createElement("div", { className: "relative w-8 h-8 rounded shrink-0 overflow-hidden shadow-sm" },
                                    React.createElement("input", { type: "color", value: shadowColor, onChange: handleShadowColorChange, disabled: !maskBlob, className: "absolute -inset-2 w-12 h-12 cursor-pointer disabled:cursor-not-allowed" })
                                )
                            )
                        ),

                        React.createElement("div", null,
                            React.createElement("div", { className: "flex justify-between items-center mb-2" },
                                React.createElement("h3", { className: "text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2" },
                                   React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"}), React.createElement("path", { d: "m8 12 3 3 5-5", strokeLinecap: "round", strokeLinejoin: "round", className: "opacity-60"})),
                                   "主体边缘柔化"
                                ),
                                React.createElement("span", { className: "text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded" }, `${featherAmount}px`)
                            ),
                            React.createElement("input", { 
                                type: "range", min: "0", max: "5", step: "1", 
                                value: featherAmount, 
                                onChange: handleFeatherChange, 
                                onPointerUp: compileHighQualityEffects,
                                onPointerCancel: compileHighQualityEffects,
                                disabled: !maskBlob, 
                                className: "w-full accent-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" 
                            })
                        )
                    ),

                    // 底部的核心动作区
                    React.createElement("div", { className: "mt-auto pt-6 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3" },
                        !maskBlob ? 
                            React.createElement("button", { onClick: processImage, disabled: !imageSrc || !isLoaded || isProcessing, className: `col-span-2 w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${(!imageSrc || !isLoaded || isProcessing) ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-500 hover:scale-[1.02]'}` }, 
                                React.createElement("svg", { viewBox: "0 0 24 24", width: "20", height: "20", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"})),
                                "一键智能主体分离"
                            ) 
                            : 
                            React.createElement(React.Fragment, null,
                                React.createElement("button", { onClick: processImage, disabled: isProcessing, className: "col-span-2 w-full py-3 mb-1 rounded-xl font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 transition-all flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-transparent dark:border-blue-800" },
                                     React.createElement("svg", { viewBox: "0 0 24 24", width: "16", height: "16", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"}), React.createElement("path", { d: "M3 3v5h5"})),
                                     "强制重新解析图像"
                                ),
                                React.createElement("div", { className: "col-span-2 grid grid-cols-2 gap-3 mb-1" },
                                    React.createElement("button", { onClick: handleCopyToClipboard, className: "w-full py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 shadow-sm transition-all flex flex-col items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700" }, 
                                        React.createElement("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2"}), React.createElement("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"})),
                                        React.createElement("span", { className: "text-xs mt-1" }, "写入剪贴板")
                                    ),
                                    React.createElement("button", { onClick: handleGoToCrop, className: "w-full py-3 rounded-2xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 shadow-sm transition-all flex flex-col items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700" }, 
                                        React.createElement("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M6 2v14a2 2 0 0 0 2 2h14"}), React.createElement("path", { d: "M18 22V8a2 2 0 0 0-2-2H2"})),
                                        React.createElement("span", { className: "text-xs mt-1" }, "进入裁剪工具")
                                    )
                                ),
                                React.createElement("button", { onClick: handleDownload, className: "col-span-2 w-full py-3.5 rounded-2xl font-bold text-white bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30 transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.03]" }, 
                                    React.createElement("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "none", stroke: "currentColor", strokeWidth: "2" }, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"}), React.createElement("polyline", { points: "7 10 12 15 17 10"}), React.createElement("line", { x1: "12", y1: "15", x2: "12", y2: "3"})),
                                    React.createElement("span", { className: "text-xs mt-1" }, "保存到本地")
                                )
                            )
                    )
                )
            )
        )
    );
};