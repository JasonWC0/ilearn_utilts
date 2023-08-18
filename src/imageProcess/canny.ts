type Image = number[][];
type Kernel = number[][];

function convolve(image: Image, kernel: Kernel): Image {
  const rows = image.length;
  const cols = image[0].length;
  const kRows = kernel.length;
  const kCols = kernel[0].length;
  const halfKRows = Math.floor(kRows / 2);
  const halfKCols = Math.floor(kCols / 2);
  const output: Image = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      for (let m = -halfKRows; m <= halfKRows; m++) {
        for (let n = -halfKCols; n <= halfKCols; n++) {
          const x = i + m;
          const y = j + n;
          if (x >= 0 && x < rows && y >= 0 && y < cols) {
            output[i][j] += image[x][y] * kernel[m + halfKRows][n + halfKCols];
          }
        }
      }
    }
  }
  return output;
}

function canny(image: Image, lowThreshold: number, highThreshold: number): Image {
  // Step 1: Gaussian blur
  const gaussianKernel: Kernel = [
    [1, 4, 6, 4, 1],
    [4, 16, 24, 16, 4],
    [6, 24, 36, 24, 6],
    [4, 16, 24, 16, 4],
    [1, 4, 6, 4, 1]
  ];
  const sum = 256;
  for (let i = 0; i < gaussianKernel.length; i++) {
    for (let j = 0; j < gaussianKernel[0].length; j++) {
      gaussianKernel[i][j] /= sum;
    }
  }
  const blurredImage = convolve(image, gaussianKernel);

  // Step 2: Compute the gradient and direction
  const gxKernel: Kernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const gyKernel: Kernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
  const gx = convolve(blurredImage, gxKernel);
  const gy = convolve(blurredImage, gyKernel);

  const rows = image.length;
  const cols = image[0].length;
  const magnitude = Array.from({ length: rows }, () => Array(cols).fill(0));
  const direction = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      magnitude[i][j] = Math.sqrt(gx[i][j] * gx[i][j] + gy[i][j] * gy[i][j]);
      direction[i][j] = Math.atan2(gy[i][j], gx[i][j]);
    }
  }

  // Step 3: Non-maximum suppression
  const suppressed = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 1; i < rows - 1; i++) {
    for (let j = 1; j < cols - 1; j++) {
      const dir = ((direction[i][j] + Math.PI) * 8) / (2 * Math.PI);
      const dirIndex = Math.round(dir) % 8;

      let px1, px2;

      if (dirIndex === 0 || dirIndex === 4) {
        px1 = magnitude[i][j - 1];
        px2 = magnitude[i][j + 1];
      } else if (dirIndex === 1 || dirIndex === 5) {
        px1 = magnitude[i - 1][j + 1];
        px2 = magnitude[i + 1][j - 1];
      } else if (dirIndex === 2 || dirIndex === 6) {
        px1 = magnitude[i - 1][j];
        px2 = magnitude[i + 1][j];
      } else {
        px1 = magnitude[i - 1][j - 1];
        px2 = magnitude[i + 1][j + 1];
      }

      if (magnitude[i][j] >= px1 && magnitude[i][j] >= px2) {
        suppressed[i][j] = magnitude[i][j];
      }
    }
  }

  // Step 4: Double threshold
  const edges = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (suppressed[i][j] > highThreshold) {
        edges[i][j] = 255;
      } else if (suppressed[i][j] > lowThreshold) {
        edges[i][j] = 127;
      }
    }
  }

  return edges;
}

// Example usage
const image: Image = [
  [255, 255, 255, 255, 255],
  [255, 255, 0, 255, 255],
  [255, 255, 0, 255, 255],
  [255, 255, 0, 255, 255],
  [255, 255, 255, 255, 255]
];

const lowThreshold = 100;
const highThreshold = 200;

import * as fs from 'fs';
import sharp from 'sharp';

const imagePath = 'src/imageProcess/license1.jpg'; // 替換為你的圖片文件路徑

// 讀取本地圖片文件
const imageBuffer = fs.readFileSync(imagePath);

// 使用 sharp 库解碼圖片并获取像素数据
sharp(imageBuffer)
  .raw()
  .toBuffer()
  .then((data: Buffer) => {
    // 將 Buffer 轉換為 TypedArray (Uint8Array)
    const array: Uint8Array = new Uint8Array(data);

    // 打印陣列
    console.log(array);
  })
  .catch((err: Error) => {
    console.error(err);
  });

const edges = canny(image, lowThreshold, highThreshold);
