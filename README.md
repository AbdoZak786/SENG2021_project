# Invoice Management API

## Overview
The **Invoice Management API** is designed to simplify and streamline the billing workflow for Australian businesses. This API enhances efficiency, ensures regulatory compliance, and improves accuracy in invoice processing.

## Key Features
- **Efficient Invoice Management**: Simplifies the creation, storage, and modification of invoices, reducing administrative workload.
- **Regulatory Compliance**: Ensures all invoices meet the requirements of the Australian Taxation Office (ATO), minimizing the risk of fines.
- **Enhanced Accuracy**: Automates calculations and validation checks to prevent errors common in manual invoicing.

## Team - Error404NotFound
**Team Lead**
- Kalib Ismail

**Product Owners**
- Hadheed Siyan
- Abdoali Zakir

**Delivery Manager**
- Malachi English

**Developers**
- Pranav Arora
- Janice Joju

## Project Status
- **Current Phase**: In development (Sprint 2 of 4)
- **Expected Completion Date**: April 21, 2025

## Getting Started
### Prerequisites
To use this API, you need:
- Node.js (v16+ recommended)
- A configured database (e.g., PostgreSQL, MongoDB)
- API authentication credentials (if required)

### Installation
```sh
# Clone the repository
git clone https://github.com/your-repo/invoice-api.git
cd invoice-api

# Install dependencies
npm install
```

### Running the API
```sh
# Start the development server
npm run dev

# Start in production mode
npm start
```

## API Structure
### Routes
The API follows RESTful conventions and includes the following routes:

| Method | Endpoint           | Description                     |
|--------|-------------------|---------------------------------|
| GET    | /invoices         | Retrieve all invoices          |
| POST   | /invoices         | Create a new invoice           |
| GET    | /invoices/{id}    | Retrieve a specific invoice    |
| PUT    | /invoices/{id}    | Update an existing invoice     |
| DELETE | /invoices/{id}    | Delete an invoice              |
| GET    | /customers        | Retrieve all customers         |
| POST   | /customers        | Add a new customer             |
| PUT    | /customers/{id}   | Update customer details        |
| DELETE | /customers/{id}   | Remove a customer              |
| GET    | /products         | Retrieve all products          |
| POST   | /products         | Add a new product              |
| PUT    | /products/{id}    | Update product details         |
| DELETE | /products/{id}    | Remove a product               |
| GET    | /sellers          | Retrieve all sellers           |
| POST   | /sellers          | Add a new seller               |
| PUT    | /sellers/{id}     | Update seller details          |
| DELETE | /sellers/{id}     | Remove a seller                |
| GET    | /users            | Retrieve all users             |
| POST   | /users            | Register a new user            |
| PUT    | /users/{id}       | Update user details            |
| DELETE | /users/{id}       | Remove a user                  |

### Controllers
Controllers handle business logic and data processing for different API endpoints:
- **customersController.ts**: Manages customer data operations.
- **invoicesController.ts**: Handles invoice creation, retrieval, updating, and deletion.
- **productsController.ts**: Manages product-related operations.
- **sellersController.ts**: Handles seller data operations.
- **usersController.ts**: Manages user authentication and details.

## Contribution
We welcome contributions! Please follow the guidelines:
1. Fork the repository.
2. Create a feature branch.
3. Commit changes and push.
4. Open a pull request.


