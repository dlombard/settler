const logger = require('../../logger').logger();
const mongoose = require('mongoose')
const Promise = require('bluebird')
const config = require('../../config');

class DBClient {

  constructor() {
    mongoose.Promise = Promise
    initMongoose(mongoose)
  }

  start() {
    logger.info('Starting database')
    const uri = process.env.MONGO_URI ? process.env.MONGO_URI : 'mongodb://127.0.0.1/one-click'
    let options = config.mongo
    options.promiseLibrary = Promise

    const promise = new Promise((resolve, reject) => {
      mongoose.connect(uri, options).then(() => {
        this._db = mongoose.connection.db
        setDBListeners(this._db)
        resolve(this._db)
      }).catch((err) => {
        reject(err)
      })
    })
    return promise

  }
  close() {
    return mongoose.connection.close()
  }

  get db() {
    return this._db
  }

}

var initMongoose = (mongoose) => {
  mongoose.connection.on('connecting', () => {
    logger.info('Connecting to the database')
  })
  mongoose.connection.on('connected', () => {
    logger.info('Connected to the database')
  })
  mongoose.connection.on('open', () => {
    logger.info('onOpen')
  })
  mongoose.connection.on('disconnecting', () => {
    logger.warn('Disconnecting from the database')
  })
  mongoose.connection.on('Disconnected', () => {
    logger.warn('Disconnected from the dataabse')
    mongoose.connect(process.env.MONGO_URI, config.mongo)
  })
  mongoose.connection.on('closed', () => {
    logger.info('DB connection closed')
  })
  mongoose.connection.on('reconnected', () => {
    logger.info('Reconnected to the database')
  })
  mongoose.connection.on('error', (err) => {
    logger.error(`Connection to the database failed with ${err}`)
    mongoose.disconnect()
  })

}

const setDBListeners = (db) => {
  db.s.topology.on('timeout', () => {
    logger.warn('Connection Timeout')
  })
}
const db = new DBClient()

module.exports = db;