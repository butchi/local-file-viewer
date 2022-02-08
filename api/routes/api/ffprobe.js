const express = require('express');
const router = express.Router();

const ffprobe = require('fluent-ffmpeg').ffprobe;

router.get('/', function (req, res, next) {
    try {
        const { path } = req.query;

        ffprobe(decodeURIComponent(path), (err, metadata) => {
            if (err) {
                res.json({});
            } else {
                res.json(metadata);
            }
        });
    } catch (err) {
        res.json(err);
    }
});

module.exports = router;
