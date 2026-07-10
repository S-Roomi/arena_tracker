"use client";

import { LogOut, Search, Swords } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import {
  signInDemo,
  signInPlayer,
  signOutPlayer,
  type SignInState,
} from "~/app/_actions/player";
import { Button } from "~/components/ui/button";
import { DEFAULT_REGION, REGIONS } from "~/server/riot/regions";

export interface ActivePlayer {
  gameName: string;
  tagLine: string;
}

/**
 * Top bar: brand + Riot ID sign-in. When a player is active it shows who the
 * tracker is profiling and a sign-out; otherwise it shows the lookup form
 * (game name + tag + region) plus a keyless demo option.
 */
export function PlayerBar({ player }: { player: ActivePlayer | null }) {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex flex-row-reverse max-w-6xl gap-3 px-4 py-2.5">
        {player ? <ActivePlayerControls player={player} /> : <></>}
      </div>
    </header>
  );
}

function ActivePlayerControls({ player }: { player: ActivePlayer }) {
  return (
    <div className="flex items-center gap-3">
      <form action={signOutPlayer}>
        <Button type="submit" variant="outline" size="sm">
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </form>
    </div>
  );
}

