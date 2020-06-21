import { Guild, VoiceChannel, TextChannel, User } from "discord.js";

/**
 * The track interface
 */
export interface Track {
  /**
   * The 64-bit encoded track
   */
  trackString: string;
  /**
   * Title of the song
   */
  title: string;
  /**
   * The youtube ID of the song
   */
  identifier: string;
  /**
   * The channel name of the song
   */
  author: string;
  /**
   * Duration of the song
   */
  length: number;
  /**
   * Whether the song is a stream
   */
  isStream: boolean;
  /**
   * The link of the video
   */
  uri: string;
  /**
   * Discord user who requested the song
   */
  user: User;
  /**
   * The thumbnails of the youtube video
   */
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    standard: string;
    max: string;
  };
}

/**
 * The playlist interface
 */
export interface Playlist {
  /**
   * Name of the playlist
   */
  name: string;
  /**
   * Total number of tracks in the playlist
   */
  trackCount: number;
  /**
   * Total duration of the playlist
   */
  duration: number;
  /**
   * The tracks in the playlist
   */
  tracks: Array<Track>;
}

/**
 * The options for the node
 */
export interface NodeOptions {
  /**
   * The IP of the host
   */
  host: string;
  /**
   * The port for the node
   */
  port: number;
  /**
   * The authorization password
   */
  password: string;
}

/**
 * The options for the player
 */
export interface PlayerOptions {
  /**
   * The guild where the player is connected to
   */
  guild: Guild;
  /**
   * The voice channel for the player
   */
  voiceChannel: VoiceChannel;
  /**
   * The text channel the player listens to
   */
  textChannel: TextChannel;
  /**
   * Whether to deafen the bot on joining
   */
  deafen?: boolean;
  /**
   * Whether to repeat the current track
   */
  trackRepeat?: boolean;
  /**
   * Whether to repeat the queue
   */
  queueRepeat?: boolean;
  /**
   * Whether to skip song on a track error
   */
  skipOnError?: boolean;
}

/**
 * The Node stats interface
 */
export interface NodeStats {
  /**
   * The number of players playing
   */
  playingPlayers: number;
  /**
   * The Node memory stat interface
   */
  memory: {
    /**
     * The reservable memory
     */
    reservable: number;
    /**
     * Memory using currently
     */
    used: number;
    /**
     * Free memory
     */
    free: number;
    /**
     * The allocated memory
     */
    allocated: number;
  };
  /**
   * The amount of players spawned
   */
  players: number;
  /**
   * The Node cpu stat interface
   */
  cpu: {
    /**
     * The amount of CPU cores available
     */
    cores: number;
    /**
     * The system load on the CPU cores
     */
    systemLoad: number;
    /**
     * The load on the CPU cores by LavaLink
     */
    lavalinkLoad: number;
  };
  /**
   * The Node uptime
   */
  uptime: number;
}
