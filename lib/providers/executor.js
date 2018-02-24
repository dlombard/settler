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

class Executor {
  constructor() {
  }
  execute(request) {

    logger = require('../../logger').logger(request.messageId)
    const action = request.action
    if (_toUpper(action) == 'DELETE') {
      return this.deleteSettlement(request)
    }
    else if (_toUpper(action) == 'CREATE')
      return this.createSettlement(request)
  }

  deleteSettlement(request) {
    logger.warn('delete')

  }
  createSettlement(request) {
    let provider;

    const settlement = {
      messageId: request.messageId,
      status: 'NEW',
      originalMessage: request.data,
      userId: request.userId
    }

    return Settlement.findOneAndUpdate({ 'messageId': request.messageId }, settlement, { 'upsert': true, 'new': true })
      .then((r) => {
        return User.findByIdAndUpdate(request.userId, { '$push': { 'settlements': r._id } })
      }).then(() => {

        switch (_toUpper(request.data.provider.type)) {
          case 'DIGITALOCEAN':
            provider = new DigitalOcean(request, request.messageId)
            break
          case 'AWS_LIGHTSAIL':
            provider = new AWS_Lightsail(request, request.messageId)
            break
        }
        if (provider) {
          this.setListeners(provider)
          return provider.run()
        }
      })

  }

  setListeners(provider) {
    EventEmitter.on('runningTerraform', (obj) => {
      Job.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'inprogress' } }).then((doc) => {
        return Settlement.findOneAndUpdate({ 'userId': mongo.ObjectId(obj.vmrequest.userId), 'messageId': obj.messageId }, { '$set': { 'status': 'inprogress' } })
      })
    })

    EventEmitter.on('terraformFailed', (obj) => {
      Job.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'failed', 'errorMessage': obj.errorMessage } }).then((doc) => {
        return Settlement.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'failed' } })
      }).then(() => {
        provider.cleanupTask()
      })
    })
    EventEmitter.on('terraformCompleted', (obj) => {
      this.completeJob(obj)

    })
    EventEmitter.on('error', (obj) => {
    })
  }

  failjob(obj) {

  }
  completeJob(obj) {
    //update databases
    Job.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'completed' } }).then((doc) => {

      let output = []
      const terraform = spawn('terraform', ['output', '-json'], { cwd: obj.jobDirectory });
      terraform.stdout.on('data', data => {
        output = concat(output, data)
      });

      terraform.stderr.on('data', data => {
        logger.warn('data error')
        logger.error(`${data}`);
      });

      terraform.on('close', code => {
        if (code == 0) {
          return Settlement.findOneAndUpdate({ 'userId': mongo.ObjectId(obj.vmrequest.userId), 'messageId': obj.messageId }, { '$set': { 'info': JSON.parse(output.join(' ')), 'status': 'completed' } }).then((doc) => {
          }).catch((err) => {
            logger.error(err)
          })
        }
        else {
          //reject(`Terraform init failed with error code ${code}`)
        }
      })
    })
  }
}


module.exports = Executor
