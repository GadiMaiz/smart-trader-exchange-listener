import logger from 'logger';
import argv from 'optimist';
import { Producer, Client } from 'kafka-node';
import ConfigManager from 'node-config-module';
import { initializeExchange, DEFAULT_CONFIG, configDiff, EXCHANGE_ACTIONS } from './helper';

process.title = ['Smart Trade Exchange Listener'];

const kafka_ip = argv.kafka_ip || process.env.KAFKA_IP || 'localhost';
const kafka_port = argv.kafka_port || process.env.KAFKA_PORT || '2181';
const client = new Client(kafka_ip + ':' + kafka_port);
const producer = new Producer(client);
let producer_ready = false;

producer.on('ready', () => {
  producer_ready = true;
});

export default class orderbook_listener {
  constructor(orderbook) {
    this.set_listener(orderbook);
  }

  set_listener(orderbook) {
    this.orderbook = orderbook;
  }

  orderbook_changed() {
    if (this.orderbook && producer_ready) {
      for(let pair of this.orderbook.requiredPairs) {
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

let previousConfig = null;
let currentConfig = null;
let listeners = {};
let orderbooks = {};

ConfigManager.init(DEFAULT_CONFIG, null, () => {
  currentConfig = ConfigManager.getConfig();
  let exchangeList = currentConfig.EXCHANGE_LIST;
  for(let exchangeName of Object.keys(exchangeList)) {
    initializeExchange(exchangeName, listeners, orderbooks, exchangeList[exchangeName]);
  }
});

ConfigManager.setConfigChangeCallback('listener', () => {
  console.log('Responding to change');
  previousConfig = currentConfig;
  currentConfig = ConfigManager.getConfig();
  let diff = configDiff(previousConfig, currentConfig);
  const actions = ['add', 'remove'];
  for(let action of actions) {
    for(let exchangeName of diff[action]) {
      EXCHANGE_ACTIONS[action](exchangeName, listeners, orderbooks);
      logger.debug(action + ' ' + exchangeName);
    }
    for(let exchangeName of Object.keys(diff.update[action])) {
      for(let pair of diff.update[action][exchangeName]) {
        logger.debug(action + ' channel: ' + exchangeName + ' - ' + pair);
        EXCHANGE_ACTIONS[action + '_pair'](exchangeName, orderbooks, pair);
      }
    }
  }
});













