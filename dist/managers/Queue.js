"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

class Queue extends Array {
  constructor(lavaJS) {
    super();
    this.lavaJS = lavaJS;
  }

  get size() {
    return this.length;
  }

  get duration() {
    return this.map((x) => x.duration).reduce((acc, val) => acc + val, 0);
  }

  get empty() {
    return !this.length;
  }

  add(data) {
    if (!data instanceof Object)
      throw new Error(
        `Queue#add() Provided argument is not of type "Track" or "Playlist".`
      );
    if (data.tracks && Array.isArray(data.tracks)) {
      for (let i = 0; i < data.trackCount; i++) {
        if (!i instanceof Object) continue;
        this.push(i);
      }
    } else {
      this.push(data);
    }
  }

  remove(pos = 0) {
    const track = this.splice(pos, 1)[0];
    if (track) return track;
  }

  wipe(start, end) {
    if (start === undefined)
      throw new RangeError(`Queue#wipe() "start" parameter missing.`);
    if (end === undefined)
      throw new RangeError(`Queue#wipe() "end" parameter missing.`);
    if (start >= end)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than end.`
      );
    if (start >= this.size)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than queue length.`
      );
    const trackArr = this.splice(start, end);
    if (trackArr) return trackArr;
  }

  clear() {
    this.splice(0);
  }
}

exports.Queue = Queue;
