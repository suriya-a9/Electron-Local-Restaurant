import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    MapPin, Calendar, FastForward, Columns, UserPlus, Printer,
    Calculator, RotateCcw, MoreVertical, Plus, Minus, User, UserCheck, Scan, Utensils, Package, Bike, ShoppingBag, Pause, Lock,
    FileText, Clock, Trash2, Edit2, ArrowRight, ChevronRight, ChevronLeft,
    X,
} from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_IMAGE_URL = import.meta.env.VITE_API_IMAGE_URL || "";

const SALE_TYPES = [
    { key: "dining", label: "Dining", icon: Utensils, color: null },
    { key: "parcel", label: "Parcel", icon: Package, color: null },
    { key: "zomato", label: "Zomato", icon: ShoppingBag, color: "text-red-500" },
    { key: "swiggy", label: "Swiggy", icon: ShoppingBag, color: "text-orange-500" },
    { key: "delivery", label: "Delivery", icon: Bike, color: "text-emerald-600" },
];

const SALE_TYPE_BADGE = {
    dining: "bg-indigo-50 text-indigo-600",
    parcel: "bg-amber-50 text-amber-700",
    zomato: "bg-red-50 text-red-600",
    swiggy: "bg-orange-50 text-orange-700",
    delivery: "bg-emerald-50 text-emerald-700",
};

const TABLE_STATUS_STYLES = {
    available: { bg: "bg-emerald-50/40 border-emerald-200", amount: "text-emerald-600" },
    reserved: { bg: "bg-amber-50/40 border-amber-200", amount: "text-amber-600" },
    occupied: { bg: "bg-sky-50/40 border-sky-200", amount: "text-sky-600" },
    kot_sent: {
        bg: "bg-purple-50/40 border-purple-200",
        amount: "text-indigo-600",
        badge: { label: "KOT Sent", style: "bg-indigo-100 text-indigo-600" },
    },
    bill_requested: {
        bg: "bg-rose-50/40 border-rose-200",
        amount: "text-rose-600",
        badge: { label: "Bill Requested", style: "bg-red-100 text-red-500" },
    },
};

const PAYMENT_BUTTONS = [
    { key: "credit", label: "Credit Sale", method: "credit", cls: "bg-indigo-600 hover:bg-indigo-700 text-white" },
    { key: "card", label: "Card", method: "card", cls: "bg-sky-500 hover:bg-sky-600 text-white" },
    { key: "multiple", label: "Multiple Pay", method: null, cls: "bg-slate-900 hover:bg-slate-800 text-white" },
    { key: "cash", label: "Cash", method: "cash", cls: "bg-emerald-500 hover:bg-emerald-600 text-white" },
    { key: "upi", label: "UPI / GPAY", method: "gpay", cls: "bg-pink-600 hover:bg-pink-700 text-white" },
];

const PAYMENT_METHOD_OPTIONS = [
    { key: "cash", label: "Cash" },
    { key: "card", label: "Card" },
    { key: "gpay", label: "GPay" },
    { key: "credit", label: "Credit" },
];

const emptyPayment = { payment_method: "cash", amount: "" };
const PRODUCT_DISPLAY_LIMIT = 12;

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

function formatHeaderDate(d) {
    return (
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }) +
        " " +
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    );
}

