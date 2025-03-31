-- Create database (run this separately as superuser if needed)
-- CREATE DATABASE barcode_scanner;

-- Connect to the database
\c barcode_scanner;

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    product_image VARCHAR(255),
    price1 NUMERIC(10, 2) NOT NULL,
    price2 NUMERIC(10, 2),
    price3 NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create barcodes table
CREATE TABLE barcodes (
    id SERIAL PRIMARY KEY,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    product_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_code) REFERENCES products(product_code)
);

-- Insert dummy products
INSERT INTO products (product_code, product_name, product_image, price1, price2, price3) VALUES
('P001', 'شیر کاله', '/images/p001.jpg', 15000, 14500, 14000),
('P002', 'ماست دامداران', '/images/p002.jpg', 28000, 27500, 27000),
('P003', 'پنیر لیقوان', '/images/p003.jpg', 45000, 44000, 43000),
('P004', 'نوشابه کوکاکولا', '/images/p004.jpg', 12000, 11500, 11000),
('P005', 'روغن لادن', '/images/p005.jpg', 85000, 84000, 83000),
('P006', 'برنج طارم', '/images/p006.jpg', 120000, 115000, 110000),
('P007', 'چای احمد', '/images/p007.jpg', 95000, 92000, 90000),
('P008', 'قند نقل', '/images/p008.jpg', 65000, 63000, 60000),
('P009', 'شکر سفید', '/images/p009.jpg', 42000, 40000, 39000),
('P010', 'رب گوجه فرنگی', '/images/p010.jpg', 32000, 31000, 30000);

-- Insert dummy barcodes
INSERT INTO barcodes (barcode, product_code) VALUES
('6260001234567', 'P001'),
('6260001234568', 'P002'),
('6260001234569', 'P003'),
('6260001234570', 'P004'),
('6260001234571', 'P005'),
('6260001234572', 'P006'),
('6260001234573', 'P007'),
('6260001234574', 'P008'),
('6260001234575', 'P009'),
('6260001234576', 'P010'),
-- Add alternate barcodes for some products
('6261001234567', 'P001'),
('6262001234568', 'P002'),
('6263001234569', 'P003');

-- Create index for faster lookups
CREATE INDEX idx_barcode ON barcodes(barcode);
CREATE INDEX idx_product_code ON products(product_code);
