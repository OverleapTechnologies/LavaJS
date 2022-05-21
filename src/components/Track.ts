import { ByteArray } from "../utils/abstract/ByteArray";

export class Track extends ByteArray {
	public static TRACK_INFO_VERSIONED = 1;

	protected readonly _encoded: string;
	protected readonly _messageSize: number;

	public readonly version: number;
	public readonly title: string;
	public readonly author: string;
	public readonly trackLength: number;
	public readonly identifier: string;
	public readonly isStream: boolean;
	public readonly uri: string | null;
	public readonly source: string;
	public readonly probeInfo: { name: string | null; parameter: string | null };
	public readonly position: number;

	constructor(encoded: string) {
		super(Buffer.from(encoded, "base64"));

		const val = this.read(ByteArray.SIZE_IN_BYTES.INT);

		this._encoded = encoded;
		this._messageSize = val & 0x3fffffff;

		this.version =
			(((val & 0xc0000000) >> 30) & Track.TRACK_INFO_VERSIONED) !== 0
				? this.read() & 0xff
				: 1;
		this.title = this.readUtf();
		this.author = this.readUtf();
		this.trackLength = this.read(ByteArray.SIZE_IN_BYTES.LONG);
		this.identifier = this.readUtf();
		this.isStream = this.read() !== 0;
		this.uri = this.version >= 2 ? this.conditonalRead() : null;
		this.source = this.readUtf();

		let [name, parameter]: (null | string)[] = [null, null];
		if (["local", "http"].includes(this.source))
			[name, parameter] = this.readUtf().split("|");
		this.probeInfo = { name, parameter };

		this.position = this.read(ByteArray.SIZE_IN_BYTES.LONG);
	}
}
