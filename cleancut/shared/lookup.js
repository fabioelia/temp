// Resolve what the community dataset knows about a title, from the published index.
// No network access here: the caller supplies the parsed index and a function that loads a title file.

import { titleKey } from './identity.js';

export const emptyIndex = () => ({ version: 1, titles: {}, canonical: {}, lists: [] });

/**
 * @param {{index: object, title: {platform, platformId, canonicalKey?}, loadTitle: (file: string) => Promise<{segments: object[]}>}} args
 * @returns {Promise<{segments: object[], borrowedFrom: object|null, profiles: object[], canonicalKey: string|null}>}
 */
export async function lookupStatic({ index, title, loadTitle }) {
  const key = titleKey(title.platform, title.platformId);
  const own = index.titles?.[key];
  const canonical = title.canonicalKey || own?.canonicalKey || null;

  let segments = [];
  let borrowedFrom = null;
  if (own) {
    segments = (await loadTitle(own.f)).segments;
  } else if (canonical) {
    // Nothing tagged on this platform: offer the same episode's tags from another platform (client applies a sync offset).
    const relatedKey = (index.canonical?.[canonical] || []).find((k) => k !== key);
    const related = relatedKey && index.titles[relatedKey];
    if (related) {
      borrowedFrom = { titleKey: relatedKey, ...related.title };
      segments = (await loadTitle(related.f)).segments;
    }
  }
  const profiles = (index.lists || []).filter((l) => (!l.titleKey && !l.canonicalKey) || l.titleKey === key || (canonical && l.canonicalKey === canonical));
  return { segments, borrowedFrom, profiles, canonicalKey: canonical };
}
