const fs = require('fs');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const http = require('http');

const configFile = 'config.json';
let clients = new Map();

const init = async configFile => {
  const config = await loadConfig(configFile);
  const socketServer = createSocketServer(config.server, handleSocketRequest);
};

const originIsAllowed = origin => {
  // ToDo: check requet origin properly
  // -> see Server Example at https://github.com/theturtle32/WebSocket-Node
  return true;
};

const handleSocketRequest = request => {
  if (originIsAllowed(request.origin)) {
    const key = request.key;
    const connection = request.accept(null, request.origin);

    trackConnection(key, connection);
    connection.on('close', () => untrackConnection(key));
  } else {
    request.reject();
  }
};

const trackConnection = (key, connection) => {
  clients.set(key, connection);
  log(`${key} connected (${clients.size} total connections).`);
};

const untrackConnection = key => {
  clients.delete(key);
  log(`Client ${key} disconnected (${clients.size} total connection/s).`);
};

const createSocketServer = (serverConfig, requestHandler) => {
  const httpServer = http.createServer((req, resp) => {});
  httpServer.listen(serverConfig.port, () => {});

  const wsServer = new WebSocketServer({ httpServer });
  wsServer.on('request', request => requestHandler(request));

  return wsServer;
};

const sendMessage = (data = {}, type = 'broadcast') => {
  const payload = formatPaylod({ data });
  for (let connection of clients.values()) {
    connection.sendUTF(payload);
  }
};

const loadConfig = configPath => {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};

init(configFile);

const formatPaylod = payload => {
  try {
    return JSON.stringify(payload);
  } catch {
    log('Unable to convert payload to string.');
  }
};

const log = msg => {
  console.log(`${new Date()}: ${msg}`);
};
