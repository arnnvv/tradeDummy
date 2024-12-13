import WebSocket from "ws";

const symbols = ["AAPL", "GOOGL", "MSFT", "AMZN", "FB"];

export class MarketDataFeed {
  private clients: Set<WebSocket>;

  constructor() {
    this.clients = new Set();
  }

  public start() {
    setInterval(() => {
      const data: {
        symbol: string;
        price: number;
        volume: number;
        timestamp: number;
      } = {
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        price: parseFloat((Math.random() * 1000).toFixed(2)),
        volume: Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
      };
      this.broadcast(JSON.stringify({ type: "marketData", data }));
    }, 100);
  }

  public addClient(ws: WebSocket) {
    this.clients.add(ws);
    ws.on("close", () => this.clients.delete(ws));
  }

  private broadcast(message: string) {
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
