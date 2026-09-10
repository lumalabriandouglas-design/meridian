import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMoney } from "@/lib/money/store";

/** Loads the signed-in user's desk once; clears it on sign-out. */
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
  }, [isPending, user?.id, load, clear]);

  return null;
}
