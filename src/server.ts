import WebSocket, { Server } from "ws";
import { MarketDataFeed } from "./marketData";
import { OrderManagement, OrderSide, Order } from "./orderManagement";
import { MatchingEngine } from "./matchingEngine";

interface ClientMessage {
  action: string;
  data: any;
}

const wss = new Server({ port: 8080 });
const marketDataFeed = new MarketDataFeed();
const orderManagement = new OrderManagement();
const matchingEngine = new MatchingEngine();

marketDataFeed.start();

wss.on("connection", (ws: WebSocket) => {
  console.log("Client connected");
  marketDataFeed.addClient(ws);

  ws.on("message", (message: string) => {
    try {
      const msg: ClientMessage = JSON.parse(message);
      handleClientMessage(ws, msg);
    } catch (error) {
      console.error("Invalid message format:", error);
      ws.send(
        JSON.stringify({ type: "error", data: "Invalid message format" }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

function handleClientMessage(ws: WebSocket, msg: ClientMessage) {
  const { action, data } = msg;

  switch (action) {
    case "submitOrder":
      handleSubmitOrder(ws, data);
      break;
    case "cancelOrder":
      handleCancelOrder(ws, data);
      break;
    case "subscribeMarketData":
      break;
    default:
      ws.send(JSON.stringify({ type: "error", data: "Unknown action" }));
  }
}

function handleSubmitOrder(ws: WebSocket, data: any) {
  const { clientId, symbol, price, quantity, side } = data;
  const order: Order = orderManagement.createOrder(
    clientId,
    symbol,
    price,
    quantity,
    side as OrderSide,
  );
  ws.send(JSON.stringify({ type: "orderSubmitted", data: order }));

  // Process matching
  const trades = matchingEngine.processOrder(order);
  trades.forEach((trade) => {
    // Notify clients involved in the trade
    ws.send(JSON.stringify({ type: "tradeExecuted", data: trade }));
    // In a real system, you would notify specific clients based on clientId
  });
}

function handleCancelOrder(ws: WebSocket, data: any) {
  const { orderId, clientId } = data;
  const success = orderManagement.cancelOrder(orderId, clientId);
  if (success) {
    ws.send(JSON.stringify({ type: "orderCancelled", data: { orderId } }));
  } else {
    ws.send(JSON.stringify({ type: "error", data: "Cancellation failed" }));
  }
}

console.log("WebSocket server is running on ws://localhost:8080");
