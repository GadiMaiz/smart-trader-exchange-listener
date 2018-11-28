import logger from 'logger';
import * as  _ from 'lodash';
import { Producer as KafkaProducer, KafkaClient } from 'kafka-node';

export default class Producer {

  constructor(endpoint, topics, partitioner) {
    this.endpoint = endpoint;
    this.topics = topics;
    this.ready = false;
    this.partitioner = partitioner;
  }

  isReady() {
    return this.ready;
  }

  init() {

    return new Promise((resolve, reject) => {

      this.client = new KafkaClient({ kafkaHost: this.endpoint });
      const partitionerType = this.partitioner ? 4 : 2;
      this.producer = new KafkaProducer(this.client, { partitionerType }, this.partitioner);

      this.producer.on('ready', () => {

        const topicNames = _.map(this.topics, item => item.topic);

        this.client.refreshMetadata([], () => { });

        this.client.loadMetadataForTopics([], function (error, results) {
          if (error) {
            return logger.error(error);
          }

          const metadata = _.get(results, '1.metadata', {});

          const existingTopics = Object.keys(metadata);
          const missingTopics = _.difference(topicNames, existingTopics);

          if (_.isEmpty(missingTopics)) {
            this.ready = true;
            logger.debug('No missing topics detected.');
            return resolve();
          }

          logger.debug('Missing topics were identified: %j', missingTopics);
          logger.debug('Creating missing topics.');

          const missingTopicsObj = [];
          _.forEach(missingTopics, (topicName) => {
            missingTopicsObj.push(_.find(this.topics, { topic: topicName }));
          });

          this.client.createTopics(missingTopicsObj, (error, result) => {
            if (error || !_.isEmpty(result)) {
              logger.error('Failed to create missing Kafka topics: %o', error || result);
            }
            else {
              logger.debug('All topics were created successfully');
              this.ready = true;
              return resolve();
            }
          });

          return resolve();

        }.bind(this));

      });

    });
  }

  sendMessage(message, topic, key) {
    this.producer.send([{
      topic: topic, messages: [message],
      attributes: 0, key
    }], (err, result) => {
      if (err)
        logger.error('Producer failed to send kafka message for topic \'%s\': %o', topic, err);
    });
  }


}
