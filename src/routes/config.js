let express = require('express');
let router = express.Router();
import ConfigManager from 'node-config-module';

router.post('/config/update', (req, res, next) => {
  let config = req.params['config'];
  console.log(config);
  //  ConfigManager.updateConfig(config);
  res.setHeader('Content-Type', 'text/plain');
});