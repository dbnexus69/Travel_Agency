import { useState, useEffect } from "react";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardBody } from "../ui/Card";
import PermissionsGrid from "./PermissionsGrid";

interface RolePermissionsTabProps {
  rolePermissions: {
    asesor: any;
    freelancer: any;
  };
  onSaveRolePermissions: (role: "asesor" | "freelancer", permissions: any) => Promise<void>;
  isSaving: boolean;
}

export default function RolePermissionsTab({
  rolePermissions,
  onSaveRolePermissions,
  isSaving,
}: RolePermissionsTabProps) {
  const [editingRole, setEditingRole] = useState<"asesor" | "freelancer">("asesor");
  const [editingUserPermissions, setEditingUserPermissions] = useState<any>(rolePermissions.asesor);

  useEffect(() => {
    setEditingUserPermissions(
      editingRole === "asesor" ? rolePermissions.asesor : rolePermissions.freelancer
    );
  }, [editingRole, rolePermissions]);

  const handleSave = async () => {
    await onSaveRolePermissions(editingRole, editingUserPermissions);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader
        actions={
          <Button onClick={handleSave} disabled={isSaving}>
            <ShieldCheck size={18} /> {isSaving ? "Guardando..." : "Guardar Cambios Globales"}
          </Button>
        }
      >
        Configuración de Permisos por Defecto
      </CardHeader>
      <CardBody>
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6 flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <p className="text-xs text-amber-700 leading-relaxed">
            Aquí defines los permisos predeterminados. Los cambios aplicarán
            a todos los usuarios del rol seleccionado que no tengan permisos
            personalizados.
          </p>
        </div>
        <div className="flex gap-4 mb-6">
          <Button
            variant={editingRole === "asesor" ? "primary" : "outline"}
            onClick={() => setEditingRole("asesor")}
          >
            Rol Asesor
          </Button>
          <Button
            variant={editingRole === "freelancer" ? "primary" : "outline"}
            onClick={() => setEditingRole("freelancer")}
          >
            Rol Freelancer
          </Button>
        </div>
        <PermissionsGrid
          permissions={editingUserPermissions}
          onChange={setEditingUserPermissions}
        />
      </CardBody>
    </Card>
  );
}
