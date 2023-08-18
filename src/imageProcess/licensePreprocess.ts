import sharp from 'sharp';

/**
 * 裁剪圖像，只保留感興趣的部分。
 * 
 * @param inputImagePath 輸入圖像的路徑
 * @param outputImagePath 輸出圖像的路徑
 * @param top 左上角 y 坐標
 * @param left 左上角 x 坐標
 * @param width 裁剪的寬度
 * @param height 裁剪的高度
 */
async function cropImage(inputImagePath: string, outputImagePath: string, top: number, left: number, width: number, height: number): Promise<void> {
  await sharp(inputImagePath)
    .extract({ top, left, width, height })
    .toFile(outputImagePath);
}

/**
 * 使用高斯模糊去噪。
 * 
 * @param inputImagePath 輸入圖像的路徑
 * @param outputImagePath 輸出圖像的路徑
 * @param blurLevel 模糊級別
 */
async function denoiseImage(inputImagePath: string, outputImagePath: string, blurLevel: number): Promise<void> {
  await sharp(inputImagePath)
    .blur(blurLevel)
    .toFile(outputImagePath);
}

/**
 * 將圖像二值化。
 * 
 * @param inputImagePath 輸入圖像的路徑
 * @param outputImagePath 輸出圖像的路徑
 * @param threshold 閾值
 */
async function binarizeImage(inputImagePath: string, outputImagePath: string, threshold: number): Promise<void> {
  await sharp(inputImagePath)
    .threshold(threshold)
    .toFile(outputImagePath);
}


// 侵蝕
function erode(image: number[][], kernelSize: number): number[][] {
  const height = image.length;
  const width = image[0].length;
  const halfKernel = Math.floor(kernelSize / 2);
  const result: number[][] = Array.from({ length: height }, () => Array(width).fill(1));

  for (let i = halfKernel; i < height - halfKernel; i++) {
    for (let j = halfKernel; j < width - halfKernel; j++) {
      for (let m = -halfKernel; m <= halfKernel; m++) {
        for (let n = -halfKernel; n <= halfKernel; n++) {
          if (image[i + m][j + n] === 0) {
            result[i][j] = 0;
            break;
          }
        }
      }
    }
  }
  return result;
}
// 膨脹
function dilate(image: number[][], kernelSize: number): number[][] {
  const height = image.length;
  const width = image[0].length;
  const halfKernel = Math.floor(kernelSize / 2);
  const result: number[][] = Array.from({ length: height }, () => Array(width).fill(0));

  for (let i = halfKernel; i < height - halfKernel; i++) {
    for (let j = halfKernel; j < width - halfKernel; j++) {
      for (let m = -halfKernel; m <= halfKernel; m++) {
        for (let n = -halfKernel; n <= halfKernel; n++) {
          if (image[i + m][j + n] === 1) {
            result[i][j] = 1;
            break;
          }
        }
      }
    }
  }
  return result;
}



// 使用示例
(async () => {
  const inputImagePath = 'src/imageProcess/license1.jpg';
  const croppedImagePath = 'src/imageProcess/output_cropped.png';
  const denoisedImagePath = 'src/imageProcess/output_denoised.png';
  const binarizedImagePath = 'src/imageProcess/output_binarized.png';

  // await cropImage(inputImagePath, croppedImagePath, 100, 100, 400, 300);
  // await denoiseImage(inputImagePath, denoisedImagePath, 2);
  await binarizeImage(inputImagePath, binarizedImagePath, 120);
})();
