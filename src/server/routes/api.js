import express from 'express';
const router = express.Router();
import apiLogger from '../middlewares/apiLogger';
import config from './config';
router.use(apiLogger);
router.get('/', async (req, res, next) => {
  try {
    res.send({ isAlive: true });
  }
  catch (err) {
    next(err);
  }
});
// inner routes
router.use('/config/', config);
module.exports = router;