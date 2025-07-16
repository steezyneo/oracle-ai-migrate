-- Sample Sybase procedure with multiple loops for testing performance metrics
CREATE PROCEDURE process_employee_data
    @dept_id INT,
    @salary_threshold DECIMAL(10,2)
AS
BEGIN
    DECLARE @emp_id INT
    DECLARE @emp_name VARCHAR(100)
    DECLARE @emp_salary DECIMAL(10,2)
    DECLARE @total_processed INT = 0
    DECLARE @high_salary_count INT = 0
    
    -- First loop: Process employees by department
    DECLARE emp_cursor CURSOR FOR
        SELECT emp_id, emp_name, salary
        FROM employees
        WHERE dept_id = @dept_id
    
    OPEN emp_cursor
    
    WHILE 1 = 1
    BEGIN
        FETCH NEXT FROM emp_cursor INTO @emp_id, @emp_name, @emp_salary
        
        IF @@FETCH_STATUS <> 0
            BREAK
            
        SET @total_processed = @total_processed + 1
        
        -- Second loop: Check salary levels
        IF @emp_salary > @salary_threshold
        BEGIN
            SET @high_salary_count = @high_salary_count + 1
            
            -- Third loop: Process salary history
            DECLARE @history_count INT = 0
            DECLARE history_cursor CURSOR FOR
                SELECT salary_date, old_salary
                FROM salary_history
                WHERE emp_id = @emp_id
                ORDER BY salary_date DESC
            
            OPEN history_cursor
            
            WHILE 1 = 1
            BEGIN
                FETCH NEXT FROM history_cursor INTO @salary_date, @old_salary
                
                IF @@FETCH_STATUS <> 0
                    BREAK
                    
                SET @history_count = @history_count + 1
                
                -- Fourth loop: Process salary changes
                IF @old_salary < @emp_salary
                BEGIN
                    DECLARE @change_percentage DECIMAL(5,2)
                    SET @change_percentage = ((@emp_salary - @old_salary) / @old_salary) * 100
                    
                    -- Fifth loop: Log significant changes
                    IF @change_percentage > 10
                    BEGIN
                        INSERT INTO salary_changes_log (
                            emp_id,
                            change_date,
                            old_salary,
                            new_salary,
                            change_percentage
                        ) VALUES (
                            @emp_id,
                            GETDATE(),
                            @old_salary,
                            @emp_salary,
                            @change_percentage
                        )
                    END
                END
            END
            
            CLOSE history_cursor
            DEALLOCATE history_cursor
        END
        
        -- Update employee status
        UPDATE employees
        SET last_processed = GETDATE(),
            processing_status = 'COMPLETED'
        WHERE emp_id = @emp_id
    END
    
    CLOSE emp_cursor
    DEALLOCATE emp_cursor
    
    -- Final summary
    PRINT 'Processing complete for department ' + CAST(@dept_id AS VARCHAR(10))
    PRINT 'Total employees processed: ' + CAST(@total_processed AS VARCHAR(10))
    PRINT 'High salary employees: ' + CAST(@high_salary_count AS VARCHAR(10))
    
    RETURN @total_processed
END 