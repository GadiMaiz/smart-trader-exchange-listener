import WebSocket from 'ws';
import orderbook_manager from 'orderbook/orderbook_manager';
import Request from 'request';
const CRC = require('crc-32');
const _ = require('lodash');
const pair = 'BTCUSD';

class bitfinex_orderbook {

  constructor(orderbook_listener) {
    this.reset_timestamp = 0;
    this.orderBookChannel = null;
    this.channel_id = null;
    this.orderbook_manager = new orderbook_manager(orderbook_listener);
    this.snapshotReceived = false;
  }

  init() {
    this.orderBookChannel = new WebSocket('wss://api.bitfinex.com/ws/2');
  }

  normalize_order(data) {
    const size = data[2];
    let new_order = {
      price: data[1], size: Math.abs(size),
      type: size > 0 ? 'bids' : 'asks',
      exchange_id: data[0].toString(),
      source: 'Bitfinex'
    };
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
    this.orderBookChannel.on('open', () => {
      this.orderBookChannel.send(JSON.stringify({ event: 'conf', flags: 131072 }));
      this.orderBookChannel.send(JSON.stringify({ event: 'subscribe', channel: 'book', pair: pair, prec: 'R0', len: 100 }));
    });

    this.orderBookChannel.on('message', (message) => {
      message = JSON.parse(message);

      if (message.event) return;
      if (message[1] === 'hb') return;
      if (message[1] === 'cs') {
        this.handle_checksum_message(message[2]);
        return;
      }
      this.handle_data_message(message);
      this.orderbook_manager.notify_orderbook_changed();
    });
  }

  reset_orderbook() {
    this.orderBookChannel.send(JSON.stringify({ event: 'unsubscribe', chanId: this.channel_id }));
    this.orderBookChannel = new WebSocket('wss://api.bitfinex.com/ws/2');
    this.snapshotReceived = false;
    this.bind_all_channels();
  }

  print_orderbook(orderbook) {
    // print orderbook
  }

  handle_checksum_message(checksum) {
    console.log('Checksum message received:' + checksum);
    const checksumData = [];
    let currentOrderbook = this.orderbook_manager.get_orderbook(25);
    let bids = currentOrderbook['bids'].toArray();
    let asks = currentOrderbook['asks'].toArray();
    for (let i = 0; i < 25; i++) {
      if (bids[i]) checksumData.push(bids[i].exchange_id, bids[i].size);
      if (asks[i]) checksumData.push(asks[i].exchange_id, -asks[i].size);
    }
    const checksumString = checksumData.join(':');
    const checksumCalculation = CRC.str(checksumString);
    console.log(checksumCalculation);
    if (checksum !== checksumCalculation && !this.verify_data_correctness()) {
      console.log('reset orderbook');
      this.reset_orderbook();
      return false;
    }
    return true;
  }

  order_exists(order) {
    const orders = this.orderbook_manager.get_orderbook()[order.type].toArray();
    for (let i = 0; i < orders.length; i++) {
      if ((orders[i].exchange_id === order.exchange_id) && (orders[i].source === 'Bitfinex')) return true;
    }
    return false;
  }

  handle_data_message(message) {
    if (!this.snapshotReceived) {
      this.channel_id = message[0];
      message[1].forEach(record => {
        this.orderbook_manager.add_order(this.normalize_order(record));
      });
      this.snapshotReceived = true;
    } else {
      let order = this.normalize_order(message[1]);
      if (order.price === 0) this.orderbook_manager.delete_order(order);
      else if (this.order_exists(order)) {
        this.orderbook_manager.change_order(order);
      }
      else this.orderbook_manager.add_order(order);
    }
  }

  verify_data_correctness() {
    console.log('Verify Bitfinex orderbook');
    Request.get(
      `https://api.bitfinex.com/v2/book/tBTCUSD/R0`,
      (error, response, body) => {
        let current_snapshot =  [];
        body.forEach((order) => current_snapshot.push(order.slice(1)));
        console.log(current_snapshot);
        let current_orderbook = this.denormalize_orderbook(this.orderbook_manager.get_orderbook(25));
        console.log(current_orderbook);
        const xor_result = _.xorWith(current_snapshot, current_orderbook, _.isEqual);
        if (xor_result.length === 0) return true;
        return false;
      }
    );
  }

  denormalize_orderbook(orderbook) {
    let denormalized_orderbook = [];
    orderbook['bids'].toArary().forEach((bid) => denormalized_orderbook.push([bid.price, bid.size]));
    orderbook['asks'].toArray().forEach((ask) => denormalized_orderbook.push([ask.price, -ask.size]));
    return denormalized_orderbook;
  }
}

export default bitfinex_orderbook;