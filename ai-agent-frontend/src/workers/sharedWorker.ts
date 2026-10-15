const connections: MessagePort[] = [];

self.onconnect = (e: MessageEvent) => {
  const port = e.ports[0];
  connections.push(port);

  port.onmessage = (event: MessageEvent) => {
    // Broadcast the message to all OTHER connected tabs
    connections.forEach((conn) => {
      if (conn !== port) {
        conn.postMessage(event.data);
      }
    });
  };
  
  port.start();
};
