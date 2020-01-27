const os = require('os');
const express = require('express');
const router = express.Router();
const AsyncAPIGenerator = require('asyncapi-generator');
const archiver = require('archiver');
const version = require('../middlewares/version');
const config = require('../lib/config');
const appBasePath = require('../appBasePath.js');

module.exports = router;

router.get(`/template`, (req, res) => {
  res.render('app', {
    ...config.views,
    layout: 'markdown',
    ...{
      appBasePath,
    }
  });
});

router.post('/generate', version, async (req, res) => {
  try {
    const generator = new AsyncAPIGenerator('markdown', os.tmpdir(), {
      entrypoint: 'asyncapi.md',
      output: 'string',
    });
    const markdown = await generator.generateFromString(req.body);

    res.send(markdown);
  } catch (e) {
    return res.status(422).send({
      code: 'incorrect-format',
      message: e.message,
      errors: Array.isArray(e) ? e : null
    });
  }
});

router.post('/download', async (req, res, next) => {
  const archive = archiver('zip');
  res.attachment('asyncapi.zip');
  archive.pipe(res);

  archive.append(req.body.data, { name: 'asyncapi.yml' });
  try {
    const generator = new AsyncAPIGenerator('markdown', os.tmpdir(), {
      entrypoint: 'asyncapi.md',
      output: 'string',
    });
    const markdown = await generator.generateFromString(req.body.data);
    archive.append(markdown, { name: 'asyncapi.md' });
    archive.finalize();
  } catch (e) {
    console.error(e);
    return res.status(422).send({
      code: 'incorrect-format',
      message: e.message,
      errors: Array.isArray(e) ? e : null
    });
  }
});
