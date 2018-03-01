const Settlement = require('../../../../../db/models/Settlement')

const updateSettlement = (req, res, next) => {
  const userId = req.params.id
  const messageId = req.params.messageId

  Settlement.replaceOne({userId, messageId}, req.body).then((doc) => {
    if (doc) {
      res.send(doc)
    } else {
      res.status(400).send({})
    }
  }).catch((err) => {
    res.status(400).send({})
  })

}

module.exports = {
  patch: [
    updateSettlement
  ]

}