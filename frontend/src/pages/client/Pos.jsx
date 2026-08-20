import React, { useEffect, useMemo, useState } from "react";
import {
    Search,
    Plus,
    Minus,
    X,
    Trash2,
    ArrowRight,
    Pause,
    Lock,
    Receipt,
    History,
    ChevronLeft,
    ChevronRight,
    UtensilsCrossed,
    Package,
    Bike,
    Truck,
    ShoppingBag,
    MapPin,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_IMAGE_URL = import.meta.env.VITE_API_IMAGE_URL || "";

const BRAND = "#40295C";
const BRAND_DARK = "#321f49";

const SALE_TYPES = [
    {
        key: "dining",
        label: "Dining",
        icon: UtensilsCrossed,
        active: "border-[#40295C] bg-[#40295C] text-white",
        idle: "border-[#40295C]/20 bg-[#40295C]/5 text-[#40295C]",
    },
    {
        key: "parcel",
        label: "Parcel",
        icon: Package,
        active: "border-amber-500 bg-amber-500 text-white",
        idle: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
        key: "zomato",
        label: "Zomato",
        icon: Bike,
        active: "border-rose-500 bg-rose-500 text-white",
        idle: "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
        key: "swiggy",
        label: "Swiggy",
        icon: Truck,
        active: "border-orange-500 bg-orange-500 text-white",
        idle: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
        key: "delivery",
        label: "Delivery",
        icon: ShoppingBag,
        active: "border-emerald-500 bg-emerald-500 text-white",
        idle: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
];

const SALE_TYPE_BADGE = {
    dining: "bg-[#40295C]/10 text-[#40295C]",
    parcel: "bg-amber-100 text-amber-700",
    zomato: "bg-rose-100 text-rose-700",
    swiggy: "bg-orange-100 text-orange-700",
    delivery: "bg-emerald-100 text-emerald-700",
};

const CATEGORY_COLORS = [
    "bg-[#40295C]/10 text-[#40295C] data-[active=true]:bg-[#40295C] data-[active=true]:text-white",
    "bg-sky-100 text-sky-700 data-[active=true]:bg-sky-500 data-[active=true]:text-white",
    "bg-amber-100 text-amber-700 data-[active=true]:bg-amber-500 data-[active=true]:text-white",
    "bg-rose-100 text-rose-700 data-[active=true]:bg-rose-500 data-[active=true]:text-white",
    "bg-emerald-100 text-emerald-700 data-[active=true]:bg-emerald-500 data-[active=true]:text-white",
    "bg-indigo-100 text-indigo-700 data-[active=true]:bg-indigo-500 data-[active=true]:text-white",
];

const PAYMENT_METHODS = [
    { key: "cash", label: "Cash", active: "border-emerald-500 bg-emerald-500 text-white" },
    { key: "card", label: "Card", active: "border-sky-500 bg-sky-500 text-white" },
    { key: "gpay", label: "GPay", active: "border-amber-500 bg-amber-500 text-white" },
    { key: "credit", label: "Credit", active: "border-[#40295C] bg-[#40295C] text-white" },
];

const emptyPayment = { payment_method: "cash", amount: "" };

function currency(n) {
    const value = Number(n) || 0;
    return `₹${value.toFixed(2)}`;
}

function getProductImageUrl(image) {
    if (!image) return "";
    if (/^https?:\/\//i.test(image)) return image;
    const normalizedImage = image.replace(/^\/uploads\/products\//, "/uploads/");
    if (API_IMAGE_URL) {
        return `${API_IMAGE_URL.replace(/\/$/, "")}/${normalizedImage.replace(/^\//, "")}`;
    }
    return normalizedImage;
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

const POS = () => {
    const { token, businessLocationId: authBusinessLocationId } = useAuth();

    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState(null);
    const businessLocationId = authBusinessLocationId || selectedLocationId;

    const [saleType, setSaleType] = useState("dining");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [productSearch, setProductSearch] = useState("");
    const [customerName, setCustomerName] = useState("Walk-In Customer");

    const [cart, setCart] = useState([]);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [taxPercent, setTaxPercent] = useState(5);
    const [applyRoundOff, setApplyRoundOff] = useState(true);

    const [payments, setPayments] = useState([{ ...emptyPayment }]);
    const [checkoutError, setCheckoutError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [lastSale, setLastSale] = useState(null);

    const [showHistory, setShowHistory] = useState(false);
    const [salesList, setSalesList] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [selectedSaleLoading, setSelectedSaleLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        loadCategories();

        if (!authBusinessLocationId) {
            loadLocations();
        }
    }, []);

    useEffect(() => {
        if (businessLocationId) loadProducts();
    }, [businessLocationId]);

    async function loadCategories() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/client/categories`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load categories");
            }
            const data = json.data;
            setCategories(
                Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
            );
        } catch (err) {
            console.error("Load categories error:", err);
        }
    }

    async function loadLocations() {
        setLoadingLocations(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/client/business-locations`, {
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

    async function loadProducts() {
        setLoadingProducts(true);
        setLoadError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/products?per_page=1000&business_location_id=${businessLocationId}`,
                { headers: { Accept: "application/json", ...authHeaders } }
            );
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load products");
            }

            const data = json.data;
            const allProducts = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                    ? data
                    : [];

            const scoped = allProducts.filter((p) =>
                (p.business_locations || []).some(
                    (loc) => String(loc.id) === String(businessLocationId)
                )
            );

            setProducts(scoped);
        } catch (err) {
            console.error("Load products error:", err);
            setLoadError(err.message);
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    }

    function addToCart(product) {
        setCart((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    unit_price_inc_tax: Number(
                        product.default_selling_price_inc_tax ?? 0
                    ),
                    quantity: 1,
                    discount_amount: 0,
                },
            ];
        });
    }

    function updateQuantity(productId, delta) {
        setCart((prev) =>
            prev
                .map((i) =>
                    i.product_id === productId
                        ? { ...i, quantity: i.quantity + delta }
                        : i
                )
                .filter((i) => i.quantity > 0)
        );
    }

    function removeFromCart(productId) {
        setCart((prev) => prev.filter((i) => i.product_id !== productId));
    }

    function clearOrder() {
        setCart([]);
        setDiscountAmount(0);
        setPayments([{ ...emptyPayment }]);
        setCheckoutError(null);
    }

    const itemsTotal = useMemo(
        () =>
            cart.reduce(
                (sum, i) => sum + i.unit_price_inc_tax * i.quantity - (i.discount_amount || 0),
                0
            ),
        [cart]
    );

    const taxAmount = useMemo(
        () => ((itemsTotal - discountAmount) * taxPercent) / 100,
        [itemsTotal, discountAmount, taxPercent]
    );

    const rawTotal = itemsTotal - discountAmount + taxAmount;

    const roundOffAmount = useMemo(() => {
        if (!applyRoundOff) return 0;
        return Math.round(rawTotal) - rawTotal;
    }, [rawTotal, applyRoundOff]);

    const totalPayable = rawTotal + roundOffAmount;

    const paymentsTotal = useMemo(
        () => payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
        [payments]
    );

    const filteredProducts = products.filter((p) => {
        const matchesCategory =
            !selectedCategoryId || p.category_id === selectedCategoryId;
        const matchesSearch = p.name
            ?.toLowerCase()
            .includes(productSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    function setSinglePayment(method) {
        setPayments([{ payment_method: method, amount: totalPayable.toFixed(2) }]);
    }

    function enableMultiplePay() {
        setPayments([
            { payment_method: "cash", amount: "" },
            { payment_method: "card", amount: "" },
        ]);
    }

    function updatePaymentRow(index, field, value) {
        setPayments((prev) =>
            prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
        );
    }

    function addPaymentRow() {
        setPayments((prev) => [...prev, { ...emptyPayment }]);
    }

    function removePaymentRow(index) {
        setPayments((prev) => prev.filter((_, i) => i !== index));
    }

    async function handleCheckout() {
        setCheckoutError(null);

        if (cart.length === 0) {
            setCheckoutError("Add at least one item to the order.");
            return;
        }

        if (Math.abs(paymentsTotal - totalPayable) > 0.01) {
            setCheckoutError(
                `Payment total (${currency(paymentsTotal)}) must match the payable amount (${currency(
                    totalPayable
                )}).`
            );
            return;
        }

        const payload = {
            business_location_id: businessLocationId,
            sale_type: saleType,
            customer_name: customerName.trim() || "Walk-In Customer",
            discount_amount: Number(discountAmount) || 0,
            order_tax_amount: Number(taxAmount.toFixed(2)),
            round_off_amount: Number(roundOffAmount.toFixed(2)),
            items: cart.map((i) => ({
                product_id: i.product_id,
                quantity: i.quantity,
                unit_price_inc_tax: i.unit_price_inc_tax,
                discount_amount: i.discount_amount || 0,
            })),
            payments: payments.map((p) => ({
                payment_method: p.payment_method,
                amount: Number(p.amount) || 0,
            })),
        };

        setSaving(true);

        try {
            const res = await fetch(`${API_BASE_URL}/api/sales`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...authHeaders,
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to create sale");
            }

            setLastSale(json.data);
            clearOrder();
        } catch (err) {
            console.error("Create sale error:", err);
            setCheckoutError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function openHistory() {
        setShowHistory(true);
        setHistoryLoading(true);
        setHistoryError(null);
        setSelectedSale(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/sales`, {
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

            setSalesList(list.slice(0, 5));
        } catch (err) {
            console.error("Load sales error:", err);
            setHistoryError(err.message);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function viewSale(id) {
        setSelectedSaleLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load sale");
            }

            setSelectedSale(json.data);
        } catch (err) {
            console.error("View sale error:", err);
            setHistoryError(err.message);
        } finally {
            setSelectedSaleLoading(false);
        }
    }

    async function cancelSale(id) {
        setCancellingId(id);
        try {
            const res = await fetch(`${API_BASE_URL}/api/sales/${id}`, {
                method: "DELETE",
                headers: { Accept: "application/json", ...authHeaders },
            });

            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.message || "Failed to cancel sale");
            }

            setSalesList((prev) => prev.filter((s) => s.id !== id));
            if (selectedSale?.id === id) setSelectedSale(null);
        } catch (err) {
            console.error("Cancel sale error:", err);
            setHistoryError(err.message);
        } finally {
            setCancellingId(null);
        }
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased">
            <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_400px] lg:p-6">

                <div className="flex flex-col gap-4">

                    {!authBusinessLocationId && (
                        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <MapPin size={16} className="shrink-0 text-amber-600" />
                            <div className="flex-1">
                                <p className="text-xs font-bold text-amber-800">
                                    Select a business location
                                </p>
                                <p className="text-[11px] text-amber-700/80">
                                    Your account isn't tied to a single location — choose one to
                                    start billing.
                                </p>
                            </div>
                            <select
                                value={selectedLocationId || ""}
                                onChange={(e) =>
                                    setSelectedLocationId(e.target.value || null)
                                }
                                disabled={loadingLocations}
                                className="rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 outline-none focus:border-[#40295C]"
                            >
                                <option value="" disabled>
                                    {loadingLocations ? "Loading..." : "Select location"}
                                </option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-[#40295C]/10 via-[#40295C]/5 to-transparent p-3 sm:flex-row sm:items-center">
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Walk-In Customer"
                            className="w-full max-w-xs rounded-xl border border-[#40295C]/15 bg-white px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[#40295C] sm:w-56"
                        />

                        <div className="relative flex-1">
                            <Search
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#40295C]/50"
                            />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Scan barcode or search product"
                                className="w-full rounded-xl border border-[#40295C]/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#40295C]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {SALE_TYPES.map(({ key, label, icon: Icon, active: activeCls, idle }) => {
                            const active = saleType === key;
                            return (
                                <button
                                    key={key}
                                    onClick={() => setSaleType(key)}
                                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors ${active ? activeCls : idle
                                        }`}
                                >
                                    <Icon size={14} />
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setSelectedCategoryId(null)}
                            data-active={!selectedCategoryId}
                            className="shrink-0 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 data-[active=true]:bg-[#40295C] data-[active=true]:text-white"
                        >
                            All Categories
                        </button>
                        {categories.map((cat, idx) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                data-active={selectedCategoryId === cat.id}
                                className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[300px] flex-1">
                        {!businessLocationId ? (
                            <p className="p-6 text-sm font-medium text-zinc-400">
                                Select a business location above to load products.
                            </p>
                        ) : loadingProducts ? (
                            <p className="p-6 text-sm font-medium text-zinc-400">
                                Loading products...
                            </p>
                        ) : loadError ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                                {loadError}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <p className="p-6 text-sm font-medium text-zinc-400">
                                No products found.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                                {filteredProducts.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
                                    >
                                        <div className="aspect-square w-full overflow-hidden bg-zinc-100">
                                            {product.image ? (
                                                <img
                                                    src={getProductImageUrl(product.image)}
                                                    alt={product.name}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                        e.currentTarget.nextSibling?.style &&
                                                            (e.currentTarget.nextSibling.style.display = "flex");
                                                    }}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            ) : null}
                                            <div
                                                className={`flex h-full w-full items-center justify-center text-zinc-300 ${product.image ? "hidden" : "flex"}`}
                                            >
                                                <ShoppingBag size={28} />
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="truncate text-sm font-semibold text-zinc-900">
                                                {product.name}
                                            </p>
                                            <span className="mt-1.5 inline-block rounded-full bg-[#40295C]/10 px-2 py-0.5 text-[11px] font-bold text-[#40295C]">
                                                {currency(product.default_selling_price_inc_tax)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-1 flex-col rounded-2xl border border-zinc-200/70 bg-white p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-zinc-900">Current Order</h2>
                            <span
                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${SALE_TYPE_BADGE[saleType] || "bg-[#40295C]/10 text-[#40295C]"
                                    }`}
                            >
                                {saleType}
                            </span>
                        </div>

                        <div className="mt-3 flex-1 divide-y divide-zinc-100 overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="py-8 text-center text-xs font-medium text-zinc-400">
                                    No items added yet.
                                </p>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.product_id}
                                        className="flex items-center justify-between gap-2 py-2.5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-semibold text-zinc-900">
                                                {item.name}
                                            </p>
                                            <p className="text-[11px] text-zinc-400">
                                                {currency(item.unit_price_inc_tax)} each
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#40295C]/30 text-[#40295C] hover:bg-[#40295C]/10"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-5 text-center text-xs font-bold">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                className="flex h-6 w-6 items-center justify-center rounded-full border border-[#40295C]/30 text-[#40295C] hover:bg-[#40295C]/10"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <p className="w-16 text-right text-xs font-bold text-zinc-900">
                                            {currency(item.unit_price_inc_tax * item.quantity)}
                                        </p>

                                        <button
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="text-zinc-300 hover:text-rose-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">
                                    Items Total ({cart.reduce((n, i) => n + i.quantity, 0)})
                                </span>
                                <span className="font-semibold text-zinc-900">
                                    {currency(itemsTotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Discount</span>
                                <input
                                    type="number"
                                    min={0}
                                    value={discountAmount}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                    className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-right text-xs font-semibold outline-none focus:border-[#40295C]"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">
                                    Tax (GST{" "}
                                    <input
                                        type="number"
                                        min={0}
                                        value={taxPercent}
                                        onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                                        className="w-10 rounded border border-zinc-200 px-1 py-0.5 text-center text-[11px]"
                                    />
                                    %)
                                </span>
                                <span className="font-semibold text-zinc-900">
                                    {currency(taxAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500">Round Off</span>
                                <span className="font-semibold text-zinc-900">
                                    {currency(roundOffAmount)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#40295C] to-[#5b3a7d] px-3 py-2.5 text-sm">
                                <span className="font-bold text-white/90">Total Payable</span>
                                <span className="font-extrabold text-white">
                                    {currency(totalPayable)}
                                </span>
                            </div>
                        </div>

                        {checkoutError && (
                            <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-600">
                                {checkoutError}
                            </div>
                        )}

                        {lastSale && (
                            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-700">
                                {lastSale.invoice_no || `Sale #${lastSale.id}`} created successfully.
                            </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map((m) => (
                                <button
                                    key={m.key}
                                    onClick={() => setSinglePayment(m.key)}
                                    className={`rounded-lg border py-2 text-[11px] font-semibold transition-colors ${payments.length === 1 && payments[0].payment_method === m.key
                                        ? m.active
                                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                        }`}
                                >
                                    {m.label}
                                </button>
                            ))}
                            <button
                                onClick={enableMultiplePay}
                                className={`col-span-2 rounded-lg border py-2 text-[11px] font-semibold transition-colors ${payments.length > 1
                                    ? "border-transparent bg-gradient-to-r from-[#40295C] to-[#5b3a7d] text-white"
                                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                    }`}
                            >
                                Multiple Pay
                            </button>
                        </div>

                        {payments.length > 1 && (
                            <div className="mt-2 space-y-2">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <select
                                            value={p.payment_method}
                                            onChange={(e) =>
                                                updatePaymentRow(idx, "payment_method", e.target.value)
                                            }
                                            className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px]"
                                        >
                                            {PAYMENT_METHODS.map((m) => (
                                                <option key={m.key} value={m.key}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={0}
                                            value={p.amount}
                                            onChange={(e) => updatePaymentRow(idx, "amount", e.target.value)}
                                            placeholder="Amount"
                                            className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px]"
                                        />
                                        <button
                                            onClick={() => removePaymentRow(idx)}
                                            className="text-zinc-300 hover:text-rose-500"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addPaymentRow}
                                    className="text-[11px] font-semibold text-[#40295C]"
                                >
                                    + Add payment
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={saving}
                            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#40295C] to-[#5b3a7d] py-3 text-sm font-bold text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Processing..." : "Proceed to Pay"}
                            {!saving && <ArrowRight size={16} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* <button className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-100">
                            <Pause size={15} />
                            Suspend
                        </button>
                        <button className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100">
                            <Lock size={15} />
                            Hold
                        </button>
                        <button className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 py-2.5 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100">
                            <Receipt size={15} />
                            KOT
                        </button> */}
                        <button
                            onClick={openHistory}
                            className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-[#40295C]/20 bg-[#40295C]/5 py-2.5 text-[11px] font-semibold text-[#40295C] hover:bg-[#40295C]/10"
                        >
                            <History size={15} />
                            Recent Transaction
                        </button>
                    </div>
                </div>
            </div>

            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-zinc-100 p-4">
                            <h2 className="text-sm font-bold text-zinc-900">
                                Recent Transactions
                            </h2>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-zinc-400 hover:text-zinc-700"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-1/2 overflow-y-auto border-r border-zinc-100">
                                {historyLoading ? (
                                    <p className="p-4 text-xs font-medium text-zinc-400">
                                        Loading sales...
                                    </p>
                                ) : historyError ? (
                                    <p className="p-4 text-xs font-medium text-rose-600">
                                        {historyError}
                                    </p>
                                ) : salesList.length === 0 ? (
                                    <p className="p-4 text-xs font-medium text-zinc-400">
                                        No sales found.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-zinc-100">
                                        {salesList.map((sale, index) => (
                                            <button
                                                key={sale.id}
                                                onClick={() => viewSale(sale.id)}
                                                className={`flex w-full items-center justify-between p-3 text-left hover:bg-zinc-50 ${selectedSale?.id === sale.id ? "bg-zinc-50" : ""
                                                    }`}
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-zinc-900">
                                                        {`Sale #${index + 1}`}
                                                    </p>
                                                    <p className="text-[11px] text-zinc-400">
                                                        {sale.customer_name || "Walk-In Customer"} · {sale.sale_type} · {sale.business_location_name || "-"}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-zinc-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-1/2 overflow-y-auto p-4">
                                {selectedSaleLoading ? (
                                    <p className="text-xs font-medium text-zinc-400">Loading...</p>
                                ) : !selectedSale ? (
                                    <div className="flex h-full items-center justify-center text-center text-xs font-medium text-zinc-400">
                                        <div>
                                            <ChevronLeft className="mx-auto mb-2 text-zinc-300" size={20} />
                                            Select a sale to view details
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">
                                                Sale Details
                                            </p>
                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                {formatDate(selectedSale.created_at)}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 text-xs">
                                            <div className="col-span-2">
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                    Sale ID
                                                </p>
                                                <p className="break-all font-semibold text-zinc-800">
                                                    {selectedSale.id}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                    Customer
                                                </p>
                                                <p className="font-semibold text-zinc-800">
                                                    {selectedSale.customer_name}
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
                                                    {selectedSale.business_location_name || "-"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                                    Payment Method
                                                </p>
                                                <p className="font-semibold capitalize text-zinc-800">
                                                    {(selectedSale.payments || [])
                                                        .map((p) => p.payment_method)
                                                        .join(", ") || "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                                            {(selectedSale.items || []).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between p-2.5 text-xs"
                                                >
                                                    <span className="text-zinc-700">
                                                        {item.product_name || `Product #${item.product_id}`} ×{" "}
                                                        {item.quantity}
                                                    </span>
                                                    <span className="font-semibold text-zinc-900">
                                                        {currency(item.unit_price_inc_tax * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="text-xs">
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

                                        {/* <button
                                            onClick={() => cancelSale(selectedSale.id)}
                                            disabled={cancellingId === selectedSale.id}
                                            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                        >
                                            <Trash2 size={13} />
                                            {cancellingId === selectedSale.id
                                                ? "Cancelling..."
                                                : "Cancel Sale"}
                                        </button> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;