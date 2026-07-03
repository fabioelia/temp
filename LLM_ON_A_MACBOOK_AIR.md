# Running a Frontier-Class LLM on a MacBook Air

### A cross-disciplinary research report: what actually runs today, and what neuroscience, physics, and mathematics suggest about running it *better*

*Compiled July 2026. Every non-obvious number is cited. Every technique is tagged
**SHIPPING** (usable on a laptop today), **RESEARCH-STAGE** (published and reproduced,
not yet standard), or **SPECULATIVE** (a suggestive analogy or vendor claim, unproven at
frontier scale). The creative connections in Part V are labelled as the author's synthesis,
not established results — that is the point of them.*

---

## 0. Bottom line up front

1. **The premise has a hard wall in it.** The frontier open-weight models of 2026 —
   **GLM-5.1 / GLM-5.2**, **DeepSeek V4**, **Kimi K2.6** — are **700-billion to 1.6-trillion-parameter
   Mixture-of-Experts** models. Even crushed to 2-4 bits they need **~180-400 GB of memory**.
   A MacBook Air has **16-32 GB**. That is a **10-25× gap**. No amount of clever inference makes
   GLM-5.1 *itself* run on an Air. Anyone claiming otherwise is selling something.

2. **But the honest version of the goal is very achievable.** What runs beautifully on an Air is a
   *different tier*: 4-bit dense 4B-32B models and small-active MoE models (e.g. Qwen3-30B-A3B,
   Gemma-4-26B-A4B), at **15-70 tokens/s**. The engineering question worth asking is: *how close to
   frontier quality can we get inside 32 GB?* — and that is where the cross-disciplinary ideas pay off.

3. **The single most important reframing** — and the through-line of this whole report — is that on a
   laptop **you are not FLOP-bound, you are byte-movement-bound.** A 32-bit floating-point multiply
   costs ~3.7 pJ; reading its operands from DRAM costs **~640 pJ-1.3 nJ — 100-1000× more**
   (Horowitz, ISSCC 2014). Token generation streams the weights from memory *every single token*.
   So the winning moves are the ones that **move fewer bytes**: quantization and sparsity — not the
   ones that cut arithmetic. This is exactly why the brain, which runs on ~20 W by co-locating memory
   and compute and firing sparsely, is the right muse for a fanless ~20-30 W laptop.

4. **The most beautiful "hidden discipline → real laptop win" story** already happened and most people
   missed it: **the optimal sphere packing in 8 dimensions (the E8 lattice, whose optimality was proven
   by Maryna Viazovska in 2016 — Fields-Medal-adjacent pure geometry) is now the codebook inside
   QuIP#, a 2-bit LLM quantizer.** Obscure lattice geometry is *already shipping* as the reason a 70B
   model fits in ~20 GB. Part V proposes several more connections in that spirit that have **not** yet
   been made.

---

## Part I — The models: the 2026 open-weight frontier

### GLM-5.1 (Z.ai, formerly Zhipu) — the model the request named

- **Architecture:** Mixture-of-Experts, **744B total / ~40B active per token**, 256 experts with
  top-8 routing (~5.9% of parameters active), 78 layers (first 3 dense), hidden size 6,144. Uses
  **Multi-head Latent Attention (MLA)** + sparse attention, and speculative decoding via multi-token
  prediction. **Context 202,752 tokens. License: MIT** (fully permissive, weights on Hugging Face).
  Released ~April 8, 2026.
- **Benchmarks:** **SWE-Bench Pro 58.4** (beating GPT-5.4 at 57.7 and Claude Opus 4.6 at 57.3 —
  the first open model to top that board), **AIME 2026 95.3**, **GPQA-Diamond 86.2**,
  **Humanity's Last Exam 31.0% no-tools / 52.3% with tools**.
- **There is no official small "Air" variant of GLM-5.1.** The nearest runnable relatives are older:
  **GLM-4.5-Air (106B-A12B, MIT)** and **GLM-4.6V-Flash (9B)**. Z.ai's own guidance says local
  deployment of the flagship "requires enterprise GPU hardware / multiple B200s."
- **Update:** the landscape has already moved. **GLM-5.2 shipped June 13, 2026** — same 744B/~40B-active
  family, extended to a **1M-token context**, explicitly "chasing Claude Opus 4.8." So the correct 2026
  comparison point is **Opus 4.8**, not the 4.6 in GLM-5.1's launch materials.

### The rest of the open frontier (total / active parameters)

