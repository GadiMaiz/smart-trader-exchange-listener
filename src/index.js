import logger from 'logger';
import argv from 'optimist';
import { Producer, Client } from 'kafka-node';
import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';
import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';
import { ConfigManager } from 'node-config-module';

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

let exchange_list = ConfigManager.getConfig().EXCHANGE_LIST;

// let bitfinex_listener = new orderbook_listener(null);
// let bitfinexOrderbook = new bitfinex_orderbook(bitfinex_listener, exchange_list['Bitfinex']);

// const bitstamp_listener = new orderbook_listener(null);
// const bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener, required_pairs);

// for(let exchange_name of Object.keys(exchange_list)) {
//   switch(exchange_name) {
//     case 'Bitfinex':
//       logger.debug('Initialize Bitfinex Orderbook');
//       bitfinex_listener.set_listener(bitfinexOrderbook.orderbook_manager);

//       bitfinexOrderbook.init();
//       bitfinexOrderbook.bind_all_channels();
//       break;
//     case 'Bitstamp':
//       logger.debug('Initialize Bitstamp Orderbook');
//       bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);
//       bitstampOrderbook.bind_all_channels();
//       break;
//     default:
//       logger.debug(exchange_name + ' is not supported yet');
//   }
// }






