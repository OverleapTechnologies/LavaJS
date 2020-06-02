class Player {
  /**
   * The player class which plays the music
   * @param {LavaClient} lavaJS - The LavaClient.
   * @param {PlayerOptions} options - The player options.
   */
  constructor(lavaJS, options) {
    this.lavaJS = lavaJS;
    this.options = options;

    // Node this player uses
    this.node = this.lavaJS.optimisedNode;

    // Establish a Discord voice connection
    this.lavaJS.wsSend({
      op: 4,
      d: {
        guild_id: options.guild.id,
        channel_id: options.voiceChannel.id,
        self_deaf: options.Deafen,
        self_mute: false,
      },
    });

    this.lavaJS.playerCollection.set(options.guild.id, this);
    this.lavaJS.emit("createPlayer", this);
  }

  play() {}
}

module.exports.Player = Player;
