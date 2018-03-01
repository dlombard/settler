const Settlement = require('../../../../db/models/Settlement')

const find = (req, res, next) => {
  const userId = req.params.id

  Settlement.find({ userId }).then((settlements) => {
    if (settlements) {
      res.send(settlements)
    } else {
      res.status(400).send([])
    }
  }).catch((err) => {
    res.status(400).send([])
  })

}

module.exports = {
  get: [
    find
  ]

}