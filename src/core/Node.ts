import { EventEmitter } from "events";
import Websocket from "ws";
import { setTimeout } from "timers/promises";

import { Client } from "./Client";
import {
	IConnectionInfo,
	ILavalinkServerStats,
	NodeStatus,
} from "../types/node";
import { IVoiceUpdatePayload, Payload } from "../types/payload";
import { Player } from "../components/Player";

const pjson = require("../../package.json");

const _ws = Symbol("Node#_ws");
const _payloadQueue = Symbol("Node#_payloadQueue");

export class Node extends EventEmitter {
	private [_ws]: null | Websocket = null;
	private [_payloadQueue]: Payload[] = [];

	private _wsState = {
		reconnectAttempts: 0,
		connectedTimestamp: -1,
		status: NodeStatus.DISCONNECTED as NodeStatus,
	};
	private _serverStats: Partial<ILavalinkServerStats> = {};

	public readonly players = new Map<`${bigint}`, Player>();

	constructor(
		public readonly client: Client,
		public readonly info: IConnectionInfo
	) {
		super();

		this.info.reconnect = this.info.reconnect ?? { limit: 5, interval: 5000 };
		this.info.secure = this.info.secure ?? false;

		// Make the info object immutable
		Object.freeze(this.info);
	}

	public get status(): NodeStatus {
		return this._wsState.status;
	}

	public get isOnline(): boolean {
		return this[_ws] !== null && this._wsState.status === NodeStatus.CONNECTED;
	}

	public get uptime(): number {
		return !this.isOnline || this._wsState.connectedTimestamp < 0
			? -1
			: Date.now() - this._wsState.connectedTimestamp;
	}

	public get serverStats(): ILavalinkServerStats {
		return this._serverStats as ILavalinkServerStats;
	}

	_init() {
		const headers = {
			Authorization: this.info.password,
			"User-Id": this.client.id,
			"Client-Name": `${pjson.name}/${pjson.version}`,
		};
		const protocol = this.info.secure ? "wss" : "ws";
		const uri = `${protocol}://${this.info.host}:${this.info.port}`;

		this.client.emit(
			"debug",
			`Trying to establish websocket connection to ${uri}...`
		);

		const ws = (this[_ws] = new Websocket(uri, {
			headers,
		}));

		// Listeners
		ws.onopen = this._onOpen.bind(this);
		ws.onclose = this._onClose.bind(this);
		ws.onerror = this._onError.bind(this);
		ws.onmessage = this._onMessage.bind(this);

		// Handle voice update from main client
		this.client.on("voiceUpdate", this._sendVoiceUpdate.bind(this));
	}

	// Handler implementations

	private async _onOpen(this: Node) {
		this._wsState.status = NodeStatus.CONNECTED;
		this._wsState.reconnectAttempts = 0;
		this._wsState.connectedTimestamp = Date.now();

		this.client.emit(
			"debug",
			`Connected, but preparing to send ${this[_payloadQueue].length} payloads first...`
		);

		await Promise.all(
			this[_payloadQueue].map((p) =>
				this.send(p).catch((e) =>
					this.emit(
						"error",
						this,
						new Error(`Node: Failed to send payload. Payload: ${p}\n${e}`)
					)
				)
			)
		);
		this[_payloadQueue] = [];

		this.emit("connect", this);
	}

	private _onClose(this: Node, { code, reason }: Websocket.CloseEvent) {
		if (code === 1000) {
			this._wsState.status = NodeStatus.DISCONNECTED;
			this[_ws] = null;
			this[_payloadQueue] = [];
		} else if (this.status !== NodeStatus.RECONNECTING) this.reconnect();

		this.emit("disconnect", this, code, reason);
	}

	private _onError(this: Node, event: Websocket.ErrorEvent) {
		if (this.status !== NodeStatus.RECONNECTING) this.reconnect();
		this.emit("error", this, event.error);
	}

	private _onMessage(this: Node, { data }: Websocket.MessageEvent) {
		const payload = JSON.parse(data.toString());

		this.client.emit("debug", `Received payload: ${payload}`);

		if (payload.op === "stats") {
			delete payload.op;
			Object.assign(this._serverStats, {
				frameStats: { deficit: -1, nulled: -1, sent: -1 },
				...payload,
			});
		} else {
			const player = this.players.get(payload.guildId);
			if (!player && payload.state && payload.state.connected)
				this.send({
					op: "destroy",
					guildId: payload.guildId,
				}).catch(console.error);
			else if (player) player._handleEvent(payload);
		}
	}

	private _sendVoiceUpdate(payload: IVoiceUpdatePayload) {
		const player = this.players.get(payload.guildId);
		if (!player) return;

		player._setVoiceResumeData({
			server_id: payload.guildId,
			session_id: payload.sessionId,
			token: payload.event.token,
		});

		if (!payload.channelId) this.players.delete(payload.guildId);
		else player.channelId = payload.channelId;

		this.send(payload).catch(console.error);
	}

	// Public methods

	public get load() {
		return this.serverStats;
	}

	public async reconnect() {
		if (this.isOnline) return;

		this._wsState.status = NodeStatus.RECONNECTING;

		while (!this.isOnline) {
			if (
				this._wsState.reconnectAttempts >= (this.info.reconnect?.limit ?? 5)
			) {
				this._wsState.status = NodeStatus.DISCONNECTED;
				this.emit(
					"error",
					this,
					new Error(
						`Node: Failed to reconnect after ${this._wsState.reconnectAttempts} attempts`
					)
				);
				return;
			}

			this.emit("reconnect", this, this._wsState.reconnectAttempts + 1);

			this[_ws] = null;
			this._init();
			this._wsState.reconnectAttempts++;

			// Wait for the next attempt
			await setTimeout(this.info.reconnect?.interval);
		}
	}

	public destroy(reason: string) {
		if (!this.isOnline || this[_ws] === null) return;
		this[_ws]?.close(1000, reason);
	}

	public send(data: Payload): Promise<boolean> {
		return new Promise((resolve, reject) => {
			if (!this.isOnline) {
				this[_payloadQueue].push(data);
				resolve(false);
			}

			const payload = JSON.stringify(data);
			if (!payload.startsWith("{")) reject("Payload was not an object");

			this[_ws]?.send(payload, (err) => (err ? reject(err) : resolve(true)));
		});
	}
}

export interface Node {
	on(event: "connect", handler: (node: Node) => void): this;
	on(
		event: "disconnect",
		handler: (node: Node, code: number, reason: string) => void
	): this;
	on(event: "reconnect", handler: (node: Node, attempt: number) => void): this;
	on(event: "error", handler: (node: Node, error: Error) => void): this;
}
