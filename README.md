# Backend E-commerce Project

## Description
- A Node.js/Express backend for managing an e-commerce platform, including:
    User authentication and role-based access (admin/user)
    CRUD operations for products, users, carts, and orders
    Search and filtering for products

API validated using OpenAPI (YAML specification) and tested with Postman

Setup Instructions
1. Clone the repository
git clone https://github.com/fatimaKawouk/backend-ecommerce.git
cd backend-ecommerce

2. Install dependencies
npm install

3. Setup PostgreSQL
- Make sure PostgreSQL is installed and running.

3. Create a .env file in the root folder:

PORT_DB=your_db_port
USER_DB=your_db_user
PASSWORD_DB=your_db_password
NAME_DB=transactions_db
PRIVATE_KEY=your_jwt_secret


### Start the application:
node index.js

Server runs at: http://localhost:3000

### API Usage Examples

# Login
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"ahmad@gmail.com","password":"mypass911"}'

# Register user
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{
  "name": "Clara",
  "email": "clara@gmail.com",
  "password": "mypassclara1",
  "re_password": "mypassclara1",
  "role": "user"
}'

# Get products
curl -X GET "http://localhost:3000/products?page=1&limit=6&category=school"

# Search products
curl -X GET "http://localhost:3000/products/search?q=bottle&minPrice=1&maxPrice=20" \
-H "Authorization: Bearer <your-token>"

# Get a single product
curl -X GET http://localhost:3000/products/<product-id> \
-H "Authorization: Bearer <your-token>"

# Create product (Admin only)
curl -X POST http://localhost:3000/products \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{
  "title": "Bottle",
  "description": "Plastic bottle for schools",
  "price": 4,
  "category": "school",
  "stock": 10
}'

# Update product (Admin only)
curl -X PATCH http://localhost:3000/products/<product-id> \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{"stock":3}'

# Delete product (Admin only)
curl -X DELETE http://localhost:3000/products/<product-id> \
-H "Authorization: Bearer <your-token>"


# Get all users (Admin only)
curl -X GET "http://localhost:3000/users?page=1&sort=uid" \
-H "Authorization: Bearer <your-token>"


# Get a single user
curl -X GET http://localhost:3000/users/<user-id> \
-H "Authorization: Bearer <your-token>"


# Update a user
curl -X PATCH http://localhost:3000/users/<user-id> \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{"name":"christina"}'


# Delete a user (Admin only)
curl -X DELETE http://localhost:3000/users/<user-id> \
-H "Authorization: Bearer <your-token>"

# Get all orders
curl -X GET "http://localhost:3000/orders?page=1&sort=total_amount" \
-H "Authorization: Bearer <your-token>"


# Get  orders for specific user
curl -X GET http://localhost:3000/orders/<order-id> \
-H "Authorization: Bearer <your-token>"


# Create an order
curl -X POST http://localhost:3000/orders \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{
  "source":"accountid1",
  "destination":"accountid2",
  "amount":100
}'

# Update an order (Admin only)
curl -X PATCH http://localhost:3000/orders/<order-id> \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{"status":"completed"}'

# Get cart (User only)
curl -X GET http://localhost:3000/carts/items?page=1&limit=10 \
-H "Authorization: Bearer <your-token>"

# Add item to cart
curl -X POST http://localhost:3000/carts/items \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{"product":"<product-id>", "quantity":2}'


# Update cart item
curl -X PATCH http://localhost:3000/carts/items/<product-id> \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{"quantity":"increase"}'


# Delete cart item
curl -X DELETE http://localhost:3000/carts/items/<product-id> \
-H "Authorization: Bearer <your-token>"


### Running Tests
npm test