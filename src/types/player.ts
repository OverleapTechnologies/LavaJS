export interface IPlayerOptions {
	guildId: `${bigint}`;
	channelId: `${bigint}`;
	queueOptions?: IPlayerQueueOptions;
	volume?: number;
	deafen?: boolean;
	handleTrackEnd?: (event: Required<Omit<IPlayerEvent, "code">>) => void;
}

export interface IPlayerQueueOptions {
	repeatMode: QueueRepeatMode;
	preserve: boolean;
}

export interface IPlayerInstanceState {
	lastUpdated: number;
	position: number;
	connected: boolean;
	volume: number;
	queueRepeatMode: QueueRepeatMode;
	queuePreserve: boolean;
	deafen: boolean;
}

export interface IPlayerTrackState {
	paused: boolean;
	trackLoaded: boolean;
	trackStartedAt: number;
	currentTrackIndex: number;
}

export type PlayerEventTypes =
	| "TrackStartEvent"
	| "TrackEndEvent"
	| "TrackExceptionEvent"
	| "TrackStuckEvent"
	| "WebSocketClosedEvent";

export interface IPlayerUpdateEvent {
	op: "playerUpdate";
	guildId: `${bigint}`;
	state: {
		time: number;
		position: number;
		connected: boolean;
	};
}

export interface IPlayerEvent {
	op: "event";
	type: PlayerEventTypes;
	guildId: `${bigint}`;
	track: string;
	reason?: TrackEndReason;
	code?: number;
}

export type TrackEndReason =
	| "FINISHED"
	| "LOAD_FAILED"
	| "STOPPED"
	| "REPLACED"
	| "CLEANUP";

export enum QueueRepeatMode {
	OFF = 0,
	TRACK = 1,
	QUEUE = 2,
}
