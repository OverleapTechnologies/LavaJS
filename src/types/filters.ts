export type Filters =
	| "volume"
	| "equalizer"
	| "karaoke"
	| "timescale"
	| "tremolo"
	| "vibrato"
	| "rotation"
	| "distortion"
	| "channelMix"
	| "lowPass";

export interface IEqualizerBand {
	/**
	 *  Integer within the range - 0 <= x <= 14
	 */
	band: number;
	/**
	 *  FLoat within the range - -0.25 <= x <= 1.0
	 */
	gain: number;
}

export interface IEqualizerFilter extends Array<IEqualizerBand> {
	0: IEqualizerBand;
	length: 15;
}

export interface IKaraokeFilter {
	level: number;
	monoLevel: number;
	filterBand: number;
	filterWidth: number;
}

export interface ITimescaleFilter {
	/**
	 * Number within the range - 0 <= x
	 */
	speed: number;
	/**
	 * Number within the range - 0 <= x
	 */
	pitch: number;
	/**
	 * Number within the range - 0 <= x
	 */
	rate: number;
}

export interface IOscillationFilter {
	/**
	 * For tremolo: Number within the range - 0 < x
	 * For vibrato: Number within the range - 0 < x <= 14
	 */
	frequency: number;
	/**
	 * Number/float within the range - 0 < x <= 1
	 */
	depth: number;
}

export interface IRoationFilter {
	rotationHz: number;
}

export interface IDistortionFilter {
	sinOffset: number;
	sinScale: number;
	cosOffset: number;
	cosScale: number;
	tanOffset: number;
	tanScale: number;
	offset: number;
	scale: number;
}

export interface IChannelMixFilter {
	leftToLeft: number;
	leftToRight: number;
	rightToLeft: number;
	rightToRight: number;
}

export interface ILowPassFilter {
	smoothing: number;
}

export interface IFiltersPayload {
	/**
	 * Float within the range - 0 <= x <= 5
	 */
	volume?: number;

	/**
	 * Array of 15 bands
	 */
	equalizer?: IEqualizerFilter;

	/**
	 * Uses equalization to eliminate part of a band, usually targeting vocals
	 */
	karaoke?: IKaraokeFilter;

	/**
	 * Changes the speed, pitch, and rate. All defaults to 1
	 */
	timescale?: ITimescaleFilter;

	/**
	 * Uses amplification to create a shuddering effect, where the volume quickly oscillates
	 */
	tremolo?: IOscillationFilter;

	/**
	 * Similar to tremolo but vibrato oscillates the pitch
	 */
	vibrato?: IOscillationFilter;

	/**
	 * Rotates the sound around the stereo channels (Audio Panning)
	 */
	rotation?: IRoationFilter;

	/**
	 * Distortion effect. It can generate some pretty unique audio effects
	 */
	distortion?: IDistortionFilter;

	/**
	 * Mixes both channels (left and right), with a configurable factor on how much each channel affects the other
	 * By default both channels are kept independent from each other
	 * Setting all factors to 0.5 means both channels get the same audio
	 */
	channelMix?: IChannelMixFilter;

	/**
	 * Higher frequencies get suppressed, while lower frequencies pass through this filter
	 */
	lowPass?: ILowPassFilter;
}
