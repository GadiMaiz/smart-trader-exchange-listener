// import logger from 'logger';
import argv from 'optimist';
import { Producer, Client } from 'kafka-node';
import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';
import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';
import ConfigManager from 'node-config-module';
// import { config } from '../node_modules/winston';

process.title = ['Smart Trade Exchange Listener'];

const kafka_ip = argv.kafka_ip || process.env.KAFKA_IP || 'localhost';
const kafka_port = argv.kafka_port || process.env.KAFKA_PORT || '2181';
const client = new Client(kafka_ip + ':' + kafka_port);
const producer = new Producer(client);
let producer_ready = false;
const required_pairs = ['BTC-USD', 'BCH-USD'];

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
      for(let i = 0 ; i < required_pairs.length ; i++) {
        let pair = required_pairs[i];
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

const bitfinex_listener = new orderbook_listener(null);
const bitfinexOrderbook = new bitfinex_orderbook(bitfinex_listener, exchange_list['Bitfinex']);
const bitstamp_listener = new orderbook_listener(null);
const bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener, exchange_list['Bitstamp']);

function initialize_bitfinex() {
  bitfinex_listener.set_listener(bitfinexOrderbook.orderbook_manager);
  bitfinexOrderbook.init();
  bitfinexOrderbook.bind_all_channels();
}

function initialize_bitstamp() {
  bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);
  bitstampOrderbook.bind_all_channels();
}

function config_diff(previous_config, current_config) {
  let previous_exchanges = Object.keys(previous_config.EXCHANGE_LIST);
  let current_exchanges = Object.keys(current_config.EXCHANGE_LIST);
  let added_exchanges = current_exchanges.filter( exchange => !previous_exchanges.includes(exchange));
  let removed_exchanges = previous_exchanges.filter( exchange => !current_exchanges.includes(exchange));
  let remaining_exchanges = current_exchanges.filter( exchange => previous_exchanges.includes(exchange));
  let change_in_pairs = { 'add': {}, 'remove': {} };
  for(let exchange_index = 0 ; exchange_index < remaining_exchanges.length ; exchange_index++) {
    let exchange_name = remaining_exchanges[exchange_index];
    let added_pairs = current_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !previous_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    let removed_pairs = previous_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !current_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    if (added_pairs) change_in_pairs['add'][exchange_name] = added_pairs;
    if (removed_pairs) change_in_pairs['remove'][exchange_name] = removed_pairs;
  }
  return { 'add': added_exchanges, 'remove': removed_exchanges, 'update': change_in_pairs };
}

const exchange_actions = { 'Bitfinex': { 'add': initialize_bitfinex(), 'remove': 'n' }, 'Bitstamp': { 'add': initialize_bitstamp() } };
console.log('initialize exchange');
for(let exchange_name of Object.keys(exchange_list)) {
  if (exchange_actions[exchange_name]) exchange_actions[exchange_name]['add'];
}
console.log('finish');
ConfigManager.setConfigChangeCallback('listener', () => {
  console.log('Responding to change');
  previous_config = current_config;
  current_config = ConfigManager.getConfig();
  let diff = config_diff(previous_config, current_config);
  const actions = ['add', 'remove'];
  for(let action_index = 0 ; action_index < actions.length ; action_index++) {
    let action = actions[action_index];
    for(let exchange_index = 0 ; exchange_index < diff[action].length ; exchange_index++) {
      let exchange_name = diff[action][exchange_index];
      if (exchange_actions[exchange_name]) exchange_actions[exchange_name][action];
      console.log(action + '   ' + exchange_name);
    }
    for(let exchange_name of Object.keys(diff.update)) {
      for(let pair_index = 0 ; diff.update[exchange_name][action] && pair_index < diff.update[exchange_name][action].length ; pair_index ++ ) {
        console.log('Add or remove channel: ' + exchange_name + ' - ' + diff.update_asset_pairs[exchange_name][action][pair_index]);
      }
    }
  }
});










