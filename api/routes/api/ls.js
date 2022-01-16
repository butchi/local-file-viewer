const express = require('express');
const router = express.Router();

const fs = require('fs');

const listFiles = dirPath => {
  const fileArr = [];
  const pathArr = fs.readdirSync(decodeURIComponent(dirPath));

  pathArr.forEach(name => {
    try {
      const path = `${dirPath}/${name}`;
      const stat = fs.statSync(path);

      if (stat == null) {
      } else if (stat.isFile()) {
        fileArr.push({
          name: encodeURIComponent(name),
        });
      } else if (stat.isDirectory()) {
        fileArr.push({
          name: encodeURIComponent(name + '/'),
        });
      }
    } catch (err) {
      console.error('error:', err.message);
    }
  });

  return fileArr;
};

/* GET users listing. */
router.get('/', function (req, res, next) {
  const { path } = req.query || '.';

  const fileArr = listFiles(path);

  res.json(fileArr);
});

module.exports = router;
