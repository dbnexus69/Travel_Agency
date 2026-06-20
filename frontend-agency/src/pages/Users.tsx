import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Eye,
  Key,
  Trash2,
  AlertTriangle,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, TableRow, TableCell } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Input } from "../components/ui/Form";
import {
  User,
  RolePermissions,
  normalizeRolePermissions,
  ADMIN_PERMISSIONS,
  DEFAULT_ASESOR_PERMISSIONS,
} from "../types";
import PermissionsGrid from "../components/users/PermissionsGrid";
import UserDetailModal from "../components/users/UserDetailModal";
import UserFormModal from "../components/users/UserFormModal";
import RolePermissionsTab from "../components/users/RolePermissionsTab";
import Avatar from "../components/ui/Avatar";
import SortIcon from "../components/ui/SortIcon";
import LoadingScreen from "../components/ui/LoadingScreen";
import { formatId } from "../utils/formatters";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  asesor: "Asesor",
  freelancer: "Freelancer",
  vendor: "Asesor",
  vendedor: "Asesor",
};

export default function Users() {
  const {
    data,
    salesLoading,
    addUser,
    updateUser,
    deleteUser,
    updateRolePermissions,
    updateUserPermissions,
    fetchUsers,
    fetchSales,
  } = useData();
  const { user: currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "permissions">("users");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShowError(true);
    setTimeout(() => setShowError(false), 5000);
  };

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState<User | null>(null);

  const handleViewDetail = (user: User) => {
    setSelectedUserForDetail(user);
    setIsDetailOpen(true);
  };

  const [selectedUserForPermissions, setSelectedUserForPermissions] =
    useState<User | null>(null);
  const [editingUserPermissions, setEditingUserPermissions] =
    useState<RolePermissions>(
      data.config.rolePermissions?.asesor || DEFAULT_ASESOR_PERMISSIONS
    );

  // Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "asc" | "desc";
  }>({ key: "id", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Lazy Load Fetch
  useEffect(() => {
    Promise.all([
      fetchUsers(),
      fetchSales()
    ]).finally(() => setIsLoading(false));
  }, [fetchUsers, fetchSales]);

  // Filtrado y Ordenado de usuarios
  const filteredUsers = useMemo(() => {
    const filtered = data.users.filter((user) => {
      const matchesSearch =
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.docNumber || "").includes(searchTerm);
      const matchesRole = filterRole === "all" || user.role === filterRole;
      const matchesStatus =
        filterStatus === "all" || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [data.users, searchTerm, filterRole, filterStatus, sortConfig]);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
    } else {
      setEditingUser(null);
    }
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const action = user.status === "active" ? "desactivado" : "activado";
      await updateUser(user.id, {
        status: user.status === "active" ? "inactive" : "active",
      });
      setSuccessMessage(`Usuario ${user.name} ${action} correctamente`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Error al cambiar estado");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const handleDeleteRequest = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    const isFreelancerOrAsesor = userToDelete.role === "freelancer" || userToDelete.role === "asesor";
    if (isFreelancerOrAsesor) {
      const hasSales = (data.sales || []).some(s => Number(s.asesorId) === Number(userToDelete.id));
      if (hasSales) {
        setIsSaving(true);
        try {
          await updateUser(userToDelete.id, { status: "inactive" });
          setErrorMessage("No se puede eliminar un usuario con ventas registradas. El usuario ha sido desactivado automáticamente retirando su acceso.");
          setShowError(true);
          setIsDeleteModalOpen(false);
          setTimeout(() => setShowError(false), 5000);
        } catch (err: any) {
          setErrorMessage(err?.response?.data?.message || "Error al desactivar el usuario");
          setShowError(true);
          setTimeout(() => setShowError(false), 3000);
        } finally {
          setIsSaving(false);
        }
        return;
      }
    }

    setIsSaving(true);
    try {
      await deleteUser(userToDelete.id);
      setSuccessMessage("Usuario eliminado correctamente");
      setShowSuccess(true);
      setIsDeleteModalOpen(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Error al eliminar el usuario");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPermissions = (user: User) => {
    setSelectedUserForPermissions(user);
    const defaultPerms =
      user.role === "admin"
        ? ADMIN_PERMISSIONS
        : user.role === "freelancer"
          ? data.config.rolePermissions.freelancer
          : data.config.rolePermissions.asesor;
    setEditingUserPermissions(
      user.customPermissions
        ? normalizeRolePermissions(user.customPermissions, defaultPerms)
        : defaultPerms
    );
    setIsPermissionsModalOpen(true);
  };

  const handleSaveUserPermissions = async () => {
    if (!selectedUserForPermissions) return;
    setIsSaving(true);
    try {
      const defaultPerms =
        selectedUserForPermissions.role === "admin"
          ? ADMIN_PERMISSIONS
          : selectedUserForPermissions.role === "freelancer"
            ? data.config.rolePermissions.freelancer
            : data.config.rolePermissions.asesor;

      const diffPermissions: any = {};
      for (const mod in editingUserPermissions) {
        for (const act in (editingUserPermissions as any)[mod]) {
          const editedVal = (editingUserPermissions as any)[mod][act];
          const defaultVal = (defaultPerms as any)[mod][act];
          if (editedVal !== defaultVal) {
            if (!diffPermissions[mod]) diffPermissions[mod] = {};
            diffPermissions[mod][act] = editedVal;
          }
        }
      }

      await updateUserPermissions(selectedUserForPermissions.id, diffPermissions);
      setSuccessMessage(`Permisos de ${selectedUserForPermissions.name} actualizados`);
      setShowSuccess(true);
      setIsPermissionsModalOpen(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || "Error al guardar permisos");
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const requestSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterStatus]);

  if (isLoading && data.users.length === 0) {
    return <LoadingScreen fullScreen={false} />;
  }

  return (
    <div className="space-y-6 relative animate-fade-in">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[200] flex justify-center">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="animate-confetti absolute top-0 text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                color: ["#FFD700", "#FF4500", "#00BFFF", "#32CD32", "#FF69B4"][
                  Math.floor(Math.random() * 5)
                ],
              }}
            >
              ★
            </div>
          ))}
        </div>
      )}

      {showSuccess && createPortal(
        <div className="fixed top-20 right-6 z-[200] bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in-right">
          <div className="bg-green-500 text-white rounded-full p-1">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Operación Exitosa</p>
            <p className="text-xs opacity-90">{successMessage}</p>
          </div>
        </div>,
        document.body
      )}
      {showError && createPortal(
        <div className="fixed top-32 right-6 z-[200] bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in-right">
          <div className="bg-rose-500 text-white rounded-full p-1">
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Error</p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
        </div>,
        document.body
      )}

      {/* Header de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1a2e] flex items-center gap-3">
            <ShieldCheck className="text-[#512DDB] w-8 h-8" /> Gestión de Usuarios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra los accesos, roles y permisos de tu equipo corporativo.
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="shadow-lg shadow-[#512DDB]/20 bg-[#512DDB] hover:bg-[#4E30B2] text-white w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Nuevo Usuario
        </Button>
      </div>

      <div className="flex w-full sm:w-auto overflow-x-auto border-b border-gray-border scrollbar-none">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "users" ? "border-[#512DDB] text-[#512DDB]" : "border-transparent text-gray-500 hover:text-[#4E30B2] hover:bg-[#D2C3F7]/20"}`}
        >
          Lista de Usuarios
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`flex-1 sm:flex-initial text-center whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === "permissions" ? "border-[#512DDB] text-[#512DDB]" : "border-transparent text-gray-500 hover:text-[#4E30B2] hover:bg-[#D2C3F7]/20"}`}
        >
          Permisos por Rol
        </button>
      </div>

      {activeTab === "users" ? (
        <Card className="animate-fade-in">
          <CardHeader
            actions={
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    placeholder="Buscar por nombre, doc o correo..." 
                    className="pl-10 pr-9 w-full"
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded">
                      <X size={14} />
                    </button>
                  )}
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="text-sm border border-gray-border rounded-lg px-3 py-2 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-200 w-full sm:w-auto"
                >
                  <option value="all">Todos los Roles</option>
                  <option value="admin">Admins</option>
                  <option value="asesor">Asesores</option>
                  <option value="freelancer">Freelancers</option>
                </select>
              </div>
            }
          >
            Personal de la Agencia
          </CardHeader>
          <div className="overflow-x-auto w-full">
            <Table
              headers={[
                { key: 'id', label: '#' },
                { key: 'name', label: 'Usuario' },
                { key: 'role', label: 'Rol' },
                { key: 'docNumber', label: 'Documento' },
                { key: 'phone', label: 'Teléfono' },
                { key: 'status', label: 'Estado' },
                { key: null, label: 'Acciones' }
              ].map(header => (
                <div 
                  key={header.label}
                  className={`flex items-center gap-2 ${header.key ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}`}
                  onClick={() => header.key && requestSort(header.key as any)}
                >
                  {header.label}
                  {header.key && <SortIcon active={sortConfig.key === header.key} direction={sortConfig.direction} />}
                </div>
              ))}
            >
              {salesLoading && data.users.length === 0 ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-6 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-28 bg-gray-200 rounded animate-pulse" />
                          <div className="h-2.5 w-36 bg-gray-100 rounded animate-pulse" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-3.5 w-24 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-3.5 w-20 bg-gray-200 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-14 bg-gray-200 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{formatId(user.id)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 leading-tight">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "admin" ? "active" : "inactive"}
                      className="uppercase text-[10px]"
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.docType} {user.docNumber}
                  </TableCell>
                  <TableCell className="text-sm">{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant={user.status}>
                      {user.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(user)}
                        title="Ver detalle"
                      >
                        <Eye size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(user)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenPermissions(user)}
                        title="Permisos"
                      >
                        <Key size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(user)}
                        title={
                          user.status === "active" ? "Desactivar" : "Activar"
                        }
                      >
                        {user.status === "active" ? (
                          <UserX size={14} className="text-red-500" />
                        ) : (
                          <UserCheck size={14} className="text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRequest(user)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>

          <div className="p-4 bg-gray-50/30 border-t border-gray-border flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Mostrando {Math.min(paginatedUsers.length + (currentPage - 1) * itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
              {filterRole !== 'all' && <span className="ml-1 text-blue-600 font-medium">· Filtro: {filterRole}</span>}
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} /> Anterior
                </Button>
                <div className="flex items-center px-3 text-xs font-bold text-blue-600 bg-white border border-gray-border rounded-lg">
                  {currentPage} / {totalPages}
                </div>
                <Button 
                  variant="outline" size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>

          {filteredUsers.length === 0 && !salesLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 bg-white">
              <UserX size={48} className="text-gray-200 mb-4" />
              <p className="text-lg font-medium">No se encontraron usuarios</p>
              <p className="text-sm">Prueba ajustando los términos de búsqueda.</p>
            </div>
          )}
        </Card>
      ) : (
        <RolePermissionsTab
          rolePermissions={data.config.rolePermissions}
          onSaveRolePermissions={async (role, permissions) => {
            setIsSaving(true);
            try {
              await updateRolePermissions(role, permissions);
              setSuccessMessage(`Permisos globales del rol ${role === "asesor" ? "Asesor" : "Freelancer"} actualizados`);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            } catch (err: any) {
              setErrorMessage(err?.response?.data?.message || "Error al guardar permisos globales");
              setShowError(true);
              setTimeout(() => setShowError(false), 3000);
            } finally {
              setIsSaving(false);
            }
          }}
          isSaving={isSaving}
        />
      )}

      {/* Modales */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        documentTypes={data.config.documentTypes}
        existingUsers={data.users}
        triggerError={triggerError}
        onSave={async (sanitizedData) => {
          setIsSaving(true);
          try {
            if (editingUser) {
              await updateUser(editingUser.id, sanitizedData);
              setSuccessMessage("Usuario actualizado exitosamente");
            } else {
              await addUser(sanitizedData as any);
              setSuccessMessage("Nuevo usuario registrado correctamente");
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 3000);
            }
            setShowSuccess(true);
            setIsModalOpen(false);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch (err: any) {
            setErrorMessage(err?.response?.data?.message || "Error al guardar el usuario");
            setShowError(true);
            setTimeout(() => setShowError(false), 3000);
            throw err;
          } finally {
            setIsSaving(false);
          }
        }}
      />

      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`Permisos: ${selectedUserForPermissions?.name}`}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsPermissionsModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveUserPermissions} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Actualizar Permisos"}
            </Button>
          </>
        }
      >
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex gap-3">
          <ShieldCheck className="text-blue-600 shrink-0" size={24} />
          <div>
            <p className="text-sm font-bold text-blue-700">
              Configuración Personalizada
            </p>
            <p className="text-xs text-blue-700">
              Estos permisos sobrescriben la configuración global para este
              usuario específico.
            </p>
          </div>
        </div>
        <PermissionsGrid
          permissions={editingUserPermissions}
          onChange={setEditingUserPermissions}
        />
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Usuario"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={isSaving}>
              {isSaving ? "Eliminando..." : "Confirmar Eliminación"}
            </Button>
          </>
        }
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">¿Estás seguro?</h3>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Esta action eliminará permanentemente al usuario{" "}
            <b>{userToDelete?.name}</b>. Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>

      <UserDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        user={selectedUserForDetail}
        userSales={data.sales.filter(s => Number((s as any).asesorId || (s as any).usuarioId || (s as any).usuario_id) === Number(selectedUserForDetail?.id))}
      />
    </div>
  );
}
