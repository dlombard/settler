const fs = require('fs');
let logger
const trim = require('lodash').trim
const Promise = require('bluebird')
const User = require('../../db/models/User')
const DigitalOcean = require('../../clients/DigitalOcean/DigitalOcean')
const SSHKey = require('../../security/sshkey')
const getUserData = require('../../utils/userData')
const Droplet = require('../../clients/DigitalOcean/Droplet')
const App = require('../../db/models/App')
const Terraform = require('../../db/models/Terraform')
const path = require("path")
const createAnsibleCommand = require('../../utils/createAnsibleCommand')
const EventEmitter = require('../../events')
const runTerraform = require('../../utils/runTerraform')

class DOProvider {
  constructor(vmrequest, messageId) {
    if (messageId != null || messageId != undefined) {
      this.messageId = vmrequest.messageId
      this.jobDirectory = path.join(global.jobDir, messageId)
    }
    this.type = 'digitalocean'
    this.vmrequest = vmrequest
    this.messageId = this.vmrequest.messageId
    this.jobDirectory = path.join(global.jobDir, this.messageId)
    this.userKeys = []
    this.sshkey;
    this.userDataYaml;
    this.dropletID;
    logger = require('../../../logger').logger(this.messageId)
  }

  /**
   *  Steps:
   *   1. Create working directory
   *   2. Retrieve variables and main doc from db
   *   3. Retrieve user from DB (Api key, SSH keys, etc)
   *   4. Validate user has DO keys
   *   5. Create ssh keys from the backend, for the backend
   *   6. Store ssh keys in the DB //TBD
   *   7. Build UserData
   *   8. Retrieve app from db
   *   9. Create variables.tf.json and main.tf.json files
   *   10. Run Terraform
   *   11. Once is completed, save state to db
   *
   */
  run() {


    const promise = new Promise((resolve, reject) => {
      //Create job directory
      fs.mkdir(path.join(__dirname, '../../../jobs', this.messageId), (err) => {
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
          if (!user)
            reject('User Not Found')
          else {
            if (user.providers.hasOwnProperty(this.vmrequest.data.provider.type)) {
              this.api_token = user.providers.digitalocean.api_token
              this.doClient = new DigitalOcean(this.api_token)
              return this.doClient.getAllSSHKeys()
            }
            reject('no api token for this user')
          }
        }).then((keys) => {
          keys.forEach((key) => {
            this.userKeys.push(key.id)
          })

          if (this.userKeys) {
            // Generate Backend SSH keys
            this.generateSSHKeys()
            //build UserData
            return getUserData(this.vmrequest.data.provider.distribution, this.sshkey.getPublicKey(), this.jobDirectory)
          } else {
            //generate user keys
          }
        }).then((userDataPath) => {
          this.userDataPath = userDataPath
          return
        }).then(() => {
          const app = this.vmrequest.data.app
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
          logger.info('Run Terraform')

        }).then(() => {
          logger.info(' Terraform Completed')
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
    this.tfVariables.ssh_keys.default = this.userKeys
    this.tfVariables.do_token.default = this.api_token
    this.tfVariables.do_image.default = this.vmrequest.data.provider.config.do_image
    this.tfVariables.do_region.default = this.vmrequest.data.provider.config.do_region
    this.tfVariables.do_size.default = this.vmrequest.data.provider.config.do_size
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
      ip: '${digitalocean_droplet.app.ipv4_address}'
    }

    this.tfMain.resource.digitalocean_droplet.app.provisioner['local-exec'].command = createAnsibleCommand(ap)

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


module.exports = DOProvider