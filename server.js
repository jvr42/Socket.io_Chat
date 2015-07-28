var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.set('port', process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3002);
app.set('ip', process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1");

server.listen(app.get('port') ,app.get('ip'), function () {
    console.log("Server listening at %s:%d ", app.get('ip'),app.get('port'));
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {

    socket.broadcast.emit('new');

    socket.on('message', function (data) {
       var d = new Date();
       var month = d.getMonth() + 1;
       socket.broadcast.emit('response', {date: d.getDate() + "/" + month + "/" + d.getFullYear(), message: data.mensaje});
    });

    socket.on('disconnect', function () {
      io.emit('out');
    });

});
