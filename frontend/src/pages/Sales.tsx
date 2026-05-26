import { useState, useMemo, useEffect } from "react";
import * as api from "../api";
import {
  Plus,
  ShoppingBag,
  Receipt,
  TrendingUp,
  Wallet,
  CheckCircle2,
  CreditCard,
  FileText,
} from "lucide-react";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionsContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { Sale } from "../types";
import NewSaleWizard from "../components/sales/NewSaleWizard";
import ProductDetailsModal from "../components/sales/ProductDetailsModal";
import SaleDetailModal from "../components/sales/SaleDetailModal";
import SaleEditModal from "../components/sales/SaleEditModal";
import SalesTable from "../components/sales/SalesTable";
import StatCard from "../components/ui/StatCard";
import CreditDashboard from "../components/sales/CreditDashboard";

export default function Sales() {
  const { data, addSale, updateSale, deleteSale, registerCreditPayment, deleteSalePayment, salesLoading, fetchSales } = useData();
  const { user, isAdmin } = useAuth();
  const { canCreate, canEdit } = usePermissions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [salesDetails, setSalesDetails] = useState<Record<number, Sale>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<'list' | 'credit'>('list');
  const [detailedProduct, setDetailedProduct] = useState<{
    type: string;
    data: any[];
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Sale | null>(null);

  const filteredSales = useMemo(() => {
    const list = isAdmin ? data.sales : data.sales.filter((s) => s.asesorId === user?.id);
    return [...list].sort((a, b) => b.id - a.id);
  }, [data.sales, isAdmin, user?.id]);

  // Lazy Load Fetch
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const totals = useMemo(() => {
    return filteredSales.reduce(
      (acc, s) => ({
        total: acc.total + s.total,
        pagado: acc.pagado + (s.status === "pagado" ? s.total : 0),
        pendiente: acc.pendiente + (s.status === "credito" ? s.total : 0),
      }),
      { total: 0, pagado: 0, pendiente: 0 },
    );
  }, [filteredSales]);

  // Eliminamos el prefetch silencioso para evitar peticiones "fantasma" que colapsan la red y el backend.
  // La carga detallada se hará estrictamente "On Demand" (bajo demanda) cuando el usuario pase el mouse o haga click.

  const handlePrefetchDetail = (sale: Sale) => {
    if (!salesDetails[sale.id]) {
      api.getSale(sale.id).then(fetched => {
        setSalesDetails(prev => ({ ...prev, [sale.id]: fetched }));
      }).catch(() => null);
    }
  };

  const canEditThis = (sale: Sale): boolean => {
    if (!canEdit("sales")) return false;
    // Solo permitir edición si NO está pagada
    if (sale.status === "pagado") return false;
    if (isAdmin) return true;
    return sale.asesorId === user?.id;
  };

  const handleOpenNewSale = () => {
    setIsWizardOpen(true);
  };

  const handleOpenModal = (sale?: Sale) => {
    if (sale && !canEditThis(sale)) return;
    setEditingSale(sale || null);
    setIsModalOpen(true);
  };

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailOpen(true);
    handlePrefetchDetail(sale);
  };

  const handleDownloadVoucher = (sale: Sale) => {
    setSuccessMessage(`Descargando voucher de la venta #${sale.id}...`);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDeleteSale = async (sale: Sale) => {
    try {
      await deleteSale(sale.id);
      setSuccessMessage(`Venta #${sale.id} eliminada correctamente`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      setSuccessMessage(`Error al eliminar la venta #${sale.id}`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-6 relative">
      {showSuccess && (
        <div className="fixed top-20 right-6 z-[100] bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-in-right">
          <div className="bg-green-500 text-white rounded-full p-1">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">Operación Exitosa</p>
            <p className="text-xs opacity-90">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header de Sección */}
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <ShoppingBag className="text-accent w-8 h-8" /> Gestión de Ventas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Control de ingresos, facturación y estados de pago de tus clientes.
        </p>
      </div>

      {/* TABS SELECTOR */}
      <div className="gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm inline-flex animate-fade-in">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'list' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <FileText size={18} /> Listado de Ventas
        </button>
        <button
          onClick={() => setActiveTab('credit')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'credit' 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
          }`}
        >
          <CreditCard size={18} /> Crédito y Cobros
        </button>
      </div>

      {activeTab === 'list' ? (
        <>


          <Card className="animate-fade-in">
            <CardHeader
              actions={
                canCreate("sales") ? (
                  <Button onClick={handleOpenNewSale}>
                    <Plus size={18} />
                    Nueva Venta
                  </Button>
                ) : undefined
              }
            >
              Lista de Ventas {isAdmin ? "(Todas)" : "(Mis Ventas)"}
            </CardHeader>

            {/* Skeleton de carga — solo se muestra en el primer fetch sin caché */}
            {salesLoading && filteredSales.length === 0 ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-1/3" style={{ animationDelay: `${i * 60}ms` }} />
                      <div className="h-2.5 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                    <div className="h-3 bg-gray-200 rounded w-14" />
                    <div className="h-6 bg-gray-100 rounded-full w-20" />
                    <div className="flex gap-1.5">
                      <div className="h-8 w-8 rounded-lg bg-gray-100" />
                      <div className="h-8 w-8 rounded-lg bg-gray-100" />
                      <div className="h-8 w-8 rounded-lg bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <SalesTable
                sales={filteredSales}
                clients={data.clients}
                users={data.users}
                onViewDetail={handleViewDetail}
                onPrefetchDetail={handlePrefetchDetail}
                onDownloadVoucher={handleDownloadVoucher}
                onEdit={handleOpenModal}
                onDelete={(sale) => setDeleteConfirm(sale)}
                canEditThis={canEditThis}
                isAdmin={isAdmin}
              />
            )}
          </Card>
        </>
      ) : (
        <CreditDashboard 
          clients={data.clients}
          sales={filteredSales} 
        />
      )}

      {/* ===== WIZARD MODAL (Nueva Venta) ===== */}
      <Modal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        title="Nueva Venta"
        size="xl"
      >
        <NewSaleWizard
          onClose={() => setIsWizardOpen(false)}
          onSuccess={(msg) => {
            setSuccessMessage(msg);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          }}
        />
      </Modal>

      {/* ===== EDIT MODAL (Editar Venta) ===== */}
      <SaleEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingSale={editingSale}
        clients={data.clients}
        user={user}
        isAdmin={isAdmin}
        onUpdateSale={updateSale}
        onAddSale={addSale}
        onRegisterPayment={(saleId, amount, method) => registerCreditPayment(saleId, amount, method)}
        onDeletePayment={(saleId, paymentId) => deleteSalePayment(saleId, paymentId)}
        onDownloadVoucher={handleDownloadVoucher}
      />

      {/* ===== DETAIL MODAL (Ver Detalle) ===== */}
      <SaleDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedSale={salesDetails[selectedSale?.id || 0] || selectedSale}
        clients={data.clients}
        onViewProductDetails={setDetailedProduct}
      />

      {/* Detalle Específico de Producto */}
      {detailedProduct && (
        <ProductDetailsModal
          product={detailedProduct}
          onClose={() => setDetailedProduct(null)}
        />
      )}

      {/* ===== CONFIRMAR ELIMINACIÓN ===== */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Eliminación"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => deleteConfirm && handleDeleteSale(deleteConfirm)}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-gray-600 text-sm">
          ¿Estás seguro de que deseas eliminar la venta <strong>#{deleteConfirm?.id}</strong>?
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
