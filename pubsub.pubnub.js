const PubNub = require('pubnub')
const credentials = {
  publishKey: 'pub-c-15d618ae-1e33-4597-ae54-82fa7d180256',
  subscribeKey: 'sub-c-c719e1c0-aee0-11eb-aad1-021b9ca2091c',
  secretKey: 'sec-c-OGU2ZjRmMGMtODExMi00YzAyLWI4ODktNTBhMjZmYzViOWVh'
};

const CHANNELS = {
  TEST: 'TEST',
  TEST2: 'TEST2'
}

class PubSub {
  constructor() {
    this.pubnub = new PubNub(credentials)

    this.pubnub.subscribe({channels: Object.values(CHANNELS)});

    this.pubnub.addListener(this.listener())
  }
  listener() {
    return {
      message: messageObject => {
        const {channel, message} = messageObject;
        console.log(`Message received. Channel: ${channel}, Message: ${message}`)
      }
    }
  }
  publish({channel, message}) {
    this.pubnub.publish({channel, message})
  }
}
const testPubSub = new PubSub();
testPubSub.publish({channel: CHANNELS.TEST, message: 'PubNub'});
module.exports = PubSub