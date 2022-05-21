import { IVoiceServerUpdateEvent } from "./payload";

export interface IDiscordVoiceStateUpdatePacket {
	op: 4;
	d: {
		guild_id: `${bigint}`;
		channel_id: `${bigint}` | null;
		self_mute: boolean;
		self_deaf: boolean;
	};
}

export interface IDiscordVoiceResumePacket {
	op: 7;
	d: {
		server_id: `${bigint}`;
		session_id: string;
		token: string;
	};
}

export interface IDiscordVoiceEvent {
	t: "VOICE_SERVER_UPDATE" | "VOICE_STATE_UPDATE";
	d: (
		| {
				user_id: `${bigint}`;
				channel_id: `${bigint}` | null;
				session_id: string;
		  }
		| IVoiceServerUpdateEvent
	) & { guild_id: `${bigint}` };
}

export type DiscordWsSend = (
	guildId: `${bigint}`,
	payload: IDiscordVoiceStateUpdatePacket | IDiscordVoiceResumePacket
) => Promise<void>;

export interface ILavalinkClientOptions {
	botId: `${bigint}`;
	send: DiscordWsSend;
}
