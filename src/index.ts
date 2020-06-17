"use strict";

import { Utils } from "./utils/Utils";
import { LavaClient } from "./managers/LavaClient";
import { Player } from "./managers/Player";
import { LavaNode } from "./managers/LavaNode";
import { Queue } from "./managers/Queue";

export = {
  LavaClient,
  Player,
  LavaNode,
  Queue,
  newTrack: Utils.newTrack,
  newPlaylist: Utils.newPlaylist,
  formatTime: Utils.formatTime,
};
