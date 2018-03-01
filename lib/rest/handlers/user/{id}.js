const User = require('../../../db/models/User')

const find = (req, res, next) => {
  const userID = req.params.id
  User.findById(userID).then((user) => {
    if (user) {
      res.send(user)
    } else {
      res.status(400).send({})
    }
  }).catch((err) => {
    res.status(400).send({})
  })

}

module.exports = {
  get: [
    find
  ]

}