import kafka from 'kafka-node';
import log from 'logger';

const MAX_RETRIES = 3;
const SESSION_TIMEOUT = 15000;

export default class Consumer {

  constructor(groupPrefix, endpoint, topics) {
    this.groupPrefix = groupPrefix;
    this.endpoint = endpoint;
    this.topics = topics;
  }

  updateConfig(endpoint, topics, handler) {
    this.endpoint = endpoint;
    this.topics = topics;

    if (this.consumer) {

      this.consumer.close(() => {
        this.consumer = this.createClient();
        this.startConsumer(handler);
      });
    }
  }

  createClient() {
    const options = {
      kafkaHost: this.endpoint,
      groupId: `${this.groupPrefix}_${this.topics.join('_')}`,
      sessionTimeout: SESSION_TIMEOUT,
      protocol: ['roundrobin']
    };
    const consumer = new kafka.ConsumerGroup(options, this.topics);
    return consumer;
  }

  startConsumer(handleData, retries = MAX_RETRIES) {

    try {

      this.consumer = this.createClient();

      this.consumer.on('message', function (message) {
        const data = JSON.parse(message.value);
        handleData(data);
      });

      this.consumer.on('error', function (err) {
        log.error('consumer error: %s', err);
      });

    }
    catch (err) {
      log.error('Error on kafka consumer:' + err);
      if (retries > 0) {
        retries--;
        this.startConsumer(handleData, retries);
      }
    }

  }
}