const AWS = require('aws-sdk')
const Promise = require('bluebird')
const User = require('../../../db/models/User')
let logger
const fs = require('fs');
const trim = require('lodash').trim
const SSHKey = require('../../../security/sshkey')
const getUserData = require('../../../utils/userData')
const App = require('../../../db/models/App')
const Terraform = require('../../../db/models/Terraform')
const path = require("path")
const createAnsibleCommand = require('../../../utils/createAnsibleCommand')
const EventEmitter = require('../../../events')
const runTerraform = require('../../../utils/runTerraform')

class AWSProvider {
  constructor(vmrequest) {
    this.vmrequest = vmrequest
    this.type = 'aws_lightsail'
    this.messageId = this.vmrequest.messageId
    this.jobDirectory = path.join(global.jobDir, this.messageId)
    logger = require('../../../../logger')(this.messageId)
  }

  run() {
    const promise = new Promise((resolve, reject) => {
      fs.mkdir(path.join(__dirname, '../../../../jobs', this.messageId), (err) => {
        if (err) {
          logger.error(err)
        }
        Terraform.find({ 'provider': this.vmrequest.data.provider.type }).then((doc) => {
          if (!doc || doc.length == 0) {
            reject(`Provider does not exists in our db`)
          } else {
            this.tfVariables = doc[0].variable
            this.tfMain = doc[0].main
            this.tfOutput = doc[0].output
            return User.findById(this.vmrequest.userId)
          }
        }).then((user) => {
          if (!user) {
            reject('User Not Found')
          }
          else {
            if (user.providers.hasOwnProperty(this.vmrequest.data.provider.type)) {
              this.accessKey = user.providers.aws_lightsail.access_key
              this.secretAccessKey = user.providers.aws_lightsail.secret_access_key
              this.generateSSHKeys()
              return
            }
            reject('no api token for this user')
          }
        }).then(() => {
          return getUserData(this.vmrequest.data.provider.distribution, this.sshkey.getPublicKey(), this.jobDirectory)
        }).then((userDataPath) => {
          this.userDataPath = userDataPath
          return
        }).then(() => {
          const app = this.vmrequest.data.app
          logger.debug(app)
          return App.findById(app.appId)
        }).then((doc) => {
          if (doc) {
            this.createVariablesJSON()
            this.createOutputJSON()
            return this.createMainJSON(doc)
          }
          reject('App not found')
        }).then(() => {
          EventEmitter.emit('runningTerraform', this)
          return runTerraform({ dir: this.jobDirectory, messageId: this.messageId })
        }).then(() => {
          EventEmitter.emit('terraformCompleted', this)
          resolve(this)
        })
      })
    })

    return promise
  }



  generateSSHKeys() {
    this.sshkey = new SSHKey(this.jobDirectory)
  }

  createVariablesJSON() {
    this.tfVariables.aws_access_key.default = this.accessKey
    this.tfVariables.aws_secret_key.default = this.secretAccessKey
    this.tfVariables.aws_region.default = this.vmrequest.data.provider.config.aws_region
    this.tfVariables.aws_blueprint_id.default = this.vmrequest.data.provider.config.aws_blueprint_id
    this.tfVariables.aws_availibility_zone.default = this.vmrequest.data.provider.config.aws_availibility_zone
    this.tfVariables.aws_bundle_id.default = this.vmrequest.data.provider.config.aws_bundle_id
    this.tfVariables.aws_key_pair_name.default = this.vmrequest.data.provider.config.aws_key_pair_name
    this.tfVariables.name.default = this.vmrequest.data.provider.config.name
    this.tfVariables.user_data.default = path.join(this.jobDirectory, 'userdata.sh')
    fs.writeFile(path.join(this.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.tfVariables }), (err) => {
      if (err)
        logger.error(`File error: ${err}`)
    })
  }

  createMainJSON(app) {
    const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${app.app}/${app.playbook}`
    const ap = {
      priv_key: this.sshkey.getFilename(),
      playbook: playbook_location,
      distribution: this.vmrequest.data.provider.config.distribution,
      ip: '${aws_lightsail_instance.app.public_ip_address}'
    }

    this.tfMain.resource.aws_lightsail_instance.app.provisioner['local-exec'].command = createAnsibleCommand(ap)

    fs.writeFile(path.join(this.jobDirectory, "main.tf.json"), JSON.stringify(this.tfMain), (err) => {
      if (err)
        logger.error(`Main error: ${err}`)
    })
  }

  createOutputJSON() {
    const output = {
      output: this.tfOutput
    }
    fs.writeFile(path.join(this.jobDirectory, "output.tf.json"), JSON.stringify(output), (err) => {
      if (err)
        logger.error(`Output error: ${err}`)
    })
  }

  /*
  * 1. Delete private key file
  *
  */
  cleanupTask() {
    logger.info(`[${this.messageId}] - Cleaning up!`)
    this.sshkey.deletePrivateKeyFile()
    logger.info(`[${this.messageId}] - Cleanup completed!`)
  }
}

module.exports = AWSProvider