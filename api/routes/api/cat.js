const express = require('express');
const router = express.Router();

const fs = require('fs');
const FileType = require('file-type');
const { type } = require('os');

router.get('/', function (req, res, next) {
  try {
    const { path } = req.query;

    fs.readFile(path, (err, buf) => {
      if (err) {
        console.log(err);
      }

      FileType.fromBuffer(buf).then(typeObj => {
        if (typeObj == null) {
          res.header('Content-Type', 'application/octet-stream')
        } else if (typeObj.mime) {
          res.header('Content-Type', typeObj.mime)
        }
        res.send(buf);
      });
    })
  } catch (err) {
    console.log(`Error: ${err}`)
  }
});

module.exports = router;
