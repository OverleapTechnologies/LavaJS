import { IConnectionInfo } from "../types/node";

export class NodeInfoBuilder {
	private info: IConnectionInfo = {
		host: "",
		password: "",
		port: -1,
		reconnect: { interval: 5000, limit: 5 },
		secure: false,
	};

	public setHost(host: string) {
		this.info.host = host;
		return this;
	}

	public setPort(port: number) {
		this.info.port = port;
		return this;
	}

	public setPassword(password: string) {
		this.info.password = password;
		return this;
	}

	public setReconnect(reconnect: { limit: number; interval: number }) {
		this.info.reconnect = reconnect;
		return this;
	}

	public setSecure(secure: boolean) {
		this.info.secure = secure;
		return this;
	}

	public build(): IConnectionInfo {
		return this.info;
	}
}
