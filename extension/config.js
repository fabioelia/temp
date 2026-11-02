// Build configuration. The release build (tools/build_extension.py) rewrites devBuild to false.
// devBuild: true  -> popup shows "Allow protected video on sites that opt in" (developer testing only;
//                    protected video still requires the site's /.well-known/dub-studio-capture.json opt-in).
// devBuild: false -> DRM check always enforced; the setting is hidden and ignored.
const DUB_CAPTURE_CONFIG = { devBuild: true };
