"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LavaClient = void 0;
//@ts-nocheck
const events_1 = require("events");
const LavaNode_1 = require("./LavaNode");
const Player_1 = require("./Player");
class LavaClient extends events_1.EventEmitter {
  /**
   * Emitted when a node is connected
   * @event LavaClient#nodeSuccess
   * @param {LavaNode} node - The node which connected.
   */
  /**
   * Emitted on a node error
   * @event LavaClient#nodeError
   * @param {Node} node - The node which encountered the error.
   * @param {Error} error - The error message.
   */
  /**
   * Emitted when a node closes
   * @event LavaClient#nodeClose
   * @param {Node} node - The node which was closed.
   * @param {Error} error - The error message.
   */
  /**
   * Emitted when a node reconnects
   * @event LavaClient#nodeReconnect
   * @param {Node} node - The node which is reconnecting.
   */
  /**
   * Emitted when a player is created
   * @event LavaClient#createPlayer
   * @param {Player} player - The new player.
   */
  /**
   * Emitted when a player is destroyed
   * @event LavaClient#destroyPlayer
   * @param {Player} player - The destroyed player.
   */
  /**
   * Emitted when a track ends
   * @event LavaClient#trackOver
   * @param {Track} track - The track which ended.
   * @param {Player} player - Player which was playing the track.
   */
  /**
   * Emitted when a track starts
   * @event LavaClient#trackPlay
   * @param {Track} track - The track which started.
   * @param {Player} player - Player which is playing the track.
   */
  /**
   * Emitted when a track is stuck
   * @event LavaClient#trackStuck
   * @param {Track} track - The track which is stuck.
   * @param {Player} player - Player which was playing the track.
   * @param {Error} error - The error message.
   */
  /**
   * Emitted when a track encounters an error
   * @event LavaClient#trackError
   * @param {Track} track - Track which encountered errored.
   * @param {Player} player - Player which was playing the track.
   * @param {Error} error - The error message.
   */
  /**
   * Emitted when a queue ends
   * @event LavaClient#queueOver
   * @param {Player} player - Player whose queue ended.
   */
  /**
   * The playlist object
   * @typedef {Object} Playlist
   * @property {String} name - Name of playlist.
   * @property {Number} trackCount - Number of tracks in the playlist.
   * @property {Number} duration - Total duration of the playlist.
   * @property {Array<Track>} tracks - The tracks in the playlist.
   */
  /**
   * The track object
   * @typedef {Object} Track
   * @property {String} trackString - The 64-bit encoded track.
   * @property {String} title - Title of the track.
   * @property {String} identifier - The ID of the track.
   * @property {String} author - The author of the track.
   * @property {Number} length - The duration of the track.
   * @property {Boolean} isStream - Whether to the track is a stream.
   * @property {String} uri - Track's YouTube url.
   * @property {*} user - The user who requested the track.
   * @property {Object} thumbnail - Track's YouTube thumbnails.
   */
  /**
   * The options for the player
   * @typedef {Object} PlayerOptions
   * @property {*} guild - The guild where the player is connected to.
   * @property {*} voiceChannel - The voice channel to connect to.
   * @property {*} textChannel - The text channel where the player is connected to.
   * @property {Boolean} [deafen=false] - Whether to deafen the client.
   * @property {Boolean} [trackRepeat=false] - Whether to repeat the current track.
   * @property {Boolean} [queueRepeat=false] - Whether to repeat the current queue.
   * @property {Boolean} [skipOnError=true] - Whether to skip to next song on track stuck/error.
   */
  /**
   * The options for the node
   * @typedef {Object} NodeOptions
   * @property {String} host - The host IP or localhost.
   * @property {Number} port - The port of the node.
   * @property {String} password - The authorization password of the node.
   */
  /**
   * Creates a new LavaJSClient class instance
   * @param {*} client - The Discord client.
   * @param {Array<NodeOptions>} node - The LavaNode to use.
   * @param {Number} [shards=0] - Shards count of the Discord client.
   */
  constructor(client, node, shards) {
    super();
    this.client = client;
    this.nodes = node;
    this.shards = shards || 0;
    // Collections
    /**
     * The node Map collection
     * @type {Map}
     */
    this.nodeCollection = new Map();
    /**
     * The player Map collection
     * @type {Map}
     */
    this.playerCollection = new Map();
    // Connect the nodes
    if (!this.nodes || !this.nodes.length)
      throw new Error("[ClientError] No nodes provided!");
    for (let x of this.nodes) {
      if (this.nodeCollection.has(x.host)) continue;
      const newNode = new LavaNode_1.LavaNode(this, x);
      this.nodeCollection.set(x.host, newNode);
    }
  }
  /**
   * Send data to Discord via WebSocket.
   * @param {Object} data - The data packet to send.
   */
  wsSend(data) {
    if (!this.client) return;
    const guild = this.client.guilds.cache.get(data.d.guild_id);
    if (guild && this.client.ws.shards) {
      guild.shard.send(data).catch((err) => {
        throw new Error(err);
      });
    } else if (guild) {
      this.client.ws.send(data);
    }
  }
  /**
   * Creates a new LavaJS player or returns old one if player exists
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {PlayerOptions} options - The player options.
   * @return {Player} player - The new player.
   */
  spawnPlayer(lavaJS, options) {
    if (!options.guild.id)
      options.guild = this.client.guilds.cache.get(options.guild);
    if (!options.guild)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.guild.`
      );
    if (!options.voiceChannel.id)
      options.voiceChannel = options.guild.channels.cache.get(
        options.voiceChannel
      );
    if (!options.voiceChannel)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.voiceChannel.`
      );
    if (!options.textChannel.id)
      options.textChannel = options.guild.channels.cache.get(
        options.textChannel
      );
    if (!options.textChannel)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.textChannel.`
      );
    const oldPlayer = this.playerCollection.get(options.guild.id);
    if (oldPlayer) return oldPlayer;
    return new Player_1.Player(this, options, this.optimisedNode);
  }
  /**
   * Returns the node with least resource usage
   * @return {LavaNode}
   */
  get optimisedNode() {
    const toArray = [...this.nodeCollection.entries()];
    const sorted = toArray
      .filter((x) => x[1].online)
      .sort((a, b) => {
        const loadA = (a[1].stats.cpu.systemLoad / a[1].stats.cpu.cores) * 100;
        const loadB = (b[1].stats.cpu.systemLoad / b[1].stats.cpu.cores) * 100;
        return loadB - loadA;
      });
    return sorted[0][1];
  }
}
exports.LavaClient = LavaClient;
