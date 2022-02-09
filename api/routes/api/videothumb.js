const express = require('express');
const { stream } = require('file-type');
const router = express.Router();

const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const crypto = require('crypto');
const { throws } = require('assert');

function md5hex(str /*: string */) {
    const md5 = crypto.createHash('md5')
    return md5.update(str, 'binary').digest('hex')
}

router.get('/', function (req, res, next) {
    const { path } = req.query;

    try {
        ffmpeg(decodeURIComponent(path))
            .screenshots({
                size: '256x?',
                count: 1,
                folder: 'temp',
                filename: md5hex(path) + '.png',
            })
            .on('error', (_err) => {
                res.end(null);
            })
            .on('end', (stdout, stderr) => {
                const thumbPath = `temp\\${md5hex(path)}.png`;

                fs.readFile(thumbPath, (err, buf) => {
                    if (err) {
                        res.end(null);
                    } else {
                        res.header('Content-Type', "image/png")
                        res.send(buf);
                    }
                });
            });
    } catch (err) {
        res.end(err);
    }

});

module.exports = router;
