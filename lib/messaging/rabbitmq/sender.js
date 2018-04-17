const logger = require('../../../logger').logger()
const _toUpper = require('lodash').toUpper
const Promise = require('bluebird')
const events = require('../../events')
const config = require('../../../config')
const Settlement = require('../../db/models/Settlement')
const State = require('../../db/models/State')

class Sender {
  constructor() {
  }

  init(channel) {
    this.channel = channel
    this.queue = config.rabbitMQ.sendingQueue
    this.exchange = config.rabbitMQ.exchange
    this.exchange_type = config.rabbitMQ.exchange_type
    this.routing_key = config.rabbitMQ.routing_key
  }
  start() {
    this.channel.assertExchange(this.exchange, 'topic');
    this.channel.assertQueue(this.queue)
    this.channel.bindQueue(this.queue, this.exchange, this.queue);
    this.channel.consume(this.queue, msg => this.receiveMessage(msg))
    return
  }

  sendMessage(message) {
    this.channel.publish(this.exchange, this.queue, Buffer.from(JSON.stringify(message)), { 'persisted': true })

    console.log('publish')
  }

  receiveMessage(msg) {
    this.channel.ack(msg)
    const parsedMSG = JSON.parse(msg.content.toString())
    const action = parsedMSG.action
    const settlementId = parsedMSG.settlementId

    switch (action) {
      case 'UPDATE_STATUS':
        Settlement.findByIdAndUpdate(settlementId, { '$set': { 'status': parsedMSG.status } }).then((doc) => {

        }).catch(err => {
          console.error(err)
        })
        break

      case 'UPDATE_SERVER_INFO':
        Settlement.findByIdAndUpdate(settlementId, { '$set': { 'serverInfo': parsedMSG.serverInfo } }).then((doc) => {

        }).catch(err => {
          console.error(err)
        })
        break

      case 'TERRAFORM_INFO':
        const variable = parsedMSG.variable
        const main = parsedMSG.main
        const output = parsedMSG.output
        const messageID = parsedMSG.messageID

        State.findOneAndUpdate({ messageID: messageID }, { '$set': { variable, main, output, settlementId } }).catch((err) => {
          console.error(err)
        })
        break
    }

  }
}

const sender = new Sender()
module.exports = sender