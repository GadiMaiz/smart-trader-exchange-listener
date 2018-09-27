import { expect, should } from 'chai';
import bitfinex_orderbook from './bitfinex_orderbook';
import api from 'sinon';

const sinon = api;
var listener_stub = sinon.stub();
var bitfinexOrderbook = new bitfinex_orderbook(listener_stub);
let orders = [];
let expected_orders = [{price: 6978, size: 0.32, type: 'asks', exchange_id: '1', source: 'Bitfinex'},
        {price: 6982, size: 0.56, type: 'asks', exchange_id: '2', source: 'Bitfinex'},
        {price: 6976, size: 0.25, type: 'bids', exchange_id: '3', source: 'Bitfinex'},
        {price: 6995, size: 0.89, type: 'asks', exchange_id: '4', source: 'Bitfinex'},
        {price: 6990, size: 0.7, type: 'asks', exchange_id: '5', source: 'Bitfinex'},
        {price: 6975, size: 0.45, type: 'bids', exchange_id: '6', source: 'Bitfinex'},
        {price: 6962, size: 0.83, type: 'bids', exchange_id: '7', source: 'Bitfinex'},
        {price: 6960, size: 0.2, type: 'bids', exchange_id: '8', source: 'Bitfinex'},
        {price: 6989, size: 0.6, type: 'asks', exchange_id: '9', source: 'Bitfinex'},
        {price: 6988, size: 0.76, type: 'asks', exchange_id: '10', source: 'Bitfinex'},
        {price: 6981, size: 0.7, type: 'asks', exchange_id: '11', source: 'Bitfinex'},
        {price: 6981, size: 0.6, type: 'asks', exchange_id: '12', source: 'Bitfinex'},
        {price: 6650, size: 0.3, type: 'bids', exchange_id: '13', source: 'Bitfinex'}];

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

        expect(order).to.deep.equals({price: 6980, size: 0.25, type: 'bids', exchange_id: '123', source: 'Bitfinex'});
    });

    it('normalize_order should return ask order', () => {
        const raw_message = [123, 6980, -0.25];
        const order = bitfinexOrderbook.normalize_order(raw_message);

        expect(order).to.deep.equals({price: 6980, size: 0.25, type: 'asks', exchange_id: '123', source: 'Bitfinex'});
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
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'delete_order').callsFake((order) => {orders.pop()});

      bitfinexOrderbook.handle_data_message(raw_message);
      expect(orders).to.have.deep.members(expected_orders.slice(0, -1));
    });
    
    it('order_exists should return true', () => {
      const order = {price: 6785, size: 0.35, type: 'asks', exchange_id: '2', source: 'Bitfinex'}
      const orderbook = {'asks': 
        [{price: 6780, size: 0.75, type: 'asks', exchange_id: '1', source: 'Bitfinex'},
        order, {price: 6975, size: 0.32, type: 'asks', exchange_id: '3', source: 'Bitfinex'}], 
        'bids': []};
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'get_orderbook').callsFake(() => orderbook);      
      var result = bitfinexOrderbook.order_exists(order);
      expect(result).to.be.true;
    });

    it('order_exists should return false', () => {
      const order = {price: 6785, size: 0.35, type: 'asks', exchange_id: '15', source: 'Bitfinex'}  
      var result = bitfinexOrderbook.order_exists(order);
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
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'change_order').callsFake((order) => { orders[12].price = raw_message[1][1];
        orders[12].size = raw_message[1][2]; 
      });

      bitfinexOrderbook.handle_data_message(raw_message);
      expected_orders[12].price = 6750;
      expected_orders[12].size = 0.5;
      expect(orders).to.have.deep.members(expected_orders);
    });
      
  });

});