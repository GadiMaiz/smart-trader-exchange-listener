import { expect } from 'chai';
import bitfinex_orderbook from './bitfinex_orderbook';
import api from 'sinon';
const _ = require('lodash');

const assetPair = 'BTC-USD';
const sinon = api;
const listener_stub = sinon.stub();
let bitfinexOrderbook = new bitfinex_orderbook(listener_stub, [assetPair]);
let buildOrderbook = { bids: [], asks: [] };
const snapshotMessage = [555994,[[17575217703,6603.8,0.997],[17575218317,6603.8,0.01765769],[17575242622,6603.8,0.356052],
  [17575297520,6603.8,4.46592798],[17575302814,6603.8,1.61094928],[17575217171,6603.7,5],[17575300558,6603.2071587,7.999],
  [17574652263,6603.1,2.71828974],[17575140986,6602.7,0.10777852],[17575292916,6602.1,0.03029339],[17567020179,6602,0.15],
  [17574646039,6601.5,1],[17575304300,6601.3,0.4],[17575214318,6600.9,3],[17575302786,6600.8,0.2],[17575304085,6600.8,0.14641896],
  [17575239086,6600.6,0.04],[17575292895,6600.6,0.15150138],[17574727994,6600.5,0.002],[17575099033,6600.4,0.29012194],
  [17575125725,6600.4,0.009427],[17575152291,6600.4,0.359459],[17575170484,6600.4,0.09570382],[17575194127,6600.4,0.02217699],
  [17575247327,6600.04293854,0.2],[17575209257,6603.9,-43.34479729],[17575218551,6603.9,-2],[17575219951,6603.9,-1.14849207],
  [17575269489,6603.9,-0.5],[17575275221,6603.9,-2.2969802],[17575280050,6603.9,-1.512],[17575292925,6603.9,-0.03028513],
  [17575300348,6603.9,-0.9391],[17575301355,6603.9,-0.53751612],[17575303567,6603.9,-3],[17575303671,6603.9,-3],[17575303889,6603.9,-0.5],
  [17575292907,6604.2,-0.15141879],[17574537856,6604.3,-30],[17575189693,6605,-2],[17575303706,6605,-1.2],[17574435964,6605.6,-3.81],
  [17574727302,6606.5,-0.22900219],[17574729034,6606.5,-0.04823985],[17574729788,6606.5,-0.56166068],[17574730289,6606.5,-0.11660068],
  [17574730793,6606.5,-0.15271718],[17575304306,6606.6,-0.232],[17575304082,6606.7,-0.316],[17575292232,6606.707052,-0.39786515]]];
const expectedSnapshotOrderbook = { bids: [{ price: 6603.8, size: 0.997, type: 'bids', exchange_id: '17575217703', source: 'Bitfinex' },
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
  { price: 6600.4, size: 0.02217699, type: 'bids', exchange_id: '17575194127', source: 'Bitfinex' },
  { price: 6600.04293854, size: 0.2, type: 'bids', exchange_id: '17575247327', source: 'Bitfinex' }],
asks: [{ price: 6603.9, size: 43.34479729, type: 'asks', exchange_id: '17575209257', source: 'Bitfinex' },
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
  { price: 6605, size: 1.2, type: 'asks', exchange_id: '17575303706', source: 'Bitfinex' },
  { price: 6605.6, size: 3.81, type: 'asks', exchange_id: '17574435964', source: 'Bitfinex' },
  { price: 6606.5, size: 0.22900219, type: 'asks', exchange_id: '17574727302', source: 'Bitfinex' },
  { price: 6606.5, size: 0.04823985, type: 'asks', exchange_id: '17574729034', source: 'Bitfinex' },
  { price: 6606.5, size: 0.56166068, type: 'asks', exchange_id: '17574729788', source: 'Bitfinex' },
  { price: 6606.5, size: 0.11660068, type: 'asks', exchange_id: '17574730289', source: 'Bitfinex' },
  { price: 6606.5, size: 0.15271718, type: 'asks', exchange_id: '17574730793', source: 'Bitfinex' },
  { price: 6606.6, size: 0.232, type: 'asks', exchange_id: '17575304306', source: 'Bitfinex' },
  { price: 6606.7, size: 0.316, type: 'asks', exchange_id: '17575304082', source: 'Bitfinex' },
  { price: 6606.707052, size: 0.39786515, type: 'asks', exchange_id: '17575292232', source: 'Bitfinex' }] };
