document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const previewSection = document.querySelector('.preview-section');
    const originalImage = document.getElementById('originalImage');
    const compressedImage = document.getElementById('compressedImage');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const formatSelect = document.getElementById('formatSelect');

    let originalFile = null;

    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => fileInput.click());

    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);

    // 拖拽事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 质量滑块事件
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
        if (originalFile) {
            compressImage(originalFile, this.value / 100);
        }
    });

    // 格式选择变化事件
    formatSelect.addEventListener('change', function() {
        if (originalFile) {
            compressImage(originalFile, qualitySlider.value / 100);
        }
    });

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        originalFile = file;
        previewSection.style.display = 'block';
        
        // 显示原始图片
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            originalSize.textContent = formatFileSize(file.size);
            compressImage(file, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    function compressImage(file, quality) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                
                // 计算适当的画布尺寸
                let width = img.width;
                let height = img.height;
                
                // 如果图片尺寸过大，进行等比缩放
                const MAX_WIDTH = 2048;
                const MAX_HEIGHT = 2048;
                
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    } else {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                // 使用更好的图像平滑算法
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);
                
                // 根据原始文件类型选择最佳的压缩格式
                let outputType = formatSelect.value === 'auto' ? file.type : formatSelect.value;
                let outputQuality = quality;
                
                // 如果是 PNG，且质量设置较低时，转换为 JPEG 可能会得到更好的压缩效果
                if (file.type === 'image/png' && quality < 0.5) {
                    outputType = 'image/jpeg';
                }
                
                canvas.toBlob(function(blob) {
                    // 如果压缩后的大小反而变大，则使用原始文件
                    if (blob.size >= file.size) {
                        compressedImage.src = URL.createObjectURL(file);
                        compressedSize.textContent = formatFileSize(file.size);
                        downloadBtn.onclick = () => {
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(file);
                            link.download = file.name;
                            link.click();
                        };
                    } else {
                        compressedImage.src = URL.createObjectURL(blob);
                        compressedSize.textContent = formatFileSize(blob.size);
                        downloadBtn.onclick = () => {
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(blob);
                            link.download = `compressed_${file.name}`;
                            link.click();
                        };
                    }
                }, outputType, outputQuality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 