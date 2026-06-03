import { IChangeSet } from "@/features/compliance/types/compliance.types.ts";

export interface CsvHeaders {
  date: string;
  system: string;
  ticket: string;
  reason: string;
  requestedBy: string;
  performedBy: string;
  change: string;
  detail: string;
  correction: string;
  yes: string;
  no: string;
}

/**
 * Builds a one-row-per-change-entry CSV (semicolon-separated, UTF-8 BOM so
 * German Excel opens it with columns) and triggers a download.
 */
export function downloadChangeSetsCsv(
  changeSets: IChangeSet[],
  headers: CsvHeaders,
  filename = "change-log.csv",
) {
  const rows: string[][] = [
    [
      headers.date,
      headers.system,
      headers.ticket,
      headers.reason,
      headers.requestedBy,
      headers.performedBy,
      headers.change,
      headers.detail,
      headers.correction,
    ],
  ];

  for (const changeSet of changeSets) {
    const date = new Date(changeSet.createdAt).toLocaleString();
    const correction = changeSet.correctsId ? headers.yes : headers.no;
    const base = [
      date,
      changeSet.targetSystem ?? "",
      changeSet.ticketRef ?? "",
      changeSet.reason,
      changeSet.requestedBy,
      changeSet.performedBy?.name ?? "",
    ];

    if (changeSet.entries.length === 0) {
      rows.push([...base, "", "", correction]);
    } else {
      for (const entry of changeSet.entries) {
        rows.push([...base, entry.summary, entry.detail ?? "", correction]);
      }
    }
  }

  const escape = (value: string) =>
    '"' + String(value ?? "").replace(/"/g, '""') + '"';
  const bom = String.fromCharCode(0xfeff);
  const csv =
    bom + rows.map((row) => row.map(escape).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