const deleteMessage = [[555994,[17575247327,0,0.2]], [555994,[17575303706,0,-1.2]]];
const expectedDeletedOrders = { bids: [{ price: 6603.8, size: 0.997, type: 'bids', exchange_id: '17575217703', source: 'Bitfinex' },
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
asks: [{ price: 6603.9, size: 43.34479729, type: 'asks', exchange_id: '17575209257', source: 'Bitfinex' },
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
  { price: 6606.6, size: 0.232, type: 'asks', exchange_id: '17575304306', source: 'Bitfinex' },
  { price: 6606.7, size: 0.316, type: 'asks', exchange_id: '17575304082', source: 'Bitfinex' },
  { price: 6606.707052, size: 0.39786515, type: 'asks', exchange_id: '17575292232', source: 'Bitfinex' }] };
const addMessage = [[555994,[17575304700,6601.2,0.4]], [555994,[17575304675,6606.5,-1.2]]];
const expectedAddedOrders = { bids: [{ price: 6603.8, size: 0.997, type: 'bids', exchange_id: '17575217703', source: 'Bitfinex' },
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
asks: [{ price: 6603.9, size: 43.34479729, type: 'asks', exchange_id: '17575209257', source: 'Bitfinex' },
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
const checksumMessage = [555994,'cs',893248935];
const changeMessage = [555994, [17575292895, 6601.6, 0.5]];
const expectedChangedOrders = { bids: [{ price: 6603.8, size: 0.997, type: 'bids', exchange_id: '17575217703', source: 'Bitfinex' },
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
  { price: 6601.6, size: 0.5, type: 'bids', exchange_id: '17575292895', source: 'Bitfinex' },
  { price: 6600.5, size: 0.002, type: 'bids', exchange_id: '17574727994', source: 'Bitfinex' },
  { price: 6600.4, size: 0.29012194, type: 'bids', exchange_id: '17575099033', source: 'Bitfinex' },
  { price: 6600.4, size: 0.009427, type: 'bids', exchange_id: '17575125725', source: 'Bitfinex' },
  { price: 6600.4, size: 0.359459, type: 'bids', exchange_id: '17575152291', source: 'Bitfinex' },
  { price: 6600.4, size: 0.09570382, type: 'bids', exchange_id: '17575170484', source: 'Bitfinex' },
  { price: 6600.4, size: 0.02217699, type: 'bids', exchange_id: '17575194127', source: 'Bitfinex' }],
asks: [{ price: 6603.9, size: 43.34479729, type: 'asks', exchange_id: '17575209257', source: 'Bitfinex' },
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
const orderbookToExpand = { asks: { 6660: { exchange_orders: { 1: { size: 0.5 }, 2: { size: 1 } } },
  6601: { exchange_orders: { 3: { size: 0.25 } } } }, bids: { 6659: { exchange_orders: { 4: { size: 0.59 } } } } };
const expectedExpandedOrderbook = { asks: [{ id: '3', size: 0.25 }, { id: '1', size: 0.5 }, { id: '2', size: 1 }], bids: [{ id: '4', size: 0.59 }] };

sinon.stub(bitfinexOrderbook.orderbook_manager, 'notify_orderbook_changed').callsFake(() => console.log('orderbook changed') );
let firstAddStub = sinon.stub(bitfinexOrderbook.orderbook_manager, 'add_order').callsFake(newOrder => buildOrderbook[newOrder.type].push(newOrder));
sinon.stub(bitfinexOrderbook.orderbook_manager, 'delete_order').callsFake((order) => {
  let orderIndex = buildOrderbook[order.type].findIndex( record => order.exchange_id === record.exchange_id );
  if (orderIndex > -1 ) {
    buildOrderbook[order.type].splice(orderIndex, 1);
  }
});
sinon.stub(bitfinexOrderbook, 'reset_orderbook');
sinon.stub(bitfinexOrderbook.orderbook_manager, 'get_orderbook').callsFake(() => {
  return buildOrderbook;
});
const expandStub = sinon.stub(bitfinexOrderbook, 'expand_orderbook').callsFake((orderbook) => {
  let newOrderbook = { 'bids': [], 'asks': [] };
  const orderTypes = ['asks', 'bids'];
  for(let orderType of orderTypes) {
    for(let order of orderbook[orderType]) {
      newOrderbook[orderType].push({ id: order.exchange_id, size: order.size });
    }
  }
  return newOrderbook;
});
sinon.stub(bitfinexOrderbook.orderbook_manager, 'change_order').callsFake((order) => {
  const orderIndex = buildOrderbook[order.type].findIndex( record => order.exchange_id === record.exchange_id );
  buildOrderbook[order.type][orderIndex] = order;
});

bitfinexOrderbook.orderbookChannels[555994] = { pair: assetPair, snapshot_received: false, id_to_price: {}, active: true };

describe('Stub tests', () => {

  before(() => {
    console.log('Starting bitfinex_orderbook tests');
  });

  after(async () => {
    console.log('Finished bitfinex_orderbook tests');
  });

  describe('bitfinex_orderbook', () => {

    it('handle_data_message should build orderbook', () => {
      bitfinexOrderbook.handle_data_message(snapshotMessage);
      expect([buildOrderbook]).to.deep.equals([expectedSnapshotOrderbook]);
      firstAddStub.restore();
    });

    it('handle_data_message should delete messages', () => {
      for(let message of deleteMessage) {
        bitfinexOrderbook.handle_data_message(message);
      }
      expect([buildOrderbook]).to.deep.equals([expectedDeletedOrders]);
    });

    it('handle_data_message should add messages', () => {
      sinon.stub(bitfinexOrderbook.orderbook_manager, 'add_order').callsFake((newOrder) => {
        let lastOrderInPrice = _.findLast(buildOrderbook[newOrder.type], order => {
          return order.price === newOrder.price;
        });
        let index = -1;
        if (lastOrderInPrice) {
          index = buildOrderbook[newOrder.type].indexOf(lastOrderInPrice);
        }
        else {
          let lastOrder = _.findLast(buildOrderbook[newOrder.type], order => {
            if (newOrder.type === 'bids') {
              return order.price > newOrder.price;
            }
            else {
              return order.price < newOrder.price;
            }
          });
          if (lastOrder) {
            index = buildOrderbook[newOrder.type].indexOf(lastOrder);
          }
        }
        buildOrderbook[newOrder.type].splice(index + 1, 0, newOrder);
      } );
      for(let message of addMessage) {
        bitfinexOrderbook.handle_data_message(message);
      }
      expect(buildOrderbook).to.deep.equal(expectedAddedOrders);
    });

    it('handle_checksum_message should return true', () => {
      let checksumResult = bitfinexOrderbook.handle_checksum_message(checksumMessage);
      expect(checksumResult).to.be.true;
    });

    it('handle_data_message should change order', () => {
      bitfinexOrderbook.handle_data_message(changeMessage);
      expect(buildOrderbook).to.deep.equal(expectedChangedOrders);
    });

    it('handle_checksum_message should return false', () => {
      let checksumResult = bitfinexOrderbook.handle_checksum_message(checksumMessage);
      expect(checksumResult).to.be.false;
      expandStub.restore();
    });

    it('expand_orderbook should return orderbook that is not aggregated to price level', () => {
      const expandedOrderbook = bitfinexOrderbook.expand_orderbook(orderbookToExpand);
      expect(expandedOrderbook).to.deep.equal(expectedExpandedOrderbook);
    });
  });
});