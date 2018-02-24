const AWS = require('aws-sdk')
const logger = require('../../logger').logger()
class aws {
  constructor() {

  }

  connect() {
    this.accessKey = process.env.AWS_ACCESS_KEY
    this.secretAccessKey = process.env.AWS_SECRET_KEY
    this.setCredentials()
    this.s3 = new AWS.S3({apiVersion: '2006-03-01'});
  }
  setCredentials() {
    const credentials = new AWS.Credentials(this.accessKey, this.secretAccessKey)
    AWS.config.update({ credentials, logger })
  }
}

const _aws = new aws()
_aws.connect()

module.exports = _aws.s3