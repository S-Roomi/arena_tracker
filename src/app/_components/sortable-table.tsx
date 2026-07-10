"use client";

import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { TableHead } from "~/components/ui/table";
import { cn } from "~/lib/utils";

export type SortDir = "asc" | "desc";

export interface SortColumn<K extends string> {
  key: K;
  label: string;
  /** Direction applied the first time this column is selected. */
  defaultDir: SortDir;
  align?: "left" | "right";
}

/**
 * Client-side sorting for a small in-memory list. Clicking a new column sorts
 * by its `defaultDir`; clicking the active column toggles direction.
 */
export function useSort<T, K extends string>(
  rows: T[],
  initial: { key: K; dir: SortDir },
  getValue: (row: T, key: K) => number | string,
) {
  const [sort, setSort] = useState(initial);

  const dir = sort.dir === "asc" ? 1 : -1;
  const sorted = [...rows].sort((a, b) => {
    const av = getValue(a, sort.key);
    const bv = getValue(b, sort.key);
    if (typeof av === "string" && typeof bv === "string") {
      return av.localeCompare(bv) * dir;
    }
    return (Number(av) - Number(bv)) * dir;
  });

  const toggle = (col: SortColumn<K>) =>
    setSort((s) =>
      s.key === col.key
        ? { key: col.key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key: col.key, dir: col.defaultDir },
    );

  return { sorted, sort, toggle };
}

/** A clickable, sortable column header. */
export function SortHead<K extends string>({
  column,
  active,
  dir,
  onSort,
  className,
}: {
  column: SortColumn<K>;
  active: boolean;
  dir: SortDir;
  onSort: (col: SortColumn<K>) => void;
  className?: string;
}) {
  const Icon = !active ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <TableHead
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "font-heading tracking-wide",
        column.align === "right" && "text-right",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 select-none transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {column.label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  );
}
