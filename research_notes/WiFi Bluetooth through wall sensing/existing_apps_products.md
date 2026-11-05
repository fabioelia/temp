# Existing Apps, Products, and Open-Source Projects for WiFi/Bluetooth (and RF) Detection of People, Including Through Walls

Research date: 2026-11-05. Scope: what actually exists and ships, what hardware it needs, how well it works, and which claims are marketing or scams. Academic theory is out of scope (covered by another researcher).

**Headline answer for the report writer:** Yes, real WiFi-based "device-free" people sensing ships today, but almost entirely as **coarse motion/presence detection inside your own home, using your own router/mesh/bulbs** (Comcast/Xfinity WiFi Motion, Plume Motion, WiZ SpaceSense, Cognitive Systems via ISPs, and DIY ESP32 projects like ESPectre). These sense across interior walls as a side effect, which is why vendors warn about false alerts from neighbors through shared walls. **No legitimate phone app can see people through walls with WiFi or Bluetooth.** The App Store/Play Store "see through walls" apps are prank simulators, and the few honest WiFi "motion" apps use coarse RSSI that Android throttles to a few scans per minute. Apps that "detect people" with Bluetooth/WiFi actually detect *devices* (phones, watches), which is a weak, privacy-degraded proxy. Real through-wall imaging of people uses dedicated radar (L3Harris Range-R, Camero Xaver) costing thousands of dollars and sold to police/military. The most-starred "WiFi DensePose through walls" GitHub repo (ruvnet/wifi-densepose, now RuView) is contested: its claims are unverified, and critics have accused it of being AI-generated.

---

## 1. Commercial WiFi motion/presence sensing (Cognitive Systems, Xfinity/Comcast, Origin Wireless, Plume, Linksys Aware, Aerial, WiZ SpaceSense)

### Takeaway
Commercial WiFi sensing is real and widely deployed. It is software that turns links between a router/mesh/bulb and stationary connected devices into a motion detector. It detects **motion** (some vendors add "presence", sleep or eldercare inferences) across rooms and through interior walls, but it **cannot localize precisely, image, or identify people**. It is usually bundled with an ISP subscription or a vendor's mesh/bulbs rather than sold separately. Linksys Aware has been discontinued.

### Cited Findings

