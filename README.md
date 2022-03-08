<div align="center">
  <br />
  <p>
    <img src="https://cdn.discordapp.com/attachments/939789362156163102/950796900938969119/Lava.png" alt="LavaJS Logo" />
  </p>
  <br />
  <p>
    <a href="https://discord.gg/PmZBWBu89Y"><img src="https://discordapp.com/api/guilds/939268500302737480/widget.png?style=shield" alt="Discord" /></a>
    <a href="https://github.com/OverleapTechnologies/LavaJS/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@overleap/lavajs" alt="License" /></a>
    <a href="https://npmjs.com/package/@overleap/lavajs"><img src="https://img.shields.io/npm/dt/@overleap/lavajs" alt="Downloads" /></a>
<!--     <a href="https://david-dm.org/Projects-Me/LavaJS"><img src="https://img.shields.io/david/Projects-Me/LavaJS" alt="Dependencies" /></a> -->
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

**Example code for running the client:**

```js
// Require Discord and LavaJS clients
const { Client } = require("discord.js");
const { LavaClient } = require("@overleap/lavajs");

// New discord client instance
const bot = new Client();

// Create the node options
const nodes = [
	{
		host: "localhost",
		port: 2333,
		password: "mypassword",
		retries: 5,
	},
];

// New LavaClient instance
const lavaClient = new LavaClient(bot, nodes);

// Login the discord client
bot.log("token");
```

# Bot Examples

- TODO

# Author

- **ThatAnonyG (Ratul Saha)**
- **Links:**
  - [Portfolio](https://ratulsaha.me)
  - [GitHub](https://github.com/ThatAnonyG)
  - [Twitter](https://twitter.com/ThatAnonyG)
  - [DscBio](https://dsc.bio/ThatAnonyG)
- [**Donate The Development**](https://paypal.me/thatratul)
