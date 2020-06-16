declare module "@anonymousg/lavajs" {
  import { EventEmitter } from "events";
  import { Guild, VoiceChannel, TextChannel, User } from "discord.js";
  import WebSocket from "ws";

  export const version: string;

  export class LavaClient extends EventEmitter {
    constructor(client: any, node: NodeOptions[]);

    public readonly client: any;
    public readonly nodeOptions: NodeOptions[];
    public readonly shards: number;
    public readonly nodeCollection: Map<string, LavaNode>;
    public readonly playerCollection: Map<string, Player>;

    public on(
      event: "nodeSuccess" | "nodeReconnect",
      listener: (node: LavaNode) => void
    ): this;
    public on(
      event: "nodeError" | "nodeClose",
      listener: (node: LavaNode, message: any) => void
    ): this;
    public on(
      event: "playerCreate" | "playerDestroy",
      listener: (player: Player) => void
    ): this;
    public on(
      event: "trackPlay" | "trackOver",
      listener: (track: Track, player: Player) => void
    ): this;
    public on(
      event: "trackError" | "trackStuck",
      listener: (track: Track, player: Player, error: string) => void
    ): this;
    public on(event: "queueEnd", listener: (player: Player) => void): this;
  }

  export class LavaNode {
    constructor(lavaJS: LavaClient, options: NodeOptions);

    public readonly lavaJS: LavaClient;
    public readonly options: NodeOptions;
    public stats: NodeStats;
    public con: WebSocket;

    public get systemStats(): boolean;
    public get online(): boolean;

    public connect(): void;
    public reconnect(): void;
    public kill(): void;
    public wsSend(data: Object): Promise<boolean>;
  }

  export class Player {
    constructor(lavaJS: LavaClient, options: PlayerOptions, node?: LavaNode);

    public readonly lavaJS: LavaClient;
    public readonly options: PlayerOptions;
    public readonly node: LavaNode;
    public readonly queue: Queue;

    public playState: boolean;
    public position: number;
    public volume: number;
    public playPaused: boolean;
    public repeatTrack: boolean;
    public repeatQueue: boolean;
    public skipOnError: boolean;

    public get paused(): boolean;
    public get playing(): boolean;

    public play(): void;
    public lavaSearch(
      query: string,
      user: User,
      add: boolean
    ): Promise<Track[] | Playlist>;
    public stop(): void;
    public pause(): void;
    public resume(): void;
    public seek(position: number): void;
    public setVolume(volume?: number): void;
    public destroy(): void;
  }

  export class Queue extends Array {
    constructor(player: Player);

    public readonly player: Player;

    public get size(): number;
    public get duration(): number;
    public get empty(): boolean;

    public add(data: Track | Track[]): void;
    public remove(pos: number): Track | null;
    public wipe(start: number, end: number): Track[];
    public clear(): void;
  }

  export class Utils {
    public static newTrack(data: any, user: User): Track;
    public static newPlaylist(data: any, user: User): Playlist;
  }

  export interface Track {
    readonly trackString: string;
    readonly title: string;
    readonly identifier: string;
    readonly author: string;
    readonly length: number;
    readonly isStream: boolean;
    readonly uri: string;
    readonly user: User;
    readonly thumbnail: {
      readonly default: string;
      readonly medium: string;
      readonly high: string;
      readonly standard: string;
      readonly max: string;
    };
  }

  export interface Playlist {
    readonly name: string;
    readonly trackCount: number;
    readonly duration: number;
    readonly tracks: Array<Track>;
  }

  export interface NodeOptions {
    readonly host: string;
    readonly port: number;
    readonly password: string;
  }

  export interface PlayerOptions {
    readonly guild: Guild;
    readonly voiceChannel: VoiceChannel;
    readonly textChannel: TextChannel;
    readonly deafen?: boolean;
    readonly trackRepeat?: boolean;
    readonly queueRepeat?: boolean;
    readonly skipOnError?: boolean;
  }

  export interface NodeStats {
    readonly playingPlayers: number;
    readonly memory: {
      readonly reservable: number;
      readonly used: number;
      readonly free: number;
      readonly allocated: number;
    };
    readonly players: number;
    readonly cpu: {
      readonly cores: number;
      readonly systemLoad: number;
      readonly lavalinkLoad: number;
    };
    readonly uptime: number;
  }
}
