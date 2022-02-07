const express = require('express');
const router = express.Router();

const ffprobe = require('fluent-ffmpeg').ffprobe;

router.get('/', function (req, res, next) {
    try {
        const { path } = req.query;

        ffprobe(path, (err, metadata) => {
            res.json(metadata);
        });

    } catch (err) {
        console.log(`Error: ${err}`)
    }
});

module.exports = router;