| Model | Total | Active | MoE | Runs on a MacBook Air? |
|---|---|---|---|---|
| GLM-5.1 / 5.2 (Z.ai) | 744B | ~40B | ✔ | **No** (~180-400 GB quantized) |
| DeepSeek V4-Pro | 1.6T | 49B | ✔ | No |
| DeepSeek V4-Flash | 284B | 13B | ✔ | Only 128 GB+ Macs |
| Kimi K2.6 (Moonshot) | ~1T | 32B | ✔ | No |
| Llama 4 Maverick | 400B | 17B | ✔ | No (Mac Studio only) |
| Llama 4 Scout | 109B | 17B | ✔ | 24 GB+, very tight |
| **Qwen3-30B-A3B** | **30.5B** | **3.3B** | ✔ | **Yes (32 GB)** |
| **Gemma-4-26B-A4B** | **26B** | **3.8B** | ✔ | **Yes** |
| Qwen3 / Gemma dense 4-14B | 4-14B | — | ✗ | **Yes** |

The locally-relevant sweet spot is **small-active MoE** (Qwen3-30B-A3B activates ~10% of its parameters
and reportedly matches the older 32B-dense QwQ) and **dense 4-14B** models. These trade frontier quality
for fitting in memory — and closing that quality gap is the real prize.

### Why the MoE trick does *not* save you on a laptop

MoE saves **compute** (only ~40B of 744B parameters do arithmetic per token) but **not memory**: the
router can select *any* expert on *any* token, so all 744B parameters must be resident. Memory scales
with **total**, not active, parameters. This is the precise reason the "LLM in a flash" line of work
(Part IV) exists — it is an attempt to make memory scale with *active* parameters by streaming.

---

## Part II — The hard reality on Apple Silicon

**The binding constraint is memory bandwidth**, because token generation must stream the model's weights
from RAM once per token:

- **M4 (the base Air chip): 120 GB/s.** M5 base: 153 GB/s. M4 Pro: 273 GB/s. M4 Max: 546 GB/s.
- A 4-bit model of size *S* GB generates at most ~ (bandwidth / S) tokens/s. An 8B model at 4-bit
  (~5 GB) on a 120 GB/s Air tops out around 24-28 tok/s — and measured numbers agree.

**What fits (4-bit unless noted), rule of thumb ~0.55-0.6 GB per billion parameters + KV cache:**

| Class | Footprint | 16 GB | 24 GB | 32 GB |
|---|---|---|---|---|
| 4B dense | ~3.5 GB | ✔ | ✔ | ✔ |
| 8-9B dense | ~5-7 GB | ✔ | ✔ | ✔ |
| 14B dense | ~9.5 GB | tight | ✔ | ✔ |
| 30B-A3B MoE | ~17-18 GB | ✗ | marginal | ✔ |
| 30-32B dense | ~18-20 GB | ✗ | tight | ✔ (Q4) |
| 106B GLM-4.5-Air | ~60 GB | ✗ | ✗ | ✗ (needs 64 GB) |

**Apple's structural advantage is unified memory** (CPU and GPU share one pool — every GB holds weights,
no VRAM copy). **The Apple Neural Engine (ANE) is effectively unused for LLM decoding** — llama.cpp, MLX,
and Ollama all run on the Metal GPU; the ANE is tuned for fixed-function CoreML vision graphs and, more to
the point, autoregressive decoding is bandwidth-bound, so its TOPS rating is irrelevant. **MLX** (Apple's
Metal framework) is 20-90% faster than llama.cpp for small models but converges to the same bandwidth wall
at 27B+. **New in M5:** GPU-integrated matrix "Neural Accelerators" give up to **3.97× faster
time-to-first-token** (prompt processing *is* compute-bound), but only ~1.2× on generation (still
bandwidth-bound).

---

## Part III — The reframing that makes the rest of the report make sense

Before the biology and physics, fix the objective function. On this machine:

- **Landauer's principle** sets the thermodynamic floor: erasing one bit must dissipate ≥ *kT* ln2 ≈
  **2.8 zeptojoules** at room temperature (Landauer 1961; confirmed by Bérut et al., *Nature* 2012).
  A modern CMOS operation runs **~10⁶×** above that floor — so there is, in principle, enormous headroom.
- But the *practical* floor is data movement, not erasure. **Horowitz (ISSCC 2014):** a 32-bit float
  multiply ≈ 3.7 pJ; a 32-bit DRAM read ≈ **640 pJ-1.3 nJ**. Moving the operands costs **100-1000×**
  the arithmetic.
- **The brain's answer is ~20 W** (≈20% of resting metabolism on ≈2% of body mass; Raichle & Gusnard,
  PNAS 2002) achieved by (i) **sparse, event-driven** signaling — only ~1% of neurons active at once,
  because each spike costs ~10⁹ ATP (Attwell & Laughlin 2001; Lennie 2003); (ii) **memory co-located with
  compute**; (iii) **local learning** with no global error transport; (iv) **low-precision, stochastic**
  analog computation.

**Therefore the optimization target on a MacBook Air is not FLOPs — it is bytes × distance moved.**
Every genuinely useful technique below reduces resident bytes or avoids moving them. This single criterion
sorts the "gorgeous but useless here" ideas (neuromorphic spiking hardware, thermodynamic chips) from the
"load-bearing" ones (quantization, sparsity, streaming).

