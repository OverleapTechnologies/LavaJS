class Queue extends Array {
  /**
   * Create a new Queue
   * @param {LavaClient} lavaJS - The LavaClient.
   */
  constructor(lavaJS) {
    super();
    this.lavaJS = lavaJS;
  }

  /**
   * Get the number of songs in the queue
   * @return {Number}
   * @readonly
   */
  get size() {
    return this.length;
  }

  /**
   * Get the total duration of your current queue
   * @return {Number}
   * @readonly
   */
  get duration() {
    return this.map((x) => x.duration).reduce((acc, val) => acc + val, 0);
  }

  /**
   * Whether the queue is empty
   * @return {Boolean}
   * @readonly
   */
  get empty() {
    return !this.length;
  }

  /**
   * Add a track or playlist to the queue
   * @param {Track|Playlist} data - The track or playlist data.
   */
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

  /**
   * Removes a single track from the queue and returns it
   * @param {Number} [pos=0] - The track's position.
   * @return {Track|null} track - The removed track or null.
   */
  remove(pos = 0) {
    const track = this.splice(pos, 1)[0];
    if (track) return track;
  }

  /**
   * Removes all tracks in the given range and returns the array
   * @param {Number} [start=0] - The starting point.
   * @param {Number} end - The ending point.
   * @return {Array<Track>} track - The array of tracks.
   */
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

  /**
   * Clears the whole queue
   */
  clear() {
    this.splice(0);
  }
}

module.exports.Queue = Queue;
