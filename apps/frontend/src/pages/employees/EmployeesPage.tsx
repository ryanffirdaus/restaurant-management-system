import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui";
import Icon from "../../components/Icon";
import Card from "../../components/Card";
import type { LayoutContext } from "../../App";
import { useEmployees } from "./hooks/useEmployees";
import EmployeeFilters from "./components/EmployeeFilters";
import EmployeeTable from "./components/EmployeeTable";
import AddEmployeeModal from "./components/AddEmployeeModal";

function EmployeesPage() {
  const { sidebarOpen } = useOutletContext<LayoutContext>();
  const { employeeRole } = useAuth();

  const {
    filtered,
    loading,
    modal,
    form,
    submitting,
    error,
    search,
    roleFilter,
    statusFilter,
    sortKey,
    sortDir,
    setForm,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    toggleSort,
    handleSubmit,
    toggleActive,
    handleDelete,
    openModal,
    closeModal,
    employees,
  } = useEmployees();

  if (employeeRole !== "admin") {
    return <div className="h-16" />;
  }

  return (
    <div>
      <div className="h-16" />
      <div className="p-container-margin space-y-gutter">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">
              Employees
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={openModal}
            icon={<Icon name="ri-add-line" />}
          >
            Add Employee
          </Button>
        </header>

        <EmployeeFilters
          search={search}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          filteredCount={filtered.length}
          totalCount={employees.length}
          onSearchChange={setSearch}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
        />

        <Card padding={false}>
          <EmployeeTable
            employees={filtered}
            loading={loading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
            onToggleActive={toggleActive}
            onDelete={handleDelete}
          />
        </Card>
      </div>

      {modal && (
        <AddEmployeeModal
          form={form}
          submitting={submitting}
          error={error}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={setForm}
        />
      )}
    </div>
  );
}

export default EmployeesPage;
