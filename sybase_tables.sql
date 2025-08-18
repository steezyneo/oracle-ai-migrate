-- ========================================
-- SYBASE TABLE EXAMPLES FOR MIGRATION
-- ========================================

-- Example 1: Employee Table with Sybase-specific syntax
CREATE TABLE employee (
    emp_id          NUMERIC(10) IDENTITY PRIMARY KEY,
    emp_name        VARCHAR(50) NOT NULL,
    dept_id         INT NOT NULL,
    salary          MONEY DEFAULT 0,
    hire_date       DATETIME DEFAULT GETDATE(),
    status          CHAR(1) DEFAULT 'A' CHECK (status IN ('A', 'I')),
    manager_id      NUMERIC(10) NULL,
    FOREIGN KEY (manager_id) REFERENCES employee(emp_id)
)
GO

-- Example 2: Department Table with computed column
CREATE TABLE department (
    dept_id         INT IDENTITY(1,1) PRIMARY KEY,
    dept_name       VARCHAR(30) NOT NULL UNIQUE,
    budget          MONEY NOT NULL DEFAULT 0,
    created_date    DATETIME DEFAULT GETDATE(),
    total_employees AS (SELECT COUNT(*) FROM employee WHERE dept_id = department.dept_id)
)
GO

-- Example 3: Product Table with various Sybase data types
CREATE TABLE product (
    product_id      NUMERIC(12) IDENTITY(1000,1) PRIMARY KEY,
    product_code    VARCHAR(20) NOT NULL UNIQUE,
    product_name    VARCHAR(100) NOT NULL,
    description     TEXT NULL,
    unit_price      MONEY NOT NULL,
    quantity_stock  INT DEFAULT 0,
    reorder_level   SMALLINT DEFAULT 10,
    discontinued    BIT DEFAULT 0,
    category_id     INT NOT NULL,
    created_by      VARCHAR(30) DEFAULT SUSER_NAME(),
    created_date    DATETIME DEFAULT GETDATE(),
    modified_date   TIMESTAMP NULL
)
GO

-- Example 4: Order Header with complex constraints
CREATE TABLE order_header (
    order_id        NUMERIC(15) IDENTITY PRIMARY KEY,
    order_number    VARCHAR(20) NOT NULL UNIQUE,
    customer_id     INT NOT NULL,
    order_date      DATETIME DEFAULT GETDATE(),
    required_date   DATETIME NULL,
    shipped_date    DATETIME NULL,
    ship_via        INT NULL,
    freight         MONEY DEFAULT 0,
    ship_name       VARCHAR(40) NULL,
    ship_address    VARCHAR(60) NULL,
    ship_city       VARCHAR(15) NULL,
    ship_postal     VARCHAR(10) NULL,
    order_status    CHAR(1) DEFAULT 'P' CHECK (order_status IN ('P', 'S', 'C', 'X')),
    total_amount    MONEY DEFAULT 0,
    CONSTRAINT chk_dates CHECK (required_date >= order_date),
    CONSTRAINT chk_shipped CHECK (shipped_date IS NULL OR shipped_date >= order_date)
)
GO
