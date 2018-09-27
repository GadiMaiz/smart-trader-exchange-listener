import logger from 'logger';
import SortedMap from 'collections/sorted-map';

class orderbook_manager {
  constructor(orderbook_listener) {
    this.clear_orderbook();
    this.orderbook_listener = orderbook_listener;
  }

  clear_orderbook() {
    logger.debug('Clearing orderbook');
    const price_compare_asc = (a, b) => (a < b ? 1 : (a > b ? -1 : 0));
    const price_compare_desc = (a, b) => (a > b ? 1 : (a < b ? -1 : 0));
    this.orderbook = {
      asks: new SortedMap(null, null, price_compare_desc),
      bids: new SortedMap(null, null, price_compare_asc)
    };
  }

  add_order(order) {
    logger.debug('Adding order: ' + JSON.stringify(order));
    let orders_map = this.orderbook[order.type];
    delete order.type;
    let orders_in_curr_price = orders_map.get(order.price);
    let exchange_id = order.exchange_id;
    delete order.exchange_id;
    if (orders_in_curr_price == null) {
      order.exchange_orders = {};
      order.exchange_orders[exchange_id] = { price: order.price, size: order.size };
      orders_map.set(order.price, order);
    }
    else {
      orders_in_curr_price.size += order.size;
      orders_in_curr_price.exchange_orders[exchange_id] = order;
    }
    this.print_orderbook();
  }

  delete_order(order) {
    logger.debug('Deleting order: ' + JSON.stringify(order));
    let orders_map = this.orderbook[order.type];
    let orders_in_curr_price = orders_map.get(order.price);
    if (orders_in_curr_price != null) {
      let order_to_delete = orders_in_curr_price[order.exchange_id];
      if (order_to_delete != null) {
        orders_in_curr_price.size -= order.size;
      }
      delete orders_in_curr_price.exchange_orders[order.exchange_id];
      if (orders_in_curr_price.size == 0 || Object.keys(orders_in_curr_price).length == 0) {
        orders_map.delete(order.price);
      }
    }
    this.print_orderbook();
  }

  change_order(order) {
    logger.debug('Changing order: ' + JSON.stringify(order));
    let orders_map = this.orderbook[order.type];
    let orders_in_curr_price = orders_map.get(order.price);
    if (orders_in_curr_price != null) {
      let order_to_change = orders_in_curr_price[order.exchange_id];
      if (order_to_change != null) {
        let size_change = order.size - order_to_change.size;
        order_to_change.size = order.size;
        orders_in_curr_price.size += size_change;
      }
    }
    this.print_orderbook();
  }

  print_orderbook() {
    console.log('Printing asks:');
    let asks = this.orderbook.asks;
    let iterator = asks.iterate();
    let curr = iterator.next();
    let best_ask = [];
    let counter = 0;
    while (!curr.done && counter < 3) {
      ++counter;
      best_ask.push({ price: curr.value.key, size: curr.value.value.size });
      console.log('ask', curr.value.key, curr.value.value.size);
      curr = iterator.next();
    }
    // console.log("Printing bids:");
    let bids = this.orderbook.bids;
    iterator = bids.iterate();
    curr = iterator.next();
    let best_bid = [];
    counter = 0;
    while (!curr.done && counter < 3) {
      ++counter;
      best_bid.push({ price: curr.value.key, size: curr.value.value.size });
      console.log('bid', curr.value.key, curr.value.value.size);
      curr = iterator.next();
    }
    console.log('Ticker', 'asks', best_ask, 'bids', best_bid);
    console.log('Ticker', 'bids', best_bid);
  }

  notify_orderbook_changed() {
    if (this.orderbook_listener) {
      this.orderbook_listener.orderbook_changed();
    }
  }

  get_orderbook(limit) {
    if (limit == null)
    {
      return this.orderbook;
    }
    else
    {
      let order_types = ['asks', 'bids'];
      let result_orderbook = {};
      for (let order_type_index = 0; order_type_index < order_types.length; ++order_type_index) {
        let type_limit = limit ? Math.min(limit, this.orderbook[order_types[order_type_index]].length) :
          this.orderbook[order_types[order_type_index]].length;
        let orders_iterator = this.orderbook[order_types[order_type_index]].iterate();
        let curr_order = orders_iterator.next();
        let curr_types_orders = [];
        for (let order_index = 0; order_index < type_limit && !curr_order.done; ++order_index) {
          curr_types_orders.push({ price: curr_order.value.value.price, size: curr_order.value.value.size });
          curr_order = orders_iterator.next();
        }
        result_orderbook[order_types[order_type_index]] = curr_types_orders;
      }
      return result_orderbook;
    }
  }
}

export default orderbook_manager;