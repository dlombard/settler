const logger = require('../../logger').logger()
const _upperCase = require('lodash').upperCase
const run = (ap) => {
  let ansible_playbook = "ansible-playbook " + ap.playbook + " -i " + ap.ip + ", " + "-u oneclick_user " + `--private-key=${ap.priv_key} `
  // ${ap.playbook}

  if (_upperCase(ap.distribution) == 'UBUNTU')
    ansible_playbook = ansible_playbook + "-e 'ansible_python_interpreter=/usr/bin/python3'"

  return ansible_playbook

}

module.exports = run