"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
//@ts-nocheck
const Queue_1 = require("./Queue");
const fetch = require("node-fetch");
const { newTrack, newPlaylist } = require("../utils/Utils");
class Player {
    /**
     * The player class which plays the music
     * @param {LavaClient} lavaJS - The LavaClient.
     * @param {PlayerOptions} options - The player options.
     * @param {LavaNode} [node=optimisedNode] - The node to use.
     */
    constructor(lavaJS, options, node) {
        this.lavaJS = lavaJS;
        // Readonly
        /**
         * The player options
         * @type {PlayerOptions}
         * @readonly
         */
        this.options = options;
        /**
         * The current playing state
         * @type {Boolean}
         * @readonly
         */
        this.playState = false;
        /**
         * The player node
         * @type {LavaNode}
         * @readonly
         */
        this.node = node || this.lavaJS.optimisedNode;
        /**
         * The current track position
         * @type {Number}
         * @readonly
         */
        this.position = 0;
        /**
         * The volume of the player
         * @type {Number}
         * @readonly
         */
        this.volume = 100;
        // Public properties
        /**
         * The queue of this player
         * @type {Queue}
         */
        this.queue = new Queue_1.Queue(this.lavaJS);
        /**
         * Whether the track is set on repeat
         * @type {Boolean}
         */
        this.repeatTrack = options.trackRepeat || false;
        /**
         * Whether the queue is set on repeat
         * @type {Boolean}
         */
        this.repeatQueue = options.queueRepeat || false;
        /**
         * Whether to skip to next song on error
         * @type {Boolean}
         */
        this.skipOnError = options.skipOnError || false;
        // Establish a Discord voice connection
        this.lavaJS.wsSend({
            op: 4,
            d: {
                guild_id: options.guild.id,
                channel_id: options.voiceChannel.id,
                self_deaf: options.deafen || false,
                self_mute: false,
            },
        });
        this.lavaJS.playerCollection.set(options.guild.id, this);
        this.lavaJS.emit("createPlayer", this);
    }
    /**
     * Whether the player is playing
     * @return {Boolean}
     * @readonly
     */
    get playing() {
        return this.playState;
    }
    /**
     * Play the next track in the queue
     */
    play() {
        if (this.queue.size <= 0)
            throw new RangeError(`Player#play() No tracks in the queue.`);
        if (this.playState) {
            const currTrack = this.queue.remove();
            if (this.options.queueRepeat && currTrack)
                this.queue.add(currTrack);
        }
        const track = this.queue[0];
        this.node
            .wsSend({
            op: "play",
            track: track.trackString,
            guildId: this.options.guild.id,
        })
            .then(() => {
            this.lavaJS.emit("trackPlay", this, track);
            this.playState = true;
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Search a track or playlist from YouTube
     * @param {String} query - The song or playlist name or link.
     * @param {Boolean} [add=false] - Add to the queue automatically if response is a track.
     * @param {*} user - The user who requested the track.
     * @return {Promise<Track|Playlist>} result - The search data can be single track or playlist.
     */
    lavaSearch(query, add = true, user) {
        return new Promise((resolve, reject) => {
            const search = new RegExp(/^https?:\/\//g).test(query)
                ? query
                : `ytsearch:${query}`;
            const { loadType, playlistInfo, tracks, exception } = fetch(`http://${this.node.options.host}:${this.node.options.port}/loadtracks`, {
                headers: { Authorization: this.node.options.password },
                params: { identifier: search },
            })
                .json()
                .then((res) => res)
                .catch((err) => reject(err));
            switch (loadType) {
                // Successful loading
                case "TRACK_LOADED":
                    const trackData = newTrack(tracks[0], user);
                    if (!add)
                        return trackData;
                    this.queue.add(trackData);
                    resolve(trackData);
                    break;
                case "PLAYLIST_LOADED":
                    const playlist = newPlaylist(playlistInfo, user);
                    resolve(playlist);
                    break;
                // Error loading
                case "NO_MATCHES":
                    reject(new Error(`Player#lavaSearch() No result found for the search query.`));
                    break;
                case "LOAD_FAILED":
                    const { message, severity } = exception;
                    reject(new Error(`Player#lavaSearch() ${message} (Severity: ${severity}).`));
                    break;
            }
        });
    }
    /**
     * Stops the player
     */
    stop() {
        this.node
            .wsSend({
            op: "stop",
            guildId: this.options.guild.id,
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Pauses the track if player is resumed
     */
    pause() {
        if (!this.playState)
            throw new Error(`Player#pause() The player is already paused.`);
        this.node
            .wsSend({
            op: "pause",
            guildId: this.options.guild.id,
            pause: true,
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Resumes the track if player is paused
     */
    resume() {
        if (this.playState)
            throw new Error(`Player#resume() The player is already resumed.`);
        this.node
            .wsSend({
            op: "pause",
            guildId: this.options.guild.id,
            pause: false,
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Seek the track to a timestamp
     * @param {Number} position - The position to seek to.
     */
    seek(position) {
        if (this.queue.empty)
            throw new RangeError(`Player#seek() No tracks in queue.`);
        if (isNaN(position))
            throw new RangeError(`Player#seek() The provided position is not a number.`);
        if (position < 0 || position > this.queue[0].duration)
            throw new RangeError(`Player#seek() The provided position must be in between 0 and ${this.queue[0].duration}.`);
        this.position = position;
        this.node
            .wsSend({
            op: "seek",
            guildId: this.options.guild.id,
            position: position,
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Sets player volume
     * @param {Number} volume - The new volume.
     */
    setVolume(volume) {
        if (isNaN(volume))
            throw new RangeError(`Player#volume() The provided volume is not a number.`);
        if (volume < 0 || volume > 1000)
            throw new RangeError(`Player#setVolume() Provided volume must be in between 0 and 1000.`);
        this.volume = volume;
        this.node
            .wsSend({
            op: "seek",
            guildId: this.options.guild.id,
            volume: volume,
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
    /**
     * Destroy the player
     * @param {Snowflake} guildId - The ID of the guild
     */
    destroy(guildId) {
        const toDestroy = this.lavaJS.playerCollection.get(guildId);
        if (!toDestroy)
            throw new Error(`Player#destroy() No players found for that guild.`);
        this.lavaJS.wsSend({
            op: 4,
            d: {
                guild_id: guildId,
                channel_id: null,
                self_deaf: false,
                self_mute: false,
            },
        });
        this.node
            .wsSend({
            op: "destroy",
            guildId: guildId,
        })
            .then(() => {
            this.lavaJS.emit("destroyPlayer", toDestroy);
            this.lavaJS.playerCollection.delete(guildId);
        })
            .catch((err) => {
            throw new Error(err);
        });
    }
}
exports.Player = Player;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGxheWVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vU3JjL21hbmFnZXJzL1BsYXllci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxhQUFhO0FBQ2IsbUNBQWdDO0FBQ2hDLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNwQyxNQUFNLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRzVELE1BQU0sTUFBTTtJQUNWOzs7OztPQUtHO0lBQ0gsWUFBWSxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUk7UUFDL0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsV0FBVztRQUNYOzs7O1dBSUc7UUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUV2Qjs7OztXQUlHO1FBQ0gsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFFdkI7Ozs7V0FJRztRQUNILElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO1FBRTlDOzs7O1dBSUc7UUFDSCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztRQUVsQjs7OztXQUlHO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7UUFFbEIsb0JBQW9CO1FBQ3BCOzs7V0FHRztRQUNILElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXBDOzs7V0FHRztRQUNILElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUM7UUFFaEQ7OztXQUdHO1FBQ0gsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLENBQUMsV0FBVyxJQUFJLEtBQUssQ0FBQztRQUVoRDs7O1dBR0c7UUFDSCxJQUFJLENBQUMsV0FBVyxH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b3J0IHsgUXVldWUgfSBmcm9tIFwiLi9RdWV1ZVwiO1xuY29uc3QgZmV0Y2ggPSByZXF1aXJlKFwibm9kZS1mZXRjaFwiKTtcbmNvbnN0IHsgbmV3VHJhY2ssIG5ld1BsYXlsaXN0IH0gPSByZXF1aXJlKFwiLi4vdXRpbHMvVXRpbHNcIik7XG5pbXBvcnQgeyBMYXZhQ2xpZW50IH0gZnJvbSBcIi4vTGF2YUNsaWVudFwiO1xuXG5jbGFzcyBQbGF5ZXIge1xuICAvKipcbiAgICogVGhlIHBsYXllciBjbGFzcyB3aGljaCBwbGF5cyB0aGUgbXVzaWNcbiAgICogQHBhcmFtIHtMYXZhQ2xpZW50fSBsYXZhSlMgLSBUaGUgTGF2YUNsaWVudC5cbiAgICogQHBhcmFtIHtQbGF5ZXJPcHRpb25zfSBvcHRpb25zIC0gVGhlIHBsYXllciBvcHRpb25zLlxuICAgKiBAcGFyYW0ge0xhdmFOb2RlfSBbbm9kZT1vcHRpbWlzZWROb2RlXSAtIFRoZSBub2RlIHRvIHVzZS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGxhdmFKUywgb3B0aW9ucywgbm9kZSkge1xuICAgIHRoaXMubGF2YUpTID0gbGF2YUpTO1xuICAgIC8vIFJlYWRvbmx5XG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllciBvcHRpb25zXG4gICAgICogQHR5cGUge1BsYXllck9wdGlvbnN9XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHBsYXlpbmcgc3RhdGVcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICB0aGlzLnBsYXlTdGF0ZSA9IGZhbHNlO1xuXG4gICAgLyoqXG4gICAgICogVGhlIHBsYXllciBub2RlXG4gICAgICogQHR5cGUge0xhdmFOb2RlfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHRoaXMubm9kZSA9IG5vZGUgfHwgdGhpcy5sYXZhSlMub3B0aW1pc2VkTm9kZTtcblxuICAgIC8qKlxuICAgICAqIFRoZSBjdXJyZW50IHRyYWNrIHBvc2l0aW9uXG4gICAgICogQHR5cGUge051bWJlcn1cbiAgICAgKiBAcmVhZG9ubHlcbiAgICAgKi9cbiAgICB0aGlzLnBvc2l0aW9uID0gMDtcblxuICAgIC8qKlxuICAgICAqIFRoZSB2b2x1bWUgb2YgdGhlIHBsYXllclxuICAgICAqIEB0eXBlIHtOdW1iZXJ9XG4gICAgICogQHJlYWRvbmx5XG4gICAgICovXG4gICAgdGhpcy52b2x1bWUgPSAxMDA7XG5cbiAgICAvLyBQdWJsaWMgcHJvcGVydGllc1xuICAgIC8qKlxuICAgICAqIFRoZSBxdWV1ZSBvZiB0aGlzIHBsYXllclxuICAgICAqIEB0eXBlIHtRdWV1ZX1cbiAgICAgKi9cbiAgICB0aGlzLnF1ZXVlID0gbmV3IFF1ZXVlKHRoaXMubGF2YUpTKTtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHRyYWNrIGlzIHNldCBvbiByZXBlYXRcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnJlcGVhdFRyYWNrID0gb3B0aW9ucy50cmFja1JlcGVhdCB8fCBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdGhlIHF1ZXVlIGlzIHNldCBvbiByZXBlYXRcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnJlcGVhdFF1ZXVlID0gb3B0aW9ucy5xdWV1ZVJlcGVhdCB8fCBmYWxzZTtcblxuICAgIC8qKlxuICAgICAqIFdoZXRoZXIgdG8gc2tpcCB0byBuZXh0IHNvbmcgb24gZXJyb3JcbiAgICAgKiBAdHlwZSB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICB0aGlzLnNraXBPbkVycm9yID0gb3B0aW9ucy5za2lwT25FcnJvciB8fCBmYWxzZTtcblxuICAgIC8vIEVzdGFibGlzaCBhIERpc2NvcmQgdm9pY2UgY29ubmVjdGlvblxuICAgIHRoaXMubGF2YUpTLndzU2VuZCh7XG4gICAgICBvcDogNCxcbiAgICAgIGQ6IHtcbiAgICAgICAgZ3VpbGRfaWQ6IG9wdGlvbnMuZ3VpbGQuaWQsXG4gICAgICAgIGNoYW5uZWxfaWQ6IG9wdGlvbnMudm9pY2VDaGFubmVsLmlkLFxuICAgICAgICBzZWxmX2RlYWY6IG9wdGlvbnMuZGVhZmVuIHx8IGZhbHNlLFxuICAgICAgICBzZWxmX211dGU6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMubGF2YUpTLnBsYXllckNvbGxlY3Rpb24uc2V0KG9wdGlvbnMuZ3VpbGQuaWQsIHRoaXMpO1xuICAgIHRoaXMubGF2YUpTLmVtaXQoXCJjcmVhdGVQbGF5ZXJcIiwgdGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogV2hldGhlciB0aGUgcGxheWVyIGlzIHBsYXlpbmdcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICogQHJlYWRvbmx5XG4gICAqL1xuICBnZXQgcGxheWluZygpIHtcbiAgICByZXR1cm4gdGhpcy5wbGF5U3RhdGU7XG4gIH1cblxuICAvKipcbiAgICogUGxheSB0aGUgbmV4dCB0cmFjayBpbiB0aGUgcXVldWVcbiAgICovXG4gIHBsYXkoKSB7XG4gICAgaWYgKHRoaXMucXVldWUuc2l6ZSA8PSAwKVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFBsYXllciNwbGF5KCkgTm8gdHJhY2tzIGluIHRoZSBxdWV1ZS5gKTtcbiAgICBpZiAodGhpcy5wbGF5U3RhdGUpIHtcbiAgICAgIGNvbnN0IGN1cnJUcmFjayA9IHRoaXMucXVldWUucmVtb3ZlKCk7XG4gICAgICBpZiAodGhpcy5vcHRpb25zLnF1ZXVlUmVwZWF0ICYmIGN1cnJUcmFjaykgdGhpcy5xdWV1ZS5hZGQoY3VyclRyYWNrKTtcbiAgICB9XG4gICAgY29uc3QgdHJhY2sgPSB0aGlzLnF1ZXVlWzBdO1xuICAgIHRoaXMubm9kZVxuICAgICAgLndzU2VuZCh7XG4gICAgICAgIG9wOiBcInBsYXlcIixcbiAgICAgICAgdHJhY2s6IHRyYWNrLnRyYWNrU3RyaW5nLFxuICAgICAgICBndWlsZElkOiB0aGlzLm9wdGlvbnMuZ3VpbGQuaWQsXG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmxhdmFKUy5lbWl0KFwidHJhY2tQbGF5XCIsIHRoaXMsIHRyYWNrKTtcbiAgICAgICAgdGhpcy5wbGF5U3RhdGUgPSB0cnVlO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogU2VhcmNoIGEgdHJhY2sgb3IgcGxheWxpc3QgZnJvbSBZb3VUdWJlXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBxdWVyeSAtIFRoZSBzb25nIG9yIHBsYXlsaXN0IG5hbWUgb3IgbGluay5cbiAgICogQHBhcmFtIHtCb29sZWFufSBbYWRkPWZhbHNlXSAtIEFkZCB0byB0aGUgcXVldWUgYXV0b21hdGljYWxseSBpZiByZXNwb25zZSBpcyBhIHRyYWNrLlxuICAgKiBAcGFyYW0geyp9IHVzZXIgLSBUaGUgdXNlciB3aG8gcmVxdWVzdGVkIHRoZSB0cmFjay5cbiAgICogQHJldHVybiB7UHJvbWlzZTxUcmFja3xQbGF5bGlzdD59IHJlc3VsdCAtIFRoZSBzZWFyY2ggZGF0YSBjYW4gYmUgc2luZ2xlIHRyYWNrIG9yIHBsYXlsaXN0LlxuICAgKi9cbiAgbGF2YVNlYXJjaChxdWVyeSwgYWRkID0gdHJ1ZSwgdXNlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCBzZWFyY2ggPSBuZXcgUmVnRXhwKC9eaHR0cHM/OlxcL1xcLy9nKS50ZXN0KHF1ZXJ5KVxuICAgICAgICA/IHF1ZXJ5XG4gICAgICAgIDogYHl0c2VhcmNoOiR7cXVlcnl9YDtcblxuICAgICAgY29uc3QgeyBsb2FkVHlwZSwgcGxheWxpc3RJbmZvLCB0cmFja3MsIGV4Y2VwdGlvbiB9ID0gZmV0Y2goXG4gICAgICAgIGBodHRwOi8vJHt0aGlzLm5vZGUub3B0aW9ucy5ob3N0fToke3RoaXMubm9kZS5vcHRpb25zLnBvcnR9L2xvYWR0cmFja3NgLFxuICAgICAgICB7XG4gICAgICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiB0aGlzLm5vZGUub3B0aW9ucy5wYXNzd29yZCB9LFxuICAgICAgICAgIHBhcmFtczogeyBpZGVudGlmaWVyOiBzZWFyY2ggfSxcbiAgICAgICAgfVxuICAgICAgKVxuICAgICAgICAuanNvbigpXG4gICAgICAgIC50aGVuKChyZXMpID0+IHJlcylcbiAgICAgICAgLmNhdGNoKChlcnIpID0+IHJlamVjdChlcnIpKTtcblxuICAgICAgc3dpdGNoIChsb2FkVHlwZSkge1xuICAgICAgICAvLyBTdWNjZXNzZnVsIGxvYWRpbmdcbiAgICAgICAgY2FzZSBcIlRSQUNLX0xPQURFRFwiOlxuICAgICAgICAgIGNvbnN0IHRyYWNrRGF0YSA9IG5ld1RyYWNrKHRyYWNrc1swXSwgdXNlcik7XG4gICAgICAgICAgaWYgKCFhZGQpIHJldHVybiB0cmFja0RhdGE7XG4gICAgICAgICAgdGhpcy5xdWV1ZS5hZGQodHJhY2tEYXRhKTtcbiAgICAgICAgICByZXNvbHZlKHRyYWNrRGF0YSk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcIlBMQVlMSVNUX0xPQURFRFwiOlxuICAgICAgICAgIGNvbnN0IHBsYXlsaXN0ID0gbmV3UGxheWxpc3QocGxheWxpc3RJbmZvLCB1c2VyKTtcbiAgICAgICAgICByZXNvbHZlKHBsYXlsaXN0KTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICAvLyBFcnJvciBsb2FkaW5nXG4gICAgICAgIGNhc2UgXCJOT19NQVRDSEVTXCI6XG4gICAgICAgICAgcmVqZWN0KFxuICAgICAgICAgICAgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgUGxheWVyI2xhdmFTZWFyY2goKSBObyByZXN1bHQgZm91bmQgZm9yIHRoZSBzZWFyY2ggcXVlcnkuYFxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcIkxPQURfRkFJTEVEXCI6XG4gICAgICAgICAgY29uc3QgeyBtZXNzYWdlLCBzZXZlcml0eSB9ID0gZXhjZXB0aW9uO1xuICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgIG5ldyBFcnJvcihgUGxheWVyI2xhdmFTZWFyY2goKSAke21lc3NhZ2V9IChTZXZlcml0eTogJHtzZXZlcml0eX0pLmApXG4gICAgICAgICAgKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdG9wcyB0aGUgcGxheWVyXG4gICAqL1xuICBzdG9wKCkge1xuICAgIHRoaXMubm9kZVxuICAgICAgLndzU2VuZCh7XG4gICAgICAgIG9wOiBcInN0b3BcIixcbiAgICAgICAgZ3VpbGRJZDogdGhpcy5vcHRpb25zLmd1aWxkLmlkLFxuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUGF1c2VzIHRoZSB0cmFjayBpZiBwbGF5ZXIgaXMgcmVzdW1lZFxuICAgKi9cbiAgcGF1c2UoKSB7XG4gICAgaWYgKCF0aGlzLnBsYXlTdGF0ZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGxheWVyI3BhdXNlKCkgVGhlIHBsYXllciBpcyBhbHJlYWR5IHBhdXNlZC5gKTtcblxuICAgIHRoaXMubm9kZVxuICAgICAgLndzU2VuZCh7XG4gICAgICAgIG9wOiBcInBhdXNlXCIsXG4gICAgICAgIGd1aWxkSWQ6IHRoaXMub3B0aW9ucy5ndWlsZC5pZCxcbiAgICAgICAgcGF1c2U6IHRydWUsXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXN1bWVzIHRoZSB0cmFjayBpZiBwbGF5ZXIgaXMgcGF1c2VkXG4gICAqL1xuICByZXN1bWUoKSB7XG4gICAgaWYgKHRoaXMucGxheVN0YXRlKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBQbGF5ZXIjcmVzdW1lKCkgVGhlIHBsYXllciBpcyBhbHJlYWR5IHJlc3VtZWQuYCk7XG5cbiAgICB0aGlzLm5vZGVcbiAgICAgIC53c1NlbmQoe1xuICAgICAgICBvcDogXCJwYXVzZVwiLFxuICAgICAgICBndWlsZElkOiB0aGlzLm9wdGlvbnMuZ3VpbGQuaWQsXG4gICAgICAgIHBhdXNlOiBmYWxzZSxcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlZWsgdGhlIHRyYWNrIHRvIGEgdGltZXN0YW1wXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBwb3NpdGlvbiAtIFRoZSBwb3NpdGlvbiB0byBzZWVrIHRvLlxuICAgKi9cbiAgc2Vlayhwb3NpdGlvbikge1xuICAgIGlmICh0aGlzLnF1ZXVlLmVtcHR5KVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoYFBsYXllciNzZWVrKCkgTm8gdHJhY2tzIGluIHF1ZXVlLmApO1xuICAgIGlmIChpc05hTihwb3NpdGlvbikpXG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcbiAgICAgICAgYFBsYXllciNzZWVrKCkgVGhlIHByb3ZpZGVkIHBvc2l0aW9uIGlzIG5vdCBhIG51bWJlci5gXG4gICAgICApO1xuICAgIGlmIChwb3NpdGlvbiA8IDAgfHwgcG9zaXRpb24gPiB0aGlzLnF1ZXVlWzBdLmR1cmF0aW9uKVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgIGBQbGF5ZXIjc2VlaygpIFRoZSBwcm92aWRlZCBwb3NpdGlvbiBtdXN0IGJlIGluIGJldHdlZW4gMCBhbmQgJHt0aGlzLnF1ZXVlWzBdLmR1cmF0aW9ufS5gXG4gICAgICApO1xuXG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uO1xuICAgIHRoaXMubm9kZVxuICAgICAgLndzU2VuZCh7XG4gICAgICAgIG9wOiBcInNlZWtcIixcbiAgICAgICAgZ3VpbGRJZDogdGhpcy5vcHRpb25zLmd1aWxkLmlkLFxuICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHBsYXllciB2b2x1bWVcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZvbHVtZSAtIFRoZSBuZXcgdm9sdW1lLlxuICAgKi9cbiAgc2V0Vm9sdW1lKHZvbHVtZSkge1xuICAgIGlmIChpc05hTih2b2x1bWUpKVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgIGBQbGF5ZXIjdm9sdW1lKCkgVGhlIHByb3ZpZGVkIHZvbHVtZSBpcyBub3QgYSBudW1iZXIuYFxuICAgICAgKTtcbiAgICBpZiAodm9sdW1lIDwgMCB8fCB2b2x1bWUgPiAxMDAwKVxuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICAgIGBQbGF5ZXIjc2V0Vm9sdW1lKCkgUHJvdmlkZWQgdm9sdW1lIG11c3QgYmUgaW4gYmV0d2VlbiAwIGFuZCAxMDAwLmBcbiAgICAgICk7XG5cbiAgICB0aGlzLnZvbHVtZSA9IHZvbHVtZTtcbiAgICB0aGlzLm5vZGVcbiAgICAgIC53c1NlbmQoe1xuICAgICAgICBvcDogXCJzZWVrXCIsXG4gICAgICAgIGd1aWxkSWQ6IHRoaXMub3B0aW9ucy5ndWlsZC5pZCxcbiAgICAgICAgdm9sdW1lOiB2b2x1bWUsXG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXN0cm95IHRoZSBwbGF5ZXJcbiAgICogQHBhcmFtIHtTbm93Zmxha2V9IGd1aWxkSWQgLSBUaGUgSUQgb2YgdGhlIGd1aWxkXG4gICAqL1xuICBkZXN0cm95KGd1aWxkSWQpIHtcbiAgICBjb25zdCB0b0Rlc3Ryb3kgPSB0aGlzLmxhdmFKUy5wbGF5ZXJDb2xsZWN0aW9uLmdldChndWlsZElkKTtcbiAgICBpZiAoIXRvRGVzdHJveSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihgUGxheWVyI2Rlc3Ryb3koKSBObyBwbGF5ZXJzIGZvdW5kIGZvciB0aGF0IGd1aWxkLmApO1xuXG4gICAgdGhpcy5sYXZhSlMud3NTZW5kKHtcbiAgICAgIG9wOiA0LFxuICAgICAgZDoge1xuICAgICAgICBndWlsZF9pZDogZ3VpbGRJZCxcbiAgICAgICAgY2hhbm5lbF9pZDogbnVsbCxcbiAgICAgICAgc2VsZl9kZWFmOiBmYWxzZSxcbiAgICAgICAgc2VsZl9tdXRlOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLm5vZGVcbiAgICAgIC53c1NlbmQoe1xuICAgICAgICBvcDogXCJkZXN0cm95XCIsXG4gICAgICAgIGd1aWxkSWQ6IGd1aWxkSWQsXG4gICAgICB9KVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICB0aGlzLmxhdmFKUy5lbWl0KFwiZGVzdHJveVBsYXllclwiLCB0b0Rlc3Ryb3kpO1xuICAgICAgICB0aGlzLmxhdmFKUy5wbGF5ZXJDb2xsZWN0aW9uLmRlbGV0ZShndWlsZElkKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCB7IFBsYXllciB9O1xuIl19