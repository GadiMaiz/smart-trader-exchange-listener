import { expect } from 'chai';
import bitfinex_orderbook from './bitfinex_orderbook';
import api from 'sinon';

const sinon = api;
let listener_stub = sinon.stub();
let bitfinexOrderbook = new bitfinex_orderbook(listener_stub);
let orders = [];
let expected_orders = [{ price: 6978, size: 0.32, type: 'asks', exchange_id: '1', source: 'Bitfinex' },
  { price: 6982, size: 0.56, type: 'asks', exchange_id: '2', source: 'Bitfinex' },
  { price: 6976, size: 0.25, type: 'bids', exchange_id: '3', source: 'Bitfinex' },
  { price: 6995, size: 0.89, type: 'asks', exchange_id: '4', source: 'Bitfinex' },
  { price: 6990, size: 0.7, type: 'asks', exchange_id: '5', source: 'Bitfinex' },
  { price: 6975, size: 0.45, type: 'bids', exchange_id: '6', source: 'Bitfinex' },
  { price: 6962, size: 0.83, type: 'bids', exchange_id: '7', source: 'Bitfinex' },
  { price: 6960, size: 0.2, type: 'bids', exchange_id: '8', source: 'Bitfinex' },
  { price: 6989, size: 0.6, type: 'asks', exchange_id: '9', source: 'Bitfinex' },
  { price: 6988, size: 0.76, type: 'asks', exchange_id: '10', source: 'Bitfinex' },
  { price: 6981, size: 0.7, type: 'asks', exchange_id: '11', source: 'Bitfinex' },
  { price: 6981, size: 0.6, type: 'asks', exchange_id: '12', source: 'Bitfinex' },
  { price: 6650, size: 0.3, type: 'bids', exchange_id: '13', source: 'Bitfinex' }];
