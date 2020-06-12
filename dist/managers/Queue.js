"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
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
    //@ts-ignore
    if (!data instanceof Object)
      throw new Error(
        `Queue#add() Provided argument is not of type "Track" or "Playlist".`
      );
    if (data.tracks && Array.isArray(data.tracks)) {
      for (let i = 0; i < data.trackCount; i++) {
        //@ts-ignore
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
  wipe(start = 0, end) {
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
exports.Queue = Queue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUXVldWUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9TcmMvbWFuYWdlcnMvUXVldWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsTUFBTSxLQUFNLFNBQVEsS0FBSztJQUV2Qjs7O09BR0c7SUFDSCxZQUFZLE1BQVc7UUFDckIsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN2QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksSUFBSTtRQUNOLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksUUFBUTtRQUNWLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN0QixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsR0FBRyxDQUFDLElBQXlDO1FBQzNDLFlBQVk7UUFDWixJQUFJLENBQUMsSUFBSSxZQUFZLE1BQU07WUFDekIsTUFBTSxJQUFJLEtBQUssQ0FDYixxRUFBcUUsQ0FDdEUsQ0FBQztRQUVKLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUM3QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDeEMsWUFBWTtnQkFDWixJQUFJLENBQUMsQ0FBQyxZQUFZLE1BQU07b0JBQUUsU0FBUztnQkFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNkO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7SUFDSCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILE1BQU0sQ0FBQyxNQUFjLENBQUM7UUFDcEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckMsSUFBSSxLQUFLO1lBQUUsT0FBTyxLQUFLLENBQUM7SUFDMUIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsSUFBSSxDQUFDLFFBQTRCLENBQUMsRUFBRSxHQUF1QjtRQUN6RCxJQUFJLEtBQUssS0FBSyxTQUFTO1lBQ3JCLE1BQU0sSUFBSSxVQUFVLENBQUMseUNBQXlDLENBQUMsQ0FBQztRQUNsRSxJQUFJLEdBQUcsS0FBSyxTQUFTO1lBQ25CLE1BQU0sSUFBSSxVQUFVLENBQUMsdUNBQXVDLENBQUMsQ0FBQztRQUNoRSxJQUFJLEtBQUssSUFBSSxHQUFHO1lBQ2QsTUFBTSxJQUFJLFVBQVUsQ0FDbEIsd0RBQXdELENBQ3pELENBQUM7UUFDSixJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsSUFBSTtZQUNwQixNQUFNLElBQUksVUFBVSxDQUNsQixpRUFBaUUsQ0FDbEUsQ0FBQztRQUVKLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLElBQUksUUFBUTtZQUFFLE9BQU8sUUFBUSxDQUFDO0lBQ2hDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUs7UUFDSCxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7Q0FDRjtBQUVRLHNCQUFLIiwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgUXVldWUgZXh0ZW5kcyBBcnJheSB7XG4gIGxhdmFKUzogYW55O1xuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IFF1ZXVlXG4gICAqIEBwYXJhbSB7TGF2YUNsaWVudH0gbGF2YUpTIC0gVGhlIExhdmFDbGllbnQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihsYXZhSlM6IGFueSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5sYXZhSlMgPSBsYXZhSlM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2Ygc29uZ3MgaW4gdGhlIHF1ZXVlXG4gICAqIEByZXR1cm4ge051bWJlcn1cbiAgICogQHJlYWRvbmx5XG4gICAqL1xuICBnZXQgc2l6ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB0b3RhbCBkdXJhdGlvbiBvZiB5b3VyIGN1cnJlbnQgcXVldWVcbiAgICogQHJldHVybiB7TnVtYmVyfVxuICAgKiBAcmVhZG9ubHlcbiAgICovXG4gIGdldCBkdXJhdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAoKHgpID0+IHguZHVyYXRpb24pLnJlZHVjZSgoYWNjLCB2YWwpID0+IGFjYyArIHZhbCwgMCk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgcXVldWUgaXMgZW1wdHlcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICogQHJlYWRvbmx5XG4gICAqL1xuICBnZXQgZW1wdHkoKSB7XG4gICAgcmV0dXJuICF0aGlzLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSB0cmFjayBvciBwbGF5bGlzdCB0byB0aGUgcXVldWVcbiAgICogQHBhcmFtIHtUcmFja3xQbGF5bGlzdH0gZGF0YSAtIFRoZSB0cmFjayBvciBwbGF5bGlzdCBkYXRhLlxuICAgKi9cbiAgYWRkKGRhdGE6IHsgdHJhY2tzOiBhbnk7IHRyYWNrQ291bnQ6IG51bWJlciB9KSB7XG4gICAgLy9AdHMtaWdub3JlXG4gICAgaWYgKCFkYXRhIGluc3RhbmNlb2YgT2JqZWN0KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgUXVldWUjYWRkKCkgUHJvdmlkZWQgYXJndW1lbnQgaXMgbm90IG9mIHR5cGUgXCJUcmFja1wiIG9yIFwiUGxheWxpc3RcIi5gXG4gICAgICApO1xuXG4gICAgaWYgKGRhdGEudHJhY2tzICYmIEFycmF5LmlzQXJyYXkoZGF0YS50cmFja3MpKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEudHJhY2tDb3VudDsgaSsrKSB7XG4gICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICBpZiAoIWkgaW5zdGFuY2VvZiBPYmplY3QpIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLnB1c2goaSk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucHVzaChkYXRhKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIHNpbmdsZSB0cmFjayBmcm9tIHRoZSBxdWV1ZSBhbmQgcmV0dXJucyBpdFxuICAgKiBAcGFyYW0ge051bWJlcn0gW3Bvcz0wXSAtIFRoZSB0cmFjaydzIHBvc2l0aW9uLlxuICAgKiBAcmV0dXJuIHtUcmFja3xudWxsfSB0cmFjayAtIFRoZSByZW1vdmVkIHRyYWNrIG9yIG51bGwuXG4gICAqL1xuICByZW1vdmUocG9zOiBudW1iZXIgPSAwKSB7XG4gICAgY29uc3QgdHJhY2sgPSB0aGlzLnNwbGljZShwb3MsIDEpWzBdO1xuICAgIGlmICh0cmFjaykgcmV0dXJuIHRyYWNrO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYWxsIHRyYWNrcyBpbiB0aGUgZ2l2ZW4gcmFuZ2UgYW5kIHJldHVybnMgdGhlIGFycmF5XG4gICAqIEBwYXJhbSB7TnVtYmVyfSBbc3RhcnQ9MF0gLSBUaGUgc3RhcnRpbmcgcG9pbnQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbmQgLSBUaGUgZW5kaW5nIHBvaW50LlxuICAgKiBAcmV0dXJuIHtBcnJheTxUcmFjaz59IHRyYWNrIC0gVGhlIGFycmF5IG9mIHRyYWNrcy5cbiAgICovXG4gIHdpcGUoc3RhcnQ6IG51bWJlciB8IHVuZGVmaW5lZCA9IDAsIGVuZDogbnVtYmVyIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpXG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgUXVldWUjd2lwZSgpIFwic3RhcnRcIiBwYXJhbWV0ZXIgbWlzc2luZy5gKTtcbiAgICBpZiAoZW5kID09PSB1bmRlZmluZWQpXG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihgUXVldWUjd2lwZSgpIFwiZW5kXCIgcGFyYW1ldGVyIG1pc3NpbmcuYCk7XG4gICAgaWYgKHN0YXJ0ID49IGVuZClcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgICBgUXVldWUjd2lwZSgpIFN0YXJ0IHBhcmFtZXRlciBtdXN0IGJlIHNtYWxsZXIgdGhhbiBlbmQuYFxuICAgICAgKTtcbiAgICBpZiAoc3RhcnQgPj0gdGhpcy5zaXplKVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgIGBRdWV1ZSN3aXBlKCkgU3RhcnQgcGFyYW1ldGVyIG11c3QgYmUgc21hbGxlciB0aGFuIHF1ZXVlIGxlbmd0aC5gXG4gICAgICApO1xuXG4gICAgY29uc3QgdHJhY2tBcnIgPSB0aGlzLnNwbGljZShzdGFydCwgZW5kKTtcbiAgICBpZiAodHJhY2tBcnIpIHJldHVybiB0cmFja0FycjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIHdob2xlIHF1ZXVlXG4gICAqL1xuICBjbGVhcigpIHtcbiAgICB0aGlzLnNwbGljZSgwKTtcbiAgfVxufVxuXG5leHBvcnQgeyBRdWV1ZSB9O1xuIl19
