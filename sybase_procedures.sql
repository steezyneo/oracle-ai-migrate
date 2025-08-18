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
    
    IF @@ROWCOUNT = 0
        RAISERROR('Employee not found', 16, 1)
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
    DECLARE @updated_count INT = 0
    
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
        ELSE
            SET @updated_count = @updated_count + 1
        
        FETCH NEXT FROM emp_cursor INTO @emp_id, @current_salary
    END
    
    CLOSE emp_cursor
    DEALLOCATE emp_cursor
    
    IF @error_count > 0
        RAISERROR('Errors occurred during salary update: %d', 16, 1, @error_count)
    ELSE
        PRINT 'Salary update completed successfully for ' + CONVERT(VARCHAR, @updated_count) + ' employees'
END
GO

-- Example 3: Procedure with transaction handling
CREATE PROCEDURE sp_transfer_employee
    @emp_id INT,
    @new_dept_id INT,
    @effective_date DATETIME = NULL
AS
BEGIN
    DECLARE @old_dept_id INT
    DECLARE @emp_name VARCHAR(50)
    
    IF @effective_date IS NULL
        SET @effective_date = GETDATE()
    
    BEGIN TRANSACTION
    
    BEGIN TRY
        -- Get current department
        SELECT @old_dept_id = dept_id, @emp_name = emp_name
        FROM employee
        WHERE emp_id = @emp_id
        
        IF @@ROWCOUNT = 0
        BEGIN
            ROLLBACK TRANSACTION
            RAISERROR('Employee ID %d not found', 16, 1, @emp_id)
            RETURN
        END
        
        -- Update employee department
        UPDATE employee
        SET dept_id = @new_dept_id,
            modified_date = @effective_date
        WHERE emp_id = @emp_id
        
        -- Log the transfer
        INSERT INTO employee_transfer_log (
            emp_id, 
            emp_name,
            old_dept_id, 
            new_dept_id, 
            transfer_date,
            created_by
        )
        VALUES (
            @emp_id, 
            @emp_name,
            @old_dept_id, 
            @new_dept_id, 
            @effective_date,
            SUSER_NAME()
        )
        
        COMMIT TRANSACTION
        PRINT 'Employee transfer completed successfully'
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        DECLARE @error_message VARCHAR(500) = ERROR_MESSAGE()
        RAISERROR('Transfer failed: %s', 16, 1, @error_message)
    END CATCH
END
GO

-- Example 4: Procedure with dynamic SQL
CREATE PROCEDURE sp_get_top_performers
    @dept_id INT = NULL,
    @top_count INT = 10,
    @sort_column VARCHAR(20) = 'salary'
AS
BEGIN
    DECLARE @sql_query VARCHAR(1000)
    DECLARE @where_clause VARCHAR(100) = ''
    DECLARE @order_clause VARCHAR(50)
    
    -- Build WHERE clause
    IF @dept_id IS NOT NULL
        SET @where_clause = ' WHERE dept_id = ' + CONVERT(VARCHAR, @dept_id)
    
    -- Validate sort column
    IF @sort_column NOT IN ('salary', 'hire_date', 'emp_name')
        SET @sort_column = 'salary'
    
    SET @order_clause = ' ORDER BY ' + @sort_column + ' DESC'
    
    -- Build dynamic SQL
    SET @sql_query = 
        'SELECT TOP ' + CONVERT(VARCHAR, @top_count) + 
        ' emp_id, emp_name, salary, hire_date, status ' +
        'FROM employee' + 
        @where_clause + 
        @order_clause
    
    EXEC(@sql_query)
END
GO
