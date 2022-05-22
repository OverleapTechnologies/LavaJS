<div align="center">
  <br />
  <p>
    <img src="https://cdn.discordapp.com/attachments/939789362156163102/950796900938969119/Lava.png" alt="LavaJS Logo" />
  </p>
  <br />
  <p>
    <a href="https://discord.gg/PmZBWBu89Y"><img src="https://img.shields.io/discord/939268500302737480?color=%235865F2&label=Discord&style=for-the-badge" alt="Discord" /></a>
    <a href="https://circleci.com/gh/OverleapTechnologies/LavaJS/?branch=dev"><img src="https://img.shields.io/circleci/build/gh/OverleapTechnologies/LavaJS?label=master&style=for-the-badge" alt="CI Status" /></a>
    <a href="https://circleci.com/gh/OverleapTechnologies/LavaJS/?branch=dev"><img src="https://img.shields.io/circleci/build/gh/OverleapTechnologies/LavaJS/dev?label=dev&style=for-the-badge" alt="CI Status" /></a>
    <a href="https://github.com/OverleapTechnologies/LavaJS/issues"><img src="https://img.shields.io/github/issues/OverleapTechnologies/LavaJS?color=%232C2F33&style=for-the-badge" alt="GitHub Issues" /></a>
    <a href="https://github.com/OverleapTechnologies/LavaJS/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@overleap/lavajs?style=for-the-badge" alt="License" /></a>
    <a href="https://npmjs.com/package/@overleap/lavajs"><img src="https://img.shields.io/npm/dt/@overleap/lavajs?style=for-the-badge" alt="Downloads" /></a>
  </p>
</div>

# Installation

- Using Node Package Manager (NPM):

```sh
npm install @overleap/lavajs
```

- Or using Yarn:

```sh
yarn add @overleap/lavajs
```

# Important

**You need the following things before you can kick off with LavaJS:**

- [**Java Installed**](https://www.java.com/en/download/)
- [**LavaLink CL Server**](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)

> The setup has been covered in our official documentation. Do check it out if you have any doubts.

# Documentation and Support

- The latest changelog can be found [here](https://ratulsaha.me/projects/lavajs/changelog).
- Our official documentation is available [here](https://ratulsaha.me/projects/lavajs).
- For any further query and support join us at [Overleap](https://discord.gg/PmZBWBu89Y) discord.

# Basic Startup Guide

- Create an `application.yml` file in the `Lavalink.jar` directory and paste this [example](https://ratulsaha.me/projects/lavajs/docs#setup) in it.
- Run the `Lavalink.jar` file in a terminal window using `java -jar Lavalink.jar`.

# IMPORTANT

- You need to have access to the incoming VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE packets.
  - Check out the official Discord documention here: [Voice Server Update](https://discord.com/developers/docs/topics/gateway#voice-server-update), [Voice State Update](https://discord.com/developers/docs/resources/voice#voice-state-object).
  - Refer to the support for your respective library.
- You need to pass the data to `Client#sendVoiceUpdate(payload)`.

**Example code for running the client:**

```js
const client = new Client(
	{
		botId: "BOT_ID",
		send: (guildId, payload) => {
			// A Promise method implementation to pass payload to Discord
		},
	},
	[
		{
			host: "localhost",
			port: 2333,
			password: "your_server_password",
		},
	]
);

client.connectAll();
```

# Bot Examples

- TODO

# Author

- **ThatAnonyG (Ratul Saha)**
- **Links:**
  - [Portfolio](https://ratulsaha.me)
  - [GitHub](https://github.com/ThatAnonyG)
  - [Twitter](https://twitter.com/ThatAnonyG)
- [**Donate The Development**](https://paypal.me/thatratul)
