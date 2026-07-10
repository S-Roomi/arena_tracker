"use client";

import { Search } from "lucide-react";
import { useActionState } from "react";

import {
  signInDemo,
  signInPlayer,
  type SignInState,
} from "~/app/_actions/player";
import { Button } from "~/components/ui/button";
import { DEFAULT_REGION, REGIONS } from "~/server/riot/regions";

/**
 * Prominent Riot ID search for the signed-out landing page (u.gg style): one
 * wide bar holding game name + tag + region, with a Search button on the right.
 * Reuses the {@link signInPlayer} server action, so a successful search signs
 * the player in and swaps the page to their tracker.
 */
export function PlayerSearch() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signInPlayer,
    {},
  );

  return (
    <div className="w-full max-w-xl">
      <form
        action={formAction}
        className="flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <div className="border-input bg-input/30 focus-within:border-ring focus-within:ring-ring/50 flex flex-1 items-center gap-1 rounded-xl border px-3 focus-within:ring-3">
          <input
            name="gameName"
            placeholder="Game name"
            aria-label="Riot ID game name"
            autoComplete="off"
            className="placeholder:text-muted-foreground/60 h-12 min-w-0 flex-1 bg-transparent text-base outline-none"
          />
          <span className="text-muted-foreground shrink-0 text-lg">#</span>
          <input
            name="tagLine"
            placeholder="Tag"
            aria-label="Riot ID tagline"
            autoComplete="off"
            className="placeholder:text-muted-foreground/60 h-12 w-14 bg-transparent text-base outline-none"
          />
          <span className="bg-border mx-1 h-6 w-px shrink-0" aria-hidden />
          <select
            name="region"
            defaultValue={DEFAULT_REGION}
            aria-label="Region"
            className="text-muted-foreground h-12 shrink-0 bg-transparent text-sm outline-none"
          >
            {Object.entries(REGIONS).map(([value, label]) => (
              <option key={value} value={value} className="bg-background">
                {label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          className="h-12 px-6 text-base sm:w-auto"
          disabled={pending}
        >
          <Search className="size-4" />
          {pending ? "Searching…" : "Search"}
        </Button>
      </form>

      {state.error ? (
        <p className="text-destructive mt-2 text-sm">{state.error}</p>
      ) : null}

      <div className="text-muted-foreground mt-3 flex items-center justify-center gap-1 text-sm">
        <span>No Riot key?</span>
        <form action={signInDemo}>
          <button
            type="submit"
            disabled={pending}
            className="text-foreground hover:text-primary underline underline-offset-4"
          >
            Explore demo data
          </button>
        </form>
      </div>
    </div>
  );
}
