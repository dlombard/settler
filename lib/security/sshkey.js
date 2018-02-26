const generateFilename = require('../utils/generateFilename')
const fs = require('fs')
const forge = require('node-forge')
const path = require('path')
class SSHKey {
  constructor(directory) {
    console.log(directory)
    this.directory = directory
    var keys = forge.pki.rsa.generateKeyPair(1024);
    this.publicKey = forge.ssh.publicKeyToOpenSSH(keys.publicKey)
    this.privateKey = forge.ssh.privateKeyToOpenSSH(keys.privateKey)
    this.filename = '.' + generateFilename() + "_rsa"

    this.writePrivateKeyToFile()
  }
  getPublicKey() {
    return this.publicKey
  }

  getPrivateKey() {
    return this.privateKey
  }

  getFilename() {
    return this.filename
  }
  writePrivateKeyToFile() {
    console.log(this.directory + this.filename)
    fs.writeFile(path.join(this.directory, this.filename), this.privateKey, 'utf8', (err) => {
      if (err)
        console.log(err)
      else {
        fs.chmod(path.join(this.directory, this.filename), '0600', (err) => {
          if (err)
            console.log(err)
        })
      }
    })

  }
  deletePrivateKeyFile() {
    console.error(`Delete SSH file ${this.filename}`)
    fs.unlink(path.join(this.directory, this.filename), (err) => {
      if (err)
        console.log(err)
    })
  }
}

module.exports = SSHKey
