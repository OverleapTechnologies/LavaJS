import WebSocket from "ws";
import { LavaClient } from "./LavaClient";
import { Player } from "./Player";
import { NodeOptions, NodeStats, Track } from "../utils/Interfaces";

export class LavaNode {
  public readonly lavaJS: LavaClient;
  /**
   * The options for the node
   */
  public readonly options: NodeOptions;
  /**
   * The node's system status
   */
  public stats: NodeStats;
  /**
   * The node's connection status
   */
  private readonly conStatus: { doRetry: number; attempts: number };
  /**
   * The websocket connection
   */
  public con!: WebSocket | null;
  /**
   * Handles the reconnect
   */
  private reconnectModule: NodeJS.Timeout | undefined;

  /**
   * Create new LavaNode class instance
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {NodeOptions} options - The LavaNode options.
   */
  constructor(lavaJS: LavaClient, options: NodeOptions) {
    this.lavaJS = lavaJS;
    this.options = options;

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

    this.conStatus = {
      attempts: 0,
      doRetry: 5,
    };

    this.connect();
  }

  /**
   * The node's system usage status
   * @return {NodeStats}
   * @readonly
   */
  public get systemStats(): NodeStats {
    return this.stats;
  }

  /**
   * The node's connection status
   * @return {Boolean}
   * @readonly
   */
  public get online(): boolean {
    if (!this.con) return false;
    return this.con.readyState === WebSocket.OPEN;
  }

  /**
   * Establish a node websocket connection
   */
  public connect(): void {
    const headers: any = {
      Authorization: this.options.password,
      "Num-Shards": this.lavaJS.shards,
      "User-Id": this.lavaJS.client.user.id,
    };
    this.con = new WebSocket(
      `ws://${this.options.host}:${this.options.port}/`,
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
  private onConnect(): void {
    if (this.reconnectModule) clearTimeout(this.reconnectModule);
    this.lavaJS.emit("nodeSuccess", this);
  }

  /**
   * Handles close connection events
   * @param {Number} code - The error code
   * @param {String} reason - The reason
   */
  private onClose(code: number, reason: string): void {
    this.lavaJS.emit(
      "nodeClose",
      this,
      new Error(`Connection closed with code: ${code} and reason: ${reason}`)
    );
    if (code !== 1000 || reason !== "destroy") this.reconnect();
  }

  /**
   * Handles connection errors
   * @param {Error} error - The error message
   */
  private onError(error: Error): void {
    if (!error) return;
    this.lavaJS.emit("nodeError", this, error);
    this.reconnect();
  }

  /**
   * Reconnect to the node if disconnected
   */
  public reconnect(): void {
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
      this.con!.removeAllListeners();
      this.con = null;
      this.lavaJS.emit("nodeReconnect", this);
      this.connect();
      this.conStatus.attempts++;
    }, 3e4);
  }

  /**
   * Destroys the node
   */
  public kill(): void {
    if (!this.online) return;
    this.con!.close(1000, "destroy");
    this.con!.removeAllListeners();
    this.con = null;
    this.lavaJS.nodeCollection.delete(this.options.host);
  }

  /**
   * Handle any incoming data from the node
   */
  private handleResponse(data: any): void {
    const msg: any = JSON.parse(data.toString());
    const { op, type, code, guildId, state } = msg;
    if (!op) return;

    if (op !== "event") {
      // Handle non-track event messages
      switch (op) {
        case "stats":
          this.stats = Object.assign({}, msg);
          delete (this.stats as any).op;
          break;

        case "playerUpdate":
          const player: Player | undefined = this.lavaJS.playerCollection.get(
            guildId
          );
          if (player) player.position = state.position || 0;
          break;
      }
    } else if (op === "event") {
      if (!guildId) return;
      const player: Player | undefined = this.lavaJS.playerCollection.get(
        guildId
      );
      if (!player) return;
      player.playState = false;
      const track: Track = player.queue.first;

      // Handle track event messages
      switch (type) {
        case "TrackStartEvent":
          player.playState = true;
          this.lavaJS.emit("trackPlay", track, player);
          break;

        case "TrackEndEvent":
          if (!track) return;
          if (track && player.repeatTrack) {
            player.play();
          } else if (track && player.repeatQueue) {
            const toAdd: Track | undefined = player.queue.remove();
            if (toAdd) player.queue.add(toAdd);
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
          if (!track) return;
          player.queue.remove();
          if (player.skipOnError) player.play();
          this.lavaJS.emit("trackStuck", track, player, msg);
          break;

        case "TrackExceptionEvent":
          if (!track) return;
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
  public wsSend(data: Object): Promise<boolean> {
    return new Promise((res, rej) => {
      if (!this.online) res(false);

      const formattedData: string = JSON.stringify(data);
      if (!formattedData || !formattedData.startsWith("{"))
        rej(`The data was not in the proper format.`);

      this.con!.send(formattedData, (err) => {
        err ? rej(err) : res(true);
      });
    });
  }
}
