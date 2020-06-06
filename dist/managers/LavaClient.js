const { EventEmitter } = require("events");
const { LavaNode } = require("./managers/LavaNode");
const { Player } = require("./managers/Player");

class LavaClient extends EventEmitter {
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
   * Emitted when a track is stuck or errored out.
   * @event LavaClient#trackIssue
   * @param {Track} track - The track which has the issue.
   * @param {Player} player - Player which was playing the track.
   * @param {Error} error - The error message.
   */

  /**
   * The options for the player
   * @name PlayerOptions
   * @type {{
   *  guild: Object,
   *  voiceChannel: Object,
   *  textChannel: Object,
   *  Deafen: Boolean,
   *  [trackRepeat]: Boolean,
   *  [queueRepeat]: Boolean
   *  }}
   */
  /**
   * The options for the node
   * @name NodeOptions
   * @type {{ host: String, port: Number, password: String }}
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
    this.nodeCollection = new Map();
    this.playerCollection = new Map();

    // Connect the nodes
    if (!this.nodes || !this.nodes.length)
      throw new Error("[ClientError] No nodes provided!");
    for (let x of this.nodes) {
      if (this.nodeCollection.has(x.host)) continue;
      const newNode = new LavaNode(this, x);
      this.nodeCollection.set(x.host, newNode);
    }
  }
  /**
   * Send data to Discord via WebSocket.
   * @param {*} data - The data packet to send.
   */
  wsSend(data) {
    if (!this.client) return;

    const guild = this.client.guilds.get(data.d.guild_id);
    if (guild && this.client.ws.shards) {
      guild.shard.send(data).catch();
    } else if (guild) {
      this.client.ws.send(data);
    }
  }

  /**
   * Creates a new LavaJS player which will play the songs
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {PlayerOptions} options - The player options.
   * @return {Player} player - The new player.
   */
  spawnPlayer(lavaJS, options) {
    return new Player(this, options);
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

module.exports.LavaClient = LavaClient;
