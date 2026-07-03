"""aircode — a small, offline, codebase-aware coding assistant for Apple Silicon.

Design thesis (see the report in the parent repo): a *small* resident model
(e.g. a 4-bit 7B coder via Ollama) punches far above its weight when you stop
asking it to *memorize* your code and instead *externalize* the codebase into a
cheap retrieval index. The model does reasoning; the index does memory. This is
the one "device-native" inversion that needs no model training and runs on a
MacBook Air today.
"""

__version__ = "0.1.0"
