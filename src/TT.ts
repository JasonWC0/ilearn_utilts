//------------------------- create live----------------------------------------------------------
const excelLiveResults = await ImportHelper.parseImportLiveClass(uploadFile.buffer)
const LiveCourses = excelLiveResults.courseObjects
failed.push(...excelLiveResults.failed)

// 取得建立直播課程所需資料
const createLiveCourseDates = await Promise.all(LiveCourses.map(async LiveCourse => {
  let creditSerial = '申請中'
  let creditSerialTemplateUsed = ApplyCreditSerialTemplate
  if (!LiveCourse.isSuccess) {
    return false
  }


  // 取代課程內容html字樣
  const courseContents = ReplaceHtmlContent(courseContentsTemplate, {
    htmlCourseContent1: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.one, courseContent: LiveCourse.courseContent1 }),
    htmlCourseContent2: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.two, courseContent: LiveCourse.courseContent2 }),
    htmlCourseContent3: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.three, courseContent: LiveCourse.courseContent3 }),
    htmlCourseContent4: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.four, courseContent: LiveCourse.courseContent4 }),
    htmlCourseContent5: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.five, courseContent: LiveCourse.courseContent5 }),
    htmlCourseContent6: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.six, courseContent: LiveCourse.courseContent6 }),
    htmlCourseContent7: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.seven, courseContent: LiveCourse.courseContent7 }),
    htmlCourseContent8: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.eight, courseContent: LiveCourse.courseContent8 }),
    htmlCourseContent9: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.nine, courseContent: LiveCourse.courseContent9 }),
    htmlCourseContent10: ReplaceHtmlContent(courseContentTemplate, { topic: chineseNumber.ten, courseContent: LiveCourse.courseContent10 }),
  })

  // 如果無字號則使用申請中
  if (LiveCourse.creditSerial) {
    creditSerial = LiveCourse.creditSerial
  }
  // 如果有字號使用有字號版本的模板
  if (LiveCourse.htmlCreditEndAt && LiveCourse.htmlCreditSerialSrtartAt) {
    creditSerialTemplateUsed = ApplyCreditSerialTemplate
  }
  const introReplacements: Record<string, string | boolean> = {
    courseName: LiveCourse.courseName,
    teacherName: LiveCourse.teacherName,
    courseType: LiveCourse.courseType,
    liveDuration: LiveCourse.liveDuration.toString(),
    ponit: LiveCourse.point.toString(),
    htmlCreditSerial: ReplaceHtmlContent(creditSerialTemplateUsed,
      {
        crditSerial: LiveCourse.crditSerial,
        crditSerilaStartAt: toDateString(LiveCourse.htmlCreditEndAt),
        crditSerilaEndAt: toDateString(LiveCourse.htmlCreditEndAt)
      }),
    courseFee: LiveCourse.courseFee.toString(),
    specialPrice: LiveCourse.specialPrice.toString(),
    targetGroup1: LiveCourse.targetGroup1,
    targetGroup2: LiveCourse.targetGroup2,
    htmlCourseContent: courseContents.replace(/\n/g, ''),
    htmlLearningEffeciency1: ReplaceHtmlContent(courseEffeciencyTemplate, { number: stingNumber.one, learningEffeciency: LiveCourse.learningEffeciency1 }),
    htmlLearningEffeciency2: ReplaceHtmlContent(courseEffeciencyTemplate, { number: stingNumber.two, learningEffeciency: LiveCourse.learningEffeciency2 }),
    htmlLearningEffeciency3: ReplaceHtmlContent(courseEffeciencyTemplate, { number: stingNumber.three, learningEffeciency: LiveCourse.learningEffeciency3 }),
    htmlLearningEffeciency4: ReplaceHtmlContent(courseEffeciencyTemplate, { number: stingNumber.four, learningEffeciency: LiveCourse.learningEffeciency4 }),
  }

  const introduction = ReplaceHtmlContent(courseIntoduceTemplate, introReplacements)
  const banner = ''
  const mbanner = ''
  // const banner = await gcs.uploadToGCSAsync(LiveCourse.coursePCImageUrl, `${LiveCourse.courseName}-Online-banner`)
  // const mbanner = await gcs.uploadToGCSAsync(LiveCourse.coursePhoneImageUrl, `${LiveCourse.courseName}-Online-mbanner`)
  // // 讀取 HTML
  // console.log('introduction', introduction)

  const createPlanBody = {
    type: 'LIVE',
    status: 'ONLINEREVIEW',
    name: LiveCourse.courseName,
    category: courseRelateDictionary(LiveCourse.courseType),
    attribute: LiveCourse.courseSubType,
    theme: LiveCourse.theme,
    banner: banner,
    mbanner: mbanner,
    price: LiveCourse.courseFee,
    discount: null,
    companyPrice: [],
    duration: LiveCourse.duration,
    teacher: LiveCourse.teacherID,
    level: LiveCourse.level,
    introduction: introduction.replace(/\n/g, ''),
    content: courseContents.replace(/\n/g, ''),
    qa: qa,
    idClass: LiveCourse.idclassID,
    onlineAt: LiveCourse.uploadTime,
    description: '',
    keywords: [],
    chapters: [],
    quiz: LiveCourse.quizes,
    quizNum: LiveCourse.quizNum,
    creditPionts: LiveCourse.point,
    passScore: LiveCourse.passScore,
    externalink: '',
    quota: 0,
    classInfo: {
      target: '',
      eventType: '',
      symbolLocation: '',
      location: '',
      host: '',
      startdate: '',
      enddate: ''
    },
    liveInfo: {
      url: '',
      startAt: LiveCourse.liveStartDay,
      duration: LiveCourse.liveDuration,
      RTMPUrl: '',
      streamKey: ''
    },
    applyStartAt: '',
    applyEndAt: '',
    packages: [],
    organization: '',
    usedDiscount: false,
    reviewRecord: [],
    marquees: [],
    liveStayPicUrl: ''
  }
  row++
  return createPlanBody
}))

