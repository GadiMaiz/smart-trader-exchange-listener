import log from 'logger';
module.exports = function (req, res, next) {
  let IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  if (IP === '::1') IP = 'localhost';
  let bodyParams = '';
  if (req.method === 'POST') {
    bodyParams = `Params: ${JSON.stringify(req.body)}. `;
  }
  log.debug(`[API] request '${req.method} ${req.originalUrl} ${req.url}' from ${IP}. ${bodyParams}`);
  next();
};