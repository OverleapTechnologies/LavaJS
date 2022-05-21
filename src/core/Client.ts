import EventEmitter from "events";
import { Player } from "../components/Player";
import { Track } from "../components/Track";
import {
	DiscordWsSend,
	IDiscordVoiceEvent,
	ILavalinkClientOptions,
} from "../types/client";
import { IConnectionInfo } from "../types/node";
import { IVoiceUpdatePayload } from "../types/payload";
import { IPlayerOptions } from "../types/player";
import { NodeInfoBuilder } from "../utils/NodeInfoBuilder";
import { Node } from "./Node";
import { Rest } from "./rest/Rest";

const _voiceStates = Symbol("Client#_voiceStates");

export class Client extends EventEmitter {
	private [_voiceStates]: Map<string, Partial<IVoiceUpdatePayload>> = new Map();

	readonly _gatewaySend: DiscordWsSend;

	public readonly id: string;
	public readonly rest: Rest;
	public readonly nodes: Node[];

	constructor(
		options: ILavalinkClientOptions,
		nodes: (IConnectionInfo | NodeInfoBuilder)[],
		restNodes?: (IConnectionInfo | NodeInfoBuilder)[]
	) {
		super();
		this.id = options.botId;
		this._gatewaySend = options.send;
		this.nodes = [
			...new Set(
				nodes.map(
					(node) =>
						new Node(
							this,
							node instanceof NodeInfoBuilder ? node.build() : node
						)
				)
			).values(),
		];
		this.rest = new Rest(
			restNodes
				? restNodes.map((x) => (x instanceof NodeInfoBuilder ? x.build() : x))
				: nodes.map((x) => (x instanceof NodeInfoBuilder ? x.build() : x))
		);
	}

	public getPlayer(guildId: `${bigint}`) {
		return this.nodes.find((x) => x.players.has(guildId))?.players.get(guildId);
	}

	public connectAll() {
		for (const node of this.nodes) node._init();
	}

	public createPlayer(options: IPlayerOptions) {
		let player = this.getPlayer(options.guildId);
		if (!player) {
			const assignedNode =
				this.nodes[
					Math.abs((parseInt(options.guildId) >> 22) % this.nodes.length)
				];
			assignedNode.players.set(
				options.guildId,
				(player = new Player(assignedNode, options))
			);
		}
		return player;
	}

	public sendVoiceUpdate(payload: IDiscordVoiceEvent) {
		if (!payload.d || !payload.t) return;
		if ("user_id" in payload.d && payload.d.user_id !== this.id) return;

		const { d } = payload;

		let stateObj = this[_voiceStates].get(d.guild_id) ?? {
			op: "voiceUpdate",
		};

		if ("channel_id" in d) {
			const { channel_id: channelId, session_id: sessionId } = d;
			stateObj = {
				...stateObj,
				channelId,
				sessionId,
			};
		} else {
			const { guild_id: guildId, ...event } = d;
			stateObj = {
				...stateObj,
				guildId,
				event,
			};
		}

		this[_voiceStates].set(d.guild_id, stateObj);

		if (
			stateObj.op &&
			stateObj.guildId &&
			stateObj.sessionId &&
			stateObj.event
		) {
			this[_voiceStates].delete(stateObj.guildId);
			this.emit("voiceUpdate", stateObj);
		}
	}
}

export interface Client {
	on(
		event: "voiceUpdate",
		listener: (stateObj: IVoiceUpdatePayload) => void
	): this;
	on(event: "trackStart", listener: (player: Player) => void): this;
	on(event: "trackEnd", listener: (player: Player, track: Track) => void): this;
	on(
		event: "trackStuck",
		listener: (
			player: Player,
			track: Track,
			payload: Record<string, unknown>
		) => void
	): this;
	on(
		event: "trackException",
		listener: (
			player: Player,
			track: Track,
			payload: Record<string, unknown>
		) => void
	): this;
	on(event: "queueEnd", listener: (player: Player) => void): this;
	on(
		event: "socketClosed",
		listener: (player: Player, code: number, message?: string) => void
	): this;
}
