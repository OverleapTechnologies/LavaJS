import { EventEmitter } from "events";
declare class LavaClient extends EventEmitter {
  constructor(client: any, node: any, shards: any);
  wsSend(data: any): void;
  spawnPlayer(lavaJS: any, options: any): any;
  get optimisedNode(): any;
}
export { LavaClient };
