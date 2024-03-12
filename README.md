# simple-pubsub

## Overview

This project simulates a publish-subscribe system for managing events related to the stock levels of machines. The system utilizes TypeScript to define interfaces, classes, and a generic repository, along with a simple Maybe Monad for handling optional values.

## Prerequisites

Ensure you have the following installed on your machine:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/drsumruay2/simple-pubsub.git
   ```

2. Navigate to the project directory:

   ```bash
   cd simple-pubsub
   ```

3. Build and run the application using Docker Compose:

   ```bash
   docker-compose up --build
   ```

4. Run pubsub simulation:
   ```bash
   curl -X POST localhost:4000/api/run-simulate
   ```
