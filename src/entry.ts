// This file is the entrypoint.
const api = require( './api' );
const helpers = require( './helpers' );
const cfg = require( '../config' );
// Require libraries to standardize ws and fetch
const ws = require( 'isomorphic-ws' );
const rq = require( 'isomorphic-fetch' );
export let persist; // You can save this and re-set it later for persistance

exports = helpers;
exports.api = api;
