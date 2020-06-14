"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
//@ts-nocheck
const Queue_1 = require("./Queue");
const fetch = require("node-fetch");
const Utils_1 = require("../utils/Utils");
class Player {
  /**
   * The player class which plays the music
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {PlayerOptions} options - The player options.
   * @param {LavaNode} [node=optimisedNode] - The node to use.
   */
  constructor(lavaJS, options, node) {
    this.lavaJS = lavaJS;
    // Readonly
    /**
     * The player options
     * @type {PlayerOptions}
     * @readonly
     */
    this.options = options;
    /**
     * The current playing state
     * @type {Boolean}
     * @readonly
     */
    this.playState = false;
    /**
     * The player node
     * @type {LavaNode}
     * @readonly
     */
    this.node = node;
    /**
     * The current track position
     * @type {Number}
     * @readonly
     */
    this.position = 0;
    /**
     * The volume of the player
     * @type {Number}
     * @readonly
     */
    this.volume = 100;
    // Public properties
    /**
     * The queue of this player
     * @type {Queue}
     */
    this.queue = new Queue_1.Queue(this.lavaJS);
    /**
     * Whether the track is set on repeat
     * @type {Boolean}
     */
    this.repeatTrack = options.trackRepeat || false;
    /**
     * Whether the queue is set on repeat
     * @type {Boolean}
     */
    this.repeatQueue = options.queueRepeat || false;
    /**
     * Whether to skip to next song on error
     * @type {Boolean}
     */
    this.skipOnError = options.skipOnError || false;
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
   * Play the next track in the queue
   */
  play() {
    if (this.queue.size <= 0)
      throw new RangeError(`Player#play() No tracks in the queue.`);
    if (this.playState) {
      const currTrack = this.queue.remove();
      if (this.options.queueRepeat && currTrack) this.queue.add(currTrack);
    }
    const track = this.queue[0];
    this.node
      .wsSend({
        op: "play",
        track: track.trackString,
        guildId: this.options.guild.id,
        volume: this.volume,
      })
      .then(() => {
        this.lavaJS.emit("trackPlay", track, this);
        this.playState = true;
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Search a track or playlist from YouTube
   * @param {String} query - The song or playlist name or link.
   * @param {*} user - The user who requested the track.
   * @param {Boolean} [add=false] - Add to the queue automatically if response is a track.
   * @return {Promise<Track|Playlist>} result - The search data can be single track or playlist.
   */
  lavaSearch(query, user, add = true) {
    return new Promise(async (resolve, reject) => {
      const search = new RegExp(/^https?:\/\//g).test(query)
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
          const trackData = Utils_1.newTrack(tracks[0], user);
          if (!add) return resolve(trackData);
          this.queue.add(trackData);
          resolve(trackData);
          break;
        case "PLAYLIST_LOADED":
          const data = {
            name: playlistInfo.name,
            trackCount: tracks.length,
            tracks: tracks,
          };
          const playlist = Utils_1.newPlaylist(data, user);
          resolve(playlist);
          break;
        case "SEARCH_RESULT":
          const track1 = Utils_1.newTrack(tracks[0], user);
          if (!add) return resolve(track1);
          this.queue.add(track1);
          resolve(track1);
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
  stop() {
    this.node
      .wsSend({
        op: "stop",
        guildId: this.options.guild.id,
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Pauses the track if player is resumed
   */
  pause() {
    if (!this.playState)
      throw new Error(`Player#pause() The player is already paused.`);
    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: true,
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Resumes the track if player is paused
   */
  resume() {
    if (this.playState)
      throw new Error(`Player#resume() The player is already resumed.`);
    this.node
      .wsSend({
        op: "pause",
        guildId: this.options.guild.id,
        pause: false,
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Seek the track to a timestamp
   * @param {Number} position - The position to seek to.
   */
  seek(position) {
    if (this.queue.empty)
      throw new RangeError(`Player#seek() No tracks in queue.`);
    if (isNaN(position))
      throw new RangeError(
        `Player#seek() The provided position is not a number.`
      );
    if (position < 0 || position > this.queue[0].duration)
      throw new RangeError(
        `Player#seek() The provided position must be in between 0 and ${this.queue[0].duration}.`
      );
    this.position = position;
    this.node
      .wsSend({
        op: "seek",
        guildId: this.options.guild.id,
        position: position,
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Sets player volume
   * @param {Number} volume - The new volume.
   */
  setVolume(volume) {
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
        op: "seek",
        guildId: this.options.guild.id,
        volume: volume,
      })
      .catch((err) => {
        throw new Error(err);
      });
  }
  /**
   * Destroy the player
   */
  destroy() {
    this.lavaJS.wsSend({
      op: 4,
      d: {
        guild_id: this.options.guild.id || this.options.guild,
        channel_id: null,
        self_deaf: false,
        self_mute: false,
      },
    });
    this.node
      .wsSend({
        op: "destroy",
        guildId: this.options.guild.id || this.options.guild,
      })
      .catch((err) => {
        if (err) throw new Error(err);
      });
    this.lavaJS.playerCollection.delete(
      this.options.guild.id || this.options.guild
    );
    this.lavaJS.emit("destroyPlayer", this);
  }
}
exports.Player = Player;
