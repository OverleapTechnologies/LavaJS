const { newTrack, newPlaylist } = require("./utils/Utils");

module.exports = {
  LavaClient: require("./managers/LavaClient").LavaClient,
  Player: require("./managers/Player").Player,
  LavaNode: require("./managers/LavaNode").LavaNode,
  Queue: require("./managers/Queue").Queue,
  newTrack,
  newPlaylist,
};
