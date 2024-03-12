import {
  PubSubService,
  StockWarningSubscriber,
  MachineRefillEvent,
  MachineRefillSubscriber,
  Repository,
  Machine,
  StockLevelOkEvent,
} from "../pubsub";
describe("MachineRefillSubscriber", () => {
  it("should handle MachineRefillEvent and update stock level and publish StockLevelOk Event", () => {
    // Arrange
    const pubSubService = new PubSubService();
    const machinesRepository = new Repository<Machine>();
    const stockWarningSubscriber = new StockWarningSubscriber(
      machinesRepository
    );
    const machineRefillSubscriber = new MachineRefillSubscriber(
      machinesRepository,
      pubSubService
    );

    pubSubService.subscribe("refill", machineRefillSubscriber);
    pubSubService.subscribe("lowStockWarning", stockWarningSubscriber);
    // Check if StockLevelOkEvent is published
    const mockStockLevelOkHandler = jest.fn();
    pubSubService.subscribe("stockLevelOk", {
      handle: mockStockLevelOkHandler,
    });

    const machineId = "machine123";
    const initialStockLevel = 2;
    const refillQuantity = 5;

    const machine = new Machine(machineId);
    machine.stockLevel = initialStockLevel;
    machine.hasLowStockWarning = true;
    machinesRepository.add(machine);

    // publish a MachineRefillEvent
    pubSubService.publish(new MachineRefillEvent(refillQuantity, machineId));

    // Assert
    const updatedMachine = machinesRepository
      .getById(machineId)
      .getOrElse(null);

    expect(updatedMachine).not.toBeNull();
    expect(updatedMachine?.stockLevel).toBe(initialStockLevel + refillQuantity);
    expect(updatedMachine?.hasLowStockWarning).toBeFalsy();
    expect(mockStockLevelOkHandler).toHaveBeenCalledWith(
      expect.any(StockLevelOkEvent)
    );
  });
});
