# Getting Started

### Install LavaJS
Install it via npm:
```shell script
npm install lavajs
```

### Setup LavaLink
Download `Lavalink.jar` from [GitHub Releases](https://github.com/Frederikam/Lavalink/releases).
Keep it in a folder and make a new `application.yml` file
in the same folder which stores the LavaLink configs.

Sample `application.yml` with default settings:
```yaml
server: # REST and WS server
  port: 2333
  address: 0.0.0.0
lavalink:
  server:
    password: "mypassword"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      mixer: true
      http: true
      local: false
    bufferDurationMs: 400
    youtubePlaylistLoadLimit: 6 # Number of pages at 100 each
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true
    gc-warnings: true
    #ratelimit:
      #ipBlocks: ["1.0.0.0/8", "..."] # list of ip blocks
      #excludedIps: ["...", "..."] # ips which should be explicit excluded from usage by lavalink
      #strategy: "RotateOnBan" # RotateOnBan | LoadBalance | NanoSwitch | RotatingNanoSwitch
      #searchTriggersFail: true # Whether a search 429 should trigger marking the ip as failing
      #retryLimit: -1 # -1 = use default lavaplayer value | 0 = infinity | >0 = retry will happen this numbers times

metrics:
  prometheus:
    enabled: false
    endpoint: /metrics

sentry:
  dsn: ""
#  tags:
#    some_key: some_value
#    another_key: another_value

logging:
  file:
    max-history: 30
    max-size: 1GB
  path: ./logs/

  level:
    root: INFO
    lavalink: INFO
```

Run LavaLink using the following command:
```shell script
java -jar Lavalink.jar
```

### Setting up the client