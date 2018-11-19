import WebSocket from 'ws';
import logger from 'logger';
import orderbook_manager from 'orderbook/orderbook_manager';
import ConfigManager from 'node-config-module';
import CRC from 'crc-32';
import * as path from 'path';

const DEFAULT_BFX_CONFIG = {
  INTERNAL_PAIRS: { 'BTC-USD': 'BTCUSD', 'BCH-USD': 'BCHUSD' },
  EXTERNAL_PAIRS: { 'BTCUSD': 'BTC-USD', 'BCHUSD': 'BCH-USD' },
  ORDERBOOK_LENGTH: 100,
  CS_FLAG: 131072
};

const configFilePath = path.resolve(__dirname, '../../config_files/bitfinex_config.json');
const conf = ConfigManager.getLocalConfig(configFilePath, DEFAULT_BFX_CONFIG);
// ConfigManager.init(DEFAULT_BFX_CONFIG, path.resolve(__dirname, '../../config_files/bitfinex_config.json'), () => {
//   conf = ConfigManager.getConfig();
// });

// ConfigManager.setConfigChangeCallback('bitfinex', () => {
//   conf = ConfigManager.getConfig();
// });

class bitfinex_orderbook {

  constructor(orderbook_listener, assetPairs) {
    this.orderbookSocket = null;
    this.orderbookChannels = {};
    this.orderbook_manager = new orderbook_manager(orderbook_listener, 'Bitfinex', assetPairs);
  }

  init() {
    while (true) {
      try {
        this.orderbookSocket = new WebSocket('wss://api.bitfinex.com/ws/2');
        break;
      }
      catch (err) {
        logger.debug('Can\'t start server, retry...\n' + err);
        // TODO: Add sleep between tries?
      }
    }
  }

