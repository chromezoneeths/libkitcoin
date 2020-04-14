import Socket from 'simple-websocket';
let ws: Socket;

interface Secret {
	get(): Promise<string|false>;
	set(tgt: string): void;
}

export async function prepare(url: string, secret: Secret, cb: () => void) {
	ws = new Socket(url);

	ws.on('message', (data: string) => {
		const res = JSON.parse(data);
		if (res.action === 'ping') {
			ws.send(JSON.stringify({
				action: 'pong'
			}));
		}
	});

	ws.once('open', async () => {
		if (await secret.get()) {
			ws.send(JSON.stringify({
				action: 'secret',
				secret: await secret.get()
			}));
		} else {
			ws.send(JSON.stringify({
				action: 'google'
			}));
		}
	});

	function respondToMessage(data: string) {
		const res = JSON.parse(data);
		if (res.action === 'secret') {
			if (res.result) {
				cb();
			}
		} else if (res.action === 'login') {
			if (process) {
				const open = require('open');
				open(res.url);
			} else {
				window.open(res.url);
				ws.once('message', onResponse);
			}
		} else {
			ws.once('data', respondToMessage);
		}

		function onResponse(data: string) {
			const res = JSON.parse(data);
			if (res.action === 'ready') {
				cb();
			} else {
				ws.once('message', onResponse);
			}
		}
	}

	ws.once('data', respondToMessage);
}

export async function balance(): Promise<number> {
	ws.send(JSON.stringify({
		action: 'getBalance'
	}));
	return (await action('balance')).balance;
}

export async function send(target: string, amount: number): Promise<any> {
	ws.send(JSON.stringify({
		action: 'sendCoin',
		target,
		amount
	}));
	return action('sendResponse');
}

export async function mint(amount: number) {
	ws.send(JSON.stringify({
		action: 'mintCoin',
		amount
	}));
	return action('mintResponse');
}

export async function destroy(amount: number) {
	// TypeScript reserves void
	ws.send(JSON.stringify({
		action: 'voidCoin',
		amount
	}));
	return action('voidResponse');
}

export async function getClasses() {
	ws.send(JSON.stringify({
		action: 'getClasses'
	}));
	return action('getClassesResponse');
}

export async function students(course: string) {
	ws.send(JSON.stringify({
		action: 'getStudents',
		course
	}));
	return action('getStudentsResponse');
}

export async function admin(procedure: string, body: string) {
	ws.send(JSON.stringify({
		action: 'elevate',
		procedure,
		body
	}));
	return action('elevateResult');
}

async function action(name: string): Promise<any> {
	// Helper function for known responses
	return new Promise(resolve => {
		ws.once('message', h);
		function h(data: string) {
			const res = JSON.parse(data);
			if (res.action === name) {
				resolve(res);
			} else {
				ws.once('message', h);
			}
		}
	});
}
