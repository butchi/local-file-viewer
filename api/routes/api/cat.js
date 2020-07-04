const express = require('express');
const router = express.Router();

const fs = require('fs');
const FileType = require('file-type');
const { type } = require('os');

router.get('/', function(req, res, next) {
    const { path } = req.query;

    fs.readFile(path, (err, buf) => {
      if (err) {
        throw err;
      }

      FileType.fromBuffer(buf).then(typeObj => {
        if (typeObj.mime) {
            res.header('Content-Type', typeObj.mime)
        }
        res.send(buf);
      });
    })
});

module.exports = router;
