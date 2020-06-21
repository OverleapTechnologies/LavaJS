import { Player } from "./Player";
import { Track } from "../utils/Interfaces";
import { Cache } from "../utils/Cache";

export class Queue extends Cache<number, Track> {
  public readonly player: Player;

  /**
   * Creates a new Queue
   * @param {Player} player - The player to which this queue belongs.
   * @extends Cache
   */
  constructor(player: Player) {
    super();
    this.player = player;
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
    return !this.size;
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
        this.set(this.size + 1, data[i]);
      }
    } else {
      this.set(this.size + 1, data);
    }
  }

  /**
   * Removes a single track from the queue
   * @param {Number} [pos=1] - The track's position.
   * @return {Track|undefined} track - The removed track or null.
   */
  public remove(pos: number = 1): Track | undefined {
    const track = this.get(pos);
    this.delete(pos);
    return track;
  }

  /**
   * Removes all tracks in the given range
   * @param {Number} start - The starting point.
   * @param {Number} end - The ending point.
   * @return {Array<Track>} track - The array of tracks.
   */
  public wipe(start: number, end: number): Track[] {
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

    const trackArr: Track[] = [];
    for (let i = start; i === end; i++) {
      const track: Track | undefined = this.get(i);
      if (track) trackArr.push(track);
      this.delete(i);
    }
    return trackArr;
  }

  /**
   * Clears the whole queue
   */
  public clearQueue(): void {
    this.clear();
  }

  /**
   * Move a track to a new position
   * @param {Number} from - The original position of the track.
   * @param {Number} to - The new position.
   */
  public moveTrack(from: number, to: number): void {
    if (!from)
      throw new RangeError(`Queue#moveTrack() "from" parameter missing.`);
    if (!to) throw new RangeError(`Queue#moveTrack() "to" parameter missing.`);
    if (to > this.size)
      throw new RangeError(
        `Queue#moveTrack() The new position cannot be greater than ${this.size}.`
      );
    if (this.player.playing && (to === 1 || from === 1))
      throw new Error(
        `Queue#moveTrack() Cannot change position or replace currently playing track.`
      );

    const arr = [...this.values()];
    const track: Track = arr.splice(from - 1, 1)[0];
    if (!track)
      throw new RangeError(
        `Queue#moveTrack() No track found at the given position.`
      );

    arr.splice(to, 0, track);
    this.clearQueue();
    for (let i = 0; i < arr.length; i++) {
      this.set(i + 1, arr[i]);
    }
  }
}
