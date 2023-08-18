
function replaceAndRemoveUnmatchedLines(htmlContent: string, replacements: Record<string, string | boolean>) {
  const lines: string[] = htmlContent.split('\n');

  const updatedLines: string[] = lines.map(line => {
    const matches = line.match(/{(.*?)}/g);
    if (matches) {
      for (let match of matches) {
        const key = match.slice(1, -1);
        if (replacements.hasOwnProperty(key)) {
          if (typeof replacements[key] === "boolean") {
            if (!replacements[key]) {
              // 如果key的值為false，則刪除該行
              return 'empty';
            }
            // 如果key的值為true，則繼續處理下一個匹配
          } else {
            line = line.replace(new RegExp(`{${key}}`, 'g'), replacements[key] as string);
          }
        } else {
          // 如果replacements中不存在key，則刪除該行
          return 'empty';
        }
      }
    }
    return line;
  });

  // 過濾掉標記為'empty'的行，並重新合併為一個字符串
  return updatedLines.filter(line => line !== 'empty').join('\n');
}


// Example usage:
const courseIntoduceTemplate: string = `
<h2>
    <span style="color: rgb(64, 64, 64);">｜課程概述｜</span>
</h2>
<p>
    <br>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程名稱：</span>
    <span style="color: rgb(0, 176, 80);">{courseName}</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程講師：{teacherName}</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程類型：{courseType}</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程長度：{liveDuration}分鐘</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程積分：{ponit}積分</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程字號：</span>字號123456 ( 字號起訖日： 2023年12月31日 至 2023年12月31日 )</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;課程費用：新台幣{courseFee}元，優惠價新台幣{specialPrice}元</span>
</p>
<p>●
    <span style="color: rgb(64, 64, 64);">&nbsp;適合族群：(1){targetGroup1}(2){targetGroup2}</span>
</p>
<p>
    <br>
</p>
{htmlCourseContent}
<p>
    <span style="color: rgb(64, 64, 64);">&nbsp;</span>
</p>
<h2>
    <span style="color: rgb(64, 64, 64);">｜課程學習成效｜</span>
</h2>
<p>
    <br>
</p>
<p>{htmlLearningEffeciency1}</p>
<p>{htmlLearningEffeciency2}</p>
<p>{htmlLearningEffeciency3}</p>
<p>{htmlLearningEffeciency4}</p>
<p>{htmlLearningEffeciency5}</p>
<p>
    <br>
</p>
<h2 class="ql-align-justify">
    <span style="color: rgb(68, 68, 68);">﻿｜教育積分狀態與購課說明｜</span>
</h2>
<p>
    <br>
</p>
<p>
    <span style="color: rgb(68, 68, 68);">★&nbsp;</span>請點選&nbsp;『
    <a href="https://ilearning.compal-health.com/faq#%E9%97%9C%E6%96%BC%E7%A9%8D%E5%88%86%E7%9B%B8%E9%97%9C%E8%AA%AA%E6%98%8E" target="_blank" style="background-color: rgb(255, 255, 102); color: rgb(65, 131, 196); font-family: &quot;Noto Sans TC&quot;, &quot;PingFang TC&quot;, &quot;\\5FAE軟正黑體&quot;, &quot;Microsoft JhengHei&quot;, &quot;\\7D30明體&quot;, MingLiU, sans-serif;">積分申請說明</a>』&nbsp;參閱操作方式</p>
<p>
    <span style="color: rgb(68, 68, 68);">★&nbsp;</span>請點選&nbsp;『
    <a href="https://ilearning.compal-health.com/faq#%E9%97%9C%E6%96%BC%E8%B3%BC%E8%AA%B2%E4%BB%98%E6%AC%BE%E7%9B%B8%E9%97%9C%E8%AA%AA%E6%98%8E" target="_blank" style="background-color: rgb(255, 255, 102); color: rgb(65, 131, 196); font-family: &quot;Noto Sans TC&quot;, &quot;PingFang TC&quot;, &quot;\\5FAE軟正黑體&quot;, &quot;Microsoft JhengHei&quot;, &quot;\\7D30明體&quot;, MingLiU, sans-serif;">購課說明</a>』&nbsp;參閱操作方式</p>
<p>
    <br>
</p>
<p>
    <br>
</p>
<p class="ql-align-justify">
    <span style="color: rgb(62, 58, 57);">﻿</span>
    <span style="color: rgb(0, 41, 102);">
        <img src="https://storage.googleapis.com/icare-elearning-prod-bucket/images/20220517182240_b42a3a59-9759-4050-b418-3e1110e681d1..png">
    </span>
</p>
<p class="ql-align-justify">
    <br>
</p>
<p class="ql-align-justify">
    <span style="color: rgb(51, 51, 51);">✦</span>
    <span style="color: rgb(0, 41, 102);">Line好友募集中。加入好友，優惠不漏接：</span>
    <a href="https://lin.ee/R94Zl9i" target="_blank" style="color: rgb(65, 131, 196); font-family: &quot;Noto Sans TC&quot;, &quot;PingFang TC&quot;, &quot;\\5FAE軟正黑體&quot;, &quot;Microsoft JhengHei&quot;, &quot;\\7D30明體&quot;, MingLiU, sans-serif;">https://lin.ee/R94Zl9i</a>
</p>
<p>
    <br>
</p>
<ul>
    <li>
        <a href="https://quilljs.com" target="_blank">Quill.js</a>, the free, open source WYSIWYG editor</li>
    <li>
        <a href="https://zenoamaro.github.io/react-quill" target="_blank">React-quill</a>, a React component that wraps Quill.js</li>
</ul>
`

