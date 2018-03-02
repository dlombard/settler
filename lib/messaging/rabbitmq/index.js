const logger = require('../../../logger').logger()
const amqp = require('amqplib')
const Receiver = require('./receiver')
const Sender = require('./sender')

class RabbitMQClient {
  constructor() {
    logger.info('RabbitMQClient')
    this.conn = null
  }

  start() {
    if (process.env.RABBITMQ_HOST) {
      logger.info('STARTING RABBITMQ')
      const host = process.env.RABBITMQ_HOST
      return amqp.connect(host).then((conn) => {
        logger.info(`Connected to Message Broker`)
        this.conn = conn
        return conn.createChannel()
      }).then((ch) => {
        const receiver = new Receiver(ch)
        receiver.start()
        return ch
      }).then((ch) => {
        Sender.init(ch)
        return Sender.start()
      }).catch((err) => {
        logger.error(err)
        setTimeout(() => {
          this.start()
        }, 5000);
      })
    }
    return null
  }

  close() {
    return this.conn.close()
  }
}

const rmqc = new RabbitMQClient()

module.exports = rmqc