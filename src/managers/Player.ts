"use strict";

import { LavaClient, LavaNode, Queue, Utils, Cache } from "..";
import fetch from "node-fetch";
import { PlayerOptions, Playlist, Track } from "../utils/Interfaces";
import { User, VoiceChannel } from "discord.js";

export class Player {
  /**
   * The LavaClient instance
   */
  public readonly lavaJS: LavaClient;
  /**
   * The options for the player
   */
  public readonly options: PlayerOptions;
  /**
   * The node of this player
   */
  public readonly node: LavaNode;
  /**
   * The player queue
   */
  public readonly queue: Queue;
  /**
   * The band collection
   */
  public readonly bands: Map<number, { band: number; gain: number }>;
  /**
   * Whether the player has a loaded track
   */
  public playState: boolean = false;
  /**
   * The position of the track
   */
  public position: number;
  /**
   * The player volume
   */
  public volume: number;
  /**
   * Whether to repeat the current track
   */
  public repeatTrack: boolean;
  /**
   * Whether to repeat the queue
   */
  public repeatQueue: boolean;
  /**
   * Whether to skip the song on a track error
   */
  public skipOnError: boolean;
  /**
   * Whether the player is paused
   */
  public playPaused: boolean;

  /**
   * The player class which plays the music
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {PlayerOptions} options - The player options.
   * @param {LavaNode} [node=optimisedNode] - The node to use.
   */
  constructor(lavaJS: LavaClient, options: PlayerOptions, node?: LavaNode) {
    this.lavaJS = lavaJS;
    this.options = options;
    this.node = node || this.lavaJS.optimisedNode;

    this.playState = false;
    this.position = 0;
    this.volume = 100;
    this.playPaused = false;
    this.repeatTrack = options.trackRepeat || false;
    this.repeatQueue = options.queueRepeat || false;
    this.skipOnError = options.skipOnError || false;

    this.queue = new Queue(this);
    this.bands = new Cache();

    // Set the bands default
    for (let i = 0; i < 15; i++) {
      this.bands.set(i, { band: i, gain: 0.0 });
    }

    // Establish a Discord voice connection
    this.lavaJS.wsSend({
      op: 4,
      d: {
        guild_id: options.guild.id,
        channel_id: options.voiceChannel.id,
        self_deaf: options.deafen || false,
        self_mute: false,
      },
    });

    this.lavaJS.playerCollection.set(options.guild.id, this);
    this.lavaJS.emit("createPlayer", this);
  }

  /**
   * Whether the player has a loaded track
   * @return {Boolean}
   */
  public get playing(): boolean {
    return this.playState;
  }

  /**
   * Whether the player is paused
   * @return {Boolean}
   */
  public get paused(): boolean {
    return this.playPaused;
  }

  /**
   * Toggle the track or queue repeat feature (No parameter disables both)
   * @param {"track" | "playlist"} [type] - Whether to repeat the track or queue.
   * @return {Boolean} state - The new repeat state.
   */
  public toggleRepeat(type?: "track" | "queue"): boolean {
    if (type === "track") {
      this.repeatTrack = true;
      this.repeatQueue = false;
      return this.repeatTrack;
    } else if (type === "queue") {
      this.repeatQueue = true;
      this.repeatTrack = false;
      return this.repeatQueue;
    } else {
      this.repeatQueue = false;
      this.repeatTrack = false;
      return false;
    }
  }

