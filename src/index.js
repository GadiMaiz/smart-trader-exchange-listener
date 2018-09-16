import logger from 'logger';
import argv from 'optimist';
import {Producer, Client} from 'kafka-node';
import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';

process.title = ['Smart Trade Exchange Listener'];

let kafka_ip = argv.kafka_ip || 'localhost';
let kafka_port = argv.kafka_port || '2181';
let client = new Client(kafka_ip + ':' + kafka_port);
let producer = new Producer(client);
let producer_ready = false;

producer.on('ready', () => {
    producer_ready = true;
});

class orderbook_listener
{
    constructor(orderbook)
    {
        this.set_listener(orderbook);
    }

    set_listener(orderbook)
    {
        this.orderbook = orderbook;
    }

    orderbook_changed()
    {
        if (this.orderbook && producer_ready)
        {
            let curr_orderbook = this.orderbook.get_orderbook(10);
            producer.send([{topic: 'orderbook_bitstamp_btc_usd', partition: 0, messages: [JSON.stringify(curr_orderbook)],
                            attributes: 0}], (err, result) => {});
        }
    }
}

let bitstamp_listener = new orderbook_listener(null);
let bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener);
bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);

bitstampOrderbook.bind_all_channels();

import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';

let bitfinex_listener = new orderbook_listener(null);
var bitfinexOrderbook = new bitfinex_orderbook(bitfinex_listener);
bitfinex_listener.set_listener(bitfinexOrderbook.orderbook_manager);

bitfinex_orderbook.init();
bitfinex_orderbook.bind_all_channels();
