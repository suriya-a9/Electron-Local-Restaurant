import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const getUserRole = (user, authPortal) => {
    const explicitRole = user?.roles?.[0]?.name || user?.role;

    if (explicitRole) {
        return explicitRole;
    }

    return authPortal === "client" ? "admin" : null;
};

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(null);
    const [portal, setPortal] = useState(null);
    const [id, setId] = useState(null);
    const [name, setName] = useState(null);
    const [role, setRole] = useState(null);
    const [businessLocationId, setBusinessLocationId] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("subscription");
        localStorage.removeItem("portal");

        setToken(null);
        setPortal(null);
        setId(null);
        setName(null);
        setRole(null);
        setBusinessLocationId(null);
        setSubscription(null);
        setPermissions([]);
    };

    const login = (authToken, user, authSubscription = null, authPortal = "client") => {
        const userRole = getUserRole(user, authPortal);
        const userPermissions = user?.permissions || [];
        const userBusinessLocationId = user?.business_location_id ?? null;

        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("portal", authPortal);
        if (authSubscription) {
            localStorage.setItem("subscription", JSON.stringify(authSubscription));
        }

        setToken(authToken);
        setPortal(authPortal);
        setId(user.id);
        setName(user.name);
        setRole(userRole);
        setBusinessLocationId(userBusinessLocationId);
        setSubscription(authSubscription);
        setPermissions(userPermissions);
    };

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
            try {
                if (storedUser === "undefined" || storedUser === "null") {
                    throw new Error("Stored user data is invalid");
                }

                const user = JSON.parse(storedUser);

                if (!user || typeof user !== "object") {
                    throw new Error("Stored user data is invalid");
                }

                const storedSubscription = localStorage.getItem("subscription");
                const storedPortal = localStorage.getItem("portal") || "client";

                setToken(storedToken);
                setPortal(storedPortal);
                setId(user.id);
                setName(user.name);
                setRole(getUserRole(user, storedPortal));
                setBusinessLocationId(user.business_location_id ?? null);
                setSubscription(storedSubscription ? JSON.parse(storedSubscription) : null);
                setPermissions(user.permissions || []);
            } catch (error) {
                console.error("Failed to restore authentication:", error);
                logout();
            }
        }

        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                portal,
                id,
                name,
                role,
                businessLocationId,
                subscription,
                permissions,
                login,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);