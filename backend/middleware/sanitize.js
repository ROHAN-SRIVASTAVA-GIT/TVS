const xss = require('xss');
const mongoSanitize = require('express-mongo-sanitize');

const sanitize = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

module.exports = sanitize;
