"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LavaNode = void 0;
//@ts-nocheck
const ws_1 = __importDefault(require("ws"));
class LavaNode {
    /**
     * Create new LavaNode class instance
     * @param {LavaClient} lavaJS - The LavaClient.
     * @param {NodeOptions} options - The LavaNode options.
     */
    constructor(lavaJS, options) {
        this.lavaJS = lavaJS;
        /**
         * The options for the node
         * @type {NodeOptions}
         * @readonly
         */
        this.options = options;
        /**
         * The node system stats
         * @type {Object}
         * @private
         */
        this.stats = {
            playingPlayers: 0,
            memory: {
                reservable: 0,
                used: 0,
                free: 0,
                allocated: 0,
            },
            players: 0,
            cpu: {
                cores: 0,
                systemLoad: 0,
                lavalinkLoad: 0,
            },
            uptime: 0,
        };
        /**
         * Connection stats
         * @type {Object}
         * @private
         */
        this.conStatus = {
            attempts: 0,
            doRetry: 5,
        };
        // Establish a WebSocket connection
        this.connect();
    }
    /**
     * The node's system usage status
     * @return {Object}
     * @readonly
     */
    get systemStats() {
        return {
            memory: this.stats.memory,
            cpu: this.stats.cpu,
            uptime: this.stats.uptime,
        };
    }
    /**
     * The node's connection status
     * @return {Boolean}
     * @readonly
     */
    get online() {
        if (!this.con)
            return false;
        return this.con.readyState === ws_1.default.OPEN;
    }
    /**
     * Establish a node websocket connection
     */
    connect() {
        const headers = {
            Authorization: this.options.password,
            "Num-Shards": this.lavaJS.shards,
            "User-Id": this.lavaJS.client.user.id,
        };
        this.con = new ws_1.default(`ws://${this.options.host}:${this.options.port}/`, "", { headers });
        this.con.on("open", this.onConnect.bind(this));
        this.con.on("error", this.onError.bind(this));
        this.con.on("close", this.onClose.bind(this));
        this.con.on("message", this.handleResponse.bind(this));
    }
    /**
     * Handles successful connections
     */
    onConnect() {
        if (this.reconnectModule)
            clearTimeout(this.reconnectModule);
        this.lavaJS.emit("nodeSuccess", this);
    }
    /**
     * Handles close connection events
     * @param {Number} code - The error code
     */
    onClose(code) {
        this.lavaJS.emit("nodeClose", this, new Error(`Connection closed with code: ${code}`));
        if (code !== 1000)
            this.reconnect();
    }
    /**
     * Handles connection errors
     * @param {String} error - The error message
     */
    onError(error) {
        if (!error)
            return;
        this.lavaJS.emit("nodeError", this, error);
        this.reconnect();
    }
    /**
     * Reconnect to the node if disconnected
     */
    reconnect() {
        this.reconnectModule = setTimeout(() => {
            if (this.conStatus.attempts >= this.conStatus.doRetry) {
                this.lavaJS.emit("nodeError", this, new Error(`Failed to connect node after ${this.conStatus.attempts} tries!`));
                return this.kill();
            }
            this.lavaJS.emit("nodeReconnect", this);
            this.con.removeEventListener();
            this.con = null;
            this.connect();
            this.conStatus.attempts++;
        }, 3e4);
    }
    /**
     * Destroys the node
     */
    kill() {
        if (!this.online)
            return;
        this.con.close(1000, "destroy");
        this.con.removeEventListener();
        this.con = null;
        this.lavaJS.nodeCollection.delete(this.options.host);
    }
    /**
     * Handle any incoming data from the node
     */
    handleResponse(data) {
        const msg = JSON.parse(data.toString());
        const { op, type, code, guildId, state } = msg;
        if (!op)
            return;
        if (op !== "event") {
            // Handle non-track event messages
            switch (op) {
                case "stats":
                    this.stats = Object.assign({}, msg);
                    delete this.stats.op;
                    break;
                case "playerUpdate":
                    const player = this.lavaJS.playerCollection.get(guildId);
                    if (player)
                        player.position = state.position || 0;
                    break;
            }
        }
        else if (op === "event") {
            if (!guildId)
                return;
            // LavaJS player for that guild
            const player = this.lavaJS.playerCollection.get(guildId);
            const track = player.queue[0];
            player.playState = false;
            // Handle track event messages
            switch (type) {
                case "TrackEndEvent":
                    if (track && player.repeatTrack) {
                        player.play();
                    }
                    else if (track && player.repeatQueue) {
                        const track1 = player.queue.remove();
                        if (track1)
                            player.queue.add(track1);
                        player.play();
                    }
                    else if (track && player.queue.size > 1) {
                        player.queue.remove();
                        player.play();
                    }
                    else if (track && player.queue.size === 1) {
                        player.queue.remove();
                        this.lavaJS.emit("queueOver", player);
                    }
                    break;
                case "TrackStuckEvent":
                    player.queue.remove();
                    if (player.skipOnError)
                        player.play();
                    this.lavaJS.emit("trackStuck", track, player, msg);
                    break;
                case "TrackExceptionEvent":
                    player.queue.remove();
                    if (player.skipOnError)
                        player.play();
                    this.lavaJS.emit("trackError", track, player, msg);
                    break;
                case "WebSocketClosedEvent":
                    if ([4009, 4015].includes(code))
                        this.lavaJS.wsSend({
                            op: 4,
                            d: {
                                guild_id: guildId,
                                channel_id: player.options.voiceChannel.id,
                                self_mute: false,
                                self_deaf: player.options.deafen || false,
                            },
                        });
                    this.lavaJS.emit("socketClosed", this, msg);
                    break;
            }
        }
        else {
            // If the message has an unknown OP
            this.lavaJS.emit("nodeError", this, new Error(`Unknown error/event with op ${op} and data ${msg}!`));
        }
    }
    /**
     * Send data to the node's websocket
     * @param {Object} data - The data packet
     * @returns {Promise<Boolean>}
     */
    wsSend(data) {
        new Promise((res, rej) => {
            const formattedData = JSON.stringify(data);
            if (!this.online)
                res(false);
            if (!formattedData || !formattedData.startsWith("{"))
                rej(`The data was not in the proper format.`);
            this.con.send(formattedData, { compress: false, binary: false, fin: false, mask: false }, (err) => {
                err ? rej(err) : res(true);
            });
        }).catch((err) => {
            if (err)
                throw new Error(err);
        });
    }
}
exports.LavaNode = LavaNode;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF2YU5vZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9TcmMvbWFuYWdlcnMvTGF2YU5vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsYUFBYTtBQUNiLDRDQUEyQjtBQUUzQixNQUFNLFFBQVE7SUFDWjs7OztPQUlHO0lBQ0gsWUFBWSxNQUFNLEVBQUUsT0FBTztRQUN6QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUVyQjs7OztXQUlHO1FBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFFdkI7Ozs7V0FJRztRQUNILElBQUksQ0FBQyxLQUFLLEdBQUc7WUFDWCxjQUFjLEVBQUUsQ0FBQztZQUNqQixNQUFNLEVBQUU7Z0JBQ04sVUFBVSxFQUFFLENBQUM7Z0JBQ2IsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsSUFBSSxFQUFFLENBQUM7Z0JBQ1AsU0FBUyxFQUFFLENBQUM7YUFDYjtZQUNELE9BQU8sRUFBRSxDQUFDO1lBQ1YsR0FBRyxFQUFFO2dCQUNILEtBQUssRUFBRSxDQUFDO2dCQUNSLFVBQVUsRUFBRSxDQUFDO2dCQUNiLFlBQVksRUFBRSxDQUFDO2FBQ2hCO1lBQ0QsTUFBTSxFQUFFLENBQUM7U0FDVixDQUFDO1FBRUY7Ozs7V0FJRztRQUNILElBQUksQ0FBQyxTQUFTLEdBQUc7WUFDZixRQUFRLEVBQUUsQ0FBQztZQUNYLE9BQU8sRUFBRSxDQUFDO1NBQ1gsQ0FBQztRQUVGLG1DQUFtQztRQUNuQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxJQUFJLFdBQVc7UUFDYixPQUFPO1lBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUN6QixHQUFHLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU07U0FDMUIsQ0FBQztJQUNK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QkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBRVEsNEJBQVEiLCJzb3VyY2VzQ29udGVudCI6WyIvL0B0cy1ub2NoZWNrXG5pbXBvcnQgV2ViU29ja2V0IGZyb20gXCJ3c1wiO1xuXG5jbGFzcyBMYXZhTm9kZSB7XG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IExhdmFOb2RlIGNsYXNzIGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TGF2YUNsaWVudH0gbGF2YUpTIC0gVGhlIExhdmFDbGllbnQuXG4gICAqIEBwYXJhbSB7Tm9kZU9wdGlvbnN9IG9wdGlvbnMgLSBUaGUgTGF2YU5vZGUgb3B0aW9ucy5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGxhdmFKUywgb3B0aW9ucykge1xuICAgIHRoaXMubGF2YUpTID0gbGF2YUpTO1xuXG4gICAgLyoqXG4gICAgICogVGhlIG9wdGlvbnMgZm9yIHRoZSBub2RlXG4gICAgICogQHR5cGUge05vZGVPcHRpb25zfVxuICAgICAqIEByZWFkb25seVxuICAgICAqL1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbm9kZSBzeXN0ZW0gc3RhdHNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdGhpcy5zdGF0cyA9IHtcbiAgICAgIHBsYXlpbmdQbGF5ZXJzOiAwLFxuICAgICAgbWVtb3J5OiB7XG4gICAgICAgIHJlc2VydmFibGU6IDAsXG4gICAgICAgIHVzZWQ6IDAsXG4gICAgICAgIGZyZWU6IDAsXG4gICAgICAgIGFsbG9jYXRlZDogMCxcbiAgICAgIH0sXG4gICAgICBwbGF5ZXJzOiAwLFxuICAgICAgY3B1OiB7XG4gICAgICAgIGNvcmVzOiAwLFxuICAgICAgICBzeXN0ZW1Mb2FkOiAwLFxuICAgICAgICBsYXZhbGlua0xvYWQ6IDAsXG4gICAgICB9LFxuICAgICAgdXB0aW1lOiAwLFxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBDb25uZWN0aW9uIHN0YXRzXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHRoaXMuY29uU3RhdHVzID0ge1xuICAgICAgYXR0ZW1wdHM6IDAsXG4gICAgICBkb1JldHJ5OiA1LFxuICAgIH07XG5cbiAgICAvLyBFc3RhYmxpc2ggYSBXZWJTb2NrZXQgY29ubmVjdGlvblxuICAgIHRoaXMuY29ubmVjdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBub2RlJ3Mgc3lzdGVtIHVzYWdlIHN0YXR1c1xuICAgKiBAcmV0dXJuIHtPYmplY3R9XG4gICAqIEByZWFkb25seVxuICAgKi9cbiAgZ2V0IHN5c3RlbVN0YXRzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBtZW1vcnk6IHRoaXMuc3RhdHMubWVtb3J5LFxuICAgICAgY3B1OiB0aGlzLnN0YXRzLmNwdSxcbiAgICAgIHVwdGltZTogdGhpcy5zdGF0cy51cHRpbWUsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgbm9kZSdzIGNvbm5lY3Rpb24gc3RhdHVzXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqIEByZWFkb25seVxuICAgKi9cbiAgZ2V0IG9ubGluZSgpIHtcbiAgICBpZiAoIXRoaXMuY29uKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMuY29uLnJlYWR5U3RhdGUgPT09IFdlYlNvY2tldC5PUEVOO1xuICB9XG5cbiAgLyoqXG4gICAqIEVzdGFibGlzaCBhIG5vZGUgd2Vic29ja2V0IGNvbm5lY3Rpb25cbiAgICovXG4gIGNvbm5lY3QoKSB7XG4gICAgY29uc3QgaGVhZGVycyA9IHtcbiAgICAgIEF1dGhvcml6YXRpb246IHRoaXMub3B0aW9ucy5wYXNzd29yZCxcbiAgICAgIFwiTnVtLVNoYXJkc1wiOiB0aGlzLmxhdmFKUy5zaGFyZHMsXG4gICAgICBcIlVzZXItSWRcIjogdGhpcy5sYXZhSlMuY2xpZW50LnVzZXIuaWQsXG4gICAgfTtcbiAgICB0aGlzLmNvbiA9IG5ldyBXZWJTb2NrZXQoXG4gICAgICBgd3M6Ly8ke3RoaXMub3B0aW9ucy5ob3N0fToke3RoaXMub3B0aW9ucy5wb3J0fS9gLFxuICAgICAgXCJcIixcbiAgICAgIHsgaGVhZGVycyB9XG4gICAgKTtcbiAgICB0aGlzLmNvbi5vbihcIm9wZW5cIiwgdGhpcy5vbkNvbm5lY3QuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb24ub24oXCJlcnJvclwiLCB0aGlzLm9uRXJyb3IuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb24ub24oXCJjbG9zZVwiLCB0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jb24ub24oXCJtZXNzYWdlXCIsIHRoaXMuaGFuZGxlUmVzcG9uc2UuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlcyBzdWNjZXNzZnVsIGNvbm5lY3Rpb25zXG4gICAqL1xuICBvbkNvbm5lY3QoKSB7XG4gICAgaWYgKHRoaXMucmVjb25uZWN0TW9kdWxlKSBjbGVhclRpbWVvdXQodGhpcy5yZWNvbm5lY3RNb2R1bGUpO1xuICAgIHRoaXMubGF2YUpTLmVtaXQoXCJub2RlU3VjY2Vzc1wiLCB0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBIYW5kbGVzIGNsb3NlIGNvbm5lY3Rpb24gZXZlbnRzXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjb2RlIC0gVGhlIGVycm9yIGNvZGVcbiAgICovXG4gIG9uQ2xvc2UoY29kZSkge1xuICAgIHRoaXMubGF2YUpTLmVtaXQoXG4gICAgICBcIm5vZGVDbG9zZVwiLFxuICAgICAgdGhpcyxcbiAgICAgIG5ldyBFcnJvcihgQ29ubmVjdGlvbiBjbG9zZWQgd2l0aCBjb2RlOiAke2NvZGV9YClcbiAgICApO1xuICAgIGlmIChjb2RlICE9PSAxMDAwKSB0aGlzLnJlY29ubmVjdCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEhhbmRsZXMgY29ubmVjdGlvbiBlcnJvcnNcbiAgICogQHBhcmFtIHtTdHJpbmd9IGVycm9yIC0gVGhlIGVycm9yIG1lc3NhZ2VcbiAgICovXG4gIG9uRXJyb3IoZXJyb3IpIHtcbiAgICBpZiAoIWVycm9yKSByZXR1cm47XG4gICAgdGhpcy5sYXZhSlMuZW1pdChcIm5vZGVFcnJvclwiLCB0aGlzLCBlcnJvcik7XG4gICAgdGhpcy5yZWNvbm5lY3QoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNvbm5lY3QgdG8gdGhlIG5vZGUgaWYgZGlzY29ubmVjdGVkXG4gICAqL1xuICByZWNvbm5lY3QoKSB7XG4gICAgdGhpcy5yZWNvbm5lY3RNb2R1bGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLmNvblN0YXR1cy5hdHRlbXB0cyA+PSB0aGlzLmNvblN0YXR1cy5kb1JldHJ5KSB7XG4gICAgICAgIHRoaXMubGF2YUpTLmVtaXQoXG4gICAgICAgICAgXCJub2RlRXJyb3JcIixcbiAgICAgICAgICB0aGlzLFxuICAgICAgICAgIG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBGYWlsZWQgdG8gY29ubmVjdCBub2RlIGFmdGVyICR7dGhpcy5jb25TdGF0dXMuYXR0ZW1wdHN9IHRyaWVzIWBcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiB0aGlzLmtpbGwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubGF2YUpTLmVtaXQoXCJub2RlUmVjb25uZWN0XCIsIHRoaXMpO1xuICAgICAgdGhpcy5jb24ucmVtb3ZlRXZlbnRMaXN0ZW5lcigpO1xuICAgICAgdGhpcy5jb24gPSBudWxsO1xuICAgICAgdGhpcy5jb25uZWN0KCk7XG4gICAgICB0aGlzLmNvblN0YXR1cy5hdHRlbXB0cysrO1xuICAgIH0sIDNlNCk7XG4gIH1cblxuICAvKipcbiAgICogRGVzdHJveXMgdGhlIG5vZGVcbiAgICovXG4gIGtpbGwoKSB7XG4gICAgaWYgKCF0aGlzLm9ubGluZSkgcmV0dXJuO1xuICAgIHRoaXMuY29uLmNsb3NlKDEwMDAsIFwiZGVzdHJveVwiKTtcbiAgICB0aGlzLmNvbi5yZW1vdmVFdmVudExpc3RlbmVyKCk7XG4gICAgdGhpcy5jb24gPSBudWxsO1xuICAgIHRoaXMubGF2YUpTLm5vZGVDb2xsZWN0aW9uLmRlbGV0ZSh0aGlzLm9wdGlvbnMuaG9zdCk7XG4gIH1cblxuICAvKipcbiAgICogSGFuZGxlIGFueSBpbmNvbWluZyBkYXRhIGZyb20gdGhlIG5vZGVcbiAgICovXG4gIGhhbmRsZVJlc3BvbnNlKGRhdGEpIHtcbiAgICBjb25zdCBtc2cgPSBKU09OLnBhcnNlKGRhdGEudG9TdHJpbmcoKSk7XG4gICAgY29uc3QgeyBvcCwgdHlwZSwgY29kZSwgZ3VpbGRJZCwgc3RhdGUgfSA9IG1zZztcbiAgICBpZiAoIW9wKSByZXR1cm47XG5cbiAgICBpZiAob3AgIT09IFwiZXZlbnRcIikge1xuICAgICAgLy8gSGFuZGxlIG5vbi10cmFjayBldmVudCBtZXNzYWdlc1xuICAgICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlIFwic3RhdHNcIjpcbiAgICAgICAgICB0aGlzLnN0YXRzID0gT2JqZWN0LmFzc2lnbih7fSwgbXNnKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5zdGF0cy5vcDtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwicGxheWVyVXBkYXRlXCI6XG4gICAgICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5sYXZhSlMucGxheWVyQ29sbGVjdGlvbi5nZXQoZ3VpbGRJZCk7XG4gICAgICAgICAgaWYgKHBsYXllcikgcGxheWVyLnBvc2l0aW9uID0gc3RhdGUucG9zaXRpb24gfHwgMDtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wID09PSBcImV2ZW50XCIpIHtcbiAgICAgIGlmICghZ3VpbGRJZCkgcmV0dXJuO1xuICAgICAgLy8gTGF2YUpTIHBsYXllciBmb3IgdGhhdCBndWlsZFxuICAgICAgY29uc3QgcGxheWVyID0gdGhpcy5sYXZhSlMucGxheWVyQ29sbGVjdGlvbi5nZXQoZ3VpbGRJZCk7XG4gICAgICBjb25zdCB0cmFjayA9IHBsYXllci5xdWV1ZVswXTtcbiAgICAgIHBsYXllci5wbGF5U3RhdGUgPSBmYWxzZTtcblxuICAgICAgLy8gSGFuZGxlIHRyYWNrIGV2ZW50IG1lc3NhZ2VzXG4gICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgY2FzZSBcIlRyYWNrRW5kRXZlbnRcIjpcbiAgICAgICAgICBpZiAodHJhY2sgJiYgcGxheWVyLnJlcGVhdFRyYWNrKSB7XG4gICAgICAgICAgICBwbGF5ZXIucGxheSgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHJhY2sgJiYgcGxheWVyLnJlcGVhdFF1ZXVlKSB7XG4gICAgICAgICAgICBjb25zdCB0cmFjazEgPSBwbGF5ZXIucXVldWUucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAodHJhY2sxKSBwbGF5ZXIucXVldWUuYWRkKHRyYWNrMSk7XG4gICAgICAgICAgICBwbGF5ZXIucGxheSgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHJhY2sgJiYgcGxheWVyLnF1ZXVlLnNpemUgPiAxKSB7XG4gICAgICAgICAgICBwbGF5ZXIucXVldWUucmVtb3ZlKCk7XG4gICAgICAgICAgICBwbGF5ZXIucGxheSgpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHJhY2sgJiYgcGxheWVyLnF1ZXVlLnNpemUgPT09IDEpIHtcbiAgICAgICAgICAgIHBsYXllci5xdWV1ZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMubGF2YUpTLmVtaXQoXCJxdWV1ZU92ZXJcIiwgcGxheWVyKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcIlRyYWNrU3R1Y2tFdmVudFwiOlxuICAgICAgICAgIHBsYXllci5xdWV1ZS5yZW1vdmUoKTtcbiAgICAgICAgICBpZiAocGxheWVyLnNraXBPbkVycm9yKSBwbGF5ZXIucGxheSgpO1xuICAgICAgICAgIHRoaXMubGF2YUpTLmVtaXQoXCJ0cmFja1N0dWNrXCIsIHRyYWNrLCBwbGF5ZXIsIG1zZyk7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcIlRyYWNrRXhjZXB0aW9uRXZlbnRcIjpcbiAgICAgICAgICBwbGF5ZXIucXVldWUucmVtb3ZlKCk7XG4gICAgICAgICAgaWYgKHBsYXllci5za2lwT25FcnJvcikgcGxheWVyLnBsYXkoKTtcbiAgICAgICAgICB0aGlzLmxhdmFKUy5lbWl0KFwidHJhY2tFcnJvclwiLCB0cmFjaywgcGxheWVyLCBtc2cpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgXCJXZWJTb2NrZXRDbG9zZWRFdmVudFwiOlxuICAgICAgICAgIGlmIChbNDAwOSwgNDAxNV0uaW5jbHVkZXMoY29kZSkpXG4gICAgICAgICAgICB0aGlzLmxhdmFKUy53c1NlbmQoe1xuICAgICAgICAgICAgICBvcDogNCxcbiAgICAgICAgICAgICAgZDoge1xuICAgICAgICAgICAgICAgIGd1aWxkX2lkOiBndWlsZElkLFxuICAgICAgICAgICAgICAgIGNoYW5uZWxfaWQ6IHBsYXllci5vcHRpb25zLnZvaWNlQ2hhbm5lbC5pZCxcbiAgICAgICAgICAgICAgICBzZWxmX211dGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNlbGZfZGVhZjogcGxheWVyLm9wdGlvbnMuZGVhZmVuIHx8IGZhbHNlLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5sYXZhSlMuZW1pdChcInNvY2tldENsb3NlZFwiLCB0aGlzLCBtc2cpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgbWVzc2FnZSBoYXMgYW4gdW5rbm93biBPUFxuICAgICAgdGhpcy5sYXZhSlMuZW1pdChcbiAgICAgICAgXCJub2RlRXJyb3JcIixcbiAgICAgICAgdGhpcyxcbiAgICAgICAgbmV3IEVycm9yKGBVbmtub3duIGVycm9yL2V2ZW50IHdpdGggb3AgJHtvcH0gYW5kIGRhdGEgJHttc2d9IWApXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGRhdGEgdG8gdGhlIG5vZGUncyB3ZWJzb2NrZXRcbiAgICogQHBhcmFtIHtPYmplY3R9IGRhdGEgLSBUaGUgZGF0YSBwYWNrZXRcbiAgICogQHJldHVybnMge1Byb21pc2U8Qm9vbGVhbj59XG4gICAqL1xuICB3c1NlbmQoZGF0YSkge1xuICAgIG5ldyBQcm9taXNlKChyZXMsIHJlaikgPT4ge1xuICAgICAgY29uc3QgZm9ybWF0dGVkRGF0YSA9IEpTT04uc3RyaW5naWZ5KGRhdGEpO1xuICAgICAgaWYgKCF0aGlzLm9ubGluZSkgcmVzKGZhbHNlKTtcbiAgICAgIGlmICghZm9ybWF0dGVkRGF0YSB8fCAhZm9ybWF0dGVkRGF0YS5zdGFydHNXaXRoKFwie1wiKSlcbiAgICAgICAgcmVqKGBUaGUgZGF0YSB3YXMgbm90IGluIHRoZSBwcm9wZXIgZm9ybWF0LmApO1xuICAgICAgdGhpcy5jb24uc2VuZChcbiAgICAgICAgZm9ybWF0dGVkRGF0YSxcbiAgICAgICAgeyBjb21wcmVzczogZmFsc2UsIGJpbmFyeTogZmFsc2UsIGZpbjogZmFsc2UsIG1hc2s6IGZhbHNlIH0sXG4gICAgICAgIChlcnIpID0+IHtcbiAgICAgICAgICBlcnIgPyByZWooZXJyKSA6IHJlcyh0cnVlKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyKSB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgeyBMYXZhTm9kZSB9O1xuIl19