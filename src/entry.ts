import Socket from 'simple-websocket';
let ws: Socket;
let debugMessages = false;

interface Secret {
	get(): Promise<string | false>;
	set( tgt: string ): void;
}

export async function prepare( url: string, secret: Secret, cb: () => void, debug: boolean ) {
	debugMessages = debug;
	dlog( 'Opening socket...' );
	ws = new Socket( url );

	ws.on( 'data', ( data: string ) => {
		const response = JSON.parse( data );
		if ( response.action === 'ping' ) {
			ws.send( JSON.stringify( {
				action: 'pong'
			} ) );
		}
	} );

	ws.once( 'connect', async () => {
		dlog( 'Socket open.' );
		if ( await secret.get() !== '' ) {
			dlog( 'Sending secret...' );
			ws.send( JSON.stringify( {
				action: 'secret',
				secret: await secret.get()
			} ) );
		} else {
			dlog( 'Asking for Google' );
			ws.send( JSON.stringify( {
				action: 'google'
			} ) );
		}
	} );

	function respondToMessage( data: string ) {
		dlog( 'Got message!' );
		const response = JSON.parse( data );
		dlog( response );
		if ( response.action === 'secret' ) {
			dlog( 'Got secret message!' );
			if ( response.result ) {
				dlog( 'Login success!' );
				cb();
			} else {
				dlog( 'Secret failed, asking for Google' );
				secret.set( '' );
				ws.once( 'data', respondToMessage );
				ws.send( JSON.stringify( {
					action: 'google'
				} ) );
			}
		} else if ( response.action === 'login' ) {
			dlog( 'Got Google message' );
			ws.once( 'data', onResponse );
			if ( process ) {
				const open = require( 'open' );
				open( response.url );
			} else {
				window.open( response.url );
			}
		} else {
			dlog( 'Unrelated...' );
			ws.once( 'data', respondToMessage );
		}

		function onResponse( data: string ) {
			const response = JSON.parse( data );
			dlog( response );
			if ( response.action === 'ready' ) {
				cb();
			} else {
				ws.once( 'data', onResponse );
			}
		}
	}

	ws.once( 'data', respondToMessage );
}

export async function balance(): Promise<number> {
	ws.send( JSON.stringify( {
		action: 'getBalance'
	} ) );
	return ( await action( 'balance' ) ).balance;
}

export async function send( target: string, amount: number ): Promise<any> {
	ws.send( JSON.stringify( {
		action: 'sendCoin',
		target,
		amount
	} ) );
	return action( 'sendResponse' );
}

export async function mint( amount: number ) {
	ws.send( JSON.stringify( {
		action: 'mintCoin',
		amount
	} ) );
	return action( 'mintResponse' );
}

export async function destroy( amount: number ) {
	// TypeScript reserves void
	ws.send( JSON.stringify( {
		action: 'voidCoin',
		amount
	} ) );
	return action( 'voidResponse' );
}

export async function getClasses() {
	ws.send( JSON.stringify( {
		action: 'getClasses'
	} ) );
	return action( 'getClassesResponse' );
}

export async function students( course: string ) {
	ws.send( JSON.stringify( {
		action: 'getStudents',
		course
	} ) );
	return action( 'getStudentsResponse' );
}

export async function secret() { // Gets a new secret from the server.
	ws.send( JSON.stringify( {
		action: 'secret'
	} ) );
	return ( await action( 'secret' ) ).secret;
}

export async function admin( procedure: string, body: string ) {
	ws.send( JSON.stringify( {
		action: 'elevate',
		procedure,
		body
	} ) );
	return action( 'elevateResult' );
}

async function action( name: string ): Promise<any> {
	// Helper function for known responses
	return new Promise( resolve => {
		ws.once( 'data', h );
		function h( data: string ) {
			const response = JSON.parse( data );
			if ( response.action === name ) {
				resolve( response );
			} else {
				ws.once( 'data', h );
			}
		}
	} );
}

function dlog( message ) {
	if ( debugMessages ) {
		console.log( message );
	}
}
