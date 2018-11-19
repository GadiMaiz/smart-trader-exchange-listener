import argv from 'optimist';
import * as  _ from 'lodash';

export const DEFAULT_CURRENCIES = ['BTC-USD', 'BCH-USD'];
export const DEFAULT_PARTITIONS_NUMBER = 2;
export const DEFAULT_REPLICATION_FACTOR = 3;


export const DEFAULT_HTTP_PORT = 9015;
export const DEFAULT_LOG_MAX_FILE_SIZE = 1024 * 5; // file size is in KB. Default to 5 Mb.
export const DEFAULT_LOG_MAX_FILES = 10;
export const DEFAULT_LOG_LEVEL = 'INFO';



const kafka_endpoint = argv.kafka_endpoint || process.env.KAFKA_ENDPOINT || 'localhost:9092';
const topics = _.map(DEFAULT_CURRENCIES, (item) => { return { topic: item, partitions: DEFAULT_PARTITIONS_NUMBER, replicationFactor: DEFAULT_REPLICATION_FACTOR }; });


export const DEFAULT_CONFIG = {
  HTTP_PORT: 9000,
  EXCHANGE_LIST: {
    'Bitfinex': DEFAULT_CURRENCIES,
    'Bitstamp': DEFAULT_CURRENCIES,
  },
  KAFKA: {
    ENDPOINT: kafka_endpoint,
    TOPICS: topics
  },
  LOG: {
    LOG_LEVEL: DEFAULT_LOG_LEVEL,
    LOG_MAX_FILES: DEFAULT_LOG_MAX_FILES,
    LOG_MAX_FILE_SIZE: DEFAULT_LOG_MAX_FILE_SIZE
  }
};