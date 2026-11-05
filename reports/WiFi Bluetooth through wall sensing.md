# Routers Sense Motion Through Walls; Phones Can't

Radio signals can detect people behind walls. The best-known results, though, did not come from WiFi or Bluetooth. Ten-centimetre localization, breathing and heart rate, and full-body skeletons through drywall all came from MIT's purpose-built FMCW radars, which sweep about 1.7 GHz of bandwidth. Ordinary WiFi chips that expose Channel State Information (CSI) reliably detect a *moving* person through interior walls. At close range they can also pick up a sleeping person's breathing. Both work only when a transmitter-to-receiver link passes through the space being watched. Locating, counting or imaging people through walls with commodity WiFi has not been shown in peer-reviewed work, and Bluetooth has no through-wall result at all. To do any of this you need CSI-capable hardware: an ESP32 board, a Raspberry Pi with Nexmon firmware, or an Intel AX210 card running PicoScenes. Neither Android nor iOS gives apps CSI, and a stock iPhone cannot even read WiFi signal strength. Products do exist, but they are not what people picture. Comcast, Plume, Cognitive Systems and WiZ turn routers, mesh pods and smart bulbs into motion detectors that work across interior walls; Comcast warns that neighbours on shared walls can set off false alerts. The open-source ESPectre project does the same with ESP32 boards that cost about $10. Every phone app that claims to see through walls is a prank simulator. A motion sensor for your own home is a cheap project that takes days. Breathing-based presence detection takes weeks of signal-processing work and stays fragile. A polished product takes years. Sensing a space you do not control has been shown in research, by sniffing the target's own WiFi traffic from up to 20 m away. That is exactly the burglary and stalking scenario researchers warn about. It runs into wiretap law, GDPR and app-store bans, and if a government did it, it would count as a search under *Kyllo v. United States*.

## The famous through-wall results came from radar, not WiFi

The popular claim that "MIT sees through walls with WiFi" mixes up two different technologies. Only one landmark system, **Wi-Vi (SIGCOMM 2013), used a WiFi-like signal**. It ran three USRP N210 software radios on a shared clock, limited to a 20 MHz channel at 2.4 GHz. A wall reflects far more signal than the person behind it, so Wi-Vi used MIMO interference nulling, with a **mean nulling depth of 42 dB**, to cancel that reflection (the "flash"). With it, Wi-Vi detected moving people behind 8-inch concrete, hollow steel-frame walls and solid wood doors. In a closed room it counted 0, 1, 2 or 3 moving people with 100%, 100%, 85% and 90% accuracy. It could not see through concrete thicker than 8 inches, and the target had to move about 50 cm before it could form a beam ([Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf)).

Every later system from that lab was a purpose-built FMCW radar sweeping about 1.7 GHz between 5.46 and 7.25 GHz:

