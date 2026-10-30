// Fallback addresses (`tunnel.fallback`), as the wizard and the edit page take them.

/**
 * The fallback addresses as typed (separated by commas or spaces): an address without a port gets the tunnel's,
 * an IPv6 one in brackets. `bad` is the first one that is not an address.
 */
export function fallbackList(text: string, port: string): { list: string[]; bad?: string } {
  const list: string[] = [];
  for (const item of text.split(/[\s,]+/).filter(Boolean)) {
    const withPort = /^\[[0-9a-fA-F:.]+\]:\d{1,5}$/.test(item) || /^[^:\[\]]+:\d{1,5}$/.test(item);
    const v6 = /^[0-9a-fA-F:.]+$/.test(item) && item.includes(":");
    const host = /^[A-Za-z0-9.-]+$/.test(item);
    if (withPort && +item.slice(item.lastIndexOf(":") + 1) <= 65535 && +item.slice(item.lastIndexOf(":") + 1) > 0) list.push(item);
    else if (v6) list.push(`[${item}]:${port}`);
    else if (host) list.push(`${item}:${port}`);
    else return { list, bad: item };
  }
  return { list };
}
