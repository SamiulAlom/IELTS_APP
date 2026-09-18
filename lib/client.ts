export async function request<T>(url: string, data?: unknown, method = "POST"): Promise<T> {
  const response = await fetch(url, {
    method: data === undefined ? "GET" : method,
    headers: data === undefined ? undefined : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Something went wrong. Please try again.");
  return result as T;
}

export function formatDate(value: string | Date, timeZone = "Asia/Dhaka") {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone }).format(new Date(value));
}

export function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
