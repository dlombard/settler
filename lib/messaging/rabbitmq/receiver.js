const logger = require('../../../logger')()
const _toUpper = require('lodash').toUpper
const Promise = require('bluebird')
const events = require('../../events')

class Receiver {
  constructor(channel, queue) {
    this.channel = channel
    this.queue = queue
  }

  start() {
    this.channel.prefetch(3)
    this.channel.consume(this.queue, (msg) => {
      events.emit('new_message', msg)
    })
    events.on('job_done', (msg) => {
      console.log('job_done')
      if (msg.content)
        this.channel.ack(msg)
    })
    return
  }
}


module.exports = Receiver

/*
{
"userId": "5a2c1358c50b0c81e81248f4",
"messageId":"dinj0ijds09",
"action": "CREATE",
"data":{
  "provider":{
"type": "digitalocean",
"config":{
    "do_region": "nyc3",
    "name": "nodejs-server",
    "do_image": "ubuntu-16-04-x64",
    "do_size": "1GB",
    "distribution":"ubuntu",
    "distribution_version":"16.04"
}
},
"app":{
"appId":"5a2c5b62c50b0c81e81248f6"
}
}
}

// ALicloud
{
"userId": "5a2c1358c50b0c81e81248f4",
"messageId":"dinj0ijds09",
"provider":{
"type": "alicloud_ecs",
"config":{
    "ali_region": "cn-hongkong",
    "ali_image_id": "ubuntu_16_0402_64_20G_alibase_20170818.vhd",
    "ali_security_groups": ["iudss"],
    "ali_instance_type": "ecs.t5-lc1m1.small",
    "name": "node_test",
    "distribution":"ubuntu",
    "distribution_version":"16.04"
}
},
"app":{
"appId":"5a2c5b62c50b0c81e81248f6"
}
}


{
"userId": "5a2c1358c50b0c81e81248f4",
"messageId":"134j0ijds20",
"provider":{
"type": "aws_lightsail",
"config":{
    "aws_region": "us-east-1",
    "aws_blueprint_id": "ubuntu_16_04_1",
    "aws_availibility_zone": "us-east-1b",
    "aws_bundle_id": "nano_1_0",
    "aws_key_pair_name": "id_rsa",
    "name": "node_test",
    "distribution":"ubuntu",
    "distribution_version":"16.04"
}
},
"app":{
"appId":"5a2c5b62c50b0c81e81248f6"
}
}
*/