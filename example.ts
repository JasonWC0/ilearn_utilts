/**
 * FeaturePath: 後台管理-分析資料-儀錶板-總覽數
 * FeaturePath: 後台管理-分析資料-儀錶板-課程銷售數
 * FeaturePath: 後台管理-分析資料-儀錶板-銷售金額
 * FeaturePath: 後台管理-分析資料-儀錶板-訂單狀態
 * FeaturePath: 後台管理-分析資料-儀錶板-活躍會員
 * FeaturePath: 後台管理-分析資料-儀錶板-十大熱門課程
 * FeaturePath: 後台管理-分析資料-儀錶板-訂單購買人數
 * Accountable: Hilbert Huang, Jason Kao 
 */
// ---------------------------------------- import  * from nodejs modules ----------------------------------------
import moment from 'moment'
import { Request, Response, NextFunction } from 'express'

// ---------------------------------------- import * from models ----------------------------------------
import logger from '../../../models/logger'
import { Order } from '../../../models/mongoose/order'
import { Course } from '../../../models/mongoose/course'
import { AdminAuth, MomentConf, QuizStatus } from '../../../models/enums'
import { ActiveUser } from '../../../models/mongoose/activeUser'
import { CreditApply } from '../../../models/mongoose/creditapply'
import * as OrderAggregation from '../../../models/aggregation/order'
import { IDateQuery, IAdminProfile } from '../../../models/interface/viewModel'

// ---------------------------------------- import * from util ----------------------------------------
import { conpanyQuery, ResHelper } from '../../../utilMgt/util/other'
import { index, rank, sales } from '../../../utilMgt/util/constant'

// ---------------------------------------- import * from config ----------------------------------------
import config from '../../../config/mainsite'

// ---------------------------------------- const ----------------------------------------
const maxSizepage: number = 100000

// ---------------------------------------- export controller ----------------------------------------
class DashboardController {
  constructor() { }

