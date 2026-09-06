import os
import re

files_to_patch = [
    "src/pages/contracts/ContractsPage.tsx",
    "src/pages/dashboard/DashboardPage.tsx",
    "src/pages/departments/DepartmentsPage.tsx",
    "src/pages/employees/EmployeeDetailPage.tsx",
    "src/pages/employees/EmployeeFormModal.tsx",
    "src/pages/employees/EmployeesPage.tsx",
    "src/pages/payroll/AllPayslipsPage.tsx",
    "src/pages/payroll/PayrunsPage.tsx",
    "src/pages/payroll/SalaryStructuresPage.tsx",
    "src/pages/timeoff/TimeOffPage.tsx",
    "src/pages/working_schedules/WorkingSchedulesPage.tsx"
]

import_statement = "import { extractItems } from '../../utils/pagination';\n"
# Some might need different relative path
def get_import_statement(filepath):
    depth = filepath.count('/') - 1
    rel = '../' * depth
    return f"import {{ extractItems }} from '{rel}utils/pagination';\n"

for filepath in files_to_patch:
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        content = f.read()

    # Add import if not exists
    if "extractItems" not in content:
        # insert after last import
        import_match = list(re.finditer(r'^import .*\n', content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end()
            imp = get_import_statement(filepath)
            content = content[:insert_pos] + imp + content[insert_pos:]
    
    # Patch API calls.
    # setEmployees(data || []) -> setEmployees(extractItems(data) || [])
    # or just wrap await calls directly:
    # const data = await ... -> const data = extractItems(await ...)
    
    content = re.sub(r'const (\w+) = await (.*?Api\..*?\(.*?\));', r'const \1 = extractItems(await \2);', content)
    content = re.sub(r'setEmployees\(data \|\| \[\]\)', r'setEmployees(extractItems(data) || [])', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Patch applied")
