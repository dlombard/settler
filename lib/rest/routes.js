const express = require('express');
const router = express.Router();
const State = require('../db/models/State')

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
          console.log(p)
          res.send(p.tfState)
        }
        )
      }
    }).catch((err) => console.error(err))

  })
  .post((req, res, next) => {
    const messageID = req.params.messageID
    const tfState = req.body
    State.findOneAndUpdate({ 'messageID': messageID }, { '$set': { messageID, tfState } }, { 'upsert': true, new: true }).then((doc) => {
      if (doc) {
        res.status(200).send(req.body)
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