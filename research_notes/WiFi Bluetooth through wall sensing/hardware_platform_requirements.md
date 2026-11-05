# Hardware, Firmware and OS Requirements for WiFi/Bluetooth Human Sensing (status as of Nov 2026)

Scope: what you need (chips, firmware, OS access, APIs, tooling) to capture radio data suitable for presence, motion, breathing and localization sensing, and what blocks doing it on a stock smartphone. Product reviews are out of scope (covered by another researcher).

## Q1. Which WiFi chipsets/tools can extract CSI today, and what are their capabilities?

### Takeaway
CSI extraction in practice still runs on a small set of hacked or research-firmware platforms. The ones that are current and practical in 2026 are: ESP32-family MCUs through Espressif's official CSI API (the cheapest, and the ESP32-C5 adds 5 GHz and WiFi 6 HE20 with 245 subcarriers); Raspberry Pi 3B+/4B/5 through Nexmon CSI (up to 80 MHz); and Intel AX200/AX210 under PicoScenes (802.11ax up to 160 MHz, plus 6 GHz on the AX210). The Intel 5300 and Atheros ath9k tools still work but depend on obsolete 802.11n hardware. No commercial WiFi 7 NIC with a public CSI tool was found; WiFi 7 (EHT, 320 MHz) CSI is available only through SDRs under PicoScenes.

### Cited Findings

