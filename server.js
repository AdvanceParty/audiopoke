const fs = require('fs');
const io = require('socket.io');
const configFile = 'config.json';
let connections = 0;
let server;

const init = async configFile => {
  const config = await loadConfig(configFile);
  server = createServer(config.server);
  server.on('connection', socket => onClientConnection(socket));
};

const onClientConnection = socket => {
  connections++;
  broadcast(getConnectionsSummary());
  console.log(`New connection. Client count = ${connections}`);
  socket.on('disconnect', () => onClientDisconnect());
};

const onClientDisconnect = id => {
  connections--;
  console.log(`Client disconnected. ${connections} clients still connected.`);
  broadcast(getConnectionsSummary());
};

const getConnectionsSummary = () => {
  const count = connections;
  const summary = `${connections} client(s) connected`;
  return { count, summary };
};

const broadcast = (data = {}, event = 'broadcast') => server.emit(event, data);

const loadConfig = configPath => {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
};

const createServer = ({ port }) => {
  return (server = io.listen(port));
};

init(configFile);
