# Build Path, Practical Outcomes, and Legal/Ethical Constraints for WiFi/Bluetooth "People Behind a Wall" Sensing (as of Nov 2026)

## 1. Practical build architectures and the results people reported

### Takeaway
The best-documented hobbyist path in 2026 is ESP32 CSI firmware. Two patterns exist: one ESP32 listening to the home router (ESPectre, which plugs into ESPHome/Home Assistant/Matter), or ESP32 TX/RX pairs (wifi-ghost and similar). These reliably detect *motion*. Through-wall breathing has been shown only anecdotally at close range. Raspberry Pi/Nexmon and AX210/PicoScenes are mostly academic paths with few hobbyist outcome reports. The most viral "through-wall pose" project of 2026 (RuView / WiFi-DensePose) is widely disputed and should not be treated as evidence.

### Cited Findings
**(a) ESP32 single-node or multi-node CSI, integrated with Home Assistant (option e)**
- ESPectre (francescopace/espectre) turns one ESP32 into a Wi-Fi motion sensor. It measures CSI from the existing Wi-Fi network, processes on-device ("Nothing needs to go to the cloud"), and reports motion plus a movement score. It "does not identify people, count them, or prove a room is empty" and is not a safety-certified security or medical system. — [ESPectre GitHub README](https://github.com/francescopace/espectre)
- ESPectre hardware: supports ESP32-C6, C5, C3, S3, S2 and classic ESP32; needs a 2.4 GHz Wi-Fi 4 (802.11n) network; "One board covers one area, so plan on one board per room." — [ESPectre GitHub README](https://github.com/francescopace/espectre)
- ESPectre integrations: ESPHome (auto-discovery in Home Assistant), MQTT, and a Matter frontend that appears as a standard occupancy sensor. The README says "pairing, occupancy updates, and automations are tested with Google Home, Apple Home, and Home Assistant"; Alexa and SmartThings are not yet tested. — [ESPectre GitHub README](https://github.com/francescopace/espectre); [ESPectre HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- ESPectre licensing: first-party code is GPLv3, and eligible parts are also offered under a commercial license for closed-source firmware. The ESPHome frontend is GPLv3-only. Version 2.5 added a neural-network "ML Detector." Forks/mirrors exist, including one from Adafruit with an Arduino port for the Feather ESP32-S3 Rev. TFT. — [ESPectre README](https://github.com/francescopace/espectre); [adafruit/espectre](https://github.com/adafruit/espectre); [SourceForge mirror](https://sourceforge.net/projects/espectre.mirror/)
- Early user reports on the HA forum (Dec 2025): "It works perfectly" (ESP32-S3-N16R8, ESPHome 2025.9.3, ESP-IDF v5.4.2). Others reported "Send error: -1 (errno: 12)" warnings, which the developer blamed on memory pressure and fixed by lowering `traffic_generator_rate` to 50. A compile issue with a pinned ESP-IDF version was also reported. ESPectre requires the esp-idf framework, which can conflict with Arduino-based builds such as Bluetooth Proxy devices. ESP8266 boards (e.g., Sonoff S31) lack CSI support. — [HA Community thread, Dec 11–16 2025](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- A competing HA project, TOMMY, was reported in the same thread as "able to pick up movement before PIR in same room." Users also said it stopped working after an ESPHome update and "completely blew up" their Bluetooth proxies. — [HA Community thread, Dec 13 2025](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- Seeed Studio publishes a wiki guide for deploying ESPectre on XIAO ESP32 boards with ESPHome. A third-party tutorial (teachmemicro) also exists. These are signs of mainstream maker uptake. — [Seeed Studio wiki](https://wiki.seeedstudio.com/xiao-esp32--series-espresense/); [TeachMeMicro tutorial](https://www.teachmemicro.com/espectre-tutorial-motion-detection-using-wi-fi-signals-esp32-home-assistant/)

**(a') Two or more ESP32s in a TX/RX link across a wall**
- wifi-ghost (heyfinal/wifi-ghost) bills itself as "through-wall human presence detection via WiFi CSI." It needs at least 2 ESP32-WROOM dev boards (one TX, one RX) plus a Mac/Linux aggregator on the same Wi-Fi. For a house of about 6–8 rooms it suggests 1 central TX and 3–4 corner RX nodes, mounted "~3–7 ft off the ground," with the TX→RX line crossing the rooms to be covered. — [wifi-ghost GitHub](https://github.com/heyfinal/wifi-ghost)
- wifi-ghost results: "Caught a sleeping adult at 14–17 BPM through a sheet-rock wall during a real overnight test." Breathing (14–18 BPM) was picked up "through one interior wall" when the person was "within ~3 m" of the RX. "Walking behind the RX" is "mostly invisible." No false-positive or false-negative rates are reported, and testing was only in the maintainer's own household. — [wifi-ghost GitHub](https://github.com/heyfinal/wifi-ghost)
- wifi-ghost signal notes: with the naive amplitude-mean method, the empty-room baseline σ was "~25% of the mean" while walking produced "~13% deltas." The motion signal was smaller than idle noise, so naive averaging does not work on cheap ESP32 captures. Respiration uses a 0.15–0.5 Hz band, SNR > 3, and a 60 s window. — [wifi-ghost GitHub](https://github.com/heyfinal/wifi-ghost)
- Hardware gotchas from wifi-ghost: the ESP32-C3 SuperMini PCB antenna loses "~6–10 dB," ESP32-CAM boards died under bad chargers, and CH340 boards need upload baud 460800. — [wifi-ghost GitHub](https://github.com/heyfinal/wifi-ghost)
- Another two-ESP32 GitHub project reportedly found that CSI variance alone misses a sitting person, while adding respiration features brought detection to about 100%. Its headline numbers come from *synthetic* data, and through-wall results are only qualitative. (Seen via a search summary; the repo is likely anishshriram/esp32-csi-sensor; I did not fetch it directly.) — [esp32-csi-sensor GitHub](https://github.com/anishshriram/esp32-csi-sensor)
- Seeed/limengdu's XIAO_esp-csi repo includes a "room_presence_detection" example. Outcomes were not retrieved. — [XIAO_esp-csi room_presence_detection](https://github.com/limengdu/XIAO_esp-csi/tree/master/examples/room_presence_detection)

**(b) Raspberry Pi + Nexmon CSI**
- Nexmon CSI has been run on a Raspberry Pi 3B+ for copresence detection (Next2You, academic). Channels 1 (2.4 GHz/20 MHz) and 157 (5 GHz/80 MHz) performed best. — [Next2You, arXiv 2111.05224](https://arxiv.org/pdf/2111.05224)
- A "CSI Sniffer" paper used a Raspberry Pi with Nexmon behind an OpenWrt AP to demonstrate room occupancy and door-passage detection. — [arXiv 2204.01830](https://arxiv.org/pdf/2204.01830)
- A Kennesaw State undergraduate project (Spring 2021) tested several Raspberry Pis with Nexmon for activity-of-daily-living detection. No accuracy figures were found. — [KSU symposium](https://digitalcommons.kennesaw.edu/undergradsymposiumksu/spring2021/presentations/15)
- Tooling friction: the `picsi` installer for Nexmon CSI on Pi 3B+/4B is marked "in development, not ready for testing." Compiling Nexmon CSI on the Pi takes about an hour and downloads about 1.5 GB. — [picsi on PyPI](https://pypi.org/project/picsi/0.0.5)

**(c) Laptop/PC with Intel AX210 (+ PicoScenes)**
- KIT's BFId study used Intel AX210 receivers. CSI research generally needs special cards or firmware, and the Intel 5300 (2008) was the most common CSI card in the studies KIT reviewed. — [Max Intel, "Can Wi-Fi See You Through Walls? What's Real in 2026" (updated 23 Oct 2026)](https://maxintel.org/wifi-sensing-through-walls-2026.html)

**Viral but disputed: RuView / "WiFi-DensePose" (ruvnet), early 2026**
- RuView claims ESP32-node-based presence detection, pose estimation, and breathing/heart-rate monitoring. Its marketing lists breathing at 6–30 BPM and through-wall range of up to ~5 m, "signal-dependent." — [CNX Software, 26 Mar 2026](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/); [ruview.pro](https://ruview.pro/); [RuView GitHub](https://github.com/ruvnet/RuView)
- Critics reported a GitHub "technical audit" that found CSI parsers returning random or hardcoded data and a demo visualization that appeared simulated. Hacker News commenters alleged mock data. One outlet called the project a "scam." The claim that GitHub took the repo down is uncorroborated. — [Cybernews](https://cybernews.com/security/viral-github-project-wifi-see-through-walls/); [Hacker News](https://news.ycombinator.com/item?id=47230714); [byteiota](https://byteiota.com/wifi-densepose-hits-github-2-real-or-ai-generated-hype/); [digitalbiztalk](https://digitalbiztalk.com/article/ruview-wifi-wall-penetration-github-s-viral-scam-exposed); [agentpedia guide noting non-reproduction](https://agentpedia.codes/blog/ruview-guide)

### Inferences
- An MVP for "motion behind a wall in my own home" is essentially off-the-shelf in 2026: flash ESPectre on a ~US$5–15 ESP32-S3/C6 and add it to Home Assistant. Anything beyond motion (stationary presence, counting, pose) is not delivered by any mature hobbyist stack.
- TX/RX pairs give the builder control over geometry (the link must cross the monitored zone). This appears to be what makes through-wall breathing possible at all, but only within roughly 3 m of the receiver.
- The RuView episode shows that GitHub stars and README claims are not evidence in this field. Scoping should rely on projects that publish raw-data-backed metrics.

### Gaps
- No hobbyist write-ups with measured accuracy were found for the AX210 + PicoScenes path, or for Raspberry Pi/Nexmon presence detection outside academia.
- No source was found for phone-only RSSI/BLE approaches (d), and none evaluating whether stock iOS/Android expose enough radio data. (Search budget ran out; this needs follow-up.)
- YouTube build logs and Hackaday.io projects were not reached in this pass.

## 2. Realistic accuracy by task, and sensitivity to confounders

### Takeaway
Moving-person detection is the only task with consistently high reported numbers (ESPectre self-reports F1 of about 99% on its own recordings, with no wall condition stated). Stationary presence is the hard case: ESPectre says a still person eventually reads as "no motion," and breathing through a wall has been shown only anecdotally at about 3 m or less. Counting, room-level localization and pose degrade sharply outside lab conditions. Pets are a known false-positive source; fans and HVAC are poorly documented.

### Cited Findings
- **Binary motion (self-reported, ESPectre):** On "normal Wi-Fi signal," the High-Accuracy profile reports recall of 99.1–99.7%, precision of 99.9–100%, FP rate of 0.0–0.1%, and F1 of 99.5–99.9% across C3/C5/C6/ESP32/S3. The Lightweight profile reports F1 of 98.9–99.8%. On "weak signal," Lightweight precision drops to as low as 94.6% (C5, FP 2.9%). In operational replay, the Lightweight profile on one weak pair produced "149.11 alarms/h," while High-Accuracy produced 0 alarms/h. — [ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)
- **Caveats on those numbers (from the report itself):** 20 real paired datasets plus 9 long quiet datasets, with "no `train` recordings." The holdout "was inspected during development, so it is a regression set, not a sealed test." "Reserved environments not in `train`: none." The report does not state room, distance, wall condition, or router. — [ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)
- **Stationary person:** ESPectre's developer said (Dec 2025): "If you sit perfectly still, it will eventually report 'no motion'." A `presence_detected` entity and micro-movement analysis are listed as future work. — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- The IEEE 802.11bf overview notes that measured CSI with a stationary human is generally similar to CSI in an empty room. — [An Overview on IEEE 802.11bf, arXiv 2310.17661](https://arxiv.org/pdf/2310.17661)
- **Breathing through a wall (hobbyist):** 14–17 BPM for a sleeping adult through sheetrock in one overnight test, within about 3 m of the RX. A person can briefly fool one detection layer by holding still or holding their breath, "but not both." — [wifi-ghost](https://github.com/heyfinal/wifi-ghost)
- **One-sided motion detection (academic):** In NDSS 2020 (Zhu et al., "Et Tu Alexa"-line work), one smartphone outside 11 offices/apartments/houses detected motion with about 87% accuracy using one in-room Wi-Fi device as an "anchor," and about 99.99% with four anchors. False positives were under 3% with one anchor, and localization was at room level. — [Max Intel summary (secondary)](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- **Occupancy from passive BFI sniffing:** LeakyBeam (NDSS 2025) reports TPR 82.7% and TNR 96.7% at 20 m in real-world tests. — [NDSS paper page](https://ndss-symposium.org/ndss-paper/lend-me-your-beam-privacy-implications-of-plaintext-beamforming-feedback-in-wifi); [NDSS PDF](https://ndss-symposium.org/wp-content/uploads/2025-5-paper.pdf)
- **Identification of enrolled people:** KIT's BFId (ACM CCS 2025) reports 99.5% accuracy for 161 enrolled people using beamforming feedback and 82.4% for 170 people using CSI. One viewpoint was in a neighbouring room, with slightly lower accuracy. KIT itself says the setup "may be overestimating" what BFI can identify. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html); [Tom's Hardware](https://www.tomshardware.com/tech-industry/researchers-identify-people-through-ordinary-wi-fi-routers-with-99-percent-accuracy); [EurekAlert (KIT)](https://www.eurekalert.org/news-releases/1101595)
- **Pose:** CMU's "DensePose From WiFi" (arXiv, Dec 2022, not peer-reviewed at preprint) reported AP 43.5 in trained layouts and 27.3 in an unseen layout. No wall was tested, and performance was weaker with 3 or more people. MIT's RF-Pose (CVPR 2018) reached AP 58.1 through walls, but with a custom FMCW radio, not Wi-Fi. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html); [DensePose From WiFi, arXiv 2301.00250](https://arxiv.org/pdf/2301.00250)
- **Counting:** ESPectre explicitly does not count people. — [ESPectre README](https://github.com/francescopace/espectre)
- **Pets:** Xfinity WiFi Motion by default detects "even small amounts of movement," including small pets. Plume offers a "pet mode" (vendor claim), and Linksys Aware had pet filtering (2019). — [Max Intel citing Xfinity support pages, 30 Aug 2026](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- **Environment drift:** A user testing a related project (ESPresence) said winter air made it "a bit hard to set the threshold to a level which prevents false positives." — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)

### Inferences
- Realistic expectations for a small team: binary motion is "works well in your own home after threshold tuning." Stationary presence behind a wall is "possible within a few metres with breathing detection, fragile." Room-level localization requires multiple anchors or nodes. Counting and pose are not viable on commodity hardware outside lab settings with per-environment training.
- Every high number above comes from self-reported or controlled-lab conditions. None is an independent through-wall benchmark on hobbyist hardware.

### Gaps
- No quantified data was found on false positives from ceiling fans, HVAC airflow, curtains, or robot vacuums, or on recalibration after furniture moves.
- No independent benchmark was found for ESP32 through-wall presence with stated wall type, distance, and FP/hour.
- The arXiv paper "Attention-Enhanced Deep Learning for Device-Free Through-the-Wall Presence Detection Using Indoor WiFi Systems" (2304.13105) was found but its numbers were not retrieved. — [arXiv 2304.13105](https://arxiv.org/pdf/2304.13105)

## 3. Calibration, training, and labeled-data needs in practice

### Takeaway
Hobbyist motion detectors use a short empty-room baseline (about 10 s) and a threshold just above idle noise, with no ML training needed. ML detectors and anything beyond motion (identity, pose) need labeled per-environment data, and accuracy drops markedly in unseen layouts.

### Cited Findings
- ESPectre does a soft calibration during the first 10 seconds after boot, so the room should stay still. Tuning advice is to note the empty-room baseline score and set the threshold just above it (default threshold 1.0). The threshold is adjustable from Home Assistant without reflashing. A bug in which the threshold read "unknown" after power loss was fixed on Dec 16, 2025. — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- ESPectre's ML detector ships trained weights and an ML training guide. The training dataset covers empty rooms, static presence, and motion. — [ESPectre README](https://github.com/francescopace/espectre); [ML training guide](https://github.com/francescopace/espectre/blob/main/docs/ML_TRAINING.md)
- wifi-ghost calibration: collect 10 s of quiet operation, take the 95th percentile, and multiply by 1.10. Motion turns ON after 3 consecutive hits and OFF after 5 consecutive misses. It uses 12 chosen subcarriers (DC, pilot and guard bands excluded) and a Hampel filter (7-sample window, 5σ). — [wifi-ghost](https://github.com/heyfinal/wifi-ghost)
- Identity inference (BFId) requires each person to be enrolled first. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- CMU's WiFi pose model dropped from AP 43.5 (trained layouts) to 27.3 (unseen layout). — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)

### Inferences
- For an MVP, calibration UX is a "keep the room empty for 10 s, then tune one slider" flow. A polished product needs automatic re-baselining, which ESPectre's developer said in Dec 2025 they were still "trying to understand how to auto calibrate this at boot."
- Any feature that needs ML beyond motion implies a per-home data-collection step, or a transfer-learning strategy with an accepted accuracy hit in new layouts.

### Gaps
- No source quantified how many labeled minutes or hours per home are needed for stationary-presence or counting models, or reported transfer-learning results on hobbyist hardware.

## 4. Effort and cost: MVP vs. polished product

### Takeaway
An MVP that detects motion through a wall in your own home costs roughly tens of dollars in hardware and hours to days of setup using existing open-source firmware. A polished product is a multi-year effort. ESPectre alone shows 886 commits, and the commercial products (Comcast/Cognitive Systems) took years of development by dedicated vendors. No startup development timelines were found.

### Cited Findings
- wifi-ghost BOM items: ESP32-WROOM dev boards (minimum 2), an HLK-PM01 DIY power module "~$8/node from AliExpress," or a Shelly Plus 1PM UL "~$23/each on Amazon," and USB chargers rated ≥1 A. The DIY mains install is described as "Code/UL compliance is a gray area; you own the risk." — [wifi-ghost](https://github.com/heyfinal/wifi-ghost)
- ESPectre requires one board per room. The repo had 886 commits at the time of reading and now includes a C++ SDK plus ESPHome, Native, and Matter frontends, browser tools, and a CLI. — [ESPectre README](https://github.com/francescopace/espectre)
- On-device resource cost (host-modeled): the Lightweight profile uses about 2,008 B persistent memory and 16.30 µs/s CPU; High-Accuracy uses 5,060 B and 49.88 µs/s. — [ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)
- The Nexmon/Pi path requires an approximately 1-hour on-device compile and about 1.5 GB of downloads, and the installer was not production-ready. — [picsi on PyPI](https://pypi.org/project/picsi/0.0.5)
- Integration friction: ESP-IDF vs Arduino conflicts (Bluetooth Proxy), ESPHome version pinning issues, and memory pressure on the C3. — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- Commercial lineage: Comcast's WiFi Motion uses Cognitive Systems' proprietary technology. It launched around 2024 (dates conflict: 2024 vs 2025), and Cognitive Systems announced an elder-care product, "Caregiver Aware," in 2022. — [Wi-Fi NOW Global](https://wifinowglobal.com/news-and-blog/comcast-relaunches-xfinity-shield-with-wi-fi-motion-sensing-security-parental-controls/); [Business Wire, Nov 2022](https://www.businesswire.com/news/home/20221110005257/en)

### Inferences
- Rough scoping (inference, not sourced numbers):
  - **MVP (motion, own home, HA dashboard):** about US$10–50 hardware per room, plus days of integration using ESPectre/ESPHome.
  - **Custom TX/RX with breathing:** weeks of signal-processing work for a competent embedded developer.
  - **Polished multi-room product with a mobile app, auto-calibration, pet filtering, and false-alarm control:** a multi-person, multi-year effort, as the vendor history suggests.
- GPLv3 licensing on ESPectre means a closed-source product either buys the commercial license (eligible parts only) or rewrites the firmware.

### Gaps
- No startup or team development timelines or budgets were found. No mobile-app-specific effort data was found.

## 5. One-sided sensing: sensing a room you have no device in

### Takeaway
Yes, one-sided, passive sensing of a room you don't control is demonstrated in the research literature. It works by sniffing the target's own Wi-Fi traffic, either CSI from frames or unencrypted beamforming-feedback (BFI) packets, from outside, and it achieves usable occupancy/motion detection at up to about 20 m. It depends on the target having active Wi-Fi devices ("anchors"). It mostly yields motion or occupancy rather than stationary presence, and accuracy scales with the number of anchors. This is precisely the threat model researchers frame as enabling burglary and stalking.

### Cited Findings
- NDSS 2020 (Zhu et al.): a single outside smartphone used the victim's existing Wi-Fi devices as anchors, without network access. Motion detection was about 87% with 1 anchor and about 99.99% with 4, with FP under 3%. — [Max Intel (secondary summary)](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- LeakyBeam (NDSS 2025, Xiao et al., Zhejiang/NTU/KAIST): an attacker outside the home captures plaintext BFI. "BFI retains victim's movement information, even when transmitted through walls." Results were TPR 82.7% / TNR 96.7% at 20 m. The paper frames the threat as "burglaries or stalking" and proposes a BFI-obfuscation defense. — [NDSS paper page](https://ndss-symposium.org/ndss-paper/lend-me-your-beam-privacy-implications-of-plaintext-beamforming-feedback-in-wifi); [LeakyBeam slides](https://ruixiao24.github.io/files/leakybeam-ndss-slides.pdf)
- KIT BFId (CCS 2025): BFI can be recorded by a receiver not on the network. "it is unnecessary for the persons to carry any devices on them, nor is any specific hardware needed." One test viewpoint was in a neighbouring room. — [EurekAlert (KIT)](https://www.eurekalert.org/news-releases/1101595); [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html); [arXiv 2604.04179, BFI as attack surface](https://arxiv.org/pdf/2604.04179)
- Waterloo's Wi-Peep (MobiCom 2022) used a drone with about $20 of parts to localize Wi-Fi *devices* (not bodies) to within about 1 m. It relies on devices replying to contact attempts. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- ESPectre's developer notes that "One device can cover multiple rooms since Wi-Fi signals penetrate walls." No user confirmed this. — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- wifi-ghost: the TX→RX line must cross the monitored zone, and walking behind the RX is "mostly invisible." — [wifi-ghost](https://github.com/heyfinal/wifi-ghost)

### Inferences
- In a two-sided setup you own both ends (or the router plus a node), so geometry, channel, and traffic rate are under your control. One-sided sensing depends on the target's device count, traffic volume, and placement, none of which you control, so it is opportunistic and degrades when the target's devices are idle or absent.
- Building a one-sided "neighbor sensing" product would mean deliberately capturing third-party radio traffic about people who have not consented. That raises the legal issues in Section 6, and app-store policies would very likely bar it.

### Gaps
- No hobbyist reproductions of one-sided passive sensing (CSI or BFI) through a wall were found. Evidence is academic only.
- No data was found on one-sided detection of *stationary* people.

## 6. Legal and ethical landscape (US and EU)

### Takeaway
No US court has ruled on Wi-Fi sensing under the Fourth Amendment. Kyllo (2001), however, held that using sense-enhancing technology to learn about a home's interior is a search, and it rejected the "off-the-wall vs. through-the-wall" distinction, which strongly suggests government Wi-Fi sensing of homes would need a warrant. For private actors, the open questions are whether passive capture of others' Wi-Fi frames is "interception" under the Wiretap Act, and how state laws apply. In the EU, sensing identifiable people likely needs a GDPR legal basis and a DPIA. IEEE 802.11bf provides no protections for people being sensed who aren't participating. App stores prohibit covert-surveillance apps.

### Cited Findings
**US constitutional (government actors)**
- Kyllo v. United States, 533 U.S. 27 (2001): thermal imaging of a home is a Fourth Amendment "search" requiring a warrant. The majority rejected as "mechanical" the government's distinction between off-the-wall and through-the-wall surveillance. — [Cornell LII, Kyllo](https://www.law.cornell.edu/supremecourt/text/99-8508); [FindLaw](https://caselaw.findlaw.com/court/us-supreme-court/533/27.html); [Wikipedia](https://en.wikipedia.org/wiki/Kyllo_v._United_States)
- An attorney's commentary states, "I am not aware of controlling authority applying the Fourth Amendment to Wi-Fi sensing," and calls the Kyllo-based argument an "argument, not holding." — [Michael Benavides, attorney blog](http://www.attorneymichaelbenavides.com/your-router-can-detect-breathing-through-walls-is-that-a-search)
- Comcast's WiFi Motion terms say Comcast "may disclose information generated by your Wi-Fi Motion to third parties without further notice to you," including for law-enforcement investigations, subpoenas, and court orders. — [TechCrunch, 18 Aug 2026](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/); [The Register, 19 Aug 2026](https://www.theregister.com/security/2026/08/19/comcast-gives-its-wi-fi-motion-detector-a-security-makeover/5289572)

**US statutory (private actors): interception**
- The Wiretap Act (ECPA Title I) prohibits intentional interception, use, or disclosure of wire, oral, or electronic communications. ECPA broadened "interception" by adding "or other acquisition," so it is no longer limited to aural acquisition. Courts have struggled with "contents" vs. "record information." — [CRS R41733](https://www.congress.gov/crs-product/R41733); [Western New England Law Review](https://digitalcommons.wne.edu/cgi/viewcontent.cgi?article=1103&context=lawreview)
- The one-party consent defense does not apply where a communication is intercepted "for the purpose of committing any criminal or tortious act." — [Covington ECPA litigation paper](https://www.cov.com/-/media/files/corporate/publications/2020/06/key-issues-in-electronic-communications-privacy-act-ecpa-litigation.pdf)
- One commentary claims there is "currently no federal statute in the United States that specifically prohibits WiFi-based covert human sensing." This is unverified opinion. — [Peanut Politician Substack](https://www.peanutpolitician.com/p/your-walls-are-no-longer-walls)

**EU (GDPR)**
- MAC addresses are treated as personal data even when hashed. Article 29 Working Party guidance (as cited in a survey paper) says Wi-Fi tracking requires consent or anonymisation. — [TechGDPR](https://techgdpr.com/blog/wifi-tracking-retail-analytics-gdpr/); [Purple.ai guide](https://www.purple.ai/en-us/guides/privacy-by-design-anonymizing-wifi-data-for-gdpr-compliance); [arXiv 1909.08522](https://arxiv.org/pdf/1909.08522)
- Device-free sensing of identifiable people likely requires a GDPR legal basis and a data protection impact assessment (legal-practice commentary, not regulator guidance). — [TechGDPR](https://techgdpr.com/blog/wifi-tracking-retail-analytics-gdpr/)
- IEEE 802.11bf critique: the standard leaves sensing-signal confidentiality undefined, with "no privacy protection for non-participating individuals, no consent framework, no opt-out, and no mandatory disclosure." Its security work protects the sensing system, not the people being sensed. — [waveyhq](https://waveyhq.dev/posts/ieee-80211bf-privacy-gap/); [Pascal Piron Substack](https://pascalpiron.substack.com/p/wifi-sensing-and-the-privacy-fix)
- KIT researchers urge strong safeguards in 802.11bf after BFId. — [Physics World](https://physicsworld.com/a/is-your-wifi-spying-on-you/); [Tech Explorist](https://www.techexplorist.com/standard-wifi-identify-individuals-near-perfect-accuracy/103068/)

**App store policies**
- Google Play's stalkerware policy (effective 1 Oct 2020) requires apps that monitor other users to give notice or obtain consent and to show a persistent notification and unique icon. Such apps may not market themselves as spying or secret-surveillance tools or hide tracking behaviour. Apps designed exclusively for parental or enterprise monitoring are exempt. — [Infosecurity Magazine](https://www.infosecurity-magazine.com/news/stalkerware-banned-from-google/); [Techzine](https://www.techzine.eu/news/data/50230/google-is-banning-stalkerware-apps-in-the-play-store-with-exceptions); [Threatpost](https://threatpost.com/google-play-bans-stalkerware/159328)
- Apple's guidelines (per a third-party mirror) require explicit consent and a "clear visual and/or audible indication when recording, logging, or otherwise making a record of user activity." Guideline 5.1.2 covers data use and sharing (ATT). This was not verified against Apple's current text. — [ConductAtlas mirror](https://conductatlas.com/platform/apple/apple-app-store-review-guidelines/provision/CA-P-018883/apps-must-obtain-consent-before-recording-user-activity/); [MacRumors](https://www.macrumors.com/2021/02/01/apple-app-store-review-guidelines-tracking)

**Ethics signals from the builder community**
- wifi-ghost collected ground truth "against the maintainer's own household, with consent" and says to deploy "only in spaces you own or are authorized to monitor." It also advertises the sensor as "Hidden" with "Nothing visible from outside." — [wifi-ghost](https://github.com/heyfinal/wifi-ghost)

### Inferences
- **Kyllo's "general public use" qualifier:** Kyllo's rule was framed around technology "not in general public use." With Wi-Fi Motion now on millions of Comcast gateways, governments may argue that Wi-Fi sensing is in general use, which is a live doctrinal risk. The quoted qualifier comes from the opinion text as commonly cited; verify against the linked opinion.
- **Kyllo binds only government actors:** For a private builder, the relevant exposure is the Wiretap Act if frames are captured or decoded, state wiretap/eavesdropping and voyeurism statutes, common-law intrusion-upon-seclusion torts, and stalking laws. None of these were confirmed by sources in this pass.
- **Product rule of thumb:** A product that only senses spaces the user controls, with visible indication and consent from occupants, aligns with Google and Apple policies and GDPR consent norms. A product marketed to sense a neighbor's room would very likely be rejected by app stores and could be framed as a stalking tool.

### Gaps
- FCC rules: I found no sources on Part 15 limits for repurposed transmitters (e.g., traffic generators, modified power) or on Communications Act §705 (interception/divulgence of radio communications) as applied to CSI or BFI capture.
- No US case law was found on whether CSI or BFI (physical-layer measurements, not message content) counts as "contents" of a communication. U.S. v. Sayer was mentioned in a blog as rejecting a Kyllo argument about detecting wireless signals, but this is unverified ([CYB3RCRIM3 blog, 2012](http://cyb3rcrim3.blogspot.com/2012/06/wi-fi-curtilage-and-kyllo.html)).
- No 2024–2026 legislation or rulings specific to Wi-Fi sensing were found in the US or EU. EDPB or national DPA guidance specific to device-free Wi-Fi sensing was not found. The EU AI Act and ePrivacy implications were not researched.
- State laws (e.g., California, Illinois BIPA-style biometric issues if gait or identity is inferred) were not researched.

## 7. Legitimate use cases, markets, and how products handle consent

### Takeaway
The mainstream market in 2026 is ISP and router-based home motion sensing (Comcast Xfinity WiFi Motion, built on Cognitive Systems; Plume; earlier Linksys Aware), plus elder-care "aging in place" positioning. Products handle consent as account-holder opt-in within their own home. Privacy messaging stresses "no cameras" and "cannot identify individuals," while data-sharing terms (such as Comcast's law-enforcement disclosure clause) have drawn criticism.

### Cited Findings
- Comcast relaunched Xfinity Shield in August 2026 with WiFi Motion bundled alongside cybersecurity and parental controls. It is free and opt-in for eligible customers on XB7 and newer gateways. — [Wi-Fi NOW Global](https://wifinowglobal.com/news-and-blog/comcast-relaunches-xfinity-shield-with-wi-fi-motion-sensing-security-parental-controls/); [TechCrunch](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/)
- Comcast says the feature detects disruptions to Wi-Fi signals, does not track individuals or their precise movements, and cannot identify specific people. It offers "motion detection in their home and for a basic level of security." — [TechCrunch](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/); [TidBITS, 2 Sep 2026](https://tidbits.com/2026/09/02/comcast-turns-wi-fi-gateways-into-motion-detectors/); [Forbes, 24 Aug 2026](https://www.forbes.com/sites/paullamkin/2026/08/24/comcast-turns-xfinity-routers-into-motion-sensors/)
- Xfinity's system uses the gateway plus up to five devices. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- Cognitive Systems launched "Caregiver Aware," powered by WiFi Motion, for elder care in 2022 and urged service providers to plan care solutions. — [Business Wire, Nov 2022](https://www.businesswire.com/news/home/20221110005257/en)
- Radar (not Wi-Fi) vital-sign devices have FDA clearance: Xandar Kardian (K202464) and Neteera (K212143). Neither publishes a wall-penetration figure. — [Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)
- Open-source products position themselves as privacy-preserving: ESPectre uses "no cameras or microphones" and processes locally. — [ESPectre README](https://github.com/francescopace/espectre)
- A HA forum user explored ESPectre for an elderly-care use case. — [HA Community thread](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)
- Pentesting and intelligence framing: security firms describe Wi-Fi sensing as a surveillance technique pentesters can use. — [ProSec Networks blog](https://www.prosec-networks.com/en/blog/wifi-sensing-wie-nachrichtendienste-dich-ueberwachen-und-wie-pentester-diese-technik-nutzen)

### Inferences
- The defensible product space is in-home automation and occupancy (lights/HVAC), away-mode security, and elder-care activity monitoring, all in spaces the user controls and with household consent. "Detect people behind a wall" is legitimately framed as "detect motion in other rooms of *my* home," not "in someone else's space."
- For elder care, a Wi-Fi motion product competes with FDA-cleared radar devices on vital signs. Wi-Fi breathing detection is far less validated.

### Gaps
- No 2026 market-size figures for Wi-Fi sensing were found. Origin Wireless's 2026 status and products were not found. Search-and-rescue uses of Wi-Fi (as opposed to radar) were not found. No adoption data for elder-care Wi-Fi sensing was found; the elder-care materials found date from 2022.