**Comcast / Xfinity WiFi Motion (largest deployment)**
- Xfinity WiFi Motion detects motion from changes in WiFi signals between the Xfinity gateway and connected devices. It "does not use cameras, capture images or video, or record audio." — [Xfinity Support: WiFi Motion](https://www.xfinity.com/support/articles/wifi-motion)
- Hardware: requires a leased Xfinity gateway (Technicolor XB7, XB8, XB9, XB10, MXB1 or XER10). Devices may connect via an XE2 extender. It is not available with Storm-Ready WiFi, the CommScope XB7, Pro Protection or a Pro WiFi Extender. Users select up to five stationary, usually powered-on WiFi devices to act as sensing points. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)
- Pricing/packaging: included with Xfinity WiFi Shield (requires Xfinity Internet and a compatible leased gateway). Shield Select customers can also use it. It is not available to customers who also have Xfinity Home Security. No separate price is listed. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)
- Stated limitations: it is "not a security service", Comcast does not monitor alerts, and detection is not guaranteed. Devices in closed spaces or outdoors may not work well, and sleeping devices drop out. Layout, home size and building materials can limit detection. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)
- Through-wall evidence: Xfinity warns that **neighbors on shared walls can cause false alerts** and recommends Medium/Low sensitivity in that case. This implicitly confirms that the sensing extends through walls. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)
- Pet filtering: "Exclude Small Pets" filters animals of about 40 lb or less but requires High sensitivity. It may also filter small children and cannot always tell pets from people. Mounting devices 4+ ft off the floor reduces pet triggers. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)
- Privacy: Xfinity says information may be disclosed in response to valid legal process and in limited situations such as emergencies. — [Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion). Press coverage framed this as routers that can "tell on you to the police" — [Cybernews](https://cybernews.com/privacy/comcast-xfinity-shield-routers-motion-sensors/). It was also framed as Comcast "turning tens of millions of routers into motion detectors" — [The Next Web](https://thenextweb.com/news/comcast-xfinity-shield-wifi-motion-privacy). Other privacy-angle coverage: [Tom's Guide](https://www.tomsguide.com/computing/online-security/xfinity-just-added-wi-fi-powered-motion-tracking-to-its-routers-heres-why-it-could-be-a-privacy-nightmare), [Tom's Hardware](https://www.tomshardware.com/networking/routers/new-xfinity-router-motion-detecting-feature-stokes-privacy-fears-feature-powered-by-wi-fi-signals), [BleepingComputer](https://bleepingcomputer.com/news/security/comcast-turns-your-xfinity-wifi-into-a-home-motion-detector)
- Secondary coverage (summarized via search, outlet-level attribution not individually verified) reports that it works across rooms and floors but cannot pinpoint where motion occurred, only which device's link detected it. It also describes each sensing area as an "oval" between the gateway and the chosen device. — [PCWorld](https://pcworld.com/article/3215845/xfinity-routers-can-now-sense-movement-in-your-home-without-cameras.html); [Techlicious](https://www.techlicious.com/blog/comcast-wifi-tell-when-someone-in-your-house/)

**Cognitive Systems (WiFi Motion software vendor; white-labeled by ISPs)**
- WiFi Motion is software layered on existing WiFi access points, with no added hardware. In 2021 Cognitive said 37 ISPs worldwide offered it. — [Business Wire 2021](https://www.businesswire.com/news/home/20210310005850/nl)
- A Cognitive executive later claimed 120+ ISPs had installed WiFi Motion in about 1 million homes since January 2020 (company claim, dated). — [Calgary's Business](https://calgarysbusiness.ca/business/cognitive-systems-wifi-motion-revolutionizes-home-security/); [Troy Media](https://troymedia.com/?p=1598864)
- Chipset/platform integrations: Broadcom Wi-Fi 6/6E APs — [Lightwave](https://www.lightwaveonline.com/broadband/article/55031708/cognitive-systems-brings-motion-sensing-to-broadcoms-wi-fi-6-6e-access-points); Airties Wi-Fi 6 — [Lightwave](https://www.lightwaveonline.com/broadband/article/55031703/cognitive-systems-brings-wifi-motion-to-airties-wi-fi-6-offering); MaxLinear APs for ISPs, targeted for H1 2023 — [everythingRF](https://www.everythingrf.com/news/details/15411-cognitive-systems-and-maxlinear-partner-to-enable-wi-fi-sensing-applications)
- Eldercare: Cognitive launched "Caregiver Aware" in May 2022, running on WiFi Motion without extra hardware — [Business Wire 2022](https://www.businesswire.com/news/home/20220504005187/en). It partnered with Electronic Caregiver (May 2024) for "ambient assisted living" sensing for older adults — [HomeCare Magazine](https://www.homecaremag.com/news/electronic-caregiver-inc-cognitive-systems-corp-partner-deliver-wifi-motion-solution)
- A 2025 item reports a Canadian direct-to-consumer Caregiver Aware kit that includes four WiFi Motion plugs plus an app (source quality is moderate; not confirmed on a vendor page). — [Trend Hunter](https://www.trendhunter.com/trends/caregiver-aware)
- The company remained active in 2025–2026: it was a Premier Sponsor of Parks Associates CONNECTIONS 2025 — [Parks Associates](https://www.parksassociates.com/blogs/home-systems-and-controls/cognitive-systems-joins-connections-and-connected-health-summit-as-premier-sponsor). It was granted a patent on 2026-01-06 covering wireless networking/gesture recognition — [CB Insights](https://www.cbinsights.com/investor/cognitive-systems)
- Rogers (Canada) hosts a consumer support page titled "How to use WiFi-based motion sensing", indicating an ISP deployment there (vendor not confirmed from the page). — [Rogers Support](https://www.rogers.com/support/home-security/how-to-use-wifi-based-motion-sensing)

**Plume (Plume Motion / formerly "Plume Sense", HomePass)**
- Plume Motion detects "disturbances in Wi-Fi signals between your Pods or between a Pod and a motion capable device." It requires Plume pods/SuperPods and the Plume Home app (successor to HomePass, which reached end of life). — [Summit Broadband support](https://support.summit-broadband.com/hc/en-us/articles/360055841033-What-is-Plume-Motion); [Cuckoo help: Plume Home](https://help.cuckoo.co/en/articles/12098028-plume-home-formerly-homepass)
- It is opt-in. The system learns a baseline, and devices start acting as sensors about 10 minutes later. Always-on devices (voice assistants, smart-home gear) are recommended, and battery or low-power devices should be avoided. — [Summit Broadband](https://support.summit-broadband.com/hc/en-us/articles/360055841033-What-is-Plume-Sense); [Cuckoo: choosing motion devices](https://help.cuckoo.co/en/articles/12148829-choosing-your-motion-detection-devices)
- Alerts are sent only when nobody is home (based on assigned primary devices). It offers Live View and 7-day motion history. Plume says there is "no specific recognition of people." — [Cuckoo: motion history](https://help.cuckoo.co/en/articles/12148917-how-do-i-access-my-home-s-motion-history); [Allwest HomePass 2.0 KB (PDF)](https://blog.allwest.com/hubfs/Plume%20HomePass%202.0%20Knowledge%20Base%20Article.pdf)
- It is distributed through ISPs (e.g., Armstrong, HTC, Cablenet, Cuckoo, Summit Broadband). — [Armstrong](https://armstrongonewire.com/Support/Internet/Articles/PlumeMotion); [HTC](https://www.htcinc.net/support/internet/smart-wifi/plume-sense-features/)

**Linksys Aware (discontinued)**
- Launched in 2019 as a subscription using Velop mesh signals for camera-free motion detection. It initially supported only Velop Tri-Band AC2200 and cost $2.99/month or $24.99/year after a 90-day trial. — [Tom's Hardware 2019](https://www.tomshardware.com/news/linksys-aware-mesh-wi-fi-security,40604.html); [AppleInsider](https://appleinsider.com/articles/19/10/08/linksys-aware-uses-mesh-wi-fi-network-for-motion-tracking-in-the-home)
- Linksys's end-of-life table lists Linksys Aware (grouped with Linksys Shield) with End of Life 04/01/2024 and End of Support 08/31/2024. The extracted table was partly garbled, so confirm on the live page. — [Linksys Product End of Life](https://www.linksys.com/pages/linksys-product-end-of-life)

**Origin Wireless (Hex Home) and Aerial Technologies**
- Origin Wireless launched Hex Home around CES 2021, a DIY security kit with a Command hub and plug-in "Sense" units that detect motion from WiFi disturbances, with AI sensitivity to reduce pet/robot-vacuum false alarms. — [PR Newswire](https://prnewswire.com/news-releases/origin-wireless-unveils-next-generation-of-home-security-with-hex-home-301205006.html); [TechHive](https://www.techhive.com/article/579129/hex-home-security-monitors-your-wi-fi-network-to-detect-intruders.html)
- Launch coverage cited a roughly $180 starter kit covering up to about 1,000 sq ft (exact outlet attribution from search summary, not individually verified). — [The Ambient](https://www.the-ambient.com/?p=12971); [TechHive](https://www.techhive.com/article/579129/hex-home-security-monitors-your-wi-fi-network-to-detect-intruders.html)
- Aerial Technologies (Montreal) is a B2B WiFi-sensing software vendor that runs as a router-side agent for ISPs. It offers Security and Elder Care apps, ported to Qualcomm Networking Pro (2021) and Broadcom mesh (2022), with Mercku M6 as an early adopter. — [Wi-Fi Broadband Alliance](https://wballiance.com/aerial-technologies-wifi-sensing-applications-now-available-on-qualcomm-networking-pro-series-platforms/); [Wireless Design Online](https://www.wirelessdesignonline.com/doc/aerial-technologies-wifi-sensing-applications-now-available-broadcom-wifi-mesh-solutions-0001); [everythingRF: Mercku](https://www.everythingrf.com/news/details/12410-mercku-and-aerial-partner-to-bring-wi-fi-sensing-services-to-the-market)

**WiZ SpaceSense (Signify/Philips)**
- Launched with WiZ app V2 in Sept 2022. It detects motion from disturbances in WiFi between WiZ lights, needs no extra sensor, and works without line of sight. Signify says detection data is processed locally. — [Signify press release](https://www.signify.com/en-gb/our-company/news/press-releases/2022/20220916-surprisingly-thoughtful-lighting-for-everyone-signify-brings-to-light-motion-detection-technology-spacesense); [WiZ SpaceSense page](https://www.wizconnected.com/en-gb/explore-wiz/spacesense)
- It requires at least two WiZ lights in a room (per WiZ FAQ/coverage), and sensitivity is adjustable for pets. — [WiZ FAQ](https://faq.wizconnected.com/hc/cs/7-wiz-v2/faq/488-what-do-i-need-to-know-about-spacesense); [Android Central](https://www.androidcentral.com/accessories/smart-home/wiz-app-update-spacesense-new-products)
- An independent hands-on test (Wired review, accessed via a mirror) found it inconsistent. In a hallway it worked only at maximum sensitivity, and lights often turned on only as the tester reached the end of the hall. Headline: "These Motion-Sensing Smart Lights Aren't Worth Making the Switch." — [Wired review (mirror)](https://wirednews.pages.dev/story/wiz-spacesense-smart-lights)

### Inferences
- All commercial offerings detect **motion events on links you control** (your router, pods or bulbs, plus your devices). None offers through-wall *imaging* or reliable localization, and none is designed to sense into a neighbor's or stranger's space. Through-wall sensing is a side effect, and vendors treat it as a nuisance (false alerts).
- Business model: mostly bundled into ISP gateways/subscriptions (Comcast, Plume ISPs, Cognitive/Aerial via ISPs), so consumers rarely buy it standalone. The standalone products (Linksys Aware, Hex Home) appear to have struggled; Aware is formally EOL.
- "Presence" claims are weaker than "motion" claims. Xfinity, Plume and ESPectre (below) all describe motion. A still person (sleeping, sitting) is the known hard case for RSSI/CSI motion approaches, which is why eldercare products infer activity patterns rather than guarantee presence.

### Gaps
- Exact Comcast WiFi Motion launch/expansion date and the "tens of millions" router count could not be verified from a primary Comcast source (BleepingComputer and TechSpot returned 403). The coverage cluster appears to be 2026.
- Which vendor powers Xfinity WiFi Motion (Cognitive Systems is widely assumed) was not confirmed from a primary source in this session.
- Current (2026) status of Origin Wireless Hex Home and Aerial Technologies was not found. No discontinuation notice was found, and no recent product news either.
- No independent accuracy benchmarks (detection rate, false alarm rate) for any commercial WiFi Motion product were found. Only one hands-on review (WiZ) was found.

---

## 2. Open-source / hobbyist WiFi CSI projects (ESP32 CSI, ESPectre, Nexmon CSI, Linux 802.11n CSI Tool, PicoScenes, "WiFi DensePose"/RuView)

### Takeaway
Legitimate open-source WiFi sensing exists and is usable by hobbyists. **ESPectre** (around 9.7k stars, Home Assistant via ESPHome/MQTT/Matter) and Espressif's **esp-csi** (around 1.7k stars) demonstrably do **room-level motion detection** with cheap ESP32 boards. Neither claims through-wall people detection or people counting. Research CSI tools (Nexmon CSI on Raspberry Pi/Broadcom, Intel 5300 tool, PicoScenes) extract raw CSI but are not end-user apps. The viral "WiFi DensePose through walls" repo (ruvnet/wifi-densepose, now **RuView**, reportedly 25k–45k stars) makes extraordinary claims (100% presence accuracy, through-wall pose, vital signs). These claims are **unverified**, and critics have alleged that early versions output random/simulated data.

### Cited Findings

**ESPectre (francescopace/espectre)**
- About 9.7k stars, 742 forks, 886 commits as of fetch. It describes itself as a motion detection system based on WiFi CSI with native Home Assistant integration via ESPHome. MQTT (with discovery) and Matter occupancy are also supported. — [GitHub: espectre](https://github.com/francescopace/espectre)
- What it detects: it reports "motion and a movement score." It explicitly "does not identify people, count them, prove that a room is empty." It is not safety-certified for security, medical or emergency use. — [GitHub: espectre](https://github.com/francescopace/espectre)
- Hardware: ESP32 (C6, C5, C3, S3, S2 or classic) on a 2.4 GHz 802.11n network. "One board covers one area, so plan on one board per room." — [GitHub: espectre](https://github.com/francescopace/espectre)
- Algorithms: MVS (Moving Variance Segmentation) with NBVI subcarrier selection. v2.5 added an experimental on-device neural-network detector "no calibration required" (per search snippet of repo). — [GitHub: espectre](https://github.com/francescopace/espectre); [GitHub: sunbox/espectre fork](https://github.com/sunbox/espectre)
- Seeed Studio publishes a deployment guide for XIAO ESP32 boards. It notes CSI collection creates high CPU interrupt load (≥100/s) and suggests lowering `traffic_generator_rate` if Home Assistant fails to add the device. — [Seeed Studio Wiki](https://wiki.seeedstudio.com/xiao-esp32--series-espresense/); tutorial: [Teach Me Micro](https://www.teachmemicro.com/espectre-tutorial-motion-detection-using-wi-fi-signals-esp32-home-assistant/)

**Espressif esp-csi (official)**
- About 1.7k stars, 271 forks. The `wifi_sensing_demo` provides "motion and human presence detection" on the `esp_wifi_sensing` component, with on-site training and a Web Serial monitor. Supported chips: ESP32, S2, C3, S3, C5, C6, C61. — [GitHub: espressif/esp-csi](https://github.com/espressif/esp-csi)
- No quantitative accuracy is published. Performance depends on router placement and protocol. An external IPEX antenna is recommended. Espressif advises testing in an unoccupied environment because other people's activity affects results. Through-wall is not claimed; it is mentioned only by citing MIT's RF-Pose research. — [GitHub: espressif/esp-csi](https://github.com/espressif/esp-csi)

**Research CSI extraction tools (not end-user apps)**
- Nexmon CSI runs on Broadcom chips including BCM43455c0, which is the Raspberry Pi 3B+/4B WiFi chip. Other supported chips include BCM4339, BCM4358 and BCM4366c0. The `picsi` helper installs it on Pi 3B+/4B and notes that compiling takes about 1 hour and downloads about 1.5 GB. — [CSIKit (supported hardware list)](https://github.com/rack570/CSIKit); [PyPI: picsi](https://pypi.org/project/picsi)
- PicoScenes supports concurrent CSI measurement on QCA9300, Intel IWL5300 and SDR hardware (per its paper). CSIKit lists Intel AX200/AX210 via PicoScenes. — [arXiv: PicoScenes](https://arxiv.org/abs/2010.10233v4); [CSIKit](https://github.com/rack570/CSIKit)
- Research NICs cited for full CSI: Intel 5300 or Atheros AR9580 (about $50–100). — [CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)

**RuView (formerly ruvnet/wifi-densepose): the viral, contested "through-wall pose" repo**
- Claims: WiFi CSI-based pose estimation, breathing (6–30 BPM) and heart rate (40–120 BPM), presence latency under 1 ms, **through-wall sensing up to 5 m**, multi-person, and a 4–6 node ESP32-S3 mesh (about $54). — [CNX Software, Mar 2026](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)
- The README claims a "100% accurate presence detection head" that "never misses a person, never false alarms." The Docker image runs on **simulated data**. Consumer laptops get only RSSI-based coarse presence. — [GitHub fork mirroring README: mendozalz/RuView](https://github.com/mendozalz/RuView); [RapidAI/RuView fork](https://github.com/RapidAI/RuView)
- Pose estimation is not plug-and-play, because users must train a model for their own environment. — [CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)
- Controversy: a researcher called it a scam, reporting variables filled with random data and missing pretrained weights, training scripts, datasets and evaluation code. CNX's editor checked the latest `csi_extractor.py`, found the random values removed, and concluded: "It's quite likely some of the claims are over the top or only valid in some specific conditions, but nothing points to the project being completely useless." He found **no YouTube demo videos** of it working, and commenters reported poor accuracy and no real-world video. — [CNX Software](https://www.cnx-software.com/2026/03/26/ruview-project-leverages-esp32-nodes-for-presence-detection-pose-estimation-and-breathing-heart-rate-monitoring/)
- Critics alleged inflated stars (reportedly jumping from 1.3k to 3k+ overnight with no commits) and CSI parsers returning random/hardcoded data, and called it AI-generated. The maintainer opened an issue titled "No, this is not fake." A German blog alleges a fake-stars issue and audit were deleted (not independently verified). — [Korben.info](https://korben.info/de/wifi-densepose-gefaelschtes-github-projekt-25000-stars.html); [byteiota](https://byteiota.com/?p=9544); [Lemmy/PieFed: "AI slop repository with 8k stars… doesn't even compile"](https://peachpie.theatl.social/c/programmerhumor/p/234518/ai-slop-repository-with-8k-stars-on-github-that-doesn-t-even-compile)
- A Home Assistant community thread asks about a RuView integration component (evidence of hobbyist interest, not of validated function). — [HA Community](https://community.home-assistant.io/t/ruview-support-component/992527)
- Media framing: "RuView claims to turn your WiFi router into a through-wall camera, and the internet isn't sure what to believe." — [Gadgetbyte Nepal](https://www.gadgetbytenepal.com/pi-ruview)

### Inferences
- ESPectre and esp-csi are the credible "it actually works" open-source options. They do motion detection per room, which matches the commercial products, and they are honest about limits (no counting, no proof of empty room).
- RuView should be treated as **unverified/misleading marketing** until there is independent reproduction. The specific claims (100% presence accuracy, through-wall pose from $54 of ESP32s) far exceed what credible projects and commercial vendors claim. Star counts are not evidence of function, especially given the allegations of star inflation.
- "Through walls" in hobby CSI projects generally means the ESP32 and the router/transmitter are both placed by the user, with the person somewhere along or near the link. It does not mean pointing a device at a stranger's wall from outside.

### Gaps
- Exact current star counts and last-commit dates for Nexmon CSI, the Linux 802.11n CSI Tool (Intel 5300), ESP32-CSI-Tool (StevenMHernandez) and PicoScenes could not be retrieved (GitHub API access was blocked in this session).
- No independent benchmark of ESPectre accuracy was found. The repo links to a performance report, which was not reviewed.
- RuView's current star count is reported inconsistently (around 25k–45k depending on date), and no primary GitHub page with a timestamp was fetched for the original ruvnet repo.

---

## 3. Smartphone apps claiming to "see through walls" or detect people via WiFi/Bluetooth

### Takeaway
No App Store or Play Store app genuinely detects human bodies through walls. The "see through walls / X-ray / wall scanner" apps are self-described **prank simulators** using stock images. A small number of honest "WiFi motion" Android apps use phone-side **RSSI fluctuations** only. They admit they are experimental, cannot locate motion, and are crippled by Android's scan throttling (4 scans per 2 minutes for a foreground app). Phones expose RSSI scan results, not CSI, to apps. The only phone-connected product that sees "into" walls is dedicated radar hardware (Walabot DIY), and it images studs/pipes inches deep, not people in the next room.

### Cited Findings
- "See through walls" (package `com.scanner.simulator.see.through.walls`) has about 800K installs and a 2.82 rating. It is an ad-supported Entertainment app that uses two photos (wall and room) from the gallery to fake a scan, and its listing says it is not a real wall scanner. — [AppGoblin listing](https://appgoblin.info/apps/com.scanner.simulator.see.through.walls)
- Similar prank apps: "Wall XRay Scanner Prank" — [AppGoblin](https://appgoblin.info/apps/com.MadeForYouApps.XRAYWallPrank/keywords/discovery); "Spider Camera Radar Prank" (App Store, says it does not provide true radar) — [Apple App Store](https://apps.apple.com/us/app/id1041908705); "Wifi Hack Simulator Prank" (describes itself as 100% simulated) — [AppGoblin](https://appgoblin.info/apps/com.MadeForYouApps.WifiHackPrank/keywords/discovery); "Ghost Detector Radar Simulator" — [Apple App Store](https://apps.apple.com/hn/app/ghost-detector-radar-simulator/id1569178599)
- "SenseWave: WiFi Motion Detector" (oraDevs, package `com.oradevs.wifi_motion_radar`) has about 2.7K installs and no ratings. It uses the phone's own WiFi RSSI from nearby APs to detect movement and claims occupancy estimates of "0 to 4+ people." It is labeled "EXPERIMENTAL SYSTEM — For education and research." It says it cannot identify who moved, where motion occurred or the distance to motion, is prone to false positives, and is "not a professional security system." It does not explicitly claim through-wall detection. — [AppGoblin listing](https://appgoblin.info/apps/com.oradevs.wifi_motion_radar)
- Android platform limits: on Android 9+, "each foreground app can scan four times in a 2-minute period"; all background apps combined get one scan per 30 minutes. Scanning requires location permission and Location enabled. The public WifiManager API returns scan results (AP list with signal strength); no CSI access is documented. — [Android Developers: Wi-Fi scanning](https://developer.android.com/develop/connectivity/wifi/wifi-scan)
- Legitimate RF hardware: Walabot DIY uses RF to "see into walls to identify studs, pipes, wires and movement." It connects to iPhone/Android via WiFi with a free app. — [Walabot Support](https://support.walabot.com/hc/en-us/articles/4403508377745-How-does-the-Walabot-DIY-2-work). It costs about $207–$210 at Walmart (capture date unknown). — [Walmart: Walabot](https://www.walmart.com/c/brand/walabot)
- The RuView README itself notes that ordinary laptops get "RSSI-only" coarse presence, and that through-wall and advanced capabilities need CSI from ESP32-S3 or research NICs. — [GitHub: mendozalz/RuView](https://github.com/mendozalz/RuView)

### Inferences
- Since apps get only throttled RSSI (roughly a few samples per minute) rather than high-rate CSI, a phone-only app cannot do the CSI-based sensing that ESP32/router products do. At best it might notice large signal changes on the phone's own link. Any app claiming to "see" people through walls is a prank or a scam.
- Popularity is inversely related to legitimacy: the prank app has hundreds of thousands of installs, while the honest experimental RSSI app has a few thousand.
- Device-free body sensing in the consumer market lives in routers, mesh pods, bulbs and ESP32 boards, not phones.

### Gaps
- iOS public API limits on WiFi scanning were not verified from Apple documentation in this session. iOS is generally understood to give apps even less WiFi scan access than Android, but this is unconfirmed here.
- No security-researcher analysis of "WiFi radar" apps for malware/data harvesting was found.
- Walabot DIY's current product status and price in 2026 were not confirmed from a vendor page.

---

## 4. Device-based detection (Bluetooth/WiFi scanners, probe-request sniffers) as a proxy for "a person is behind that wall"

### Takeaway
Detecting nearby phones/watches via Bluetooth advertisements or WiFi probe requests is easy and is what most "people detector" apps really do. It is a weak proxy, though: it detects **devices, not bodies**. It misses people without devices or with radios off. It over- or under-counts because of MAC address randomization, which fragments one device into many "people". It gives poor location (cannot say which side of a wall). Published crowd-counting studies report roughly 65–96% accuracy, and the higher numbers come from controlled settings.

### Cited Findings
- MAC randomization "breaks the continuity and semantics of probe requests and leads to fragmentation in data acquisition and analytics." — [IEEE Xplore](https://ieeexplore.ieee.org/document/9488769)
- An industry guide notes a single device presenting three MAC addresses over a week gets counted as three unique people. — [Purple.ai guide](https://www.purple.ai/en-us/guides/como-a-randomizacao-de-enderecos-mac-afeta-a-analise-de-wifi-de-convidados)
- Accuracy examples: a bus-counting study reached about 96% in a controlled environment but averaged 75% in a real urban scenario. A clustering method on information elements gave 65.2% (DBSCAN) and 91.3% (OPTICS). — [Politecnico di Torino (IRIS)](https://iris.polito.it/retrieve/handle/11583/2972106/606040); [unibz](https://bia.unibz.it/esploro/outputs/journalArticle/MAC-address-de-randomization-for-WiFi-device/991006475697601241)
- RateCount (2025) claims learning-free device counting comparable to state of the art, and 66% lower error than earlier people-counting methods. — [arXiv 2507.03873](https://arxiv.org/html/2507.03873v1)
- Device counts must be calibrated to people counts. A Korean study compared smartphone-based estimates to CCTV counts. — [KoreaScience](https://koreascience.or.kr/article/CFKO202132348561249.page)
- Random MAC addresses alone do not guarantee privacy (de-randomization is possible). — [KU Leuven AsiaCCS 2016 (PDF)](https://lirias.kuleuven.be/bitstream/123456789/543617/1//asiaccs2016.pdf)
- Plume's own motion feature relies on assigned primary *devices* to decide whether anyone is home, mixing device presence with WiFi motion. — [Summit Broadband / Plume](https://support.summit-broadband.com/hc/en-us/articles/360055841033-What-is-Plume-Sense)

### Inferences
- For "is someone behind that wall?", a BLE/WiFi scanner (e.g., nRF Connect, WiFi analyzers) shows that *some device is within radio range*. Range easily spans walls and neighboring units, so it cannot place the device in a specific room. RSSI-based distance is coarse and strongly affected by walls and bodies.
- This approach fails for people who leave phones elsewhere or turn radios off, and modern OS randomization deliberately degrades tracking. It is useful for crowd analytics, not for reliably locating individuals behind a wall.
- Legally and ethically, passive device sniffing raises privacy concerns distinct from device-free sensing.

### Gaps
- No primary source on nRF Connect or specific BLE scanner apps was fetched. Their behavior (listing advertising BLE devices with RSSI) is well known but not cited here.
- No quantitative data was found on how well RSSI from a phone/BLE device indicates which side of a wall it is on.

---

## 5. Professional through-wall radar and mmWave presence sensors (comparison)

### Takeaway
True through-wall people detection is done with **dedicated radar**, not WiFi apps. Law-enforcement handheld radars such as the L3Harris **Range-R** (about $6,000 in 2015 reporting) detect moving and near-stationary people through walls. Camero **Xaver** imaging radars are sold to military/police at undisclosed prices. Consumer mmWave presence sensors (Aqara FP2 at about $58–$90 US, and LD2410/LD2450 modules in $26–$78 sensors) are far more reliable than WiFi sensing for in-room presence, including stationary people. They are designed to stay *within* a room, but users report triggers through thin walls/glass. Vayyar Care (radar fall detection, about $195–$244 plus an Alexa Together subscription) and Google Nest Hub 2nd gen (Soli radar sleep sensing, $99 at launch) are consumer radar examples.

### Cited Findings
- **L3Harris (L-3 CyTerra) Range-R**: a handheld radar "designed to detect and measure the distance to moving and near-stationary personnel through walls," for police, SWAT, firefighters and search-and-rescue. — [Wikipedia: Range-R](https://en.wikipedia.org/wiki/Range-R)
- Range-R cost about $6,000 per unit (2015 reporting). The US Marshals spent over $52,000 on them since 2012. — [Engadget 2015](https://www.engadget.com/2015-01-23-fbi-us-marshals-range-r-radar.html); [Kaspersky](https://usblog.kaspersky.com/watching-through-walls/)
- In July 2021 the FBI solicited "Range-R 2D Link Long-Range, Thru-Wall Radar" from authorized L3Harris resellers. — [SAM Daily archive](https://samdaily.us/archive/2021/07-July/28-Jul-2021/FBO-06073596.htm)
- Privacy concerns about warrantless use were raised (ACLU's Christopher Soghoian). — [NPR 2015](https://www.npr.org/sections/thetwo-way/2015/01/21/378851217/new-tools-let-police-see-inside-peoples-homes)
- **Camero Xaver** (Xaver 100/400/800/1000, XLR-40 long-range) is a through-wall imaging radar in service with military, security and rescue services. The company does not disclose Xaver 1000 pricing. — [EDR Magazine: Xaver 1000](https://www.edrmagazine.eu/much-improved-through-the-wall-situational-awareness-with-cameros-xaver-1000); [EDR Magazine: XLR-40](https://www.edrmagazine.eu/xlr-40-an-urban-long-range-sense-through-the-wall-radar-from-camero); [Janes](https://www.janes.com/defence-intelligence-insights/defence-news/defence/eurosatory-2022-camero-unveils-latest-through-the-wall-system)
- **Aqara Presence Sensor FP2**: 60 GHz mmWave, wired, with zone positioning, multi-person and fall detection. US deal prices were $57.98 (Nov 2024, against an $86 reference); AU$167 on sale. — [Slickdeals](https://slickdeals.net/f/19115323-aqara-presence-sensor-fp2-mmwave-radar-wired-smart-motion-sensor-zone-positioning-multi-person-fall-detection-homekit-alexa-google-home-and-home-assistant-57-9-57-99); [OzBargain](https://ozbargain.com.au/node/795710)
- The FP2's high sensitivity "can lead to triggers through thin walls or glass." — [The Smart Cave](https://thesmartcave.com/?p=6718)
- **HLK-LD2410 (24 GHz)** vs FP2 (60 GHz): the FP2's higher resolution enables zones. The LD2410 is fine for basic presence and is "more comparable to the FP1." — [Home Assistant Community](https://community.home-assistant.io/t/what-are-the-best-options-for-mmwave-currently/621544). Apollo Automation's comparison table lists LD2410/LD2450-based sensors at roughly $26–$78 and the FP2 at $82.99. — [Apollo Automation wiki](https://wiki.apolloautomation.com/products/general/comparisons)
- **Vayyar Care** (radar wall unit for fall detection) costs $244 at launch with Amazon Alexa Together, and was later listed at $195.59 (sold out) on Woot. It requires an Alexa Together subscription. — [Israel21c](https://archive.israel21c.org/?p=117534); [Woot](https://sellout.woot.com/offers/vayyar-care-fall-detection). The earlier **Walabot Home** fall sensor was cut from $250 to $150 in 2019. — [VentureBeat](https://venturebeat.com/ai/vayyar-knocks-40-off-its-walabot-home-fall-sensor-3-months-after-launch)
- **Google Nest Hub (2nd gen)** uses Soli radar for contactless sleep sensing and launched at $99 with Sleep Sensing as a free preview. — [Pocketnow](https://pocketnow.com/googles-new-nest-hub-features-soli-radar-for-sleep-sensing-and-costs-99); [Gigazine](https://gigazine.net/gsc_news/en/20210317-google-new-nest-hub-sleep-sensing)

### Inferences
- There is a clear price/capability ladder:
  - **Phone apps ($0):** fake, or throttled RSSI.
  - **WiFi sensing ($0 extra with ISP gateway, or about $5–$10 ESP32):** coarse motion, crosses walls incidentally.
  - **Consumer mmWave ($15–$90):** reliable in-room presence including stationary people, short range, partially penetrates thin walls.
  - **Professional through-wall radar ($6,000+ to undisclosed):** purpose-built to detect and locate people behind walls.
- mmWave (60 GHz) is attenuated much more by walls than 2.4/5 GHz WiFi or the lower-frequency radar used by Range-R/Xaver. That is why consumer mmWave stays mostly in-room, while law-enforcement radars use lower-frequency bands designed for penetration (general RF knowledge; frequency specifics not sourced here).

### Gaps
- No current (2024–2026) Range-R pricing was found; the $6,000 figure is from 2015. Camero pricing is not public.
- Current 2026 status of Nest Hub Sleep Sensing (still offered, paywalled under Fitbit Premium, or discontinued) was not confirmed. Only a February 2026 Reddit comment suggesting the 2nd-gen hub is not discontinued was found, which is not reliable.
- LD2450 specifics (multi-target tracking) and current Aqara FP2 MSRP were not confirmed from vendor pages.
- Vayyar's current consumer product line/status in 2026 was not verified.

---

## 6. Bluetooth 6.0 Channel Sounding for presence detection (as of 2026)

### Takeaway
Bluetooth Channel Sounding (CS) is a **device-to-device ranging** feature (about ±20 cm in early implementations) now supported by chips such as Nordic's nRF54H series. Its shipping use cases in 2026 are digital keys, smart locks and finding devices. **No shipping consumer product or app using Channel Sounding for device-free presence/people detection was found.** Human-detection uses exist only in research, such as one 2025 in-vehicle study. CS also needs CS-capable hardware on both ends.

### Cited Findings
- Bluetooth SIG describes Channel Sounding as fine ranging, with early implementations at about ±20 cm accuracy. A Bluetooth Ranging Profile specification is still in development. The SIG advises checking with manufacturers for actual range/performance. — [Bluetooth SIG: Channel Sounding](https://www.bluetooth.com/learn-about-bluetooth/feature-enhancements/channel-sounding/)
- Channel Sounding adds a new protocol stack including a new PHY, which may require a BLE IC upgrade (i.e., older phones/chips cannot simply get it via software). — [All About Circuits](https://www.allaboutcircuits.com/industry-articles/bluetooth-channel-sounding-unlocks-new-distance-ranging-applications/)
- Nordic's nRF54H series supports CS, which the vendor pitches for "distance and presence detection applications." — [EPDT](https://www.epdtonthenet.net/article/208326/Wireless-SoCs-Supporting-Bluetooth-6-0-Channel-Sounding.aspx)
- OpenSynergy discussed CS for secure localization, including presence detection, at embedded world 2026. — [OpenSynergy](https://www.opensynergy.com/bluetooth-channel-sounding-secure-localization)
- A 2026 industry outlook expects CS to support proximity services (digital keys, precise device discovery) and smart locks (relay-attack protection). — [WIoT Group](https://wiot-group.com/think/en/news/bluetooth-2026-ble-iot-audio-sensing-precision/); [Rutronik](https://www.rutronik.com/article/precise-ranging-with-bluetooth-channel-sounding-expands-ble)
- Home Assistant community discussion notes CS needs a CS-capable tag *and* a CS-capable anchor/proxy. — [HA Community: BT 6.0 Channel Sounding](https://community.home-assistant.io/t/bluetooth-6-0-channel-sounding-hadm-for-distance-measurement/925227)
- Research: a 2025 IEICE study used CS phase data with ML to detect humans in vehicles, reporting recall 0.982 and precision 1.0. This was a lab study, not a product. — [IEICE](https://ken.ieice.org/ken/paper/20250306gcJS/eng/)

### Inferences
- Channel Sounding measures distance between *two cooperating Bluetooth devices*. It can tell you a known phone/tag is about 3 m away, which strengthens device-based proxies (Q4). Device-free body detection with CS remains experimental, analogous to WiFi CSI sensing years ago.
- Any 2026 app claiming to use "Bluetooth 6" to see people through walls should be treated as unsupported marketing.

### Gaps
- No list of 2026 phones/devices shipping with CS enabled at the OS/app level was obtained in this session.
- No evidence was found of Home Assistant/ESPHome shipping CS-based room presence. The community thread is a discussion, not a release.
