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
   * @param {Number} [shards=1] - Shards count of the Discord client.
   */
  constructor(client, node, shards) {
    super();
    this.client = client;
    this.nodes = node;
    this.shards = shards || 1;
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
    const guild = this.client.guilds.get(data.d.guild_id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF2YUNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL1NyYy9tYW5hZ2Vycy9MYXZhQ2xpZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGFBQWE7QUFDYixtQ0FBc0M7QUFDdEMseUNBQXNDO0FBQ3RDLHFDQUFrQztBQUVsQyxNQUFNLFVBQVcsU0FBUSxxQkFBWTtJQUNuQzs7OztPQUlHO0lBQ0g7Ozs7O09BS0c7SUFDSDs7Ozs7T0FLRztJQUNIOzs7O09BSUc7SUFDSDs7OztPQUlHO0lBQ0g7Ozs7T0FJRztJQUNIOzs7OztPQUtHO0lBQ0g7Ozs7O09BS0c7SUFDSDs7Ozs7O09BTUc7SUFDSDs7Ozs7O09BTUc7SUFDSDs7OztPQUlHO0lBRUg7Ozs7Ozs7T0FPRztJQUNIOzs7Ozs7Ozs7Ozs7T0FZRztJQUNIOzs7Ozs7Ozs7O09BVUc7SUFDSDs7Ozs7O09BTUc7SUFFSDs7Ozs7T0FLRztJQUNILFlBQVksTUFBTSxFQUFFLElBQUksRUFBRSxNQUFNO1FBQzlCLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxDQUFDO1FBRTFCLGNBQWM7UUFDZDs7O1dBR0c7UUFDSCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFaEM7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFbEMsb0JBQW9CO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQ25DLE1BQU0sSUFBSSxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQztRQUN0RCxLQUFLLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFL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O2FBQzFCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNiLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUN2RSxNQUFNLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDdkUsT0FBTyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUMsQ0FBQyxDQUFDO1FBQ0wsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdEIsQ0FBQztDQUNGO0FBRVEsZ0NBQVUiLCJzb3VyY2VzQ29udGVudCI6WyIvL0B0cy1ub2NoZWNrXG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tIFwiZXZlbnRzXCI7XG5pbXBvcnQgeyBMYXZhTm9kZSB9IGZyb20gXCIuL0xhdmFOb2RlXCI7XG5pbXBvcnQgeyBQbGF5ZXIgfSBmcm9tIFwiLi9QbGF5ZXJcIjtcblxuY2xhc3MgTGF2YUNsaWVudCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSBub2RlIGlzIGNvbm5lY3RlZFxuICAgKiBAZXZlbnQgTGF2YUNsaWVudCNub2RlU3VjY2Vzc1xuICAgKiBAcGFyYW0ge0xhdmFOb2RlfSBub2RlIC0gVGhlIG5vZGUgd2hpY2ggY29ubmVjdGVkLlxuICAgKi9cbiAgLyoqXG4gICAqIEVtaXR0ZWQgb24gYSBub2RlIGVycm9yXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I25vZGVFcnJvclxuICAgKiBAcGFyYW0ge05vZGV9IG5vZGUgLSBUaGUgbm9kZSB3aGljaCBlbmNvdW50ZXJlZCB0aGUgZXJyb3IuXG4gICAqIEBwYXJhbSB7RXJyb3J9IGVycm9yIC0gVGhlIGVycm9yIG1lc3NhZ2UuXG4gICAqL1xuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgbm9kZSBjbG9zZXNcbiAgICogQGV2ZW50IExhdmFDbGllbnQjbm9kZUNsb3NlXG4gICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAtIFRoZSBub2RlIHdoaWNoIHdhcyBjbG9zZWQuXG4gICAqIEBwYXJhbSB7RXJyb3J9IGVycm9yIC0gVGhlIGVycm9yIG1lc3NhZ2UuXG4gICAqL1xuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgbm9kZSByZWNvbm5lY3RzXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I25vZGVSZWNvbm5lY3RcbiAgICogQHBhcmFtIHtOb2RlfSBub2RlIC0gVGhlIG5vZGUgd2hpY2ggaXMgcmVjb25uZWN0aW5nLlxuICAgKi9cbiAgLyoqXG4gICAqIEVtaXR0ZWQgd2hlbiBhIHBsYXllciBpcyBjcmVhdGVkXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I2NyZWF0ZVBsYXllclxuICAgKiBAcGFyYW0ge1BsYXllcn0gcGxheWVyIC0gVGhlIG5ldyBwbGF5ZXIuXG4gICAqL1xuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgcGxheWVyIGlzIGRlc3Ryb3llZFxuICAgKiBAZXZlbnQgTGF2YUNsaWVudCNkZXN0cm95UGxheWVyXG4gICAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgLSBUaGUgZGVzdHJveWVkIHBsYXllci5cbiAgICovXG4gIC8qKlxuICAgKiBFbWl0dGVkIHdoZW4gYSB0cmFjayBlbmRzXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I3RyYWNrT3ZlclxuICAgKiBAcGFyYW0ge1RyYWNrfSB0cmFjayAtIFRoZSB0cmFjayB3aGljaCBlbmRlZC5cbiAgICogQHBhcmFtIHtQbGF5ZXJ9IHBsYXllciAtIFBsYXllciB3aGljaCB3YXMgcGxheWluZyB0aGUgdHJhY2suXG4gICAqL1xuICAvKipcbiAgICogRW1pdHRlZCB3aGVuIGEgdHJhY2sgc3RhcnRzXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I3RyYWNrUGxheVxuICAgKiBAcGFyYW0ge1RyYWNrfSB0cmFjayAtIFRoZSB0cmFjayB3aGljaCBzdGFydGVkLlxuICAgKiBAcGFyYW0ge1BsYXllcn0gcGxheWVyIC0gUGxheWVyIHdoaWNoIGlzIHBsYXlpbmcgdGhlIHRyYWNrLlxuICAgKi9cbiAgLyoqXG4gICAqIEVtaXR0ZWQgd2hlbiBhIHRyYWNrIGlzIHN0dWNrXG4gICAqIEBldmVudCBMYXZhQ2xpZW50I3RyYWNrU3R1Y2tcbiAgICogQHBhcmFtIHtUcmFja30gdHJhY2sgLSBUaGUgdHJhY2sgd2hpY2ggaXMgc3R1Y2suXG4gICAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgLSBQbGF5ZXIgd2hpY2ggd2FzIHBsYXlpbmcgdGhlIHRyYWNrLlxuICAgKiBAcGFyYW0ge0Vycm9yfSBlcnJvciAtIFRoZSBlcnJvciBtZXNzYWdlLlxuICAgKi9cbiAgLyoqXG4gICAqIEVtaXR0ZWQgd2hlbiBhIHRyYWNrIGVuY291bnRlcnMgYW4gZXJyb3JcbiAgICogQGV2ZW50IExhdmFDbGllbnQjdHJhY2tFcnJvclxuICAgKiBAcGFyYW0ge1RyYWNrfSB0cmFjayAtIFRyYWNrIHdoaWNoIGVuY291bnRlcmVkIGVycm9yZWQuXG4gICAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgLSBQbGF5ZXIgd2hpY2ggd2FzIHBsYXlpbmcgdGhlIHRyYWNrLlxuICAgKiBAcGFyYW0ge0Vycm9yfSBlcnJvciAtIFRoZSBlcnJvciBtZXNzYWdlLlxuICAgKi9cbiAgLyoqXG4gICAqIEVtaXR0ZWQgd2hlbiBhIHF1ZXVlIGVuZHNcbiAgICogQGV2ZW50IExhdmFDbGllbnQjcXVldWVPdmVyXG4gICAqIEBwYXJhbSB7UGxheWVyfSBwbGF5ZXIgLSBQbGF5ZXIgd2hvc2UgcXVldWUgZW5kZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBUaGUgcGxheWxpc3Qgb2JqZWN0XG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFBsYXlsaXN0XG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBuYW1lIC0gTmFtZSBvZiBwbGF5bGlzdC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHRyYWNrQ291bnQgLSBOdW1iZXIgb2YgdHJhY2tzIGluIHRoZSBwbGF5bGlzdC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IGR1cmF0aW9uIC0gVG90YWwgZHVyYXRpb24gb2YgdGhlIHBsYXlsaXN0LlxuICAgKiBAcHJvcGVydHkge0FycmF5PFRyYWNrPn0gdHJhY2tzIC0gVGhlIHRyYWNrcyBpbiB0aGUgcGxheWxpc3QuXG4gICAqL1xuICAvKipcbiAgICogVGhlIHRyYWNrIG9iamVjdFxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBUcmFja1xuICAgKiBAcHJvcGVydHkge1N0cmluZ30gdHJhY2tTdHJpbmcgLSBUaGUgNjQtYml0IGVuY29kZWQgdHJhY2suXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB0aXRsZSAtIFRpdGxlIG9mIHRoZSB0cmFjay5cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IGlkZW50aWZpZXIgLSBUaGUgSUQgb2YgdGhlIHRyYWNrLlxuICAgKiBAcHJvcGVydHkge1N0cmluZ30gYXV0aG9yIC0gVGhlIGF1dGhvciBvZiB0aGUgdHJhY2suXG4gICAqIEBwcm9wZXJ0eSB7TnVtYmVyfSBsZW5ndGggLSBUaGUgZHVyYXRpb24gb2YgdGhlIHRyYWNrLlxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IGlzU3RyZWFtIC0gV2hldGhlciB0byB0aGUgdHJhY2sgaXMgYSBzdHJlYW0uXG4gICAqIEBwcm9wZXJ0eSB7U3RyaW5nfSB1cmkgLSBUcmFjaydzIFlvdVR1YmUgdXJsLlxuICAgKiBAcHJvcGVydHkgeyp9IHVzZXIgLSBUaGUgdXNlciB3aG8gcmVxdWVzdGVkIHRoZSB0cmFjay5cbiAgICogQHByb3BlcnR5IHtPYmplY3R9IHRodW1ibmFpbCAtIFRyYWNrJ3MgWW91VHViZSB0aHVtYm5haWxzLlxuICAgKi9cbiAgLyoqXG4gICAqIFRoZSBvcHRpb25zIGZvciB0aGUgcGxheWVyXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IFBsYXllck9wdGlvbnNcbiAgICogQHByb3BlcnR5IHsqfSBndWlsZCAtIFRoZSBndWlsZCB3aGVyZSB0aGUgcGxheWVyIGlzIGNvbm5lY3RlZCB0by5cbiAgICogQHByb3BlcnR5IHsqfSB2b2ljZUNoYW5uZWwgLSBUaGUgdm9pY2UgY2hhbm5lbCB0byBjb25uZWN0IHRvLlxuICAgKiBAcHJvcGVydHkgeyp9IHRleHRDaGFubmVsIC0gVGhlIHRleHQgY2hhbm5lbCB3aGVyZSB0aGUgcGxheWVyIGlzIGNvbm5lY3RlZCB0by5cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBbZGVhZmVuPWZhbHNlXSAtIFdoZXRoZXIgdG8gZGVhZmVuIHRoZSBjbGllbnQuXG4gICAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gW3RyYWNrUmVwZWF0PWZhbHNlXSAtIFdoZXRoZXIgdG8gcmVwZWF0IHRoZSBjdXJyZW50IHRyYWNrLlxuICAgKiBAcHJvcGVydHkge0Jvb2xlYW59IFtxdWV1ZVJlcGVhdD1mYWxzZV0gLSBXaGV0aGVyIHRvIHJlcGVhdCB0aGUgY3VycmVudCBxdWV1ZS5cbiAgICogQHByb3BlcnR5IHtCb29sZWFufSBbc2tpcE9uRXJyb3I9dHJ1ZV0gLSBXaGV0aGVyIHRvIHNraXAgdG8gbmV4dCBzb25nIG9uIHRyYWNrIHN0dWNrL2Vycm9yLlxuICAgKi9cbiAgLyoqXG4gICAqIFRoZSBvcHRpb25zIGZvciB0aGUgbm9kZVxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBOb2RlT3B0aW9uc1xuICAgKiBAcHJvcGVydHkge1N0cmluZ30gaG9zdCAtIFRoZSBob3N0IElQIG9yIGxvY2FsaG9zdC5cbiAgICogQHByb3BlcnR5IHtOdW1iZXJ9IHBvcnQgLSBUaGUgcG9ydCBvZiB0aGUgbm9kZS5cbiAgICogQHByb3BlcnR5IHtTdHJpbmd9IHBhc3N3b3JkIC0gVGhlIGF1dGhvcml6YXRpb24gcGFzc3dvcmQgb2YgdGhlIG5vZGUuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IExhdmFKU0NsaWVudCBjbGFzcyBpbnN0YW5jZVxuICAgKiBAcGFyYW0geyp9IGNsaWVudCAtIFRoZSBEaXNjb3JkIGNsaWVudC5cbiAgICogQHBhcmFtIHtBcnJheTxOb2RlT3B0aW9ucz59IG5vZGUgLSBUaGUgTGF2YU5vZGUgdG8gdXNlLlxuICAgKiBAcGFyYW0ge051bWJlcn0gW3NoYXJkcz0xXSAtIFNoYXJkcyBjb3VudCBvZiB0aGUgRGlzY29yZCBjbGllbnQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjbGllbnQsIG5vZGUsIHNoYXJkcykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jbGllbnQgPSBjbGllbnQ7XG4gICAgdGhpcy5ub2RlcyA9IG5vZGU7XG4gICAgdGhpcy5zaGFyZHMgPSBzaGFyZHMgfHwgMTtcblxuICAgIC8vIENvbGxlY3Rpb25zXG4gICAgLyoqXG4gICAgICogVGhlIG5vZGUgTWFwIGNvbGxlY3Rpb25cbiAgICAgKiBAdHlwZSB7TWFwfVxuICAgICAqL1xuICAgIHRoaXMubm9kZUNvbGxlY3Rpb24gPSBuZXcgTWFwKCk7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgcGxheWVyIE1hcCBjb2xsZWN0aW9uXG4gICAgICogQHR5cGUge01hcH1cbiAgICAgKi9cbiAgICB0aGlzLnBsYXllckNvbGxlY3Rpb24gPSBuZXcgTWFwKCk7XG5cbiAgICAvLyBDb25uZWN0IHRoZSBub2Rlc1xuICAgIGlmICghdGhpcy5ub2RlcyB8fCAhdGhpcy5ub2Rlcy5sZW5ndGgpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJbQ2xpZW50RXJyb3JdIE5vIG5vZGVzIHByb3ZpZGVkIVwiKTtcbiAgICBmb3IgKGxldCB4IG9mIHRoaXMubm9kZXMpIHtcbiAgICAgIGlmICh0aGlzLm5vZGVDb2xsZWN0aW9uLmhhcyh4Lmhvc3QpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG5ld05vZGUgPSBuZXcgTGF2YU5vZGUodGhpcywgeCk7XG4gICAgICB0aGlzLm5vZGVDb2xsZWN0aW9uLnNldCh4Lmhvc3QsIG5ld05vZGUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGRhdGEgdG8gRGlzY29yZCB2aWEgV2ViU29ja2V0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFRoZSBkYXRhIHBhY2tldCB0byBzZW5kLlxuICAgKi9cbiAgd3NTZW5kKGRhdGEpIHtcbiAgICBpZiAoIXRoaXMuY2xpZW50KSByZXR1cm47XG4gICAgY29uc3QgZ3VpbGQgPSB0aGlzLmNsaWVudC5ndWlsZHMuZ2V0KGRhdGEuZC5ndWlsZF9pZCk7XG4gICAgaWYgKGd1aWxkICYmIHRoaXMuY2xpZW50LndzLnNoYXJkcykge1xuICAgICAgZ3VpbGQuc2hhcmQuc2VuZChkYXRhKS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChndWlsZCkge1xuICAgICAgdGhpcy5jbGllbnQud3Muc2VuZChkYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBMYXZhSlMgcGxheWVyIG9yIHJldHVybnMgb2xkIG9uZSBpZiBwbGF5ZXIgZXhpc3RzXG4gICAqIEBwYXJhbSB7TGF2YUNsaWVudH0gbGF2YUpTIC0gVGhlIExhdmFDbGllbnQuXG4gICAqIEBwYXJhbSB7UGxheWVyT3B0aW9uc30gb3B0aW9ucyAtIFRoZSBwbGF5ZXIgb3B0aW9ucy5cbiAgICogQHJldHVybiB7UGxheWVyfSBwbGF5ZXIgLSBUaGUgbmV3IHBsYXllci5cbiAgICovXG4gIHNwYXduUGxheWVyKGxhdmFKUywgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucy5ndWlsZC5pZClcbiAgICAgIG9wdGlvbnMuZ3VpbGQgPSB0aGlzLmNsaWVudC5ndWlsZHMuY2FjaGUuZ2V0KG9wdGlvbnMuZ3VpbGQpO1xuICAgIGlmICghb3B0aW9ucy5ndWlsZClcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYExhdmFDbGllbnQjc3Bhd25QbGF5ZXIoKSBDb3VsZCBub3QgcmVzb2x2ZSBQbGF5ZXJPcHRpb25zLmd1aWxkLmBcbiAgICAgICk7XG4gICAgaWYgKCFvcHRpb25zLnZvaWNlQ2hhbm5lbC5pZClcbiAgICAgIG9wdGlvbnMudm9pY2VDaGFubmVsID0gb3B0aW9ucy5ndWlsZC5jaGFubmVscy5jYWNoZS5nZXQoXG4gICAgICAgIG9wdGlvbnMudm9pY2VDaGFubmVsXG4gICAgICApO1xuICAgIGlmICghb3B0aW9ucy52b2ljZUNoYW5uZWwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBMYXZhQ2xpZW50I3NwYXduUGxheWVyKCkgQ291bGQgbm90IHJlc29sdmUgUGxheWVyT3B0aW9ucy52b2ljZUNoYW5uZWwuYFxuICAgICAgKTtcbiAgICBpZiAoIW9wdGlvbnMudGV4dENoYW5uZWwuaWQpXG4gICAgICBvcHRpb25zLnRleHRDaGFubmVsID0gb3B0aW9ucy5ndWlsZC5jaGFubmVscy5jYWNoZS5nZXQoXG4gICAgICAgIG9wdGlvbnMudGV4dENoYW5uZWxcbiAgICAgICk7XG4gICAgaWYgKCFvcHRpb25zLnRleHRDaGFubmVsKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgTGF2YUNsaWVudCNzcGF3blBsYXllcigpIENvdWxkIG5vdCByZXNvbHZlIFBsYXllck9wdGlvbnMudGV4dENoYW5uZWwuYFxuICAgICAgKTtcblxuICAgIGNvbnN0IG9sZFBsYXllciA9IHRoaXMucGxheWVyQ29sbGVjdGlvbi5nZXQob3B0aW9ucy5ndWlsZC5pZCk7XG4gICAgaWYgKG9sZFBsYXllcikgcmV0dXJuIG9sZFBsYXllcjtcblxuICAgIHJldHVybiBuZXcgUGxheWVyKHRoaXMsIG9wdGlvbnMsIHRoaXMub3B0aW1pc2VkTm9kZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbm9kZSB3aXRoIGxlYXN0IHJlc291cmNlIHVzYWdlXG4gICAqIEByZXR1cm4ge0xhdmFOb2RlfVxuICAgKi9cbiAgZ2V0IG9wdGltaXNlZE5vZGUoKSB7XG4gICAgY29uc3QgdG9BcnJheSA9IFsuLi50aGlzLm5vZGVDb2xsZWN0aW9uLmVudHJpZXMoKV07XG4gICAgY29uc3Qgc29ydGVkID0gdG9BcnJheVxuICAgICAgLmZpbHRlcigoeCkgPT4geFsxXS5vbmxpbmUpXG4gICAgICAuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICBjb25zdCBsb2FkQSA9IChhWzFdLnN0YXRzLmNwdS5zeXN0ZW1Mb2FkIC8gYVsxXS5zdGF0cy5jcHUuY29yZXMpICogMTAwO1xuICAgICAgICBjb25zdCBsb2FkQiA9IChiWzFdLnN0YXRzLmNwdS5zeXN0ZW1Mb2FkIC8gYlsxXS5zdGF0cy5jcHUuY29yZXMpICogMTAwO1xuICAgICAgICByZXR1cm4gbG9hZEIgLSBsb2FkQTtcbiAgICAgIH0pO1xuICAgIHJldHVybiBzb3J0ZWRbMF1bMV07XG4gIH1cbn1cblxuZXhwb3J0IHsgTGF2YUNsaWVudCB9O1xuIl19
