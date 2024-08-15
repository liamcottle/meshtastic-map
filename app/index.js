const path = require('path');
const express = require('express');
const compression = require('compression');
const commandLineArgs = require("command-line-args");
const commandLineUsage = require("command-line-usage");

// return big ints as string when using JSON.stringify
BigInt.prototype.toJSON = function() {
  return this.toString();
}

const optionsList = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Display this usage guide.'
  },
  {
    name: "port",
    type: Number,
    description: "Port to serve web ui and api from.",
  },
];

// parse command line args
const options = commandLineArgs(optionsList);

// show help
if(options.help){
  const usage = commandLineUsage([
    {
      header: 'Meshtastic Map',
      content: 'A map of all Meshtastic nodes heard via MQTT.',
    },
    {
      header: 'Options',
      optionList: optionsList,
    },
  ]);
  console.log(usage);
  return;
}

// get options and fallback to default values
const port = options["port"] ?? 80;

const app = express();

// enable compression
app.use(compression());

// serve files inside the public folder from /
app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api/v1/text-messages/embed', async (req, res) => {
  res.sendFile(path.join(__dirname, 'public/text-messages-embed.html'));
});

// start express server
const listener = app.listen(port, () => {
  const port = listener.address().port;
  console.log(`Server running at http://127.0.0.1:${port}`);
});