  /**
   * Set custom EQ Bands for the player (No parameters resets the bands)
   * @param {Number} [band] - The band to edit.
   * @param {Number} [gain] - The new gain for the band.
   */
  public EQBands(band?: number, gain?: number): void {
    if (isNaN(band) || isNaN(gain)) {
      this.bands.clear();
      for (let i = 0; i < 15; i++) {
        this.bands.set(i, { band: i, gain: 0.0 });
      }
    } else {
      if (band > 14 || band < 0)
        throw new RangeError(
          `Player#setEQ() The band should be between 0 and 14.`
        );
      if (gain > 1 || gain < -0.25)
        throw new RangeError(
          `Player#setEQ() The gain should be between -0.25 and 1.`
        );
      this.bands.set(band, { band: band, gain: gain });
    }
    this.node
      .wsSend({
        op: "equalizer",
        guildId: this.options.guild.id,
        bands: [...this.bands.values()],
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }

  /**
   * Change the player voice channel
   * @param {VoiceChannel} channel - The new voice channel.
   */
  public movePlayer(channel: VoiceChannel): void {
    if (!channel)
      throw new Error(`Player#movePlayer() No voice channel provided!`);

    this.lavaJS.wsSend({
      op: 4,
      d: {
        guild_id: this.options.guild.id,
        channel_id: channel.id,
        self_deaf: this.options.deafen || false,
        self_mute: false,
      },
    });
  }

  /**
   * Play the next track in the queue
   */
  public play(): void {
    if (this.queue.empty)
      throw new RangeError(`Player#play() No tracks in the queue.`);
    if (this.playing) {
      return this.stop();
    }

    const track: Track = this.queue.first;
    this.node
      .wsSend({
        op: "play",
        track: track.trackString,
        guildId: this.options.guild.id,
        volume: this.volume,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }

  /**
   * Search a track or playlist from YouTube
   * @param {String} query - The song or playlist name or link.
   * @param {User} user - The user who requested the track.
   * @param {Boolean} [add=false] - Add to the queue automatically if response is a track.
   * @return {Promise<Array<Track>|Playlist>} result - The search data can be single track or playlist or array of tracks.
   */
  public lavaSearch(
    query: string,
    user: User,
    add: boolean = false
  ): Promise<Track[] | Playlist> {
    return new Promise(async (resolve, reject) => {
      const search: string = new RegExp(/^https?:\/\//g).test(query)
        ? query
        : `ytsearch:${query}`;

      const { loadType, playlistInfo, tracks, exception } = await (
        await fetch(
          `http://${this.node.options.host}:${this.node.options.port}/loadtracks?identifier=${search}`,
          {
            headers: { Authorization: this.node.options.password },
          }
        )
      ).json();

      switch (loadType) {
        // Successful loading
        case "TRACK_LOADED":
          const arr: Track[] = [];
          const trackData: Track = Utils.newTrack(tracks[0], user);
          arr.push(trackData);
          if (!add) return resolve(arr);
          this.queue.add(trackData);
          resolve(arr);
          break;

        case "PLAYLIST_LOADED":
          const data: any = {
            name: playlistInfo.name,
            trackCount: tracks.length,
            tracks: tracks,
          };
          const playlist: Playlist = Utils.newPlaylist(data, user);
          resolve(playlist);
          break;

        case "SEARCH_RESULT":
          const res: Track[] = tracks.map((t) => Utils.newTrack(t, user));
          resolve(res);
          break;

        // Error loading
        case "NO_MATCHES":
          reject(
            new Error(
              `Player#lavaSearch() No result found for the search query.`
            )
          );
          break;

        case "LOAD_FAILED":
          const { message, severity } = exception;
          reject(
            new Error(`Player#lavaSearch() ${message} (Severity: ${severity}).`)
          );
          break;
      }
    });
  }

  /**
   * Stops the player
   */
  public stop(): void {
    this.node
      .wsSend({
        op: "stop",
        guildId: this.options.guild.id,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }

  /**
   * Pauses the track if player is resumed
   */
  public pause(): void {
    if (this.paused)
      throw new Error(`Player#pause() The player is already paused.`);

    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: true,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.playPaused = true;
  }

  /**
   * Resumes the track if player is paused
   */
  public resume(): void {
    if (!this.paused)
      throw new Error(`Player#resume() The player is already resumed.`);

    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: false,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.playPaused = false;
  }

  /**
   * Seek the track to a timestamp
   * @param {Number} position - The position to seek to.
   */
  public seek(position: number): void {
    if (this.queue.empty)
      throw new RangeError(`Player#seek() No tracks in queue.`);
    if (isNaN(position))
      throw new RangeError(
        `Player#seek() The provided position is not a number.`
      );
    if (position < 0 || position > this.queue.first.length)
      throw new RangeError(
        `Player#seek() The provided position must be in between 0 and ${this.queue.first.length}.`
      );

    this.position = position;
    this.node
      .wsSend({
        op: "seek",
        guildId: this.options.guild.id,
        position: position,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }

  /**
   * Sets player volume or reset it to 100
   * @param {Number} [volume=100] - The new volume.
   */
  public setVolume(volume: number = 100): void {
    if (isNaN(volume))
      throw new RangeError(
        `Player#volume() The provided volume is not a number.`
      );
    if (volume < 0 || volume > 1000)
      throw new RangeError(
        `Player#setVolume() Provided volume must be in between 0 and 1000.`
      );

    this.volume = volume;
    this.node
      .wsSend({
        op: "volume",
        guildId: this.options.guild.id,
        volume: volume,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
  }

  /**
   * Destroy the player
   */
  public destroy(): void {
    this.lavaJS.wsSend({
      op: 4,
      d: {
        guild_id: this.options.guild.id,
        channel_id: null,
        self_deaf: false,
        self_mute: false,
      },
    });

    this.node
      .wsSend({
        op: "destroy",
        guildId: this.options.guild.id,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });

    this.lavaJS.playerCollection.delete(this.options.guild.id);
    this.lavaJS.emit("destroyPlayer", this);
  }
}