const courseContentTemplate = `
<p>●&nbsp;
    <span style="color: rgb(64, 64, 64);">單元{topic}：{courseContent}</span>
</p>
`

const courseEffeciencyTemplate = `
<p>
    <span style="color: rgb(51, 51, 51); font-family: &quot;Microsoft JhengHei&quot;, sans-serif; font-size: 15px; background-color: rgb(255, 255, 255);">{number}.&nbsp;</span>
    <span style="color: rgb(64, 64, 64); font-family: &quot;Microsoft JhengHei&quot;, sans-serif; font-size: 15px; background-color: rgb(255, 255, 255);">{learningEffeciency}</span>
</p>
`

const creditSerialTemplate = `
    <span style="color: rgb(64, 64, 64);">{crditSerial}</span>
    <u style="color: rgb(64, 64, 64);">( 字號起訖日： {crditSerilaStartAt} 至 {crditSerilaEndAt} )</u>
`
const courseContentsTemplate = `
<h2>
    <span style="color: rgb(64, 64, 64);">｜課程內容｜</span>
</h2>
<p>
    <br>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent1}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent2}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent3}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent4}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent7}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent8}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent9}</span>
</p>
<p>
    <span style="color: rgb(64, 64, 64);">{htmlCourseContent10}</span>
</p>`


const customDate = new Date('2023-12-31T00:00:00+08:00');
const formattedDate = `${customDate.getFullYear()}年${customDate.getMonth() + 1}月${customDate.getDate()}日`;

console.log('formattedDate', formattedDate)
replaceAndRemoveUnmatchedLines
const courseContent = replaceAndRemoveUnmatchedLines(courseContentsTemplate, {
  htmlCourseContent1: replaceAndRemoveUnmatchedLines(courseContentTemplate, { topic: '一', courseContent: '內容依' }),
  htmlCourseContent3: replaceAndRemoveUnmatchedLines(courseContentTemplate, { topic: '三', courseContent: '內容三' }),
})
const replacements: Record<string, string | boolean> = {
  courseName: "超棒",
  teacherName: "王棒",
  htmlCourseContent: courseContent,
  htmlCourseContent2: false,
  htmlLearningEffeciency2: replaceAndRemoveUnmatchedLines(courseEffeciencyTemplate, { number: '2', learningEffeciency: '效率2' }),
  htmlLearningEffeciency4: replaceAndRemoveUnmatchedLines(courseEffeciencyTemplate, { number: '4', learningEffeciency: '效率4' }),
  htmlCreditSerial: replaceAndRemoveUnmatchedLines(creditSerialTemplate, { crditSerial: '字號123456', crditSerilaStartAt: formattedDate, crditSerilaEndAt: formattedDate })
  // ... and so on for other replacements
}
const updatedHtml: string = replaceAndRemoveUnmatchedLines(courseIntoduceTemplate, replacements);

console.log(updatedHtml)

