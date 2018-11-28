import logger from 'logger';
import * as  _ from 'lodash';
import ConfigManager from 'node-config-module';
import { initializeExchange, configDiff, EXCHANGE_ACTIONS } from './helper';
import { DEFAULT_CONFIG } from './constants';
import { Producer } from './kafka';

process.title = ['Smart_Trade_Exchange_Listener'];

logger.info('Starting exchange listener');

const listeners = {};
const orderbooks = {};
let producer;


ConfigManager.setConfigChangeCallback('log', function (newConfig, prevConfig) {
  const { LOG_LEVEL, LOG_MAX_FILE_SIZE, LOG_MAX_FILES } = newConfig.LOG;
  logger.updateLogConfig(LOG_LEVEL, LOG_MAX_FILE_SIZE, LOG_MAX_FILES);
});

const startListener = async (err, config) => {

  if (err) {
    logger.error('Error during listener setup: %o', err);
    return -1;
  }

  const exchangeList = config.EXCHANGE_LIST;
  const exchanges = Object.keys(exchangeList);

  // Custom kafka-producer partitioner (partition by exchange name)
  const ExchangePartitioner = (partitions, key) => {
    if (!key) return 0;

    let exchangeIndex = exchanges.indexOf(key);
    exchangeIndex = exchangeIndex < 0 ? 0 : exchangeIndex;
    const index = exchangeIndex % partitions.length;
    return partitions[index];
  };

  const { ENDPOINT, TOPICS } = config.KAFKA;
  producer = new Producer(ENDPOINT, TOPICS, ExchangePartitioner);
  await producer.init();

  logger.info('start_listening');

  // set hooks for config changes
  ConfigManager.setConfigChangeCallback('listener', (newConfig, prevConfig) => {
    logger.debug('Change configuration');
    const diff = configDiff(newConfig.EXCHANGE_LIST, prevConfig.EXCHANGE_LIST);
    const actions = ['add', 'remove'];
    let exchangeList = newConfig.EXCHANGE_LIST;
    for (let action of actions) {
      for (let exchangeName of diff[action]) {
        EXCHANGE_ACTIONS[action](exchangeName, listeners, orderbooks, exchangeList[exchangeName], producer);
        logger.debug('%s %s', action, exchangeName);
      }
      for (let exchangeName of Object.keys(diff.update[action])) {
        for (let pair of diff.update[action][exchangeName]) {
          logger.debug('%s orderbook %s - %s', action, exchangeName, pair);
          EXCHANGE_ACTIONS[action + 'Pair'](exchangeName, orderbooks, pair);
        }
      }
    }
  });

  // initialize exchanges
  for (let exchangeName of exchanges) {
    initializeExchange(exchangeName, listeners, orderbooks, exchangeList[exchangeName], producer);
  }
};

ConfigManager.init(DEFAULT_CONFIG, null, startListener);