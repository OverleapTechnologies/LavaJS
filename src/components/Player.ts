import { Node } from "../core/Node";
import { IDiscordVoiceResumePacket } from "../types/client";
import {
	IPlayerOptions,
	IPlayerInstanceState,
	IPlayerTrackState,
	IPlayerEvent,
	IPlayerUpdateEvent,
	QueueRepeatMode,
} from "../types/player";
import { IPlayPayload, PlayerPayload } from "../types/payload";
import { Track } from "./Track";
import { FiltersManager } from "../utils/FiltersManager";

const _voiceResumeData = Symbol("Player#_voiceResumeData");

export class Player {
	private [_voiceResumeData]: IDiscordVoiceResumePacket;

	private _instanceState: IPlayerInstanceState;
	private _trackState: IPlayerTrackState = Object.freeze({
		paused: false,
		trackLoaded: false,
		trackStartedAt: -1,
		currentTrackIndex: -1,
	});
	public readonly _tracks: Track[] = [];

	public readonly filtersManager: FiltersManager;
	public readonly guildId: `${bigint}`;
	public channelId: `${bigint}`;

	constructor(public readonly node: Node, options: IPlayerOptions) {
		this.channelId = options.channelId;

		if (options.volume && (options.volume < 0 || options.volume > 500))
			console.warn(
				"Player: Invalid volume in options. Using default value instead"
			);

		this.guildId = options.guildId;
		this._handleEvent = options.handleTrackEnd
			? options.handleTrackEnd.bind(this)
			: this._handleEvent.bind(this);

		this[_voiceResumeData] = {
			op: 7,
			d: {
				server_id: this.guildId,
				session_id: "",
				token: "",
			},
		};

		const queueOptions = {
			repeatMode: QueueRepeatMode.OFF,
			preserve: false,
			...(options.queueOptions || {}),
		};

		this._instanceState = Object.freeze({
			lastUpdated: -1,
			position: -1,
			connected: false,
			queueRepeatMode: queueOptions.repeatMode,
			queuePreserve: queueOptions.preserve,
			volume:
				options.volume && options.volume >= 0 && options.volume <= 500
					? options.volume
					: 100,
			deafen: options.deafen || true,
		});

		this.filtersManager = new FiltersManager(this, {
			volume: this._instanceState.volume / 100,
		});

		// Establish the websocket connection
		this.node.client
			._gatewaySend(this.guildId, {
				op: 4,
				d: {
					channel_id: this.channelId,
					guild_id: this.guildId,
					self_deaf: this._instanceState.deafen,
					self_mute: false,
				},
			})
			.catch(console.error);
	}

	public get isConnected() {
		return this._instanceState.connected;
	}

	public get playing() {
		return this._trackState.trackLoaded;
	}

	public get volume() {
		return this._instanceState.volume;
	}

	public get paused() {
		return this._trackState.paused;
	}

	public get position() {
		return this._instanceState.position;
	}

	public get queueRepeatMode() {
		return this._instanceState.queueRepeatMode;
	}

	public get queuePreserveEnabled() {
		return this._instanceState.queuePreserve;
	}

	public get tracks() {
		return this._tracks.slice();
	}

	public get currTrack() {
		return this.getTrack(this._trackState.currentTrackIndex);
	}

	public setQueueRepeatMode(queueRepeatMode: QueueRepeatMode) {
		this._instanceState = Object.freeze({
			...this._instanceState,
			queueRepeatMode,
		});
	}

	public play(track: Track, options: Partial<IPlayPayload> = {}) {
		return this._send({
			op: "play",
			track: track.encoded,
			volume: this.volume,
			...options,
		});
	}

	public stop() {
		return this._send({ op: "stop" });
	}

	public pause() {
		this._trackState = Object.freeze({
			...this._trackState,
			paused: !this._trackState.paused,
		});
		return this._send({ op: "pause", pause: this._trackState.paused });
	}

	public seek(position: number) {
		const currentTrack = this.getTrack(this._trackState.currentTrackIndex);

		if (!currentTrack || !this.playing)
			throw new Error("Player#seek: No track loaded");
		if (position < 0 || position > currentTrack.trackLength)
			throw new RangeError(
				`Player#seek: Position out of range. Must be in between 0 and ${currentTrack.trackLength}`
			);

		this._instanceState = Object.freeze({ ...this._instanceState, position });
		return this._send({ op: "seek", position });
	}

	public setVolume(volume = 100) {
		if (volume < 0 || volume > 500)
			throw new RangeError(
				"Player#setVolume: Volume must be between 100 and 500"
			);
		this._instanceState = Object.freeze({
			...this._instanceState,
			volume,
		});
		return this.filtersManager.updateFilters();
	}

