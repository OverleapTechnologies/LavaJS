import { Player } from "./Player";
import { QueueOptions, Track } from "../utils/Interfaces";
import { Cache } from "../utils/Cache";

export class Queue extends Cache<number, Track> {
  public readonly player: Player;

  /**
   * Whether to repeat the current track
   */
  public repeatTrack: boolean;
  /**
   * Whether to repeat the queue
   */
  public repeatQueue: boolean;
  /**
   * Whether to skip the song on a track error
   */
  public skipOnError: boolean;

  /**
   * Creates a new Queue
   * @param {Player} player - The player to which this queue belongs.
   * @param {QueueOptions} options - The options for queue.
   * @extends Cache
   */
  constructor(player: Player, options: QueueOptions) {
    super();
    this.player = player;

    this.repeatTrack = options.trackRepeat || false;
    this.repeatQueue = options.queueRepeat || false;
    this.skipOnError = options.skipOnError || false;
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
   * Toggle the track or queue repeat feature (No parameter disables both)
   * @param {"track" | "playlist"} [type] - Whether to repeat the track or queue.
   * @return {Boolean} state - The new repeat state.
   */
  public toggleRepeat(type?: "track" | "queue"): boolean {
    if (type === "track") {
      this.repeatTrack = true;
      this.repeatQueue = false;
      return this.repeatTrack;
    } else if (type === "queue") {
      this.repeatQueue = true;
      this.repeatTrack = false;
      return this.repeatQueue;
    } else {
      this.repeatQueue = false;
      this.repeatTrack = false;
      return false;
    }
  }

  /**
   * Add a track or playlist to the queue
   * @param {Track|Array<Track>} data - The track or playlist data.
   */
  public add(data: Track | Track[]): void {
    if (!data)
      throw new TypeError(
        `Queue#add() Provided argument is not of type "Track" or "Track[]".`
      );

    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        this.set(this.lastKey + 1, data[i]);
      }
    } else {
      this.set(this.lastKey + 1, data);
    }
  }

  /**
   * Removes a single track from the queue
   * @param {Number} [pos=0] - The track's position.
   * @return {Track|undefined} track - The removed track or null.
   */
  public remove(pos?: number): Track | undefined {
    const track = this.KVArray()[pos || 0];
    this.delete(track[0]);
    return track[1];
  }

  /**
   * Removes all tracks in the given range
   * @param {Number} start - The starting key.
   * @param {Number} end - The ending key.
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
      const track = this.get(i);
      trackArr.push(track!);
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
    if (this.player.playing && (to === 0 || from === 0))
      throw new Error(
        `Queue#moveTrack() Cannot change position or replace currently playing track.`
      );

    const arr = [...this.values()];
    const track = arr.splice(from, 1)[0];
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
