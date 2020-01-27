const path = require('path');
const bodyParser = require('body-parser');
const express = require('express');
const { GracefulShutdownManager } = require('@moebius/http-graceful-shutdown');
const exphbs = require('express-handlebars');
const config = require('./lib/config');
const handlebarsHelpers = require('./lib/handlebars');
const app = express();
const htmlRoute = require('./routes/html');
const markdownRoute = require('./routes/markdown');
const convertRoute = require('./routes/convert');
const appBasePath = require('./appBasePath.js');

app.use(bodyParser.text({ type: 'text/plain' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(appBasePath, express.static(path.resolve(__dirname, '../../public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({
  defaultLayout: 'main',
  helpers: handlebarsHelpers,
}));
app.set('view engine', 'handlebars');

app.locals.data = {
  appBasePath,
};

app.use((req, res, next) => {
  if (req.method === 'POST') {
    console.log('==================');
    console.log('POST', req.url);
    console.log('==================');
    console.log(req.body);
    console.log('==================');
  }

  next();
});

app.get(`${appBasePath}/`, (req, res) => {
  res.render('app', {
    ...config.views,
    ...{
      embedded: !!req.query.embed,
      appBasePath,
    }
  });
});
app.use(`${appBasePath}/html`, htmlRoute);
app.use(`${appBasePath}/markdown`, markdownRoute);
app.use(`${appBasePath}/convert`, convertRoute);

app.use((err, req, res, next) => {
  console.error(err);

  const error = {
    code: err.code || 'unexpected',
    message: err.message || 'Unexpected error',
  };
  if (err.errors) error.errors = err.errors;

  res.status(500).send(error);
});

const port = process.env.PORT || config.api.port;
const server = app.listen(port, () => {
  console.log(`Server running on port <${port}>`)
  console.log(`App basepath is <${appBasePath}>`)
});
const shutdownManager = new GracefulShutdownManager(server);

process.on('SIGTERM', () => {
  shutdownManager.terminate(() => {
    console.log('Server has been gracefully terminated');
  });
});

process.on('SIGINT', () => {
  shutdownManager.terminate(() => {
    console.log('Server has been gracefully terminated');
  });
});

process.on('SIGHUP', () => {
  shutdownManager.terminate(() => {
    console.log('Server has been gracefully terminated');
  });
});

