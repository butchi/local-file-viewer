const express = require('express');
const router = express.Router();

const fs = require('fs');
const path = require('path');

const listFiles = dirPath => {
  const nameArr = fs.readdirSync(decodeURIComponent(dirPath));

  return nameArr.map(name => {
    try {
      const filePath = path.join(dirPath, name);
      const stat = fs.statSync(filePath);

      return Object.assign({}, {
        path: filePath + (stat.isDirectory() ? "/" : ""),
        name: encodeURIComponent(name + (stat.isDirectory() ? "/" : "")),
      },
        stat
      );
    } catch (err) {
      console.error('error:', err.message);
    }
  }).filter(item => item != null);
};

/* GET users listing. */
router.get('/', function (req, res, next) {
  const { path } = req.query || '.';

  const fileArr = listFiles(path);

  res.json(fileArr);
});

module.exports = router;
