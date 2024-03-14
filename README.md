# Meshtastic Map

A map of all Meshtastic nodes heard via MQTT.

## Features

- [x] Connects to mqtt.meshtastic.org to collect nodes and metrics.
- [x] Shows nodes on the map if they have reporeted a valid position.
- [x] Hover over nodes on the map to see basic information and a preview image.
- [x] Click nodes on the map to show a sidebar with more info such as graphs of historical telemetry.
- [x] Ability to share a direct link to a node. The map will auto navigate to it.
- [x] Ability to search for a node by ID and Hex ID. The map will auto navigate to it.
- [x] Device list. To see which hardware models are most popular.
- [x] Mobile optimised layout.

## Beta Features

- [x] "Neighbours" map layer. Shows blue connection lines between nodes that heard the other node.
  - This information is taken from the `NEIGHBORINFO_APP`, but I feel like some of the neighbours weren't heard?? Maybe I am wrong.

## Planned Features

- Login/Register to manually add nodes to the map, and manage their details.

## Ideas

- Maybe a way to "claim" nodes, by sending a custom message from the node.
  - Set other information, such as frequency, antenna info.
  - Could allow you to upload your own photos of the node to show on the map.

## TODO

- show frequency
- welcome modal
- not affiliated with meshtastic info
- donate link
- login/register to add nodes to the map manually
  - need to prevent spam
  - captcha for reg
  - limit how many nodes can be added from an account

- show connection lines between nodes and the neighbours they have heard directly
- ui to view realtime events from specific nodes
- ui to view text messages log
- store x days worth of historical logs
- be able to go back in time and see how the mesh evolved
- dedupe packets

## References

- https://meshtastic.org/docs/software/integrations/mqtt/
- https://buf.build/meshtastic/protobufs/docs/main:meshtastic
