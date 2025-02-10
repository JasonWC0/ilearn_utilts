# -*- coding: utf-8 -*-
"""
Created on Fri Dec  2 10:23:45 2022
發送即享券/折價券
@author: Jacky
"""

from urllib.parse import quote_plus
from pymongo import MongoClient
import pandas as pd
import datetime
from bson.objectid import ObjectId
from dateutil.relativedelta import relativedelta


accounts = [
'0960005119'
]

price = '1000'
count = 1
activityCode = 'DC301'


## db 連線-ILEARN ##
def dbConnection(isTest=False):
    user = "icare"
    password = "iLearning0Care"
    host = "34.80.83.237:32018"
    authMechanism = "SCRAM-SHA-1"
    authSource = "icare_elearning"
    dbName = "icare_elearning"

    if (isTest):
        password = "UATg0Icare"
        host = "104.199.235.97:32018"
        authSource = "icare_elearning_v15"
        dbName = "icare_elearning_v15"

    uri = "mongodb://%s:%s@%s/?authSource=%s&authMechanism=%s" % (quote_plus(user), quote_plus(password), host, authSource, authMechanism)
    client = MongoClient(uri)
    db = client[dbName]

    return db


## 發送即享券 ##
def giveTicket(db, userId, price, count, activityCode='DC101'):
    itemCode = 'T{}'.format(price.zfill(4))
    p = db.prizes.find_one({ 'itemCode': itemCode })
    if (not p):
        print('prize不存在...', itemCode)
        return
    PN = p['pn']

    q = {
        'activityCode': activityCode,
        'status': 1,
        'itemCode': itemCode,
        'dueDate': {
            '$gte': datetime.datetime.now() + relativedelta(hours=-8),
        }
    }
    df_expressticket = pd.DataFrame(list(db.expresstickets.find(q, limit=count)))
    if len(df_expressticket) != count:
        print('Express Ticket不足...')
        return
    
    for idx, expressticket in df_expressticket.iterrows():
        insertObj = {
            'status': 3,
            'drawAt': datetime.datetime.now() + relativedelta(hours=-8),
            'completeAt': datetime.datetime.now() + relativedelta(hours=-8),
            'receiveAt': None,
            'prizePN' : PN,
            'quitAt' : None,
            'activityCode' : activityCode,
            'userId' : userId,
            'joinAt' : datetime.datetime.now() + relativedelta(hours=-8),
            'prizeItems' : [
                {
                    'codes': [expressticket['voucherGUID']],
                    "_id" : ObjectId(),
                    "type" : 1, # 即享券
                }
            ],
            'createdAt' : datetime.datetime.now() + relativedelta(hours=-8),
            'updatedAt' : datetime.datetime.now() + relativedelta(hours=-8),
            'activityStage' : 1,
        }
        drawrecord = db.drawrecords.insert_one(insertObj)

        updateObj = {
            '$set': {
                'drawRecordId': drawrecord.inserted_id,
                'status': 2,
            }
        }
        db.expresstickets.update_many({ '_id': { '$in': [expressticket['_id']] } }, updateObj)


## 發送折價券 ##
def giveCoupon(db, batchId, userId, discount, count):
    q = {
        'batch': batchId,
        'usedby': {'$eq': None },
        'used': False,
        'discount': int(discount),
    }
    df_coupon = pd.DataFrame(list(db.coupons.find(q, limit=count)))
    if len(df_coupon) != count:
        print('Coupon券不足...')
        return

    updateObj = {
        '$set': {
            'usedby': userId,
        }
    }
    db.coupons.update_many({ '_id': { '$in': list(df_coupon['_id']) } }, updateObj)
    

db = dbConnection()
users = list(db.courseusers.find({ 'account': { '$in': accounts } }))

df_user = pd.DataFrame(users)

no_user_list = list(set(accounts) - set(list(df_user['account'])))
df_no_user = pd.DataFrame(no_user_list)

if len(df_no_user) != 0:
    df_no_user.to_excel('未註冊帳號-230221-匯入即享券.xlsx')

for user in users:
    giveTicket(db, user['_id'], price, count, activityCode)


