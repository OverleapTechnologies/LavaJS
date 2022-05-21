export type SizeInBytes =
	typeof ByteArray.SIZE_IN_BYTES[keyof typeof ByteArray.SIZE_IN_BYTES];

/** This class tries to replicate the Java DataInput class */
export abstract class ByteArray extends Uint8Array {
	static get [Symbol.species]() {
		return Uint8Array;
	}

	public static SIZE_IN_BYTES = {
		BOOL: 1,
		SHORT: 2,
		INT: 4,
		LONG: 8,
	} as const;

	private cursor = -1;

	protected abstract readonly _encoded: string;
	protected abstract readonly _messageSize: number;

	public get encoded() {
		return this._encoded;
	}

	public get messageSize() {
		return this._messageSize;
	}

	public get next() {
		if (this.cursor >= this.length - 1) {
			throw new Error(
				"[ByteArray] IOError: Cursor position out of range. Try resetting cursor."
			);
		}
		return this[++this.cursor];
	}

	public resetCursor() {
		this.cursor = -1;
	}

	public read(n: SizeInBytes = ByteArray.SIZE_IN_BYTES.BOOL) {
		return Array.from({ length: n }, () => this.next).reduce(
			(v, b, i) => v | ((b & 0xff) << (8 * (n - (i + 1)))),
			0
		);
	}

	public readUtf() {
		const length = this.read(ByteArray.SIZE_IN_BYTES.SHORT);
		return new TextDecoder().decode(
			this.slice(this.cursor + 1, (this.cursor += length) + 1)
		);
	}

	public conditonalRead() {
		const condition = this.read() !== 0;
		return condition ? this.readUtf() : null;
	}
}
