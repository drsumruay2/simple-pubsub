// simulation.ts

import {
  IPublishSubscribeService,
  IEvent,
  MachineSaleEvent,
  MachineRefillEvent,
  LowStockWarningEvent,
  StockLevelOkEvent,
  Machine,
  Repository,
  MachineSaleSubscriber,
  MachineRefillSubscriber,
  StockWarningSubscriber,
  PubSubService,
} from "./pubsub";

export const runSimulation = async () => {
  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PubSubService();

  // create machine repository with 3 machines
  const machineRepository = new Repository<Machine>();
  const machine1: Machine = { id: "001", stockLevel: 3 };
  const machine2: Machine = { id: "002", stockLevel: 5 };
  const machine3: Machine = { id: "003", stockLevel: 1 };
  machineRepository.add(machine1);
  machineRepository.add(machine2);
  machineRepository.add(machine3);

  // Display initial machine stock levels
  console.log("Initial Machine Stock Levels:");
  console.log(machineRepository.getAll());

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(
    machineRepository,
    pubSubService
  );

  // create a machine refill event subscriber
  const refillSubscriber = new MachineRefillSubscriber(
    machineRepository,
    pubSubService
  );

  // create a low stock warning event subscriber
  const stockWarningSubscriber = new StockWarningSubscriber();

  // subscribe the saleSubscriber to the 'sale' type events
  pubSubService.subscribe("sale", saleSubscriber);

  // subscribe the refillSubscriber to the 'refill' type events
  pubSubService.subscribe("refill", refillSubscriber);

  // subscribe the stockWarningSubscriber to the 'lowStockWarning' type events
  pubSubService.subscribe("lowStockWarning", stockWarningSubscriber);

  // create 5 random events
  const events = [1, 2, 3, 4, 5].map((i) => eventGenerator());

  // publish the events
  events.forEach((event) => {
    console.log(
      `Generated event of type '${event.type()}' to machine '${event.machineId()}`
    );
    pubSubService.publish(event);
  });

  // Log final machine stock levels
  console.log("Final Machine Stock Levels:");
  console.log(machineRepository.getAll());
};

// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return "001";
  } else if (random < 2) {
    return "002";
  }
  return "003";
};

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  }
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
};
