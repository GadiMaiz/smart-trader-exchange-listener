import { expect, should } from 'chai';
import bitfinex_orderbook from './bitfinex_orderbook';
import api from 'sinon';
const sinon = api;
const bitfinexOrderbook = new bitfinex_orderbook(null);

describe('Stub tests', () => {

  before(() => {
    console.log('Starting bitfinex_orderbook tests');
  });

  after(async () => {
    console.log('Finished bitfinex_orderbook tests');
  });

  describe('bitfinex_orderbook', () => {
    it('normalize_order should return bid order', () => {
      const raw_message = [123, 6980, 0.25];
      const order = bitfinexOrderbook.normalize_order(raw_message);

      expect(order).to.deep.equals({ price: 6980, size: 0.25, type: 'bids', exchange_id: '123', source: 'Bitfinex' });
    });

    it('normalize_order should return ask order', () => {
      const raw_message = [123, 6980, -0.25];
      const order = bitfinexOrderbook.normalize_order(raw_message);

      expect(order).to.deep.equals({ price: 6980, size: 0.25, type: 'asks', exchange_id: '123', source: 'Bitfinex' });
    });

  });

});