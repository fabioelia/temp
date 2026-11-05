// Where the community dataset is published (GitHub Pages) and where contributions are sent (pull requests).
// Change these three lines if the repository moves. CLEANCUT_DATA_BASE (see build.mjs) overrides DATA_BASE for local builds.
export const DATA_BASE = typeof __DATA_BASE__ === 'string' ? __DATA_BASE__ : 'https://fabioelia.github.io/temp/data/v1';
export const CONTRIBUTE_REPO = 'fabioelia/temp';
export const CONTRIBUTE_BRANCH = 'master';
