import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMoney } from "@/lib/money/store";

/** Load this Gmail's desk once the session is known. */
export function DeskSync() {
  const { user, isPending } = useCurrentUserState();
  const load = useMoney((s) => s.load);
  const clear = useMoney((s) => s.clear);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      clear();
      return;
    }
    void load(user.id);
  }, [user?.id, isPending, load, clear]);

  return null;
}