**Intel 5300 Linux 802.11n CSI Tool (dhalperi). Obsolete hardware.**
- It reports CSI for 30 subcarrier groups per measurement; "Intel's implementation only supports the versions that measure 30 subcarriers each" (Ng=2 at 20 MHz, Ng=4 at 40 MHz). — [Linux 802.11n CSI Tool FAQ](https://dhalperi.github.io/linux-80211n-csitool/faq.html)
- The card has up to 3 receive and 3 transmit antennas, covers 20 and 40 MHz channels, and records CSI only for 802.11n HT rates (MCS 0–23). — [CSI Tool FAQ](https://dhalperi.github.io/linux-80211n-csitool/faq.html)
- The author found monitor mode with packet injection the most effective mode. Client, AP and ad-hoc modes are described as unreliable. Users cannot reprogram the modified firmware. Source code exists as a csitool-3.13 branch, which corresponds to the Linux 3.13 kernel era. — [CSI Tool FAQ](https://dhalperi.github.io/linux-80211n-csitool/faq.html)
- A later 802.11ax tool paper describes the 5300's spectral resolution as "limited to 30 values corresponding to 'subcarrier groups'" and says the Atheros tool offers finer quantization. — [AX-CSI paper (Univ. of Brescia)](https://ans.unibs.it/assets/documents/axcsi.pdf)

**Atheros CSI Tool (ath9k). Obsolete 802.11n hardware.**
- It is built on the open-source ath9k Linux driver and was tested on the AR9580, AR9590, AR9344 and QCA9558. — [xieyaxiongfly/Atheros-CSI-Tool](https://github.com/xieyaxiongfly/Atheros-CSI-Tool)
- It reports 56 subcarriers at 20 MHz and 114 at 40 MHz, with 10-bit resolution for both the real and imaginary parts. — [Atheros CSI tool OpenWRT wiki](https://github.com/xieyaxiongfly/Atheros_CSI_tool_OpenWRT_src/wiki/Getting-started-with-Atheros-CSI-tool). The wiki page is roughly 9 years old.
- A 2026 paper used an AR9580 with 2 antennas at 20 MHz and 56 subcarriers. It notes the tool works only on the AR93/94/95 series because it was developed on the ath9k (ar9003) driver. — [CSI-RFF, arXiv 2602.22738](https://arxiv.org/html/2602.22738)

**Nexmon CSI (Broadcom/Cypress, seemoo-lab)**
- Officially supported chips, firmware and devices:
  - bcm4339, fw 6_37_34_43: Nexus 5
  - bcm43455c0, fw 7_45_189: Raspberry Pi 3B+, 4B and 5
  - bcm4358, fw 7_112_300_14_sta: Nexus 6P
  - bcm4366c0, fw 10_10_122_20: Asus RT-AC86U

  — [seemoo-lab/nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)
- It extracts CSI "with up to 80 MHz bandwidth" and documents 20, 40 and 80 MHz CSI layouts. Packet headers carry core and spatial-stream fields; the docs show a bcm4358 capture with 2 cores and 2 streams. — [nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)
- The phones must be rooted ("Attach your rooted Nexus 5 or Nexus 6P smartphone"). The phone build uses Android NDK r11c, and the guides target Xubuntu 16.04 and 18.04.3. On the Pi, recent kernels can use `Makefile.rpi`, which "no longer require[s] a modified brcmfmac driver". The router build works only on 64-bit ARM devices and needs SSH. — [nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)
- No other phones are listed. The FAQ says other Broadcom/Cypress chips may be portable and asks users to contact the maintainers. — [nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)

**PicoScenes (Intel AX200/AX210, QCA9300, Intel 5300, SDRs)**
- Intel AX210 (WiFi 6E): CSI for "all Wi-Fi formats (802.11a/g/n/ac/ax)" with "up to 160 MHz bandwidth", plus packet injection and CSI in the 6 GHz band ("a total of 1.18 GHz" of spectrum). It can measure CSI from overheard frames in monitor mode. — [PicoScenes site](https://ps.zpj.io/)
- Intel AX200: the same 802.11ax CSI at up to 160 MHz. The site lists 6 GHz only for the AX210. — [PicoScenes](https://ps.zpj.io/)
- QCA9300: arbitrary carrier and sampling-rate tuning ("2.5 to 80 MHz bandwidth"), manual Rx gain from 0 to 66 dB, and HT-ELTF transmission. — [PicoScenes](https://ps.zpj.io/)
- The IWL5300 is also supported.
- SDRs (HackRF One, all USRP models): "Full Protocol Compliance up to Wi-Fi 7" (EHT-SU, added 1 Nov 2023), 20 to 320 MHz bandwidth, MCS 0–13, up to 4x4 MIMO. — [PicoScenes](https://ps.zpj.io/)
- A "Radar mode" for SISO, SIMO, MIMO and multi-device MIMO was added on 12 May 2024, the most recent dated feature on the site. — [PicoScenes](https://ps.zpj.io/)
- Ubuntu 22.04 has been the official OS since 19 Mar 2024. A Dec 2023 note promised a move to 24.04, which the site does not confirm. The software ships as a .deb package. — [PicoScenes](https://ps.zpj.io/)
- Licensing: a 2 Dec 2023 license update "removed all limitations for COTS NICs", including 6 GHz and 80/160 MHz 802.11ax injection, and removed more than 10 SDR limitations. The site gives no prices. — [PicoScenes](https://ps.zpj.io/)
- The site does not mention the Intel AX211 or BE200 (WiFi 7). — [PicoScenes](https://ps.zpj.io/)

**ESP32 family (Espressif esp-csi / ESP-IDF CSI API)**
- "All ESP32-series chips" support CSI: ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C5, ESP32-C6 and ESP32-C61. — [espressif/esp-csi](https://github.com/espressif/esp-csi)
- The repo's examples:
  - `csi_recv`: ESP32 as receiver
  - `csi_send`: ESP32 as sender
  - `csi_recv_router`: a home router acts as the sender, triggered by pings from the ESP32
  - esp-radar `wifi_sensing_demo`: motion and presence detection with on-site training and a Web Serial monitor
  - `connect_rainmaker`: cloud upload

  An external IPEX antenna is recommended over the directional PCB antenna. — [esp-csi](https://github.com/espressif/esp-csi)
- Subcarriers: the original ESP32 gives about 52 or 56 subcarriers. The ESP32-C5 gives 245 subcarriers from an HE20 frame (490-byte record). Other C5 record sizes:
  - L-LTF: 106 bytes; with 12-bit packing that is 26 tones
  - HT20: 114 bytes
  - HT40: 234 bytes

  — [Scwan/esp32c5-csi-examples](https://github.com/Scwan/esp32c5-csi-examples) (community repo; its author says "No part of this has met a radio")
- ESP32-C5 constraints:
  - First Espressif part with CSI on 5 GHz; it is a WiFi 6 radio.
  - Receives only 20 MHz frames, plus 40 MHz in 11n if configured. Frames at 80 or 160 MHz are not received, so a busy channel can look silent.
  - Espressif has said 40 MHz on 11ax will not be added.
  - Default regulatory settings allow only channels 36–60.
  - Enabling CSI silently turns off HE-SIG-B dumping.
  - The first 4 bytes of the CSI buffer are junk.

  — [Scwan/esp32c5-csi-examples](https://github.com/Scwan/esp32c5-csi-examples)
- The C5 runs on only one band (2.4 or 5 GHz) at a time, selected with `esp_wifi_set_band_mode()`. `wifi_csi_acquire_config_t.acquire_csi_force_lltf` chooses whether HT/VHT/HE-LTF or legacy LTF CSI is reported. — [ESP-IDF v5.5.4 Wi-Fi Driver, ESP32-C5](https://docs.espressif.com/projects/esp-idf/en/v5.5.4/esp32c5/api-guides/wifi.html)
- Known issues:
  - [esp-idf #18493](https://github.com/espressif/esp-idf/issues/18493) reported static CSI on the C5 at 5 GHz. According to the community repo, Espressif closed it as a parsing mistake (12-bit L-LTF data read as 8-bit). — [Scwan repo](https://github.com/Scwan/esp32c5-csi-examples)
  - [esp-idf #14271](https://github.com/espressif/esp-idf/issues/14271): "ESP32-C6 not reporting L-LTF data in WiFi CSI callback and wrong subcarrier order for HT-LTF".
  - The C5 was a preview target before ESP-IDF v5.5.2. — [Scwan repo](https://github.com/Scwan/esp32c5-csi-examples)

**MediaTek, Realtek, 802.11ax routers and WiFi 7**
- MediaTek: there is no official tool. A community project, MtkCSIdump, extracts CSI by patching the mt76 driver and was tested on mt7981-based routers. Its authors warn that WiFi 7 cards "might need a different interpretation of the CSI data." — [OpenWrt Forum: CSI Extraction for Mediatek](https://forum.openwrt.org/t/csi-extraction-for-mediatek-based-wi-fi-chipsets/244703)
- Realtek: no CSI extraction tool or documentation was found. — (search found none; see Gaps)
- AX-CSI is a published CSI extractor for commercial 802.11ax platforms. — [AX-CSI paper](https://ans.unibs.it/assets/documents/axcsi.pdf). Exact chipset and bandwidth details were not checked this session.
- A 2023 overview of the standard notes that most WiFi chipset manufacturers keep CSI access as a private feature with no consumer-facing interface. — [An Overview on IEEE 802.11bf, arXiv 2310.17661](https://arxiv.org/pdf/2310.17661)

### Inferences
- **Recommended hardware tiers for late 2026:**
  - Low cost: ESP32-S3 or ESP32-C6 for 2.4 GHz; ESP32-C5 for 5 GHz HE20 with 245 subcarriers. One antenna, SISO.
  - Mid tier: Raspberry Pi 4B/5 with Nexmon, 20/40/80 MHz on 5 GHz.
  - Research grade: Intel AX210 with PicoScenes for 160 MHz, 6 GHz and MIMO.
  - SDR (USRP) with PicoScenes for WiFi 7, 320 MHz or custom waveforms.
- **Obsolete platforms:** the Intel 5300 (an 802.11n card from about 2009, kernel 3.13-era branch) and Atheros AR93xx–95xx (ath9k) are tied to obsolete hardware. They matter mainly because classic datasets were recorded on them (UT-HAR and Widar on the 5300; NTU-Fi and MM-Fi on Atheros; see Q5). Nexmon's phone targets (Nexus 5 from 2013, Nexus 6P from 2015, with NDK r11c and Xubuntu 16.04/18.04 guides) are also obsolete.
- **5 GHz detail is limited on low-cost hardware.** Only the Nexmon Pi and Intel/PicoScenes paths capture 80 MHz or more of commodity WiFi CSI. The ESP32-C5 cannot even receive 80/160 MHz frames, so it needs its own 20 MHz transmitter or an AP set to 20 MHz.
- **Raw CSI is stored at different resolutions:** 30 grouped subcarriers (5300), 56/114 (Atheros), up to 256 at 80 MHz (Nexmon, inferred from the 80 MHz layout), and 245 for HE20 on the C5. Cross-platform models therefore need resampling or interpolation. This matters for dataset transfer (see Q5).

### Gaps
- **Prices were not verified this session.** Unverified ballparks from general knowledge, not to be cited as fact: ESP32 dev boards about US$5–20; Raspberry Pi 4/5 about US$35–80; Intel AX210 M.2 cards about US$20–40; Intel 5300 and AR9580 only on the used or surplus market; HackRF about US$300+; USRP about US$1k–10k+. PicoScenes license cost after the Dec 2023 update is not stated on its site.
- **ESP32 CSI sample rates:** no authoritative figure was found. Rate depends on the traffic or ping rate and on output bandwidth; a 115200-baud serial link carries only about 6 HE20 lines per second ([Scwan](https://github.com/Scwan/esp32c5-csi-examples)), so UART/USB/UDP throughput is the practical limit.
- **Intel AX211 and BE200 (WiFi 7):** whether PicoScenes supports them could not be confirmed. The AX211 is a CNVi part that is usually soldered or vendor-locked; that is general knowledge, not verified here.
- **AX-CSI details** (supported Broadcom chip and router model, maximum bandwidth) were not fetched.
- **Atheros antenna count:** no source here explicitly confirms a 3x3 configuration for the AR9580.
- **Maintenance status:** no commit dates were retrieved for nexmon_csi or esp-csi. The Intel 5300 tool shows no active development.

## Q2. Android: what WiFi/Bluetooth data can an ordinary app access, and is CSI accessible?

### Takeaway
A stock Android app can get throttled WiFi scan RSSI (4 foreground scans per 2 minutes), WiFi RTT/FTM distance to cooperating APs or Wi-Fi Aware peers (802.11mc, and 802.11az NTB on Android 15+), BLE advertisement RSSI (about 5 scan starts per 30 s), and on Android 16 the unified Ranging API (UWB, BLE Channel Sounding, Wi-Fi NAN RTT, BLE RSSI). All of these are cooperative ranging or coarse RSSI. No public Android API exposes CSI or raw I/Q. The only documented path to CSI on a phone is Nexmon on rooted Nexus 5 or 6P devices; no current phone is supported.

### Cited Findings

**WiFi scanning (WifiManager)**
- Throttling:
  - Android 8.0/8.1: each background app can scan once per 30 minutes.
  - Android 9 and later: each foreground app can scan 4 times in 2 minutes, and all background apps combined can scan once per 30 minutes.
  - Android 10 and later: same limits, plus a developer option (Developer Options > Networking > Wi-Fi scan throttling) to turn throttling off for local testing.

  — [Android Developers: Wi-Fi scanning overview](https://developer.android.com/develop/connectivity/wifi/wifi-scan)
- Permissions on Android 10 and later: `startScan()` requires ACCESS_FINE_LOCATION (when targeting API 29+), CHANGE_WIFI_STATE, and location services turned on. `getScanResults()` requires ACCESS_FINE_LOCATION and ACCESS_WIFI_STATE. — [Wi-Fi scanning overview](https://developer.android.com/develop/connectivity/wifi/wifi-scan)
- From Android 10, the `SCAN_RESULTS_AVAILABLE_ACTION` broadcast fires for any full scan by the platform or other apps, so an app can passively receive scan results without starting its own scans. — [Wi-Fi scanning overview](https://developer.android.com/develop/connectivity/wifi/wifi-scan)

**WiFi RTT (802.11mc FTM and 802.11az)**
- Introduced in Android 9 (API 28). Ranging to 3 or more APs is "typically accurate within 1-2 meters". RTT operations are unlimited for foreground apps and throttled in the background. — [Android Developers: Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Android 15 (API 35) added IEEE 802.11az non-trigger-based (NTB) ranging, indicated by `CHARACTERISTICS_KEY_BOOLEAN_NTB_INITIATOR`. — [Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Requirements:
  - The access point must implement 802.11-2016 FTM or 802.11az NTB.
  - The app must hold NEARBY_WIFI_DEVICES (API 33+) or ACCESS_FINE_LOCATION.
  - Location and WiFi scanning must be enabled.
  - The app must be visible or running a foreground service.

  — [Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- Data returned per measurement:
  - distance (mm) and its standard deviation
  - RSSI and timestamp
  - attempted and successful measurement counts
  - for 802.11az: LTF repetition counts and number of Tx/Rx spatial streams

  No CSI or channel impulse response is returned. — [Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)
- RTT-capable phones listed by Google include Pixel 1 through Pixel 9, many Samsung Galaxy S, A and Note models, Xiaomi and LG phones, and Zebra enterprise devices. RTT-capable APs include Google Nest Wifi (Pro), Aruba AP-5xx/6xx/7xx and Cisco 91xx; some Cisco CW917x and Aruba AP7xx models support both mc and az. — [Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt)

**BLE scanning**
- Since Android 7.0, an app can start or stop scans only about 5 times in 30 seconds. Exceeding this fails silently: there is no `onScanFailed`, and Android waits 30 s. Scans running longer than 30 minutes are converted to opportunistic scans, which only return results when another app's non-opportunistic scan sees them. — [Punch Through: Android BLE scan errors](https://punchthrough.com/android-ble-scan-errors/); [ProAndroidDev: BLE beacons](https://proandroiddev.com/to-find-a-beacon-without-losing-it-my-journey-into-a-realm-of-bluetooth-low-energy-on-android-aa3e2c2923aa). This limit is undocumented: it appeared in a Nougat preview and was later removed from the official docs.

**Android 16 Ranging module and Bluetooth Channel Sounding**
- Android 16 added a unified Ranging module (`RangingManager`) covering UWB, Bluetooth Channel Sounding, Wi-Fi NAN RTT and Bluetooth RSSI ranging. It uses a single `android.permission.RANGING` permission, and all participating devices must run Android 16 or later. — [Android Developers: Range between devices](https://developer.android.com/develop/connectivity/ranging)
- Restrictions:
  - Third-party apps can range in the background only with UWB.
  - For every technology except UWB, ranging data is delivered only to the initiator.
  - Ranging may be limited for battery, performance or memory reasons.

  Each session needs a peer device acting as responder. — [Range between devices](https://developer.android.com/develop/connectivity/ranging)
- Channel Sounding classes include `BleCsRangingCapabilities` and `BleCsRangingParams`. — [android.ranging.ble.cs reference](https://developer.android.com/reference/android/ranging/ble/cs/package-summary)
- **DistanceMeasurementManager is the older system API, not available to ordinary apps.** AOSP commits gate it behind the `channel_sounding_25q2_apis` flag, and methods such as `getChannelSoundingMaxSupportedSecurityLevel` require BLUETOOTH_PRIVILEGED. A `FEATURE_BLUETOOTH_LE_CHANNEL_SOUNDING` feature flag indicates hardware support. — [AOSP Bluetooth module commit mirror (/e/OS GitLab)](https://gitlab.e.foundation/e/os/android_packages_modules_bluetooth/-/commit/1946103c78b993356b6efa5b13cb075496290d47) (based on search snippets; the commit text was not read in full)
- **Phones with Channel Sounding:** the Pixel 10 was the first phone ("any model works"), and the Pixel 9 gained support on the latest Android 16 release (update dated 2 Dec 2025). Pixel 10a support was unconfirmed. Android's ranging algorithms are undisclosed, and the post does not say whether any raw tone or I/Q data reaches apps. — [Nordic DevZone blog (22 Oct 2025, updated 16 Jun 2026)](https://devzone.nordicsemi.com/nordic/nordic-blog/b/blog/posts/evaluating-bluetooth-channel-sounding-with-our-open_2d00_source-android-app-on-google-pixel-10)
- As of June 2025, the Pixel Watch 3 was reported as the first Android device with Channel Sounding, and no phone yet had it. — [Android Authority](https://www.androidauthority.com/p-3571567/). This is superseded by the Pixel 10/9 status above.

**CSI on Android**
- Root plus Nexmon works only on the Nexus 5 (bcm4339) and Nexus 6P (bcm4358). No other phones are listed. — [nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)
- No public Android API exposing CSI on any Qualcomm, MediaTek or Samsung phone was found. CSI access remains a private, vendor-controlled feature. — [802.11bf overview, arXiv 2310.17661](https://arxiv.org/pdf/2310.17661)

### Inferences
- **What a stock app can do:** device-free sensing is limited to coarse RSSI-fluctuation methods. WiFi RSSI arrives at roughly 1 sample per 30 s in the foreground (4 scans per 2 min), which is useless for breathing or motion. BLE advertisement RSSI is faster but duty-cycled by the scan limits.
- **Ranging APIs are cooperative:** RTT, Channel Sounding and UWB measure distance to a cooperating device, not reflections from a person. They suit localizing a phone or tag, not device-free sensing of a person without a device.
- **Without CSI:** the practical route is "phone as UI or controller" plus external sensing hardware (an ESP32 or Pi capturing CSI), rather than the phone's own radio.
- **Root on modern phones:** Qualcomm and MediaTek firmware is closed and signed, so CSI there would need vendor diagnostic tools. No public, reproducible tool was found (see Gaps).

### Gaps
- No exhaustive, official list of Channel Sounding-capable Android phones (beyond Pixel 9/10) was found. Samsung and other OEM support is unverified.
- No evidence was found either way on whether Android's Channel Sounding stack exposes per-tone phase or I/Q to apps, or whether privileged or system apps can obtain it.
- No public CSI tool for Qualcomm or MediaTek smartphone WiFi (e.g., via vendor QXDM/diag logging) was found. Absence of evidence, not proof.
- Exact BLE scan-throttle numbers on Android 15/16/17 are not officially documented.

## Q3. iOS: what can an app access, and is device-free sensing feasible?

### Takeaway
iOS gives third-party apps no WiFi scanning API, no usable WiFi RSSI, and no CSI. CoreBluetooth BLE RSSI and Nearby Interaction UWB ranging (a cooperative, peer or accessory-based method) are the only radio measurements available. Device-free WiFi or BLE sensing on a stock iPhone is effectively infeasible. An iPhone can only act as a front end for external sensing hardware.

### Cited Findings
- `NEHotspotNetwork.fetchCurrent()` returns SSID and BSSID, but developers report that `signalStrength` is always 0.0, including on iOS 18. — [Apple Developer Forums thread 733598](https://developer.apple.com/forums/thread/733598); [thread 128844](https://developer.apple.com/forums/thread/128844)
- Asked whether there is a supported way to get current WiFi RSSI on iOS 18, an Apple DTS engineer answered "No", adding that this is true for all iOS versions. — [Apple Developer Forums thread 835163](https://developer.apple.com/forums/thread/835163)
- Signal strength is only reachable through NEHotspotHelper, which needs special entitlement approval. Even then, the app gets real-time updates only for networks it manages; for unmanaged networks it gets a stale RSSI from connection time. — [Apple Forums thread 751316](https://developer.apple.com/forums/thread/751316); [thread 51705](https://developer.apple.com/forums/thread/51705)
- iOS has no general-purpose WiFi scanning API (Apple's TN3111 lists the WiFi APIs that exist). Apple's guidance is that Core Bluetooth gives easy access to BLE signal strength. — [Apple Forums thread 788783](https://developer.apple.com/forums/thread/788783); [thread 659006 (low-level WiFi data)](https://developer.apple.com/forums/thread/659006)
- iPhone UWB (Nearby Interaction) can interoperate with Android 16's Ranging module through the Apple Nearby Interaction Accessory Protocol (unicast DS-TWR). This is two-device, cooperative ranging. — [Android Developers: Range between devices](https://developer.android.com/develop/connectivity/ranging)

### Inferences
- The only iOS-native sensing paths are BLE RSSI from beacons (coarse occupancy or proximity, requiring a device to carry or place a beacon) and UWB ranging to a peer or accessory. Neither gives device-free breathing or motion sensing.
- An iOS product would have to offload sensing to external CSI hardware (ESP32, Pi, or a WiFi-sensing-capable router) and use the phone only to display results.

### Gaps
- No public documentation or credible report of CSI access on iPhone, even jailbroken, was found.
- Nearby Interaction details (whether raw UWB channel impulse response is available, and whether UWB radar mode exists on iPhone) were not researched in depth. No source here suggests either is available to apps.

## Q4. Monostatic (phone senses by itself) vs. separate transmitter and receiver; the role of routers/APs

### Takeaway
Practical commodity WiFi sensing is bistatic. One device transmits (often an existing router, an ESP32 sending packets, or an AP replying to pings), and a separate device receives and logs CSI. Smartphone radios offer no API for monostatic sensing, where a device transmits and receives its own reflections. Monostatic or radar-style operation is documented only on SDRs and research tooling (PicoScenes "Radar mode") and in the 802.11bf standard, which has no confirmed shipping implementation.

### Cited Findings
- Espressif's reference examples include `csi_send` (an ESP32 transmitter) paired with `csi_recv` (an ESP32 receiver), and `csi_recv_router`, where "router as sender" is "triggered by ESP32 Ping". This is the standard way to use an existing home router as the illuminator while a $5–15-class MCU captures CSI. — [espressif/esp-csi](https://github.com/espressif/esp-csi)
- Nexmon CSI on a Raspberry Pi captures CSI from frames sent by other devices (filtered by source MAC, up to 80 MHz). The Asus RT-AC86U target lets a router itself be the CSI receiver. — [nexmon_csi](https://github.com/seemoo-lab/nexmon_csi)
- PicoScenes on an Intel AX210 can measure CSI from overheard frames in monitor mode. It also supports packet injection, so one NIC can transmit while another receives. — [PicoScenes](https://ps.zpj.io/)
- PicoScenes added "Radar mode" in May 2024 for SISO, SIMO, MIMO and multi-device MIMO, a radar-like mode in a research tool. — [PicoScenes](https://ps.zpj.io/)
- The ESP32-C5 does not receive 80 or 160 MHz frames. If the router uses wide channels, the ESP32 sees no traffic to measure, so the transmitter's channel width must match what the receiver can decode. — [Scwan/esp32c5-csi-examples](https://github.com/Scwan/esp32c5-csi-examples)
- The Intel 5300 tool's author found monitor mode with injection the most reliable setup; client, AP and ad-hoc modes were described as unreliable. — [CSI Tool FAQ](https://dhalperi.github.io/linux-80211n-csitool/faq.html)
- On Android, Wi-Fi RTT, Channel Sounding and UWB ranging all need a cooperating peer (AP, Wi-Fi Aware peer, or Ranging responder), and results go only to the initiator for non-UWB technologies. — [Wi-Fi RTT](https://developer.android.com/develop/connectivity/wifi/wifi-rtt); [Range between devices](https://developer.android.com/develop/connectivity/ranging)

### Inferences
- **Phones cannot sense on their own.** No public smartphone API runs WiFi or BLE in monostatic mode, where the radio would capture the echo of its own transmission. Standard WiFi radios do not report CSI for their own transmitted frames. A phone could at most be the transmitter (generating traffic) in a bistatic link if a separate receiver logs CSI. This is an inference from the lack of any API; it was not confirmed by a single source.
- **Minimum viable setup:**
  1. Existing router as transmitter on a 20 MHz (2.4 GHz) or 20/40/80 MHz (5 GHz) channel.
  2. An ESP32, or a Pi with Nexmon, as the CSI receiver.
  3. A traffic generator (ping or UDP at a fixed rate) to set the CSI sampling rate.
  4. A host (PC or Pi) running the processing pipeline.

  Placing transmitter and receiver on opposite sides of the monitored area (line of sight through the target zone) is the usual geometry. Through-wall sensing depends on 2.4 or 5 GHz penetration and link geometry.
- **Routers and APs as receivers:** WiFi-sensing-capable APs (e.g., Broadcom routers via Nexmon, or MediaTek mt7981 via MtkCSIdump) can act as receivers that are already present, which is the model most commercial "WiFi motion" products use (another researcher covers products).

### Gaps
- No source was found specifying which hardware (SDR only vs. AX210) PicoScenes Radar mode runs on, or its achievable range resolution.
- Whether 802.11bf's sub-7 GHz procedures include monostatic operation on commodity radios was not verified from the standard text (see Q6).

## Q5. Software stack: signal-processing pipeline, ML approaches, public datasets and toolkits

### Takeaway
A typical pipeline is: parse vendor CSI → phase sanitization (linear-fit removal of timing and frequency offsets, conjugate multiplication, or antenna phase difference) → outlier removal (Hampel filter) → dimensionality reduction (PCA across subcarriers) → task-specific features (band-pass about 0.1–0.5 Hz for breathing, 0.8–2 Hz for heart rate; Doppler spectrograms for activity) → classical ML or deep learning. SenseFi remains the standard open benchmark library (UT-HAR, Widar, NTU-Fi). Newer resources include MM-Fi (multimodal), CSI-Bench (NeurIPS 2025, in-the-wild), the SDP reproducibility protocol (Jan 2026) and OpenCSI (July 2026).

### Cited Findings

**Pipeline steps**
- **Hampel filter:** described as a sliding median filter for outlier removal, used with a σ=3 threshold in an open-source ESP32 pipeline. That pipeline also sanitizes I/Q and phase by removing linear timing and frequency offsets, and uses Hampel + PCA denoising with a random-forest classifier for presence, motion and breathing-band detection. — [contactmridulhere-commits/wifi-csi-sensing](https://github.com/contactmridulhere-commits/wifi-csi-sensing)
- **Phase cleaning:** a SpotFi-style chain of raw CSI → conjugate multiplication → Hampel filter. Taking the phase difference between receive antennas cancels the random phase offset. — [WiFi-CSI-Human-Pose-Detection](https://github.com/euaziel/WiFi-CSI-Human-Pose-Detection); [Human Biometric Signals Monitoring based on WiFi, arXiv 2203.03980](https://arxiv.org/pdf/2203.03980)
- **Breathing:** PCA reduction followed by band-pass filtering to keep 6–33 breaths/min. — [VitalCSI (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12788229). Other work uses Butterworth band-pass filters to separate breathing and heartbeat components. — [WiFi-based real-time breathing and heart rate monitoring during sleep, arXiv 1908.05108](https://arxiv.org/pdf/1908.05108)
- **Other open tooling:** a CSI mining toolkit with scripts and datasets for breathing-rate monitoring — [AlbanyArmenta0711/WiFi-CSI-MiningTool](https://github.com/AlbanyArmenta0711/WiFi-CSI-MiningTool). Multi-person breathing via tensor decomposition — [TensorBeat, arXiv 1702.02046](https://arxiv.org/pdf/1702.02046).
- **Platform parsing:** the ESP32-C5 uses 12-bit L-LTF packing, which parses "cleanly" and plots "plausibly" if misread as 8-bit I/Q, so a platform-specific parser is required. — [Scwan/esp32c5-csi-examples](https://github.com/Scwan/esp32c5-csi-examples). Espressif ships `csi_data_read_parse.py`. — [esp-csi](https://github.com/espressif/esp-csi)

**Toolkits and benchmark datasets**
- SenseFi (Patterns, 2023) is a PyTorch library and benchmark of deep models evaluated on four datasets: UT-HAR and Widar (Intel 5300) and NTU-Fi HAR and NTU-Fi Human-ID (Atheros CSI Tool). Code: xyanchen/WiFi-CSI-Sensing-Benchmark. — [SenseFi (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10028433/); [GitHub](https://github.com/xyanchen/wifi-csi-sensing-benchmark); [arXiv 2207.07859](https://arxiv.org/pdf/2207.07859)
- CSI-Bench (NeurIPS 2025 Datasets & Benchmarks): a large in-the-wild, multi-task dataset collected on commercial WiFi edge devices across 26 indoor environments, 35 users and 7 classification tasks. Its comparison table lists MM-Fi (2023), which pairs Atheros CSI with synchronized video and depth. — [CSI-Bench paper](https://proceedings.neurips.cc/paper_files/paper/2025/file/f7c68372b3d39e8d7a093eb2edaaad87-Paper-Datasets_and_Benchmarks_Track.pdf)
- SDP (arXiv 2601.08463, Jan 2026), "A Unified Protocol and Benchmarking Framework for Reproducible Wireless Sensing", cites SenseFi, MM-Fi, WiMANS and CSI-Bench. Only its reference list was seen. — [arXiv 2601.08463](https://arxiv.org/pdf/2601.08463)
- OpenCSI (arXiv 2607.26665, Jul 2026), "Self-Calibration Layer for Heterogeneous Mesh Wireless Sensor Networks". Only the title was seen. — [arXiv 2607.26665](https://arxiv.org/pdf/2607.26665)
- Tsinghua's Wireless Sensing Tutorial has a "CSI Data Collection" tools page, which was not fetched. — [Tsinghua WST](https://tns.thss.tsinghua.edu.cn/wst/docs/tools/)

### Inferences
- **Hardware lock-in:** most benchmark datasets (UT-HAR, Widar, NTU-Fi, MM-Fi) were collected on obsolete Intel 5300 or Atheros NICs with 30 or 56/114 subcarriers. Models trained on them do not transfer directly to ESP32 (52–245 subcarriers, single antenna) or Nexmon (up to 80 MHz) data. Cross-device generalization is a known pain point, which the newer CSI-Bench and SDP efforts address.
- **Sampling rate:** breathing-band sensing (0.1–0.5 Hz) needs only modest CSI rates, but motion and Doppler features need a steady packet rate. A receiver fed by ping or injected traffic at a fixed rate is preferable to relying on bursty background traffic.

### Gaps
- Widar3.0 (Doppler / body-coordinate velocity profile), WiMANS (multi-user) and XRF55 details (size, hardware, sampling rate) were not fetched. The search returned nothing on WiMANS or XRF55 preprocessing.
- No 2025–2026 survey dedicated to WiFi CSI datasets was found.
- Doppler-spectrogram steps (CSI-ratio or conjugate multiplication, followed by STFT) are standard in the literature but were not sourced in this session.

## Q6. Regulatory/RF constraints and 802.11bf status

### Takeaway
In the US, sensing with standard WiFi frames from FCC-certified WiFi radios operates under the same Part 15 rules as ordinary WiFi (e.g., §15.247 at 2.4 and 5.8 GHz, plus the U-NII rules at 5 GHz). No sensing-specific rule or waiver exists for 2.4 or 5 GHz. Dedicated motion-sensing radar rules and waivers exist at 57–71 GHz (§15.255). IEEE 802.11bf (WLAN sensing) was approved in May 2025 and published in September 2025, but no shipping chipset or driver with confirmed 802.11bf support was found as of November 2026.

### Cited Findings
- §15.247 covers frequency-hopping and digitally modulated intentional radiators in the 902–928 MHz, 2400–2483.5 MHz and 5725–5850 MHz bands; it is a general rule, not a sensing rule. The 5 GHz U-NII bands carry DFS requirements, which concern avoiding radar, not doing radar sensing. — [eCFR 47 CFR Part 15](https://www.ecfr.gov/current/title-47/chapter-I/subchapter-A/part-15); [Wikipedia: U-NII](https://en.wikipedia.org/wiki/Unlicensed_National_Information_Infrastructure)
- §15.255 governs field disturbance sensors at 57–71 GHz. The FCC granted Google a waiver of §15.255(c)(3) allowing Soli to operate at up to +13 dBm EIRP in 57–64 GHz for short-range interactive motion sensing. Leica, IEE Sensing and Tesla have sought or received related waivers. — [FCC DA 18-1308 (Google Soli waiver)](https://docs.fcc.gov/public/attachments/DA-18-1308A1.pdf); [FCC DA 20-795](https://docs.fcc.gov/public/attachments/DA-20-795A1_Rcd.pdf); [FCC DA 21-407](https://docs.fcc.gov/public/attachments/DA-21-407A1.pdf); [FCC Public Notice DA 20-898 (Tesla)](https://docs.fcc.gov/public/attachments/DA-20-898A1.pdf)
- No FCC waiver or rule specific to WiFi-based motion sensing at 2.4 or 5 GHz was found. — (search found none)
- IEEE 802.11bf-2025 was approved 28 May 2025 and published 26 Sep 2025. It covers sensing in license-exempt bands from 1 GHz to 7.125 GHz and above 45 GHz. — [ANSI webstore: IEEE 802.11bf-2025](https://webstore.ansi.org/standards/ieee/ieee80211bf2025); [DIN Media](https://www.dinmedia.de/en/standard/ieee-802-11bf/396264893)
- A blog claims "every major chipset vendor — Qualcomm, Broadcom, MediaTek, Intel — is now implementing standardized sensing APIs", but gives no datasheet or product citation. This is unverified. — [Spatial Intelligence blog](https://www.spatialintelligence.ai/p/your-wifi-can-see-you-heres-how)
- Analysts expect commercial 802.11bf pilots in 2026 (buildings, security, elder care). This is a projection, not confirmed product availability. — [eonsr: What 802.11bf unlocks](https://eonsr.com/wi-fi-sensing-applications)
- CSI access is still kept as a private, vendor-controlled feature by most chipset makers. — [802.11bf overview, arXiv 2310.17661](https://arxiv.org/pdf/2310.17661)
- PicoScenes on SDRs supports transmitting full WiFi 7 (EHT) waveforms and custom configurations up to 320 MHz. — [PicoScenes](https://ps.zpj.io/)

### Inferences
- **Standard frames vs. custom waveforms:**
  - Standard frames: using unmodified 802.11 frames from certified radios (ESP32 modules, routers, Intel NICs) keeps the transmitter inside its existing equipment authorization. Sensing is a receiver-side interpretation of normal WiFi traffic, so no new authorization is needed for the transmit side.
  - Firmware that changes transmit behavior: Nexmon injection, QCA9300 arbitrary carrier and bandwidth tuning, or raised Rx/Tx settings could take a certified device outside its certified parameters.
  - SDR custom waveforms: transmitting from an SDR (USRP or HackRF) is an uncertified intentional radiator. In the US this generally calls for shielded or conducted testing, or an FCC experimental license (Part 5). That point is general regulatory knowledge, not sourced in this session.
- **802.11bf in practice:** as of November 2026 the standard is an approved document, with no evidence of driver or API exposure (e.g., Linux mac80211/nl80211, Android or iOS). Builders should not plan on 802.11bf-based APIs on phones or commodity NICs in the near term.
- **60 GHz option:** because of the >45 GHz (DMG) portion of 802.11bf and the §15.255 rules, 60 GHz radar (Soli-type) remains the regulatory-clean route for dedicated monostatic motion sensing. It does not penetrate walls, unlike 2.4 and 5 GHz.

### Gaps
- No chipset datasheet, driver release (ath12k, mt76, iwlwifi, brcmfmac) or vendor announcement confirming 802.11bf sensing support in a shipping product was found. A FreeBSD net80211 developer has hosted a document on 802.11bf-2025 ([people.freebsd.org/~adrian](https://people.freebsd.org/~adrian/net80211/80211bf-2025.pdf)), but its content was not reviewed.
- Wi-Fi Alliance certification for WiFi sensing (if any) was not researched.
- EU (ETSI EN 300 328 / EN 301 893) and other non-US rules for sensing were not researched.
- The 802.11bf text was not read, including which sensing roles (monostatic, bistatic, sensing-by-proxy) apply to sub-7 GHz commodity stations.
