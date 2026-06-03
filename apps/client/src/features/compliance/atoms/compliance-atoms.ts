import { atom } from "jotai";

export const changeLogModalAtom = atom<boolean>(false);

// Pages edited in the current session that still lack a change log entry.
// Set on the first editor keystroke, cleared once a change set is saved.
export const changeLogDirtyAtom = atom<Record<string, boolean>>({});
