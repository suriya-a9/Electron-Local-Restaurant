import React, { useEffect, useState } from "react";
import {
    Users,
    Plus,
    X,
    Check,
    Search,
    Pencil,
} from "lucide-react";
import { useAuth } from "../../context/authContext";
import Pagination from "../../components/Pagination";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const emptyForm = {
    name: "",
    email: "",
    password: "",
    phone: "",
    business_location_id: "",
    designation: "",
    date_of_joining: "",
    salary: "",
    role: "",
};

const Employees = () => {
    const { token } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [locations, setLocations] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState(emptyForm);

    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        loadEmployees();
        loadRoles();
        loadLocations();
    }, []);

    async function loadEmployees() {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE_URL}/employees?per_page=1000`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                }
            );

            const json = await res.json();

            console.log("EMPLOYEES API RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load employees"
                );
            }

            const paginatedData = json.data;

            setEmployees(
                Array.isArray(paginatedData?.data)
                    ? paginatedData.data
                    : Array.isArray(paginatedData)
                        ? paginatedData
                        : []
            );

        } catch (err) {
            console.error("Load employees error:", err);

            setError(err.message);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }

    async function loadRoles() {
        try {
            const res = await fetch(
                `${API_BASE_URL}/roles`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                }
            );

            const json = await res.json();

            console.log("ROLES API RESPONSE:", json);

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message || "Failed to load roles"
                );
            }

            setRoles(
                Array.isArray(json.data)
                    ? json.data
                    : []
            );

        } catch (err) {
            console.error("Load roles error:", err);

            setError(err.message);
        }
    }

    async function loadLocations() {
        try {
            const res = await fetch(
                `${API_BASE_URL}/business-locations?per_page=1000`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                }
            );

            const json = await res.json();

            console.log(
                "BUSINESS LOCATIONS API RESPONSE:",
                json
            );

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message ||
                    "Failed to load business locations"
                );
            }

            setLocations(
                Array.isArray(json.data?.data)
                    ? json.data.data
                    : Array.isArray(json.data)
                        ? json.data
                        : []
            );

        } catch (err) {
            console.error(
                "Load business locations error:",
                err
            );

            setError(err.message);
        }
    }

    function openCreateForm() {
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
        setError(null);
        setShowForm(true);
    }

    async function openEditForm(employee) {
        setEditingId(employee.id);
        setFormErrors({});
        setError(null);
        setShowForm(true);
        setSaving(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/employees/${employee.id}`,
                {
                    headers: {
                        Accept: "application/json",
                        ...(token
                            ? {
                                Authorization: `Bearer ${token}`,
                            }
                            : {}),
                    },
                }
            );

            const json = await res.json();

            console.log(
                "EMPLOYEE DETAILS API RESPONSE:",
                json
            );

            if (!res.ok || !json.success) {
                throw new Error(
                    json.message ||
                    "Failed to load employee"
                );
            }

            const employeeData =
                json.data?.employee ||
                json.data;

            setForm({
                name: employeeData?.name || "",
                email: employeeData?.email || "",
                password: "",
                phone: employeeData?.phone || "",
                business_location_id:
                    employeeData?.business_location_id ||
                    employeeData?.business_location?.id ||
                    "",
                designation:
                    employeeData?.designation || "",
                date_of_joining:
                    employeeData?.date_of_joining
                        ? employeeData.date_of_joining.substring(
                            0,
                            10
                        )
                        : "",
                salary:
                    employeeData?.salary ?? "",
                role:
                    Array.isArray(employeeData?.roles)
                        ? employeeData.roles[0]?.name || ""
                        : employeeData?.role || "",
            });

        } catch (err) {
            console.error(
                "Load employee error:",
                err
            );

            setError(err.message);
            setShowForm(false);
        } finally {
            setSaving(false);
        }
    }

    function closeForm() {
        if (saving) return;

        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setFormErrors({});
    }

    function handleChange(e) {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
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
            email: form.email.trim(),
            phone: form.phone.trim(),
            business_location_id:
                Number(form.business_location_id),
            designation: form.designation.trim(),
            date_of_joining: form.date_of_joining,
            salary: Number(form.salary),
            role: form.role,
        };

        if (!editingId) {
            payload.password = form.password;
        }

        try {
            const url = editingId
                ? `${API_BASE_URL}/employees/${editingId}`
                : `${API_BASE_URL}/employees`;

            const method = editingId
                ? "PUT"
                : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token
                        ? {
                            Authorization: `Bearer ${token}`,
                        }
                        : {}),
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            console.log(
                editingId
                    ? "UPDATE EMPLOYEE RESPONSE:"
                    : "CREATE EMPLOYEE RESPONSE:",
                json
            );

            if (!res.ok || !json.success) {
                if (json.errors) {
                    setFormErrors(json.errors);
                }

                throw new Error(
                    json.message ||
                    (
                        editingId
                            ? "Failed to update employee"
                            : "Failed to create employee"
                    )
                );
            }

            closeForm();

            setCurrentPage(1);

            await loadEmployees();

        } catch (err) {
            console.error(
                "Save employee error:",
                err
            );

            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const filteredEmployees = Array.isArray(employees)
        ? employees.filter((employee) => {
            const searchValue = search.toLowerCase();

            return (
                employee.name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.email
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.phone
                    ?.toLowerCase()
                    .includes(searchValue) ||
                employee.designation
                    ?.toLowerCase()
                    .includes(searchValue) ||
                getRoleName(employee)
                    ?.toLowerCase()
                    .includes(searchValue)
            );
        })
        : [];

    const totalPages = Math.ceil(
        filteredEmployees.length / itemsPerPage
    );

    const startIndex =
        (currentPage - 1) * itemsPerPage;

    const paginatedEmployees = filteredEmployees.slice(
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
        return `mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 outline-none focus:border-[#40295C] ${formErrors[field]
            ? "border-rose-400"
            : "border-zinc-200/80"
            }`;
    }

    function getRoleName(employee) {
        if (Array.isArray(employee.roles) && employee.roles.length > 0) {
            return employee.roles
                .map((role) => role.name)
                .join(", ");
        }

        if (typeof employee.role === "string") {
            return employee.role;
        }

        if (employee.role?.name) {
            return employee.role.name;
        }

        return employee.role_name || "—";
    }

    function getLocationName(employee) {
        if (employee.business_location?.name) {
            return employee.business_location.name;
        }

        if (employee.businessLocation?.name) {
            return employee.businessLocation.name;
        }

        const location = locations.find(
            (item) =>
                Number(item.id) ===
                Number(employee.business_location_id)
        );

        return location?.name || "—";
    }

    function handlePageChange(page) {
        setCurrentPage(page);
    }

    return (
        <div className="min-h-screen bg-white text-zinc-800 antialiased p-6 md:p-8 lg:p-12">

            <div className="flex flex-col gap-6 border-b border-zinc-100 pb-8 md:flex-row md:items-center md:justify-between">

                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                        Employees
                    </h1>

                    <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {employees.length} Employee
                        {employees.length === 1
                            ? ""
                            : "s"}
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="group flex items-center justify-center gap-2 rounded-full bg-[#40295C] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#321f49] hover:scale-[1.01] active:scale-[0.99]"
                >
                    <Plus
                        size={16}
                        className="transition-transform group-hover:rotate-90"
                    />

                    New Employee
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
                                {editingId
                                    ? "Edit Employee"
                                    : "New Employee"}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {editingId
                                    ? "Update employee information."
                                    : "Create a new employee account."}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={closeForm}
                            disabled={saving}
                            className="text-zinc-400 transition-colors hover:text-zinc-700 disabled:opacity-50"
                        >
                            <X size={18} />
                        </button>

                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Name
                            </label>

                            <input
                                type="text"
                                name="name"
                                required
                                value={form.name}
                                onChange={handleChange}
                                placeholder="Ravi Kumar"
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
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                required
                                value={form.email}
                                onChange={handleChange}
                                placeholder="ravi@pizzapalace.com"
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
                                Phone
                            </label>

                            <input
                                type="text"
                                name="phone"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="9876500011"
                                className={inputClass("phone")}
                            />

                            {getFormError("phone") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("phone")}
                                </p>
                            )}
                        </div>

                        {!editingId && (
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="password"
                                    required={!editingId}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="password123"
                                    className={inputClass("password")}
                                />

                                {getFormError("password") && (
                                    <p className="mt-1 text-xs text-rose-500">
                                        {getFormError("password")}
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Business Location
                            </label>

                            <select
                                name="business_location_id"
                                required
                                value={form.business_location_id}
                                onChange={handleChange}
                                className={inputClass("business_location_id")}
                            >
                                <option value="">
                                    Select location
                                </option>

                                {locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.name}
                                        {location.code
                                            ? ` (${location.code})`
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            {getFormError("business_location_id") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("business_location_id")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Designation
                            </label>

                            <input
                                type="text"
                                name="designation"
                                value={form.designation}
                                onChange={handleChange}
                                placeholder="Floor Manager"
                                className={inputClass("designation")}
                            />

                            {getFormError("designation") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("designation")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Date of Joining
                            </label>

                            <input
                                type="date"
                                name="date_of_joining"
                                value={form.date_of_joining}
                                onChange={handleChange}
                                className={inputClass("date_of_joining")}
                            />

                            {getFormError("date_of_joining") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("date_of_joining")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Salary
                            </label>

                            <input
                                type="number"
                                name="salary"
                                min="0"
                                value={form.salary}
                                onChange={handleChange}
                                placeholder="25000"
                                className={inputClass("salary")}
                            />

                            {getFormError("salary") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("salary")}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                Role
                            </label>

                            <select
                                name="role"
                                required
                                value={form.role}
                                onChange={handleChange}
                                className={inputClass("role")}
                            >
                                <option value="">
                                    Select role
                                </option>

                                {roles.map((role) => (
                                    <option
                                        key={role.id}
                                        value={role.name}
                                    >
                                        {role.name.charAt(0).toUpperCase() +
                                            role.name.slice(1)}
                                    </option>
                                ))}
                            </select>

                            {getFormError("role") && (
                                <p className="mt-1 text-xs text-rose-500">
                                    {getFormError("role")}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 rounded-xl bg-[#40295C] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#321f49] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Check size={14} />

                            {saving
                                ? editingId
                                    ? "Updating..."
                                    : "Creating..."
                                : editingId
                                    ? "Update Employee"
                                    : "Create Employee"}
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
                        placeholder="Search employees..."
                        className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#40295C]"
                    />

                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">

                {loading ? (
                    <p className="p-6 text-sm font-medium text-zinc-400">
                        Loading employees...
                    </p>
                ) : filteredEmployees.length === 0 ? (
                    <div className="p-10 text-center">

                        <Users
                            className="mx-auto text-zinc-300"
                            size={30}
                        />

                        <p className="mt-3 text-sm font-medium text-zinc-400">
                            {search
                                ? "No employees found."
                                : "No employees yet."}
                        </p>

                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">

                        {paginatedEmployees.map((employee) => (
                            <div
                                key={employee.id}
                                className="flex flex-col gap-5 p-6 transition-colors hover:bg-zinc-50/30 lg:flex-row lg:items-center lg:justify-between"
                            >

                                <div className="flex items-start gap-4">

                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                        <Users size={18} />
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-2">

                                            <h3 className="text-sm font-semibold text-zinc-950">
                                                {employee.name}
                                            </h3>

                                            <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#40295C]">
                                                {getRoleName(employee)}
                                            </span>

                                        </div>

                                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">

                                            {employee.email && (
                                                <span>{employee.email}</span>
                                            )}

                                            {employee.phone && (
                                                <span>{employee.phone}</span>
                                            )}

                                        </div>

                                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">

                                            {employee.designation && (
                                                <span className="font-medium text-zinc-600">
                                                    {employee.designation}
                                                </span>
                                            )}

                                            <span className="text-zinc-400">
                                                {getLocationName(employee)}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                                <div className="flex items-center gap-2 lg:justify-end">

                                    <button
                                        type="button"
                                        onClick={() => openEditForm(employee)}
                                        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:border-[#40295C] hover:text-[#40295C]"
                                    >
                                        <Pencil size={14} />

                                        Edit
                                    </button>

                                </div>

                            </div>
                        ))}

                    </div>
                )}

            </div>

            {!loading &&
                filteredEmployees.length > 0 &&
                totalPages > 1 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

        </div>
    );
};

export default Employees;