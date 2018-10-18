import logger from 'logger';
import argv from 'optimist';
import { Producer, Client } from 'kafka-node';
import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';
import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';
import { ConfigManager } from 'node-config-module';
// import { config } from '../node_modules/winston';

process.title = ['Smart Trade Exchange Listener'];

const kafka_ip = argv.kafka_ip || process.env.KAFKA_IP || 'localhost';
const kafka_port = argv.kafka_port || process.env.KAFKA_PORT || '2181';
const client = new Client(kafka_ip + ':' + kafka_port);
const producer = new Producer(client);
let producer_ready = false;

producer.on('ready', () => {
  producer_ready = true;
});

class orderbook_listener {
  constructor(orderbook) {
    this.set_listener(orderbook);
  }

  set_listener(orderbook) {
    this.orderbook = orderbook;
  }

  orderbook_changed() {
    if (this.orderbook && producer_ready) {
      for(let i = 0 ; i < this.orderbook.required_pairs.length ; i++) {
        let pair = this.orderbook.required_pairs[i];
        let curr_orderbook = this.orderbook.get_orderbook(pair, 10);
        curr_orderbook['time'] = Date.now();
        curr_orderbook['exchange'] = this.orderbook.exchange_name;
        producer.send([{
          topic: pair, partition: 0, messages: [JSON.stringify(curr_orderbook)],
          attributes: 0
        }], (err, result) => { });
      }
    }
  }
}

const defaultConfig = {
  EXCHANGE_LIST: {
    'Bitfinex': ['BTC-USD', 'BCH-USD'],
    'Bitstamp': ['BTC-USD', 'BCH-USD'],
    'Kraken': ['BTC-EUR']
  }
};

ConfigManager.init(defaultConfig, null, () => console.log('callback'));

let previous_config = null;
let current_config = ConfigManager.getConfig();
let exchange_list = current_config.EXCHANGE_LIST;
let listeners = {};
let orderbooks = {};

function initialize_bitfinex() {
  listeners['Bitfinex'] = new orderbook_listener(null);
  orderbooks['Bitfinex'] = new bitfinex_orderbook(listeners['Bitfinex'], exchange_list['Bitfinex']);
  listeners['Bitfinex'].set_listener(orderbooks['Bitfinex'].orderbook_manager);
  orderbooks['Bitfinex'].init();
  orderbooks['Bitfinex'].bind_all_channels();
}

function initialize_bitstamp() {
  listeners['Bitstamp'] = new orderbook_listener(null);
  orderbooks['Bitstamp']  = new bitstamp_orderbook(listeners['Bitstamp'], exchange_list['Bitstamp']);
  listeners['Bitstamp'].set_listener(orderbooks['Bitstamp'].orderbook_manager);
  orderbooks['Bitstamp'].bind_all_channels();
}

function stop_bitfinex() {
  orderbooks['Bitfinex'].orderbookSocket.close();
  delete orderbooks['Bitfinex'];
  delete listeners['Bitfinex'];
}

function stop_bitstamp() {
  delete orderbooks['Bitstamp'];
  delete listeners['Bitstamp'];
}

function config_diff(previous_config, current_config) {
  let previous_exchanges = Object.keys(previous_config.EXCHANGE_LIST);
  let current_exchanges = Object.keys(current_config.EXCHANGE_LIST);
  let added_exchanges = current_exchanges.filter( exchange => !previous_exchanges.includes(exchange));
  let removed_exchanges = previous_exchanges.filter( exchange => !current_exchanges.includes(exchange));
  let remaining_exchanges = current_exchanges.filter( exchange => previous_exchanges.includes(exchange));
  let change_in_pairs = { 'add': {}, 'remove': {} };
  for(let exchange_name of remaining_exchanges) {
    let added_pairs = current_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !previous_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    let removed_pairs = previous_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !current_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    if (added_pairs) change_in_pairs['add'][exchange_name] = added_pairs;
    if (removed_pairs) change_in_pairs['remove'][exchange_name] = removed_pairs;
  }
  return { 'add': added_exchanges, 'remove': removed_exchanges, 'update': change_in_pairs };
}

const exchange_actions = {
  'Bitfinex': {
    add: function() { initialize_bitfinex(); },
    remove: function() { stop_bitfinex(); },
    add_pair: function(pair) { orderbooks['Bitfinex'].bind_channel(pair); },
    remove_pair: function(pair) { orderbooks['Bitfinex'].unsubscribe(pair); }
  },
  'Bitstamp': {
    add: function() { initialize_bitstamp(); },
    remove: function() { stop_bitstamp(); },
    add_pair: function(pair) { orderbooks['Bitstamp'].bind_channel(pair); },
    remove_pair: function(pair) { orderbooks['Bitstamp'].unsubscribe(pair); }
  }
};

for(let exchange_name of Object.keys(exchange_list)) {
  if (exchange_actions[exchange_name]) exchange_actions[exchange_name].add();
}

ConfigManager.setConfigChangeCallback('listener', () => {
  console.log('Responding to change');
  previous_config = current_config;
  current_config = ConfigManager.getConfig();
  let diff = config_diff(previous_config, current_config);
  const actions = ['add', 'remove'];
  for(let action of actions) {
    for(let exchange_name of diff[action]) {
      if (exchange_actions[exchange_name]) exchange_actions[exchange_name][action];
      logger.debug(action + ' ' + exchange_name);
    }
    for(let exchange_name of Object.keys(diff.update[action])) {
      for(let pair of diff.update[action][exchange_name]) {
        logger.debug(action + ' channel: ' + exchange_name + ' - ' + pair);
        exchange_actions[exchange_name][action + '_pair'](pair);
      }
    }
  }
});










