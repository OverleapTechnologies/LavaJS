<div align="center">
  <br />
  <p>
    <img src="https://media.discordapp.net/attachments/718368456709505046/718741833378955304/Lava.png" alt="LavaJS Logo" />
  </p>
  <br />
  <p>
    <a href="https://discord.gg/mHHU8vs"><img src="https://discordapp.com/api/guilds/718157763821174884/widget.png?style=shield" alt="Discord" /></a>
    <a href="https://github.com/ThatAnonymousG/LavaJS/blob/master/LICENSE"><img src="https://img.shields.io/npm/l/@anonymousg/lavajs" alt="License" /></a>
    <a href="https://npmjs.com/package/@anonymousg/lavajs"><img src="https://img.shields.io/npm/dt/@anonymousg/lavajs" alt="Downloads" /></a>
    <a href="https://david-dm.org/Projects-Me/LavaJS"><img src="https://img.shields.io/david/Projects-Me/LavaJS" alt="Dependencies" /></a>
    <a href="https://twitter.com/ThatAnonyG"><img src="https://img.shields.io/twitter/follow/ThatAnonyG?label=Follow&style=social" alt="Twitter" /></a>
  </p>
  <br />
  <p>
    <a href="https://nodei.co/npm/@anonymousg/lavajs/"><img src="https://nodei.co/npm/@anonymousg/lavajs.png?downloads=true&stars=true" alt="Status Banner"></a>
  </p>
</div>

# Installation

**Using the Node Package Manager (NPM)**

```shell script
npm install @anonymousg/lavajs
```

# Important

**You need the following things before you can kick off with LavaJS:**

- [**Java Installed**](https://www.java.com/en/download/)
- [**LavaLink CL Server**](https://ci.fredboat.com/viewLog.html?buildId=lastSuccessful&buildTypeId=Lavalink_Build&tab=artifacts&guest=1)

> The setup has been covered in our official documentation. Do check it out if you have any doubts.

# Documentation and Support

- **The latest changelog can be found [here](https://lavajs.tech/#/changelog).**
- **Our official documentation is available [here](https://lavajs.tech).**
- **For any further query and support join us at [Projects.Me](https://discord.gg/mHHU8vs) discord.**

# Basic Startup Guide

- **Create an `application.yml` file in the `Lavalink.jar` directory and paste this [example](https://lavajs.tech/#/setup?id=setup-lavalink) in it.**
- **Run the `Lavalink.jar` file in a terminal window using `java -jar Lavalink.jar`.**

**Example code for running the client:**

```js
// Require Discord and LavaJS clients
const { Client } = require("discord.js");
const { LavaClient } = require("@anonymousg/lavajs");

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

- **[Official Bot](https://github.com/Projects-Me/LavaJS/tree/bot) - The official example bot from LavaJS team.**
- **[Blazify](https://github.com/IamGoDsoIamBest/Blazify-discord-bot) - A TypeScript Discord Bot based on the DiscordJS. LavaJS is used for music so it will serve you as an example.**

# Contributor

**Thanks to [Johna-3212](https://github.com/Johna-3212) for making the module compatible with TypeScript!**

# Author

- **ThatAnonymousG (Ratul Saha)**
- **Links: [GitHub](https://github.com/ThatAnonymousG) | [Twitter](https://twitter.com/ThatAnonyG) | [DscBio](https://dsc.bio/ThatAnonyG)**
- [**Donate The Development**](https://paypal.me/ratul003)
