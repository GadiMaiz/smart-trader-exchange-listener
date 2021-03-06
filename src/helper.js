import bitstamp_orderbook from 'orderbook/bitstamp_orderbook';
import bitfinex_orderbook from 'orderbook/bitfinex_orderbook';
import orderbook_listener from './index';
import logger from 'logger';

const ORDERBOOKS = {
  bitstamp_orderbook,
  bitfinex_orderbook
};

class DynamicOrderbook {
  constructor (exchangeName, listener, asset_pairs) {
    return new ORDERBOOKS[exchangeName](listener, asset_pairs);
  }
}

export const DEFAULT_CONFIG = {
  EXCHANGE_LIST: {
    'Bitfinex': ['BTC-USD', 'BCH-USD'],
    'Bitstamp': ['BTC-USD', 'BCH-USD'],
  }
};

export const EXCHANGE_ACTIONS = {
  add: function(exchangeName, listeners, orderbooks) { initializeExchange(exchangeName, listeners, orderbooks); },
  remove: function(exchangeName, listeners, orderbooks) { stopExchange(exchangeName, listeners, orderbooks); },
  addPair: function(exchangeName, orderbooks, assetPair) { subscribe(exchangeName, orderbooks, assetPair); },
  removePair: function(exchangeName, orderbooks, assetPair) { unsubscribe(exchangeName, orderbooks, assetPair); }
};

export const initializeExchange = (exchangeName, listeners, orderbooks, assetPairs) => {
  let exchangeOrderbook = exchangeName.toLowerCase() + '_orderbook';
  if (ORDERBOOKS[exchangeOrderbook]) {
    listeners[exchangeName] = new orderbook_listener(null);
    orderbooks[exchangeName] = new DynamicOrderbook(exchangeOrderbook, listeners[exchangeName], assetPairs);
    listeners[exchangeName].set_listener(orderbooks[exchangeName].orderbook_manager);
    orderbooks[exchangeName].init();
    orderbooks[exchangeName].start();
  }
  else logger.debug(exchangeName + ' is not supported yet');
};

export const stopExchange = (exchangeName, listeners, orderbooks) => {
  orderbooks[exchangeName].stop();
  delete orderbooks[exchangeName];
  delete listeners[exchangeName];
};

export const configDiff = (previous_config, current_config) => {
  let previous_exchanges = Object.keys(previous_config.EXCHANGE_LIST);
  let current_exchanges = Object.keys(current_config.EXCHANGE_LIST);
  let added_exchanges = current_exchanges.filter( exchange => !previous_exchanges.includes(exchange));
  let removed_exchanges = previous_exchanges.filter( exchange => !current_exchanges.includes(exchange));
  let remaining_exchanges = current_exchanges.filter( exchange => previous_exchanges.includes(exchange));
  let change_in_pairs = { 'add': {}, 'remove': {} };
  for(let exchange_name of remaining_exchanges) {
    let added_pairs = current_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !previous_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    let removed_pairs = previous_config.EXCHANGE_LIST[exchange_name]
      .filter( asset_pair => !current_config.EXCHANGE_LIST[exchange_name].includes(asset_pair));
    if (added_pairs) change_in_pairs['add'][exchange_name] = added_pairs;
    if (removed_pairs) change_in_pairs['remove'][exchange_name] = removed_pairs;
  }
  return { 'add': added_exchanges, 'remove': removed_exchanges, 'update': change_in_pairs };
};

function subscribe(exchangeName, orderbooks, assetPair) {
  orderbooks[exchangeName].subscribe(assetPair);
}

function unsubscribe(exchangeName, orderbooks, assetPair) {
  orderbooks[exchangeName].unsubscribe(assetPair);
}


