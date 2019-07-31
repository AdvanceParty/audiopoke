const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(80);

app.get('/', function(req, res) {
  res.sendFile(`${__dirname}/index.html`);
});

io.on('connection', function(socket) {
  socket.emit('service', { event: 'connection accepted' });
  socket.on('ping', function(data) {
    console.log(`ping received: ${data}`);
  });
});

/*

const server = http.createServer((req, res) => {
  res.write(`<h1>${new Date()}</h1>`);
});
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
  console.log('Connection');
  console.log(ws);
});

server.listen(8081);

const init = async () => {
  const config = await loadConfig('config.json');
  const { server, devices } = config;
  const boseClient = getConnection(devices[0].ip, devices[0].protocol);
  boseClient.on('message', function incoming(data) {
    sendMessage(data);
  });
};

const loadConfig = configPath => {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};

const getConnection = (ip, protocol) => {
  const conn = new WebSocket(`ws://${ip}:8080`, protocol);
  return conn;
};

const sendMessage = data => {
  console.log(data.substr(0, 20));
  console.log(wss.clients);
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

init(configFile);
*/
