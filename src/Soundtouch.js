const SOUNDTOUCH_EVENTS = require('./SoundtouchEvents');

const parseEvent = data => {
  if (!data.updates) {
    console.log('Unsupported data. Expected object in form of {updates: [...]}.');
  }
};
