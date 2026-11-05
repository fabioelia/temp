# Academic State of the Art: Device-Free (Passive) WiFi and Bluetooth Sensing of People Through Walls (as of November 2026)

Scope note: These notes cover research results only (not commercial products). Each result is tagged by hardware class, because the class largely determines what is achievable:
- **[CUSTOM-FMCW]**: purpose-built FMCW radar with about 1.7–1.8 GHz of swept bandwidth in the 5.4–7.25 GHz range (MIT Katabi lab). This is not WiFi, even though it uses WiFi-adjacent frequencies.
- **[SDR-WiFi]**: software-defined radios (USRP and similar) that transmit or receive WiFi-like OFDM signals at 2.4/5 GHz, often with custom MIMO processing.
- **[COTS-CSI]**: commodity WiFi chips exposing Channel State Information (Intel 5300, Atheros, Broadcom via Nexmon, ESP32, Intel AX210 and similar).
- **[BLE]**: Bluetooth Low Energy radios (RSSI or Channel Sounding).
- Smartphones are rarely used as device-free WiFi sensors in the research reviewed here; see Gaps.

---

## 1. Landmark systems: what each demonstrated, with numbers

### Takeaway
The strongest through-wall results (multi-person localization at roughly 10 cm, breathing and heart rate behind a wall, full 2D skeletons through a wall) all come from MIT's **custom FMCW radios** (WiTrack, WiTrack2.0, RF-Capture, RF-Pose, Vital-Radio), not from WiFi. Systems that use actual WiFi waveforms through walls (Wi-Vi, WiSee) used **USRP software radios**, not commodity chips. Commodity-CSI work (E-eyes, WiFall, Widar3.0, DensePose-from-WiFi, Person-in-WiFi 3D) mostly demonstrates in-room or across-room sensing with heavy per-environment training. Commodity-WiFi through-wall results are largely limited to motion/presence detection and respiration.

### Cited Findings

**MIT Wi-Vi (SIGCOMM 2013) [SDR-WiFi, 2.4 GHz]**
- Hardware: three USRP N210 radios with an external shared clock acting as one MIMO system (2 transmit antennas, 1 receive antenna), 2.4 GHz ISM band, restricted to a 20 MHz WiFi channel. It deliberately avoids the ultra-wideband approach of earlier through-wall radars. — [Wi-Vi paper (Adib & Katabi, SIGCOMM 2013)](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- Technique: MIMO interference nulling cancels the wall reflection ("flash") and all static reflectors, with a 42 dB mean nulling depth and a 12 dB power boost (limited by USRP transmitter linearity). It then uses inverse synthetic aperture radar (ISAR), treating the moving human as the antenna array. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- Results: detected moving humans behind 8-inch concrete walls, 6-inch hollow walls (steel frame + sheetrock), 1.75-inch solid wood doors and tinted glass. It distinguished 0/1/2/3 **moving** people in a closed room with 100%/100%/85%/90% accuracy (80 trials, 8 subjects; thresholds trained in one conference room, tested in another). It decoded through-wall body-gesture "bits" at 100% for distances of 5 m or less, 75% at 8 m, and none beyond 9 m (SNR cut-off of 3 dB). A 4-gesture message took 8.8 s on average. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- Stated limits: it cannot detect humans behind concrete thicker than 8 inches (low USRP power, residual flash). Angular resolution depends on target motion: the person must move about 4 wavelengths (~50 cm) to form a narrow beam. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)

