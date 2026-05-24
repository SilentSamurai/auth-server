export function extractFirstLinkFromEmail(email: any): string | null {
    const links: string[] = email.links || [];
    if (!links.length) return null;
    return links[0].replace(/[\]\)>]+$/g, "");
}

export function normalizeDevLink(link: string): string {
    try {
        const u = new URL(link);
        if ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.protocol === 'https:') {
            u.protocol = 'http:';
            u.port = '4200';
        }
        return u.toString();
    } catch {
        return link;
    }
}
