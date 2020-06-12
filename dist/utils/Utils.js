"use strict";
module.exports = {
  /**
   * Make a new track
   * @param {Object} data - The track data from LavaLink.
   * @param {*} user - The user to requested the track.
   * @returns {Track}
   */
  newTrack(data, user) {
    const trackData = {};
    if (!data.info || !data.track)
      throw new Error(`newTrack() The "data" must be a LavaLink track.`);
    Object.assign(trackData, data.info);
    trackData.trackString = data.track;
    trackData.thumbnail = {
      default: `https://img.youtube.com/vi/${data.identifier}/default.jpg`,
      medium: `https://img.youtube.com/vi/${data.identifier}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${data.identifier}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${data.identifier}/sddefault.jpg`,
      max: `https://img.youtube.com/vi/${data.identifier}/maxresdefault.jpg`,
    };
    trackData.user = user;
    return trackData;
  },
  /**
   * Make a new playlist
   * @param {Object} data - The playlist data from LavaLink.
   * @param {*} user - The user to requested the playlist.
   * @returns {Playlist}
   */
  newPlaylist(data, user) {
    const { name, selectedTrack, tracks: trackArray } = data;
    if (!(name || selectedTrack || trackArray || Array.isArray(trackArray)))
      throw new Error(`newPlaylist() The "data" must be LavaLink playlist.`);
    const playlistData = {
      name: name,
      trackCount: selectedTrack,
      duration: trackArray
        .map((t) => t.info.length)
        .reduce((acc, val) => acc + val, 0),
      tracks: [],
    };
    for (let i = 0; i < selectedTrack; i++)
      playlistData.tracks.push(this.newTrack(trackArray[i], user));
    return playlistData;
  },
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9TcmMvdXRpbHMvVXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLGlCQUFTO0lBQ1A7Ozs7O09BS0c7SUFDSCxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUk7UUFDakIsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUs7WUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDO1FBRXJFLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQyxTQUFTLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkMsU0FBUyxDQUFDLFNBQVMsR0FBRztZQUNwQixPQUFPLEVBQUUsOEJBQThCLElBQUksQ0FBQyxVQUFVLGNBQWM7WUFDcEUsTUFBTSxFQUFFLDhCQUE4QixJQUFJLENBQUMsVUFBVSxnQkFBZ0I7WUFDckUsSUFBSSxFQUFFLDhCQUE4QixJQUFJLENBQUMsVUFBVSxnQkFBZ0I7WUFDbkUsUUFBUSxFQUFFLDhCQUE4QixJQUFJLENBQUMsVUFBVSxnQkFBZ0I7WUFDdkUsR0FBRyxFQUFFLDhCQUE4QixJQUFJLENBQUMsVUFBVSxvQkFBb0I7U0FDdkUsQ0FBQztRQUNGLFNBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ3RCLE9BQU8sU0FBUyxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSTtRQUNwQixNQUFNLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ3pELElBQUksQ0FBQyxDQUFDLElBQUksSUFBSSxhQUFhLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDckUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sWUFBWSxHQUFHO1lBQ25CLElBQUksRUFBRSxJQUFJO1lBQ1YsVUFBVSxFQUFFLGFBQWE7WUFDekIsUUFBUSxFQUFFLFVBQVU7aUJBQ2pCLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7aUJBQ3pCLE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sRUFBRSxFQUFFO1NBQ1gsQ0FBQztRQUVGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLEVBQUUsQ0FBQyxFQUFFO1lBQ3BDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFFL0QsT0FBTyxZQUFZLENBQUM7SUFDdEIsQ0FBQztDQUNGLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvL0B0cy1ub2NoZWNrXG5leHBvcnQgPSB7XG4gIC8qKlxuICAgKiBNYWtlIGEgbmV3IHRyYWNrXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhIC0gVGhlIHRyYWNrIGRhdGEgZnJvbSBMYXZhTGluay5cbiAgICogQHBhcmFtIHsqfSB1c2VyIC0gVGhlIHVzZXIgdG8gcmVxdWVzdGVkIHRoZSB0cmFjay5cbiAgICogQHJldHVybnMge1RyYWNrfVxuICAgKi9cbiAgbmV3VHJhY2soZGF0YSwgdXNlcikge1xuICAgIGNvbnN0IHRyYWNrRGF0YSA9IHt9O1xuICAgIGlmICghZGF0YS5pbmZvIHx8ICFkYXRhLnRyYWNrKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBuZXdUcmFjaygpIFRoZSBcImRhdGFcIiBtdXN0IGJlIGEgTGF2YUxpbmsgdHJhY2suYCk7XG5cbiAgICBPYmplY3QuYXNzaWduKHRyYWNrRGF0YSwgZGF0YS5pbmZvKTtcbiAgICB0cmFja0RhdGEudHJhY2tTdHJpbmcgPSBkYXRhLnRyYWNrO1xuICAgIHRyYWNrRGF0YS50aHVtYm5haWwgPSB7XG4gICAgICBkZWZhdWx0OiBgaHR0cHM6Ly9pbWcueW91dHViZS5jb20vdmkvJHtkYXRhLmlkZW50aWZpZXJ9L2RlZmF1bHQuanBnYCxcbiAgICAgIG1lZGl1bTogYGh0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLyR7ZGF0YS5pZGVudGlmaWVyfS9tcWRlZmF1bHQuanBnYCxcbiAgICAgIGhpZ2g6IGBodHRwczovL2ltZy55b3V0dWJlLmNvbS92aS8ke2RhdGEuaWRlbnRpZmllcn0vaHFkZWZhdWx0LmpwZ2AsXG4gICAgICBzdGFuZGFyZDogYGh0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLyR7ZGF0YS5pZGVudGlmaWVyfS9zZGRlZmF1bHQuanBnYCxcbiAgICAgIG1heDogYGh0dHBzOi8vaW1nLnlvdXR1YmUuY29tL3ZpLyR7ZGF0YS5pZGVudGlmaWVyfS9tYXhyZXNkZWZhdWx0LmpwZ2AsXG4gICAgfTtcbiAgICB0cmFja0RhdGEudXNlciA9IHVzZXI7XG4gICAgcmV0dXJuIHRyYWNrRGF0YTtcbiAgfSxcblxuICAvKipcbiAgICogTWFrZSBhIG5ldyBwbGF5bGlzdFxuICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIFRoZSBwbGF5bGlzdCBkYXRhIGZyb20gTGF2YUxpbmsuXG4gICAqIEBwYXJhbSB7Kn0gdXNlciAtIFRoZSB1c2VyIHRvIHJlcXVlc3RlZCB0aGUgcGxheWxpc3QuXG4gICAqIEByZXR1cm5zIHtQbGF5bGlzdH1cbiAgICovXG4gIG5ld1BsYXlsaXN0KGRhdGEsIHVzZXIpIHtcbiAgICBjb25zdCB7IG5hbWUsIHNlbGVjdGVkVHJhY2ssIHRyYWNrczogdHJhY2tBcnJheSB9ID0gZGF0YTtcbiAgICBpZiAoIShuYW1lIHx8IHNlbGVjdGVkVHJhY2sgfHwgdHJhY2tBcnJheSB8fCBBcnJheS5pc0FycmF5KHRyYWNrQXJyYXkpKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihgbmV3UGxheWxpc3QoKSBUaGUgXCJkYXRhXCIgbXVzdCBiZSBMYXZhTGluayBwbGF5bGlzdC5gKTtcblxuICAgIGNvbnN0IHBsYXlsaXN0RGF0YSA9IHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICB0cmFja0NvdW50OiBzZWxlY3RlZFRyYWNrLFxuICAgICAgZHVyYXRpb246IHRyYWNrQXJyYXlcbiAgICAgICAgLm1hcCgodCkgPT4gdC5pbmZvLmxlbmd0aClcbiAgICAgICAgLnJlZHVjZSgoYWNjLCB2YWwpID0+IGFjYyArIHZhbCwgMCksXG4gICAgICB0cmFja3M6IFtdLFxuICAgIH07XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGVjdGVkVHJhY2s7IGkrKylcbiAgICAgIHBsYXlsaXN0RGF0YS50cmFja3MucHVzaCh0aGlzLm5ld1RyYWNrKHRyYWNrQXJyYXlbaV0sIHVzZXIpKTtcblxuICAgIHJldHVybiBwbGF5bGlzdERhdGE7XG4gIH0sXG59O1xuIl19
