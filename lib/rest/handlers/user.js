const find = (req, res, next) => {
console.log('createUser')
res.send({})
}

module.exports = {
  get: [
    find
  ]

}