import Toast, { type ToastType } from "@/components/common/Toast";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type ToastState = {
  visible: boolean;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

type ToastProviderProps = {
  children: ReactNode;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const initialToastState: ToastState = {
  visible: false,
  message: "",
  type: "success",
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState(initialToastState);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setToast({
        visible: true,
        message,
        type,
      });

      timeoutRef.current = setTimeout(() => {
        setToast((currentToast) => ({
          ...currentToast,
          visible: false,
        }));
      }, 2500);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        bottomOffset={110}
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
