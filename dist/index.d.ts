import { LavaClient } from "./managers/LavaClient";
import { Player } from "./managers/Player";
import { LavaNode } from "./managers/LavaNode";
import { Queue } from "./managers/Queue";
declare const _default: {
  LavaClient: typeof LavaClient;
  Player: typeof Player;
  LavaNode: typeof LavaNode;
  Queue: typeof Queue;
  newTrack: (data: any, user: any) => {};
  newPlaylist: (
    data: any,
    user: any
  ) => {
    name: any;
    trackCount: any;
    duration: any;
    tracks: never[];
  };
};
export = _default;