---

## Part IV — The shipping levers, and the hidden discipline inside each

These are what *actually* put a model on the Air today. The point of listing them this way is that **each
one is already a piece of physics or mathematics wearing an engineering coat** — which is the evidence that
the Part V connections are not fanciful.

### 1. Quantization — *rate-distortion theory + sphere packing* — **SHIPPING**
The single biggest enabler. 4-bit roughly quarters memory *and* bandwidth.
- **The math it secretly is:** choosing bits-per-weight for a fixed accuracy loss is exactly Shannon's
  **rate-distortion problem**; "a good model is a short code" is **Minimum Description Length**
  (Hinton & van Camp, 1993).
- **Shipping:** GPTQ (2nd-order PTQ to 3-4 bits, quantizes 175B in ~4 GPU-hours), AWQ (activation-aware,
  protects ~1% salient channels), and the actual laptop stack — **llama.cpp GGUF k-quants + importance
  matrix**. A 70B at 4-bit ≈ 35-40 GB; a 7-8B at 4-bit ≈ 4-5 GB.
- **The sphere-packing punchline (RESEARCH-STAGE → SHIPPING):** *vector* quantization beats *scalar*
  quantization by the "space-filling gain." The relevant figure of merit is the normalized second moment
  *G*(Λ): scalar ℤ gives *G* = 1/12 ≈ 0.0833; the **E8 lattice** gives **0.0717**; the **Leech lattice**
  (24-D) gives **0.0658**; the asymptotic optimum is 1/(2πe) ≈ 0.0586 — a gain of up to **~0.25 bit/dimension**.
  **QuIP#** uses the **E8 lattice codebook** for **2-bit** weight quantization; **AQLM** pushes ~2 bits with
  additive/vector quantization. E8's optimality was *proven* by **Viazovska (2016)**. This is the cleanest
  example in the whole report of obscure pure math becoming a real inference win.
- **Ternary (RESEARCH-STAGE):** **BitNet b1.58** trains weights ∈ {−1, 0, +1} (1.58 bits, multiplies → adds),
  matching FP16 quality from ~3B up and ~12× more energy-efficient — but must be trained from scratch, so it
  is a path for *future* on-device models, not a way to shrink an existing one.

### 2. Sparsity & streaming — *the brain's ~1% activity budget* — **SHIPPING / RESEARCH-STAGE**
- **MoE** (SHIPPING): active ≪ total parameters (Mixtral 8×7B: 46.7B total / 12.9B active).
- **Contextual/activation sparsity in dense models** (RESEARCH-STAGE): trained MLPs are naturally sparse
  ("Lazy Neuron" phenomenon); **Deja Vu** predicts the active heads/neurons per token for ~2× latency cut;
  **CATS** thresholds to ~50% activation sparsity for ~15% wall-clock speedup; **ReLU Strikes Back** (Apple)
  restores exploitable sparsity by swapping GeLU→ReLU.
- **The directly-MacBook one — Apple's "LLM in a flash" (RESEARCH-STAGE):** keep weights on flash, stream
  only the FFN neurons a small **low-rank predictor** says will fire, using **windowing** (reuse recently
  active neurons) and **row-column bundling** (large sequential reads). Runs models **up to ~2× DRAM**, with
  **~4-5× (CPU) / 20-25× (GPU)** speedup over naive flash loading. This is the literal engineering embodiment
  of "only pay for what fires." **PowerInfer** splits hot (GPU) vs cold (CPU) neurons for up to ~11× over
  llama.cpp.

### 3. Low rank — *intrinsic dimension & the neural manifold* — **SHIPPING (training) / RESEARCH (inference)**
- **LoRA/QLoRA** (SHIPPING) make *fine-tuning* cheap (GPT-3 175B: ~10,000× fewer trainable parameters;
  QLoRA fine-tunes 65B on one 48 GB GPU). **Important honesty note:** merged LoRA weights leave the served
  model *the same size* — LoRA is an on-device **personalization** lever, **not** an inference-compression
  lever.
- **SVD weight factorization** (RESEARCH-STAGE): SVD-LLM gives ~1.7× speedup at 40% compression, but
  degrades faster than 4-bit quantization — best as a *complement*, not a replacement.
- **Why low rank is legitimate at all:** the *intrinsic dimension* of fine-tuning is tiny (RoBERTa hits 90%
  of full performance tuning **~200 parameters**; Aghajanyan 2021), and — the biological echo — population
  activity of thousands of neurons lives on a **~10-dimensional manifold** (Gallego 2017; Churchland 2012).

### 4. KV-cache compression — *associative-memory capacity* — **SHIPPING**
Long context is often the real memory hog, and **Multi-head Latent Attention** (in DeepSeek/GLM) already
compresses the KV cache into a low-rank latent. The theoretical license: modern (dense) **Hopfield networks
are mathematically identical to transformer attention** (Ramsauer et al., 2020) with capacity **exponential
in head dimension** — so a 200K-token context sits far below capacity, i.e. the KV store is *underutilized*
and highly compressible. (Hopfield & Hinton shared the **2024 Nobel Prize in Physics** for this
associative-memory lineage.)

