import WebSocket from 'ws';
import orderbook_manager from 'orderbook/orderbook_manager';
const CRC = require('crc-32');
const pair = 'BTCUSD'

class bitfinex_orderbook {

    constructor(orderbook_listener) {
        this.reset_timestamp = 0;
        this.orderBookChannel = new WebSocket('wss://api.bitfinex.com/ws/2');
        this.channel_id = null;
        this.orderbook_manager = new orderbook_manager(orderbook_listener);
    }

    normalize_order(data) {
        const price = data[0];
        let new_order = {price: Math.abs(price), size: data[2], 
                         type: price >= 0 ? 'bids' : 'asks',
                         count: data[1],
                         exchange_id: "3", // TODO: What is the real exchange id?
                         source: 'Bitfinex'};
        return new_order;
    }

    normalize_orderbook_order(order, type) {
        // console.log(order, type);
    } 

    bind_channel(channel_name, cb) {
       // console.log(channel_name, cd);
    }

    order_callback(channel_name, order) {
       // console.log(channel_name, order);
    }

    bind_all_channels() {
        let snapshotReceived = false;

        this.orderBookChannel.on('open', () => {
            this.orderBookChannel.send(JSON.stringify({ event: 'conf', flags: 131072 }));
            this.orderBookChannel.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: pair, prec: 'P0', len: 100 })); 
        });
        
        this.orderBookChannel.on('message', (message) => {
            message = JSON.parse(message);

            if (message.event) return;
            if (message[1] === 'hb') return;
            if (message[1] === 'cs'){
                const checksum = message[2];
                const checksumData = [];
                let currentOrderbook = this.orderbook_manager.get_orderbook(25);
                let bids = currentOrderbook['bids'];
                let asks = currentOrderbook['asks'];
                for(let i=0; i<25 ; i++) {
                    if (bids[i]) checksumData.push(bids[i].price, bids[i].size);   
                    if (asks[i]) checksumData.push(asks[i].price, asks[i].size); 
                }
                const checksumString = checksumData.join(':');
                const checksumCalculation = CRC.str(checksumString);

                if (checksum !== checksumCalculation) this.reset_orderbook();
        
                return;
            }

            if (!snapshotReceived){
                this.channel_id = message[0];
                message[1].forEach( record => {
                    this.orderbook_manager.add_order(this.normalize_order(record));
                });
                snapshotReceived = true;
            } else {
                let order = this.normalize_order(message);
                if (order.count === 0) this.orderbook_manager.delete_order(order);
                else this.orderbook_manager.change_order(order);
            }

            this.orderbook_manager.notify_orderbook_changed();
        });
    }

    reset_orderbook() {
        
    }

    print_orderbook(orderbook) {

    }

}

export default bitfinex_orderbook;