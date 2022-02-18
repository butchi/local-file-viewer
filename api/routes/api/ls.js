const e = require('express');
const express = require('express');
const router = express.Router();

const fs = require('fs');
const path = require('path');

const listFile = dirPath => {
  const nameArr = fs.readdirSync(decodeURIComponent(dirPath));

  return nameArr.map(name => {
    try {
      const filePath = path.posix.join(dirPath, name);
      const stat = fs.statSync(filePath);

      return Object.assign({}, stat, {
        path: filePath + (stat.isDirectory() ? "/" : ""),
        name: encodeURIComponent(name + (stat.isDirectory() ? "/" : "")),
      });
    } catch (err) {
      console.error('error:', err.message);
    }
  }).filter(item => item != null);
};

const listFileRecursive = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap(dirent =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFileRecursive(`${dir}/${dirent.name}`)
  )

/* GET users listing. */
router.get('/', function (req, res, next) {
  const { path: filePath, recursive } = req.query || '.';

  if (recursive === "true") {
    const fileArr = listFileRecursive(filePath).map(filePath => {
      try {
        const stat = fs.statSync(filePath);

        return Object.assign({}, stat, {
          path: filePath + (stat.isDirectory() ? "/" : ""),
          dir: path.posix.dirname(filePath),
          parent: path.basename(path.join(filePath, "../")),
          name: encodeURIComponent(path.posix.basename(filePath) + (stat.isDirectory() ? "/" : "")),
        });
      } catch (err) {
        console.error('error:', err.message);
      }
    }).filter(item => item != null);

    res.json(fileArr);
  } else {
    const fileArr = listFile(filePath);

    res.json(fileArr);
  }
});

module.exports = router;
