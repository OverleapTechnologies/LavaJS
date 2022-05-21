import { Track } from "../components/Track";

export interface IRestNode {
	uri: string;
	auth: string;
}

export interface IRestLoadTrackLavalinkResponse {
	loadType: LoadType;
	playlistInfo: Partial<IPlaylistInfo>;
	tracks: { track: string }[];
	exception?: { message: string; severity: string };
}

export interface IRestLoadTrackResponse {
	tracks: Track[];
	playlist?: string;
}

export interface IPlaylistInfo {
	name: string;
	selectedTrack: number;
}

export type LoadType =
	| "TRACK_LOADED"
	| "PLAYLIST_LOADED"
	| "SEARCH_RESULT"
	| "NO_MATCHES"
	| "LOAD_FAILED";
