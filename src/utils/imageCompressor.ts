import type { CompressedImage } from '../types';

const MAX_LONG_EDGE = 1024;
const JPEG_QUALITY = 0.8;

/**
 * 將圖片檔案透過 HTML5 Canvas 等比例縮放至長邊最大 1024px，並輸出為 JPEG (品質 0.8)
 */
export async function compressImageFile(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`檔案「${file.name}」不是有效的圖片格式。`);
  }

  const dataUrl = await readFileAsDataURL(file);
  const img = await loadImage(dataUrl);

  let targetWidth = img.naturalWidth || img.width;
  let targetHeight = img.naturalHeight || img.height;

  if (targetWidth === 0 || targetHeight === 0) {
    throw new Error(`無法讀取圖片「${file.name}」的尺寸資訊。`);
  }

  const longEdge = Math.max(targetWidth, targetHeight);
  if (longEdge > MAX_LONG_EDGE) {
    const scale = MAX_LONG_EDGE / longEdge;
    targetWidth = Math.round(targetWidth * scale);
    targetHeight = Math.round(targetHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('瀏覽器不支援 Canvas 2D 繪圖，無法壓縮圖片。');
  }

  // Fill white background in case source is transparent PNG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const base64 = compressedDataUrl.split(',')[1] || '';

  // Approximate byte size from base64 length
  const compressedSize = Math.round((base64.length * 3) / 4);

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    dataUrl: compressedDataUrl,
    base64,
    mimeType: 'image/jpeg',
    width: targetWidth,
    height: targetHeight,
    originalSize: file.size,
    compressedSize,
    fileName: file.name,
  };
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('讀取圖片失敗。'));
      }
    };
    reader.onerror = () => reject(new Error(`讀取檔案「${file.name}」時發生錯誤。`));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('圖片解碼失敗，請確認檔案未損毀。'));
    img.src = src;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
