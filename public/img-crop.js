// ==========================================
// img-crop.js - 独立图片裁剪模块
// ==========================================

// 使用立即执行函数 (IIFE) 隔离作用域，防止与 app.js 的全局变量冲突
(() => {
    window.AppTools = window.AppTools || {};

    const { useState, useEffect, useRef } = React;

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

    const IconBase = ({ children, size = 20, className = "", ...props }) => 
      React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "transition-all " + className, ...props }, children);

    const Icons = {
      ChevronRight: p => React.createElement(IconBase, p, React.createElement("path", { d: "m9 18 6-6-6-6" })),
      LayoutGrid: p => React.createElement(IconBase, p, React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" }), React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" })),
      RefreshCw: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), React.createElement("path", { d: "M3 3v5h5" })),
      Menu: p => React.createElement(IconBase, p, React.createElement("line", { x1: "4", x2: "20", y1: "12", y2: "12" }), React.createElement("line", { x1: "4", x2: "20", y1: "6", y2: "6" }), React.createElement("line", { x1: "4", x2: "20", y1: "18", y2: "18" })),
      Download: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), React.createElement("polyline", { points: "7 10 12 15 17 10" }), React.createElement("line", { x1: "12", x2: "12", y1: "15", y2: "3" })),
      X: p => React.createElement(IconBase, p, React.createElement("path", { d: "M18 6 6 18" }), React.createElement("path", { d: "m6 6 18 12" })),
      Wrench: p => React.createElement(IconBase, p, React.createElement("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })),
      Crop: p => React.createElement(IconBase, p, React.createElement("path", { d: "M6 2v14a2 2 0 0 0 2 2h14" }), React.createElement("path", { d: "M18 22V8a2 2 0 0 0-2-2H2" })),
      Hand: p => React.createElement(IconBase, p, React.createElement("path", { d: "M18 11V6a2 2 0 0 0-4 0v4" }), React.createElement("path", { d: "M14 10V5a2 2 0 0 0-4 0v5" }), React.createElement("path", { d: "M10 9.5V4a2 2 0 0 0-4 0v7.5" }), React.createElement("path", { d: "M6 12v-1a2 2 0 0 0-4 0v6a8 8 0 0 0 8 8h2a8 8 0 0 0 8-8v-7a2 2 0 0 0-4 0v4" })),
      RotateLeft: p => React.createElement(IconBase, p, React.createElement("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), React.createElement("path", { d: "M3 3v5h5" })),
      RotateRight: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }), React.createElement("path", { d: "M21 3v5h-5" })),
      FlipHorizontal: p => React.createElement(IconBase, p, React.createElement("path", { d: "m8 21.5-5.5-9.5L8 2.5" }), React.createElement("path", { d: "m16 21.5 5.5-9.5L16 2.5" }), React.createElement("line", { x1: "12", x2: "12", y1: "2", y2: "22" })),
      FlipVertical: p => React.createElement(IconBase, p, React.createElement("path", { d: "m2.5 8 9.5-5.5L21.5 8" }), React.createElement("path", { d: "m2.5 16 9.5 5.5 9.5-5.5" }), React.createElement("line", { x1: "2", x2: "22", y1: "12", y2: "12" })),
      Box: p => React.createElement(IconBase, p, React.createElement("path", { d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }), React.createElement("path", { d: "m3.3 7 8.7 5 8.7-5" }), React.createElement("path", { d: "M12 22V12" })),
      Info: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "10" }), React.createElement("line", { x1: "12", x2: "12", y1: "16", y2: "12" }), React.createElement("line", { x1: "12", x2: "12.01", y1: "8", y2: "8" })),
      FileText: p => React.createElement(IconBase, p, React.createElement("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), React.createElement("polyline", { points: "14 2 14 8 20 8" }), React.createElement("line", { x1: "16", x2: "8", y1: "13", y2: "13" }), React.createElement("line", { x1: "16", x2: "8", y1: "17", y2: "17" }), React.createElement("line", { x1: "10", x2: "8", y1: "9", y2: "9" })),
      Sun: p => React.createElement(IconBase, p, React.createElement("circle", { cx: "12", cy: "12", r: "5" }), React.createElement("line", { x1: "12", y1: "1", x2: "12", y2: "3" }), React.createElement("line", { x1: "12", y1: "21", x2: "12", y2: "23" }), React.createElement("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }), React.createElement("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }), React.createElement("line", { x1: "1", y1: "12", x2: "3", y2: "12" }), React.createElement("line", { x1: "21", y1: "12", x2: "23", y2: "12" }), React.createElement("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }), React.createElement("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" }))
    };

    const canvasToICO = (canvas) => {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const pngData = new Uint8Array(reader.result);
                    const size = pngData.length;
                    const icoData = new Uint8Array(22 + size);
                    
                    icoData[0] = 0; icoData[1] = 0; 
                    icoData[2] = 1; icoData[3] = 0; 
                    icoData[4] = 1; icoData[5] = 0; 

                    const w = canvas.width > 256 ? 0 : canvas.width;
                    const h = canvas.height > 256 ? 0 : canvas.height;
                    icoData[6] = w; icoData[7] = h; 
                    icoData[8] = 0; icoData[9] = 0; 
                    icoData[10] = 1; icoData[11] = 0; 
                    icoData[12] = 32; icoData[13] = 0; 
                    
                    icoData[14] = size & 0xff;
                    icoData[15] = (size >> 8) & 0xff;
                    icoData[16] = (size >> 16) & 0xff;
                    icoData[17] = (size >> 24) & 0xff;

                    icoData[18] = 22; icoData[19] = 0; icoData[20] = 0; icoData[21] = 0;
                    
                    icoData.set(pngData, 22);

                    const icoBlob = new Blob([icoData], { type: 'image/x-icon' });
                    resolve(URL.createObjectURL(icoBlob));
                };
                reader.readAsArrayBuffer(blob);
            }, 'image/png');
        });
    };

    window.AppTools.ImgCrop = ({ showToast }) => {
        const [imageSrc, setImageSrc] = useState(null);
        const [fileName, setFileName] = useState('');
        const imageRef = useRef(null);
        const cropperRef = useRef(null);
        
        const isMiddleClickDragging = useRef(false);
        const lastMousePoint = useRef({ x: 0, y: 0 });
        
        const [format, setFormat] = useState('image/jpeg');
        const [quality, setQuality] = useState(0.8);
        const [customRatioW, setCustomRatioW] = useState('');
        const [customRatioH, setCustomRatioH] = useState('');
        const [outWidth, setOutWidth] = useState('');
        const [outHeight, setOutHeight] = useState('');

        const [cropData, setCropData] = useState({ width: 0, height: 0 });
        const [scaleX, setScaleX] = useState(1);
        const [scaleY, setScaleY] = useState(1);
        const [showControls, setShowControls] = useState(false);
        const [dragMode, setDragMode] = useState('crop');

        // 核心修复1：使用 IndexedDB 接收数据，避免超大 Base64 崩溃
        useEffect(() => {
            getTransferImage().then(transferImg => {
                if (transferImg) {
                    clearTransferImage(); // 提取完销毁，节约内存
                    setImageSrc(transferImg);
                    setFileName('transfer_image.png');
                    showToast('已接收传送来的图片，可直接开始裁剪', 'success');
                }
            }).catch(e => console.error("读取传送图片失败", e));
        }, []);

        useEffect(() => {
            const handleGlobalMouseMove = (e) => {
                if (isMiddleClickDragging.current && cropperRef.current) {
                    e.preventDefault();
                    const dx = e.clientX - lastMousePoint.current.x;
                    const dy = e.clientY - lastMousePoint.current.y;
                    cropperRef.current.move(dx, dy); 
                    lastMousePoint.current = { x: e.clientX, y: e.clientY };
                }
            };

            const handleGlobalMouseUp = (e) => {
                if (e.button === 1) { 
                    isMiddleClickDragging.current = false;
                    document.body.style.cursor = ''; 
                }
            };

            window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
            window.addEventListener('mouseup', handleGlobalMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleGlobalMouseMove);
                window.removeEventListener('mouseup', handleGlobalMouseUp);
            };
        }, []);

        const handleFileChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                setFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => setImageSrc(reader.result);
                reader.readAsDataURL(file);
            }
        };

        useEffect(() => {
            if (imageSrc && imageRef.current) {
                if (cropperRef.current) cropperRef.current.destroy();
                cropperRef.current = new window.Cropper(imageRef.current, {
                    viewMode: 1,
                    dragMode: dragMode,
                    background: false,
                    responsive: true,
                    restore: false,
                    crop(event) {
                        setCropData({
                            width: Math.round(event.detail.width),
                            height: Math.round(event.detail.height)
                        });
                    }
                });
            }
            return () => {
                if (cropperRef.current) cropperRef.current.destroy();
            };
        }, [imageSrc]);

        useEffect(() => {
            if (cropperRef.current) {
                cropperRef.current.setDragMode(dragMode);
            }
        }, [dragMode]);

        const setRatio = (ratio) => {
            if (cropperRef.current) cropperRef.current.setAspectRatio(ratio);
        };

        const handleCustomRatio = () => {
            if (customRatioW && customRatioH) {
                setRatio(parseFloat(customRatioW) / parseFloat(customRatioH));
            }
        };

        const handleResolutionChange = () => {
            if (outWidth && outHeight && cropperRef.current) {
                setRatio(parseFloat(outWidth) / parseFloat(outHeight));
            }
        };

        const handleReset = () => {
            if (cropperRef.current) {
                cropperRef.current.reset();
                setCustomRatioW('');
                setCustomRatioH('');
                setOutWidth('');
                setOutHeight('');
                setScaleX(1);
                setScaleY(1);
                setFormat('image/jpeg');
                setQuality(0.8);
                setDragMode('crop');
                showToast('已彻底还原图片及所有设定', 'info');
            }
        };

        const handleRotateRight = () => {
            if (cropperRef.current) cropperRef.current.rotate(90);
        };

        const handleRotateLeft = () => {
            if (cropperRef.current) cropperRef.current.rotate(-90);
        };
        
        const handleFlipX = () => {
            if (cropperRef.current) {
                const newScale = scaleX === 1 ? -1 : 1;
                cropperRef.current.scaleX(newScale);
                setScaleX(newScale);
            }
        };

        const handleFlipY = () => {
            if (cropperRef.current) {
                const newScale = scaleY === 1 ? -1 : 1;
                cropperRef.current.scaleY(newScale);
                setScaleY(newScale);
            }
        };

        // 核心修复2：使用 IndexedDB 进行持久化传递，避免 sessionStorage 限制
        const handleGoToRemoveBg = async () => {
            if (!cropperRef.current) return;
            const canvas = cropperRef.current.getCroppedCanvas();
            if (!canvas) {
                showToast('无法获取裁剪区域', 'error');
                return;
            }
            
            showToast('正在传输高质量图片数据...', 'info');
            try {
                // 不必妥协压缩，直接用 png 原质传过去，IndexedDB 能吞吐极大数据
                const dataUrl = canvas.toDataURL('image/png');
                await setTransferImage(dataUrl);
                window.location.href = '?tool=img-remove-bg';
            } catch (e) {
                console.error(e);
                showToast('浏览器本地数据库调用失败，请直接保存到本地', 'error');
            }
        };

        const handleDownload = () => {
            if (!cropperRef.current) return;
            
            let canvasOptions = {};
            if (outWidth && outHeight) {
                canvasOptions.width = parseInt(outWidth);
                canvasOptions.height = parseInt(outHeight);
            }

            const canvas = cropperRef.current.getCroppedCanvas(canvasOptions);
            if (!canvas) {
                showToast('无法生成图片，请检查裁剪区域', 'error');
                return;
            }

            if (format === 'image/x-icon') {
                 let finalWidth = canvas.width;
                 let finalHeight = canvas.height;
                 if (finalWidth > 256 || finalHeight > 256) {
                     const maxDim = Math.max(finalWidth, finalHeight);
                     const scale = 256 / maxDim;
                     finalWidth = Math.floor(finalWidth * scale);
                     finalHeight = Math.floor(finalHeight * scale);
                     
                     const scaledCanvas = document.createElement('canvas');
                     scaledCanvas.width = finalWidth;
                     scaledCanvas.height = finalHeight;
                     const ctx = scaledCanvas.getContext('2d');
                     ctx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
                     
                     canvasToICO(scaledCanvas).then(url => {
                         const a = document.createElement('a');
                         a.href = url;
                         a.download = `cropped_${fileName.split('.')[0] || 'icon'}.ico`;
                         a.click();
                         showToast('ICO图标导出成功(已自动缩放至256px)', 'success');
                     });
                     return;
                 }

                 canvasToICO(canvas).then(url => {
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `cropped_${fileName.split('.')[0] || 'icon'}.ico`;
                     a.click();
                     showToast('ICO图标导出成功', 'success');
                 });
                 return;
            }

            const url = canvas.toDataURL(format, quality);
            const a = document.createElement('a');
            const ext = format === 'image/jpeg' ? 'jpg' : format.split('/')[1];
            a.href = url;
            a.download = `cropped_${fileName.split('.')[0] || 'image'}.${ext}`;
            a.click();
            showToast('图片导出成功', 'success');
            if (window.innerWidth < 1024) setShowControls(false); 
        };

        const handleWrapperMouseDown = (e) => {
            if (e.button === 1 && cropperRef.current) {
                e.preventDefault();
                isMiddleClickDragging.current = true;
                lastMousePoint.current = { x: e.clientX, y: e.clientY };
                document.body.style.cursor = 'grabbing'; 
            }
        };

        const isUpscaling = (outWidth && parseInt(outWidth) > cropData.width) || (outHeight && parseInt(outHeight) > cropData.height);

        return React.createElement("div", { className: "fixed inset-0 z-[200] bg-slate-100 dark:bg-slate-900 flex flex-col h-full w-full overflow-hidden" },
            // Header
            React.createElement("div", { className: "flex items-center justify-between p-4 glass-panel border-b border-slate-200 dark:border-slate-800 shrink-0 relative z-[210]" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("button", { 
                        onClick: () => {
                            if (window.history.length > 1 && !window.opener) {
                                window.history.back();
                            } else {
                                window.close();
                                setTimeout(() => { window.location.search = ''; }, 300);
                            }
                        }, 
                        className: "p-2 bg-white dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm transition-colors text-slate-700 dark:text-slate-200" 
                    }, React.createElement(Icons.ChevronRight, { className: "rotate-180" })),
                    React.createElement("h2", { className: "text-xl font-bold dark:text-white flex items-center gap-2" }, React.createElement(Icons.LayoutGrid, { size: 20, className: "text-emerald-500" }), "高级图片剪裁")
                ),
                imageSrc && React.createElement("div", { className: "flex items-center gap-2" },
                    React.createElement("button", { onClick: handleReset, className: "hidden lg:flex items-center gap-1.5 px-4 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg text-sm font-bold transition-colors" }, 
                        React.createElement(Icons.RefreshCw, { size: 14 }), "还原设定"
                    ),
                    React.createElement("button", { onClick: () => { setImageSrc(null); setOutWidth(''); setOutHeight(''); setCustomRatioW(''); setCustomRatioH(''); }, className: "hidden lg:block px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors dark:text-slate-200" }, "重新选择"),
                    React.createElement("button", { onClick: () => setShowControls(true), className: "flex lg:hidden items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-colors shadow-sm" }, 
                        React.createElement(Icons.Menu, { size: 16 }), "操作栏"
                    )
                )
            ),
            
            // Main Content
            React.createElement("div", { className: "flex-1 flex overflow-hidden relative" },
                // Canvas Area
                React.createElement("div", { 
                    className: "flex-1 p-4 flex items-center justify-center bg-slate-200/50 dark:bg-slate-900/80 overflow-hidden relative",
                    onMouseDown: handleWrapperMouseDown
                },
                    !imageSrc ? 
                    React.createElement("label", { className: "flex flex-col items-center justify-center w-full max-w-2xl h-80 border-2 border-dashed border-emerald-400 dark:border-emerald-600/50 rounded-3xl cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors shadow-sm mx-4" },
                        React.createElement(Icons.Download, { size: 48, className: "text-emerald-500 mb-4" }),
                        React.createElement("span", { className: "text-xl font-bold text-slate-700 dark:text-slate-200" }, "点击或拖拽上传图片"),
                        React.createElement("span", { className: "text-sm text-slate-500 mt-2" }, "支持 JPG, PNG, WebP 等常见格式"),
                        React.createElement("input", { type: "file", accept: "image/*", className: "hidden", onChange: handleFileChange })
                    ) : 
                    React.createElement("div", { className: "w-full h-full max-h-full flex items-center justify-center" },
                        React.createElement("img", { ref: imageRef, src: imageSrc, alt: "source", className: "max-w-full max-h-full block", style: { maxWidth: '100%' } })
                    )
                ),
                
                showControls && React.createElement("div", { 
                    className: "fixed inset-0 bg-black/60 backdrop-blur-sm z-[220] lg:hidden", 
                    onClick: () => setShowControls(false) 
                }),

                // Sidebar Controls
                React.createElement("div", { className: `fixed inset-y-0 right-0 z-[230] w-[85vw] max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:w-80 lg:shadow-none lg:z-0 ${showControls ? 'translate-x-0' : 'translate-x-full'} ${!imageSrc && 'opacity-50 pointer-events-none'}` },
                    
                    React.createElement("div", { className: "flex lg:hidden items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 shrink-0" },
                        React.createElement("span", { className: "font-bold text-slate-800 dark:text-white flex items-center gap-2" }, React.createElement(Icons.Wrench, { size: 16, className: "text-emerald-500" }), "编辑操作栏"),
                        React.createElement("button", { onClick: () => setShowControls(false), className: "p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-500 transition-colors" }, React.createElement(Icons.X, { size: 16 }))
                    ),

                    React.createElement("div", { className: "p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1" },
                        
                        React.createElement("div", { className: "flex gap-2 lg:hidden mb-2" },
                             React.createElement("button", { onClick: handleReset, className: "flex-1 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-200 dark:border-amber-800/50 flex items-center justify-center gap-1.5 transition-colors" }, React.createElement(Icons.RefreshCw, { size: 14 }), "还原"),
                             React.createElement("button", { onClick: () => { setImageSrc(null); setShowControls(false); setOutWidth(''); setOutHeight(''); setCustomRatioW(''); setCustomRatioH(''); }, className: "flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors" }, "重新选择")
                        ),

                        // 操作与模式
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex items-center justify-between" }, 
                                React.createElement("span", { className: "flex items-center gap-2" }, React.createElement(Icons.LayoutGrid, { size: 14 }), "操作与模式"),
                                React.createElement("span", { className: "font-mono text-[10px] font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shadow-inner" }, `${cropData.width} × ${cropData.height} px`)
                            ),

                            React.createElement("div", { className: "mb-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex" },
                                React.createElement("button", { onClick: () => setDragMode('crop'), className: `flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${dragMode === 'crop' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}` }, React.createElement(Icons.Crop, { size: 14 }), "框选裁剪"),
                                React.createElement("button", { onClick: () => setDragMode('move'), className: `flex-1 py-2 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${dragMode === 'move' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}` }, React.createElement(Icons.Hand, { size: 14 }), "拖动图片")
                            ),

                            // 基础操作
                            React.createElement("div", { className: "flex gap-2" },
                                React.createElement("button", { onClick: handleRotateLeft, className: "flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col items-center justify-center gap-1.5" }, React.createElement(Icons.RotateLeft, { size: 16 }), "左转"),
                                React.createElement("button", { onClick: handleRotateRight, className: "flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col items-center justify-center gap-1.5" }, React.createElement(Icons.RotateRight, { size: 16 }), "右转"),
                                React.createElement("button", { onClick: handleFlipX, className: "flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col items-center justify-center gap-1.5" }, React.createElement(Icons.FlipHorizontal, { size: 16 }), "水平"),
                                React.createElement("button", { onClick: handleFlipY, className: "flex-1 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors flex flex-col items-center justify-center gap-1.5" }, React.createElement(Icons.FlipVertical, { size: 16 }), "垂直")
                            )
                        ),

                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex items-center gap-2" }, React.createElement(Icons.LayoutGrid, { size: 14 }), "快捷比例"),
                            React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                                [
                                    { label: '自由比例', ratio: NaN }, { label: '1:1 方型', ratio: 1 },
                                    { label: '16:9 横屏', ratio: 16/9 }, { label: '9:16 竖屏', ratio: 9/16 },
                                    { label: '4:3', ratio: 4/3 }, { label: '3:4', ratio: 3/4 },
                                    { label: '3:2', ratio: 3/2 }, { label: '2:3', ratio: 2/3 },
                                    { label: '5:4 证件照', ratio: 5/4 }, { label: '7:6 证件照', ratio: 7/6 },
                                ].map(p => 
                                    React.createElement("button", { key: p.label, onClick: () => setRatio(p.ratio), className: `py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 transition-colors ${p.label === '自由比例' ? 'col-span-3 bg-slate-100 dark:bg-slate-700' : ''}` }, p.label)
                                )
                            )
                        ),
                        
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex items-center gap-2" }, React.createElement(Icons.Wrench, { size: 14 }), "自定义比例"),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("input", { type: "number", value: customRatioW, onChange: e=>setCustomRatioW(e.target.value), placeholder: "宽 (如15)", className: "w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none text-sm dark:text-white focus:border-emerald-500 transition-colors" }),
                                React.createElement("span", { className: "font-bold text-slate-400" }, ":"),
                                React.createElement("input", { type: "number", value: customRatioH, onChange: e=>setCustomRatioH(e.target.value), placeholder: "高 (如2)", className: "w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 outline-none text-sm dark:text-white focus:border-emerald-500 transition-colors" }),
                                React.createElement("button", { onClick: handleCustomRatio, className: "px-3 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors shrink-0" }, "应用")
                            )
                        ),
                        
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase flex items-center gap-2" }, React.createElement(Icons.Box, { size: 14 }), "导出分辨率 (像素)"),
                            React.createElement("p", { className: "text-[10px] text-slate-400 mb-3 leading-tight" }, "应用后自动锁定对应比例剪裁。留空则按原图尺寸裁剪。"),
                            React.createElement("div", { className: "flex items-center gap-2" },
                                React.createElement("input", { type: "number", value: outWidth, onChange: e=>setOutWidth(e.target.value), placeholder: "宽度 (px)", className: `w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border outline-none text-sm dark:text-white transition-colors ${isUpscaling ? 'border-rose-400 focus:border-rose-500 text-rose-600 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'}` }),
                                React.createElement("span", { className: "font-bold text-slate-400" }, "x"),
                                React.createElement("input", { type: "number", value: outHeight, onChange: e=>setOutHeight(e.target.value), placeholder: "高度 (px)", className: `w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border outline-none text-sm dark:text-white transition-colors ${isUpscaling ? 'border-rose-400 focus:border-rose-500 text-rose-600 dark:text-rose-400' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'}` }),
                                React.createElement("button", { onClick: handleResolutionChange, className: "px-3 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors shrink-0" }, "应用")
                            ),
                            isUpscaling && React.createElement("div", { className: "mt-2 p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-1.5" },
                                React.createElement(Icons.Info, { size: 14, className: "shrink-0 mt-0.5" }),
                                React.createElement("span", null, "目标分辨率超出实际裁剪区(过度放大)，导出图片可能会模糊失真。")
                            )
                        ),
                        
                        React.createElement("div", null,
                            React.createElement("h3", { className: "text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase flex items-center gap-2" }, React.createElement(Icons.FileText, { size: 14 }), "格式与压缩"),
                            React.createElement("div", { className: "space-y-4" },
                                React.createElement("select", { value: format, onChange: e=>setFormat(e.target.value), className: "w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none text-sm font-bold dark:text-white focus:border-emerald-500 transition-colors cursor-pointer" },
                                    React.createElement("option", { value: "image/jpeg" }, "JPG (有损，体积小)"),
                                    React.createElement("option", { value: "image/png" }, "PNG (无损，支持透明底)"),
                                    React.createElement("option", { value: "image/webp" }, "WebP (高压缩比推荐)"),
                                    React.createElement("option", { value: "image/x-icon" }, "ICO (自动生成桌面图标)")
                                ),
                                
                                (format === 'image/jpeg' || format === 'image/webp') && React.createElement("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700" },
                                    React.createElement("div", { className: "flex justify-between text-xs mb-2 font-bold text-slate-600 dark:text-slate-300" },
                                        React.createElement("span", null, "图像质量/压缩率"),
                                        React.createElement("span", { className: "text-emerald-600 dark:text-emerald-400" }, Math.round(quality * 100) + "%")
                                    ),
                                    React.createElement("input", { type: "range", min: "0.1", max: "1", step: "0.05", value: quality, onChange: e=>setQuality(parseFloat(e.target.value)), className: "w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" })
                                )
                            )
                        )
                    ), 

                    React.createElement("div", { className: "p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 space-y-3" },
                        React.createElement("button", { onClick: handleGoToRemoveBg, disabled: !imageSrc, className: `w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${imageSrc ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm active:scale-[0.98]' : 'bg-transparent text-slate-400 border border-slate-200 dark:border-slate-800 cursor-not-allowed hidden'}` },
                            React.createElement(Icons.Sun, { size: 18 }), "去智能抠图"
                        ),
                        React.createElement("button", { onClick: handleDownload, disabled: !imageSrc, className: `w-full py-3.5 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${imageSrc ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/30 active:scale-[0.98]' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'}` },
                            React.createElement(Icons.Download, { size: 20 }), "保存到本地设备"
                        )
                    )
                )
            )
        );
    };
})();
