import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Hospital, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UserRole } from "./backend";
import Layout from "./components/Layout";
import { AppProvider, useAppContext } from "./context/AppContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";

function AuthGate() {
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const { setUserRole, setEmployeeId } = useAppContext();
  const [loadingRole, setLoadingRole] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!actor || isFetching || !identity) return;
    setLoadingRole(true);
    Promise.all([actor.getCallerUserRole(), actor.getCallerUserProfile()])
      .then(([role, profile]) => {
        setUserRole(role);
        if (profile) setEmployeeId(profile.employeeId);
        setInitialized(true);
      })
      .catch(() => {
        setUserRole(UserRole.guest);
        setInitialized(true);
      })
      .finally(() => setLoadingRole(false));
  }, [actor, isFetching, identity, setUserRole, setEmployeeId]);

  if (isInitializing || isFetching || loadingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 text-center p-8">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-2xl"
            style={{ background: "oklch(0.22 0.06 240)" }}
          >
            <Hospital className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Hospital Staff Portal
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Secure internal administration system
            </p>
          </div>
          <Button
            data-ocid="login.primary_button"
            onClick={login}
            disabled={isLoggingIn}
            size="lg"
            className="w-full max-w-xs"
          >
            {isLoggingIn ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoggingIn ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Layout />;
}

export default function App() {
  return (
    <AppProvider>
      <AuthGate />
      <Toaster />
    </AppProvider>
  );
}
