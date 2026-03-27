// server.js
const fs = require('fs');
const WebSocket = require('ws');

// ---------- CONFIG ----------
const PORT = 1234;
// Uncomment for WSS and provide valid SSL certificates
/*
const server = new WebSocket.Server({
    port: PORT,
    server: require('https').createServer({
        cert: fs.readFileSync('cert.pem'),
        key: fs.readFileSync('key.pem')
    })
});
*/

// For LAN / local desktop testing (ws://)
const server = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT} (LAN clients can connect via host IP)`);

let nextId = 1;
const clients = new Map();

server.on('connection', (ws) => {
    const id = nextId++;
    clients.set(id, ws);
    console.log(`Client connected: ${id}`);

    // Assign unique ID to client
    ws.send(JSON.stringify({ type: 'assign_id', id }));

    // Spawn this player on all clients
    broadcast({ type: 'spawn', id, position: { x: 0, y: 0, z: 0 } });

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            switch(data.type){
                case 'spawn_request':
                    // Optionally handle spawn requests (already broadcast above)
                    break;
                case 'move':
                    // Broadcast movement to all clients except sender
                    broadcast(data, id);
                    break;
            }
        } catch(e) {
            console.error("Invalid JSON:", msg);
        }
    });

    ws.on('close', () => {
        clients.delete(id);
        console.log(`Client disconnected: ${id}`);
    });
});

// Broadcast to all clients (optionally skip sender)
function broadcast(data, skipId=null){
    const msg = JSON.stringify(data);
    clients.forEach((client, clientId) => {
        if(clientId !== skipId && client.readyState === WebSocket.OPEN){
            client.send(msg);
        }
    });
}