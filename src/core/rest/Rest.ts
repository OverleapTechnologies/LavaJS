import fetch from "node-fetch";

import { Track } from "../../components/Track";
import { IConnectionInfo } from "../../types/node";
import {
	IRestLoadTrackLavalinkResponse,
	IRestLoadTrackResponse,
	IRestNode,
} from "../../types/rest";

export class Rest {
	private _nodes: IRestNode[];

	constructor(nodes: IConnectionInfo[]) {
		this._nodes = nodes.map((x) => ({
			uri: `http${x.secure ? "s" : ""}://${x.host}:${x.port}`,
			auth: x.password,
			requestsHandled: 0,
		}));
	}

	get node() {
		const node = this._nodes.shift();
		if (!node) throw new Error("Rest#node: No nodes available");
		this._nodes.push(node);
		return node;
	}

	public async loadTracks(query: string, source = "yt") {
		const search = /^https?:\/\//g.test(query)
			? query
			: `${source}search:${query}`;

		const res = (await (
			await fetch(
				`${this.node.uri}/loadtracks?identifier=${encodeURIComponent(search)}`,
				{
					method: "GET",
					headers: {
						Authorization: this.node.auth,
					},
				}
			)
		).json()) as IRestLoadTrackLavalinkResponse;

		return new Promise<IRestLoadTrackResponse>((resolve, reject) => {
			if (res.loadType === "LOAD_FAILED" && res.exception)
				return reject(
					`Rest#loadTracks: ${res.exception.message} (Severety: ${res.exception.severity})`
				);

			const { tracks, playlistInfo } = res;
			const resolveObj: IRestLoadTrackResponse = {
				tracks: tracks.map((x) => new Track(x.track)),
			};
			if (playlistInfo.name) resolveObj.playlist = playlistInfo.name;

			resolve(resolveObj);
		});
	}
}
