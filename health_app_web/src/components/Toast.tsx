"use client";

import { useState, useCallback, useEffect } from "react";
import { TOAST_TIMEOUT_MS, COLORS } from "@/lib/constants";

type ToastType = "success" | "error";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? COLORS.green : COLORS.red;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        background: bgColor,
        color: "#fff",
        padding: "0.75rem 1.25rem",
        borderRadius: "10px",
        fontSize: "0.9rem",
        fontWeight: 500,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 12px ${bgColor}44`,
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      {message}
    </div>
  );
}
