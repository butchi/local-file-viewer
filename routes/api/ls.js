const express = require('express');
const router = express.Router();

const fs = require('fs');

const listFiles = dirPath => {
  const fileArr = [];
  const pathArr = fs.readdirSync(dirPath);

  for (let name of pathArr) {
    try {
      const path = `${dirPath}/${name}`;
      const stat = fs.statSync(path);

      switch (true) {
        case stat.isFile():
          fileArr.push(name);
          break;

        case stat.isDirectory():
          fileArr.push(name + '/');
          break;

        default:
      }
    } catch (err) {
      console.error('error:', err.message);
    }
  }

  return fileArr;
};

/* GET users listing. */
router.get('/', function(req, res, next) {
    const { path } = req.query || '.';

    const fileArr = listFiles(path);

    res.json(fileArr);
});

module.exports = router;
