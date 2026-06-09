import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminAuthGate>
      <AdminShell>
        <Outlet />
      </AdminShell>
    </AdminAuthGate>
  );
}