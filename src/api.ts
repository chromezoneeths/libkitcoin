import { persist } from "./entry";

// This file contains low-level API functions to directly access endpoints.

let sock: WebSocket, id: String;

export let onoauth: Function; // Runs with the server's OAuth URL when it asks.

function ping() { // Checks for an HTTP response at baseUrl/ping
 return new Promise( async resolve => {
  await fetch( `${cfg.baseUrl}/ping` ).then( ( res ) => {
   resolve( res.ok ); // Resolves if the request was successful
  } ).catch( () => {
   resolve( false ); // `fetch` rejects on network failure
  } );
 } );
}
function connect() {
 return new Promise( ( resolve, reject ) => {
  sock = new WebSocket( cfg.baseUrl );
  prepareSock( sock );
 } );
}
exports.ping = ping;

// Internal functions follow

function prepareSock( sock: WebSocket ) {
 sock.onopen = () => {
  console.log( "Successfully connected!" );
 };
 sock.onmessage = async ( dt ) => {
  var d = JSON.parse( dt.data );
  // d contains at least "channel" for sorting
  switch ( d.channel ) {
   case 'id': { // Server asks us for our ID and provides one for us if we don't have one.
    if ( persist.id ) { // We have an ID, send it to the server.
     id = persist.id;
     sock.send( JSON.stringify( { // Tell the server we already have a session, it will check if it's still valid. It'll proceed as if we don't have one otherwise.
      channel: 'id',
      id: persist.id
     } ) );
    } else { // We don't have an ID, keep the server's.
     id = d.id;
     persist.id = d.id;
     sock.send( JSON.stringify( { // Tell the server we don't have a session so it doesn't waste time checking anything.
      channel: 'id',
      id: false
     } ) );
    }
   }
   case 'oauth': { // Server wants us to open an OAuth URL.
    onoauth( d.url );
   }
   default: {
    console.error( `Unknown message channel ${d.channel}` );
   }
  }
 };
}