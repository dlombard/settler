const fs = require('fs');
const logger = require('../../../logger')
const trim = require('lodash').trim
const Promise = require('bluebird')
const User = require('../../db/models/User')
const SSHKey = require('../../security/sshkey')
const getUserData = require('../../utils/userData')
const App = require('../../db/models/App')
const Terraform = require('../../db/models/Terraform')
const path = require("path")
const createAnsibleCommand = require('../../utils/createAnsibleCommand')
const EventEmitter = require('../../events')
const runTerraform = require('../../utils/runTerraform')

class AlicloudECS {
  constructor(vmrequest, messageId) {
    this.vmrequest = vmrequest
    this.type = 'alicloud_ecs'
    this.messageId = this.vmrequest.messageId
    this.jobDirectory = path.join(global.jobDir, this.messageId)
  }

  run() {
    const promise = new Promise((resolve, reject) => {
      //Create job directory
      fs.mkdir(path.join(__dirname, '../../../jobs', this.messageId), (err) => {
        if (err) {
          logger.error(err)
        }
        // Retrieve variables and main doc from db
        Terraform.find({ 'provider': this.vmrequest.data.provider.type }).then((doc) => {
          if (!doc || doc.length == 0) {
            reject(`Provider does not exists in our db`)
          } else {

            this.tfVariables = doc[0].variable
            this.tfMain = doc[0].main
            this.tfOutput = doc[0].output
            // Retrieve user from DB (Api key, SSH keys, etc)
            return User.findById(this.vmrequest.userId)
          }
        }).then((user) => {
          if (!user)
            reject('User Not Found')
          else {
            // Validate user has DO keys
            if (user.providers.hasOwnProperty(this.vmrequest.data.provider.type)) {
              this.ali_access_key = user.providers.alicloud_ecs.ali_access_key
              this.ali_secret_key = user.providers.alicloud_ecs.ali_secret_key
              this.generateSSHKeys()
              //build UserData
              return getUserData(this.vmrequest.data.provider.distribution, this.sshkey.getPublicKey(), this.jobDirectory)
            }
            else {
              reject(`[${this.messageId}] User does not have alicloud_ecs keys`)
            }
          }
        }).then((userDataPath) => {
          this.userDataPath = userDataPath
          return
        }).then(() => {
          const app = this.vmrequest.app
          logger.debug(app)
          return App.findById(app.appId).then((doc) => {
            if (doc) {
              return doc
            }
          })
        }).then((doc) => {
          //create variables and main.tf.json files
          if (doc) {
            this.createVariablesJSON()
            this.createOutputJSON()
            return this.createMainJSON(doc)
          }
          reject('App not found')
        }).then(() => {
          //Run Terraform
          EventEmitter.emit('runningTerraform', this)
          return runTerraform({ dir: this.jobDirectory, messageId: this.messageId })

        }).then(() => {
          //logger.info(`[${this.messageId}] - Deploying app!`)
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
    this.tfVariables.ali_access_key.default = this.ali_access_key
    this.tfVariables.ali_secret_key.default = this.ali_secret_key
    this.tfVariables.ali_security_groups.default = this.vmrequest.data.provider.config.ali_security_groups
    this.tfVariables.ali_region.default = this.vmrequest.data.provider.config.ali_region
    this.tfVariables.ali_image_id.default = this.vmrequest.data.provider.config.ali_image_id
    this.tfVariables.ali_instance_type.default = this.vmrequest.data.provider.config.ali_instance_type
    this.tfVariables.name.default = this.vmrequest.data.provider.config.name

    this.tfVariables.user_data.default = path.join(this.jobDirectory, 'userdata.sh')
    fs.writeFile(path.join(this.jobDirectory, "variables.tf.json"), JSON.stringify({ "variable": this.tfVariables }), (err) => {
      if (err)
        logger.error(`File error: ${err}`)
    })
  }

  createMainJSON(app) {
    const playbook_location = `${process.env.PLAYBOOK_LOCATION}/${app.playbook}`
    const ap = {
      priv_key: this.sshkey.getFilename(),
      playbook: playbook_location,
      distribution: this.vmrequest.data.provider.config.distribution,
      ip: '${alicloud_eip.eip.ip_address}'
    }

    this.tfMain.resource.alicloud_eip_association.eip_asso.provisioner['local-exec'].command = createAnsibleCommand(ap)

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

  cleanupTask() {
    logger.info(`[${this.messageId}] - Cleaning up!`)
    this.sshkey.deletePrivateKeyFile()
    logger.info(`[${this.messageId}] - Cleanup completed!`)
  }
}
module.exports = AlicloudECS