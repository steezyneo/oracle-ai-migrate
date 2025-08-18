-- ========================================
-- SYBASE TRIGGERS FOR MIGRATION
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