// 建立代審核直播課程
for (const createLiveCourseData of createLiveCourseDates) {
  if (createLiveCourseData) {
    const createdPlans = await createPlan(companyCode, createLiveCourseData)
    createPlanLiveResults.push(createdPlans)
  }
}

await Promise.all(createPlanLiveResults.map(async (createPlanLiveResult, index) => {
  const LiveCourse = LiveCourses[index]
  if (createPlanLiveResult.success) {
    const reviewBody: IreviewBody = {
      command: '',
      companyPrice: [],
      courseId: createPlanLiveResult.courseId,
      effectSignupTime: LiveCourse.effectSignupTime * minuteChangeSeconds,
      liveInfo: {
        RTMPUrl: '',
        courseEndAt: LiveCourse.liveEnd,
        duration: LiveCourse.liveDuration * hourChangeSeconds,
        isVOD: true,
        startAt: LiveCourse.liveStartDay,
        streamKey: '',
        url: LiveCourse.liveURL
      },
      recommendCourse: LiveCourse.recommendations,
      usedDiscount: true,
      liveScript: LiveCourse.adScript,
      purchasedAt: LiveCourse.purchasedAt,
      type: 'ONLINE',
      coursePlanId: createPlanLiveResult.coursePlanId,
      reviewId: createPlanLiveResult.courseReviewId,
      pass: true,
      discount: LiveCourse.specialPrice,
      price: LiveCourse.courseFee,
    }
    if (LiveCourse.creditSerial) {
      reviewBody.creditSerial = LiveCourse.creditSerial
    }
    if (LiveCourse.creditSerialStartAt && LiveCourse.creditSerialEndAt) {
      reviewBody.creditSerialStartAt = LiveCourse.creditSerialStartAt
      reviewBody.creditSerialEndAt = LiveCourse.creditSerialEndAt
    }
    // console.log('reviewBody', reviewBody)
    const liveBuilt = await reviewCourse(token, reviewBody, row)

    if (liveBuilt.isSuccess) {
      successImport.push({ row: LiveCourse.row, serial: liveBuilt.serial, sheet: liveSheet })
    }
    else {
      failed.push(
        { row: LiveCourse.row, column: negativeOne, reason: '建立課程時出現錯誤', sheet: liveSheet }
      )
    }
    // console.log('liveBuilt', liveBuilt)
  }
  else {
    failed.push(
      { row: LiveCourse.row, column: negativeOne, reason: '建立代審核課程時出現錯誤', sheet: liveSheet }
    )
  }

}))
