const express = require('express');
const router = express.Router();
const State = require('../db/models/State')
const Lock = require('../db/models/Lock')

router.route('/lock').lock((req, res, next) => {
  const ID = req.body.ID
  const stitchClient = req.stitchClient
  const obj = {
    type: 'terraform',
    ID: ID,
    lock: req.body
  }

  stitchClient.executeFunction('lock', obj).then((r) => {
    res.send(r)
  }).catch((err) => {
    console.error(err)
  })

  /*Lock.findOne({ 'ID': ID }).then((doc) => {
    if (doc) {
      res.status(423).send(doc)
    } else {
      const lock = new Lock(obj)
      lock.save().then((doc) => {
        res.send(doc)
      })
    }
  })*/
})
router.route('/unlock').unlock((req, res, next) => {
  const stitchClient = req.stitchClient
  stitchClient.executeFunction('unlock', { 'ID': req.body.ID }).then((r) => {
    res.send(r)
  }).catch((err) => {
    console.log(err)
    res.send({})
  })
  /*Lock.remove({ 'ID': req.body.ID }).then((doc) => {
    res.status(200).send({})
  })*/

})

router.route('/:messageID')
  .get((req, res, next) => {
    const stitchClient = req.stitchClient
    const messageID = req.params.messageID
    stitchClient.executeFunction('getTerraformState', { messageID })
      .then((doc) => {
        console.log(doc)
        if (doc) {
          res.send(JSON.parse(doc.tfState))
        }
        else {

          tfState = { 'serial': 0, 'version': 1, 'modules': [{ 'path': ['root'], 'resources': {}, 'outputs': {} }] }

          res.send(tfState)
        }
      })
      .catch((err) => {
        console.error(err)
        res.status(404).send({})
      })
  })
  .post((req, res, next) => {
    const stitchClient = req.stitchClient
    const messageID = req.params.messageID
    const ID = req.query.ID
    const tfState = req.body
    return stitchClient.executeFunction('postTerraformState', { messageID, tfState }).then((doc) => {
      console.log(doc)
      res.send(doc.tfState)
    }).catch((err) => {
      console.error(err)
      res.status(404).send({})
    })
  })
  .delete((req, res, next) => {
    const stitchClient = req.stitchClient
    const messageID = req.params.messageID
    const tfState = req.body

    return stitchClient.executeFunction('deleteTerraformState', { messageID }).then((doc) => {
      res.send({})
    }).catch((err) => {
      console.error(err)
      res.status(404).send({})
    })
  })

module.exports = router;