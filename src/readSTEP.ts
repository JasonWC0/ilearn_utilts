import * as fs from 'fs';

function extractSteps(tsFilePath: string, outputTxt: string): void {
  fs.readFile(tsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading the file:", err);
      return;
    }

    // Split the file content by lines
    const lines = data.split('\n');
    const matchingLines: string[] = [];

    lines.forEach((line, index) => {
      if (line.includes('STEP_')) {
        // Add 1 to index because line numbers start from 1
        matchingLines.push(`Line ${index + 1}: ${line.trim()}`);
      }
    });

    fs.writeFile(outputTxt, matchingLines.join('\n'), 'utf8', (err) => {
      if (err) {
        console.error("Error writing to the file:", err);
        return;
      }
      console.log(`Results saved to ${outputTxt}`);
    });
  });
}

// 使用方法:
// 假設你的 .ts 檔案叫做 'example.ts' 並且你想將結果儲存到 'output.txt'
extractSteps('example.ts', 'output.txt');
