import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist, Marcellus } from "next/font/google";

import { TooltipProvider } from "~/components/ui/tooltip";
import { TRPCReactProvider } from "~/trpc/react";
import { api } from "~/trpc/server";
import { PlayerBar } from "./_components/player-bar";

export const metadata: Metadata = {
  title: "Arena Tracker · League of Legends Arena stats",
  description:
    "Player Stats for League of Legends Arena game mode.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

// Display face for headings — a free, self-hosted stand-in for LoL's
// BeaufortforLOL (proprietary). Wired to --font-heading in globals.css.
// Marcellus ships a single 400 weight; bolder headings synthesize from it.
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading-src",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const activePlayer = await api.arena.getActivePlayer();

  return (
    <html lang="en" className={`${geist.variable} ${marcellus.variable} dark`}>
      <body>
        <TRPCReactProvider>
          <TooltipProvider delay={150}>
            <PlayerBar player={activePlayer} />
            {children}
          </TooltipProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
