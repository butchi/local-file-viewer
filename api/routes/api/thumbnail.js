const express = require('express');
const router = express.Router();

const sharp = require('sharp');

router.get('/', function (req, res, next) {
    try {
        const { path } = req.query;

        const inputBuffer = require('fs').readFileSync(decodeURIComponent(path));

        sharp(inputBuffer)
            .resize(256)
            .png()
            .toBuffer()
            .then(data => {
                res.header('Content-Type', "image/png")
                res.send(data);
            })
    } catch (err) {
        console.error(`Error: ${err}`)
    }
});

module.exports = router;
