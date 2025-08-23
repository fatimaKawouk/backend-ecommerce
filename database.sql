CREATE DATABASE backend2;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
    Uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(36) NOT NULL ,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(25) DEFAULT 'user'
);

CREATE TABLE product (
    pid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(36) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(36) NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    stock INT DEFAULT 0
);

CREATE TABLE orders (
    oid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID,
    status VARCHAR(25) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(Uid)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orderId UUID NOT NULL,
    productId UUID NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (orderId) REFERENCES orders(Oid),
    FOREIGN KEY (productId) REFERENCES product(Pid)
);


CREATE TABLE carts (
    Cid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userId UUID UNIQUE NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(Uid)
);

CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cartId UUID NOT NULL,
    productId UUID NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (cartId) REFERENCES carts(Cid),
    FOREIGN KEY (productId) REFERENCES product(Pid)
);

ALTER TABLE order_items
ADD COLUMN price_at_purchase NUMERIC(12,2) NOT NULL

ALTER TABLE orders 
ADD COLUMN  total_amount NUMERIC(12,2) NOT NULL