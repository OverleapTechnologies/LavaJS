declare class LavaNode {
  constructor(lavaJS: any, options: any);
  get systemStats(): {
    memory: any;
    cpu: any;
    uptime: any;
  };
  get online(): boolean;
  connect(): void;
  onConnect(): void;
  onClose(code: any): void;
  onError(error: any): void;
  reconnect(): void;
  kill(): void;
  handleResponse(data: any): void;
  wsSend(data: any): void;
}
export { LavaNode };
