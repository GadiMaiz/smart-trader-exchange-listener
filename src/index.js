import logger from 'logger';
import argv from 'optimist';
import { Producer, Client } from 'kafka-node';
import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';
import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';

process.title = ['Smart Trade Exchange Listener'];

let kafka_ip = argv.kafka_ip || 'localhost';
let kafka_port = argv.kafka_port || '2181';
let client = new Client(kafka_ip + ':' + kafka_port);
let producer = new Producer(client);
let producer_ready = false;
let required_pairs = ['BTC-USD', 'BCH-USD'];

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

const bitstamp_listener = new orderbook_listener(null);
const bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener, required_pairs);
bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);

bitstampOrderbook.bind_all_channels();

let bitfinex_listener = new orderbook_listener(null);
let bitfinexOrderbook = new bitfinex_orderbook(bitfinex_listener, required_pairs);
bitfinex_listener.set_listener(bitfinexOrderbook.orderbook_manager);

bitfinexOrderbook.init();
bitfinexOrderbook.bind_all_channels();

