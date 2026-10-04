// Hands a file dropped on another screen to the import page. A module-level
// slot is enough: the file is consumed once, on the next mount of that page.
let pending: File | null = null;

export function setPendingImportFile(file: File) {
  pending = file;
}

export function takePendingImportFile(): File | null {
  const file = pending;
  pending = null;
  return file;
}
