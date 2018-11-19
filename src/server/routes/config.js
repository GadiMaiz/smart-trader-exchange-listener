import express from 'express';
const router = express.Router();
import configModule from 'node-config-module';
router.get('/', (req, res, next) => {
  try {
    const { section } = req.query;
    const configObj = configModule.getConfig();
    if (section && configObj[section])
      res.send(configObj[section]);
    else
      res.send(configObj);
  }
  catch (err) {
    next(err);
  }
});
router.post('/', (req, res, next) => {
  try {
    const { newConfig } = req.body;
    configModule.updateConfig(newConfig);
    res.send({ success: true });
  }
  catch (err) {
    next(err);
  }
});
module.exports = router;