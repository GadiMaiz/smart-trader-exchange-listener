
// Set process name
process.title = ['Smart Trade Exchange Listener'];

/*import server from 'server';
server.start();*/

import argv from 'optimist';
var kafka_ip = argv.kafka_ip;

import {Producer, Client} from 'kafka-node';
//import Client from 'kafka-node';

let client = new Client('localhost:2181');
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
            //console.log(JSON.stringify(curr_orderbook));
            producer.send([{topic: 'orderbook_bitstamp_btc_usd', partition: 0, messages: [JSON.stringify(curr_orderbook)],
                            attributes: 0}], (err, result) => {});
        }
    }
}

import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';

let bitstamp_listener = new orderbook_listener(null);
var bitstampOrderbook = new bitstamp_orderbook(bitstamp_listener);
bitstamp_listener.set_listener(bitstampOrderbook.orderbook_manager);

bitstampOrderbook.bind_all_channels();
