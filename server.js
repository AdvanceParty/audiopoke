const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const configFile = 'config.json';

const init = async configFile => {
  const config = await loadConfig(configFile);

  // const { server, devices } = config;
  // const boseClient = getConnection(devices[0].ip, devices[0].protocol);
  // boseClient.on('message', function incoming(data) {
  //   sendMessage(data);
  // });

  createServer(config.server);

  app.get('/', function(req, res) {
    res.sendFile(`${__dirname}/index.html`);
  });

  io.on('connection', function(socket) {
    socket.emit('service', { event: 'connection accepted' });
    socket.on('ping', function(data) {
      console.log(`ping received: ${data}`);
    });
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

const createServer = ({ port }) => {
  server.listen(port, () => {
    console.log('I am listening');
  });
};

init(configFile);

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
*/
