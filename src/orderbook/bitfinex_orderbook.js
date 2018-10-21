import WebSocket from 'ws';
import logger from 'logger';
import orderbook_manager from 'orderbook/orderbook_manager';
import Request from 'request';
const CRC = require('crc-32');
const _ = require('lodash');
const external_pairs = { 'BTC-USD': 'BTCUSD', 'BCH-USD': 'BCHUSD' };
const bitfinex_pairs = { 'BTCUSD': 'BTC-USD', 'BCHUSD': 'BCH-USD' };

class bitfinex_orderbook {

  constructor(orderbook_listener, assetPairs) {
    this.orderbookSocket = null;
    this.orderbookChannels = {};
    this.orderbook_manager = new orderbook_manager(orderbook_listener, 'Bitfinex', assetPairs);
  }

  init() {
    while(true) {
      try {
        this.orderbookSocket = new WebSocket('wss://api.bitfinex.com/ws/2');
        break;
      }
      catch(err) {
        logger.debug('Can\'t start server, retry...\n' + err);
      }
    }
  }

  normalize_order(data) {
    const size = data[2];
    let new_order = {
      price: data[1], size: Math.abs(size),
      type: size > 0 ? 'bids' : 'asks',
      exchange_id: data[0].toString(),
      source: 'Bitfinex'
    };
    return new_order;
  }