const POS = () => {
    const navigate = useNavigate();
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
    const [tables, setTables] = useState([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [selectedTableId, setSelectedTableId] = useState(null);

    const [saleType, setSaleType] = useState("dining");
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [productSearch, setProductSearch] = useState("");
    const [productPage, setProductPage] = useState(1);
    const [customerName, setCustomerName] = useState("Walk-In Customer");
    const [guestCount, setGuestCount] = useState(2);

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

    const [now, setNow] = useState(new Date());

    useEffect(() => {
        loadCategories();

        loadLocations();
    }, []);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        setProductPage(1);
        if (businessLocationId) loadProducts();
    }, [businessLocationId]);

    useEffect(() => {
        if (businessLocationId) {
            loadTables();
        } else {
            setTables([]);
        }
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

    async function loadTables() {
        setLoadingTables(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/tables?business_location_id=${encodeURIComponent(businessLocationId)}`,
                { headers: { Accept: "application/json", ...authHeaders } }
            );
            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || "Failed to load tables");
            }

            setTables(Array.isArray(json.data) ? json.data : []);
        } catch (err) {
            console.error("Load tables error:", err);
            setTables([]);
        } finally {
            setLoadingTables(false);
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
        setSelectedTableId(null);
    }

    function selectTable(table) {
        setSelectedTableId(table.id);
        setSaleType("dining");
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

    const totalProductPages = Math.ceil(filteredProducts.length / PRODUCT_DISPLAY_LIMIT);
    const visibleProducts = filteredProducts.slice(
        (productPage - 1) * PRODUCT_DISPLAY_LIMIT,
        productPage * PRODUCT_DISPLAY_LIMIT
    );

    useEffect(() => {
        setProductPage((page) => Math.min(page, Math.max(totalProductPages, 1)));
    }, [totalProductPages]);

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
            const query = businessLocationId
                ? `?business_location_id=${encodeURIComponent(businessLocationId)}`
                : "";
            const res = await fetch(`${API_BASE_URL}/api/sales${query}`, {
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

    const currentLocationName =
        locations.find((l) => String(l.id) === String(businessLocationId))?.name ||
        (authBusinessLocationId ? "Current Location" : "Select Location");

    const selectedTable = tables.find((t) => t.id === selectedTableId);
    const orderBadgeLabel =
        saleType === "dining"
            ? `DINE-IN${selectedTable ? ` - ${selectedTable.name.replace(/^Table\s*/i, "")}` : ""}`
            : (SALE_TYPES.find((s) => s.key === saleType)?.label || saleType).toUpperCase();

    return (
        <div className="flex flex-col h-screen bg-[#f1f3f7] text-slate-700 text-[11px] font-sans select-none p-2 gap-2 overflow-hidden">

            <header className="bg-white rounded-lg px-3 py-1.5 flex items-center justify-between border border-slate-200 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                        <span className="text-slate-400">Location</span>
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 ml-1" />
                        {authBusinessLocationId ? (
                            <span className="font-semibold text-slate-800">{currentLocationName}</span>
                        ) : (
                            <select
                                value={selectedLocationId || ""}
                                onChange={(e) => setSelectedLocationId(e.target.value || null)}
                                disabled={loadingLocations}
                                className="bg-transparent font-semibold text-slate-800 outline-none"
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
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-indigo-600 font-medium bg-indigo-50/50 px-2.5 py-1 rounded-md border border-indigo-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-semibold">{formatHeaderDate(now)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><FastForward className="w-4 h-4" /></button>
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Columns className="w-4 h-4" /></button>
                    <button className="p-1.5 text-indigo-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><UserPlus className="w-4 h-4" /></button>
                    <button className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Printer className="w-4 h-4" /></button>
                    <button className="p-1.5 text-emerald-600 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><Calculator className="w-4 h-4" /></button>
                    <button
                        onClick={() => {
                            loadProducts();
                            loadTables();
                        }}
                        className="p-1.5 text-rose-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md border border-slate-200 bg-white"><MoreVertical className="w-4 h-4" /></button>
                    <button className="ml-2 bg-white border border-indigo-600 text-indigo-600 px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 hover:bg-indigo-50">
                        <Plus className="w-3.5 h-3.5" /> Add Expense
                    </button>
                </div>
            </header>

            <div className="flex flex-1 gap-2 overflow-hidden">

                <div className="flex-[2.6] flex flex-col gap-2 overflow-hidden">

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 flex-1">
                            <div className="flex items-center gap-2 px-2 text-slate-600 border-r border-slate-200 flex-1">
                                <User className="w-4 h-4 text-slate-400" />
                                <input
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Walk-In Customer"
                                    className="font-semibold text-slate-800 bg-transparent outline-none w-full"
                                />
                            </div>
                            <button className="p-1 bg-indigo-600 text-white rounded-md ml-1"><Plus className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 px-3 gap-2">
                            <UserCheck className="w-4 h-4 text-slate-400" />
                            <input
                                type="number"
                                min={1}
                                value={guestCount}
                                onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                                className="font-bold text-slate-800 text-xs bg-transparent outline-none w-5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                        </div>

                        <div className="flex items-center bg-white rounded-lg border border-slate-200 px-3 py-1.5 flex-[1.8] justify-between">
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setProductPage(1);
                                }}
                                placeholder="Scan barcode or search product"
                                className="bg-transparent outline-none w-full text-slate-700 placeholder-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <Scan className="w-4 h-4 text-indigo-600 cursor-pointer" />
                                <button className="p-1 bg-indigo-600 text-white rounded-md"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {SALE_TYPES.map((type, idx) => {
                            const Icon = type.icon;
                            const isSelected = saleType === type.key;
                            return (
                                <button
                                    key={type.key}
                                    onClick={() => setSaleType(type.key)}
                                    className={`flex-1 py-2 px-2 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${isSelected
                                        ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm"
                                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon className={`w-3.5 h-3.5 ${type.color || (isSelected ? "text-indigo-600" : "text-slate-500")}`} />
                                    <span>{idx + 1} {type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => {
                                setSelectedCategoryId(null);
                                setProductPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-md font-semibold text-[10px] transition-all whitespace-nowrap ${!selectedCategoryId
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            Categories
                        </button>
                        {categories.map((cat) => {
                            const isSelected = selectedCategoryId === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategoryId(cat.id);
                                        setProductPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-md font-semibold text-[10px] transition-all whitespace-nowrap ${isSelected
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })}
                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 cursor-pointer" />
                    </div>

                    {!businessLocationId ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            Select a business location above to load products.
                        </div>
                    ) : loadingProducts ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            Loading products...
                        </div>
                    ) : loadError ? (
                        <div className="flex-1 bg-white rounded-lg border border-rose-200 p-4 flex items-center justify-center text-rose-600 font-medium">
                            {loadError}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-center text-slate-400 font-medium">
                            No products found.
                        </div>
                    ) : (
                        <div className="flex-1 bg-white rounded-lg border border-slate-200 p-2.5 overflow-y-auto grid grid-cols-4 gap-2.5 content-start">
                            {visibleProducts.map((product) => (
                                <div
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="border border-slate-200/60 rounded-xl p-2 bg-white hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                                >
                                    <div className="w-full h-20 rounded-lg mb-2 overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {product.image ? (
                                            <img
                                                src={getProductImageUrl(product.image)}
                                                alt={product.name}
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                    e.currentTarget.nextSibling?.style &&
                                                        (e.currentTarget.nextSibling.style.display = "flex");
                                                }}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : null}
                                        <div className={`items-center justify-center text-slate-300 ${product.image ? "hidden" : "flex"}`}>
                                            <ShoppingBag className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-[11px] truncate">{product.name}</div>
                                        <div className="text-slate-600 font-semibold text-[10px] mt-0.5">
                                            {currency(product.default_selling_price_inc_tax)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center items-center gap-1.5 py-0.5">
                        {totalProductPages > 1 && Array.from({ length: totalProductPages }, (_, index) => (
                            <button
                                key={index}
                                type="button"
                                aria-label={`Show product page ${index + 1}`}
                                onClick={() => setProductPage(index + 1)}
                                className={`rounded-full transition-all ${productPage === index + 1
                                    ? "h-2 w-2 bg-indigo-600"
                                    : "h-1.5 w-1.5 bg-slate-300 hover:bg-slate-400"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <span className="font-bold text-indigo-950 uppercase tracking-wider text-[10px]">RUNNING TABLES</span>
                            <p className="mt-0.5 text-[9px] font-semibold text-slate-400">{currentLocationName}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/admin-table")}
                            className="text-indigo-600 hover:underline font-semibold text-[10px]"
                        >
                            View All
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-0.5 my-1">
                        {loadingTables ? (
                            <p className="text-slate-400 font-medium py-3">Loading tables...</p>
                        ) : tables.length === 0 ? (
                            <p className="text-slate-400 font-medium py-3">No tables at this location.</p>
                        ) : (
                            tables.map((table) => {
                                const style = TABLE_STATUS_STYLES[table.status] || TABLE_STATUS_STYLES.available;
                                return (
                                    <div
                                        key={table.id}
                                        onClick={() => selectTable(table)}
                                        className={`p-2.5 rounded-lg border flex flex-col gap-1.5 relative cursor-pointer transition-all hover:-translate-y-0.5 ${style.bg} ${selectedTableId === table.id ? "ring-2 ring-indigo-600" : ""
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-md bg-white border border-slate-200/50">
                                                    <Utensils className="w-3.5 h-3.5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900 text-[11px]">{table.name}</div>
                                                    <div className="text-[9px] text-slate-400">{table.capacity || "-"} Seater</div>
                                                </div>
                                            </div>
                                            {style.badge && (
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${style.badge.style}`}>
                                                    {style.badge.label}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] mt-1 pt-1 border-t border-slate-100/50">
                                            <span className={`font-bold ${style.amount}`}>{currency(table.running_amount ?? 0)}</span>
                                            <div className="flex items-center gap-1 text-slate-500 text-[9px]">
                                                <Clock className="w-3 h-3" />
                                                <span>{table.running_time || "00:00:00"}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>

                <div className="flex-[1.2] bg-white rounded-lg border border-slate-200 p-2.5 flex flex-col justify-between overflow-hidden">
                    <div className="flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="font-bold text-slate-800 text-xs">Current Order</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${SALE_TYPE_BADGE[saleType] || "bg-indigo-50 text-indigo-600"}`}>
                                    {orderBadgeLabel}
                                </span>
                                <button onClick={clearOrder} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        {cart.length > 0 && (
                            <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 py-1.5 border-b border-slate-100">
                                <div className="col-span-5">Item</div>
                                <div className="col-span-3 text-center">Qty</div>
                                <div className="col-span-2 text-right">Price</div>
                                <div className="col-span-2 text-right">Total</div>
                            </div>
                        )}

                        <div className="space-y-2 py-2 max-h-48 overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="text-center text-slate-400 font-medium py-6">No items added yet.</p>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.product_id} className="grid grid-cols-12 text-[10px] items-center text-slate-700">
                                        <div className="col-span-5 font-bold text-slate-800 truncate">{item.name}</div>
                                        <div className="col-span-3 flex items-center justify-center gap-1 bg-slate-50 rounded border border-slate-200 py-0.5">
                                            <button
                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                className="text-slate-400 hover:text-slate-600 px-1 font-bold"
                                            >
                                                <Minus className="w-2.5 h-2.5" />
                                            </button>
                                            <span className="font-bold text-slate-800">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                className="text-slate-400 hover:text-slate-600 px-1 font-bold"
                                            >
                                                <Plus className="w-2.5 h-2.5" />
                                            </button>
                                        </div>
                                        <div className="col-span-2 text-right text-slate-500 font-medium">
                                            ₹{item.unit_price_inc_tax.toFixed(0)}
                                        </div>
                                        <div className="col-span-2 text-right font-bold text-slate-800 flex items-center justify-end gap-1">
                                            <span>₹{(item.unit_price_inc_tax * item.quantity).toFixed(0)}</span>
                                            <button
                                                onClick={() => removeFromCart(item.product_id)}
                                                className="text-rose-400 hover:text-rose-600 text-[10px]"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1 text-[10px]">
                        <div className="flex justify-between text-slate-500">
                            <span>Items Total ({cart.reduce((n, i) => n + i.quantity, 0)})</span>
                            <span className="font-semibold text-slate-700">{currency(itemsTotal)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 items-center">
                            <span className="flex items-center gap-1">
                                Discount <Edit2 className="w-2.5 h-2.5 text-indigo-600" />
                            </span>
                            <input
                                type="number"
                                min={0}
                                value={discountAmount}
                                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                className="w-14 text-right font-semibold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-indigo-300"
                            />
                        </div>
                        <div className="flex justify-between text-slate-500 items-center">
                            <span className="flex items-center gap-1">
                                Tax (GST
                                <input
                                    type="number"
                                    min={0}
                                    value={taxPercent}
                                    onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                                    className="w-6 text-center bg-transparent outline-none border-b border-transparent focus:border-indigo-300"
                                />
                                %)
                            </span>
                            <span className="font-semibold text-slate-700">{currency(taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                            <span>Round Off</span>
                            <span className="font-semibold text-slate-700">{currency(roundOffAmount)}</span>
                        </div>

                        <div className="bg-indigo-50/60 p-2 rounded-lg flex justify-between items-center border border-indigo-100/50 my-1.5">
                            <span className="font-bold text-indigo-900 text-xs">Total Payable</span>
                            <span className="font-extrabold text-indigo-700 text-sm">{currency(totalPayable)}</span>
                        </div>

                        {checkoutError && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-rose-600 font-medium">
                                {checkoutError}
                            </div>
                        )}

                        {lastSale && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-emerald-700 font-medium">
                                {lastSale.invoice_no || `Sale #${lastSale.id}`} created successfully.
                            </div>
                        )}

                        {payments.length > 1 && (
                            <div className="space-y-1.5 border-t border-slate-100 pt-1.5">
                                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Split Payment</p>
                                {payments.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                        <select
                                            value={p.payment_method}
                                            onChange={(e) => updatePaymentRow(idx, "payment_method", e.target.value)}
                                            className="rounded border border-slate-200 px-1.5 py-1 text-[10px]"
                                        >
                                            {PAYMENT_METHOD_OPTIONS.map((m) => (
                                                <option key={m.key} value={m.key}>{m.label}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            min={0}
                                            value={p.amount}
                                            onChange={(e) => updatePaymentRow(idx, "amount", e.target.value)}
                                            placeholder="Amount"
                                            className="flex-1 rounded border border-slate-200 px-1.5 py-1 text-[10px]"
                                        />
                                        <button onClick={() => removePaymentRow(idx)} className="text-slate-300 hover:text-rose-500">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addPaymentRow} className="text-[10px] font-semibold text-indigo-600">
                                    + Add payment
                                </button>
                            </div>
                        )}

                        <button
                            onClick={handleCheckout}
                            disabled={saving}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors text-xs disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span>{saving ? "Processing..." : "Proceed to Pay"}</span>
                            {!saving && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

            </div>

            <footer className="flex items-center justify-between gap-2 pt-0.5">

                <div className="flex items-center gap-1.5">
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-rose-500 w-14 h-11">
                        <Pause className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Suspend</span>
                    </button>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-sky-500 w-14 h-11">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">Hold</span>
                    </button>
                    <button className="bg-white border border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg flex flex-col items-center justify-center text-emerald-600 w-14 h-11">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-semibold mt-0.5">KOT</span>
                    </button>
                </div>

                <div className="flex items-center gap-1.5 flex-1 justify-center max-w-xl">
                    {PAYMENT_BUTTONS.map((btn) => {
                        const isActive =
                            btn.method && payments.length === 1 && payments[0].payment_method === btn.method;
                        return (
                            <button
                                key={btn.key}
                                onClick={() => (btn.method ? setSinglePayment(btn.method) : enableMultiplePay())}
                                className={`flex-1 py-2.5 font-bold rounded-lg text-center shadow-sm text-[11px] transition-colors ${btn.cls} ${isActive || (!btn.method && payments.length > 1) ? "ring-2 ring-offset-1 ring-indigo-300" : ""
                                    }`}
                            >
                                {btn.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-0.5 flex flex-col items-end">
                        <span className="text-[8px] text-emerald-700 font-bold uppercase tracking-tight">Total Payable</span>
                        <span className="text-xs font-black text-emerald-600">{currency(totalPayable)}</span>
                    </div>
                    <button
                        onClick={openHistory}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm text-[11px]"
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Recent Transactions</span>
                    </button>
                </div>

            </footer>

            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl text-[11px]">
                        <div className="flex items-center justify-between border-b border-slate-100 p-4">
                            <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700">
                                <X className="w-4.5 h-4.5" />
                            </button>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            <div className="w-1/2 overflow-y-auto border-r border-slate-100">
                                {historyLoading ? (
                                    <p className="p-4 font-medium text-slate-400">Loading sales...</p>
                                ) : historyError ? (
                                    <p className="p-4 font-medium text-rose-600">{historyError}</p>
                                ) : salesList.length === 0 ? (
                                    <p className="p-4 font-medium text-slate-400">No sales found.</p>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {salesList.map((sale) => (
                                            <button
                                                key={sale.id}
                                                onClick={() => viewSale(sale.id)}
                                                className={`flex w-full items-center justify-between p-3 text-left hover:bg-slate-50 ${selectedSale?.id === sale.id ? "bg-slate-50" : ""
                                                    }`}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-900">{`Sale #${sale.sale_number}`}</p>
                                                    <p className="text-slate-400">
                                                        {sale.customer_name || "Walk-In Customer"} · {sale.sale_type} · {sale.business_location_name || "-"}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="w-1/2 overflow-y-auto p-4">
                                {selectedSaleLoading ? (
                                    <p className="font-medium text-slate-400">Loading...</p>
                                ) : !selectedSale ? (
                                    <div className="flex h-full items-center justify-center text-center font-medium text-slate-400">
                                        <div>
                                            <ChevronLeft className="mx-auto mb-2 text-slate-300 w-5 h-5" />
                                            Select a sale to view details
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Sale Details</p>
                                            <p className="mt-0.5 text-slate-500">{formatDate(selectedSale.created_at)}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                            <div className="col-span-2">
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Sale ID</p>
                                                <p className="break-all font-semibold text-slate-800">{selectedSale.id}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Customer</p>
                                                <p className="font-semibold text-slate-800">{selectedSale.customer_name}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Sale Type</p>
                                                <p className="font-semibold capitalize text-slate-800">{selectedSale.sale_type}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Business Location</p>
                                                <p className="font-semibold text-slate-800">{selectedSale.business_location_name || "-"}</p>
                                            </div>
                                            <div>
                                                <p className="font-semibold uppercase tracking-wide text-slate-400 text-[9px]">Payment Method</p>
                                                <p className="font-semibold capitalize text-slate-800">
                                                    {(selectedSale.payments || []).map((p) => p.payment_method).join(", ") || "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                                            {(selectedSale.items || []).map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5">
                                                    <span className="text-slate-700">
                                                        {item.product_name || `Product #${item.product_id}`} × {item.quantity}
                                                    </span>
                                                    <span className="font-semibold text-slate-900">
                                                        {currency(item.unit_price_inc_tax * item.quantity)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Discount</span>
                                                <span>{currency(selectedSale.discount_amount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Tax</span>
                                                <span>{currency(selectedSale.order_tax_amount)}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-slate-900">
                                                <span>Total</span>
                                                <span>{currency(selectedSale.total_amount)}</span>
                                            </div>
                                        </div>
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