let logger
const _toUpper = require('lodash').toUpper
const DigitalOcean = require('./digitalOcean/do')
const AWS_EC2 = require('./aws/ec2/ec2')
const AWS_Lightsail = require('./aws/lightsail/lightsail')
const Alicloud_ECS = require('./alicloud/ecs')
const EventEmitter = require('../events')
const exec = require('child_process').exec;
const Job = require('../db/models/Job')
const mongo = require('mongoose').mongo
const Settlement = require('../db/models/Settlement')
const User = require('../db/models/User')
const spawn = require('child_process').spawn
const concat = require('lodash').concat
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
        validate(request).then((r) => {
          logger = require('../../logger')(request.messageId)
          return Job.findOne({ 'messageId': request.messageId })
        }).then((doc) => {
          if (!doc || (doc && doc.status == 'failed')) {
            let job = {
              messageId: request.messageId,
              status: 'NEW',
              originalMessage: request
            }
            return Job.findOneAndUpdate({ 'messageId': request.messageId }, job, { 'upsert': true })
          }
          else if (doc) {
            throw 'Job exists or is in progress'
          }
        }).then(() => {
          const executor = new Executor()
          return executor.execute(request)
        }).then(() => {
          logger.warn(`deployment completed`)
          EventEmitter.emit('job_done', msg)
        }).catch((err) => {
          logger.error(err)
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