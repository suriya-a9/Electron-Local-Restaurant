import React, { useEffect, useState } from "react";
import {
    MapPin,
    Plus,
    X,
    Check,
    Search,
    Pencil,
    Trash2,
    Star,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    code: "",
    gst_number: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
    phone: "",
    email: "",
    is_primary: false,
};

const BusinessLocations = () => {
    const { token } = useAuth();

    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);

    const [deleteTarget, setDeleteTarget] = useState(null);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        loadLocations();
    }, []);

    function authHeaders() {
        return {
            Accept: "application/json",
            ...(token
                ? {
                    Authorization: `Bearer ${token}`,
                }
                : {}),
        };
    }

    async function loadLocations() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/client/business-locations`,
                {
                    headers: authHeaders(),
                }
            );

            const json = await res.json();

            console.log("BUSINESS LOCATIONS API RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load business locations"
                );
            }

            setLocations(
                Array.isArray(json.data)
                    ? json.data
                    : Array.isArray(json.data?.locations)
                        ? json.data.locations
                        : Array.isArray(json.data?.data)
                            ? json.data.data
                            : []
            );
        } catch (err) {
            console.error("Load business locations error:", err);

            setError(err.message);
            setLocations([]);
        } finally {
            setLoading(false);
        }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function openEditForm(location) {
        setEditingId(location.id);
        setForm({
            name: location.name || "",
            code: location.code || "",
            gst_number: location.gst_number || "",
            address: location.address || "",
            city: location.city || "",
            state: location.state || "",
            country: location.country || "",
            postal_code: location.postal_code || "",
            phone: location.phone || "",
            email: location.email || "",
            is_primary: !!location.is_primary,
        });
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
    }

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));

        setFormErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setSaving(true);
        setError(null);
        setFormErrors({});

        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            gst_number: form.gst_number.trim(),
            address: form.address.trim(),
            city: form.city.trim(),
            state: form.state.trim(),
            country: form.country.trim(),
            postal_code: form.postal_code.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            is_primary: form.is_primary,
        };

        const isEditing = Boolean(editingId);

        const url = isEditing
            ? `${API_BASE_URL}/api/client/business-locations/${editingId}`
            : `${API_BASE_URL}/api/client/business-locations`;

        try {
            const res = await fetch(url, {
                method: isEditing ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders(),
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            console.log(
                isEditing
                    ? "UPDATE BUSINESS LOCATION RESPONSE:"
                    : "CREATE BUSINESS LOCATION RESPONSE:",
                json
            );

            if (!res.ok || !json.success) {
                if (json.errors) {
                    setFormErrors(json.errors);
                }

                throw new Error(
                    json.message ||
                    `Failed to ${isEditing ? "update" : "create"} business location`
                );
            }

            closeForm();

            if (!isEditing) {
                setCurrentPage(1);
            }

            await loadLocations();
        } catch (err) {
            console.error(
                isEditing
                    ? "Update business location error:"
                    : "Create business location error:",
                err
            );

            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    function requestDelete(location) {
        setError(null);
        setDeleteTarget(location);
    }

    function cancelDelete() {
        if (deletingId) return;
        setDeleteTarget(null);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;

        setDeletingId(deleteTarget.id);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/api/client/business-locations/${deleteTarget.id}`,
                {
                    method: "DELETE",
                    headers: authHeaders(),
                }
            );

            const json = await res.json();

            console.log("DELETE BUSINESS LOCATION RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to delete business location"
                );
            }

            setDeleteTarget(null);

            const remainingOnPage =
                paginatedLocations.length === 1 && currentPage > 1;

            if (remainingOnPage) {
                setCurrentPage((prev) => prev - 1);
            }

            await loadLocations();
        } catch (err) {
            console.error("Delete business location error:", err);

            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    function getLocationSearchText(location) {
        return [
            location.name,
            location.code,
            location.gst_number,
            location.address,
            location.city,
            location.state,
            location.country,
            location.postal_code,
            location.phone,
            location.email,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
    }

    const filteredLocations = Array.isArray(locations)
        ? locations.filter((location) =>
            getLocationSearchText(location).includes(
                search.toLowerCase()
            )
        )
        : [];

    const totalPages = Math.ceil(
        filteredLocations.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedLocations = filteredLocations.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    function getFormError(field) {
        if (!formErrors[field]) return null;

        return Array.isArray(formErrors[field])
            ? formErrors[field][0]
            : formErrors[field];
    }

    function inputClass(field) {
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-indigo-500 ${formErrors[field]
            ? "border-rose-400"
            : "border-zinc-200/80"
            }`;
    }

    const isEditing = Boolean(editingId);

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-8 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-indigo-950 sm:text-5xl">
                        Business Locations
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {locations.length} Location
                        {locations.length === 1 ? "" : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Location
                </button>
            </div>

            {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                    {error}
                </div>
            )}

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    className="mt-6 rounded-2xl border border-zinc-200/60 bg-zinc-50/30 p-6"
                >
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900">
                                {isEditing
                                    ? "Edit Business Location"
                                    : "New Business Location"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {isEditing
                                    ? "Update the details for this location."
                                    : "Add a new branch or business location."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            className="text-zinc-400 transition-colors hover:text-zinc-700"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Location Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Melur Main Branch"
                                className={inputClass("name")}
                            />

                            {getFormError("name") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("name")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Location Code
                            </label>

                            <input
                                type="text"
                                name="code"
                                required
                                value={form.code}
                                onChange={handleChange}
                                placeholder="BR-001"
                                className={inputClass("code")}
                            />

                            {getFormError("code") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("code")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                GST Number
                            </label>

                            <input
                                type="text"
                                name="gst_number"
                                value={form.gst_number}
                                onChange={handleChange}
                                placeholder="33ABCDE1234F1Z5"
                                className={inputClass("gst_number")}
                            />

                            {getFormError("gst_number") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("gst_number")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                className={inputClass("phone")}
                            />

                            {getFormError("phone") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("phone")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="branch1@yourclient.com"
                                className={inputClass("email")}
                            />

                            {getFormError("email") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("email")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Postal Code
                            </label>

                            <input
                                type="text"
                                name="postal_code"
                                value={form.postal_code}
                                onChange={handleChange}
                                placeholder="625020"
                                className={inputClass("postal_code")}
                            />

                            {getFormError("postal_code") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("postal_code")}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Address
                            </label>

                            <input
                                type="text"
                                name="address"
                                required
                                value={form.address}
                                onChange={handleChange}
                                placeholder="123 Anna Nagar"
                                className={inputClass("address")}
                            />

                            {getFormError("address") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("address")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                City
                            </label>

                            <input
                                type="text"
                                name="city"
                                required
                                value={form.city}
                                onChange={handleChange}
                                placeholder="Melur"
                                className={inputClass("city")}
                            />

                            {getFormError("city") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("city")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                State
                            </label>

                            <input
                                type="text"
                                name="state"
                                required
                                value={form.state}
                                onChange={handleChange}
                                placeholder="Tamil Nadu"
                                className={inputClass("state")}
                            />

                            {getFormError("state") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("state")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Country
                            </label>

                            <input
                                type="text"
                                name="country"
                                required
                                value={form.country}
                                onChange={handleChange}
                                placeholder="India"
                                className={inputClass("country")}
                            />

                            {getFormError("country") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("country")}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center md:pt-6">
                            <label className="flex cursor-pointer items-center gap-3">

                                <input
                                    type="checkbox"
                                    name="is_primary"
                                    checked={form.is_primary}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                                />

                                <span className="text-sm font-semibold text-zinc-700">
                                    Set as primary location
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />

                            {saving
                                ? isEditing
                                    ? "Saving..."
                                    : "Creating..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Create Location"}
                        </button>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-8">
                <div className="relative max-w-md">

                    <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search locations..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading business locations...
                    </p>
                ) : filteredLocations.length === 0 ? (
                    <div className="p-10 text-center">

                        <MapPin
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No business locations found."
                                : "No business locations yet."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">

                        {paginatedLocations.map((location) => (
                            <div
                                key={location.id}
                                className="flex flex-col gap-5 p-6 transition-colors hover:bg-zinc-50/30 lg:flex-row lg:items-center lg:justify-between"
                            >

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <MapPin size={18} />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {location.name ||
                                                    "Unnamed Location"}
                                            </h3>

                                            {location.is_primary && (
                                                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600">
                                                    <Star
                                                        size={11}
                                                        fill="currentColor"
                                                    />
                                                    Primary
                                                </span>
                                            )}

                                        </div>

                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">

                                            {location.code && (
                                                <span className="font-semibold text-indigo-600">
                                                    {location.code}
                                                </span>
                                            )}

                                            {location.gst_number && (
                                                <span>
                                                    GST: {location.gst_number}
                                                </span>
                                            )}

                                        </div>

                                        <p className="mt-2 text-sm text-zinc-600">
                                            {[
                                                location.address,
                                                location.city,
                                                location.state,
                                                location.postal_code,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>

                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">

                                            {location.phone && (
                                                <span>
                                                    {location.phone}
                                                </span>
                                            )}

                                            {location.email && (
                                                <span>
                                                    {location.email}
                                                </span>
                                            )}

                                        </div>

                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 lg:pl-4">

                                    <button
                                        onClick={() => openEditForm(location)}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                                    >
                                        <Pencil size={13} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => requestDelete(location)}
                                        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-rose-300 hover:text-rose-600"
                                    >
                                        <Trash2 size={13} />
                                        Delete
                                    </button>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!loading &&
                filteredLocations.length > 0 &&
                totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4">

                    <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">

                        <h3 className="text-sm font-bold text-zinc-900">
                            Delete this location?
                        </h3>

                        <p className="mt-2 text-sm text-zinc-500">
                            <span className="font-semibold text-zinc-700">
                                {deleteTarget.name}
                            </span>{" "}
                            will be permanently removed. This can't be undone.
                        </p>

                        <div className="mt-6 flex gap-3">

                            <button
                                onClick={confirmDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Trash2 size={14} />

                                {deletingId === deleteTarget.id
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>

                            <button
                                onClick={cancelDelete}
                                disabled={deletingId === deleteTarget.id}
                                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default BusinessLocations;