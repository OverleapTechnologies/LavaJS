declare class Player {
  constructor(lavaJS: any, options: any, node: any);
  get playing(): any;
  play(): void;
  lavaSearch(query: any, add: boolean | undefined, user: any): Promise<unknown>;
  stop(): void;
  pause(): void;
  resume(): void;
  seek(position: any): void;
  setVolume(volume: any): void;
  destroy(guildId: any): void;
}
export { Player };
