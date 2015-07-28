var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("Server listening at %s:%d ", app.get('ip'),app.get('port'));
});

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  socket.on('news', function (data) {
    socket.broadcast.emit('response', data.mensaje);
  });
});
