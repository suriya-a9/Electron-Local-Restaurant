import React from "react";
import {
    Users,
    CreditCard,
    UserCheck,
    UserX,
    TrendingUp,
    ArrowUpRight,
    Activity,
    Building2,
} from "lucide-react";

const AdminDashboard = () => {
    const stats = [
        {
            title: "Total Clients",
            value: "128",
            description: "Registered clients",
            icon: Users,
        },
        {
            title: "Active Clients",
            value: "96",
            description: "Currently active",
            icon: UserCheck,
        },
        {
            title: "Inactive Clients",
            value: "24",
            description: "Currently inactive",
            icon: UserX,
        },
        {
            title: "Subscriptions",
            value: "104",
            description: "Active subscriptions",
            icon: CreditCard,
        },
    ];

    const subscriptionStats = [
        {
            name: "Starter",
            clients: 42,
            percentage: 40,
        },
        {
            name: "Professional",
            clients: 38,
            percentage: 36,
        },
        {
            name: "Premium",
            clients: 24,
            percentage: 24,
        },
    ];

    const recentClients = [
        {
            id: 1,
            business: "Pizza Palace Restaurant",
            name: "John Doe",
            email: "admin@pizzapalace.com",
            status: "active",
            plan: "Professional",
        },
        {
            id: 2,
            business: "Green Garden Cafe",
            name: "Sarah Wilson",
            email: "sarah@greengarden.com",
            status: "active",
            plan: "Starter",
        },
        {
            id: 3,
            business: "Urban Bites",
            name: "Michael Brown",
            email: "michael@urbanbites.com",
            status: "trial",
            plan: "Starter",
        },
        {
            id: 4,
            business: "Royal Spice",
            name: "David Kumar",
            email: "admin@royalspice.com",
            status: "inactive",
            plan: "Premium",
        },
        {
            id: 5,
            business: "Fresh Kitchen",
            name: "Emily Johnson",
            email: "emily@freshkitchen.com",
            status: "active",
            plan: "Premium",
        },
    ];

    const statusClass = {
        active: "bg-emerald-50 text-emerald-600",
        inactive: "bg-zinc-100 text-zinc-500",
        trial: "bg-purple-50 text-[#40295C]",
        suspended: "bg-rose-50 text-rose-600",
    };

    return (
        <div className="min-h-screen bg-white p-6 text-zinc-800 antialiased md:p-8 lg:p-12">

            <div className="border-b border-zinc-100 pb-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#40295C]">
                            Super Admin
                        </p>

                        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#40295C] sm:text-5xl">
                            Dashboard
                        </h1>

                        <p className="mt-2 max-w-xl text-sm text-zinc-500">
                            Overview of your clients, subscriptions, and
                            platform activity.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5">
                        <Activity
                            size={15}
                            className="text-[#40295C]"
                        />

                        <span className="text-xs font-semibold text-zinc-600">
                            System Overview
                        </span>

                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.title}
                            className="rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                    <Icon size={19} />
                                </div>

                                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                                    <TrendingUp size={11} />
                                    8.4%
                                </div>
                            </div>

                            <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                                {stat.title}
                            </p>

                            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-zinc-950">
                                {stat.value}
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                {stat.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">

                <div className="xl:col-span-2 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-950">
                                Client Overview
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Current client account status
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                            <Building2 size={17} />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Active
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                96
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                75% of total clients
                            </p>
                        </div>

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#40295C]" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Trial
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                8
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                6% of total clients
                            </p>
                        </div>

                        <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400" />

                                <span className="text-xs font-semibold text-zinc-500">
                                    Inactive
                                </span>
                            </div>

                            <p className="mt-3 text-2xl font-extrabold text-zinc-950">
                                24
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                                19% of total clients
                            </p>
                        </div>
                    </div>

                    <div className="mt-6">

                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-500">
                                Active client ratio
                            </span>

                            <span className="text-xs font-bold text-[#40295C]">
                                75%
                            </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                            <div
                                className="h-full rounded-full bg-[#40295C]"
                                style={{ width: "75%" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-sm font-bold text-zinc-950">
                                Subscriptions
                            </h2>

                            <p className="mt-1 text-xs text-zinc-400">
                                Plan distribution
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                            <CreditCard size={17} />
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">

                        {subscriptionStats.map((subscription) => (
                            <div key={subscription.name}>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-zinc-600">
                                        {subscription.name}
                                    </span>

                                    <span className="text-xs font-bold text-zinc-900">
                                        {subscription.clients}
                                    </span>
                                </div>

                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
                                    <div
                                        className="h-full rounded-full bg-[#40295C]"
                                        style={{
                                            width: `${subscription.percentage}% `,
                                        }}
                                    />
                                </div>

                                <p className="mt-1 text-[10px] text-zinc-400">
                                    {subscription.percentage}% of subscriptions
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-zinc-100 pt-5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-zinc-500">
                                Total active subscriptions
                            </span>

                            <span className="text-lg font-extrabold text-zinc-950">
                                104
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">

                <div className="flex flex-col gap-3 border-b border-zinc-100 p-6 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-sm font-bold text-zinc-950">
                            Recent Clients
                        </h2>

                        <p className="mt-1 text-xs text-zinc-400">
                            Recently registered client accounts
                        </p>
                    </div>

                    <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#40295C] hover:underline"
                    >
                        View all
                        <ArrowUpRight size={13} />
                    </button>
                </div>

                <div className="divide-y divide-zinc-100">

                    {recentClients.map((client) => (
                        <div
                            key={client.id}
                            className="flex flex-col gap-4 p-5 transition-colors hover:bg-zinc-50/40 md:flex-row md:items-center md:justify-between"
                        >

                            <div className="flex items-center gap-4">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#40295C]/5 text-[#40295C]">
                                    <Users size={17} />
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold text-zinc-950">
                                            {client.business}
                                        </h3>

                                        <span
                                            className={`rounded - full px - 2 py - 0.5 text - [10px] font - bold uppercase ${statusClass[client.status]
                                                } `}
                                        >
                                            {client.status}
                                        </span>
                                    </div>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {client.name} · {client.email}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-5 md:justify-end">

                                <div className="text-left md:text-right">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                                        Plan
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-zinc-700">
                                        {client.plan}
                                    </p>
                                </div>

                                <ArrowUpRight
                                    size={15}
                                    className="text-zinc-300"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

                <div className="rounded-2xl border border-zinc-200/70 bg-[#40295C] p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
                        Platform Growth
                    </p>

                    <div className="mt-3 flex items-end gap-2">
                        <span className="text-3xl font-extrabold">
                            +18.6%
                        </span>

                        <TrendingUp
                            size={18}
                            className="mb-1"
                        />
                    </div>

                    <p className="mt-2 text-xs text-white/60">
                        Client growth compared to last month
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Active Rate
                    </p>

                    <p className="mt-3 text-3xl font-extrabold text-zinc-950">
                        75%
                    </p>

                    <p className="mt-2 text-xs text-zinc-400">
                        96 out of 128 clients are active
                    </p>
                </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        Subscription Rate
                    </p>

                    <p className="mt-3 text-3xl font-extrabold text-zinc-950">
                        81.2%
                    </p>

                    <p className="mt-2 text-xs text-zinc-400">
                        104 clients currently have subscriptions
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;