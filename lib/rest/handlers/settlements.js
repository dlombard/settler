const Settlement = require('../../db/models/Settlement')

const updateSettlement = (req, res, next) => {
  const userId = req.query.id
  const messageId = req.query.messageId

  Settlement.replaceOne({ userId, messageId }, req.body).then((doc) => {
    if (doc) {
      res.send(doc)
    } else {
      res.status(400).send({})
    }
  }).catch((err) => {
    res.status(400).send({})
  })

}
const insertSettlement = (req, res, next) => {
  const settlement = new Settlement(req.body)

  settlement.save().then((doc) => {
    res.send(doc)
  }).catch((err) => {
    res.status(400).send({})
  })
}
module.exports = {
  patch: [
    updateSettlement
  ],
  post: [
    insertSettlement
  ]

}