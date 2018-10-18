import logger from 'logger';
import SortedMap from 'collections/sorted-map';

class orderbook_manager {
  constructor(orderbook_listener, exchange_name, asset_pairs) {
    this.clear_orderbook(asset_pairs);
    this.orderbook_listener = orderbook_listener;
    this.exchange_name = exchange_name;
    this.required_pairs = asset_pairs;
  }

  clear_orderbook(asset_pairs) {
    logger.debug('Clearing orderbook ');
    this.orderbook = {};
    const price_compare_asc = (a, b) => (a < b ? 1 : (a > b ? -1 : 0));
    const price_compare_desc = (a, b) => (a > b ? 1 : (a < b ? -1 : 0));
    for(let i = 0; i < asset_pairs.length; i++) {
      this.orderbook[asset_pairs[i]] = {
        asks: new SortedMap(null, null, price_compare_desc),
        bids: new SortedMap(null, null, price_compare_asc)
      };
    }
  }

  add_order(order, asset_pair) {
    let orders_map = this.orderbook[asset_pair][order.type];
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
    // this.print_orderbook();
  }

  delete_order(order, asset_pair) {
    logger.debug('Deleting order: %s', JSON.stringify(order));
    let orders_map = this.orderbook[asset_pair][order.type];
    let orders_in_curr_price = orders_map.get(order.price);
    if (orders_in_curr_price != null)
    {
      let order_to_delete = orders_in_curr_price.exchange_orders[order.exchange_id];
      if (order_to_delete != null)
      {
        logger.debug('Found order in price level, before delete %s\n', JSON.stringify(orders_in_curr_price));
        orders_in_curr_price.size -= order_to_delete.size;
        delete orders_in_curr_price.exchange_orders[order.exchange_id];
        logger.debug('Found order in price level, after delete %s\n', JSON.stringify(orders_in_curr_price));
      }
      else
      {
        logger.debug('Didn\'t find order with id "%s", %s in price level %s', order.exchange_id, JSON.stringify(order), JSON.stringify(orders_in_curr_price));
      }

      if (orders_in_curr_price.size == 0 || Object.keys(orders_in_curr_price.exchange_orders).length == 0)
      {
        orders_map.delete(order.price);
        logger.debug('Price level %s removed', order.price);
      }
    }
    else
    {
      logger.debug('Didn\'t find order %s', JSON.stringify(order));
    }
    // this.print_orderbook();
  }

  change_order(order, asset_pair) {
    logger.debug('Changing order: %s', JSON.stringify(order));
    let orders_map = this.orderbook[asset_pair][order.type];
    let orders_in_curr_price = orders_map.get(order.price);
    if (orders_in_curr_price != null)
    {
      let order_to_change = orders_in_curr_price.exchange_orders[order.exchange_id];
      if (order_to_change != null)
      {
        let size_change = order.size - order_to_change.size;
        order_to_change.size = order.size;
        orders_in_curr_price.size += size_change;
      }
      else
      {
        logger.debug('Didn\'t find order to change %s in price level %s',
          JSON.stringify(order), JSON.stringify(orders_in_curr_price));
      }
    }
    else
    {
      logger.debug('Didn\'t find order to change for order %s', JSON.stringify(order));
    }
    // this.print_orderbook();
  }

  print_orderbook(asset_pair) {
    // console.log('Printing asks:');
    if (asset_pair == null) {
      return;
    }
    else {
      let asks = this.orderbook[asset_pair].asks;
      let iterator = asks.iterate();
      let curr = iterator.next();
      let best_ask = [];
      let counter = 0;
      while (!curr.done && counter < 3) {
        ++counter;
        best_ask.push({ price: curr.value.key, size: curr.value.value.size });
        logger.debug('ask %s %s', curr.value.key, curr.value.value.size);
        curr = iterator.next();
      }
      // console.log("Printing bids:");
      let bids = this.orderbook[asset_pair].bids;
      iterator = bids.iterate();
      curr = iterator.next();
      let best_bid = [];
      counter = 0;
      while (!curr.done && counter < 3) {
        ++counter;
        best_bid.push({ price: curr.value.key, size: curr.value.value.size });
        logger.debug('bid %s %s', curr.value.key, curr.value.value.size);
        curr = iterator.next();
      }
      /* console.log('Ticker', 'asks', best_ask, 'bids', best_bid);
      console.log('Ticker', 'bids', best_bid);*/
    }
  }

  notify_orderbook_changed() {
    if (this.orderbook_listener) {
      this.orderbook_listener.orderbook_changed();
    }
  }

  get_orderbook(asset_pair, limit) {
    if (limit == null)
    {
      return this.orderbook[asset_pair];
    }
    else
    {
      let order_types = ['asks', 'bids'];
      let result_orderbook = {};
      for (let order_type_index = 0; order_type_index < order_types.length; ++order_type_index)
      {
        let type_limit = limit ? Math.min(limit, this.orderbook[asset_pair][order_types[order_type_index]].length) :
          this.orderbook[order_types[order_type_index]].length;
        let orders_iterator = this.orderbook[asset_pair][order_types[order_type_index]].iterate();
        let curr_order = orders_iterator.next();
        let curr_types_orders = [];
        for (let order_index = 0; order_index < type_limit && !curr_order.done; ++order_index)
        {
          curr_types_orders.push(curr_order.value.value);
          curr_order = orders_iterator.next();
        }
        result_orderbook[order_types[order_type_index]] = curr_types_orders;
      }
      return result_orderbook;
    }
  }
}

export default orderbook_manager;