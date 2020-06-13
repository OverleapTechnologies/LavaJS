"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.LavaNode = void 0;
//@ts-nocheck
const ws_1 = __importDefault(require("ws"));
class LavaNode {
  /**
   * Create new LavaNode class instance
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {NodeOptions} options - The LavaNode options.
   */
  constructor(lavaJS, options) {
    this.lavaJS = lavaJS;
    /**
     * The options for the node
     * @type {NodeOptions}
     * @readonly
     */
    this.options = options;
    /**
     * The node system stats
     * @type {Object}
     * @private
     */
    this.stats = {
      playingPlayers: 0,
      memory: {
        reservable: 0,
        used: 0,
        free: 0,
        allocated: 0,
      },
      players: 0,
      cpu: {
        cores: 0,
        systemLoad: 0,
        lavalinkLoad: 0,
      },
      uptime: 0,
    };
    /**
     * Connection stats
     * @type {Object}
     * @private
     */
    this.conStatus = {
      attempts: 0,
      doRetry: 5,
    };
    // Establish a WebSocket connection
    this.connect();
  }
  /**
   * The node's system usage status
   * @return {Object}
   * @readonly
   */
  get systemStats() {
    return {
      memory: this.stats.memory,
      cpu: this.stats.cpu,
      uptime: this.stats.uptime,
    };
  }
  /**
   * The node's connection status
   * @return {Boolean}
   * @readonly
   */
  get online() {
    if (!this.con) return false;
    return this.con.readyState === ws_1.default.OPEN;
  }
  /**
   * Establish a node websocket connection
   */
  connect() {
    const headers = {
      Authorization: this.options.password,
      "Num-Shards": this.lavaJS.shards,
      "User-Id": this.lavaJS.client.user.id,
    };
    this.con = new ws_1.default(
      `ws://${this.options.host}:${this.options.port}/`,
      "",
      { headers }
    );
    this.con.on("open", this.onConnect.bind(this));
    this.con.on("error", this.onError.bind(this));
    this.con.on("close", this.onClose.bind(this));
    this.con.on("message", this.handleResponse.bind(this));
  }
  /**
   * Handles successful connections
   */
  onConnect() {
    if (this.reconnectModule) clearTimeout(this.reconnectModule);
    this.lavaJS.emit("nodeSuccess", this);
  }
  /**
   * Handles close connection events
   * @param {Number} code - The error code
   */
  onClose(code) {
    this.lavaJS.emit(
      "nodeClose",
      this,
      new Error(`Connection closed with code: ${code}`)
    );
    if (code !== 1000) this.reconnect();
  }
  /**
   * Handles connection errors
   * @param {String} error - The error message
   */
  onError(error) {
    if (!error) return;
    this.lavaJS.emit("nodeError", this, error);
    this.reconnect();
  }
  /**
   * Reconnect to the node if disconnected
   */
  reconnect() {
    this.reconnectModule = setTimeout(() => {
      if (this.conStatus.attempts >= this.conStatus.doRetry) {
        this.lavaJS.emit(
          "nodeError",
          this,
          new Error(
            `Failed to connect node after ${this.conStatus.attempts} tries!`
          )
        );
        return this.kill();
      }
      this.lavaJS.emit("nodeReconnect", this);
      this.con.removeEventListener();
      this.con = null;
      this.connect();
      this.conStatus.attempts++;
    }, 3e4);
  }
  /**
   * Destroys the node
   */
  kill() {
    if (!this.online) return;
    this.con.close(1000, "destroy");
    this.con.removeEventListener();
    this.con = null;
    this.lavaJS.nodeCollection.delete(this.options.host);
  }
  /**
   * Handle any incoming data from the node
   */
  handleResponse(data) {
    const msg = JSON.parse(data.toString());
    const { op, type, code, guildId, state } = msg;
    if (!op) return;
    if (op !== "event") {
      // Handle non-track event messages
      switch (op) {
        case "stats":
          this.stats = Object.assign({}, msg);
          delete this.stats.op;
          break;
        case "playerUpdate":
          const player = this.lavaJS.playerCollection.get(guildId);
          if (player) player.position = state.position || 0;
          break;
      }
    } else if (op === "event") {
      if (!guildId) return;
      // LavaJS player for that guild
      const player = this.lavaJS.playerCollection.get(guildId);
      const track = player.queue[0];
      player.playState = false;
      // Handle track event messages
      switch (type) {
        case "TrackEndEvent":
          if (track && player.repeatTrack) {
            player.play();
          } else if (track && player.repeatQueue) {
            const track1 = player.queue.remove();
            if (track1) player.queue.add(track1);
            player.play();
          } else if (track && player.queue.size > 1) {
            player.queue.remove();
            player.play();
          } else if (track && player.queue.size === 1) {
            player.queue.remove();
            this.lavaJS.emit("queueOver", player);
          }
          break;
        case "TrackStuckEvent":
          player.queue.remove();
          if (player.skipOnError) player.play();
          this.lavaJS.emit("trackStuck", track, player, msg);
          break;
        case "TrackExceptionEvent":
          player.queue.remove();
          if (player.skipOnError) player.play();
          this.lavaJS.emit("trackError", track, player, msg);
          break;
        case "WebSocketClosedEvent":
          if ([4009, 4015].includes(code))
            this.lavaJS.wsSend({
              op: 4,
              d: {
                guild_id: guildId,
                channel_id: player.options.voiceChannel.id,
                self_mute: false,
                self_deaf: player.options.deafen || false,
              },
            });
          this.lavaJS.emit("socketClosed", this, msg);
          break;
      }
    } else {
      // If the message has an unknown OP
      this.lavaJS.emit(
        "nodeError",
        this,
        new Error(`Unknown error/event with op ${op} and data ${msg}!`)
      );
    }
  }
  /**
   * Send data to the node's websocket
   * @param {Object} data - The data packet
   * @returns {Promise<Boolean>}
   */
  wsSend(data) {
    new Promise((res, rej) => {
      const formattedData = JSON.stringify(data);
      if (!this.online) res(false);
      if (!formattedData || !formattedData.startsWith("{"))
        rej(`The data was not in the proper format.`);
      this.con.send(
        formattedData,
        { compress: false, binary: false, fin: false, mask: false },
        (err) => {
          err ? rej(err) : res(true);
        }
      );
    }).catch((err) => {
      if (err) throw new Error(err);
    });
  }
}
exports.LavaNode = LavaNode;
