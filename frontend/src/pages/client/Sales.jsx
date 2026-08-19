import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, Trash2 } from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function currency(n) {
    const value = Number(n) || 0;
    return `₹${value.toFixed(2)}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const Sales = () => {
    const { token, businessLocationId: authBusinessLocationId } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const businessLocationId = authBusinessLocationId || selectedLocationId;

    const [salesList, setSalesList] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [salesError, setSalesError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (!authBusinessLocationId) {
            loadLocations();
        }
    }, []);

    useEffect(() => {
        if (businessLocationId) {
            loadSales();
        } else {
            setSalesList([]);
            setSelectedSale(null);
        }
    }, [businessLocationId]);

    async function loadLocations() {
        setLoadingLocations(true);

        try {
            const res = await fetch(`${API_BASE_URL}/business-locations?per_page=1000`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load business locations");
            }

            const data = json.data;
            setLocations(
                Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
            );
        } catch (err) {
            console.error("Load business locations error:", err);
            setLocations([]);
        } finally {
            setLoadingLocations(false);
        }
    }

    async function loadSales() {
        setLoadingSales(true);
        setSalesError(null);

        try {
            const query = businessLocationId
                ? `?business_location_id=${businessLocationId}&per_page=1000`
                : "?per_page=1000";

            const res = await fetch(`${API_BASE_URL}/sales${query}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load sales");
            }

            const data = json.data;
            const list = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                    ? data
                    : [];

            setSalesList(list);

            if (selectedSale && !list.some((sale) => sale.id === selectedSale.id)) {
                setSelectedSale(null);
            }
        } catch (err) {
            console.error("Load sales error:", err);
            setSalesError(err.message);
            setSalesList([]);
        } finally {
            setLoadingSales(false);
        }
    }

    async function viewSale(id) {
        setSelectedSaleLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load sale details");
            }

            setSelectedSale(json.data);
        } catch (err) {
            console.error("View sale error:", err);
            setSalesError(err.message);
        } finally {
            setSelectedSaleLoading(false);
        }
    }

    async function cancelSale(id) {
        setCancellingId(id);

        try {
            const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json", ...authHeaders },
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || "Failed to cancel sale");
            }

            setSalesList((prev) => prev.filter((sale) => sale.id !== id));
            if (selectedSale?.id === id) {
                setSelectedSale(null);
            }
        } catch (err) {
            console.error("Cancel sale error:", err);
            setSalesError(err.message);
        } finally {
            setCancellingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-zinc-50 p-4 md:p-6">
            {!authBusinessLocationId && (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2 text-amber-800">
                        <MapPin size={16} className="shrink-0" />
                        <div>
                            <p className="text-xs font-bold">Select a business location</p>
                            <p className="text-[11px] text-amber-700/80">
                                Choose a location to view sales for that outlet.
                            </p>
                        </div>
                    </div>

                    <select
                        value={selectedLocationId || ""}
                        onChange={(e) => setSelectedLocationId(Number(e.target.value) || null)}
                        disabled={loadingLocations}
                        className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-[#40295C]"
                    >
                        <option value="" disabled>
                            {loadingLocations ? "Loading..." : "Select location"}
                        </option>
                        {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {!businessLocationId ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-500">
                    Select a business location to view sales.
                </div>
            ) : (
                <div className="max-w-6xl rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <div className="border-b border-zinc-100 px-4 py-3">
                        <h1 className="text-lg font-bold text-zinc-900">Sales</h1>
                    </div>

                    <div className="flex min-h-[70vh] flex-col md:flex-row">
                        <div className="w-full border-b border-zinc-100 md:w-1/2 md:border-r md:border-b-0">
                            {loadingSales ? (
                                <p className="p-4 text-xs font-medium text-zinc-400">Loading sales...</p>
                            ) : salesError ? (
                                <p className="p-4 text-xs font-medium text-rose-600">{salesError}</p>
                            ) : salesList.length === 0 ? (
                                <p className="p-4 text-xs font-medium text-zinc-400">No sales found.</p>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {salesList.map((sale) => (
                                        <button
                                            key={sale.id}
                                            onClick={() => viewSale(sale.id)}
                                            className={`flex w-full items-center justify-between p-3 text-left transition hover:bg-zinc-50 ${selectedSale?.id === sale.id ? "bg-zinc-50" : ""}`}
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-zinc-900">
                                                    {sale.invoice_no || `Sale #${sale.id}`}
                                                </p>
                                                <p className="text-[11px] text-zinc-500">
                                                    {sale.customer_name || "Walk-In Customer"} · {sale.sale_type}
                                                </p>
                                            </div>
                                            <ChevronRight size={14} className="text-zinc-300" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-full p-4 md:w-1/2">
                            {selectedSaleLoading ? (
                                <p className="text-xs font-medium text-zinc-400">Loading sale details...</p>
                            ) : !selectedSale ? (
                                <div className="flex h-full min-h-[280px] items-center justify-center text-center text-xs font-medium text-zinc-400">
                                    <div>
                                        <ChevronLeft className="mx-auto mb-2 text-zinc-300" size={20} />
                                        Select a sale to view details
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">
                                            {selectedSale.invoice_no || `Sale #${selectedSale.id}`}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500">
                                            {formatDate(selectedSale.sale_date)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs">
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Customer
                                            </p>
                                            <p className="font-semibold text-zinc-800">
                                                {selectedSale.customer_name || "Walk-In Customer"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Sale Type
                                            </p>
                                            <p className="font-semibold capitalize text-zinc-800">
                                                {selectedSale.sale_type}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Business Location
                                            </p>
                                            <p className="font-semibold text-zinc-800">
                                                {selectedSale.business_location?.name || "-"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                Payment
                                            </p>
                                            <p className="font-semibold capitalize text-zinc-800">
                                                {(selectedSale.payments || [])
                                                    .map((p) => p.payment_method)
                                                    .join(", ") || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-zinc-100">
                                        <div className="divide-y divide-zinc-100">
                                            {(selectedSale.items || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-2.5 text-xs"
                                                >
                                                    <span className="text-zinc-700">
                                                        {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                                                    </span>
                                                    <span className="font-semibold text-zinc-900">
                                                        {currency(item.unit_price_inc_tax * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Discount</span>
                                            <span>{currency(selectedSale.discount_amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-zinc-500">Tax</span>
                                            <span>{currency(selectedSale.order_tax_amount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-zinc-900">
                                            <span>Total</span>
                                            <span>{currency(selectedSale.total_amount)}</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => cancelSale(selectedSale.id)}
                                        disabled={cancellingId === selectedSale.id}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                    >
                                        <Trash2 size={13} />
                                        {cancellingId === selectedSale.id ? "Cancelling..." : "Cancel Sale"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;