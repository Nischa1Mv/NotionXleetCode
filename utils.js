import TurndownService from 'turndown';

const turndownService = new TurndownService();

export function toSlug(title) {
    const cleanedTitle = title.replace(/^\d+\.\s*/, '');
    return cleanedTitle.toLowerCase().replace(/\s+/g, '-');
}

export function convertHtmlToMarkdown(htmlString) {
    return turndownService.turndown(htmlString);
}
