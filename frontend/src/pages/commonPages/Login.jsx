import { useState } from "react";
import { Eye, EyeOff, Mail, Phone } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import loginBanner from "../../assets/Restaurant_software_banner1.jpg.jpeg";
import sarasLogo from "../../assets/SaraS-Web-Solution.png";
import { useAuth } from "../../context/authContext";

export default function Login({ portal = "client", endpoint = "/clientAuth/login", title = "Saras Restaurant" }) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const payload = {
                email: formData.email,
                password: formData.password,
            };

            const { data } = await api.post(endpoint, payload);

            if (data?.success) {
                const authToken = data.token || data.data?.token;
                const user = data.user || data.data?.user || data.data?.client || data.admin;
                const subscription = data.subscription || data.data?.subscription || null;

                if (!authToken || !user) {
                    throw new Error("Invalid login response");
                }

                login(authToken, user, subscription, portal);

                toast.success("Login successful");

                navigate(portal === "admin" ? "/dashboard" : "/admin-dashboard", { replace: true });
            }
        } catch (error) {
            console.error(error);

            if (
                error.response?.status === 400 &&
                error.response?.data?.errors
            ) {
                const validationErrors = {};

                error.response.data.errors.forEach((err) => {
                    validationErrors[err.path] = err.msg;
                });

                setErrors(validationErrors);
                return;
            }

            toast.error(
                error?.response?.data?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full overflow-hidden grid grid-cols-1 lg:grid-cols-2 bg-white">
            <div className="relative hidden lg:block h-full overflow-hidden">
                <img
                    src={loginBanner}
                    alt=""
                    className="h-full w-full object-cover"
                />
            </div>

            <div className="h-full overflow-y-auto flex flex-col justify-center px-6 py-6 sm:px-12 lg:px-16">

                <div className="w-full max-w-md mx-auto">
                    <div className="text-center mb-6">
                        <img
                            src={sarasLogo}
                            alt="Saras Restaurant"
                            className="h-15 w-40 mx-auto mb-4"
                        />

                        <p className="text-gray-500 mt-2 text-sm">
                            Log in to your{" "}
                            <span className="text-[#40295C]">
                                {title}
                            </span>{" "}
                            account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Your work email"
                            className={`w-full h-14 rounded-lg border px-4 outline-none transition-colors
                                ${errors.email
                                    ? "border-red-500"
                                    : "border-gray-300 focus:border-[#40295C]"
                                }`}
                        />

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                className={`w-full h-14 rounded-lg border pl-4 pr-12 outline-none transition-colors
                                    ${errors.password
                                        ? "border-red-500"
                                        : "border-gray-300 focus:border-[#40295C]"
                                    }`}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#40295C] transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-lg bg-[#40295C] hover:bg-[#321F49] font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Please wait..." : "Log In"}
                        </button>
                    </form>
                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm font-semibold text-gray-700 mb-4">
                            Need Help?
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="mailto:support@saraswebsolutions.com"
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#40295C] transition-colors"
                            >
                                <Mail size={17} />
                                <span>support@saraswebsolutions.com</span>
                            </a>

                            <a
                                href="tel:+919876543210"
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#40295C] transition-colors"
                            >
                                <Phone size={17} />
                                <span>+91 98765 43210</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}