
-- Clean Oracle PL/SQL procedure for updating employee salary
CREATE OR REPLACE PROCEDURE update_salary_proc_13 (
    v_emp_id IN NUMBER,
    v_increment IN NUMBER
)
AS
    v_current_salary NUMBER;
BEGIN
    -- Get current salary using INTO clause (Oracle syntax)
    SELECT salary 
    INTO v_current_salary 
    FROM employee_details_1 
    WHERE emp_id = v_emp_id;
    
    -- Update the salary
    UPDATE employee_details_1
    SET salary = salary + v_increment
    WHERE emp_id = v_emp_id;
    
    -- Print success message
    DBMS_OUTPUT.PUT_LINE('Employee ID ' || v_emp_id || ' salary updated successfully. New salary: ' || (v_current_salary + v_increment));
    
    -- Commit the transaction
    COMMIT;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        DBMS_OUTPUT.PUT_LINE('Employee with ID ' || v_emp_id || ' not found');
        ROLLBACK;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error updating salary: ' || SQLERRM);
        ROLLBACK;
        RAISE;
END update_salary_proc_13;
/
