import { IFiltersPayload } from "./filters";

export type OPCodes =
	| "voiceUpdate"
	| "play"
	| "stop"
	| "pause"
	| "seek"
	| "volume"
	| "filters"
	| "destroy";

export interface IBasePayload<T extends OPCodes> {
	op: T;
	guildId: `${bigint}`;
}

export interface IVoiceServerUpdateEvent {
	token: string;
	endpoint: string;
}

export interface IVoiceUpdatePayload extends IBasePayload<"voiceUpdate"> {
	sessionId: string;
	channelId: `${bigint}` | null;
	event: IVoiceServerUpdateEvent;
}

export interface IPlayPayload extends IBasePayload<"play"> {
	track: string;
	startTime?: number;
	endTime?: number;
	volume?: number;
	noReplace?: boolean;
	pause?: boolean;
}

export type IPausePayload = IBasePayload<"pause"> &
	Required<Pick<IPlayPayload, "pause">>;

export interface ISeekPayload extends IBasePayload<"seek"> {
	position: number;
}

export type IVolumePayload = IBasePayload<"volume"> &
	Required<Pick<IPlayPayload, "volume">>;

export type Payload =
	| IVoiceUpdatePayload
	| IPlayPayload
	| IBasePayload<"stop">
	| IPausePayload
	| ISeekPayload
	| IVolumePayload
	| (IBasePayload<"filters"> & IFiltersPayload)
	| IBasePayload<"destroy">;

export type PlayerPayload =
	| Omit<IPlayPayload, "guildId">
	| Omit<IBasePayload<"stop">, "guildId">
	| Omit<IPausePayload, "guildId">
	| Omit<ISeekPayload, "guildId">
	| Omit<IVolumePayload, "guildId">
	| Omit<IBasePayload<"destroy">, "guildId">;
