let logger
const _toUpper = require('lodash').toUpper
const DigitalOcean = require('./digitalOcean/digitalocean')
const AWS_Lightsail = require('./aws/lightsail/lightsail')
const EventEmitter = require('../events')
const exec = require('child_process').exec;
const Job = require('../db/models/Job')
const mongo = require('mongoose').mongo
const Settlement = require('../db/models/Settlement')
const User = require('../db/models/User')
const spawn = require('child_process').spawn
const concat = require('lodash').concat
const validate = require('./validators')
const fs = require('fs')
const co = require('co');
const path = require("path")
const App = require('../db/models/App')
const Terraform = require('../db/models/Terraform')
const SSHKey = require('../security/sshkey')
const getUserData = require('../utils/userData')
const createAnsibleCommand = require('../utils/createAnsibleCommand')
const runTerraform = require('../utils/runTerraform')

class Executor {
  constructor() {
  }
  execute(request) {
    this.jobDirectory = path.join(global.jobDir, request.messageId)
    logger = require('../../logger').logger(request.messageId)
    const action = request.action
    if (_toUpper(action) == 'DELETE') {
      return this.deleteSettlement(request)
    }
    else if (_toUpper(action) == 'CREATE') {
      const newSettlement = this.newSettlement.bind(this)
      co(function* () {
        yield newSettlement(request)
      })
    }
    return this.createSettlement(request)
  }

  deleteSettlement(request) {
    logger.warn('delete')

  }
  * newSettlement(request) {
    const createAnsible = this.createAnsible.bind(this)
    //const setListeners = this.setListeners.bind(this)
    let provider = null
    let providerObj = request
    let dir = this.jobDirectory
    providerObj.jobDirectory = dir
    providerObj.createAnsibleCommand = createAnsibleCommand
    const file = fs.mkdirSync(path.join(__dirname, '../../jobs', request.messageId))
    if (!file) {
      const terra = yield Terraform.find({ 'provider': request.data.provider.type })

      if (terra) {
        providerObj = {
          ...providerObj,
          tfVariables: terra[0].variable,
          tfMain: terra[0].main,
          tfOutput: terra[0].output
        }

        const user = yield User.findById(request.userId)
        if (user && user.providers.hasOwnProperty(request.data.provider.type)) {
          let sshKey = new SSHKey(dir)
          providerObj = {
            ...providerObj,
            security: user.providers[request.data.provider.type].security,
            sshKey,
            userDataPath: yield getUserData(request.data.provider.distribution, sshKey.getPublicKey(), dir),
            app: yield App.findById(request.data.app.appId)
          }
          providerObj.ansible = createAnsible(providerObj)
          switch (_toUpper(request.data.provider.type)) {
            case 'DIGITALOCEAN':
              provider = new DigitalOcean(providerObj)
              break
            case 'AWS_LIGHTSAIL':
              provider = new AWS_Lightsail(providerObj)
              break
          }
          if (provider) {
            console.log('provider')
            this.setListeners(provider)
            try {
              const res = yield provider.run()
              EventEmitter.emit('runningTerraform', providerObj)
              logger.info('Run Terraform')
              runTerraform({ dir: dir, messageId: request.messageId })

              logger.info(' Terraform Completed')
              EventEmitter.emit('terraformCompleted', this)
            } catch (e) {
              logger.error(e)
            }
          }
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
      Job.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'inprogress' } }).then((doc) => {
        return Settlement.findOneAndUpdate({ 'userId': mongo.ObjectId(obj.userId), 'messageId': obj.messageId }, { '$set': { 'status': 'inprogress' } })
      })
    })

    EventEmitter.on('terraformFailed', (obj) => {
      Job.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'failed', 'errorMessage': obj.errorMessage } }).then((doc) => {
        return Settlement.findOneAndUpdate({ 'messageId': obj.messageId }, { '$set': { 'status': 'failed' } })
      }).then(() => {
        //provider.cleanupTask()
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
  cleanupTask() {
    logger.info(`[${this.messageId}] - Cleaning up!`)
    this.sshkey.deletePrivateKeyFile()
    logger.info(`[${this.messageId}] - Cleanup completed!`)
  }
  createAnsible(obj) {
    const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${obj.app.app}/${obj.app.playbook}`
    const ap = {
      priv_key: obj.sshKey.getFilename(),
      playbook: playbook_location,
      distribution: obj.data.provider.config.distribution,
      ip: '${digitalocean_droplet.app.ipv4_address}'
    }

    return createAnsibleCommand(ap)
  }
}


module.exports = Executor
