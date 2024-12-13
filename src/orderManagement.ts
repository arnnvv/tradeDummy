import { v4 as uuidv4 } from "uuid";

export type OrderSide = "buy" | "sell";
export type OrderStatus = "open" | "filled" | "cancelled";

export interface Order {
  orderId: string;
  clientId: string;
  symbol: string;
  price: number;
  quantity: number;
  side: OrderSide;
  status: OrderStatus;
  timestamp: number;
}

export class OrderManagement {
  private orders: Map<string, Order>;

  constructor() {
    this.orders = new Map();
  }

  public createOrder(
    clientId: string,
    symbol: string,
    price: number,
    quantity: number,
    side: OrderSide,
  ): Order {
    const order: Order = {
      orderId: uuidv4(),
      clientId,
      symbol,
      price,
      quantity,
      side,
      status: "open",
      timestamp: Date.now(),
    };
    this.orders.set(order.orderId, order);
    return order;
  }

  public cancelOrder(orderId: string, clientId: string): boolean {
    const order = this.orders.get(orderId);
    if (order && order.clientId === clientId && order.status === "open") {
      order.status = "cancelled";
      this.orders.set(orderId, order);
      return true;
    }
    return false;
  }

  public getOpenOrders(): Order[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.status === "open",
    );
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): boolean {
    const order = this.orders.get(orderId);
    if (order) {
      order.status = status;
      this.orders.set(orderId, order);
      return true;
    }
    return false;
  }
}
