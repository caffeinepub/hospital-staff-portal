import { type ReactNode, createContext, useContext, useState } from "react";
import { UserRole } from "../backend";

export type Page =
  | "dashboard"
  | "staff"
  | "roster"
  | "notices"
  | "leave"
  | "documents";

interface AppContextType {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  employeeId: string;
  setEmployeeId: (id: string) => void;
  isAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [userRole, setUserRole] = useState<UserRole>(UserRole.guest);
  const [employeeId, setEmployeeId] = useState<string>("");

  return (
    <AppContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        userRole,
        setUserRole,
        employeeId,
        setEmployeeId,
        isAdmin: userRole === UserRole.admin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
