/** DUV sends a literal "&nbsp;" (or whitespace) for empty fields. */
export function text(value: string | null | undefined) {
  return (value ?? "").replace(/&nbsp;/g, " ").trim();
}