- **WiTrack** located one person through a wall with a **median error of 10–13 cm** and detected falls with 96.9% accuracy ([WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)).
- **WiTrack2.0** located up to five people, including five *still* people found through their breathing. Through a 6-inch office wall it located three users with a median error of 7–16 cm ([WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)).
- **RF-Capture** identified people through a wall with 88.2% accuracy among 15 users ([RF-Capture paper](https://people.csail.mit.edu/hongzi/content/publications/RFcapture-TOG.pdf)).
- **Vital-Radio** tracked breathing and heart rate with about 99% median accuracy at up to 8 m or behind a wall ([Vital-Radio paper](https://people.csail.mit.edu/fadel/papers/vitalradio-paper.pdf)).
- **RF-Pose** produced 2D skeletons through walls at **AP 58.1, against 62.4 with no wall**. It was trained on more than 50 hours of camera-labelled data from 50 environments and never saw through-wall training data ([RF-Pose paper](https://courses.grainger.illinois.edu/cs598wsi/fa2023/Papers%5CRFPose_CVPR2018.pdf)).

The radar wins because of simple arithmetic. Range resolution is roughly the speed of light divided by twice the bandwidth (c/2B). A 20 MHz WiFi channel can therefore only separate objects 7.5 m apart in distance, a 160 MHz channel 0.94 m, and even WiFi 7's 320 MHz only 0.47 m. WiTrack's 1.69 GHz sweep gives the **8.8 cm** its authors report ([WiTrack paper](https://courses.grainger.illinois.edu/CS598WSI/fa2024/Papers%5CWiTrack_NSDI14.pdf)). Commodity WiFi cannot tell a body from the wall by distance. It has to infer people from how the signal *changes over time* (Doppler shifts, variance, the rhythm of breathing) or from learned fingerprints.

Walls also weaken every reflected signal twice, once going in and once coming back. Reported one-way losses:

| Material | Frequency | One-way loss | Source |
|---|---|---|---|
| Glass | 2.4 GHz | 3 dB | [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf) |
| Hollow interior wall | 2.4 GHz | 9 dB | [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf) |
| 18-inch concrete | 2.4 GHz | 18 dB | [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf) |
| Reinforced concrete | 2.4 GHz | 40 dB | [Wi-Vi paper](https://www.mit.edu/~fadel/papers/wivi-paper.pdf) |
| Heavy concrete | 2.4 GHz / 5 GHz | 22.8 dB / 44.8 dB | [iBwave](https://blog.ibwave.com/a-closer-look-at-attenuation-across-materials-the-2-4ghz-5ghz-bands/) |
| Plasterboard wall | 6.75 GHz | 2.1 dB | [NYU, arXiv 2405.01362](https://arxiv.org/html/2405.01362v1) |
| Low-e (metal-coated) window | 6.75 GHz | 29.7 dB | [NYU, arXiv 2405.01362](https://arxiv.org/html/2405.01362v1) |
| Steel door | 6.75 GHz | 43.2 dB | [NYU, arXiv 2405.01362](https://arxiv.org/html/2405.01362v1) |

The 6.75 GHz figures are the closest measured stand-in for WiFi 6E. Drywall is nearly transparent to radio. Metal, foil-backed insulation and coated glass block it almost as well as they block light. Published figures vary widely with thickness, moisture and steel reinforcement (rebar), and sources disagree about drywall at 5 GHz: some give close to 0 dB, others about 10 dB.

Two other through-wall systems used real WiFi signals, but still on software radios. University of Washington's **WiSee** recognised nine whole-body gestures with **94% average accuracy across line-of-sight, non-line-of-sight and through-wall settings**, using Doppler shifts at 5 GHz. It needed a 4-antenna USRP receiver, and accuracy fell to 60% with a single-antenna transmitter ([UW Ubicomp lab](https://ubicomplab.cs.washington.edu/publications/whole-home-gesture/); [WiSee summary](https://nalinc.github.io/the-midnight-paper/papers/Whole_Home_Gesture_Recognition_Using_Wireless_Signals)). University College London's **passive WiFi radar** came closer to a surveillance scenario. An access point *inside* the building served as the signal source and a receiver *outside* measured the distance and Doppler of people moving behind the wall. Its main limit was the direct signal from the access point leaking into the receiver and drowning out the reflections ([TGRS 2012 record](https://search.isc.ac/inventory/49/1322199.htm); [Phys.org](https://phys.org/news/2012-08-see-through-wall-surveillance-wifi-shown-ucl.html)).

## Commodity WiFi catches motion behind walls, but a still person looks like an empty room

Some off-the-shelf WiFi chips expose CSI: the amplitude and phase of the signal on each subcarrier and antenna. Through-wall research on these chips is almost entirely about **motion and breathing, not imaging**. Studies routinely report above 90% accuracy for detecting a moving person through a wall. R-TTWD reported above 99% ([listing](https://bohrium.dp.tech/paper/arxiv/599c7807601a182cd2596e9e)) and TwSense a peak of 96% ([Applied Sciences 2023](https://www.mdpi.com/2076-3417/13/17/9668/htm)), though those numbers come from abstracts and summaries, not checked full-paper tables. Cheap radios add random phase noise to CSI. FarSense cancelled it by dividing the CSI from two antennas, which let it sense breathing at up to 8 m with commodity hardware. It also detected breathing through a wall, with one transceiver in a different room from the subject ([FarSense, arXiv 1907.03994](https://arxiv.org/pdf/1907.03994)).

The hard case is a person who is not moving. The 802.11bf standards literature says that "the key challenge of presence detection lies on the detection of a stationary human." With a still person in the room, CSI looks much like an empty room dominated by noise ([802.11bf overview, arXiv 2310.17661](https://arxiv.org/pdf/2310.17661)). Even MIT's radar had to compare frames over a longer time window to pick up people who were only breathing ([WiTrack2.0 paper](https://silhouette.csail.mit.edu/witrack2-paper.pdf)). A heartbeat moves the chest by less than a millimetre, against millimetres for breathing. Through walls, heartbeat has been measured only with custom radar; this review found no through-wall heart-rate result on commodity WiFi.

Pose and localization are where WiFi's reputation runs furthest ahead of the evidence:

- CMU's widely cited **"DensePose From WiFi"** used routers costing about $30 but **ran no through-wall experiment**. Its accuracy fell from AP 43.5 in room layouts it was trained on to 27.3 in new ones. A camera scored 84.7 on the same data ([DensePose From WiFi](https://ar5iv.labs.arxiv.org/html/2301.00250)).
- The current commodity state of the art, **Person-in-WiFi 3D** (CVPR 2024), reaches 92–125 mm joint error for one to three people, but only inside a single 4 × 3.5 m room ([CVPR 2024](https://cvpr.thecvf.com/virtual/2024/poster/30463)).

The field's central weakness is domain shift: models trained in one place do poorly in another.

- Widar3.0 found that gesture accuracy from raw CSI fell to **40.2%** in new environments. A hand-designed velocity feature brought it back to 92.4% ([Widar3.0](https://ct.cswu.me/papers/mobisys19_widar3_paper.pdf)).
- On the XRF55 benchmark, supervised accuracy in a new environment is **6.8%**. A foundation model pretrained on 1.32 million CSI samples raises that to 19.8%, and its authors call data "the current bottleneck" ([arXiv 2511.18792](https://arxiv.org/html/2511.18792)).
- The same signal even looks different on different receivers, mainly because of automatic gain control ([arXiv 2605.26836](https://arxiv.org/abs/2605.26836)).
- Newer foundation models such as AmbientFM, pretrained on 9.2 million samples collected over 439 days in real homes, report above 0.90 AUROC across nine tasks ([arXiv 2602.11200](https://arxiv.org/abs/2602.11200)).

As of November 2026, this review found no peer-reviewed through-wall pose result with numbers on commodity WiFi.

The bigger finding is that you can sense **a space you do not control from one side**. Commodity sensing works on a link from a transmitter to a receiver, so the target's own WiFi devices can act as the transmitters:

- **NDSS 2020:** a single smartphone outside 11 homes and offices used the occupants' existing devices as "anchors." It detected motion about 87% of the time with one anchor and 99.99% with four, with false positives under 3%. These figures come from a secondary summary, not the paper ([Max Intel](https://maxintel.org/wifi-sensing-through-walls-2026.html)).
- **LeakyBeam (NDSS 2025):** WiFi devices send unencrypted beamforming-feedback frames, and these frames reveal movement even through walls. From 20 m away, LeakyBeam detected occupancy with **82.7% true-positive and 96.7% true-negative rates**. The authors frame the threat as enabling "burglaries or stalking" ([NDSS](https://ndss-symposium.org/ndss-paper/lend-me-your-beam-privacy-implications-of-plaintext-beamforming-feedback-in-wifi)).
- **BFId (KIT, CCS 2025):** using beamforming feedback captured by a receiver that was not on the network, it identified 161 previously enrolled people with 99.5% accuracy. One viewpoint was in a neighbouring room. KIT itself warns its setup "may be overestimating" what is possible in the real world ([EurekAlert](https://www.eurekalert.org/news-releases/1101595); [Tom's Hardware](https://www.tomshardware.com/tech-industry/researchers-identify-people-through-ordinary-wi-fi-routers-with-99-percent-accuracy)).

All three depend on the target having active WiFi devices, and no hobbyist has reproduced any of them.

### Bluetooth senses rooms coarsely and has no through-wall result

Research on sensing people with Bluetooth without them carrying a device uses signal strength (RSSI) almost exclusively, and only within a room. The best result found classified whether a room was occupied with 97.97% accuracy and counted people with a mean error of 0.32 persons ([Demrozi et al., arXiv 2102.03351](https://arxiv.org/pdf/2102.03351)). Reviews consistently find BLE less accurate than WiFi. One reason is that BLE hops between channels constantly, and the receiver usually cannot tell which channel it is on ([PMC10007112](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10007112/); [U Duisburg-Essen](https://www.nes.uni-due.de/?p=2496)).

Bluetooth 6.0 Channel Sounding, announced in September 2024, is often mistaken for radar. It is actually **ranging between two cooperating devices**: it measures phase across up to 72 one-megahertz channels, with typical accuracy the Bluetooth SIG describes as ±50 cm at up to 100 m ([Bluetooth SIG](https://www.bluetooth.com/wp-content/uploads/2024/12/mrn-channel-sounding.pdf)). Its total span of about 80 MHz implies roughly 1.9 m of range resolution.

Sensing people with Channel Sounding is at the proof-of-concept stage. A 2026 study placed two Nordic nRF54L15 boards 6 m apart and detected falls by watching how a body changed the measured distance between them. It reached an F1 score of 98.4%, but scored on short time windows, in one living room, with no wall, six actors, and a Bluetooth stack that reported only a single distance value rather than raw phase ([PMC13030440](https://pmc.ncbi.nlm.nih.gov/articles/PMC13030440/)). An IEICE study detected people inside vehicles with 0.982 recall ([IEICE](https://ken.ieice.org/ken/paper/20250306gcJS/eng/)). The literature reviewed contains no through-wall result for Bluetooth.

The table below summarises what each type of hardware has been shown to do for a person behind an interior wall, drawing on the sources above.

| Task | Custom FMCW radar | Software-radio WiFi | Commodity WiFi CSI | Bluetooth |
|---|---|---|---|---|
| Detect a moving person | Yes, with ~10 cm localization | Yes (Wi-Vi, passive radar) | Yes, >90% claimed | Not shown through walls |
| Detect a still person | Yes, via breathing | Not shown | Fragile; breathing at short range only | No |
| Breathing / heart rate | Both, ~99% | Not shown | Breathing only | No |
| Count people | Up to 3 through a wall | 0–3 moving, 85–100% | Not viable | In-room RSSI only |
| Locate people | 7–16 cm | Distance and direction of movers | Which room, with several anchors | No |
| Body pose | AP 58.1 through walls | Not shown | Not shown through walls | No |
| Identify individuals | 88.2% of 15 people | Not shown | 99.5% of 161 enrolled (BFI, lab) | No |

## Phones expose no CSI, so the sensor must be an ESP32, a Pi or a PC card

The most important requirement is access to CSI, and most chipset makers keep it private, with no interface for consumers ([802.11bf overview](https://arxiv.org/pdf/2310.17661)). In late 2026 there are four practical ways to get it:

- **ESP32 boards (cheapest).** Espressif's official CSI API works on every ESP32-series chip. The newer ESP32-C5 adds 5 GHz and WiFi 6 HE20 frames with 245 subcarriers. However, it cannot receive 80 or 160 MHz frames at all, so a busy router on a wide channel can look silent to it ([espressif/esp-csi](https://github.com/espressif/esp-csi); [Scwan/esp32c5-csi-examples](https://github.com/Scwan/esp32c5-csi-examples)).
- **Nexmon CSI.** It patches Broadcom firmware on the Raspberry Pi 3B+, 4B and 5 and on the Asus RT-AC86U router, giving CSI at up to 80 MHz ([seemoo-lab/nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)). Installing it means an hour-long compile on the Pi and a 1.5 GB download ([picsi](https://pypi.org/project/picsi/0.0.5)).
- **PicoScenes.** On Intel AX200 and AX210 cards it captures 802.11ax CSI at up to 160 MHz, including the 6 GHz band on the AX210. It also drives USRP and HackRF software radios with full WiFi 7 signals at up to 320 MHz ([PicoScenes](https://ps.zpj.io/)).
- **Legacy cards.** The classic Intel 5300 and Atheros AR9580 tools still work, but need 802.11n-era cards bought used for about $50–100 ([CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)). They still matter because the standard benchmark datasets were recorded on them, and models trained on those datasets do not carry over cleanly to ESP32 data ([SenseFi](https://pmc.ncbi.nlm.nih.gov/articles/PMC10028433/)).

There is no public CSI tool for Realtek chips or for any commercial WiFi 7 card. MediaTek has only a community driver patch, tested on mt7981 routers ([OpenWrt Forum](https://forum.openwrt.org/t/csi-extraction-for-mediatek-based-wi-fi-chipsets/244703)).

| Platform | How CSI is obtained | Bandwidth | What to know |
|---|---|---|---|
| ESP32 (S3, C6, C5 and others) | Official Espressif API | 20/40 MHz; C5 adds 5 GHz HE20 | One antenna; cheapest; C5 cannot receive 80/160 MHz frames |
| Raspberry Pi 3B+/4B/5 | Nexmon firmware patch | Up to 80 MHz | Hour-long compile on the Pi; poorly documented |
| Asus RT-AC86U; MediaTek mt7981 routers | Nexmon; community MtkCSIdump | Up to 80 MHz | The router itself becomes the receiver |
| Intel AX200/AX210 card | PicoScenes on Ubuntu 22.04 | Up to 160 MHz; 6 GHz on AX210 | Research grade; multiple antennas (MIMO) |
| Intel 5300 / Atheros AR9580 | Legacy Linux tools | 20/40 MHz (802.11n) | Obsolete; most public datasets recorded on them |
| USRP / HackRF software radio | PicoScenes | Up to 320 MHz | Transmitter is not certified; radar mode |
| Stock Android or iOS phone | None | None | Only rooted Nexus 5 and 6P phones (2013 and 2015) |

**Smartphones fail this requirement outright.**

- **Android WiFi scanning:** a stock app can read WiFi signal strength from scans, but these are limited to **four scans per two minutes in the foreground** and one per 30 minutes in the background ([Android Developers](https://developer.android.com/develop/connectivity/wifi/wifi-scan)). That is about one sample every 30 seconds, far too slow for motion or breathing.
- **Android ranging APIs:** Android's richer radio APIs all need a cooperating device on the other end. WiFi RTT returns a distance to a supporting access point, accurate to 1–2 m, with no channel data ([Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)). Android 16's Ranging API covers UWB, Bluetooth Channel Sounding and WiFi Aware, but the responding device must also run Android 16 ([Ranging](https://developer.android.com/develop/connectivity/ranging)).
- **Channel Sounding on phones:** it reached phones only with the Pixel 10 and a December 2025 update for the Pixel 9. No source shows raw tone or phase data reaching apps ([Nordic DevZone](https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/evaluating-bluetooth-channel-sounding-with-our-open_2d00_source-android-app-on-google-pixel-10)).
- **iOS:** stricter still. An Apple engineer confirmed there is no supported way to read even the connected network's WiFi signal strength on any iOS version ([Apple Developer Forums](https://developer.apple.com/forums/thread/835163)). That leaves only Bluetooth signal strength through Core Bluetooth and UWB ranging to a cooperating device.
- **CSI on phones:** the only documented case is Nexmon on a rooted Nexus 5 or 6P, released in 2013 and 2015 ([nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)).

In any product, the phone is the dashboard, not the sensor.

The second requirement is placement. Commodity sensing is "bistatic": one device transmits, another records CSI, and the person has to be on or near the line between them. Espressif's reference design uses the home router as the transmitter: the ESP32 pings it at a fixed rate, which also sets how often CSI is sampled ([esp-csi](https://github.com/espressif/esp-csi)). ESPectre tells users to "plan on one board per room" ([ESPectre](https://github.com/francescopace/espectre)). wifi-ghost, a two-ESP32 through-wall project, reports that a person walking *behind* the receiver is "mostly invisible" ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)). No phone or consumer WiFi card can work like a radar, sending and catching its own reflections from one box. That mode exists only in PicoScenes' 2024 "Radar mode" for research hardware ([PicoScenes](https://ps.zpj.io/)) and in 802.11bf's 60 GHz modes, a band that barely passes through walls.

The software pipeline is well established:

1. **Parse** the raw data with a parser written for the specific chip. The ESP32-C5 packs values in 12 bits; misread as 8-bit, the data still parses "cleanly" and plots "plausibly," which is a trap of its own ([Scwan](https://github.com/Scwan/esp32c5-csi-examples)).
2. **Clean the phase**, either by fitting and removing a linear trend or by dividing one antenna's CSI by another's.
3. **Remove outliers** with a Hampel filter.
4. **Reduce dimensions** with PCA across subcarriers.
5. **Extract features**: a 0.1–0.5 Hz band-pass filter for breathing, or Doppler spectrograms for activity.
6. **Classify** with classical machine learning or deep networks ([VitalCSI](https://pmc.ncbi.nlm.nih.gov/articles/PMC12788229); [wifi-csi-sensing](https://github.com/contactmridulhere-commits/wifi-csi-sensing)).

SenseFi remains the standard open benchmark. It has been joined by CSI-Bench (NeurIPS 2025), recorded on commercial devices across 26 environments and 35 users ([CSI-Bench](https://proceedings.neurips.cc/paper_files/paper/2025/file/f7c68372b3d39e8d7a093eb2edaaad87-Paper-Datasets_and_Benchmarks_Track.pdf)).

The one structural change coming is **IEEE 802.11bf, published on 26 September 2025** ([IEEE 802.11 WG](https://www.ieee802.org/11/); [802.11bf overview](https://arxiv.org/pdf/2310.17661)). It standardizes, across 1–7.125 GHz and above 45 GHz:

- how WiFi devices announce that they can sense;
- how they set up measurement exchanges;
- how they report CSI.

It also adds "Sensing by Proxy," which lets a client device ask an access point to sense on its behalf. That turns CSI from a firmware hack into a standard, negotiated feature. However, as of November 2026 no shipping chipset, Linux driver, or Android or iOS API with confirmed 802.11bf support was found. And the standard changes neither the bandwidth limit nor the placement requirement.

## Millions of routers already sense motion; no phone app sees through walls

WiFi sensing of people who carry no device is a shipping product category, but it ships in routers and smart-home gear, not phone apps.

The largest deployment is **Comcast's Xfinity WiFi Motion**. Comcast relaunched it in August 2026 as a free, opt-in part of Xfinity WiFi Shield on leased XB7 and newer gateways ([TechCrunch](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/); [Wi-Fi NOW Global](https://wifinowglobal.com/news-and-blog/comcast-relaunches-xfinity-shield-with-wi-fi-motion-sensing-security-parental-controls/)). It watches for disturbances on the links between the gateway and up to five stationary devices the user picks. Comcast's own support page is the best real-world evidence that consumer WiFi sensing crosses walls: it warns that **neighbours on shared walls can cause false alerts** and recommends lower sensitivity ([Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)). Its "Exclude Small Pets" filter screens out animals up to about 40 lb and may also screen out small children. Comcast says it is "not a security service."

The other commercial offerings:

- **Cognitive Systems.** Comcast's feature reportedly uses its technology ([Wi-Fi NOW Global](https://wifinowglobal.com/news-and-blog/comcast-relaunches-xfinity-shield-with-wi-fi-motion-sensing-security-parental-controls/)). The company claims more than 120 ISPs and about a million homes ([Troy Media](https://troymedia.com/?p=1598864)) and integrates with Broadcom, MaxLinear and Airties hardware ([Lightwave](https://www.lightwaveonline.com/broadband/article/55031708/cognitive-systems-brings-motion-sensing-to-broadcoms-wi-fi-6-6e-access-points)).
- **Plume Motion.** It detects motion between mesh pods and is sold through ISPs, with "no specific recognition of people" ([Allwest KB](https://blog.allwest.com/hubfs/Plume%20HomePass%202.0%20Knowledge%20Base%20Article.pdf)).
- **WiZ SpaceSense.** It senses motion between two or more WiZ smart bulbs. Wired found it worked in a hallway only at maximum sensitivity ([WiZ](https://www.wizconnected.com/en-gb/explore-wiz/spacesense); [Wired mirror](https://wirednews.pages.dev/story/wiz-spacesense-smart-lights)).
- **Linksys Aware.** A standalone $2.99/month add-on for Linksys mesh routers, launched in 2019, it reached end of life in 2024 ([Tom's Hardware](https://www.tomshardware.com/news/linksys-aware-mesh-wi-fi-security,40604.html); [Linksys EOL](https://www.linksys.com/pages/linksys-product-end-of-life)).

No vendor publishes independent detection or false-alarm rates.

Open source gives hobbyists the same capability. **ESPectre** (about 9.7k GitHub stars) turns one ESP32 into a motion sensor that connects to Home Assistant, MQTT and Matter. It is explicit about its limits: it "does not identify people, count them, or prove a room is empty" ([ESPectre](https://github.com/francescopace/espectre)). Espressif's own esp-csi includes a motion and presence demo that is trained on site, but publishes no accuracy figures ([esp-csi](https://github.com/espressif/esp-csi)).

At the other extreme is **RuView** (formerly ruvnet/wifi-densepose). It claims through-wall pose, breathing and heart rate at up to 5 m from an ESP32-S3 mesh costing about $54, plus a presence detector it calls "100% accurate." Critics found code that returned random data, alleged inflated star counts and noted there are no demo videos. CNX Software's editor concluded the claims are "quite likely ... over the top" but that nothing shows the project is completely useless ([CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/); [Cybernews](https://cybernews.com/security/viral-github-project-wifi-see-through-walls/)). Its Docker image runs on simulated data ([mendozalz/RuView](https://github.com/mendozalz/RuView)). Until someone reproduces it independently, treat it as unverified.

Phone apps are where the myth lives. "See through walls," with about 800,000 Play Store installs, fakes a scan by blending two photos from the gallery and admits it is not a real scanner ([AppGoblin](https://appgoblin.info/apps/com.scanner.simulator.see.through.walls)). The honest alternative, SenseWave, uses throttled WiFi signal strength, has about 2,700 installs, and says it cannot tell where motion happened ([AppGoblin](https://appgoblin.info/apps/com.oradevs.wifi_motion_radar)).

Apps that "detect people" with Bluetooth or WiFi actually detect *devices*. That approach has three problems:

- It misses anyone not carrying a phone.
- It cannot tell which side of a wall a device is on.
- Phones change their MAC addresses for privacy, so one device seen under three addresses counts as three people ([Purple.ai](https://www.purple.ai/en-us/guides/como-a-randomizacao-de-enderecos-mac-afeta-a-analise-de-wifi-de-convidados)).

Crowd-counting studies report 75% accuracy in real urban settings, against 96% in controlled ones ([Politecnico di Torino](https://iris.polito.it/retrieve/handle/11583/2972106/606040)).

Real through-wall detection of people is sold as dedicated radar. The L3Harris **Range-R** is a handheld unit built to detect "moving and near-stationary personnel through walls" for police and rescue teams. It cost about **$6,000 per unit** in 2015 reporting ([Wikipedia](https://en.wikipedia.org/wiki/Range-R); [Engadget](https://www.engadget.com/2015-01-23-fbi-us-marshals-range-r-radar.html)). Camero's Xaver imaging radars are sold to military and security buyers at undisclosed prices ([EDR Magazine](https://www.edrmagazine.eu/much-improved-through-the-wall-situational-awareness-with-cameros-xaver-1000)). Consumer mmWave sensors such as the Aqara FP2 detect still people in a room far more reliably than WiFi does, and occasionally trigger through thin walls or glass ([Slickdeals](https://slickdeals.net/f/19115323-aqara-presence-sensor-fp2-mmwave-radar-wired-smart-motion-sensor-zone-positioning-multi-person-fall-detection-homekit-alexa-google-home-and-home-assistant-57-9-57-99); [The Smart Cave](https://thesmartcave.com/?p=6718)).

| Category | Examples | What it actually detects | Through walls? | Cost |
|---|---|---|---|---|
| "X-ray" phone apps | "See through walls" | Nothing; it is a prank | No | Free, ad-supported |
| Phone RSSI apps | SenseWave | Coarse motion, experimental | Not claimed | Free |
| ISP and router WiFi motion | Xfinity WiFi Motion, Plume, Cognitive | Motion on the user's own WiFi links | Incidentally; neighbours cause false alerts | Bundled with service |
| DIY CSI | ESPectre, esp-csi, wifi-ghost | Motion; breathing only anecdotally | Interior walls of your own home | About $10–40 per room |
| Consumer radar | Aqara FP2 ($58–86), Vayyar Care ($195–244) | Still people in a room, falls | Thin walls, incidentally | Under $250 |
| Professional radar | L3Harris Range-R, Camero Xaver | Moving and near-still people | Yes, purpose-built | About $6,000 and up |

Sources: Aqara pricing from [Slickdeals](https://slickdeals.net/f/19115323-aqara-presence-sensor-fp2-mmwave-radar-wired-smart-motion-sensor-zone-positioning-multi-person-fall-detection-homekit-alexa-google-home-and-home-assistant-57-9-57-99); Vayyar pricing from [Israel21c](https://archive.israel21c.org/?p=117534) and [Woot](https://sellout.woot.com/offers/vayyar-care-fall-detection). The DIY cost is my estimate from the bill-of-materials figures in the next section.

## A weekend motion sensor is easy; reliable through-wall presence takes years

So the answer to "does it already exist?" has three parts:

- **A phone app that sees people through walls** does not exist and cannot be built on stock Android or iOS, because the operating systems withhold the data it would need.
- **A system that detects motion in other rooms of your own home** exists and is cheap to build.
- **A system that detects a still person behind a wall, counts people or images them with commodity WiFi** does not exist outside research.

What it would take to build depends on which of these you mean.

### Architecture

A realistic build is a hardware product with a phone app on top, in five layers:

1. **Signal source.** The existing router, or a dedicated ESP32 transmitter on a fixed 20 MHz channel, supplies the packets.
2. **Sensing nodes.** One ESP32 per monitored room, with an external antenna, records CSI from that traffic. A ping or UDP traffic generator keeps the sampling rate steady.
3. **On-device processing.** The node runs the detector itself. ESPectre's lightweight motion detector needs about 2 KB of persistent memory and about 16 µs of CPU time per second ([ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)).
4. **Integration.** ESPHome, MQTT or Matter publishes occupancy to Home Assistant, Google Home or Apple Home.
5. **Phone app.** It handles setup, alerts and calibration. In today's tools, calibration means keeping the room still for 10 seconds while the node records a baseline, then adjusting a single threshold slider ([HA Community](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)).

To detect people who are not moving, the nodes become dedicated transmitter-receiver pairs whose line crosses the area to be covered, plus a breathing detector that looks for 0.15–0.5 Hz motion over 60-second windows ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)). A more practical option is to pair WiFi motion with a $26–90 mmWave sensor in each room ([Apollo Automation](https://wiki.apolloautomation.com/products/general/comparisons)).

The commercial alternative skips dedicated hardware and runs as firmware on ISP gateways, which is how Cognitive Systems and Aerial Technologies work. Because chipset makers control CSI access, this route requires partnerships with Broadcom, MaxLinear or Qualcomm ([Wi-Fi Broadband Alliance](https://wballiance.com/aerial-technologies-wifi-sensing-applications-now-available-on-qualcomm-networking-pro-series-platforms/)).

### Cost and effort

| Build target | Architecture | Hardware cost | Effort (my estimate) | Realistic outcome |
|---|---|---|---|---|
| Motion in other rooms of your home | Router plus one ESP32 per room running ESPectre, into Home Assistant | About $10–40 per room | Hours to days | Works well after tuning; misses still people |
| Breathing-based presence behind one wall | ESP32 transmitter/receiver pairs, custom signal processing, optional mmWave | About $20–130 per room | Weeks for a skilled embedded developer | Anecdotal only, within about 3 m of the receiver |
| Polished consumer product | Custom nodes or gateway firmware, auto-calibration, pet filtering, app and cloud | Product hardware cost plus certification | Several people, several years | Motion-level detection; no independent benchmark exists to compare against |
| Locating people by room, or pose | Multi-node mesh or AX210 with PicoScenes, camera-labelled training at each site | Hundreds of dollars plus GPUs | A research project | Works in one room; falls sharply in new layouts |
| One-sided through-wall localization or imaging | Custom FMCW or UWB radar with about 1.7 GHz of bandwidth | Lab-built; Range-R about $6,000 | A research lab | Proven, but it is radar, not WiFi |

The per-room costs are my estimates, built from sourced parts:

- RuView prices a 4–6-node ESP32-S3 mesh at about $54, roughly $9–14 per node ([CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)).
- wifi-ghost budgets about $8 per node for an HLK-PM01 mains power module, or about $23 for a Shelly relay ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)).
- mmWave modules cost $26–90 each ([Apollo Automation](https://wiki.apolloautomation.com/products/general/comparisons)).

The effort is grounded in what exists today. ESPectre alone has 886 commits, and Cognitive Systems has sold WiFi Motion through ISPs since at least 2020. Neither has yet solved automatic recalibration or detection of people sitting still.

### Realistic accuracy

The best published numbers are self-reported.

- **ESPectre:** its performance report shows an **F1 score of 99.5–99.9%** for motion with a normal signal. With a weak signal, precision drops to 94.6%. On one weak transmitter-receiver pair, the lightweight profile produced **149 false alarms per hour**, against zero for the high-accuracy profile. The report admits its test set "was inspected during development, so it is a regression set, not a sealed test," and it gives no room, distance or wall conditions ([ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)). Its developer acknowledges that "if you sit perfectly still, it will eventually report 'no motion'" ([HA Community](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)).
- **wifi-ghost:** it picked up a sleeping adult breathing at 14–17 breaths per minute through one sheetrock wall, within about 3 m of the receiver. That was in one household, with no error rates reported. The project also found that simple averaging fails outright: noise in an empty room (a standard deviation of about 25% of the mean) is larger than the change caused by someone walking (about 13%) ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)).

Pets, winter air and moved furniture all shift the baseline. No source measured the effect of fans, HVAC or robot vacuums. Counting and pose are not workable on commodity hardware outside a lab.

### Hidden costs

- **Licensing.** ESPectre is GPLv3, so a closed-source product must buy its commercial license (available for eligible parts) or rewrite the firmware ([ESPectre](https://github.com/francescopace/espectre)).
- **Integration problems.** ESPectre's firmware framework conflicts with Arduino-based builds, and users of a similar project said an update "completely blew up" their Bluetooth proxies ([HA Community](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)).
- **Radio regulation.** Sending standard WiFi frames from certified radios falls under ordinary FCC Part 15 rules, which have no sensing-specific provision at 2.4 or 5 GHz ([eCFR Part 15](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15)). Transmitting custom signals from a software radio, or changing a certified radio's transmit settings, takes the device outside its certification. Dedicated motion radar has its own rules at 57–71 GHz, where the FCC granted Google's Soli radar a waiver ([FCC DA 18-1308](https://docs.fcc.gov/public/attachments/DA-18-1308A1.pdf)). That band, however, stays inside the room.

## Sensing your own home is a product; sensing someone else's is surveillance

**Government use.** No US court has yet applied the Fourth Amendment to WiFi sensing. But in *Kyllo v. United States* (2001), the Supreme Court held that pointing a thermal imager at a home from the street is a search that requires a warrant. The majority rejected the government's distinction between "off-the-wall" and "through-the-wall" observation as "mechanical" ([Cornell LII](https://www.law.cornell.edu/supremecourt/text/99-8508)). A government agency using WiFi sensing on a home would face the same reasoning, though one attorney notes this is still "argument, not holding" ([Benavides](http://www.attorneymichaelbenavides.com/your-router-can-detect-breathing-through-walls-is-that-a-search)). *Kyllo*'s protection applies to technology "not in general public use." With WiFi Motion now running on millions of Comcast gateways, that condition is a real risk to the protection. Police use of Range-R without warrants already drew ACLU criticism in 2015 ([NPR](https://www.npr.org/sections/thetwo-way/2015/01/21/378851217/new-tools-let-police-see-inside-peoples-homes)). Comcast's terms let it disclose WiFi Motion data to third parties, including in response to subpoenas and court orders, "without further notice" ([TechCrunch](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/); [The Register](https://www.theregister.com/security/2026/08/19/comcast-gives-its-wi-fi-motion-detector-a-security-makeover/5289572)).

**Private builders in the US.** The applicable law is less clear.

- The federal Wiretap Act prohibits intercepting electronic communications. The Electronic Communications Privacy Act (ECPA) added the words "or other acquisition," which extended "interception" beyond listening ([CRS R41733](https://www.congress.gov/crs-product/R41733)).
- No court has decided whether capturing CSI or beamforming feedback from a neighbour's traffic acquires the "contents" of a communication.
- The usual defence that one party consented does not apply if the interception is "for the purpose of committing any criminal or tortious act" ([Covington](https://www.cov.com/-/media/files/corporate/publications/2020/06/key-issues-in-electronic-communications-privacy-act-ecpa-litigation.pdf)). Stalking or burglary would be exactly that.
- State eavesdropping, invasion-of-privacy, stalking and biometric laws (biometric laws matter if a system infers gait or identity) were not researched here. They are the next item to check.

**The EU.** MAC addresses count as personal data even when hashed, and WiFi tracking needs consent or anonymisation ([TechGDPR](https://techgdpr.com/blog/wifi-tracking-retail-analytics-gdpr/)). Practitioner commentary holds that sensing identifiable people without devices likely needs a legal basis under GDPR and a data protection impact assessment.

**The standard itself.** Critics note that 802.11bf offers "no privacy protection for non-participating individuals, no consent framework, no opt-out" ([waveyhq](https://waveyhq.dev/posts/ieee-80211bf-privacy-gap/)). KIT's researchers urged safeguards after BFId ([Physics World](https://physicsworld.com/a/is-your-wifi-spying-on-you/)).

**App stores.** Google Play's stalkerware policy requires apps that monitor other people to give notice or get consent and to show a persistent notification. Such apps may not market themselves as spying tools ([Infosecurity Magazine](https://www.infosecurity-magazine.com/news/stalkerware-banned-from-google/)). Apple requires explicit consent and a clear indication whenever an app records user activity ([MacRumors](https://www.macrumors.com/2021/02/01/apple-app-store-review-guidelines-tracking)). An app marketed for sensing a neighbour's apartment would fail both.

**Builder ethics.** The ethical line among builders is visible but inconsistent. wifi-ghost collected its data "with consent" in the maintainer's own household and tells users to deploy "only in spaces you own or are authorized to monitor." It also advertises the sensor as "Hidden," with "Nothing visible from outside" ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)).

A defensible product:

- senses only spaces its user controls;
- tells the people in those spaces that it is running;
- processes data locally;
- does not try to identify individuals;
- does not commit to handing data to third parties the way Comcast's terms do.

## Conclusion

The question "can WiFi see through walls?" focuses on the wrong obstacle. Interior walls barely matter at 2.4–5 GHz. What limits commodity WiFi is bandwidth, which gives it metres of range resolution rather than centimetres, and placement, since it senses links between devices rather than open space. That changes where the real risk lies. A phone pointed at drywall will not reveal a stranger behind it. A sniffer that exploits the target's own chatty devices can, as LeakyBeam and BFId show, and so can an ISP gateway that already senses millions of homes under terms that allow disclosure. The privacy risk has moved from specialised radar to equipment people already have in their homes.

For anyone building in this space, the opportunity and the constraint point the same way. 802.11bf will make CSI a standard feature. That will eventually remove the need to hack firmware and could let phones request sensing through access points, but it will not bring imaging. Because the standard has no consent framework, the policy lever that matters is protection at the radio level: encrypting or scrambling beamforming feedback, and telling occupants when sensing is running. The defensible product is not "see who is behind the wall." It is "know whether anyone is moving in my own home, and whether a person sitting still is breathing," built by combining cheap WiFi motion nodes with mmWave sensors for still people. The hard problem worth investing in is not hardware. It is labelled data and making models work in homes they were not trained in, which the field itself calls its main bottleneck.
