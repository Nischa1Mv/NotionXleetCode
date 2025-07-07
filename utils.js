export default function toSlug(title) {
    const cleanedTitle = title.replace(/^\d+\.\s*/, '');
    
    return cleanedTitle
        .toLowerCase()
        .replace(/\s+/g, '-');
}
