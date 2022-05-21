import { Player } from "../components/Player";
import {
	IChannelMixFilter,
	IDistortionFilter,
	IEqualizerFilter,
	IFiltersPayload,
	IKaraokeFilter,
	ILowPassFilter,
	IOscillationFilter,
	IRoationFilter,
	ITimescaleFilter,
} from "../types/filters";

export class FiltersManager {
	constructor(private player: Player, private _filters: IFiltersPayload) {}

	public getEqualizer() {
		return this._filters.equalizer;
	}

	public getKaraoke() {
		return this._filters.karaoke;
	}

	public getTimescale() {
		return this._filters.timescale;
	}

	public getTremolo() {
		return this._filters.tremolo;
	}

	public getVibrato() {
		return this._filters.vibrato;
	}

	public getRotation() {
		return this._filters.rotation;
	}

	public getDistortion() {
		return this._filters.distortion;
	}

	public getChannelMix() {
		return this._filters.channelMix;
	}

	public getLowPass() {
		return this._filters.lowPass;
	}

	public setEqualizer(equalizerFilter: IEqualizerFilter) {
		if (equalizerFilter.length !== 15)
			throw new RangeError(
				"FiltersManager#setEqualizer: Equalizer must have 15 bands"
			);
		if (equalizerFilter.some((x) => x.band < 0 || x.band > 14))
			throw new RangeError(
				"FiltersManager#setEqualizer: Equalizer band must be between 0 and 14"
			);
		if (equalizerFilter.some((x) => x.gain < -0.25 || x.gain > 1))
			throw new RangeError(
				"FiltersManager#setEqualizer: Equalizer gain must be between -0.25 and 1"
			);
		if (
			new Set(equalizerFilter.map((x) => x.band)).size !==
			equalizerFilter.length
		)
			throw new Error(
				"FiltersManager#setEqualizer: A band cannot have more than 1 gain filter"
			);
		this._filters.equalizer = equalizerFilter;
		return this;
	}

	public setKaraoke(karaokeFilter: IKaraokeFilter) {
		this._filters.karaoke = karaokeFilter;
		return this;
	}

	public setTimescale(timescaleFilter: ITimescaleFilter) {
		if (Object.values(timescaleFilter).some((x) => x < 0))
			throw new RangeError(
				"FiltersManager#setTimescale: Timescale filter values must be greater than or equal to 0"
			);
		this._filters.timescale = timescaleFilter;
		return this;
	}

	public setTremolo(tremoloFilter: IOscillationFilter) {
		if (tremoloFilter.frequency <= 0)
			throw new RangeError(
				"FiltersManager#setTremolo: Tremolo frequency must be greater than 0"
			);
		if (tremoloFilter.depth <= 0 || tremoloFilter.depth > 1)
			throw new RangeError(
				"FiltersManager#setTremolo: Tremolo depth must be greater than 0 and less than or equal to 1"
			);
		this._filters.tremolo = tremoloFilter;
		return this;
	}

	public setVibrato(vibratoFilter: IOscillationFilter) {
		if (vibratoFilter.frequency <= 0 && vibratoFilter.frequency > 14)
			throw new RangeError(
				"FiltersManager#setVibrato: Vibrato frequency must be greater than 0 and less than or equal to 14"
			);
		if (vibratoFilter.depth <= 0 || vibratoFilter.depth > 1)
			throw new RangeError(
				"FiltersManager#setVibrato: Vibrato depth must be greater than 0 and less than or equal to 1"
			);
		this._filters.vibrato = vibratoFilter;
		return this;
	}

	public setRotation(rotationFilter: IRoationFilter) {
		this._filters.rotation = rotationFilter;
		return this;
	}

	public setDistortion(distortionFilter: IDistortionFilter) {
		this._filters.distortion = distortionFilter;
		return this;
	}

	public setChannelMix(channelMixFilter: IChannelMixFilter) {
		this._filters.channelMix = channelMixFilter;
		return this;
	}

	public setLowPass(lowPassFilter: ILowPassFilter) {
		this._filters.lowPass = lowPassFilter;
		return this;
	}

	public async updateFilters() {
		await this.player.node.send({
			...this._filters,
			op: "filters",
			guildId: this.player.guildId,
			volume: this.player.volume / 100,
		});
	}
}
