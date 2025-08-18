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

-- ========================================
-- SYBASE STORED PROCEDURES
-- ========================================

-- Example 1: Simple procedure with parameters
CREATE PROCEDURE sp_get_employee_details
    @emp_id INT,
    @dept_name VARCHAR(30) OUTPUT
AS
BEGIN
    SELECT @dept_name = d.dept_name
    FROM employee e
    INNER JOIN department d ON e.dept_id = d.dept_id
    WHERE e.emp_id = @emp_id
    
    SELECT emp_name, salary, hire_date, status
    FROM employee
    WHERE emp_id = @emp_id
END
GO

-- Example 2: Complex procedure with cursor and error handling
CREATE PROCEDURE sp_update_salary_by_dept
    @dept_id INT,
    @increase_percent FLOAT
AS
BEGIN
    DECLARE @emp_id INT
    DECLARE @current_salary MONEY
    DECLARE @new_salary MONEY
    DECLARE @error_count INT = 0
    
    DECLARE emp_cursor CURSOR FOR
        SELECT emp_id, salary
        FROM employee
        WHERE dept_id = @dept_id AND status = 'A'
    
    OPEN emp_cursor
    FETCH NEXT FROM emp_cursor INTO @emp_id, @current_salary
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @new_salary = @current_salary * (1 + @increase_percent / 100)
        
        UPDATE employee
        SET salary = @new_salary
        WHERE emp_id = @emp_id
        
        IF @@ERROR <> 0
            SET @error_count = @error_count + 1
        
        FETCH NEXT FROM emp_cursor INTO @emp_id, @current_salary
    END
    
    CLOSE emp_cursor
    DEALLOCATE emp_cursor
    
    IF @error_count > 0
        RAISERROR('Errors occurred during salary update: %d', 16, 1, @error_count)
    ELSE
        PRINT 'Salary update completed successfully'
END
GO

-- ========================================
-- SYBASE TRIGGERS
-- ========================================

-- Example 1: Audit trigger for employee table
CREATE TRIGGER tr_employee_audit
ON employee
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    DECLARE @action VARCHAR(10)
    
    IF EXISTS(SELECT * FROM inserted) AND EXISTS(SELECT * FROM deleted)
        SET @action = 'UPDATE'
    ELSE IF EXISTS(SELECT * FROM inserted)
        SET @action = 'INSERT'
    ELSE
        SET @action = 'DELETE'
    
    INSERT INTO employee_audit (
        emp_id, 
        action_type, 
        action_date, 
        user_name,
        old_salary,
        new_salary
    )
    SELECT 
        COALESCE(i.emp_id, d.emp_id),
        @action,
        GETDATE(),
        SUSER_NAME(),
        d.salary,
        i.salary
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.emp_id = d.emp_id
END
GO

-- Example 2: Business rule trigger with validation
CREATE TRIGGER tr_salary_validation
ON employee
FOR INSERT, UPDATE
AS
BEGIN
    IF UPDATE(salary)
    BEGIN
        IF EXISTS(
            SELECT 1 FROM inserted i
            INNER JOIN department d ON i.dept_id = d.dept_id
            WHERE i.salary > d.budget * 0.1
        )
        BEGIN
            ROLLBACK TRANSACTION
            RAISERROR('Salary cannot exceed 10%% of department budget', 16, 1)
            RETURN
        END
        
        -- Update department statistics
        UPDATE department
        SET budget = budget + (i.salary - COALESCE(d.salary, 0))
        FROM inserted i
        LEFT JOIN deleted d ON i.emp_id = d.emp_id
        WHERE department.dept_id = i.dept_id
    END
END
GO

-- Example 3: Complex trigger with multiple tables
CREATE TRIGGER tr_employee_dept_sync
ON employee
FOR INSERT, UPDATE, DELETE
AS
BEGIN
    -- Update department employee count
    UPDATE department
    SET total_employees = (
        SELECT COUNT(*)
        FROM employee
        WHERE dept_id = department.dept_id
        AND status = 'A'
    )
    WHERE dept_id IN (
        SELECT DISTINCT dept_id FROM inserted
        UNION
        SELECT DISTINCT dept_id FROM deleted
    )
    
    -- Log changes for reporting
    INSERT INTO dept_change_log (
        dept_id,
        change_date,
        change_type,
        emp_count_before,
        emp_count_after
    )
    SELECT 
        d.dept_id,
        GETDATE(),
        CASE 
            WHEN i.emp_id IS NOT NULL AND del.emp_id IS NULL THEN 'ADD'
            WHEN i.emp_id IS NULL AND del.emp_id IS NOT NULL THEN 'REMOVE'
            ELSE 'MODIFY'
        END,
        d.total_employees - 1,
        d.total_employees
    FROM department d
    LEFT JOIN inserted i ON d.dept_id = i.dept_id
    LEFT JOIN deleted del ON d.dept_id = del.dept_id
    WHERE i.emp_id IS NOT NULL OR del.emp_id IS NOT NULL
END
GO
