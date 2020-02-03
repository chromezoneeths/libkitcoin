// This file contains low-level API functions to directly access endpoints.

function ping() { // Checks for an HTTP response at baseUrl/ping
 return new Promise( async resolve => {
  await fetch( `${cfg.baseUrl}/ping` ).then( ( res ) => {
   resolve( res.ok ); // Resolves if the request was successful
  } ).catch( () => {
   resolve( false ); // `fetch` rejects on network failure
  } );
 } );
}
exports.ping = ping;