  // 後台管理-分析資料-儀錶板-總覽數
  counter = async (req: Request, res: Response, next: NextFunction) => {
    // STEP_01.01 取得管理員資料
    const admin = req.user as IAdminProfile

    // STEP_01.02 取得會員數
    const members = await conpanyQuery(
      {
        companyId: [AdminAuth.COMPALROOT, AdminAuth.COMPALEMPLOYEE].includes(admin.auth) ? 'admin' : admin.companyId,
        page: 1,
        sizePerPage: maxSizepage,
        isAdmin: [AdminAuth.COMPALROOT, AdminAuth.COMPALEMPLOYEE].includes(admin.auth)
      }
    )


    // STEP_01.03 取得課程數
    const courseCounts = await Course.countDocuments({ online: true, owner: admin.companyCode }).exec()

    // STEP_01.04 取得積分申請數
    const creditApplies = await CreditApply.aggregate([
      {
        $match: {
          status: QuizStatus.APPLYING
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $match: {
          'course.owner': admin.companyCode
        }
      },
    ]).exec()

    // STEP_02 回傳會員數、課程數和積分申請數至前端
    res.locals.result = ResHelper.successResponse({
      counter: {
        member: members.totalSize,
        course: courseCounts,
        credit: creditApplies.length
      }
    })
    next()
  }

  // 後台管理-分析資料-儀錶板-課程銷售數
  salesByDate = async (req: Request, res: Response, next: NextFunction) => {
    // STEP_01.01 取得使勇者姓名、權限和公司碼
    const { name, auth, companyCode } = req.user

    // STEP_01.02 取得 query 內容
    const query = req.query

    // STEP_01.03 取得訂單
    const ownSales = await Order
      .aggregate(OrderAggregation.COMPANY_SALES_COUNT(companyCode, query))
      .exec()

    // STEP_02.00 如為合作企業則回覆該企業的銷售數
    if (!(auth === AdminAuth.COMPALROOT || auth === AdminAuth.COMPALEMPLOYEE)) {
      res.json(ResHelper.successResponse({
        sales: [
          {
            name,
            data: ownSales,
          }
        ]
      }))
      return
    }

    const otherData = await Order
      .aggregate(OrderAggregation.COMPANY_SALES_COUNT(null, query))
      .exec()
    const allData = await Order
      .aggregate(OrderAggregation.COMPANY_SALES_COUNT(null, query, true))
      .exec()

    res.locals.result = ResHelper.successResponse({
      sales: [
        {
          name: sales.Compal,
          data: ownSales,
        },
        {
          name: sales.Other,
          data: otherData,
        },
        {
          name: sales.Sum,
          data: allData,
        }
      ]
    })

    await next()
  }

  // 後台管理-分析資料-儀錶板-銷售金額
  incomeByDate = async (req: Request, res: Response, next: NextFunction) => {
    const { name, auth, companyCode } = req.user as IAdminProfile
    const query: IDateQuery = req.query

    const ownIncomeData = await Order
      .aggregate(OrderAggregation.COMPANY_INCOME_COUNT(companyCode, query))
      .exec()
    // 如為合作企業則回覆該企業的銷售金額
    if (!(auth === AdminAuth.COMPALROOT || auth === AdminAuth.COMPALEMPLOYEE)) {
      res.json(ResHelper.successResponse({
        income: [
          {
            name,
            data: ownIncomeData,
          }
        ]
      }))
      return
    }

    const otherData = await Order
      .aggregate(OrderAggregation.COMPANY_INCOME_COUNT(null, query))
      .exec()

    const allData = await Order
      .aggregate(OrderAggregation.COMPANY_INCOME_COUNT(null, query, true))
      .exec()

    res.locals.result = ResHelper.successResponse({
      income: [
        {
          name: sales.Compal,
          data: ownIncomeData,
        },
        {
          name: sales.Other,
          data: otherData,
        },
        {
          name: sales.Sum,
          data: allData,
        }
      ]
    })

    await next()
  }

  // 後台管理-分析資料-儀錶板-訂單狀態
  orderByDate = async (req: Request, res: Response, next: NextFunction) => {
    const { auth, companyCode } = req.user as IAdminProfile
    const { start, end } = req.query
    const query = { start, end }

    const isCompal = [AdminAuth.COMPALROOT, AdminAuth.COMPALEMPLOYEE].includes(auth)
    const orders = await Order.aggregate(OrderAggregation.COMPANY_ORDER_STATUS_COUNT(companyCode, query, isCompal)).exec() as any[]

    const paid = orders.find(order => order._id.paid)
    const unpaid = orders.find(order => !(order._id.paid || order._id.paidFailed))
    const paidFail = orders.find(order => order._id.paidFailed)
    // TODO-20221208 Simon: 要出去用常數，會有語系的問題考量
    res.locals.result = ResHelper.successResponse({
      orders: [
        {
          name: '已付款',
          data: paid ? paid.data : [],
        },
        {
          name: '未付款',
          data: unpaid ? unpaid.data : [],
        },
        {
          name: '付款失敗',
          data: paidFail ? paidFail.data : [],
        }
      ]
    })

    await next()
  }

  // 後台管理-分析資料-儀錶板-活躍會員
  activeUserByDate = async (req: Request, res: Response, next: NextFunction) => {
    const { auth, companyCode, name } = req.user
    const { start, end } = req.query
    logger.info(`activeUserByDate user auth is ${auth}`)

    // TODO-20221208 Simon: 切到 ultis， moment可以換掉
    const date: any = {}
    if (start || end) {

      if (start) {
        date['$gte'] = moment(start).startOf('day').utcOffset(MomentConf.UTC_OFFSET, true).toDate()
      }

      if (end) {
        date['$lt'] = moment(end).endOf('day').utcOffset(MomentConf.UTC_OFFSET, true).toDate()
      }
    }

    const ownData = await ActiveUser
      .find({
        company: companyCode,
        date
      })
      .select({ date: 1, count: 1 })
      .exec()

    if (!(auth === AdminAuth.COMPALROOT || auth === AdminAuth.COMPALEMPLOYEE)) {
      res.json(ResHelper.successResponse({
        actives: [{
          name,
          data: ownData,
        }]
      }))
      return
    }

    const otherData = await ActiveUser
      .find({
        company: { $ne: config.adminCode },
        date
      })
      .select({ date: 1, count: 1 })
      .exec()

    const allData = await ActiveUser
      .find({
        date
      })
      .select({ date: 1, count: 1 })
      .exec()

    res.locals.result = ResHelper.successResponse({
      actives: [
        {
          name: sales.Compal,
          data: ownData,
        },
        {
          name: sales.Other,
          data: otherData,
        },
        {
          name: sales.Sum,
          data: allData,
        }
      ]
    })

    await next()
  }

  // 後台管理-分析資料-儀錶板-十大熱門課程
  bestSalesCourseByDate = async (req: Request, res: Response, next: NextFunction) => {
    const { auth, companyCode, name } = req.user
    const { start, end } = req.query
    const isCompal = [AdminAuth.COMPALROOT, AdminAuth.COMPALEMPLOYEE].includes(auth)
    const query = { start, end }

    const selfOrders = await Order.aggregate(OrderAggregation.COMPANY_BEST_SALES(companyCode, query)).exec()

    if (!isCompal) {
      res.json(ResHelper.successResponse({
        bestsales: [
          {
            name: name,
            data: selfOrders.slice(rank.first, rank.last),
          }
        ]
      }))

      return
    }

    const otherAdminOrders = await Order.aggregate(OrderAggregation.COMPANY_BEST_SALES(null, query)).exec()
    const allAdminOrders = await Order.aggregate(OrderAggregation.COMPANY_BEST_SALES(null, query, true)).exec()

    res.locals.result = ResHelper.successResponse({
      bestsales: [
        {
          name: sales.Compal,
          data: selfOrders,
        },
        {
          name: sales.Other,
          data: otherAdminOrders,
        },
        {
          name: sales.Sum,
          data: allAdminOrders.slice(rank.first, rank.last),
        }
      ]
    })

    await next()
  }

  // 後台管理-分析資料-儀錶板-訂單購買人數
  orderMemberByDate = async (req: Request, res: Response, next: NextFunction) => {
    const { auth, companyCode, name } = req.user as IAdminProfile
    const { start, end } = req.query
    const isCompal = [AdminAuth.COMPALROOT, AdminAuth.COMPALEMPLOYEE].includes(auth)
    const query = { start, end }

    const selfOrderCounts = await Order.aggregate(OrderAggregation.COMPANY_ORDER_MEMBER_COUNT(companyCode, query)).exec()

    if (!isCompal) {
      res.json(ResHelper.successResponse({
        members: [
          {
            name: name,
            data: selfOrderCounts,
          }
        ]
      }))

      return
    }

    const otherAdminOrderCounts = await Order.aggregate(OrderAggregation.COMPANY_ORDER_MEMBER_COUNT(null, query)).exec()
    const allAdminOrderCounts = await Order.aggregate(OrderAggregation.COMPANY_ORDER_MEMBER_COUNT(null, query, true)).exec()

    res.locals.result = ResHelper.successResponse({
      members: [
        {
          name: sales.Compal,
          data: selfOrderCounts,
        },
        {
          name: sales.Other,
          data: otherAdminOrderCounts,
        },
        {
          name: sales.Sum,
          data: allAdminOrderCounts,
        }
      ]
    })

    next()
  }



}


export default DashboardController
