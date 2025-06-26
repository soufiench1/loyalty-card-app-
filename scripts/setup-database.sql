-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  rewards INTEGER DEFAULT 0,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_value INTEGER DEFAULT 1,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_item_points table to track points per item per customer
CREATE TABLE IF NOT EXISTS customer_item_points (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id) ON DELETE CASCADE,
  item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, item_id)
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  store_pin TEXT DEFAULT '1234',
  points_for_reward INTEGER DEFAULT 10,
  admin_username TEXT DEFAULT 'admin',
  admin_password TEXT DEFAULT 'password123',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create point_transactions table for logging
CREATE TABLE IF NOT EXISTS point_transactions (
  id SERIAL PRIMARY KEY,
  customer_id TEXT REFERENCES customers(id),
  item_id INTEGER REFERENCES items(id),
  points_added INTEGER DEFAULT 1,
  reward_earned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO settings (store_pin, points_for_reward, admin_username, admin_password)
SELECT '1234', 10, 'admin', 'password123'
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- Insert sample items
INSERT INTO items (name, description, points_value, price, is_active) VALUES
('Coffee', 'Regular coffee', 1, 3.50, true),
('Sandwich', 'Deli sandwich', 2, 8.99, true),
('Pastry', 'Fresh baked pastry', 1, 4.25, true),
('Salad', 'Fresh garden salad', 2, 7.50, true),
('Smoothie', 'Fruit smoothie', 1, 5.99, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_item_points_customer_id ON customer_item_points(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_item_points_item_id ON customer_item_points(item_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_items_is_active ON items(is_active);