	public async destroy() {
		this.node.players.delete(this.guildId);
		await this.node.client._gatewaySend(this.guildId, {
			op: 4,
			d: {
				guild_id: this.guildId,
				channel_id: null,
				self_deaf: false,
				self_mute: false,
			},
		});
		await this._send({ op: "destroy" });
	}

	private _send(payload: PlayerPayload) {
		return this.node.send({
			...payload,
			guildId: this.guildId,
		});
	}

	private _handleTrackEnd(event: Required<Omit<IPlayerEvent, "code">>) {
		if (
			this.queueRepeatMode !== QueueRepeatMode.TRACK &&
			this._trackState.currentTrackIndex + 1 === this.queueLength
		) {
			this.node.client.emit("queueEnd", this);
			return;
		}

		const track = this.getTrack(
			this._trackState.currentTrackIndex +
				+(this.queueRepeatMode !== QueueRepeatMode.TRACK)
		);

		if (
			(this.queueRepeatMode === QueueRepeatMode.OFF ||
				event.reason === "REPLACED") &&
			!this.queuePreserveEnabled
		)
			this.removeTrack(this._trackState.currentTrackIndex);
		else if (this.queueRepeatMode === QueueRepeatMode.QUEUE) {
			const oldTrack = this.removeTrack(this._trackState.currentTrackIndex);
			if (oldTrack) this.addTrack(oldTrack);
		}

		if (track && !["STOPPED", "CLEANUP", "REPLACED"].includes(event.reason))
			this.play(track).catch(console.error);
	}

	_setVoiceResumeData(d: IDiscordVoiceResumePacket["d"]) {
		this[_voiceResumeData] = { op: 7, d };
	}

	_handleEvent(payload: IPlayerEvent | IPlayerUpdateEvent) {
		const client = this.node.client;

		if (payload.op === "playerUpdate")
			this._instanceState = Object.freeze({
				...this._instanceState,
				lastUpdated: payload.state.time,
				connected: payload.state.connected,
				position: payload.state.position || -1,
			});
		else {
			switch (payload.type) {
				case "TrackStartEvent":
					this._trackState = Object.freeze({
						...this._trackState,
						trackLoaded: true,
						trackStartedAt: Date.now(),
						currentTrackIndex: this.getTrackIndex(payload.track),
					});
					client.emit("trackStart", this);
					break;
				case "TrackEndEvent":
					this._trackState = {
						...this._trackState,
						trackLoaded: false,
					};
					this._handleTrackEnd({ reason: "FINISHED", ...payload });
					client.emit("trackEnd", this, new Track(payload.track));
					break;
				case "WebSocketClosedEvent":
					if ([4006, 4009].includes(payload.code || 0))
						client
							._gatewaySend(payload.guildId, {
								op: 4,
								d: {
									guild_id: payload.guildId,
									channel_id: this.channelId,
									self_mute: false,
									self_deaf: this._instanceState.deafen,
								},
							})
							.catch(console.error);
					else if (payload.code === 4015)
						client
							._gatewaySend(payload.guildId, this[_voiceResumeData])
							.catch(console.error);
					client.emit(
						"socketClosed",
						this,
						payload.code,
						[4006, 4009, 4015].includes(payload.code || 0)
							? payload.code === 4015
								? "Trying to resume voice connection with Discord"
								: "Re-establishing voice connection with Discord"
							: undefined
					);
					break;
				default:
					client.emit(
						`${payload.type[0].toLowerCase()}${payload.type.slice(1, -5)}`,
						this.getTrack(),
						this,
						payload
					);
					break;
			}
		}
	}

	/**
	 * Queue Methods
	 */

	public get queueLength() {
		return this._tracks.length;
	}

	public getTrack(trackIndex = 0): Track | undefined {
		return this._tracks[trackIndex];
	}

	public getTrackIndex(track: Track | string) {
		return typeof track === "string"
			? this._tracks.findIndex((x) => x.encoded === track)
			: this._tracks.indexOf(track);
	}

	public removeTrack(track: number | Track) {
		const trackExists =
			typeof track === "number"
				? track >= 0 && track < this._tracks.length
				: this._tracks.includes(track);
		if (!trackExists) return;

		const index = typeof track === "number" ? track : this.getTrackIndex(track);
		return this._tracks.splice(index, 1)[0];
	}

	public addTrack(track: Track, position = -1) {
		position === 0
			? this._tracks.unshift(track)
			: position > 0
			? this._tracks.splice(position, 0, track)
			: this._tracks.push(track);
	}

	public shuffleQueue() {
		for (let i = this._tracks.length; i > 0; i--) {
			const curr = this._tracks[i - 1];
			const ranIndex = Math.floor(Math.random() * i);
			this._tracks[i - 1] = this._tracks[ranIndex];
			this._tracks[ranIndex] = curr;
		}
		return this._tracks;
	}

	public clearQueue() {
		return this._tracks.splice(0);
	}
}
