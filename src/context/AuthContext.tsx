import Router from "next/router";
import { setCookie, parseCookies, destroyCookie } from "nookies";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../services/apiClient";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
};
type SigninCredentials = {
  email: string;
  password: string;
};

type AuthContextData = {
  signIn(credentials: SigninCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User;
};

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthContext = createContext<AuthContextData>(
  {} as AuthContextData
);

export function signout() {
  destroyCookie(undefined, "@token");
  destroyCookie(undefined, "@refreshToken");
  Router.push("/");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {
    const { "@token": token } = parseCookies();

    if (token) {
      api
        .get("me")
        .then((rs) => {
          const { email, permissions, roles } = rs.data;

          setUser({ email, permissions, roles });
        })
        .catch((err) => {
          signout();
        });
    }
  }, []);

  const signIn = async ({ email, password }: SigninCredentials) => {
    try {
      const { data } = await api.post("sessions", {
        email,
        password,
      });

      setCookie(undefined, "@token", data.token, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });
      setCookie(undefined, "@refreshToken", data.refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      setUser({
        email,
        permissions: data.permissions,
        roles: data.roles,
      });
      api.defaults.headers["Authorization"] = `Bearer ${data.token}`;
      Router.push("/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