### 5. Speculative decoding & adaptive compute — *predict, verify the surprise* — **SHIPPING**
A cheap draft model proposes tokens; the big model verifies in one parallel pass, accepting the unsurprising
ones. **Mixture-of-Depths** lets tokens skip layers. Both are engineered cousins of the brain's
"transmit only the prediction error" strategy (Part V-N).

---

## Part V — Cross-disciplinary inspiration, and the connections worth making

Everything above is established. This part is the point of the request: **primary-discipline concepts —
most never framed for machine learning — and the bridges to on-device inference.** Biological/physical/
mathematical facts are cited to primary sources; the *bridges* labelled **[author's synthesis]** are mine,
offered as hypotheses, not results.

### A. Neuroscience & biology

**A1. Cerebellar/mushroom-body expander coding → cheaper routing.**
The cerebellar **granule cell** is the most numerous neuron in the brain (~50 billion) yet each receives only
**~4 mossy-fiber inputs** — a very-low-in-degree **expansion recoding** into a high-dimensional sparse space
(Marr 1969; Albus 1971). The fly mushroom body does the same: ~2,000 Kenyon cells each sample ~6-7 of ~50
projection neurons *at random*, which Dasgupta, Stevens & Navlakha (*Science* 2017) proved is
**locality-sensitive hashing** — "a neural algorithm for a fundamental computing problem."
> **[author's synthesis, SPECULATIVE]** Modern MoE routers are *learned and dense* (every token scored
> against every expert gate). The biology says a **fixed sparse random expander + LSH-style routing** can
> give high-capacity separation for near-zero routing cost. A MoE whose router is a frozen LSH projection
> (no learned gate matmul, no all-expert scoring) would cut routing overhead and memory — trading a little
> routing quality for a lot of cheapness. The fly already runs this algorithm on ~2,000 neurons.

**A2. Neural manifolds → compress the *hidden-state trajectory*, not just the weights.**
Thousands of neurons' activity is confined to a **~10-dimensional manifold** (Gallego 2017; Churchland 2012).
> **[author's synthesis, RESEARCH-STAGE]** MLA already compresses the KV cache to a latent. The manifold
> result says the *entire residual-stream trajectory across tokens* is low-dimensional — so one could learn a
> tiny (~tens-of-dims) state-space projection and stream/cache only the manifold coordinates, reconstructing
> full hidden states on demand. This targets the fastest-growing memory consumer on a laptop (KV at long
> context) with the strongest empirical justification in all of neuroscience.

**A3. Predictive coding / efficient coding → stream only the *change* in the active set.**
The retina transmits only the **residual** after subtracting a local prediction (Srinivasan, Laughlin & Dubs,
1982); the fly's contrast-response curve is literal **histogram equalization** of natural-scene statistics
(Laughlin 1981); Barlow's (1961) **redundancy reduction** is the founding principle. Friston's free-energy
brain propagates only **prediction error**.
> **[author's synthesis, RESEARCH-STAGE]** Apple's flash-streaming already predicts the active-neuron set per
> token, and "windowing" crudely reuses it. Combine that with predictive coding *plus* A2: because the
> active-set trajectory rides a low-dimensional manifold, a tiny predictor can forecast next-token active
> neurons and stream **only the delta** from the current set. The retina's lesson is that you never move the
> predictable part — you move the surprise. On a byte-movement-bound laptop, that is the whole game.

**A4. Sleep replay & synaptic homeostasis → an on-device "sleep" consolidation pass.**
Hippocampal **sharp-wave ripples** replay waking sequences **time-compressed ~6-7× (PFC, Euston 2007), up to
~10-20× in hippocampus**; the **Synaptic Homeostasis Hypothesis** (Tononi & Cirelli) says sleep *globally
downscales* synapses to restore efficiency and signal-to-noise. Development itself is "grow dense, then prune
~40%" (Huttenlocher).
> **[author's synthesis, RESEARCH-STAGE]** For on-device personalization: accumulate LoRA-style deltas during
> the day; overnight (charger + idle, when a fanless Air can afford it) run a low-power **consolidation pass**
> that distills the day's deltas into the base weights and re-prunes toward a sparsity target — biological
> weight decay as a scheduled background job. "Sleep-like replay reduces catastrophic forgetting" (Tadros &
> Bazhenov, *Nat. Commun.* 2022) is the existence proof; nobody ships it on a laptop yet.

**A5. Dendritic computation → fewer, richer units.**
Replicating *one* L5 pyramidal neuron at millisecond resolution needs a **5-8 layer** temporal CNN, and the
depth comes specifically from **NMDA-dependent dendritic nonlinearity** (Beniaguev, Segev & London, *Neuron*
2021). A single biological neuron is a small deep network.
> **[author's synthesis, SPECULATIVE]** If per-unit nonlinearity can be made much richer (active-dendrite
> style gating; Iyer et al. 2022), a given capability might need far fewer *units* and thus fewer resident
> weights — directly relevant when memory, not compute, is the wall. No frontier-scale demonstration exists;
> this is a genuine open bet.

**A6. Astrocytes / volume transmission → a slow, cheap global side-channel.**
Astrocytes modulate synapses on **seconds-scale**, diffuse, low-bandwidth "volume transmission" (Araque et al.
1999) — a cheap broadcast channel layered over fast spiking.
> **[author's synthesis, SPECULATIVE]** Analogous to a slow-updating global gain/context state (updated every
> N tokens, broadcast cheaply) riding atop the fast per-token path — a way to carry long-range context without
> paying full attention cost each step. Loose, but the biology is real.

*(Not on a Mac, for completeness:* spiking/neuromorphic hardware — IBM **NorthPole** reports ~25× frames/J
and ~22× lower latency vs a same-node GPU; Intel **Loihi 2 / Hala Point** ≈1.15B neurons — realizes A1-A3's
"event-driven" principle *in silicon*, but **there is no neuromorphic hardware in a MacBook**. The transferable
part is the principle, realized in software as activation sparsity.)*

### B. Physics

**B1. Renormalization group & tensor networks → a principled bound on what a layer must store.**
Ground states of local 1-D systems obey an **entanglement-entropy area law** (Hastings 2007): the information
crossing a cut scales with the *boundary*, not the volume — so physically relevant states occupy a
vanishing corner of Hilbert space and need only **bounded bond dimension**. **DMRG/MPS** (White 1992) exploit
this; **MERA** (Vidal 2007) is a literal layered coarse-graining circuit. Mehta & Schwab (2014) built an
*exact* map from variational RG to deep RBMs (though later shown non-unique).
> **[author's synthesis, RESEARCH-STAGE]** The **matrix-product-operator** compression of weight matrices
> (CompactifAI, SHIPPING, claims ~70% parameter / ~93% footprint reduction on Llama-2-7B with 2-3% accuracy
> loss after healing; Multiverse Computing) is tensor-RG applied to a layer. The area law is the *principled
> stopping criterion* — it says how small the bond dimension can go before you cross the information the layer
> genuinely carries. Realistic whole-model tensor-network compression is ~2-4× (comparable to 4-bit quant),
> so the win is in *combining* it with quantization, guided by area-law budgeting per layer.

**B2. Diffusion / flow as physical generation → a latency bet, not a memory win.**
**Diffusion language models** (LLaDA, an 8B masked-diffusion LM competitive with Llama3-8B; Mercury, >1000
tok/s on H100s) denoise many tokens in parallel.
> **Honest read:** parallel decoding helps *latency on parallel hardware*, but needs multiple full-sequence
> passes (higher FLOPs) and **breaks the KV-cache**, which hurts memory. **For a memory-bound Air, diffusion
> LMs are not currently a smaller-footprint win.** Included to be ruled *out* honestly.

**B3. Hopfield/Ising energy landscapes → attention is retrieval; KV is underused.** Covered in IV-4;
the physics content is that softmax attention *is* a one-step relaxation of a modern Hopfield energy with
exponential capacity.

**B4. Thermodynamic / probabilistic computing → the aspirational ceiling, not a laptop technique.**
p-bits and **Thermodynamic Sampling Units** (Extropic's X0/XTR-0; Normal Computing's CN101, taped out Aug
2025) sample energy-based models *by physics* rather than matmul. Headline claims of **~1,000-10,000× energy**
are, in every case, **simulation-derived, single-benchmark, system-level projections on non-transformer toy
tasks (e.g. Fashion-MNIST) running on dedicated silicon — not measured, not on LLMs, not on a laptop.**
> The correct use of this in the report is rhetorical and true: **your Air already dissipates ~10⁵-10⁶× the
> Landauer floor per operation**, so the physics headroom is enormous — but realizing it needs hardware that
> does not exist in a Mac. **SPECULATIVE. A 3-10-year watch-list item, not a lever.**

### C. Mathematics

**C1. Sphere packing → optimal vector quantization** (the QuIP#/E8 story) — the headline, in IV-1. The
extension worth flagging:
> **[author's synthesis, RESEARCH-STAGE]** E8/Leech lattice VQ is applied to *weights* today. The **KV cache**
> — the memory that grows with context and often dominates on a laptop — is still mostly scalar-quantized
> (Q8/Q4 per element). Applying **fast E8/Leech lattice decoding** (Conway-Sloane give cheap nearest-point
> algorithms) to KV entries should capture the same ~0.25 bit/dimension space-filling gain on the
> fastest-growing memory consumer. This is a concrete, buildable, under-explored idea.

**C2. Random matrix theory → a training-free, per-layer rank selector.**
Eigenvalues of a noisy sample covariance fill the **Marchenko-Pastur bulk** on [σ²(1−√γ)², σ²(1+√γ)²]; the
**BBP transition** (Baik-Ben Arous-Péché 2005) says a true signal eigenvalue detaches from the bulk *only*
above a critical threshold ∝ √γ — below it, signal is information-theoretically indistinguishable from noise.
> **[author's synthesis, RESEARCH-STAGE]** SVD/low-rank layer compression usually picks a *global* compression
> ratio by trial. RMT gives a **principled, per-layer, training-free cutoff**: keep only the singular values
> above the BBP edge (the signal "spikes"), discard the MP bulk (noise). Each layer self-selects its own rank
> from its own spectrum. The clean version is pure RMT; the ML-flavored cousin (Martin-Mahoney heavy-tailed
> self-regularization) exists, but using the BBP edge as an explicit compression knob is not standard.

**C3. Percolation thresholds → a physics-grounded pruning budget.**
A sparse random graph (Erdős-Rényi) has a **sharp giant-component transition at mean degree = 1**; below it,
the graph fragments into O(log n) pieces. The **k-core** (k ≥ 3) appears via a *discontinuous* transition
(Pittel-Spencer-Wormald 1996).
> **[author's synthesis, SPECULATIVE→RESEARCH-STAGE]** A pruned network *is* a sparse graph, and the empirical
> "cliff" where accuracy collapses under extreme pruning (and the **Lottery Ticket** phenomenon) looks like a
> **percolation transition**. That suggests allocating sparsity **per layer** so each stays *just above* its
> fragmentation threshold — a principled per-layer pruning budget instead of a uniform ratio. Percolation
> theory is exact; the mapping to a specific transformer is the open part.

**C4. Superposition & compressed sensing → why compression works, and where the floor is.**
Networks pack **more features than dimensions** into near-orthogonal directions when features are sparse
(Anthropic's *Toy Models of Superposition*, 2022) — the **Johnson-Lindenstrauss / compressed-sensing** regime,
where an s-sparse signal is recoverable from **O(s log(n/s))** measurements (Candès-Tao, Donoho 2006).
- **This explains the graceful degradation of quantization** (a little added noise ≈ a little more interference
  the nonlinearity already denoises) **and sets a floor**: Adler & Shavit (2024) prove computing m′ features in
  superposition needs **Ω(m′ log m′) parameters**, so *parameter count is a reasonable proxy for retained
  capability* — there is **no free 10× from distillation**.
- **Critical caveat the report must state:** **Sparse Autoencoders are interpretability, not compression** —
  they make representations *bigger* (Claude 3 Sonnet SAE: **34M features** to explain a few-thousand-dim
  residual stream). Citing "millions of features extracted" as evidence a model can shrink has the arrow
  backwards.

**C5. Hyperbolic geometry → hierarchy in logarithmically fewer dimensions.**
In negative curvature, volume grows exponentially with radius, matching tree branching, so hierarchies embed
with far lower distortion in far fewer dimensions: a **5-D Poincaré embedding beats a 200-D Euclidean one** on
WordNet (Nickel & Kiela 2017; the math root is Bourgain 1985 — trees embed in hyperbolic space with O(1)
distortion vs O(log n) Euclidean).
> **Honest read:** dramatic for explicitly hierarchical data, but numerically finicky (Riemannian optimization)
> and **no frontier LLM ships hyperbolic layers**. RESEARCH-STAGE/niche.

**C6. Fast structured transforms → near-linear linear algebra, and the outlier-killer that's already shipping.**
The **Fast Johnson-Lindenstrauss Transform** (Ailon-Chazelle 2006) = sparse projection ∘ **Hadamard** ∘ random
signs gives O(n log n) random projections. **FNet** replaces attention with a parameter-free FFT (~92-97% of
BERT quality, trains ~7× faster). **Monarch matrices** approximate dense matmuls in ~O(n^1.5).
- **The one already crossing into production:** **QuaRot / QuIP#** apply **randomized Hadamard rotations** to
  spread and eliminate activation outliers, enabling end-to-end **4-bit weights + activations + KV** with small
  loss. Obscure fast-transform math is *already* the reason aggressive low-bit quantization behaves.

**C7. Criticality as a compression optimum.**
Cortex shows **power-law neuronal avalanches (exponent ≈ −3/2, branching parameter ≈ 1)** — the signature of a
critical branching process (Beggs & Plenz 2003) — and criticality provably **maximizes dynamic range** per unit
of activity (Kinouchi & Copelli 2006). *(Whether cortex truly sits* at *criticality is genuinely contested —
flagged honestly.)*
> **[author's synthesis, SPECULATIVE]** Tie C3 and C7 together: pruning/quantizing toward the **percolation
> edge** pushes a network toward a critical point, where information-per-active-parameter is maximized. There
> may be an **optimal compression point that coincides with criticality** — squeeze until just before
> fragmentation, and you land where each surviving parameter carries the most information. This is the most
> speculative idea in the report and the one I'd most want to test.

---

## Part VI — A concrete recommended stack for a MacBook Air *today*

Honest, shipping-only, no speculation:

- **16 GB Air:** run a **4-bit 8-14B** dense model (Qwen3, Gemma, Llama) via **MLX** (fastest for this size)
  or **llama.cpp GGUF Q4_K_M with imatrix**. Enable **Q8 KV-cache quantization** to stretch context. Expect
  ~20-28 tok/s on 8B, ~15 tok/s on 14B. This is your realistic "good local assistant."
- **24 GB Air:** a **4-bit 30B-A3B MoE** (Qwen3) is marginal but the best quality-for-memory; or a **Q4 32B
  dense** if you accept ~10-15 tok/s. Keep imatrix + Q8 KV.
- **32 GB Air:** comfortably run **Qwen3-30B-A3B / Gemma-4-26B-A4B at 4-bit** — the closest you get to
  "smart" on this hardware — at ~30-55 tok/s thanks to the tiny active-parameter count.
- **Quantization recipe everywhere:** **Q4_K_M + importance matrix + Q8 KV cache**. Watch **QuIP#/AQLM
  (E8-lattice 2-bit)** maturing in consumer tooling — it is the near-term path to squeezing a ~32B-class model
  into an Air with real quality.
- **For personalization:** **LoRA/QLoRA** for on-device fine-tuning (not inference compression — it does not
  shrink the served model).
- **What you cannot do:** run GLM-5.1/5.2, DeepSeek V4, or Kimi K2.6 locally. They need a 128-512 GB Mac
  Studio or a server. Use them via API; use the Air's local model for private, offline, low-latency work.

---

## Part VII — Honesty ledger

| Idea | Discipline root | Status | Runs on an Air? |
|---|---|---|---|
| 4-bit GGUF/AWQ/GPTQ quantization | Rate-distortion / MDL | **SHIPPING** | **Yes — this is why it works** |
| E8/Leech lattice 2-bit (QuIP#/AQLM) | Sphere packing (Viazovska 2016) | RESEARCH→SHIPPING | Emerging; **yes soon** |
| Hadamard outlier rotation (QuaRot) | Fast JL transform | RESEARCH→SHIPPING | Yes (inside quantizers) |
| Activation sparsity + flash streaming | Brain ~1% activity budget | RESEARCH-STAGE | Yes (Apple's own work) |
| MoE (active ≪ total) | Conditional sparsity | SHIPPING | Only if total fits |
| MLA / low-rank KV | Neural manifold / intrinsic dim | SHIPPING | Yes |
| Speculative decoding | Predict, verify the surprise | SHIPPING | Yes |
| Tensor-network weight compression | RG / area law | RESEARCH-STAGE | Partly (CompactifAI) |
| RMT (BBP) per-layer rank selection | Random matrix theory | **[synthesis] RESEARCH** | Buildable, untested |
| Lattice VQ for the **KV cache** | Sphere packing | **[synthesis] RESEARCH** | Buildable, untested |
| LSH/expander MoE routing | Cerebellum / fly mushroom body | **[synthesis] SPECULATIVE** | Buildable, untested |
| Manifold trajectory compression | Neural manifolds | **[synthesis] RESEARCH** | Buildable, untested |
| Predictive-delta neuron streaming | Retinal predictive coding | **[synthesis] RESEARCH** | Buildable, untested |
| On-device "sleep" consolidation | Replay / synaptic homeostasis | **[synthesis] RESEARCH** | Buildable, untested |
| Percolation-bounded pruning | Percolation theory | **[synthesis] SPECULATIVE** | Conceptual |
| Criticality = compression optimum | Self-organized criticality | **[synthesis] SPECULATIVE** | Conceptual |
| Ternary BitNet b1.58 | Quantization | RESEARCH (train-from-scratch) | Future models only |
| Diffusion LMs | Diffusion/flow physics | RESEARCH | No memory win here |
| Hyperbolic layers | Coarse geometry (Bourgain) | RESEARCH/niche | No frontier use |
| Thermodynamic / p-bit hardware | Landauer / stat-mech | SPECULATIVE | **No hardware in a Mac** |
| Neuromorphic / spiking LLMs | Event-driven neurobiology | RESEARCH | **No hardware in a Mac** |
| SAEs as "compression" | Superposition | **Misconception** | They make models *bigger* |

**The one-sentence takeaway.** You cannot run GLM-5.1 on a MacBook Air, but you *can* run a genuinely useful
30B-class model on 32 GB today — and the frontier of *closing the quality gap inside that budget* runs
straight through pure mathematics and neuroscience: **rate-distortion and sphere packing already ship as your
quantizer; the brain's sparse, low-rank, predictive, byte-movement-minimizing playbook is the blueprint for
what ships next.**

---

## References

*Models & Apple stack.* GLM-5.1: MarkTechPost (2026-04-08); artificialanalysis.ai/models/glm-5-1. GLM-5.2:
Z.ai docs. GLM-4.5 tech report arXiv:2508.06471. DeepSeek-V3 arXiv:2412.19437. Mixtral arXiv:2401.04088.
Qwen3 (qwenlm.github.io/blog/qwen3). Apple ML "Exploring LLMs with MLX on M5" (machinelearning.apple.com).

*Quantization & structured transforms.* GPTQ arXiv:2210.17323 · AWQ arXiv:2306.00978 · BitNet b1.58
arXiv:2402.17764 · QuIP# arXiv:2402.04396 · QuaRot arXiv:2404.00456 · FNet arXiv:2105.03824 · Monarch
arXiv:2204.00595 · Ailon-Chazelle (FJLT) 2006.

*Sparsity, low-rank, pruning.* Deja Vu arXiv:2310.17157 · CATS arXiv:2404.08763 · ReLU Strikes Back
arXiv:2310.04564 · LLM in a flash arXiv:2312.11514 · PowerInfer arXiv:2312.12456 · LoRA arXiv:2106.09685 ·
QLoRA arXiv:2305.14314 · intrinsic dimension arXiv:1804.08838, arXiv:2012.13255 · SVD-LLM arXiv:2403.07378 ·
SparseGPT arXiv:2301.00774 · Wanda arXiv:2306.11695 · Lottery Ticket arXiv:1803.03635.

*Tensor networks & superposition.* Novikov "Tensorizing NNs" NeurIPS 2015 · CompactifAI arXiv:2401.14109 ·
Hastings area law arXiv:0705.2024 · Mehta-Schwab arXiv:1410.3831 · Toy Models of Superposition
transformer-circuits.pub/2022/toy_model · Scaling Monosemanticity (2024) · Adler-Shavit arXiv:2409.15318 ·
Ramsauer "Hopfield Networks is All You Need" arXiv:2008.02217.

*Physics of compute.* Landauer 1961; Bérut et al. *Nature* 2012 · Horowitz ISSCC 2014 · Extropic
arXiv:2510.23972 · Normal Computing arXiv:2312.04836 · Camsari-Datta *Nature* 573:390 (2019) · IBM PCM
(HERMES) *Nat. Electronics* 2023 · sphere packing: Viazovska (E8) arXiv:1603.04246; Cohn-Kumar-Miller-
Radchenko-Viazovska (Leech) arXiv:1603.06518; Conway-Sloane *SPLAG*.

*Random matrices, geometry, percolation, diffusion.* Marchenko-Pastur 1967 · BBP 2005 · Bourgain 1985 ·
Nickel-Kiela Poincaré embeddings arXiv:1705.08039 · Erdős-Rényi / Kesten 1980 / Pittel-Spencer-Wormald 1996 ·
LLaDA arXiv:2502.09992 · Mercury arXiv:2506.17298.

*Neuroscience.* Attwell & Laughlin *JCBFM* 2001 (doi:10.1097/00004647-200110000-00001) · Lennie *Curr. Biol.*
2003 · Raichle & Gusnard *PNAS* 2002 · Marr 1969 (doi:10.1113/jphysiol.1969.sp008820) · Albus 1971 ·
Olshausen & Field *Nature* 1996 · Dasgupta-Stevens-Navlakha *Science* 2017 · Barlow 1961 · Laughlin 1981 ·
Srinivasan-Laughlin-Dubs *Proc. R. Soc. B* 1982 · Friston *Nat. Rev. Neurosci.* 2010 · Rao & Ballard *Nat.
Neurosci.* 1999 · Beniaguev-Segev-London *Neuron* 2021 · Iyer et al. (Active Dendrites) arXiv:2201.00042 ·
Araque et al. *Trends Neurosci.* 1999 · Churchland et al. *Nature* 2012 · Gallego et al. *Neuron* 2017 ·
Hafting et al. *Nature* 2005 · Gardner et al. *Nature* 2022 · Euston et al. *Science* 2007 · Beggs & Plenz
*J. Neurosci.* 2003 · Kinouchi & Copelli *Nat. Phys.* 2006 · van den Heuvel & Sporns *J. Neurosci.* 2011 ·
Bullmore & Sporns *Nat. Rev. Neurosci.* 2012 · Tadros & Bazhenov *Nat. Commun.* 2022.

*Neuromorphic & learning rules.* IBM NorthPole *Science* 2023 · TrueNorth *Science* 2014 · Intel Loihi 2 /
Hala Point · SpikeGPT arXiv:2302.13939 · Forward-Forward arXiv:2212.13345 · Feedback alignment *Nat. Commun.*
2016 · Equilibrium Propagation arXiv:1602.05179 · Hinton distillation arXiv:1503.02531 · DistilBERT
arXiv:1910.01108.
