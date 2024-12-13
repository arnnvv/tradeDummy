import { v4 } from "uuid";
import { Order } from "./orderManagement";

interface Trade {
  tradeId: string;
  buyOrderId: string;
  sellOrderId: string;
  symbol: string;
  price: number;
  quantity: number;
  timestamp: number;
}

export class MatchingEngine {
  private buyOrders: Map<string, Order[]>; // symbol -> buy orders
  private sellOrders: Map<string, Order[]>; // symbol -> sell orders
  private trades: Trade[];

  constructor() {
    this.buyOrders = new Map();
    this.sellOrders = new Map();
    this.trades = [];
  }

  public processOrder(order: Order): Trade[] {
    if (order.side === "buy") {
      this.matchBuyOrder(order);
    } else {
      this.matchSellOrder(order);
    }
    return this.trades;
  }

  private matchBuyOrder(order: Order) {
    const sellBook = this.sellOrders.get(order.symbol) || [];
    sellBook.sort((a, b) => a.price - b.price); // Ascending
    let remainingQuantity = order.quantity;

    for (const sellOrder of sellBook) {
      if (sellOrder.price > order.price || remainingQuantity === 0) break;

      const tradeQuantity = Math.min(remainingQuantity, sellOrder.quantity);
      const tradePrice = sellOrder.price;
      const trade: Trade = {
        tradeId: v4(),
        buyOrderId: order.orderId,
        sellOrderId: sellOrder.orderId,
        symbol: order.symbol,
        price: tradePrice,
        quantity: tradeQuantity,
        timestamp: Date.now(),
      };
      this.trades.push(trade);
      remainingQuantity -= tradeQuantity;

      // Update orders
      sellOrder.quantity -= tradeQuantity;
      if (sellOrder.quantity === 0) {
        sellOrder.status = "filled";
      }
    }

    order.quantity = remainingQuantity;
    if (order.quantity > 0) {
      const buyBook = this.buyOrders.get(order.symbol) || [];
      buyBook.push(order);
      buyBook.sort((a, b) => b.price - a.price); // Descending
      this.buyOrders.set(order.symbol, buyBook);
    } else {
      order.status = "filled";
    }
  }

  private matchSellOrder(order: Order) {
    const buyBook = this.buyOrders.get(order.symbol) || [];
    buyBook.sort((a, b) => b.price - a.price); // Descending
    let remainingQuantity = order.quantity;

    for (const buyOrder of buyBook) {
      if (buyOrder.price < order.price || remainingQuantity === 0) break;

      const tradeQuantity = Math.min(remainingQuantity, buyOrder.quantity);
      const tradePrice = buyOrder.price;
      const trade: Trade = {
        tradeId: v4(),
        buyOrderId: buyOrder.orderId,
        sellOrderId: order.orderId,
        symbol: order.symbol,
        price: tradePrice,
        quantity: tradeQuantity,
        timestamp: Date.now(),
      };
      this.trades.push(trade);
      remainingQuantity -= tradeQuantity;

      // Update orders
      buyOrder.quantity -= tradeQuantity;
      if (buyOrder.quantity === 0) {
        buyOrder.status = "filled";
      }
    }

    order.quantity = remainingQuantity;
    if (order.quantity > 0) {
      const sellBook = this.sellOrders.get(order.symbol) || [];
      sellBook.push(order);
      sellBook.sort((a, b) => a.price - b.price); // Ascending
      this.sellOrders.set(order.symbol, sellBook);
    } else {
      order.status = "filled";
    }
  }

  public getTrades(): Trade[] {
    return this.trades;
  }
}
