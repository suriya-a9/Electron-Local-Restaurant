import { useEffect, useState } from "react";
import { MapPin, Search, UserRound } from "lucide-react";
import { useAuth } from "../../context/authContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Customers = () => {
    const { token, businessLocationId: authBusinessLocationId } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const [customers, setCustomers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [locationId, setLocationId] = useState(authBusinessLocationId || "");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLocations();
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [locationId, search]);

    async function loadLocations() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/client/business-locations`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await response.json();
            if (!response.ok || !json.success) throw new Error(json.message || "Failed to load locations");
            setLocations(Array.isArray(json.data) ? json.data : []);
        } catch (loadError) {
            console.error("Load locations error:", loadError);
        }
    }

    async function loadCustomers() {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (locationId) params.set("business_location_id", locationId);
            if (search.trim()) params.set("search", search.trim());
            const response = await fetch(`${API_BASE_URL}/api/customers?${params}`, {
                headers: { Accept: "application/json", ...authHeaders },
            });
            const json = await response.json();
            if (!response.ok || !json.success) throw new Error(json.message || "Failed to load customers");
            setCustomers(Array.isArray(json.data) ? json.data : []);
        } catch (loadError) {
            console.error("Load customers error:", loadError);
            setError(loadError.message);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    }

    const locationName = (id) => locations.find((location) => String(location.id) === String(id))?.name || "-";

    return (
        <div className="min-h-screen bg-white p-6 text-zinc-800 antialiased md:p-8 lg:p-12">
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-5xl">Customers</h1>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{customers.length} customer{customers.length === 1 ? "" : "s"}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    {!authBusinessLocationId && (
                        <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold">
                            <MapPin size={14} className="text-indigo-600" />
                            <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="bg-transparent outline-none">
                                <option value="">All locations</option>
                                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                            </select>
                        </label>
                    )}
                    <label className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs">
                        <Search size={14} className="text-zinc-400" />
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or mobile" className="w-48 bg-transparent outline-none" />
                    </label>
                </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {loading ? <p className="p-6 text-sm font-medium text-zinc-400">Loading customers...</p> : error ? <p className="p-6 text-sm font-medium text-rose-600">{error}</p> : customers.length === 0 ? <p className="p-10 text-center text-sm font-medium text-zinc-400">No customers found.</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-400">
                                <tr><th className="px-5 py-4">Customer</th><th className="px-5 py-4">Mobile</th><th className="px-5 py-4">Address</th><th className="px-5 py-4">Location</th></tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-zinc-50/30">
                                        <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UserRound size={16} /></span><span className="font-semibold text-zinc-950">{customer.name}</span></div></td>
                                        <td className="px-5 py-4 font-medium text-zinc-600">{customer.mobile_number}</td>
                                        <td className="max-w-xs px-5 py-4 text-zinc-500">{customer.address || "-"}</td>
                                        <td className="px-5 py-4 text-zinc-500">{customer.business_location_name || locationName(customer.business_location_id)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Customers;