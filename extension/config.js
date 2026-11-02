// Build configuration. The release build (tools/build_extension.py) rewrites devBuild to false.
// devBuild: true  -> protected (DRM) video can be recorded after a per-capture sign-off in the popup
//                    (name, rights/approval reference, confirmation), saved into the capture's .json.
// devBuild: false -> DRM check always enforced; no sign-off option.
const DUB_CAPTURE_CONFIG = { devBuild: true };
