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
   * @param {Object} data
   * @param {*} user
   * @returns {Tracks}
   */
  searchTrack(data, user) {
    const selectedTrack = data.length;
    if (!(selectedTrack || data || Array.isArray(data)))
      throw new Error(`searchTrack() The "data" must be LavaLink search.`);
    const tracksData = {
      trackCount: selectedTrack,
      tracks: [],
    };
    for (let i = 0; i < selectedTrack; i++)
      tracksData.tracks.push(this.newTrack(data[i], user));
    return tracksData;
  },
  /**
   * Make a new playlist
   * @param {Object} data - The playlist data from LavaLink.
   * @param {*} user - The user to requested the playlist.
   * @returns {Playlist}
   */
  newPlaylist(data, trackArray, user) {
    const selectedTrack = trackArray.length;
    const { name } = data;
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
