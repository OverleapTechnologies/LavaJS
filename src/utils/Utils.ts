import { User } from "discord.js";
import { Playlist, Track } from "./Interfaces";

export class Utils {
  /**
   * Make a new track
   * @param {*} data - The track data from LavaLink.
   * @param {User} user - The user to requested the track.
   * @return {Track}
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
   * @param {User} user - The user to requested the playlist.
   * @return {Playlist}
   */
  public static newPlaylist(data: any, user: User): Playlist {
    const { name, trackCount, tracks: trackArray } = data;
    if (!(name || trackCount || trackArray || Array.isArray(trackArray)))
      throw new Error(`newPlaylist() The "data" must be LavaLink playlist.`);

    const playlistData: any = {
      name: name,
      trackCount: trackCount,
      duration: trackArray
        .map((t: any) => t.info.length)
        .reduce((acc: number, val: number) => acc + val, 0),
      tracks: [],
    };

    for (let i: number = 0; i < trackCount; i++)
      playlistData.tracks.push(this.newTrack(trackArray[i], user));

    return playlistData;
  }

  /**
   * Format the track or playlist duration
   * @param {Number} ms - The duration in milliseconds
   * @return {String} time - The formatted timestamp
   */
  public static formatTime(ms: number): string {
    let s: number, m: number, h: number, d: number;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;

    const arr: Array<number> = [s, m, h, d];
    const res: Array<string> = [];
    for (const v of arr) {
      let first = false;
      if (v < 1 && !first) continue;
      res.push(v < 10 ? `0${v}` : `${v}`);
      first = true;
    }

    return res.join(":");
  }
}