  subscribe(assetPair) {
    let pairIndex = this.orderbook_manager.requiredPairs.indexOf(assetPair);
    if (pairIndex < 0)  this.orderbook_manager.requiredPairs.push(pairIndex);
    this.orderbookSocket.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: assetPair, prec: 'R0', len: 100 }));
  }

  unsubscribe(pair) {
    let channel_id = this.find_channel(pair);
    let pairIndex = this.orderbook_manager.requiredPairs.indexOf(pair);
    if (pairIndex > -1)  this.orderbook_manager.requiredPairs.splice(pairIndex, 1);
    if (channel_id) {
      this.orderbookChannels[channel_id].active = false;
      this.orderbookSocket.send(JSON.stringify({ event: 'unsubscribe', chanId: channel_id }));
    }
  }

  bind_all_channels() {
    this.orderbookSocket.on('open', () => {
      this.orderbookSocket.send(JSON.stringify({ event: 'conf', flags: 131072 }));
      for(let pair of this.orderbook_manager.requiredPairs) {
        let bitfinexPair = external_pairs[pair];
        if (bitfinexPair)
          this.subscribe(bitfinexPair);
      }
    });

    this.orderbookSocket.on('message', (message) => {
      message = JSON.parse(message);
      if (message.event) {
        if (message.event === 'error') logger.debug(message.msg);
        if (message.event === 'subscribed' && message.channel === 'book') {
          this.orderbookChannels[message.chanId] = { pair: bitfinex_pairs[message.pair], snapshot_received: false, id_to_price: {}, active: true };
        }
        return;
      }
      if (message[1] === 'hb') return;
      if (message[1] === 'cs') {
        this.handle_checksum_message(message);
        return;
      }
      this.handle_data_message(message);
      // this.orderbook_manager.notify_orderbook_changed();
    });
  }

  normalize_orderbook_order(order, type) {
    // console.log(order, type);
  }

  

  order_callback(channel_name, order) {
    // console.log(channel_name, order);
  }

  

  handle_data_message(message) {
    this.order = message;
    const channel_id = message[0];
    if (this.orderbookChannels[channel_id] && !this.orderbookChannels[channel_id].active) {
      delete this.orderbookChannels[channel_id];
    } else if (this.orderbookChannels[channel_id]) {
      let channel_metadata = this.orderbookChannels[channel_id];
      if (!channel_metadata.snapshot_received) {
        message[1].forEach(record => {
          let order = this.normalize_order(record);
          channel_metadata.id_to_price[order['exchange_id']] = order.price;
          this.orderbook_manager.add_order(order, channel_metadata.pair);
        });
        channel_metadata.snapshot_received = true;
      } else {
        let order = this.normalize_order(message[1]);
        if (order.price === 0) {
          order.price = channel_metadata.id_to_price[order.exchange_id];
          delete channel_metadata.id_to_price[order.exchange_id];
          this.orderbook_manager.delete_order(order,channel_metadata.pair);
        }
        else if (this.order_exists(order, channel_metadata.pair)) {
          channel_metadata.id_to_price[order['exchange_id']] = order.price;
          this.orderbook_manager.change_order(order, channel_metadata.pair);
        }
        else {
          channel_metadata.id_to_price[order['exchange_id']] = order.price;
          this.orderbook_manager.add_order(order, channel_metadata.pair);
        }
      }
      this.orderbookChannels[channel_id] = channel_metadata;
    }
  }

  handle_checksum_message(message) {
    let channel = message[0];
    if (this.orderbookChannels[channel] && !this.orderbookChannels[channel].active) {
      let checksum = message[2];
      let checksumData = [];
      let currentOrderbook = this.orderbook_manager.get_orderbook(this.orderbookChannels[channel].pair, 25);
      currentOrderbook = this.expand_orderbook(currentOrderbook);
      let bids = currentOrderbook['bids'].toArray();
      let asks = currentOrderbook['asks'].toArray();
      for (let i = 0; i < 25; i++) {
        if (bids[i]) checksumData.push(bids[i].id, bids[i].size);
        if (asks[i]) checksumData.push(asks[i].id, -asks[i].size);
      }
      const checksumString = checksumData.join(':');
      const checksumCalculation = CRC.str(checksumString);
      if (checksum !== checksumCalculation) {
        logger.debug('checksum failed - reset orderbook');
        this.reset_orderbook(channel);
      }
    }
  }

  expand_orderbook(orderbook) {
    let new_orderbook = { 'bids': [], 'asks': [] };
    const order_types = ['asks', 'bids'];
    for(let order_type_index = 0; order_type_index < order_types.length ; order_type_index ++) {
      for(let i = 0 ; i < orderbook[order_types[order_type_index]].length ; i++) {
        let order_ids = Object.keys(orderbook[order_types[order_type_index]][i].exchange_orders);
        for(let order_id_index = 0 ; order_id_index < order_ids.length ; order_id_index++) {
          new_orderbook[order_types[order_type_index]].push({ id: order_ids[order_id_index],
            size: orderbook[order_types[order_type_index]][i].exchange_orders[order_ids[order_id_index]].size });
        }
      }
    }
    return new_orderbook;
  }

  order_exists(order, asset_pair) {
    const orders = this.orderbook_manager.get_orderbook(asset_pair)[order.type].toArray();
    for (let i = 0; i < orders.length; i++) {
      if ((orders[i].exchange_id === order.exchange_id) && (orders[i].source === 'Bitfinex')) return true;
    }
    return false;
  }

  reset_orderbook(channel_id) {
    this.orderbookChannels[channel_id].active = false;
    this.orderbookSocket.send(JSON.stringify({ event: 'unsubscribe', chanId: channel_id }));
    let bitfinex_pair = external_pairs[this.orderbookChannels[channel_id].pair];
    this.orderbookSocket.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: bitfinex_pair, prec: 'R0', len: 100 }));
  }

  print_orderbook(orderbook) {
    // print orderbook
  }

  find_channel(pair) {
    for(let channel_id of Object.keys(this.orderbookChannels)) {
      if (this.orderbookChannels[channel_id].pair === pair) return channel_id;
    }
  }

  verify_data_correctness() {
    console.log('Verify Bitfinex orderbook');
    Request.get(
      `https://api.bitfinex.com/v2/book/tBTCUSD/R0`,
      (error, response, body) => {
        let current_snapshot =  [];
        // body.forEach(order => current_snapshot.push(order.slice(1)));
        // console.log(body);
        let current_orderbook = this.denormalize_orderbook(this.orderbook_manager.get_orderbook(25));
        const xor_result = _.xorWith(current_snapshot, current_orderbook, _.isEqual);
        if (xor_result.length === 0) return true;
        return false;
      }
    );
  }

}

export default bitfinex_orderbook;