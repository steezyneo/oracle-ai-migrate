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

-- Example 3: Audit Table for tracking changes
CREATE TABLE employee_audit (
    audit_id        NUMERIC(12) IDENTITY PRIMARY KEY,
    emp_id          NUMERIC(10) NOT NULL,
    action_type     VARCHAR(10) NOT NULL,
    action_date     DATETIME DEFAULT GETDATE(),
    user_name       VARCHAR(50) DEFAULT SUSER_NAME(),
    old_salary      MONEY NULL,
    new_salary      MONEY NULL
)
GO

-- Example 4: Department Change Log Table
CREATE TABLE dept_change_log (
    log_id          INT IDENTITY PRIMARY KEY,
    dept_id         INT NOT NULL,
    change_date     DATETIME DEFAULT GETDATE(),
    change_type     VARCHAR(10) NOT NULL,
    emp_count_before INT DEFAULT 0,
    emp_count_after  INT DEFAULT 0,
    FOREIGN KEY (dept_id) REFERENCES department(dept_id)
)
GO
