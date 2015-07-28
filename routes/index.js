var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { nombre: 'Jesus', titulo: 'Esta es una app de Express' });
});

module.exports = router;
