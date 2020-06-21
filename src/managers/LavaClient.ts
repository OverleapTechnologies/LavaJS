import { EventEmitter } from "events";
import { LavaNode } from "./LavaNode";
import { Player } from "./Player";
import { Cache } from "../utils/Cache";
import { NodeOptions, PlayerOptions } from "../utils/Interfaces";
import { VoiceChannel } from "discord.js";
const states: Map<string, any> = new Map<string, any>();

export class LavaClient extends EventEmitter {
  /**
   * The discord client
   */
  public readonly client: any;
  /**
   * Node options for the client
   */
  public readonly nodeOptions: NodeOptions[];
  /**
   * Number of shards of the client
   */
  public readonly shards: number = 1;
  /**
   * Collection of nodes of the client
   */
  public readonly nodeCollection: Cache<string, LavaNode>;
  /**
   * Collection of players of the client
   */
  public readonly playerCollection: Cache<string, Player>;

  /**
   * Emitted when a node is connected
   * @event LavaClient#nodeSuccess
   * @param {LavaNode} node - The node which connected.
   */
  /**
   * Emitted when a node reconnects
   * @event LavaClient#nodeReconnect
   * @param {LavaNode} node - The node which is reconnecting.
   */
  /**
   * Emitted on a node error
   * @event LavaClient#nodeError
   * @param {LavaNode} node - The node which encountered the error.
   * @param {Error} error - The error message.
   */
  /**
   * Emitted when a node closes
   * @event LavaClient#nodeClose
   * @param {LavaNode} node - The node which was closed.
   * @param {Error} error - The error message.
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
   * Emitted when a queue ends
   * @event LavaClient#queueOver
   * @param {Player} player - Player whose queue ended.
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
   * Creates a new LavaJSClient class instance
   * @param {*} client - The Discord client.
   * @param {Array<NodeOptions>} node - The LavaNode to use.
   * @extends EventEmitter
   */
  public constructor(client: any, node: NodeOptions[]) {
    super();

    this.client = client;
    this.nodeOptions = node;
    this.shards = client.ws.shards.size;

    this.nodeCollection = new Cache();
    this.playerCollection = new Cache();

    if (!this.nodeOptions || !this.nodeOptions.length)
      throw new Error("[ClientError] No nodes provided!");

    for (let x of this.nodeOptions) {
      if (this.nodeCollection.has(x.host)) continue;

      const newNode = new LavaNode(this, x);
      this.nodeCollection.set(x.host, newNode);
    }

    this.client.on("raw", this.handleStateUpdate.bind(this));
  }

  /**
   * Send data to Discord via WebSocket.
   * @param {*} data - The data packet to send.
   */
  public wsSend(data: any): void {
    if (!this.client) return;
    const guild = this.client.guilds.cache.get(data.d.guild_id);
    if (guild && this.shards > 1) {
      guild.shard.send(data);
    } else if (guild) {
      this.client.ws.shards.get(0).send(data);
    }
  }

  /**
   * Creates a new LavaJS player or returns old one if player exists
   * @param {PlayerOptions} options - The player options.
   * @return {Player} player - The new player.
   */
  public spawnPlayer(options: PlayerOptions): Player {
    if (!options.guild)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.guild.`
      );
    if (!options.voiceChannel)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.voiceChannel.`
      );
    if (!options.textChannel)
      throw new Error(
        `LavaClient#spawnPlayer() Could not resolve PlayerOptions.textChannel.`
      );

    const oldPlayer: Player | undefined = this.playerCollection.get(
      options.guild.id
    );
    if (oldPlayer) return oldPlayer;

    return new Player(this, options, this.optimisedNode);
  }

  /**
   * Returns the node with least resource usage
   * @return {LavaNode}
   */
  public get optimisedNode(): LavaNode {
    const sorted: LavaNode[] = this.nodeCollection
      .toArray()
      .filter((x) => x.online)
      .sort((a, b) => {
        const loadA = (a.stats.cpu.systemLoad / a.stats.cpu.cores) * 100;
        const loadB = (b.stats.cpu.systemLoad / b.stats.cpu.cores) * 100;
        return loadB - loadA;
      });
    return sorted[0];
  }

  /**
   * Handles discord's voice state updates
   * @param {*} data - The data packet from discord
   */
  private handleStateUpdate(data: any): void {
    if (!["VOICE_STATE_UPDATE", "VOICE_SERVER_UPDATE"].includes(data.t)) return;
    if (data.d.user_id && data.d.user_id !== this.client.user.id) return;

    const player: Player | undefined = this.playerCollection.get(
      data.d.guild_id
    );
    if (!player) return;
    const voiceState: any = states.get(data.d.guild_id) || {};

    switch (data.t) {
      case "VOICE_STATE_UPDATE":
        voiceState.op = "voiceUpdate";
        voiceState.sessionId = data.d.session_id;

        if (player.options.voiceChannel.id !== data.d.channel_id) {
          const newChannel: VoiceChannel = this.client.channels.cache.get(
            data.d.channel_id
          );
          if (newChannel) player.options.voiceChannel = newChannel;
        }
        break;

      case "VOICE_SERVER_UPDATE":
        voiceState.guildId = data.d.guild_id;
        voiceState.event = data.d;
        break;
    }

    states.set(data.d.guild_id, voiceState);
    const { op, guildId, sessionId, event } = voiceState;

    if (op && guildId && sessionId && event) {
      player.node
        .wsSend(voiceState)
        .then(() => states.set(guildId, {}))
        .catch((err) => {
          if (err) throw new Error(err);
        });
    }
  }
}
