var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(process.env.OPENSHIFT_NODEJS_PORT || 8080);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.on('news', function (data) {
    socket.broadcast.emit('response', data.mensaje);
  });
});
