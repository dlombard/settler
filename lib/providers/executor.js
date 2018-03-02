let logger
const _toUpper = require('lodash').toUpper
const DigitalOcean = require('./digitalOcean/digitalocean')
const AWS_Lightsail = require('./aws/lightsail/lightsail')
const EventEmitter = require('../events')
const exec = require('child_process').exec;
const mongo = require('mongoose').mongo
const spawn = require('child_process').spawn
const concat = require('lodash').concat
const validate = require('./validators')
const fs = require('fs')
const co = require('co');
const path = require("path")
const SSHKey = require('../security/sshkey')
const getUserData = require('../utils/userData')
const createAnsibleCommand = require('../utils/createAnsibleCommand')
const runTerraform = require('../utils/runTerraform')
const sender = require('../messaging/rabbitmq/sender')

class Executor {
  constructor() {
  }
  execute(request) {
    this.request = request
    this.jobDirectory = path.join(global.jobDir, request.messageId)
    logger = require('../../logger').logger(request.messageId)
    const action = request.action
    if (_toUpper(action) == 'DELETE') {
      return this.deleteSettlement(request)
    }
    else if (_toUpper(action) == 'CREATE') {
      console.log('create')
      this.newSettlement(request)
    }
    //return this.createSettlement(request)
  }

  deleteSettlement(request) {
    logger.warn('delete')

  }
  newSettlement(request) {
    console.log('settlement')
    this.provider = null
    let providerObj = {}
    let dir = this.jobDirectory
    providerObj.jobDirectory = dir
    providerObj.createAnsibleCommand = createAnsibleCommand
    const file = fs.mkdirSync(path.join(__dirname, '../../jobs', request.messageId))
    if (!file) {
      const user = request.user
      for (var x = 0; x < request.settlements.length; x++) {
        const s = request.settlements[x]
        if (user && user.providers.hasOwnProperty(s.provider.type)) {
          let sshKey = new SSHKey(dir)
          return getUserData(s.provider.distribution, sshKey.getPublicKey(), dir).then(doc => {
            providerObj = {
              ...providerObj,
              user: request.user,
              provider: s.provider,
              security: user.providers[s.provider.type].security,
              sshKey,
              userDataPath: doc,
              apps: s.apps,
              terraform: s.terraform
            }
            switch (_toUpper(s.provider.type)) {
              case 'DIGITALOCEAN':
                this.provider = new DigitalOcean(providerObj)
                break
              case 'AWS_LIGHTSAIL':
                this.provider = new AWS_Lightsail(providerObj)
                break
            }
            return
          }).then(() => {
            if (this.provider) {
              this.setListeners(this.provider)
              return this.provider.run()
            }
          }).then(() => {
            sender.sendMessage({ 'action': 'UPDATE_STATUS', 'settlementId': request.settlementId, status: 'INPROGRESS' })
            EventEmitter.emit('runningTerraform', providerObj)
            logger.info('Run Terraform')
            return runTerraform({ dir: dir, messageId: request.messageId })
          }).then(() => {
            logger.info(' Terraform Completed')
            EventEmitter.emit('terraformCompleted', this)
          }).catch((err) => {
            logger.error(err)
          })

        }
      }
    }
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
      //sendMessage with status in progress
    })

    EventEmitter.on('terraformFailed', (obj) => {
      //Send message with status failed and cleanuptask
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
    console.log('complete job')
    let output = ''
    const terraform = spawn('terraform', ['output', '-json'], { cwd: obj.jobDirectory });
    terraform.stdout.on('data', data => {
      output += data.toString()
    });

    terraform.stderr.on('data', data => {
      logger.warn('data error')
      logger.error(`${data}`);
    });

    terraform.on('close', code => {
      if (code == 0) {
        sender.sendMessage({ 'action': 'UPDATE_STATUS', 'settlementId': this.request.settlementId, status: 'COMPLETED' })
        sender.sendMessage({ 'action': 'UPDATE_SERVER_INFO', 'settlementId': this.request.settlementId, serverInfo: JSON.parse(output) })
        sender.sendMessage({ 'action': 'TERRAFORM_INFO', 'settlementId': this.request.settlementId, 'messageID': this.request.messageId, 'variable': this.provider.terraform.variable, main: this.provider.terraform.main, output: this.provider.terraform.output })        //send message with server info and with status==COMPLETED
      }
      else {
        //reject(`Terraform init failed with error code ${code}`)
      }
    })

  }
  cleanupTask() {
    logger.info(`[${this.messageId}] - Cleaning up!`)
    this.sshkey.deletePrivateKeyFile()
    logger.info(`[${this.messageId}] - Cleanup completed!`)
  }
}


module.exports = Executor
