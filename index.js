const fs = require('fs');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const http = require('http');
const convert = require('xml-js');
const configFile = 'config.json';
let clients = new Map();

const init = async configFile => {
  const config = await loadConfig(configFile);
  const socketServer = createSocketServer(config.server, handleSocketRequest);
  const boseClient = createBoseClient(config.devices[0]);
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

const createBoseClient = device => {
  const client = new WebSocketClient();

  client.connect(`ws://${device.ip}:8080`, device.protocol);
  client.on('connect', connection => {
    connection.on('error', error => onBoseError(error));
    connection.on('close', () => onBoseDisconnect());
    connection.on('message', message => onBoseMessage(message));
  });
};

const parseBoseMessage = utf8Data => {
  // todo: convert string to structured data
  // return utf8Data;
  return JSON.parse(convert.xml2json(utf8Data, { compact: true }));
};

const onBoseError = data => {
  if (data.type === 'utf8') {
    const msg = parseBoseMessage(data.utf8Data);
    log(`[Bose Connection ERROR] ${msg}`);
  }
};

const onBoseDisconnect = () => {
  log('Bose connection lost');
};
const onBoseMessage = data => {
  if (data.type === 'utf8') {
    const msg = parseBoseMessage(data.utf8Data);
    log(`[Received from Bose] ${msg}`);
    sendMessage(msg);
  } else {
    log('Unexpected message format from Bose:');
    log(data);
  }
};

init(configFile);
