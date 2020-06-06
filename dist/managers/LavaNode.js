const WebSocket = require("ws");

class LavaNode {
  /**
   * Create new LavaNode class instance
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {NodeOptions} options - The LavaNode options.
   */
  constructor(lavaJS, options) {
    this.lavaJS = lavaJS;
    this.options = options;

    // The node stats
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
     * The node connection status
     * @type {{doRetry: Number, calls: Number, attempts: Number}}
     */
    this.conStatus = {
      attempts: 0,
      doRetry: 5,
      calls: 0,
    };

    // Establish a WebSocket connection
    this.connect();
  }

  // The node connection status
  get online() {
    if (!this.con) return false;
    return this.con.readyState === WebSocket.OPEN;
  }

  // Connect to a node
  connect() {
    const headers = {
      Authorization: this.options.password,
      "Num-Shards": this.lavaJS.shards,
      "User-Id": this.lavaJS.client.user.id,
    };
    this.con = new WebSocket(
      `ws://${this.options.host}:${this.options.port}/`,
      "",
      { headers }
    );
    this.con.on("open", this.onConnect.bind(this));
    this.con.on("error", this.onError.bind(this));
    this.con.on("close", this.onClose.bind(this));
    this.con.on("message", this.handleResponse.bind(this));
  }

  // Handles successful connections
  onConnect() {
    if (this.reconnectModule) clearTimeout(this.reconnectModule);
    this.lavaJS.emit("nodeSuccess", this);
  }

  // Handles closed connections
  onClose(code) {
    this.lavaJS.emit(
      "nodeClose",
      this,
      new Error(`Connection closed with code: ${code}`)
    );
    if (code !== 1000) this.reconnect();
  }

  // Handles connection errors
  onError(error) {
    if (!error) return;
    this.lavaJS.emit("nodeError", this, error);
    this.reconnect();
  }

  // Reconnects the node if something goes wrong
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

  // Kills the node
  kill() {
    if (!this.online) return;
    this.con.close(1000, "destroy");
    this.con.removeEventListener();
    this.con = null;
  }

  // Handle any incoming data
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

      // Handle track event messages
      switch (type) {
        case "TrackEndEvent":
          break;

        case "TrackStuckEvent":
          break;

        case "WebSocketClosedEvent":
          if ([4009, 4015].includes(code))
            this.lavaJS.wsSend({
              op: 4,
              d: {
                guild_id: guildId,
                channel_id: player.voiceChannel.id || player.voiceChannel,
                self_mute: false,
                self_deaf: player.Deafen || false,
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
}

module.exports.LavaNode = LavaNode;
