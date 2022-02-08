const express = require('express');
const router = express.Router();

const SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
const spotifyApi = new SpotifyWebApi({
    clientId: '${CLIENT_ID}',
    clientSecret: '${CLIENT_SECRET}',
    redirectUri: 'http://localhost:8000/callback'
});

router.get('/', function (req, res, next) {
    try {
        const { artist, album, title } = req.query;

        spotifyApi.setAccessToken('${ACCESS_TOKEN}');

        spotifyApi.searchTracks(`${artist || ''} ${album || ''} ${title || ''}`)
            .then(function (data) {
                res.json(data.body.tracks.items[0].album.images[0].url);
            });
    } catch (error) {
        res.json(error);
    }
});

module.exports = router;