**MIT WiTrack (NSDI 2014) [CUSTOM-FMCW]**
- Hardware: FMCW radio sweeping 1.69 GHz of bandwidth (5.56–7.25 GHz) at 0.75 mW, with a theoretical range resolution of 8.8 cm. The paper describes this as the largest contiguous band below 10 GHz available for low-power civilian use. — [WiTrack paper (NSDI 2014)](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)
- Results: 3D localization of one person through a wall with median error of 10–13 cm in x/y and 21 cm in z. Pointing direction had a median error of 11.2° (90th percentile 37.9°). Fall detection reached 96.9% accuracy (F-measure 94.34%) over 11 users and 133 experiments. Latency was 75 ms. — [WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf); [USENIX listing](https://usenix.org/node/179792)
- Limits: tracks a single person only, and requires the person to move to obtain an initial location fix. Background subtraction removes static reflectors. — [WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)

**MIT WiTrack2.0 (NSDI 2015) [CUSTOM-FMCW]**
- Hardware: sub-milliwatt FMCW sweeping 5.46–7.25 GHz every 2.5 ms, with 5 Tx and 5 Rx directional antennas. — [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
- Results: localized up to 5 people simultaneously with median 11.7 cm in x/y. It localized up to 5 **static** people via breathing motion (median 11.2 cm) and tracked 4 moving users (median 12.1 cm in a 5 m × 7 m area). Through a 6-inch hollow steel-frame office wall, it localized up to 3 users with median error from 8.4/7.1 cm (x/y, first-detected user) to 16.1/10.5 cm (last-detected user). Detection accuracy was lower through the wall than in line-of-sight because of wall attenuation. — [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf); [USENIX NSDI'15 page](https://usenix.org/conference/nsdi15/technical-sessions/presentation/adib)
- Limits: up to 4 moving and 5 static users; range limited to ~10 m by low power; cannot identify who is who; cannot distinguish a hand from a leg. — [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)

**MIT RF-Capture (SIGGRAPH Asia 2015 / ACM TOG 34(6)) [CUSTOM-FMCW]**
- Hardware: FMCW sweeping 5.46–7.24 GHz every 2.5 ms at an average power of 70 µW, with a T-shaped 20-antenna array of 60 × 18 cm. At 5–7 GHz the human body acts as a specular reflector, so each frame sees only some body parts, and the system stitches frames together as the person walks. — [RF-Capture paper](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)
- Results: through-wall identification of 95.7% among 5 users and 88.2% among 15 users. Body-part detection was 99.13% at 3 m and 76.4% at 8 m. It traced a user's palm to within a couple of centimeters (letters written in the air). — [RF-Capture paper](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)
- Limits: assumes the subject starts by walking toward the device. — [RF-Capture paper](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)

**MIT RF-Pose (CVPR 2018) [CUSTOM-FMCW]**
- Hardware: FMCW radio "similar to" the RF-Capture radio, with horizontal and vertical antenna arrays producing two heatmaps. Depth resolution is about 10 cm and angular resolution about 15°. Transmit power is "1000 times lower than WiFi". Range is up to 40 feet (~12 m). — [RF-Pose paper (Zhao et al., CVPR 2018)](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- Training: cross-modal supervision from a co-located camera running OpenPose, using more than 50 hours of data from 50 environments with hundreds of people. — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- Results: visible scenes reached AP 62.4 (AP50 93.3, AP75 70.7) versus OpenPose AP 68.8. Through-wall scenes reached AP 58.1 (AP50 85.0, AP75 66.1), where vision "fails completely". The model was never trained on through-wall data. The through-wall test set had a maximum of 3 and an average of 1.41 people per frame. Gait-based identification among 100 people from 2-second clips exceeded 83% in both visible and through-wall settings. — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf); [project page](https://rfpose.csail.mit.edu/)
- Limits: metal structures (e.g., a metal cabinet) block the signal. The human body is opaque at these frequencies, so inter-person occlusion is a problem. People standing too close together are not resolved at the low RF resolution. Range depends on transmit power. — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)

**MIT Vital-Radio (CHI 2015) [CUSTOM-FMCW]**
- Tracked breathing and heart rate with median accuracy of about 99% (breathing median 99.3%) at up to 8 m or behind a wall. The study had 14 subjects with FDA-approved monitors as reference. Accuracy degrades when the person is walking around; the system needs a quasi-stationary subject. — [Vital-Radio paper](https://people.csail.mit.edu/fadel/papers/vitalradio-paper.pdf); [SiliconANGLE coverage](https://siliconangle.com/2015/04/23/vital-radio-will-monitor-your-heart-rate-and-breathing-through-your-wi-fi-router/) (numbers taken from abstract-level summaries; full tables not checked)

**UW WiSee (MobiCom 2013, Best Paper) [SDR-WiFi, 5 GHz]**
- Hardware: USRP-N210 with XCVR2450 daughterboards, a 10 MHz channel at 5 GHz, and 10 mW transmit power. The MIMO receiver was built from multiple USRPs on an external clock. Gestures are classified from Doppler shifts; a 0.5 m/s gesture gives about a 17 Hz Doppler shift at 5 GHz. — [WiSee paper (Pu, Gupta, Gollakota, Patel)](https://www.cs.sjtu.edu.cn/~xue-gt/wireless/Paper/Localization/Whole%20Home%20Gesture%20Recognition%20Using%20Wireless%20Signals.pdf); [UW Ubicomp lab page](https://ubicomplab.cs.washington.edu/publications/whole-home-gesture/)
- Results: 9 whole-body gestures classified with 94% average accuracy across line-of-sight, non-line-of-sight and through-the-wall scenarios (900 gestures, in a two-bedroom apartment and an office). This used a 4-antenna receiver and 2 single-antenna transmitters; accuracy dropped to 60% with one single-antenna transmitter. — [WiSee summary](https://nalinc.github.io/the-midnight-paper/papers/Whole_Home_Gesture_Recognition_Using_Wireless_Signals); [UW news](https://news.cs.washington.edu/2013/10/04/wisee-wins-mobicom-2013-best-paper-award)

**E-eyes (Stevens/Rutgers, MobiCom 2014) [COTS-CSI, Intel 5300]**
- A single AP with 3 connected devices (Intel WiFi Link 5300 NICs, 802.11n CSI amplitude), tested in two apartments over 4 months. It covered 8 walking activities between rooms and 9 in-place daily activities. The average true-positive rate was over 96% with a false-positive rate under 1%, and about 92% with a single device. Wider 802.11ac bandwidth improved accuracy. — [E-eyes paper](https://www.winlab.rutgers.edu/~yychen/papers/E-eyes%20Device-free%20Location-oriented%20Activity%20Identification%20Using%20Fine-grained%20WiFi%20Signatures%20.pdf)
- Limits (stated): designed and tested for a single occupant; requires location-activity signal profiles (training); assumes a stable environment, so moved furniture triggers profile re-calibration; tested without pets. — [E-eyes paper](https://www.winlab.rutgers.edu/~yychen/papers/E-eyes%20Device-free%20Location-oriented%20Activity%20Identification%20Using%20Fine-grained%20WiFi%20Signatures%20.pdf)

**WiFall (HKUST, 2014 conference; later IEEE TMC) [COTS-CSI]**
- The 2014 version reports 87% fall-detection precision with an 18% average false-alarm rate. — [HKUST thesis record](https://researchportal.hkust.edu.hk/en/studentTheses/wifall-device-free-fall-detection-by-wireless-networks/)
- Secondary listings of the TMC journal version report higher numbers that conflict with each other: 90% precision with 15% false alarms (one-class SVM), and 94% precision with 13% false alarms (Random Forest). — [Peeref listing](https://www.peeref.com/works/3722117) (secondary; not verified against the paper)
- Later work reports that WiFall confuses falling with sitting. — cited in the search summary of [Wi-Fi Sensing: Applications and Challenges (arXiv 1901.00715)](https://arxiv.org/pdf/1901.00715) (secondary)

**Widar3.0 (Zheng et al., MobiSys 2019) [COTS-CSI]**
- Introduced the body-coordinate velocity profile (BVP), a domain-independent feature computed from Doppler across multiple links. It reached 92.7% in-domain and 82.6–92.4% cross-domain gesture accuracy without retraining, across environments, person locations and orientations. Cross-environment accuracy was 92.4%, versus 40.2% for raw CSI and 77.8% for DFS (Doppler frequency shift) profiles. — [Widar3.0 paper](https://ct.cswu.me/papers/mobisys19_widar3_paper.pdf)
- The public dataset has 258K gesture instances totalling 8,620 minutes across 75 domains. — [IEEE DataPort Widar3.0](https://ieee-dataport.org/open-access/widar30-dataset-cross-domain-gesture-recognition-wi-fi)

**CMU "DensePose From WiFi" (Geng, Huang, De la Torre; arXiv Dec 2022) [COTS-class 3×3 WiFi]**
- Setup: 3 Tx × 3 Rx antennas, 2.4 GHz, 40 MHz, 30 subcarriers, 100 Hz CSI sampling; $30 TP-Link AC1750-class routers cited as sufficient hardware. Training used 16 layouts (lab office and classroom), 1–5 people per capture and 8 subjects. Labels were pseudo-ground-truth from image-based DensePose/Keypoint R-CNN. — [DensePose From WiFi (ar5iv)](https://ar5iv.labs.arxiv.org/html/2301.00250)
- Results: same layout reached AP 43.5 and AP@50 87.2 (dpAP-GPS 45.3). Unseen layouts dropped to AP 27.3 and AP@50 51.8. The image-based model scored AP 84.7 on the same data. There are internal inconsistencies between the text and tables (AP@75 is given as 35.6 in the text but 44.6 in Table 1). — [DensePose From WiFi (ar5iv)](https://ar5iv.labs.arxiv.org/html/2301.00250)
- **No through-wall experiment was performed.** The paper only asserts that occlusion has "little effect" on WiFi. Stated limits: performance "decreases significantly" in unseen layouts, struggles with limbs and rare poses, degrades with 3 or more concurrent people, 2D only. — [DensePose From WiFi (ar5iv)](https://ar5iv.labs.arxiv.org/html/2301.00250); [arXiv abstract](https://arxiv.org/abs/2301.00250)

**UCL passive WiFi radar (Chetty, Smith, Woodbridge; IEEE TGRS 2012; real-time follow-up IEEE TAES 2016) [SDR-WiFi passive bistatic]**
- A WiFi access point inside a building served as the illuminator of opportunity, with a 2.4 GHz passive multistatic receiver outside. The receiver obtained range and Doppler of people moving behind the wall. The system was limited by signal-to-interference ratio (direct-signal leakage) rather than SNR; CLEAN-based suppression improved SIR by about 19 dB. Measured Doppler matched bistatic theory. — [TGRS 2012 abstract record](https://search.isc.ac/inventory/49/1322199.htm); [CSO Online coverage](https://www.csoonline.com/article/2222896/stealthy-wi-fi-spy-sees-you-through-walls-thanks-to-your-wireless-router.html)
- Press reported location, speed and direction of a person through a one-foot-thick brick wall. — [Phys.org 2012](https://phys.org/news/2012-08-see-through-wall-surveillance-wifi-shown-ucl.html)
- The 2016 real-time SDR system detected large and small body movements through walls and distinguished movement types from Doppler history. — [UCL Discovery (Tan, Woodbridge, Chetty 2016)](https://discovery-pp.ucl.ac.uk/id/eprint/1540858); [Coventry portal](https://pureportal.coventry.ac.uk/en/publications/a-wireless-passive-radar-system-for-real-time-through-wall-moveme/)

**Commodity-WiFi through-wall presence and respiration [COTS-CSI]**
- FarSense (UbiComp/IMWUT 2019, Peking U/UMass) uses the CSI ratio between two antennas on one receiver to cancel phase noise. It extended respiration sensing to 8 m (more than double prior range) and is described as the first through-wall respiration sensing with commodity WiFi, with one transceiver in a different room from the target. — [FarSense (arXiv 1907.03994)](https://arxiv.org/pdf/1907.03994)
- Through-wall moving-human detection with COTS WiFi (snippet-level, not fully verified):
  - R-TTWD (2017): above 99% detection of moving human and of human absence. — [R-TTWD listing](https://bohrium.dp.tech/paper/arxiv/599c7807601a182cd2596e9e)
  - T-HuDe (2020): above 93% in most areas, as cited by TwSense. — [TwSense (Applied Sciences 2023)](https://www.mdpi.com/2076-3417/13/17/9668/htm)
  - TwSense (2023): peak 96%. — [TwSense (Applied Sciences 2023)](https://www.mdpi.com/2076-3417/13/17/9668/htm)
  - TW-See (IEEE TVT, 2018/2019) addressed through-wall activity recognition. — [dblp](https://dblp.uni-trier.de/rec/journals/tvt/WuCYXZH19.html)

**Notable 2024–2026 work**
- Person-in-WiFi 3D (CVPR 2024, XJTU) [COTS-CSI]: end-to-end multi-person 3D pose with DETR-style transformer, in a 4 m × 3.5 m area with 97K frames and 7 volunteers. Joint error was 91.7 mm (1 person), 108.1 mm (2) and 125.3 mm (3); in-room, not through-wall. — [CVPR 2024 poster page](https://cvpr.thecvf.com/virtual/2024/poster/30463); [CVF open access](https://openaccess.thecvf.com/content/CVPR2024/html/Yan_Person-in-WiFi_3D_End-to-End_Multi-Person_3D_Pose_Estimation_with_Wi-Fi_CVPR_2024_paper.html)
  - The PAMI extension reports 93.5 mm MPJPE on a different dataset (Wiception3D). — [XJTU AIRS lab page](https://airslab2020.github.io/labpages/papers/person-in-wifi-3d-unified-model-for-3d-wifi-perception/index.html)
- "Through-Wall Human Pose Estimation With WiFi" (IEEE Sensors Letters, 2025): proof-of-concept with a dual-channel Tx/Rx placed behind two orthogonal walls and camera-supervised training. Numbers, and whether the hardware is commodity or SDR, were not verified. — [ResearchGate listing](https://www.researchgate.net/publication/398060133_Through-Wall_Human_Pose_Estimation_With_WiFi)
- Foundation models for WiFi sensing:
  - "Scale What Counts, Mask What Matters" (UNSW, arXiv Nov 2025): MAE/ViT-Small (~15M params) pretrained on 1.32M CSI samples from 14 public datasets (2.4/5/6 GHz, 20–160 MHz, 4 device types). Cross-environment gains came with low absolute accuracy, for example XRF55 6.8%→19.8%, Widar3.0 33.5%→41.2%, GaitID 50.4%→66.1%, WiMANS 37.7%→47.3%. Gains were 2.2–15.7% overall and log-linear in pretraining data; ViT-Small→ViT-Base added only 0.4–0.9%. The authors call data "the current bottleneck". The paper calls this "zero-shot", but it actually fine-tunes on labeled target-task data. — [arXiv 2511.18792](https://arxiv.org/html/2511.18792)
  - AmbientFM (Zhu, Hu, ..., Beibei Wang, Chenshu Wu, K. J. Ray Liu; arXiv Feb 2026, revised Oct 2026; listed as NeurIPS 2026): 9.2M unlabeled CSI samples over 439 days from 20 commercial device types in real homes. It reports above 0.90 AUROC on all classification benchmarks across 9 downstream tasks. — [arXiv 2602.11200](https://arxiv.org/abs/2602.11200)
  - CSI-JEPA (arXiv May 2026): masked latent prediction pretraining for a frozen CSI encoder. — [arXiv 2605.14171](https://arxiv.org/pdf/2605.14171) (snippet only)
- 6 GHz multistatic CSI pose (Yin, Brambilla, Nicoli; arXiv Jun 2026): reports "reliable" pose reconstruction from 6 GHz OFDM CSI. Amplitude-only input was about as good as amplitude plus phase. No through-wall claim. — [arXiv 2606.10048](https://arxiv.org/abs/2606.10048)
- Through-wall detection from ambient WiFi packets with a custom SDR ("Bluebottle") and adaptive PCA (arXiv Sep 2026): reduces false detections; the abstract gives no quantitative results. — [arXiv 2609.12443](https://arxiv.org/abs/2609.12443)
- Further 2026 cross-environment pose papers exist (RePos, arXiv 2607.02986; physics-informed 3D pose, arXiv 2608.23995) but were seen only as search snippets. — [RePos](https://arxiv.org/pdf/2607.02986); [arXiv 2608.23995](https://arxiv.org/html/2608.23995v1)
- Popular GitHub/blog "WiFi DensePose through walls" projects (e.g., RuView) claim through-concrete, camera-level pose. No peer-reviewed validation was found. — [Pebblous blog](https://blog.pebblous.ai/project/WiFiDensePose/wifi-densepose-ruview/en/); [Peerlist article](https://peerlist.io/leonardo_zanobi/articles/wifidensepose-revolutionary-throughwall-human-tracking)

### Inferences
- Media shorthand that "MIT sees through walls with WiFi" conflates two different things. Only Wi-Vi (2013) used a WiFi-like waveform (20 MHz at 2.4 GHz, on USRPs). WiTrack, RF-Capture, RF-Pose and Vital-Radio are dedicated FMCW radars with about 85× more bandwidth than a 20 MHz WiFi channel. That bandwidth is what enables ~10 cm ranging and pose.
- The "DensePose from WiFi" paper is frequently cited as through-wall evidence, but it contains no through-wall experiment. Its own numbers show a large drop in unseen rooms (AP 43.5→27.3).
- As of late 2026, the peer-reviewed frontier for commodity hardware is in-room multi-person 3D pose at about 9–13 cm joint error with per-site training, and cross-domain robustness via foundation models. Peer-reviewed, quantified through-wall pose on commodity WiFi was not found.

### Gaps
- Exact through-wall breakdowns for WiSee (per-scenario accuracy) and Vital-Radio's per-wall results were not extracted from the full papers.
- Widar3.0's exact hardware configuration (number of links, chipset) was not verified in this pass. Widar3.0 was evaluated in-room, and through-wall performance was not found.
- No numbers were obtained for the 2025 Sensors Letters through-wall pose paper. A "CSIPose (Gu & Wu 2025)" through-wall commodity paper appeared in a reference list but could not be located.
- WiFall's exact hardware and the TMC version's numbers are only from secondary listings.

---

## 2. Underlying techniques: RSSI vs CSI vs active radar (FMCW/UWB) vs passive radar; which work through walls and why

### Takeaway
Through-wall capability depends on three things: (a) carrier frequency low enough to penetrate (sub-7 GHz), (b) suppression of the wall's own much stronger reflection or direct-path leakage, and (c) bandwidth and aperture for resolution. Active FMCW radar with ~1.7 GHz bandwidth gives ~9 cm range bins and supports localization and pose. Commodity WiFi CSI (20–160 MHz) has range resolution of metres, so it relies on Doppler and temporal variation (motion, breathing) plus learned fingerprints. RSSI is a single coarse scalar per packet and supports little beyond coarse presence and motion. Passive WiFi radar works through walls for moving targets, but is limited by interference from the direct signal.

### Cited Findings
- **RSSI vs CSI**: RSSI is the received signal strength at the receiver. CSI contains amplitude and phase across multiple antennas and subcarriers (and time-domain CSI), from which super-resolution methods (MUSIC, ESPRIT, SAGE) can extract multipath parameters such as AoA, ToF and Doppler. — [IEEE 802.11bf overview (Du et al., arXiv 2310.17661)](https://arxiv.org/pdf/2310.17661)
- **CSI availability**: most WiFi chipset vendors keep CSI access private. Historically only a few outdated 802.11n cards (Intel 5300, Atheros AR9580) exposed it, with limited flexibility. This is a motivation for 802.11bf. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- Commodity CSI tool landscape: the Linux 802.11n CSI Tool (Intel 5300) is the most widely used. Nexmon extends CSI to Broadcom chips (Raspberry Pi, some Nexus phones and Asus routers) at up to 80 MHz. ESP32-based tools provide 2×2, 64-subcarrier, 40 MHz CSI. NIC-driver tools are stable but hardware-limited, and Nexmon is poorly documented. — [Survey: commodity WiFi sensing advancements (PMC 2024)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11597943/); [Survey of commodity WiFi sensing in 10 years (arXiv 2111.07038)](https://arxiv.org/pdf/2111.07038)
- **Why the wall is the main obstacle ("flash effect")**: one-way attenuation at 2.4 GHz is about 9 dB for a hollow wall and 18 dB for concrete, and a through-wall radar must cross the wall twice (18–36 dB). The wall is also larger and more reflective than a person, so its reflection dominates. Wi-Vi needed about 42 dB of MIMO nulling to see past it. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- Earlier UWB through-wall radars (cited by Wi-Vi) needed GHz bandwidth and large arrays (e.g., an 8-foot / 2.4 m array). Some UWB systems worked only through low-attenuation walls, not solid wood or concrete. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- **FMCW resolution scales with bandwidth**: WiTrack's 1.69 GHz sweep gives 8.8 cm range resolution. Background subtraction of consecutive sweeps removes static reflectors, including walls and furniture. — [WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)
  - RF-Pose's radio achieves about 10 cm depth and 15° angular resolution. — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- **Specularity at 5–7 GHz**: the human body acts as a mirror-like reflector rather than a scatterer. A compact array therefore sees only some body parts per frame, and motion is needed to assemble a full figure. — [RF-Capture paper](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)
- **Doppler**: at 5 GHz, a 0.5 m/s gesture produces about a 17 Hz Doppler shift, and WiSee classifies gestures from Doppler patterns. — [WiSee paper](https://www.cs.sjtu.edu.cn/~xue-gt/wireless/Paper/Localization/Whole%20Home%20Gesture%20Recognition%20Using%20Wireless%20Signals.pdf)
- **Passive radar with WiFi as illuminator**: through-wall detection of moving personnel at standoff, with Doppler consistent with bistatic theory. It is SIR-limited, and CLEAN gave about 19 dB of improvement. — [TGRS 2012 record](https://search.isc.ac/inventory/49/1322199.htm)
- Ambient-packet CSI capture without controlling the transmitter: custom SDR "Bluebottle" (2026). — [arXiv 2609.12443](https://arxiv.org/abs/2609.12443)
- **Commodity CSI phase noise**: dividing CSI from two antennas on the same receiver cancels most noise and makes phase usable. Combining amplitude and phase removes "blind spots", enabling 8 m and through-wall respiration sensing. — [FarSense](https://arxiv.org/pdf/1907.03994)

### Inferences
- Range resolution ≈ c/(2B): 20 MHz → 7.5 m, 40 MHz → 3.75 m, 80 MHz → 1.9 m, 160 MHz → 0.94 m, 320 MHz (WiFi 7) → 0.47 m, versus 1.69 GHz → 8.8 cm. This is computed from first principles and agrees with WiTrack's stated 8.8 cm. Commodity WiFi therefore cannot separate a person from the wall in range the way FMCW radar can. It must rely on change over time (Doppler and variance), MIMO angle, or learned fingerprints.
- **Which actually work through walls?**
  - Custom FMCW: yes, for localization, pose, vitals and identification, within ~10–12 m and not through metal.
  - SDR WiFi with nulling (Wi-Vi) or Doppler (WiSee): yes, for moving people and gestures.
  - Passive WiFi radar: yes, for moving people, with SIR limits.
  - Commodity CSI: yes for motion/presence detection and respiration when the Tx–Rx link passes through or near the target room. Through-wall localization and pose on commodity hardware is not established in the peer-reviewed literature reviewed.
  - RSSI: only coarse presence/motion.

### Gaps
- No peer-reviewed quantitative comparison of RSSI vs CSI vs FMCW in an identical through-wall setup was found.
- UWB-radar specifics (e.g., commercial-style impulse radars such as Walabot, cited by RF-Pose) were not investigated in depth.

---

## 3. Which signal features detect which phenomena; what works for a stationary person behind a wall

### Takeaway
Motion is easy because it produces Doppler and CSI variance. Stationary people are the hard case: a still person looks like an empty room once static reflections are removed. The only reliable cue is the millimetre-scale chest motion of breathing (and the smaller heartbeat). Behind-wall detection of a stationary person has been demonstrated robustly with custom FMCW (WiTrack2.0, Vital-Radio) and for respiration with commodity WiFi (FarSense, with one transceiver in the target's room). Through-wall localization of a static person on commodity WiFi was not found.

### Cited Findings
- **Presence (moving vs stationary)**: 802.11bf literature divides presence into moving and stationary states. Features used include CSI time-variation patterns, time-reversal resonance strength (TRRS), correlation, higher-order moments and Doppler spectrum. "The key challenge of presence detection lies on the detection of a stationary human", because CSI with a stationary human is generally similar to an empty room dominated by white Gaussian noise. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- **Motion-only by design**: Wi-Vi nulls all static reflectors and tracks moving bodies, counting moving humans via spatial variance. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
  - WiTrack's frame-to-frame background subtraction removes static objects. It requires the person to move for an initial fix. — [WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)
- **Stationary via breathing**: WiTrack2.0 notes that short-window subtraction "prevents us from detecting a static person". Using a longer subtraction window to capture breathing, it localized up to 5 static people with a median of 11.2 cm. — [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
- **Vitals behind a wall**: Vital-Radio measured breathing and heart rate at about 99% median accuracy at up to 8 m or behind a wall [CUSTOM-FMCW]. It fails when the subject walks around. — [Vital-Radio paper](https://people.csail.mit.edu/fadel/papers/vitalradio-paper.pdf)
  - FarSense measured respiration through a wall with commodity WiFi [COTS-CSI]. — [FarSense](https://arxiv.org/pdf/1907.03994)
- **Counting**: Wi-Vi counted 0–3 moving people (85–100%). — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
  - WiTrack2.0 counted and localized up to 4 moving or 5 static people, with lower detection accuracy through walls. — [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
  - BLE RSSI occupancy counting gave a mean error of 0.32 persons (see section 5). — [Demrozi et al. (arXiv 2102.03351)](https://arxiv.org/pdf/2102.03351)
- **Localization**: needs time of flight (bandwidth) plus angle (antenna aperture) or multiple links. WiTrack combined FMCW ToF from several Tx–Rx pairs into ellipse intersections. — [WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf); [WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
- **Gesture/activity**: Doppler (WiSee), BVP from multi-link Doppler (Widar3.0), CSI amplitude profiles (E-eyes). — [WiSee](https://ubicomplab.cs.washington.edu/publications/whole-home-gesture/); [Widar3.0](https://ct.cswu.me/papers/mobisys19_widar3_paper.pdf); [E-eyes](https://www.winlab.rutgers.edu/~yychen/papers/E-eyes%20Device-free%20Location-oriented%20Activity%20Identification%20Using%20Fine-grained%20WiFi%20Signatures%20.pdf)
- **Pose**: FMCW horizontal/vertical heatmaps with spatio-temporal CNNs over 3.3-second windows. Pose cannot be estimated from a single RF frame because of specularity. — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
  - Commodity CSI amplitude and phase feed into DensePose-style or DETR networks. — [DensePose From WiFi](https://ar5iv.labs.arxiv.org/html/2301.00250); [Person-in-WiFi 3D](https://cvpr.thecvf.com/virtual/2024/poster/30463)
- **Identification**: RF-Capture achieved 88.2% among 15 users through a wall, and RF-Pose over 83% among 100 people from walking. Both require the person to walk. — [RF-Capture](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf); [RF-Pose](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- **802.11bf KPI targets**: presence detection range of 10–15 m, typically 10 m for a meeting room. Multi-person presence needs at least 0.5–2 m range resolution, 0.5 m/s velocity resolution and 4–6° angular resolution. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)

### Inferences
- Summary matrix for a person behind a wall, as of late 2026, by hardware class:
  - Presence of a moving person: custom FMCW yes; SDR-WiFi yes; COTS CSI yes (many papers, >90% claimed); BLE RSSI plausible but rarely tested through walls.
  - Presence of a still person: custom FMCW yes, via breathing; COTS CSI demonstrated for respiration with one device in the room (FarSense), but generally weak.
  - Breathing: custom FMCW yes; COTS CSI yes at short range.
  - Heartbeat: custom FMCW yes (Vital-Radio). COTS CSI through a wall was not established in this review.
  - Counting: custom FMCW up to 4–5 people; SDR up to 3 moving people.
  - Localization at about 10 cm: custom FMCW only.
  - Pose: custom FMCW (RF-Pose). Commodity through-wall pose is unproven in peer review.
- Heartbeat is a much smaller displacement than breathing (sub-mm vs mm). That makes it the least likely feature to survive wall attenuation on commodity hardware. This is a physics inference; no specific commodity through-wall heartbeat paper was verified.

### Gaps
- No verified quantitative study of commodity-WiFi stationary-person detection through walls (detection probability vs wall type) was found.
- Heart-rate accuracy for commodity WiFi through walls was not found.

---

## 4. Frequency-band behaviour through building materials (2.4 / 5 / 6 / 60 GHz)

### Takeaway
Attenuation rises with frequency and density. Drywall, plasterboard, wood and clear glass cost a few dB at every band up to 60 GHz. Brick and concrete cost roughly 4–25 dB at 2.4 GHz and much more at 5 GHz (up to ~45–55 dB for heavy concrete in some tables). Metal is effectively opaque: a steel door is about 43 dB at 6.75 GHz, and reinforced concrete is about 40 dB one-way at 2.4 GHz. Metal-coated (low-e) glass is about 30–34 dB at 6.75 GHz. Through-wall radar pays the loss twice (out and back). Published numbers vary widely by thickness, moisture, rebar and measurement method.

### Cited Findings
- **2.4 GHz one-way (table used by Wi-Vi)**: glass 3 dB; 1.75-inch solid wood door 6 dB; 6-inch interior hollow wall 9 dB; 18-inch concrete wall 18 dB; reinforced concrete 40 dB. — [Wi-Vi paper, Table 1](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- **2.4 vs 5 GHz (vendor planning table)**: heavy concrete 22.8 vs 44.8 dB; lime brick 4.3 vs 7.8 dB; drywall partition 5.4 vs 10.1 dB. — [iBwave blog](https://blog.ibwave.com/a-closer-look-at-attenuation-across-materials-the-2-4ghz-5ghz-bands/)
- **2.4 vs 5 GHz (practical ranges)**: 120 mm brick 8–10 vs 15–20 dB; 200 mm concrete 23–25 vs 30–55 dB. Loss depends on thickness, moisture, reinforcement, metal content and incidence angle. — [Interline](https://interline.pl/Information-and-Tips/Building-Materials-and-Wi-Fi-Signal-Loss-2.4-GHz-and-5-GHz)
- **NIST (NISTIR 6055, Stone 1997)**: lab measurements at 0.5–2 GHz and 3–8 GHz of brick, masonry block, 8 concrete mixes, glass, plywood, lumber, drywall, reinforced concrete, rebar grids and wet wood. A secondary site attributes about 55 dB for 203 mm concrete, about 15 dB for brick and near 0 dB for drywall at 5 GHz to this report. That table's formatting looks garbled, and it conflicts with the vendor figure of ~10 dB for drywall. — [NIST publication record](https://nist.gov/publications/electromagnetic-signal-attenuation-construction-materials); [eyenetworks (secondary)](https://eyenetworks.no/en/wifi-signal-loss-by-material/)
- **6.75 GHz (closest measured proxy for the 6 GHz WiFi band; NYU, Shakya, Rappaport et al., arXiv May 2024), co-pol**:
  - Cinderblock wall (22 cm): 13.4 dB
  - Low-e tinted curtain-wall glass (3 cm): 33.7 dB
  - Low-e window (2 cm): 29.7 dB
  - Clear glass: 3.6 dB
  - Birch panel: 2.4 dB
  - Wooden door (4.5 cm): 5.8 dB
  - Steel door (4.7 cm): 43.2 dB
  - Plasterboard wall (13.7 cm): 2.1 dB
  - Drywall panel: 0.6 dB
  - Whiteboard: 3.1 dB
  - Loss was lower at 6.75 GHz than at 16.95 GHz for all 10 materials. — [arXiv 2405.01362](https://arxiv.org/html/2405.01362v1)
- **2.5 vs 60 GHz**: in-building measurements found average drywall attenuation of 5.4 dB at 2.5 GHz and 6.0 dB at 60 GHz. Whiteboards and mesh glass rose more sharply at 60 GHz. — [Anderson & Rappaport, IEEE TWC 2004 (arXiv 1701.03415)](https://arxiv.org/pdf/1701.03415) (values from search summary; full table not checked)
- 802.11bf positions sub-7 GHz sensing for larger coverage, larger targets and significant movement (presence, activity recognition). DMG sensing at 60 GHz is positioned for smaller-coverage, fine-grained tasks such as heart-rate monitoring and gesture control. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- Metal blocks custom FMCW pose estimation (e.g., a metal cabinet). — [RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- Wi-Vi's MIT office walls were 6-inch hollow walls with steel frames, and it could not penetrate concrete thicker than 8 inches. — [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)

### Inferences
- For through-wall radar-style sensing, round-trip loss doubles the one-way figures. A hollow drywall wall at 2.4 GHz costs about 18 dB round trip, and 200 mm concrete at 5 GHz could cost 60–110 dB. This explains why the MIT systems were demonstrated mostly through interior hollow walls and wooden doors, and only up to ~8-inch concrete.
- 60 GHz (802.11ad/ay, 802.11bf DMG) is essentially a same-room sensing band. Thin drywall is passable, but brick, concrete, metal and low-e glass will block it. This is inferred from material trends; direct 60 GHz concrete or brick figures were not obtained in this pass.
- 6 GHz (WiFi 6E/7) behaves close to 5 GHz for light partitions. It gives wider channels (up to 320 MHz in WiFi 7, ~0.47 m range resolution) but slightly higher masonry loss than 2.4 GHz.

### Gaps
- No authoritative (e.g., ITU-R P.2040) table was retrieved for concrete or brick at 5/6/60 GHz in one consistent campaign. Figures above mix lab, vendor and secondary sources and conflict, especially drywall at 5 GHz (~0 vs ~10 dB).
- No direct measurements of 60 GHz through brick or concrete were retrieved.

---

## 5. Bluetooth: BLE RSSI device-free sensing and Bluetooth 6.0 Channel Sounding

### Takeaway
Device-free BLE sensing research is almost entirely RSSI-based. It achieves presence, occupancy and coarse counting in-room at reported accuracies of about 90–98%, generally below WiFi CSI. No through-wall BLE device-free localization or pose was found. Bluetooth 6.0 Channel Sounding (CS, announced September 2024) is a **cooperative two-device ranging** feature (Initiator ↔ Reflector) using phase-based ranging across up to 72 channels of 1 MHz, plus RTT for anti-relay security. It is not a radar. Device-free use is only at proof-of-concept stage (2025–2026). It works by treating perturbations of the measured Initiator–Reflector distance as a sensing signal, in-room, and with raw IQ often not exposed by the controller.

### Cited Findings
- **BLE RSSI device-free**: a low-cost BLE system classified room occupancy with 97.97% average accuracy across environments and counted people with a mean error of 0.32 persons (Demrozi et al., IEEE Sensors Journal 2021). — [arXiv 2102.03351](https://arxiv.org/pdf/2102.03351)
  - Iannizzotto et al. (Sensors 2023): passive detection, counting and motion tracking are possible with BLE but generally with lower accuracy than WiFi. RSSI alone has significant limitations, and the authors used deep learning for a large room with few Tx/Rx. — [PMC10007112](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10007112/)
  - Brockmann et al. (EWSN 2018) adapted RSSI presence detection to BLE. Mandatory frequency hopping makes the current channel typically inaccessible, which complicates sensing. — [U Duisburg-Essen NES](https://www.nes.uni-due.de/?p=2496)
- Prior BLE RSSI device-free results, as tabulated in a 2026 review: presence detection about 92–96%; occupancy (deep learning) about 94–97%; counting about 90%. RSSI is coarse and multipath-sensitive, so it is poorly suited to fall detection. — [Sensors 2026 BLE CS fall-detection paper (PMC13030440)](https://pmc.ncbi.nlm.nih.gov/articles/PMC13030440/)
- **CS specification facts**:
  - Bluetooth 6.0 Core was announced September 2024, adding Channel Sounding and a new LE 2M 2BT PHY for CS. — [CNX Software](https://www.cnx-software.com/2024/09/04/bluetooth-6-0-features-accurate-two-way-ranging-using-channel-sounding-latency-reduction-improved-scanning-efficiency-and-more/)
  - PBR (Initiator sends tones to Reflector, which returns them; distance is computed from phase difference across frequencies) is the primary method. RTT with cryptographically scrambled packets is a secondary, distance-bounding method against man-in-the-middle relay attacks. Typical accuracy is "+/- 50 cm up to 100 meters" (SIG wording; "centimeter-level" elsewhere). Multiple antennas help against multipath. — [Bluetooth SIG Channel Sounding paper](https://www.bluetooth.com/wp-content/uploads/2024/12/mrn-channel-sounding.pdf)
  - 79 CS channel indices at 1 MHz spacing (2402–2480 MHz); 7 are prohibited, leaving 72 usable. Mode-2 steps exchange unmodulated tones, with both sides measuring phase and amplitude. Up to 4 antenna paths are selected by an Antenna Configuration Index. Unambiguous range is c/(2Δf) ≈ 150 m at 1 MHz spacing. — [arXiv 2605.17094 (connectionless CS via PAwR)](https://arxiv.org/html/2605.17094v1); [Silicon Labs CS fundamentals](https://docs.silabs.com/rtl-lib/9.0.1/rtl-lib-channel-sounding-fundamentals) (vendor and preprint sources; Core Spec not read directly)
- **CS for device-free sensing**:
  - An ACM 2025 paper ("Exploration of Device-Free Sensing Ability Based on Bluetooth 6.0 Channel Sounding") claims the first demonstration of CS-based sensing, with accurate distance measurement and "some potential" for human activity sensing. It argues CS could be cheaper and simpler to deploy than WiFi sensing. — [ACM DL 10.1145/3714394.3754369](https://dl.acm.org/doi/10.1145/3714394.3754369) (abstract-level only; full text blocked)
  - A Sensors 2026 fall-detection feasibility study used two Nordic nRF54L15 boards about 6 m apart in a 24 m² furnished living room with partial NLOS from furniture and **no through-wall test**. The controller's PBR produced only scalar distance; raw IQ and per-tone phase were not exposed. The static baseline was 5.940 m ± 0.058 m SD. With 6 actors and 90 trials (subject-independent split), window-level results reached XGBoost F1 98.4% / accuracy 98.4% and RF F1 96.8%. The authors caveat a small dataset, a single environment, window-level evaluation (optimistic) and 2.4 GHz interference. — [PMC13030440](https://pmc.ncbi.nlm.nih.gov/articles/PMC13030440/); [MDPI Sensors 26(6):1930](https://www.mdpi.com/1424-8220/26/6/1930)

### Inferences
- CS gives a cooperative link (two Bluetooth 6.0 devices) a precise distance estimate. Device-free sensing then reads how a human perturbs that multipath-biased distance or phase. It is structurally the same bistatic link-perturbation sensing as WiFi CSI, but with less information: BLE has ~80 MHz total span (c/2B ≈ 1.9 m) with narrow per-tone measurements, and often only a scalar output from the stack. It is not monostatic radar, and a single phone cannot "see" a non-cooperating body with it.
- Through walls, BLE operates at 2.4 GHz (moderate penetration), but transmit powers are low. No peer-reviewed through-wall CS sensing result was found, so through-wall BLE device-free capability should be treated as undemonstrated beyond RSSI-level presence.

### Gaps
- Full text of the 2025 ACM CS sensing paper was inaccessible, so no numbers were obtained.
- No study of BLE device-free sensing across a wall with quantified accuracy was found.
- It is unclear which shipping CS stacks expose raw per-tone IQ to applications (the nRF stack in the 2026 study did not).

---

## 6. Key limitations: training per environment, domain shift, multiple people, LOS, Tx/Rx placement, monostatic vs bistatic

### Takeaway
The main practical limits are domain shift and per-site training for commodity CSI, multi-person interference, and geometry. Commodity WiFi sensing is inherently **bistatic**: it measures a Tx→Rx link, so to sense a room you generally need a transmitter or receiver whose link passes through or near that room, or a device on each side. MIT's FMCW systems and Wi-Vi are single-box, radar-like systems placed on one side of the wall. Passive radar needs an illuminating AP inside plus a receiver outside. 802.11bf adds standardized bistatic/multistatic sub-7 GHz procedures and monostatic options at 60 GHz.

### Cited Findings
- **Domain shift numbers**:
  - DensePose-WiFi dropped from AP 43.5 to 27.3 in unseen layouts. — [DensePose From WiFi](https://ar5iv.labs.arxiv.org/html/2301.00250)
  - Widar3.0 found raw-CSI cross-environment gesture accuracy of only 40.2%, versus 92.4% with its hand-engineered BVP. — [Widar3.0](https://ct.cswu.me/papers/mobisys19_widar3_paper.pdf)
  - Supervised cross-environment accuracy fell to 6.8% on XRF55 and 33.5% on Widar3.0. Sources of shift include room geometry, furniture and occupancy, antenna placement, bandwidth and center frequency, vendor baseband processing, and interference. Cross-environment generalization is harder than cross-subject. — [arXiv 2511.18792](https://arxiv.org/html/2511.18792)
- **Cross-device shift**: the same signal received by different COTS receivers yields different CSI, mainly from Automatic Gain Control and subcarrier nonlinearities. Cross-device HAR accuracy "drops sharply", and gain alignment recovers up to 75% of the lost accuracy (IEEE IoT Journal, May 2026). — [arXiv 2605.26836](https://arxiv.org/abs/2605.26836)
- **Per-environment training**: E-eyes needs location-activity profiles and re-calibration when furniture moves; it was single-occupant only. — [E-eyes](https://www.winlab.rutgers.edu/~yychen/papers/E-eyes%20Device-free%20Location-oriented%20Activity%20Identification%20Using%20Fine-grained%20WiFi%20Signatures%20.pdf)
  - RF-Pose needed camera supervision during training, and its identification was tested only on walking. — [RF-Pose](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
- **Multiple people**:
  - Wi-Vi confused 2 and 3 people 15% of the time. — [Wi-Vi](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
  - WiTrack2.0 was capped at 4 moving / 5 static people (3 through-wall) by residual interference in iterative cancellation. — [WiTrack2.0](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
  - RF-Pose fails when people are too close and suffers inter-person occlusion. — [RF-Pose](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)
  - Person-in-WiFi 3D error grows from 91.7 to 125.3 mm going from 1 to 3 people. — [CVPR 2024](https://cvpr.thecvf.com/virtual/2024/poster/30463)
  - DensePose-WiFi degrades with 3 or more people. — [DensePose From WiFi](https://ar5iv.labs.arxiv.org/html/2301.00250)
- **Motion requirement**: Wi-Vi requires about 50 cm of target motion for angular resolution. — [Wi-Vi](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
  - RF-Capture requires the subject to walk toward the device. — [RF-Capture](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)
  - WiTrack requires initial motion. — [WiTrack](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)
- **Range**: WiTrack2.0 reached about 10 m (low power) and RF-Pose about 40 ft. Wi-Vi's gesture decoding stopped beyond 9 m. — [WiTrack2.0](https://silhouette.csail.mit.edu/witrack2-paper.pdf); [RF-Pose](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf); [Wi-Vi](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
- **Geometry**:
  - Wi-Vi is a single device with co-located Tx and Rx facing the wall, approximated in the paper as a monostatic radar. — [Wi-Vi](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)
  - In WiTrack2.0's through-wall experiments, all antennas sat outside the room, facing one wall. — [WiTrack2.0](https://silhouette.csail.mit.edu/witrack2-paper.pdf)
  - In passive WiFi radar, the AP was inside the building and the receiver outside. — [TGRS 2012 record](https://search.isc.ac/inventory/49/1322199.htm)
  - FarSense through-wall respiration placed one transceiver in a different room from the target. — [FarSense](https://arxiv.org/pdf/1907.03994)
  - The 2025 through-wall pose letter used Tx/Rx behind two orthogonal walls. — [ResearchGate](https://www.researchgate.net/publication/398060133_Through-Wall_Human_Pose_Estimation_With_WiFi)
- **Limits of COTS for sensing**, as listed by the 802.11bf group: CSI unavailability, transmission adaptation (antenna configuration, power and AGC changes corrupt measurements), and "only single-node sensing supported". — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- **Data scarcity**: public CSI datasets are small, unevenly annotated and inconsistently preprocessed. Privacy hampers large collection. — [arXiv 2511.18792](https://arxiv.org/html/2511.18792)
- **Security research context**: adversarial robustness and CSI-biometrics attack evaluations are active 2025 topics. — [arXiv 2511.20456](https://arxiv.org/pdf/2511.20456); [arXiv 2511.11381](https://arxiv.org/pdf/2511.11381) (titles only)

### Inferences
- A one-sided, single-box commodity-WiFi through-wall imager does not exist in the literature reviewed. Commodity sensing generally needs the target inside the Tx–Rx link's sensitivity region. In practice that means at least one cooperating WiFi device (often the AP, or a device the person owns) in or near the target space, or capturing ambient packets from the target space's own AP (passive/bistatic).
- Foundation models (AmbientFM, MAE scaling) reduce but do not eliminate per-site training. Published cross-environment accuracies for fine-grained tasks remain far below in-domain (e.g., 19.8% vs 77.6% on XRF55).

### Gaps
- No systematic study was found that quantifies how accuracy degrades with wall type for commodity CSI.
- Few results exist on long-term (months) drift outside E-eyes' 4-month study.

---

## 7. IEEE 802.11bf (WLAN Sensing): what it standardizes and its status

### Takeaway
IEEE 802.11bf-2025 was **published 26 September 2025**. Approval by the IEEE SA Standards Board on 28 May 2025 is reported only by secondary sources. The amendment standardizes how WiFi devices advertise sensing capability, set up and schedule sensing measurement exchanges, and report measurements such as CSI. It covers 1–7.125 GHz (trigger-based and non-trigger-based, bistatic/multistatic) and above 45 GHz (DMG/EDMG at 60 GHz, including monostatic, bistatic, multistatic, coordinated and passive modes). It also adds "Sensing by Proxy". It defines a MAC interface for upper layers; it does not standardize the detection or AI algorithms themselves.

### Cited Findings
- Status: "IEEE 802.11bf-2025 was published on September 26, 2025". TGbf is now listed among inactive task groups. A separate positioning amendment, 802.11bk-2025 ("320 MHz Positioning"), was published September 5, 2025. — [IEEE 802.11 WG page](https://www.ieee802.org/11/)
- Approval date: 28 May 2025 per a market-research report (secondary source). A Medium article claiming 2024 approval appears wrong. — [Dataintelo (secondary)](https://dataintelo.com/report/ieee-80211bf-wifi-sensing-market)
- History: the TIG/SG phase ran September 2019–September 2020, with PAR/CSD approved September 2020 forming TGbf. Draft 0.1 came in April 2022. The 2023 overview projected publication in March 2025, and actual publication came in September 2025. — [802.11bf overview (Du et al., Oct 2023)](https://arxiv.org/pdf/2310.17661); [IEEE 802.11 WG page](https://www.ieee802.org/11/)
- Definition: WLAN sensing is "the use of wireless signals received from WLAN sensing capable STAs to determine the features (e.g., range, velocity, angular, motion, presence or proximity, and gesture) of the intended targets (e.g., object, human, and animal)". The scope is MAC modifications plus DMG/EDMG PHY changes for license-exempt bands 1–7.125 GHz and above 45 GHz, with backward compatibility and coexistence. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- Features: STAs can (1) advertise sensing capabilities, request and set up sensing transmissions, mark transmissions usable for sensing, and exchange feedback; (2) obtain measurements from requested and/or unsolicited transmissions; (3) use a MAC service interface for higher layers to request and retrieve measurements. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- Procedures:
  - Sub-7 GHz uses trigger-based (TB) measurement exchanges, with polling, NDPA sounding, trigger-frame sounding and reporting phases, plus non-TB exchanges.
  - DMG (60 GHz) supports monostatic, bistatic, multistatic, monostatic-with-coordination, bistatic-with-coordination and passive sensing.
  - Sensing by Proxy (SBP) lets a non-AP STA ask an AP to run sensing with other STAs and report back the results. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)
- The sub-7 GHz procedure supports bistatic and multistatic sensing (per an analysis of an early draft). — [NIST: IEEE 802.11bf: Enabling the Widespread Adoption of Wi-Fi Sensing](https://www.nist.gov/publications/ieee-80211bf-enabling-widespread-adoption-wi-fi-sensing)
- The overview's use-case KPIs are presence-detection coverage of 10–15 m and multi-person resolution of 0.5–2 m in range, 0.5 m/s in velocity and 4–6° in angle. It also recommends stable transmit power during measurements to keep CSI stable. — [802.11bf overview](https://arxiv.org/pdf/2310.17661)

### Inferences
- 802.11bf turns CSI access from a hack on a few old NICs into a standardized, negotiated feature with explicit measurement setup. Once chipsets implement it, this should broaden device-free sensing on commodity APs and clients. It does not change the physics: sub-7 GHz bandwidth and link geometry, so through-wall capability stays bistatic and motion/presence-oriented rather than imaging.
- "Passive" DMG sensing and SBP are relevant to privacy. A client could request sensing measurements of channels between an AP and other STAs through an AP that supports SBP. The standard presumably includes capability negotiation and AP-side control, but access-control details were not verified.

### Gaps
- The IEEE SA approval date and final standard text (e.g., the exact CSI report formats and any security/privacy provisions) were not verified from the standard itself, which is paywalled.
- No data was found on which shipping chipsets implement 802.11bf as of November 2026. That question belongs to the hardware/products researchers.
