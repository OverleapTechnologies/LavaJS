"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const LavaNode_1 = require("./LavaNode");
const Player_1 = require("./Player");

class LavaClient extends events_1.EventEmitter {
  constructor(client, node, shards) {
    super();
    this.client = client;
    this.nodes = node;
    this.shards = shards || 1;
    this.nodeCollection = new Map();
    this.playerCollection = new Map();
    if (!this.nodes || !this.nodes.length)
      throw new Error("[ClientError] No nodes provided!");
    for (let x of this.nodes) {
      if (this.nodeCollection.has(x.host)) continue;
      const newNode = new LavaNode_1.LavaNode(this, x);
      this.nodeCollection.set(x.host, newNode);
    }
  }

  wsSend(data) {
    if (!this.client) return;
    const guild = this.client.guilds.cache.get(data.d.guild_id);
    if (guild && this.client.ws.shards) {
      guild.shard.send(data);
    } else if (guild) {
      this.client.ws.send(data);
    }
  }

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
