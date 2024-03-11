// interfaces
export interface IEvent {
  type(): string;
  machineId(): string;
}

export interface ISubscriber {
  handle(event: IEvent): void;
}

export interface IPublishSubscribeService {
  publish(event: IEvent): void;
  subscribe(type: string, handler: ISubscriber): void;
  unsubscribe(type: string, handler: ISubscriber): void; // Added unsubscribe method
}

// implementations
export class MachineSaleEvent implements IEvent {
  constructor(
    private readonly _sold: number,
    private readonly _machineId: string
  ) {}

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold;
  }

  type(): string {
    return "sale";
  }
}

export class MachineRefillEvent implements IEvent {
  constructor(
    private readonly _refill: number,
    private readonly _machineId: string
  ) {}

  machineId(): string {
    return this._machineId;
  }

  getRefillQuantity(): number {
    // Add this method
    return this._refill;
  }

  type(): string {
    return "refill";
  }
}

export class LowStockWarningEvent implements IEvent {
  constructor(private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return "lowStockWarning";
  }
}

export class StockLevelOkEvent implements IEvent {
  constructor(private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return "stockLevelOk";
  }
}

export class MachineSaleSubscriber implements ISubscriber {
  public machineRepository: Repository<Machine>;
  private pubSubService: IPublishSubscribeService; // Add a private field for PubSubService

  constructor(
    machineRepository: Repository<Machine>,
    pubSubService: IPublishSubscribeService
  ) {
    this.machineRepository = machineRepository;
    this.pubSubService = pubSubService;
  }

  handle(event: MachineSaleEvent): void {
    const machine = this.machineRepository
      .getById(event.machineId())
      .getOrElse(null);
    if (machine !== null) {
      machine.stockLevel -= event.getSoldQuantity();
      console.log(
        `Sold '${event.getSoldQuantity()}' from machine '${event.machineId()}' stock level is now '${
          machine.stockLevel
        }'`
      );
      if (machine.stockLevel < 3) {
        this.pubSubService.publish(new LowStockWarningEvent(event.machineId()));
      } else {
        //this.pubSubService.publish(new StockLevelOkEvent(event.machineId()));
      }
    } else {
      console.log(`No subscriber for Machine ${event.machineId()}`);
    }
  }
}

export class MachineRefillSubscriber implements ISubscriber {
  private machineRepository: Repository<Machine>;
  private pubSubService: IPublishSubscribeService; // Add a private field for PubSubService
  constructor(
    machineRepository: Repository<Machine>,
    pubSubService: IPublishSubscribeService
  ) {
    this.machineRepository = machineRepository;
    this.pubSubService = pubSubService;
  }

  handle(event: MachineRefillEvent): void {
    // Increase the stock quantity of the machine
    const machine = this.machineRepository
      .getById(event.machineId())
      .getOrElse(null);
    if (machine !== null) {
      machine.stockLevel += event.getRefillQuantity();
      console.log(
        `Refilled Machine ${event.machineId()} stock for '${event.getRefillQuantity()}' level is now '${
          machine.stockLevel
        }'`
      );
      // Check if the stock level is now 3 or above to generate StockLevelOkEvent
      if (machine.stockLevel >= 3) {
        this.pubSubService.publish(new StockLevelOkEvent(event.machineId()));
      }
    } else {
      console.log(`No subscriber for Machine ${event.machineId()}`);
    }
  }
}

export class StockWarningSubscriber implements ISubscriber {
  private lowStockWarningReceived: Set<string> = new Set();

  handle(event: LowStockWarningEvent): void {
    // Check if the warning event has already been received for this machine
    if (!this.lowStockWarningReceived.has(event.machineId())) {
      console.log(`Low stock warning for machine ${event.machineId()}`);
      this.lowStockWarningReceived.add(event.machineId());
    }
  }
}
// objects
export class Machine {
  public stockLevel = 5;
  public id: string;

  constructor(id: string) {
    this.id = id;
  }
}
// Generic Repository
export class Repository<T> {
  private entities: T[] = [];

  getAll(): T[] {
    return this.entities;
  }

  getById(id: string): Maybe<T | null> {
    return Maybe.some(
      this.entities.find(
        (entity: any) => (entity as { id: string }).id === id
      ) || null
    );
  }

  add(entity: T): void {
    this.entities.push(entity);
  }

  update(entity: T): void {
    const index = this.entities.findIndex(
      (e: any) => (e as { id: string }).id === (entity as { id: string }).id
    );

    if (index !== -1) {
      this.entities[index] = entity;
    }
  }

  remove(id: string): void {
    this.entities = this.entities.filter(
      (entity: any) => (entity as { id: string }).id !== id
    );
  }
}
// Maybe Monad
class Maybe<T> {
  private readonly value: T | null;

  private constructor(value: T | null) {
    this.value = value;
  }

  static some<T>(value: T) {
    return new Maybe(value);
  }

  static nothing<T>(): Maybe<T> {
    return new Maybe<T>(null);
  }

  map<U>(transform: (value: T) => U): Maybe<U> {
    return this.value !== null
      ? Maybe.some(transform(this.value))
      : Maybe.nothing<U>();
  }

  flatMap<U>(transform: (value: T) => Maybe<U>): Maybe<U> {
    return this.value !== null ? transform(this.value) : Maybe.nothing<U>();
  }

  getOrElse<U>(defaultValue: U): T | U {
    return this.value !== null && this.value !== undefined
      ? this.value
      : defaultValue;
  }
}
export class PubSubService implements IPublishSubscribeService {
  private subscribers: Record<string, ISubscriber[]>;

  constructor() {
    this.subscribers = {};
  }

  publish(event: IEvent): void {
    const eventType = event.type();
    const eventSubscribers = this.subscribers[eventType] || [];

    Maybe.some(eventSubscribers)
      .map((subscribers) => {
        for (const subscriber of subscribers) {
          subscriber.handle(event);
        }
      })
      .getOrElse(() =>
        console.log(`No subscribers for event type '${eventType}'`)
      );
  }

  subscribe(type: string, handler: ISubscriber): void {
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }

    this.subscribers[type].push(handler);
    console.log(`Subscriber added for event type '${type}'`);
  }

  unsubscribe(type: string, handler: ISubscriber): void {
    const eventSubscribers = this.subscribers[type] || [];
    const index = eventSubscribers.indexOf(handler);

    if (index !== -1) {
      eventSubscribers.splice(index, 1);
      console.log(`Subscriber removed for event type '${type}'`);
    }
  }
}
