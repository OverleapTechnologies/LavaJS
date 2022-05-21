export interface IConnectionInfo {
	host: string;
	port: number;
	password: string;
	secure?: boolean;
	reconnect?: { limit: number; interval: number };
}

export interface ILavalinkServerStats {
	players: number;
	playingPlayers: number;
	uptime: number;
	memory: ILavalinkServerMemoryStats;
	cpu: ILavalinkServerCPUStats;
	frameStats?: ILavalinkServerFrameStats;
}

export interface ILavalinkServerMemoryStats {
	free: number;
	used: number;
	allocated: number;
	reservable: number;
}

export interface ILavalinkServerCPUStats {
	cores: number;
	systemLoad: number;
	lavalinkLoad: number;
}

export interface ILavalinkServerFrameStats {
	sent: number;
	nulled: number;
	deficit: number;
}

export enum NodeStatus {
	DISCONNECTED = 0,
	CONNECTING = 1,
	RECONNECTING = 2,
	CONNECTED = 3,
}
