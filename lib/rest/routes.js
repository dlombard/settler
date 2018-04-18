const express = require('express');
const router = express.Router();
const State = require('../db/models/State')
const Lock = require('../db/models/Lock')

router.route('/lock').lock((req, res, next) => {
  console.log(req.body)
  const ID = req.body.ID
  const obj = {
    type: 'terraform',
    ID: ID,
    lock: req.body
  }
  Lock.findOne({ 'ID': ID }).then((doc) => {
    if (doc) {
      res.status(423).send(doc)
    } else {
      const lock = new Lock(obj)
      lock.save().then((doc) => {
        res.send(doc)
      })
    }
  })


})
router.route('/unlock').unlock((req, res, next) => {
  Lock.remove({ 'ID': req.body.ID }).then((doc) => {
    res.status(200).send({})
  })

})

router.route('/:messageID')
  .get((req, res, next) => {
    const messageID = req.params.messageID

    State.findOne({ 'messageID': messageID }).then((doc) => {
      if (doc) {
        res.send(doc.tfState)
      } else {
        const x = {
          'messageID': messageID,
          tfState: { 'serial': 0, 'version': 1, 'modules': [{ 'path': ['root'], 'resources': {}, 'outputs': {} }] }
        }
        const s = new State(x)
        s.save(x).then((p) => {
          res.send(p.tfState)
        }
        )
      }
    }).catch((err) => console.error(err))

  })
  .post((req, res, next) => {
    const messageID = req.params.messageID
    const tfState = req.body
    console.log(req.params)
    console.log(req.query)
    let tempState = req.body.modules[0].resources
    let app = req.body.modules[0].resources['digitalocean_droplet.app']
    return State.findOneAndUpdate({ 'messageID': messageID }, { '$set': { messageID, tfState } }, { 'upsert': true, new: true }).then((doc) => {
      if (doc) {
        if (req.query.ID) {
          return Lock.remove({ 'ID': req.query.ID }).then((doc) => {
            res.status(200).send(req.body)
          })
        } else {
          res.status(200).send(req.body)
        }
      }
      else {
        res.status(404).send({})
      }
    }).catch((err) => console.error(err))

  })
  .delete((req, res, next) => {
    const messageID = req.params.messageID
    const tfState = req.body
    State.remove({ 'messageID': messageID }).then((doc) => {
      res.send({})
    }).catch((err) => console.error(err))
  })

module.exports = router;