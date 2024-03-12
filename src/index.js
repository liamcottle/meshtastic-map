const path = require('path');
const axios = require('axios');
const express = require('express');
const NodeCache = require("node-cache");
const cache = new NodeCache();

const app = express();

// serve files inside the public folder from /
app.use('/', express.static(path.join(__dirname, 'public')));

async function getCached(key, ttl, callback) {

    // find data from cache
    let data = cache.get(key);

    // update cache
    if(!data){
        data = await callback();
        cache.set(key, data, ttl);
    }

    // get expiration time in seconds
    const cacheTtl = cache.getTtl(key);
    const expiresIn = cacheTtl != null
        ? Math.ceil((cacheTtl - Date.now()) / 1000)
        : 0;

    // return data
    return [ data, expiresIn ];

}

app.get('/', async (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/api', async (req, res) => {

    const links = [
        {
            "path": "/api",
            "description": "This page",
        },
        {
            "path": "/api/v1/nodes",
            "description": "Meshtastic nodes in JSON format.",
        },
    ];

    const html = links.map((link) => {
        return `<li><a href="${link.path}">${link.path}</a> - ${link.description}</li>`;
    }).join("");

    res.send(html);

});

app.get('/api/v1/nodes', async (req, res) => {
    try {

        // get nodes from cache, or retrieve from api
        const [ nodes, expiresIn ] = await getCached('nodes', 10, async () => {
            const response = await axios.get("https://meshmap.net/nodes2.json");
            return response.data;
        });

        res.json({
            expires_in: expiresIn,
            nodes: nodes,
        });

    } catch(err) {
        console.error(err);
        res.status(500).json({
            message: "Something went wrong, try again later.",
        });
    }
});

app.listen(8080);
