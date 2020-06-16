import { User } from "discord.js";
import { Playlist, Track } from "./Interfaces";

export class Utils {
  /**
   * Make a new track
   * @param {*} data - The track data from LavaLink.
   * @param {*} user - The user to requested the track.
   * @returns {Track}
   */
  public static newTrack(data: any, user: User): Track {
    const trackData: any = {};
    if (!data.info || !data.track)
      throw new Error(`newTrack() The "data" must be a LavaLink track.`);

    Object.assign(trackData, data.info);
    trackData.trackString = data.track;
    trackData.thumbnail = {
      default: `https://img.youtube.com/vi/${data.info.identifier}/default.jpg`,
      medium: `https://img.youtube.com/vi/${data.info.identifier}/mqdefault.jpg`,
      high: `https://img.youtube.com/vi/${data.info.identifier}/hqdefault.jpg`,
      standard: `https://img.youtube.com/vi/${data.info.identifier}/sddefault.jpg`,
      max: `https://img.youtube.com/vi/${data.info.identifier}/maxresdefault.jpg`,
    };
    trackData.user = user;
    return trackData;
  }

  /**
   * Make a new playlist
   * @param {*} data - The playlist data from LavaLink.
   * @param {*} user - The user to requested the playlist.
   * @returns {Playlist}
   */
  public static newPlaylist(data: any, user: User): Playlist {
    const { name, trackCount, tracks: trackArray } = data;
    if (!(name || trackCount || trackArray || Array.isArray(trackArray)))
      throw new Error(`newPlaylist() The "data" must be LavaLink playlist.`);

    const playlistData: any = {
      name: name,
      trackCount: trackCount,
      duration: trackArray
        .map((t) => t.info.length)
        .reduce((acc, val) => acc + val, 0),
      tracks: [],
    };

    for (let i: number = 0; i < trackCount; i++)
      playlistData.tracks.push(this.newTrack(trackArray[i], user));

    return playlistData;
  }
}
