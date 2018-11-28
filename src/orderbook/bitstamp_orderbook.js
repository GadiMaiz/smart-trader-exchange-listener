import logger from 'logger';
import Pusher from 'pusher-js';
import orderbook_manager from 'orderbook/orderbook_manager';
import ConfigManager from 'node-config-module';
import * as path from 'path';

const pusher = new Pusher('de504dc5763aeef9ff52');
const DEFAULT_BSTMP_CONFIG = {
  INTERNAL_PAIRS: {
    'BTC-USD': '',
    'BCH-USD': '_bchusd'
  }
};

const configFilePath = path.resolve(__dirname, '../../config_files/bitstamp_config.json');
const conf = ConfigManager.getLocalConfig(configFilePath, DEFAULT_BSTMP_CONFIG);
// ConfigManager.init(DEFAULT_BSTMP_CONFIG, path.resolve(__dirname, '../../config_files/bitstamp_config.json'), () => {
//   conf = ConfigManager.getConfig();
// });

// ConfigManager.setConfigChangeCallback('bitstamp', () => {
//   conf = ConfigManager.getConfig();
// });

class bitstamp_orderbook {
  constructor(orderbook_listener, assetPairs) {
    this.reset_timestamp = 0;
    this.required_pairs = null;
    this.orderbook_channels = {};
    this.orderbook_manager = new orderbook_manager(orderbook_listener, 'Bitstamp', assetPairs);
  }

  init() {
    return;
  }

  normalize_order(data) {
    let new_order = {
      price: data.price, size: data.amount,
      type: data.order_type == 0 ? 'bids' : 'asks',
      exchange_id: data.id.toString(),
      source: 'Bitstamp'
    };
    return new_order;
  }

  normalize_orderbook_order(order, type) {

    return {
      price: parseFloat(order[0]), size: parseFloat(order[1]), type: type,
      exchange_id: order.length > 2 ? order[2] : null, source: 'Bitstamp'
    };
  }

  subscribe(assetPair) {
    let bitstamp_pair = conf.INTERNAL_PAIRS[assetPair];
    let pairIndex = this.orderbook_manager.requiredPairs.indexOf(assetPair);
    if (pairIndex < 0) this.orderbook_manager.requiredPairs.push(pairIndex);
    if (bitstamp_pair) this.orderbook_channels[assetPair] = pusher.subscribe('order_book' + bitstamp_pair);
    else logger.warn('$s is not defined in Bitstamp', assetPair);
  }

  order_callback(channel_name, order) {
    // console.log(channel_name, order);
  }

  start() {
    for (let assetPair of this.orderbook_manager.requiredPairs) {
      let bitstamp_pair = conf.INTERNAL_PAIRS[assetPair];
      if (bitstamp_pair !== null) {
        this.orderbook_channels[assetPair] = pusher.subscribe('order_book' + bitstamp_pair);
      }
    }

    const available_channels = Object.keys(this.orderbook_channels);
    for (let assetPair of available_channels) {
      this.orderbook_channels[assetPair].bind('data', data => {
        this.orderbook_manager.clear_orderbook([assetPair]);
        const orderTypes = ['asks', 'bids'];
        for (let orderType of orderTypes) {
          for (let order of data[orderType]) {
            this.orderbook_manager.add_order(this.normalize_orderbook_order(order, orderType), assetPair);
          }
        }
        this.orderbook_manager.notify_orderbook_changed(assetPair);
      });
    }
  }

  reset_orderbook(bitstamp_orderbook_instance) {
    const url = 'https://www.bitstamp.net/api/v2/order_book/btcusd/?group=2';
    let orderbook_manager = bitstamp_orderbook_instance.orderbook_manager;
    const get_orderbook = async url => {
      try {
        const response = await fetch(url);
        const orderbook = await response.json();
        bitstamp_orderbook_instance.reset_timestamp = orderbook.timestamp;
        orderbook_manager.clear_orderbook(this.required_pairs);
        let orderTypes = ['bids', 'asks'];
        for (let orderType of orderTypes) {
          let orderbook_counter = 0;
          for (let curr_bid in orderbook[orderType]) {
            orderbook_counter++;
            orderbook_manager.add_order(bitstamp_orderbook_instance.normalize_orderbook_order(
              orderbook[orderType][curr_bid],
              orderType));
            if (orderbook_counter > 9) {
              break;
            }
          }
        }
      }
      catch (error) {
        console.log(error);
      }
    };
    get_orderbook(url);
  }

  print_orderbook(orderbook) {
    console.log('Printing asks:');
    let asks = orderbook.orderbook_manager.get_orderbook().asks;
    let iterator = asks.iterate();
    let curr = iterator.next();
    while (!curr.done) {
      console.log('ask', curr.value.key, curr.value.value.size);
      curr = iterator.next();
    }
    console.log('Printing bids:');
    let bids = orderbook.orderbook_manager.get_orderbook().bids;
    iterator = bids.iterate();
    curr = iterator.next();
    while (!curr.done) {
      console.log('bid', curr.value.key, curr.value.value.size);
      curr = iterator.next();
    }
  }

  unsubscribe(pair) {
    let bitstamp_pair = conf.INTERNAL_PAIRS(pair);
    let pairIndex = this.orderbook_manager.requiredPairs.indexOf(pair);
    if (pairIndex > -1) this.orderbook_manager.requiredPairs.splice(pairIndex, 1);
    pusher.unsubscribe('order_book' + bitstamp_pair);
  }

  stop() {
    for (let assetPair of Object.keys(this.orderbook_channels)) {
      pusher.unsubscribe('order_book' + conf.INTERNAL_PAIRS[assetPair]);
    }
  }
}

export default bitstamp_orderbook;