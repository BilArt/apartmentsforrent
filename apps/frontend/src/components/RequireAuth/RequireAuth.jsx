import { useEffect, useRef } from "react";
import { useLocation, Navigate } from "react-router-dom";

export default function RequireAuth({
  currentUser,
  authLoading,
  onRequireAuth,
  children,
  redirectTo = "/",
  fallback = null,
}) {
  const location = useLocation();
  const openedRef = useRef(false);

  const isAuthed = !authLoading && Boolean(currentUser);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthed) return;

    if (!openedRef.current) {
      openedRef.current = true;
      onRequireAuth?.();
    }
  }, [authLoading, isAuthed, onRequireAuth]);

  if (authLoading) return fallback;

  if (!isAuthed) {
    return (
      <Navigate
        to={redirectTo}
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  return children;
}
