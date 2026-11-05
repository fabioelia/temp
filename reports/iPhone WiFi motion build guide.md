# iPhone WiFi Motion Build Guide

**What this builds:** WiFi motion sensing for the other rooms of your own home, with your iPhone as the only screen you use. It is made from parts you can buy, with no soldering and no code. Each monitored room shows up in the iPhone **Home** app as an "Occupancy Sensor". It can trigger notifications and automations when someone moves in that room, even if you are on the other side of a wall.

**What it can't do:** an iPhone can't do this on its own. iOS gives apps no WiFi signal data at all, not even signal strength ([Apple DTS engineer](https://developer.apple.com/forums/thread/835163)). So the sensing happens in small, cheap WiFi boards, and the iPhone shows the results. This setup detects *movement*. A person sitting perfectly still will eventually read as "no one there" (see [Step 7](#7-add-still-person-detection-optional) for the fix). Use it only in spaces you control, and tell the people who live there (see the research report's legal section).

---

## Option 0: zero hardware, if you're on Xfinity

If you rent an Xfinity XB7 or newer gateway, **Xfinity WiFi Motion** already does this. It is part of Xfinity WiFi Shield, opt-in, and runs in the Xfinity iPhone app. It uses the links between the gateway and up to five stationary devices, such as a TV or smart speaker ([Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion); [TechCrunch, Aug 2026](https://techcrunch.com/2026/08/18/comcast-adds-motion-sensing-to-millions-of-its-newer-routers-with-a-privacy-catch/)).

Trade-offs:
- It can't tell you *which* room the motion is in.
- Comcast says it's "not a security service."
- Its terms let Comcast share motion data with third parties, including under subpoena, without notice.

If any of that is a problem, build the option below.

---

## Recommended: ESPectre WiFi motion nodes in Apple Home

### How it works

```
  [Your router] ~~~~ WiFi packets ~~~~> [ESP32 node]  --Matter-->  [iPhone Home app]
        \                                    ^
         \_____ a person moving here ________/
               changes the signal (CSI)
```

The ESP32 board pings your existing router many times a second. It reads the detailed signal data (channel state information, or CSI) from each reply. Someone moving anywhere along the router-to-board path disturbs that signal. The board runs the open-source **ESPectre** detector itself and reports occupancy to Apple Home over **Matter**. ESPectre's Matter build has been tested with Apple Home on an ESP32-S3 using an iPhone 15 on iOS 27.0.1 ([ESPectre Matter README](https://github.com/francescopace/espectre/blob/main/src/cpp/frontend/matter/README.md); [ESPectre 3.1.0 release](https://github.com/francescopace/espectre/releases/tag/3.1.0)).

Interior drywall is nearly transparent at 2.4 GHz (about 2–9 dB of loss), so the router and the board can be in different rooms. That is the point: the room being watched sits *between* or *near* them.

### Shopping list

| Item | Qty | Approx. price | Notes |
|---|---|---|---|
| **ESP32-S3 board**, e.g. Seeed XIAO ESP32-S3 | 1 per room | ~$8–12 (XIAO S3 listed at €11.50) | S3 is the board ESPectre validated with Apple Home. Prefer a board with an external-antenna (U.FL) connector. ([Botland](https://botland.store/1900-esp32-modules)) |
| USB-C power adapter (5 V, ≥1 A) + cable | 1 per room | ~$5–10 | Any phone charger works. Weak chargers cause resets. |
| **Home hub**: HomePod mini, HomePod, or Apple TV 4K | 1 (skip if you have one) | ~$99 for HomePod mini | Not strictly required to *add* Matter devices on iOS 18+, but needed for automations and for alerts when you're away from home ([Apple](https://support.apple.com/en-al/126198)) |
| A Mac or PC with desktop Chrome | 1, once | — | Only for flashing. iPhone Safari can't talk to USB boards. |

**Typical total for 3 rooms:** about $40–65 in boards and chargers, plus a hub if you don't already have one. These prices are estimates from current listings, so check before buying.

Avoid the ESP32-S2, which has no Bluetooth and so can't pair over Matter. The ESP32-C6 and C5 work but weren't the validated Apple Home boards. Tiny "SuperMini" boards with a PCB antenna lose about 6–10 dB of signal ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)).

### Step-by-step

#### 1. Check your WiFi
- **Router:** 2.4 GHz must be on, with 802.11n (WiFi 4) allowed on that band. ESPectre needs "a normal Wi-Fi 4 (802.11n) network on 2.4 GHz" ([ESPectre](https://github.com/francescopace/espectre)). Almost every home router qualifies.
- **iPhone:** put it on the same network. If your router uses separate 2.4 and 5 GHz network names, join the 2.4 GHz one while pairing ([Apple](https://support.apple.com/en-al/126198)).
- **Mesh systems:** if you have one, ESPectre's [Device settings](https://espectre.dev/tools/device-settings/) tool can lock each board to one access point. This keeps the signal path stable.

#### 2. Flash each board, once, from a computer
1. Plug the ESP32-S3 into the computer over USB.
2. Open **[espectre.dev/tools/flash](https://espectre.dev/tools/flash/)** in desktop Chrome. Use Chrome 151 or later; Edge can flash, but the settings and monitor tools may not work in it.
3. Choose the **Matter** firmware and the **release** channel, then flash.
4. Save the **Matter QR code** the installer shows. Take a photo with your iPhone, or screenshot it and label it with the room name.

#### 3. Place each board
- **Path:** put the board on the **far side of the room you want to watch**, so the straight line from the router to the board crosses that room. Movement *behind* the board, away from the router, is mostly invisible ([wifi-ghost](https://github.com/heyfinal/wifi-ghost)).
- **Height and walls:** mount it about 1–2 m (3–7 ft) up. Interior walls are fine. Metal, foil-backed insulation, mirrors and coated windows are not.
- **Plan:** use one board per room ("One board covers one area, so plan on one board per room" — [ESPectre](https://github.com/francescopace/espectre)).
- **Avoid:** keep boards away from ceiling fans, oscillating fans and HVAC vents, which can look like motion.

#### 4. Pair with your iPhone
1. Power the board where it will live.
2. Open the **Home** app, tap **+**, then **Add Accessory**, and scan that board's QR code.
3. Apple Home will warn that this is an **uncertified accessory**. That's expected, because the published images are development builds. Tap to add anyway.
4. Assign it to the room it covers. It appears as an **Occupancy Sensor**.

Repeat for each board.

#### 5. Calibrate
- **Baseline:** for the first ~10 seconds after each board powers on, keep the room **empty and still**. That is when it records its baseline.
- **Tuning:** if you get false alarms or misses, open **[espectre.dev/tools/monitor](https://espectre.dev/tools/monitor/)** in desktop Chrome on the same network. Watch the motion score with the room empty, then set the threshold just above that empty-room level. The default is 1.0. Apple Home has no sensitivity slider, so tuning is done from this tool ([ESPectre Matter README](https://github.com/francescopace/espectre/blob/main/src/cpp/frontend/matter/README.md); [HA Community](https://community.home-assistant.io/t/espectre-wi-fi-motion-detection-for-home-assistant/961251)).

#### 6. Set up alerts and automations on the iPhone
- **Alerts:** in the **Home** app, open the sensor and turn on **Notifications** for occupancy, either always or only when nobody is home.
- **Automations:** go to **Automations**, tap **+**, then **A Sensor Detects Something**, and pick the sensor. Trigger lights, scenes, or a notification.
- **Hub:** a home hub must be set up for automations and for alerts while you're away.

#### 7. Add still-person detection (optional)
WiFi CSI sees motion, not stillness. If you need to know someone is *still there*, for example asleep, reading or in a chair, add an mmWave radar sensor **inside** that room. Radar barely passes through walls, so it has to be in the room. It detects breathing-level movement:

| Sensor | Connects via | Price | Notes |
|---|---|---|---|
| **Aqara Presence Multi-Sensor FP300** | Matter over Thread | ~$50 MSRP ([TrackaLacker](https://www.trackalacker.com/articles/news/aqara-presence-sensor-fp300-price-specs-and-where-to-buy)) | Battery, about 2 years on Thread. Needs a Thread border router; a HomePod mini or Apple TV 4K is one ([MacRumors](https://www.macrumors.com/2025/11/12/aqara-fp-300-presence-sensor/)) |
| **Aqara Presence Sensor FP2** | 2.4 GHz WiFi, native HomeKit | ~$58–86 (2023–24 deal prices; check current) | Wired USB power. Zones, multi-person, fall detection. Can trigger through thin walls or glass ([The Smart Cave](https://thesmartcave.com/?p=6718)) |

In Apple Home, build automations on "WiFi node detects motion **OR** mmWave detects presence." The WiFi node covers the room's whole path across walls, and the radar confirms a still person.

#### 8. Test it before you trust it
Run these three checks on each room:

| Test | What to do | What should happen |
|---|---|---|
| Walk test | Walk the room slowly, then quickly | Triggers within a few seconds |
| Sit-still test | Sit still for 5+ minutes | WiFi node eventually clears; mmWave, if added, stays "occupied" |
| Empty overnight | Leave the room empty overnight | Count the false alarms. If more than ~1/night, raise the threshold or move the board away from fans |

---

## Known limits of this build

- **Motion only from WiFi.** ESPectre "does not identify people, count them, or prove a room is empty" ([ESPectre](https://github.com/francescopace/espectre)).
- **Neighbours and pets count.** Movement on the other side of a *shared* wall, or a pet in the path, can trigger it. Comcast's product has the same issue ([Xfinity Support](https://www.xfinity.com/support/articles/wifi-motion)).
- **Self-reported accuracy.** ESPectre reports an F1 score of about 99.5–99.9% on its own test set. The test conditions (walls, distance) aren't stated, and its "lightweight" profile hit 149 false alarms per hour on one weak link ([ESPectre performance report](https://github.com/francescopace/espectre/blob/main/docs/performance/README.md)). Your results depend on placement.
- **Uncertified development firmware.** The Matter images use development IDs, and updates can't be sent over the air: to upgrade, you reflash over USB. Removing a board in Apple Home also wipes its other controller pairings, and it restarts for re-pairing ([ESPectre Matter README](https://github.com/francescopace/espectre/blob/main/src/cpp/frontend/matter/README.md)).
- **Shared 2.4 GHz airtime.** Each board pings the router continuously. Fine for a few rooms; if your network slows, lower the traffic rate in the Monitor tool, where ESPectre's Matter build keeps its detector and traffic settings.

## If you want your own iPhone app instead of Apple Home

The same boards can feed a custom app. Once they're in Apple Home, an iOS app can read each sensor's occupancy through Apple's **HomeKit** framework. Building that would need a Mac with Xcode and an Apple Developer account. It adds a custom UI, for example a floor-plan view, history or per-room timelines, but no new sensing ability. Any sensing improvement has to come from the boards or extra sensors, not the phone.
