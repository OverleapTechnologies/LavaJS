declare class Queue extends Array {
  constructor(lavaJS: any);
  get size(): number;
  get duration(): any;
  get empty(): boolean;
  add(data: any): void;
  remove(pos?: number): any;
  wipe(start: any, end: any): any[] | undefined;
  clear(): void;
}
export { Queue };
