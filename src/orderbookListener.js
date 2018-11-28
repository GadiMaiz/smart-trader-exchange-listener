export default class OrderbookListener {

  constructor(producer, orderbook) {
    this.producer = producer;
    this.set_listener(orderbook);
  }

  set_listener(orderbook) {
    this.orderbook = orderbook;
  }

  orderbook_changed(assetPair) {
    if (this.orderbook) {
      let curr_orderbook = this.orderbook.get_orderbook(assetPair, 10);
      curr_orderbook['time'] = Date.now();
      curr_orderbook['exchange'] = this.orderbook.exchange_name;
      curr_orderbook['assetPair'] = assetPair;
      this.producer.sendMessage(JSON.stringify(curr_orderbook), assetPair, this.orderbook.exchange_name);

    }
  }
}