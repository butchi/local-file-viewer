const express = require('express');
const router = express.Router();

const fileType = require('file-type');

const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');

const crypto = require('crypto');

function md5hex(str /*: string */) {
    const md5 = crypto.createHash('md5')
    return md5.update(str, 'binary').digest('hex')
}

router.get('/', async function (req, res, next) {
    try {
        const { path } = req.query;

        const ft = await fileType.fromFile(decodeURIComponent(path));

        let ext = '';
        let contentType = '';

        if (ft == null) {
        } else if (ft.mime.includes('audio')) {
            ext = '.mp3'
            contentType = 'audio/mp3'
        } else if (ft.mime.includes('video')) {
            ext = '.mp4'
            contentType = 'video/mp4'
        }

        ffmpeg(decodeURIComponent(path))
            .output(`temp/${md5hex(path)}${ext}`)
            .on('error', (_err) => {
                res.end(null);
            })
            .on('end', (stdout, stderr) => {
                const thumbPath = `temp\\${md5hex(path)}${ext}`;

                fs.readFile(thumbPath, (err, buf) => {
                    if (err) {
                        res.end(null);
                    } else {
                        res.header('Content-Type', "${contentType}")
                        res.send(buf);
                    }
                });
            })
            .run();
    } catch (err) {
        console.log(err);

        res.json(err);
    }
});

module.exports = router;
