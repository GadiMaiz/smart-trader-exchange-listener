import * as path from 'path';
import osprey from 'osprey';
import express from 'express';
import bodyParser from 'body-parser';
import log from 'logger';
import errorHandler from './middlewares/errorHandler';
import api from './routes/api';
export default class Server {
  constructor(config) {
    this.config = config;
  }
  async start(cb) {
    if (!this.config || !this.config.HTTP_PORT)
      throw new Error('Listener web server: Invalid config');

    const app = express();

    // assign middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    try {
      const ramlMiddleware = await osprey.loadFile(path.join(__dirname, '/routes/raml/api.raml'));
      app.use(ramlMiddleware);
    }
    catch (err) {
      log.error(err);
    }

    // routing
    app.use('/api', api);
    app.use(errorHandler);
    const http = require('http');
    this.service = http.createServer(app).listen(this.config.HTTP_PORT, null, () => {
      const port = this.service.address().port;
      log.info(`Exchange listener web server is listening at: localhost:${port}.`);
      if (cb) cb(null, this);
    });
  }
}