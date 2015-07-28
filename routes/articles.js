var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('articles', { title: 'This is an article', body: 'This is the body of the article', footer: "this is the footer of the article" });
  res.send({ title: 'This is an article', body: 'This is the body of the article', footer: "this is the footer of the article" });
});

module.exports = router;
