import { useCallback, useEffect, useMemo, useState } from "react";
import api, { TOKEN_KEY } from "../lib/api";
import { AuthContext } from "./authStore";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;

    api
      .get("/auth/me")
      .then(({ data }) => {
        if (active) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  const adopt = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  const signIn = useCallback(
    async (identifier, password) => {
      const { data } = await api.post("/auth/login", { identifier, password });
      adopt(data.token, data.user);
      return data;
    },
    [adopt]
  );

  const registerCompany = useCallback(
    async (payload) => {
      const { data } = await api.post("/auth/register-company", payload);
      adopt(data.token, data.user);
      return data;
    },
    [adopt]
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, signIn, registerCompany, signOut }),
    [token, user, loading, signIn, registerCompany, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
