import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { User, AlertTriangle, ShoppingCart } from "lucide-react";
import logo from "../assets/SaraS-Web-Solution.png"

const Header = () => {
    const navigate = useNavigate();
    const { logout, role, portal, subscription } = useAuth();
    const [accountOpen, setAccountOpen] = useState(false);
    const accountRef = useRef(null);

    const allowedWarningRoles = ["admin", "manager", "cashier", "waiter"];
    const normalizedRole = String(role || "").toLowerCase();
    const renewalPhone = "+91 98765 43210";
    const renewalEmail = "support@sarasbillingpro.com";
    const formattedExpiryDate = subscription?.end_date
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(new Date(subscription.end_date))
        : "";

    const shouldShowSubscriptionWarning =
        allowedWarningRoles.includes(normalizedRole) &&
        subscription?.end_date &&
        (() => {
            const endDate = new Date(subscription.end_date);
            const now = new Date();
            const diffInDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return diffInDays <= 5 && diffInDays >= 0;
        })();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (accountRef.current && !accountRef.current.contains(e.target)) {
                setAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="w-full h-16 bg-white flex items-center justify-between px-4 sm:px-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] z-80">
            <img src={logo} alt="Logo" className="h-10 w-auto" />

            <div className="flex items-center gap-3">
                {shouldShowSubscriptionWarning && (
                    <div className="flex items-center gap-2 rounded-full border border-red-300 bg-red-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_18px_rgba(239,68,68,0.7)] animate-pulse max-w-[520px]">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span className="leading-snug">
                            Subscription gonna expire on {formattedExpiryDate}. Contact us to renew.
                        </span>
                    </div>
                )}

                {portal === "client" && <button
                    className="flex items-center gap-2 rounded-lg border border-[#40295C]/20 bg-[#40295C] px-3 py-2 text-white shadow-[0_4px_12px_rgba(64,41,92,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_6px_16px_rgba(64,41,92,0.34)] cursor-pointer"
                    onClick={() => navigate('/admin-pos')}
                    aria-label="Open POS"
                    title="Open POS"
                >
                    <div className="flex gap-1">
                        <span className="block h-2.5 w-2.5 rounded-[2px] bg-white/90" />
                        <span className="block h-2.5 w-2.5 rounded-[2px] bg-white/70" />
                    </div>
                    <span className="text-sm font-bold tracking-wide">POS</span>
                </button>}

                <div className="relative" ref={accountRef}>
                    <button
                        className="flex items-center justify-center bg-transparent border-none cursor-pointer"
                        onClick={() => setAccountOpen((prev) => !prev)}
                        aria-haspopup="true"
                        aria-expanded={accountOpen}
                    >
                        <div
                            className="w-9 h-9 rounded-full text-white flex items-center justify-center font-bold"
                            style={{ backgroundColor: '#40295C' }}
                        >
                            <User size={18} strokeWidth={2.2} />
                        </div>
                    </button>

                    <div
                        className={`
                            absolute right-0 top-12 w-40 bg-white border border-[#e6e6ef]
                            shadow-[0_6px_18px_rgba(33,33,66,0.12)] rounded-lg py-2 z-200
                            ${accountOpen ? 'flex flex-col' : 'hidden'}
                        `}
                    >
                        <button
                            className="bg-transparent border-none px-4 py-2.5 text-left cursor-pointer text-[#333] hover:bg-[#f5f7fa]"
                            onClick={() => { navigate('/profile'); setAccountOpen(false); }}
                        >
                            Profile
                        </button>
                        <button
                            className="bg-transparent border-none px-4 py-2.5 text-left cursor-pointer text-[#333] hover:bg-[#f5f7fa]"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;