const static_orderbook = { 'bids': [{ price: 6603.8, size: 0.997, type: 'bids', exchange_id: '17575217703', source: 'Bitfinex' },
  { price: 6603.8, size: 0.01765769, type: 'bids', exchange_id: '17575218317', source: 'Bitfinex' },
  { price: 6603.8, size: 0.356052, type: 'bids', exchange_id: '17575242622', source: 'Bitfinex' },
  { price: 6603.8, size: 4.46592798, type: 'bids', exchange_id: '17575297520', source: 'Bitfinex' },
  { price: 6603.8, size: 1.61094928, type: 'bids', exchange_id: '17575302814', source: 'Bitfinex' },
  { price: 6603.7, size: 5, type: 'bids', exchange_id: '17575217171', source: 'Bitfinex' },
  { price: 6603.2071587, size: 7.999, type: 'bids', exchange_id: '17575300558', source: 'Bitfinex' },
  { price: 6603.1, size: 2.71828974, type: 'bids', exchange_id: '17574652263', source: 'Bitfinex' },
  { price: 6602.7, size: 0.10777852, type: 'bids', exchange_id: '17575140986', source: 'Bitfinex' },
  { price: 6602.1, size: 0.03029339, type: 'bids', exchange_id: '17575292916', source: 'Bitfinex' },
  { price: 6602, size: 0.15, type: 'bids', exchange_id: '17567020179', source: 'Bitfinex' },
  { price: 6601.5, size: 1, type: 'bids', exchange_id: '17574646039', source: 'Bitfinex' },
  { price: 6601.3, size: 0.4, type: 'bids', exchange_id: '17575304300', source: 'Bitfinex' },
  { price: 6601.2, size: 0.4, type: 'bids', exchange_id: '17575304700', source: 'Bitfinex' },
  { price: 6600.9, size: 3, type: 'bids', exchange_id: '17575214318', source: 'Bitfinex' },
  { price: 6600.8, size: 0.2, type: 'bids', exchange_id: '17575302786', source: 'Bitfinex' },
  { price: 6600.8, size: 0.14641896, type: 'bids', exchange_id: '17575304085', source: 'Bitfinex' },
  { price: 6600.6, size: 0.04, type: 'bids', exchange_id: '17575239086', source: 'Bitfinex' },
  { price: 6600.6, size: 0.15150138, type: 'bids', exchange_id: '17575292895', source: 'Bitfinex' },
  { price: 6600.5, size: 0.002, type: 'bids', exchange_id: '17574727994', source: 'Bitfinex' },
  { price: 6600.4, size: 0.29012194, type: 'bids', exchange_id: '17575099033', source: 'Bitfinex' },
  { price: 6600.4, size: 0.009427, type: 'bids', exchange_id: '17575125725', source: 'Bitfinex' },
  { price: 6600.4, size: 0.359459, type: 'bids', exchange_id: '17575152291', source: 'Bitfinex' },
  { price: 6600.4, size: 0.09570382, type: 'bids', exchange_id: '17575170484', source: 'Bitfinex' },
  { price: 6600.4, size: 0.02217699, type: 'bids', exchange_id: '17575194127', source: 'Bitfinex' }],
'asks': [{ price: 6603.9, size: 43.34479729, type: 'asks', exchange_id: '17575209257', source: 'Bitfinex' },
  { price: 6603.9, size: 2, type: 'asks', exchange_id: '17575218551', source: 'Bitfinex' },
  { price: 6603.9, size: 1.14849207, type: 'asks', exchange_id: '17575219951', source: 'Bitfinex' },
  { price: 6603.9, size: 0.5, type: 'asks', exchange_id: '17575269489', source: 'Bitfinex' },
  { price: 6603.9, size: 2.2969802, type: 'asks', exchange_id: '17575275221', source: 'Bitfinex' },
  { price: 6603.9, size: 1.512, type: 'asks', exchange_id: '17575280050', source: 'Bitfinex' },
  { price: 6603.9, size: 0.03028513, type: 'asks', exchange_id: '17575292925', source: 'Bitfinex' },
  { price: 6603.9, size: 0.9391, type: 'asks', exchange_id: '17575300348', source: 'Bitfinex' },
  { price: 6603.9, size: 0.53751612, type: 'asks', exchange_id: '17575301355', source: 'Bitfinex' },
  { price: 6603.9, size: 3, type: 'asks', exchange_id: '17575303567', source: 'Bitfinex' },
  { price: 6603.9, size: 3, type: 'asks', exchange_id: '17575303671', source: 'Bitfinex' },
  { price: 6603.9, size: 0.5, type: 'asks', exchange_id: '17575303889', source: 'Bitfinex' },
  { price: 6604.2, size: 0.15141879, type: 'asks', exchange_id: '17575292907', source: 'Bitfinex' },
  { price: 6604.3, size: 30, type: 'asks', exchange_id: '17574537856', source: 'Bitfinex' },
  { price: 6605, size: 2, type: 'asks', exchange_id: '17575189693', source: 'Bitfinex' },
  { price: 6605.6, size: 3.81, type: 'asks', exchange_id: '17574435964', source: 'Bitfinex' },
  { price: 6606.5, size: 0.22900219, type: 'asks', exchange_id: '17574727302', source: 'Bitfinex' },
  { price: 6606.5, size: 0.04823985, type: 'asks', exchange_id: '17574729034', source: 'Bitfinex' },
  { price: 6606.5, size: 0.56166068, type: 'asks', exchange_id: '17574729788', source: 'Bitfinex' },
  { price: 6606.5, size: 0.11660068, type: 'asks', exchange_id: '17574730289', source: 'Bitfinex' },
  { price: 6606.5, size: 0.15271718, type: 'asks', exchange_id: '17574730793', source: 'Bitfinex' },
  { price: 6606.5, size: 1.2, type: 'asks', exchange_id: '17575304675', source: 'Bitfinex' },
  { price: 6606.6, size: 0.232, type: 'asks', exchange_id: '17575304306', source: 'Bitfinex' },
  { price: 6606.7, size: 0.316, type: 'asks', exchange_id: '17575304082', source: 'Bitfinex' },
  { price: 6606.707052, size: 0.39786515, type: 'asks', exchange_id: '17575292232', source: 'Bitfinex' }] };

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

    it('handle_data_message should send normalized orders', () => {
      const raw_snapshot = [5674, [[1, 6978, -0.32],[2, 6982, -0.56],[3, 6976, 0.25],[4, 6995, -0.89],[5, 6990, -0.7],
        [6, 6975, 0.45],[7, 6962, 0.83],[8, 6960, 0.2],[9, 6989, -0.6],[10, 6988, -0.76],[11, 6981, -0.7],[12, 6981, -0.6],[13, 6650, 0.3]]];
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'add_order').callsFake((order) => orders.push(order));

      bitfinexOrderbook.handle_data_message(raw_snapshot);

      expect(orders).to.have.deep.members(expected_orders);
    });

    it('handle_data_message should delete order', () => {
      const raw_message = [5674, [13, 0, 0]];
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'delete_order').callsFake(() => { orders.pop(); });

      bitfinexOrderbook.handle_data_message(raw_message);
      expect(orders).to.have.deep.members(expected_orders.slice(0, -1));
    });

    it('order_exists should return true', () => {
      const order = { price: 6603.9, size: 3, type: 'asks', exchange_id: '17575303671', source: 'Bitfinex' };
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'get_orderbook').callsFake(() => static_orderbook);
      let result = bitfinexOrderbook.order_exists(order);
      expect(result).to.be.true;
    });

    it('order_exists should return false', () => {
      const order = { price: 6785, size: 0.35, type: 'asks', exchange_id: '15', source: 'Bitfinex' };
      let result = bitfinexOrderbook.order_exists(order);
      expect(result).to.be.false;
    });

    it('handle_data_message should add order', () => {
      const raw_message = [5674, [13, 6650, 0.3]];
      sinon.stub(bitfinexOrderbook, 'order_exists').onCall(0).returns(false).onCall(1).returns(true);

      bitfinexOrderbook.handle_data_message(raw_message);
      expect(orders).to.have.deep.members(expected_orders);
    });

    it('handle_data_message should change order', () => {
      const raw_message = [5674, [13, 6750, 0.5]];
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'change_order').callsFake(() => { orders[12].price = raw_message[1][1];
        orders[12].size = raw_message[1][2];
      });

      bitfinexOrderbook.handle_data_message(raw_message);
      expected_orders[12].price = 6750;
      expected_orders[12].size = 0.5;
      expect(orders).to.have.deep.members(expected_orders);
    });

    it('handle_checksum_message should return true', () => {
      const checksum = 893248935;
      sinon.stub(bitfinexOrderbook, 'reset_orderbook');
      let checksum_verification = bitfinexOrderbook.handle_checksum_message(checksum);
      expect(checksum_verification).to.be.true;
    });

  });

});