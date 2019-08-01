const fs = require('fs');
const WebSocketServer = require('websocket').server;
const WebSocketClient = require('websocket').client;
const http = require('http');
const convert = require('fast-xml-parser');

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
  const d = new Date();
  const ts = `${d.getFullYear()}-${d.getMonth() +
    1}-${d.getDate()}|${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}:${d.getMilliseconds()}`;
  console.log(`${ts} ${msg}`);
};

const createBoseClient = device => {
  const client = new WebSocketClient();
  console.log('got a client');
  console.log(client);

  client.connect(`ws://${device.alias}:8080`, device.protocol);
  client.on('connect', connection => {
    log('Connected to Bose Soundtouch');
    connection.on('error', error => onBoseError(error));
    connection.on('close', () => onBoseDisconnect());
    connection.on('message', message => onBoseMessage(message));
  });
  client.on('connectFailed', error => onBoseError(error));
};

const parseBoseMessage = utf8Data => {
  const options = {
    parseNodeValue: true,
    parseTrueNumberOnly: false,
    trimValues: true,
    ignoreAttributes: false,
    attributeNamePrefix: '',
    // attrNodeName: 'attr', //default is 'false'
    //
    textNodeName: 'text',
    ignoreNameSpace: false,
    // cdataTagName: "__cdata", //default is 'false'
    // cdataPositionChar: "\\c",
  };
  console.log(utf8Data);
  return convert.parse(utf8Data, options);
  // const traversable = convert.getTraversalObj(utf8Data, options);
  // return convert.convertToJson(traversable, options);
};

const onBoseError = data => {
  log('[Bose Connection ERROR]');
  if (data.type === 'utf8') {
    data = parseBoseMessage(data.utf8Data);
  }
  log(data);
};

const onBoseDisconnect = () => {
  log('Bose connection lost');
};

const onBoseMessage = data => {
  console.log('message');
  if (data.type === 'utf8') {
    const msg = parseBoseMessage(data.utf8Data);
    console.log(JSON.stringify(msg, null, 2));
    sendMessage(msg);
  } else {
    log('Unexpected message format from Bose:');
    log(data);
  }
};

init(configFile);
