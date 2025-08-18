-- ========================================
-- SYBASE STORED PROCEDURES FOR MIGRATION
-- ========================================

-- Example 1: Simple procedure with parameters and OUTPUT
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

-- Example 3: Procedure with transaction handling
CREATE PROCEDURE sp_transfer_employee
    @emp_id INT,
    @new_dept_id INT,
    @effective_date DATETIME = NULL
AS
BEGIN
    BEGIN TRANSACTION
    
    IF @effective_date IS NULL
        SET @effective_date = GETDATE()
    
    DECLARE @old_dept_id INT
    SELECT @old_dept_id = dept_id FROM employee WHERE emp_id = @emp_id
    
    IF @old_dept_id IS NULL
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Employee not found', 16, 1)
        RETURN
    END
    
    UPDATE employee
    SET dept_id = @new_dept_id,
        hire_date = @effective_date
    WHERE emp_id = @emp_id
    
    IF @@ERROR <> 0
    BEGIN
        ROLLBACK TRANSACTION
        RAISERROR('Failed to update employee department', 16, 1)
        RETURN
    END
    
    INSERT INTO dept_change_log (dept_id, change_type, emp_count_before, emp_count_after)
    VALUES (@old_dept_id, 'TRANSFER_OUT', 0, 0)
    
    COMMIT TRANSACTION
    PRINT 'Employee transfer completed successfully'
END
GO
