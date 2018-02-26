const spawn = require('child_process').spawn;
let logger
const Promise = require('bluebird')
const EventEmitter = require('../events')
const fs = require('fs')
const path = require('path')
const run = (obj) => {
  logger = require('../../logger').logger(obj.messageId)
  backendTerraform(obj)
  return initTerraform(obj).then(() => {
    return planTerraform(obj)
  }).then(() => {
    return applyTerraform(obj)
  })
}


//Support for Mongo backend
const backendTerraform = (obj) => {
  const port = process.env.PORT || 8080
  const config = {
    terraform: {
      backend: {
        http: {
          address: `http://127.0.0.1:${port}/${obj.messageId}`,
          skip_cert_verification: 'true'
          //lock_address: `http://localhost:${port}`,
          //unlock_address: `http://localhost:${port}`,
        }
      }
    }
  }

  fs.writeFile(path.join(obj.dir, "init.tf.json"), JSON.stringify(config, null, 4), (err) => {
    if (err)
      logger.error(`File error: ${err}`)
  })
}

const initTerraform = (obj) => {

  EventEmitter.emit('terraform-init')
  const promise = new Promise((resolve, reject) => {
    const dir = obj.dir
    logger.info(`terraform-init starting`);
    const terraform = spawn('terraform', ['init', '-input=false'], { cwd: dir });

    terraform.stdout.on('data', data => {
      logger.info(`stdout: ${data}`);
    });

    terraform.stderr.on('data', data => {
      logger.error(`${data}`);
    });

    terraform.on('close', code => {
      logger.info(`terraform-init process exited with code ${code}`);
      if (code == 0) {
        resolve(code)
      }
      else {
        EventEmitter.emit('terraformFailed', obj)
        reject(`Terraform init failed with error code ${code}`)
      }
    });

  })
  return promise
}

const applyTerraform = (obj) => {
  EventEmitter.emit('terraform-apply')
  const promise = new Promise((resolve, reject) => {
    const dir = obj.dir
    logger.info(`terraform-apply process starting`);
    const terraform = spawn('terraform', ['apply', '-input=false', '-auto-approve'], { cwd: dir });
    terraform.stdout.on('data', data => {
      logger.info(`stdout: ${data}`);
    });

    terraform.stderr.on('data', data => {
      logger.error(`${data}`);
      obj.errorMessage = data
      destroyTerraform(obj)
    });

    terraform.on('close', code => {
      logger.info(`terraform-apply process exited with code ${code}`);
      if (code == 0) {
        resolve(code)
      }
      else {
        EventEmitter.emit('terraformFailed', obj)
        destroyTerraform(obj)
        reject(`Terraform init failed with error code ${code}`)
      }
    });
  })
  return promise
}

const destroyTerraform = (obj) => {
  EventEmitter.emit('terraform-destroy')
  const promise = new Promise((resolve, reject) => {
    const dir = obj.dir
    logger.info(`terraform-destroy process starting`);
    const terraform = spawn('terraform', ['destroy', '-force'], { cwd: dir });
    terraform.stdout.on('data', data => {
      logger.info(`stdout: ${data}`);
    });

    terraform.stderr.on('data', data => {
      logger.error(`${data}`);
    });

    terraform.on('close', code => {
      logger.info(`terraform-destroy process exited with code ${code}`);
      if (code == 0) {
        resolve(code)
      }
      else {
        EventEmitter.emit('terraformFailed', obj)
        reject(`Terraform init failed with error code ${code}`)
      }
    });
  })
  return promise
}

const planTerraform = (obj) => {
  EventEmitter.emit('terraform-plan')
  const promise = new Promise((resolve, reject) => {
    const dir = obj.dir
    logger.info(`terraform-plan process starting`);
    const terraform = spawn('terraform', ['plan'], { cwd: dir });
    terraform.stdout.on('data', data => {
      //logger.info(`stdout: ${data}`);
    });

    terraform.stderr.on('data', data => {
      logger.error(`${data}`);
    });

    terraform.on('close', code => {
      logger.info(`terraform-plan process exited with code ${code}`);
      if (code == 0) {
        resolve(code)
      }
      else {
        EventEmitter.emit('terraformFailed', obj)
        reject(`Terraform init failed with error code ${code}`)
      }
    });
  })
  return promise
}

const outputTerraform = (obj) => {
  const promise = new Promise((resolve, reject) => {
    const dir = obj.dir
    logger.info(`terraform-output process starting`);
    const terraform = spawn('terraform', ['output', '-json'], { cwd: dir });
    terraform.stdout.on('data', data => {
      //logger.info(`stdout: ${data}`);
    });

    terraform.stderr.on('data', data => {
      logger.error(`${data}`);
    });

    terraform.on('close', code => {
      logger.info(`child process exited with code ${code}`);
      if (code == 0) {
        resolve(code)
      }
      else {
        reject(`Terraform init failed with error code ${code}`)
      }
    });
  })
  return promise
}
module.exports = run