let logger = require('../../logger').logger()
const EventEmitter = require('../events')
const exec = require('child_process').exec;
const validate = require('./validators')
const Executor = require('./executor')

class Providers {
  constructor() {
    this.listen()
  }

  listen() {
    EventEmitter.on('new_message', (msg) => {
      try{
        let request
        if(msg.content){
           request = JSON.parse(msg.content.toString())
        }
       else{
         request = msg
       }
        validate(request).then(() => {
          const executor = new Executor()
          return executor.execute(request)
        }).then(() => {
          logger.warn(`deployment completed`)
          //require('../../logger').delete(request.messageId)
          EventEmitter.emit('job_done', msg)
        }).catch((err) => {
          logger.error(err)
          //require('../../logger').delete(request.messageId)
          EventEmitter.emit('job_done', msg)
        })
      }
      catch(e){
        console.error(e)
        EventEmitter.emit('job_done', msg)
      }

    })
  }

}

const p = new Providers()

module.exports = p