  normalize_order(data) {
    // Bitfinex order format: [id, price, size]
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
    logger.debug(`Subscribe Bitfinex to %s channel`, assetPair);
    // If asset pair is not in exchange's required pairs- add it
    if (this.orderbook_manager.requiredPairs.indexOf(assetPair) < 0) {
      this.orderbook_manager.requiredPairs.push(assetPair);
    }
    this.orderbookSocket.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: assetPair, prec: 'R0', len: conf.ORDERBOOK_LENGTH }));
  }

  unsubscribe(assetPair) {
    logger.debug(`Unsubscribe Bitfinex from %s channel`, assetPair);
    let channel_id = this.find_channel(assetPair);
    let pairIndex = this.orderbook_manager.requiredPairs.indexOf(assetPair);
    // Remove assetPair from exchange's required pairs
    if (pairIndex > -1) {
      this.orderbook_manager.requiredPairs.splice(pairIndex, 1);
    }
    if (channel_id) {
      this.orderbookChannels[channel_id].active = false;
      this.orderbookSocket.send(JSON.stringify({ event: 'unsubscribe', chanId: channel_id }));
    }
  }

  start() {
    logger.debug('Start Bitfiniex Exchange');
    this.orderbookSocket.on('open', () => {
      // Sign up for checksum messages
      this.orderbookSocket.send(JSON.stringify({ event: 'conf', flags: conf.CS_FLAG }));
      for (let assetPair of this.orderbook_manager.requiredPairs) {
        let bitfinexPair = conf.INTERNAL_PAIRS[assetPair];
        if (bitfinexPair)
          this.subscribe(bitfinexPair);
      }
    });

    this.orderbookSocket.on('message', (message) => {
      message = JSON.parse(message);
      if (message.event) {
        if (message.event === 'error') {
          logger.error(`Bitfinex Error: ${message.msg}`);
        }
        if (message.event === 'subscribed' && message.channel === 'book') {
          logger.debug('Bitfinex subscribed to %s at channel %s', conf.EXTERNAL_PAIRS[message.pair], message.chanId);
          this.orderbookChannels[message.chanId] = { pair: conf.EXTERNAL_PAIRS[message.pair], snapshot_received: false, id_to_price: {}, active: true };
        }
        return;
      }
      if (message[1] === 'hb') return;
      if (message[1] === 'cs') {
        this.handle_checksum_message(message);
        return;
      }
      this.handle_data_message(message);
    });
  }

  normalize_orderbook_order(order, type) {
    // console.log(order, type);
  }

  order_callback(channel_name, order) {
    // console.log(channel_name, order);
  }

  // Data message is of the form [channelId, message]
  // First message recieved is snapshot, comprised of array of orders
  // Order message is in the form [id, price, size]
  // price == 0 -> delete order, price > 0 -> add or update
  // size < 0 -> asks, size > 0 -> bids
  handle_data_message(message) {
    logger.debug(`Bitfinex data mesage received: %s`, message);
    const channel_id = message[0];
    if (this.orderbookChannels[channel_id] && !this.orderbookChannels[channel_id].active) {
      logger.debug('Channel %s is inactive, deleting', channel_id);
      this.orderbookSocket.send(JSON.stringify({ event: 'unsubscribe', chanId: channel_id }));
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
          this.orderbook_manager.delete_order(order, channel_metadata.pair);
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
      this.orderbook_manager.notify_orderbook_changed(channel_metadata.pair);
    }
  }

  // Checksum is calculated over the top 25 orders in the orderbook
  handle_checksum_message(message) {
    // let channel = message[0];
    // const assetPair = this.orderbookChannels[channel].pair;
    // logger.debug('Bitfinex checksum message %s on channel %s', assetPair, channel);
    // if (this.orderbookChannels[channel] && this.orderbookChannels[channel].active) {
    //   let checksum = message[2];
    //   let checksumData = [];
    //   let currentOrderbook = this.orderbook_manager.get_orderbook(this.orderbookChannels[channel].pair, 25);
    //   currentOrderbook = this.expand_orderbook(currentOrderbook);
    //   let bids = currentOrderbook['bids'].toArray();
    //   let asks = currentOrderbook['asks'].toArray();
    //   for (let i = 0; i < 25; i++) {
    //     if (bids[i]) checksumData.push(bids[i].id, bids[i].size);
    //     if (asks[i]) checksumData.push(asks[i].id, -asks[i].size);
    //   }
    //   const checksumString = checksumData.join(':');
    //   const checksumCalculation = CRC.str(checksumString);
    //   if (checksum !== checksumCalculation) {
    //     logger.warn(`Bitfinex checksum failed on channel %s. Reset %s orderbook`, channel, assetPair);
    //     this.reset_orderbook(channel, assetPair);
    //     return false;
    //   }
    // }
    return true;
  }

  // Return orderbook to it's original format
  expand_orderbook(orderbook) {
    let newOrderbook = { 'bids': [], 'asks': [] };
    const orderTypes = ['asks', 'bids'];
    for (let orderType of orderTypes) {
      for (let priceLevel of Object.keys(orderbook[orderType])) {
        for (let orderId of Object.keys(orderbook[orderType][priceLevel].exchange_orders)) {
          newOrderbook[orderType].push({ id: orderId, size: orderbook[orderType][priceLevel].exchange_orders[orderId].size });
        }
      }
    }
    return newOrderbook;
  }

  order_exists(order, asset_pair) {
    const orders = this.orderbook_manager.get_orderbook(asset_pair)[order.type].toArray();
    for (let i = 0; i < orders.length; i++) {
      if ((orders[i].exchange_id === order.exchange_id) && (orders[i].source === 'Bitfinex')) return true;
    }
    return false;
  }

  reset_orderbook(channel_id, assetPair) {
    logger.debug('Bitfinex reset orderbook %s on channel %s', assetPair, channel_id);
    if (this.orderbookChannels[channel_id]) {
      this.orderbookChannels[channel_id].active = false;
    }
    this.orderbookSocket.send(JSON.stringify({ event: 'unsubscribe', chanId: channel_id }));
    delete this.orderbookChannels[channel_id];
    this.subscribe(conf.INTERNAL_PAIRS[assetPair]);
  }

  print_orderbook(orderbook) {
    // print orderbook
  }

  find_channel(pair) {
    for (let channel_id of Object.keys(this.orderbookChannels)) {
      if (this.orderbookChannels[channel_id].pair === pair) return channel_id;
    }
  }

}

export default bitfinex_orderbook;