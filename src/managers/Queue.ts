"use strict";

import { Track } from "../utils/Interfaces";
import { Player } from "./Player";

export class Queue extends Array {
  public readonly player: Player;
  /**
   * Creates a new Queue
   * @param {Player} player - The player to which this queue belongs.
   */
  constructor(player: Player) {
    super();
    this.player = player;
  }

  /**
   * Get the number of songs in the queue
   * @return {Number}
   */
  public get size(): number {
    return this.length;
  }

  /**
   * Get the total duration of your current queue
   * @return {Number}
   */
  public get duration(): number {
    return this.map((x) => x.length).reduce((acc, val) => acc + val, 0);
  }

  /**
   * Whether the queue is empty
   * @return {Boolean}
   */
  public get empty(): boolean {
    return !this.length;
  }

  /**
   * Add a track or playlist to the queue
   * @param {Track|Array<Track>} data - The track or playlist data.
   */
  public add(data: Track | Track[]): void {
    if (!data)
      throw new Error(
        `Queue#add() Provided argument is not of type "Track" or "Track[]".`
      );

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        this.push(data[i]);
      }
    } else {
      this.push(data);
    }
  }

  /**
   * Removes a single track from the queue and returns it
   * @param {Number} [pos=0] - The track's position.
   * @return {Track|null} track - The removed track or null.
   */
  public remove(pos: number = 0): Track | null {
    const track = this.splice(pos, 1)[0];
    if (track) return track;
  }

  /**
   * Removes all tracks in the given range and returns the array
   * @param {Number} [start=0] - The starting point.
   * @param {Number} end - The ending point.
   * @return {Array<Track>} track - The array of tracks.
   */
  public wipe(start: number = 0, end: number): Track[] {
    if (!start) throw new RangeError(`Queue#wipe() "start" parameter missing.`);
    if (!end) throw new RangeError(`Queue#wipe() "end" parameter missing.`);
    if (start >= end)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than end.`
      );
    if (start >= this.size)
      throw new RangeError(
        `Queue#wipe() Start parameter must be smaller than queue length.`
      );

    const trackArr: Track[] = this.splice(start, end);
    if (trackArr) return trackArr;
  }

  /**
   * Clears the whole queue
   */
  public clear(): void {
    this.splice(0);
  }
}
