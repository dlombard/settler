const events = require('../../../events')

const sendMessage = (req, res, next) => {
  events.emit('new_message', req.body)
  res.send()
}

module.exports = {
  post: [
    sendMessage
  ]
}