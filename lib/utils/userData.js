const CloudInit = require('../db/models/CloudInit')
const _upperCase = require('lodash').upperCase
const Promise = require('bluebird')
const S3 = require('./aws')
const path = require('path')
const fs = require('fs')

module.exports = (distribution, publicKeys, directory) => {
  let filename;
  switch (_upperCase(distribution)) {
    case 'UBUNTU':
      filename = 'cloud-init-ubuntu.sh'
      break
    case 'CENTOS':
      filename = 'cloud-init-centos.sh'
      break
    default:
      filename = 'cloud-init-ubuntu.sh'
      break

  }
  const promise = new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(directory, 'userdata.sh'));
    const readStream = fs.createReadStream(path.join(global.appRootDir, 'scripts', filename))

    readStream.on('data', function (chunk) { file.write(chunk); })
      .on('end', function () {
        file.write(publicKeys + "\n")
        file.write('EOF')
        file.end();
        resolve(file.path)
      })
  })
  return promise
}