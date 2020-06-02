<!--span class="mdi mdi-close"></span-->
<!--span class="mdi mdi-check"></span-->

# LavaClient
> #### The LavaLink client class.

## Constructor {docsify-ignore}
```js
new LavaClient(client, nodes);
```
Creates a new LavaJSClient class instance.

| Param | Type | Default | Optional | Description |
| :---: | :---: | :---: | :---: | :---: |
| client | `*` | *None* | <span class="mdi mdi-close"></span> | The Discord client. |
| node | `Array<Options>` | *None* | <span class="mdi mdi-close"></span> | The node to use. |
| shards | `Number` | 1 | <span class="mdi mdi-check"></span> | Shard count of the Discord client. |

Nodes Example:
```js
const nodes = [
  {
    host: "localhost",
    port: 2222,
    password: "mypassword",
  }
];
```

### Events {docsify-ignore}
> * [nodeSuccess](/#/docs/LavaClient?id=nodesuccess)
> * [nodeError](#event_nodeError)
> * [trackOver](#event_trackOver)
> * [trackPlay](#event_trackPlay)

### nodeSuccess
> Emitted when a node connects 

| Param | Type | Description |
| --- | --- | --- |
| node | `Node` | The node which connected. |

### nodeError
> Emitted on a node error 

| Param | Type | Description |
| --- | --- | --- |
| node | `Node` | The node which encountered the error. |
| error | `Error` | The error message. |

### trackOver
> Emitted when a track ends

| Param | Type | Description |
| --- | --- | --- |
| track | `Track` | The track which ended. |
| player | `Player` | Player which was playing the track. |

### trackPlay
> Emitted when a track starts

| Param | Type | Description |
| --- | --- | --- |
| track | `Track` | The track which started. |
| player | `Player` | Player which is playing the track. |

