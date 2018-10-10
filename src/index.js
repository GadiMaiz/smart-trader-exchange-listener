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

  orderbook_changed(currency) {
    if (this.orderbook && producer_ready) {
      let curr_orderbook = this.orderbook.get_orderbook(10);
      producer.send([{
        topic: 'BTC-USD', partition: 0, messages: [JSON.stringify(curr_orderbook),
          { time: Date.now(), exchange: curr_orderbook.exchange_name }],
        attributes: 0
      }], (err, result) => { });
    }
  }
}

// const bitstamp_listener = new orderbook_listener(null);
// const bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener);
// bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);

// bitstampOrderbook.bind_all_channels();

let bitfinex_listener = new orderbook_listener(null);
let bitfinexOrderbook = new bitfinex_orderbook(bitfinex_listener, ['BTC-USD', 'BCH-USD']);
bitfinex_listener.set_listener(bitfinexOrderbook.orderbook_manager);

console.log(bitfinexOrderbook.orderbook_manager.orderbook);
// bitfinexOrderbook.init();
// bitfinexOrderbook.bind_all_channels();


