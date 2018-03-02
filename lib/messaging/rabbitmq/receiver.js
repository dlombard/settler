const logger = require('../../../logger').logger()
const _toUpper = require('lodash').toUpper
const Promise = require('bluebird')
const events = require('../../events')
const config = require('../../../config')

class Receiver {
  constructor(channel) {
    this.channel = channel
    this.queue = config.rabbitMQ.queue
    this.exchange = config.rabbitMQ.exchange
    this.exchange_type = config.rabbitMQ.exchange_type
    this.routing_key = config.rabbitMQ.routing_key
  }

  start() {
    this.channel.assertExchange(this.exchange, 'topic');

    this.channel.assertQueue(this.queue)
    this.channel.prefetch(3)
    this.channel.consume(this.queue, (msg) => {
      events.emit('new_message', msg)
    })
    events.on('job_done', (msg) => {
      console.log('job_done')
      if (msg.content)
        this.channel.ack(msg)
    })
    return
  }
}


module.exports = Receiver

