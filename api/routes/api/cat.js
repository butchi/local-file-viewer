const express = require('express');
const router = express.Router();

const Octokit = require('octokit').Octokit;

const fs = require('fs');
const FileType = require('file-type');
const { type } = require('os');

router.get('/', async (req, res, next) => {
  try {
    const { path } = req.query;

    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}{?ref}', {
      owner: 'butchi',
      repo: 'kotodama-visualizer',
      path: path,
      mediaType: {
        format: "raw",
      },
    });

    console.log(response);

    // fs.readFile(path, (err, buf) => {
    //   if (err) {
    //     console.log(err);
    //   }

    //   FileType.fromBuffer(buf).then(typeObj => {
    //     if (typeObj == null) {
    //     } else if (typeObj.mime) {
    //       res.header('Content-Type', typeObj.mime)
    //     }
    //     res.send(buf);
    //   });
    // })
  } catch (err) {
    console.log(`Error: ${err}`)
  }
});

module.exports = router;
