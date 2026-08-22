/*
 * Holds the app-wide family filter and exposes shared record-matching rules.
 */

import { useCareMembers } from "@/hooks/useCareMembers";
import { useAuth } from "@/store/auth/AuthContext";
import type { CareMember } from "@/types/care-member";
import type { Provider } from "@/types/provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCareScope, saveCareScope } from "./care-scope-storage";

export type CareScope =
  | { type: "all" }
  | { type: "self" }
  | { type: "member"; careMemberId: number };

type CareScopeContextValue = {
  careMembers: CareMember[];
  label: string;
  matchesCareMember: (careMemberId: number | null) => boolean;
  matchesProvider: (provider: Provider) => boolean;
  scope: CareScope;
  setScope: (scope: CareScope) => void;
};

const CareScopeContext = createContext<CareScopeContextValue | undefined>(
  undefined,
);

// Coordinates the persisted scope with authentication and active family data.
export function CareScopeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { careMembers, isLoading } = useCareMembers();
  const [scope, setScopeState] = useState<CareScope>({ type: "all" });
  const [loadedUserId, setLoadedUserId] = useState<number | null>(null);

  // Loads the preference for the current account and clears it on sign-out.
  useEffect(() => {
    let isCurrent = true;

    if (!user) {
      setScopeState({ type: "all" });
      setLoadedUserId(null);
      return () => {
        isCurrent = false;
      };
    }

    setScopeState({ type: "all" });
    setLoadedUserId(null);

    void getCareScope(user.id)
      .then((storedScope) => {
        if (isCurrent) {
          setScopeState(storedScope);
          setLoadedUserId(user.id);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setScopeState({ type: "all" });
          setLoadedUserId(user.id);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [user]);

  // Returns to Everyone when the selected member no longer exists.
  useEffect(() => {
    if (
      !user ||
      loadedUserId !== user.id ||
      isLoading ||
      scope.type !== "member" ||
      careMembers.some((member) => member.id === scope.careMemberId)
    ) {
      return;
    }

    const fallbackScope: CareScope = { type: "all" };
    setScopeState(fallbackScope);
    void saveCareScope(user.id, fallbackScope).catch(() => undefined);
  }, [careMembers, isLoading, loadedUserId, scope, user]);

  // Updates the current scope immediately and persists it for this account.
  const setScope = useCallback(
    (nextScope: CareScope) => {
      setScopeState(nextScope);

      if (user) {
        void saveCareScope(user.id, nextScope).catch(() => undefined);
      }
    },
    [user],
  );

  // Matches records that belong to one person against the active scope.
  const matchesCareMember = useCallback(
    (careMemberId: number | null) => {
      if (scope.type === "all") return true;
      if (scope.type === "self") return careMemberId === null;
      return careMemberId === scope.careMemberId;
    },
    [scope],
  );

  // Matches shareable providers against owner and family assignments.
  const matchesProvider = useCallback(
    (provider: Provider) => {
      if (scope.type === "all") return true;
      if (scope.type === "self") return provider.isForAccountOwner;

      return provider.careMembers.some(
        (member) => member.id === scope.careMemberId,
      );
    },
    [scope],
  );

  const selectedMember =
    scope.type === "member"
      ? careMembers.find((member) => member.id === scope.careMemberId)
      : null;
  const label =
    scope.type === "all"
      ? "Everyone"
      : scope.type === "self"
        ? user?.firstName || "Account owner"
        : selectedMember?.firstName ?? "Everyone";

  const value = useMemo(
    () => ({
      careMembers,
      label,
      matchesCareMember,
      matchesProvider,
      scope,
      setScope,
    }),
    [
      careMembers,
      label,
      matchesCareMember,
      matchesProvider,
      scope,
      setScope,
    ],
  );

  return (
    <CareScopeContext.Provider value={value}>
      {children}
    </CareScopeContext.Provider>
  );
}

// Gives screens and forms access to the active family scope.
export function useCareScope() {
  const context = useContext(CareScopeContext);

  if (!context) {
    throw new Error("useCareScope must be used inside CareScopeProvider.");
  }

  return context;
}
