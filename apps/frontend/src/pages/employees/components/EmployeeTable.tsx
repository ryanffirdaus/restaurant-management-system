import Badge from "../../../components/Badge";
import { Button, Toggle } from "../../../components/ui";
import Table from "../../../components/Table";
import type { Column } from "../../../components/Table";
import type { Employee } from "../types";
import { roleVariant } from "../constants";

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onToggleActive: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}

export default function EmployeeTable({
  employees,
  loading,
  sortKey,
  sortDir,
  onSort,
  onToggleActive,
  onDelete,
}: EmployeeTableProps) {
  const columns: Column<Employee>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (emp) =>
        emp.profile?.name ?? <span className="text-text-muted">—</span>,
      className: "font-medium whitespace-nowrap text-text-main",
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      className: "whitespace-nowrap",
      render: (emp) => (
        <Badge variant={roleVariant[emp.role] ?? "primary"}>{emp.role}</Badge>
      ),
    },
    {
      key: "salary",
      label: "Salary",
      sortable: true,
      className: "tabular-nums whitespace-nowrap text-text-main",
      render: (emp) =>
        emp.salary ? (
          `$${Number(emp.salary).toLocaleString()}`
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      className: "whitespace-nowrap",
      render: (emp) => (
        <Toggle checked={emp.active} onChange={() => onToggleActive(emp)} />
      ),
    },
    {
      key: "hire_date",
      label: "Hire Date",
      sortable: true,
      className: "text-text-muted whitespace-nowrap",
      render: (emp) => new Date(emp.hire_date).toLocaleDateString(),
    },
    {
      key: "actions" as never,
      label: "",
      className: "whitespace-nowrap",
      render: (emp) => (
        <Button
          variant="ghost"
          onClick={() => onDelete(emp)}
          className="text-danger hover:text-danger text-[11px] px-2 py-1"
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={employees}
      loading={loading}
      emptyText="No employees match your filters."
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
    />
  );
}
