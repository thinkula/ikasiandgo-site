#!/usr/bin/env node
/*
 * preflight.js
 * ------------
 * Everything that should be true before an archive goes to Apple.
 *
 * Each check here exists because the thing it checks actually went wrong:
 *
 *   scene lifecycle   1.1, 1.2 and 1.3 all shipped without a scene manifest and
 *                     crashed on launch on iOS 27, for three releases, because
 *                     nothing ever launched the app on a current iOS.
 *   launch test       the crash was invisible on the iOS 26.2 simulator that
 *                     happened to be booted. Testing the newest installed
 *                     runtime is the whole point.
 *   blank render      1.6 (15) was reported as launching cleanly on all six
 *                     devices while iOS 27 on an iPhone 18 Pro Max had drawn
 *                     nothing but the status bar. The process was alive, so
 *                     the check passed. A screenshot nobody looks at proves
 *                     nothing, so now the screenshot is measured.
 *   build number      build 10 was archived twice and the second upload had
 *                     nowhere to go, because build 9 already held the slot.
 *   shipped.json      the website advertised 50 lessons while the App Store
 *                     served 38.
 *   listing counts    the 1.3 description said 939 words while the app served
 *                     941, since vocabulary arrives over the air between
 *                     releases and the listing cannot.
 *
 *   node tools/preflight.js            full run, builds and launches
 *   node tools/preflight.js --quick    skips the simulator launch
 *
 * Exit codes: 0 = clear to archive, 1 = at least one failure.
 */

"use strict";
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync, spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PBXPROJ = path.join(ROOT, "ios/App/App.xcodeproj/project.pbxproj");
const INFO_PLIST = path.join(ROOT, "ios/App/App/Info.plist");
const QUICK = process.argv.includes("--quick");

let failures = 0;
let warnings = 0;

function pass(label, detail) {
  console.log("  \u2713 " + label + (detail ? "  " + detail : ""));
}
function fail(label, detail) {
  failures++;
  console.log("  \u2717 " + label + (detail ? "  " + detail : ""));
}
function warn(label, detail) {
  warnings++;
  console.log("  ! " + label + (detail ? "  " + detail : ""));
}
function sh(cmd, args, opts) {
  const r = spawnSync(cmd, args, Object.assign({ encoding: "utf8" }, opts || {}));
  return { ok: r.status === 0, out: (r.stdout || "") + (r.stderr || ""), status: r.status };
}
function plist(key, file) {
  const r = sh("/usr/libexec/PlistBuddy", ["-c", "Print :" + key, file]);
  return r.ok ? r.out.trim() : null;
}

/* ---------------------------------------------------------------- versions */

function readVersions() {
  const src = fs.readFileSync(PBXPROJ, "utf8");
  const mv = [...new Set((src.match(/MARKETING_VERSION = ([^;]+);/g) || [])
    .map(s => s.replace(/MARKETING_VERSION = ([^;]+);/, "$1").trim()))];
  const cv = [...new Set((src.match(/CURRENT_PROJECT_VERSION = ([^;]+);/g) || [])
    .map(s => s.replace(/CURRENT_PROJECT_VERSION = ([^;]+);/, "$1").trim()))];
  return { marketing: mv, build: cv };
}

console.log("\npreflight: version numbers");
const v = readVersions();
if (v.marketing.length !== 1) {
  fail("MARKETING_VERSION disagrees between configurations", v.marketing.join(" vs "));
} else {
  pass("MARKETING_VERSION", v.marketing[0]);
}
if (v.build.length !== 1) {
  fail("CURRENT_PROJECT_VERSION disagrees between configurations", v.build.join(" vs "));
} else {
  pass("CURRENT_PROJECT_VERSION", v.build[0]);
}
const VERSION = v.marketing[0] || "?";
const BUILD = v.build[0] || "?";

// src/App.jsx carries its own VERSION string, shown on the paywall and used to
// decide whether the rating prompt has already been asked for this release. It
// sat at 1.1.0 through four releases: users deciding whether to pay saw a stale
// number, and the prompt treated every release as one version and asked once
// per install, forever.
try {
  const appSrc = fs.readFileSync(path.join(ROOT, "src/App.jsx"), "utf8");
  const m = appSrc.match(/const VERSION\s*=\s*"([^"]+)"/);
  if (!m) {
    warn("no VERSION constant found in src/App.jsx");
  } else if (m[1].replace(/\.0$/, "") !== VERSION) {
    fail("src/App.jsx VERSION is " + m[1] + ", project is " + VERSION,
      "shown on the paywall, and it gates the rating prompt");
  } else {
    pass("src/App.jsx VERSION agrees", m[1]);
  }
} catch (e) {
  warn("could not check the in-app VERSION", e.message);
}

/* ------------------------------------------------------- build number reuse */

console.log("\npreflight: build number");
const archiveRoot = path.join(os.homedir(), "Library/Developer/Xcode/Archives");
let clash = null;
try {
  for (const day of fs.readdirSync(archiveRoot)) {
    const dayDir = path.join(archiveRoot, day);
    if (!fs.statSync(dayDir).isDirectory()) continue;
    for (const arc of fs.readdirSync(dayDir)) {
      if (!arc.endsWith(".xcarchive")) continue;
      const p = path.join(dayDir, arc, "Products/Applications/App.app/Info.plist");
      if (!fs.existsSync(p)) continue;
      if (plist("CFBundleShortVersionString", p) === VERSION &&
          plist("CFBundleVersion", p) === BUILD) {
        clash = path.join(day, arc);
      }
    }
  }
} catch (e) { /* no archives yet is fine */ }
if (clash) {
  warn(VERSION + " (" + BUILD + ") already archived", clash);
  console.log("      If that archive was uploaded, this build number is taken and the");
  console.log("      upload will be rejected. Bump CURRENT_PROJECT_VERSION.");
} else {
  pass("no existing archive for " + VERSION + " (" + BUILD + ")");
}

/* ----------------------------------------------------- scene lifecycle */

console.log("\npreflight: iOS scene lifecycle");
const hasManifest = plist("UIApplicationSceneManifest", INFO_PLIST) !== null;
if (!hasManifest) {
  fail("UIApplicationSceneManifest missing from Info.plist");
  console.log("      iOS 26 and later refuse to launch an app that still uses the plain");
  console.log("      UIApplicationDelegate lifecycle. This is a 100% launch crash.");
} else {
  pass("UIApplicationSceneManifest present");
  const delegate = plist(
    "UIApplicationSceneManifest:UISceneConfigurations:UIWindowSceneSessionRoleApplication:0:UISceneDelegateClassName",
    INFO_PLIST);
  const swift = fs.readFileSync(path.join(ROOT, "ios/App/App/AppDelegate.swift"), "utf8");
  if (!delegate) {
    fail("no UISceneDelegateClassName in the manifest");
  } else if (!/class\s+SceneDelegate\b/.test(swift)) {
    fail("manifest names " + delegate + " but no SceneDelegate class exists");
  } else {
    pass("SceneDelegate declared", delegate);
    // Under scenes these arrive at the scene delegate, not the app delegate.
    // Without forwarding, Capacitor deep links break silently.
    const forwards = (swift.match(/ApplicationDelegateProxy\.shared\.application/g) || []).length;
    if (forwards < 4) {
      warn("only " + forwards + " ApplicationDelegateProxy forwards found",
        "expected the app delegate's 2 plus the scene delegate's 3");
    } else {
      pass("URL and user-activity forwarding wired", forwards + " call sites");
    }
  }
}

/* ------------------------------------------------- shipped.json vs the code */

console.log("\npreflight: what the website will advertise");
try {
  const shipped = JSON.parse(fs.readFileSync(path.join(ROOT, "shipped.json"), "utf8"));
  const app = fs.readFileSync(path.join(ROOT, "src/App.jsx"), "utf8");
  const lessons = (app.match(/\n    id:"l\d+_/g) || []).length;
  const chapters = (app.match(/\{n:\d+,name:"/g) || []).length;
  if (shipped.version !== VERSION) {
    warn("shipped.json says " + shipped.version + ", this build is " + VERSION,
      "update it once this version is live, not before");
  } else {
    pass("shipped.json version matches", shipped.version);
  }
  if (lessons && shipped.lessons !== lessons) {
    warn("shipped.json says " + shipped.lessons + " lessons, main has " + lessons,
      "correct only if this build does not ship them");
  } else if (lessons) {
    pass("lesson count agrees", String(lessons));
  }
  if (chapters && shipped.chapters !== chapters) {
    warn("shipped.json says " + shipped.chapters + " chapters, main has " + chapters);
  } else if (chapters) {
    pass("chapter count agrees", String(chapters));
  }
} catch (e) {
  warn("could not compare shipped.json", e.message);
}

/* --------------------------------------------- listing copy vs the vocabulary */

console.log("\npreflight: App Store listing copy");
try {
  const vocab = JSON.parse(fs.readFileSync(path.join(ROOT, "vocabulary.json"), "utf8"));
  const words = vocab.vocabulary.length;
  const free = vocab.vocabulary.filter(w => w.cefr === "A1").length;
  const dir = path.join(os.homedir(), "Downloads/Ikasi");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => /description|review-notes/.test(f) && f.endsWith(".txt"))
    : [];
  if (!files.length) {
    warn("no staged description or review notes found in ~/Downloads/Ikasi");
  }
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), "utf8");
    // A count in the copy is either a floor ("more than 900 words", "900+ words")
    // or exact ("943 words"). A floor only has to stay true as the vocabulary
    // grows, so the description quotes one; an exact figure is wrong the moment a
    // word is added, and the reviewer notes quote one because Apple is told the
    // real number. Treating both as exact failed this check on every word added.
    // The number may carry a thousands separator. Without allowing for one,
    // "more than 1,000 words" matched the bare "000" and failed as a stale
    // count of 0, which is the same spurious failure this rewrite removed.
    const claims = [...text.matchAll(/(?<![\d,])(\d{1,3}(?:,\d{3})+|\d{3,5})(\+?)\s+(?:words|entries)/g)].map(m => ({
      n: parseInt(m[1].replace(/,/g, ""), 10),
      floor: m[2] === "+" ||
        /(?:more than|over|at least)\s+$/i.test(text.slice(Math.max(0, m.index - 12), m.index)),
    }));
    const overPromised = claims.filter(c => c.floor && words < c.n);
    const stale = claims.filter(c => !c.floor && c.n !== words && c.n !== free);
    // Only the largest floor is the headline claim. A sentence like "added
    // over 100 words" is also floor-shaped, and treating it as the headline
    // warned that a correct line was far behind the vocabulary.
    const floors = claims.filter(c => c.floor).map(c => c.n);
    const headline = floors.length ? Math.max(...floors) : 0;
    const behind = (headline && words >= headline + 100 && headline >= words / 2)
      ? [{ n: headline }] : [];
    if (overPromised.length) {
      fail(f + " promises more words than exist",
        "copy says at least " + [...new Set(overPromised.map(c => c.n))].join(", ") +
        ", live: " + words);
    } else if (stale.length) {
      fail(f + " quotes a stale count", [...new Set(stale.map(c => c.n))].join(", ") +
        " (live: " + words + " words, " + free + " free)");
    } else {
      pass(f + " counts hold", claims.length
        ? claims.map(c => (c.floor ? "at least " : "") + c.n).join(", ") +
          "  (live: " + words + " words, " + free + " free)"
        : "no counts quoted");
      if (behind.length) {
        warn(f + " floor is well behind the vocabulary",
          "says at least " + [...new Set(behind.map(c => c.n))].join(", ") +
          ", live count is " + words + ". Worth raising.");
      }
    }
  }
} catch (e) {
  warn("could not check listing copy", e.message);
}

/* ------------------------------------------------------------- launch test */

if (QUICK) {
  console.log("\npreflight: simulator launches  (skipped, --quick)");
} else {
  /*
   * Two different failures, two axes.
   *
   * Across RUNTIMES catches the compatibility traps: the missing scene
   * manifest was invisible on iOS 26.2 and fatal on 27. One runtime is not a
   * test, it is a coin toss about which iOS you happened to have installed.
   *
   * Across SCREEN SIZES catches layout: the home screen is dense, and the
   * smallest phone is where a row stops fitting.
   *
   * The screenshots are deliberately taken after launch on a clean install, so
   * they catch the app that starts but paints nothing. A live process is not
   * proof: a Capacitor app whose webview fails to load stays running and shows
   * a white screen. What they do not show is the home screen, because a clean
   * install opens on onboarding.
   *
   * So the shot is measured rather than filed away, and it is taken on a poll
   * rather than at one fixed moment. A single wait only ever answers "had it
   * drawn by then", and the honest answer varies by device: the same build on
   * the same machine needed 8 seconds on five devices and more than 8 on the
   * sixth. Waiting longer for everyone would be slower and still arbitrary.
   *
   * One build, many installs. A simulator build with a deployment target of
   * 15.0 runs on every runtime here, so the expensive step happens once.
   */
  console.log("\npreflight: building once for the launch matrix");

  const rtRaw = sh("xcrun", ["simctl", "list", "runtimes", "--json"]);
  const runtimes = rtRaw.ok
    ? JSON.parse(rtRaw.out).runtimes
        .filter(r => r.isAvailable && /iOS/.test(r.name))
        .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))
    : [];
  const devJson = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "--json"]).out);

  // Smallest and largest by model name. Crude, but the alternative is booting
  // every device just to ask its screen size.
  function pick(list) {
    const phones = list.filter(d => d.isAvailable && /iPhone/.test(d.name));
    if (!phones.length) return [];
    const small = phones.find(d => /SE|16e|17e|mini/.test(d.name));
    const large = phones.find(d => /Pro Max|Plus/.test(d.name));
    const out = [];
    if (small) out.push({ d: small, why: "smallest" });
    if (large && (!small || large.udid !== small.udid)) out.push({ d: large, why: "largest" });
    if (!out.length) out.push({ d: phones[phones.length - 1], why: "only" });
    return out;
  }

  if (!runtimes.length) {
    fail("no available iOS simulator runtime found");
  } else {
    const newest = runtimes[runtimes.length - 1];
    const buildDev = (devJson.devices[newest.identifier] || []).filter(d => d.isAvailable)[0];
    const dd = path.join(os.tmpdir(), "ikasi-preflight-dd");
    function build() {
      return sh("xcodebuild", [
        "-project", "ios/App/App.xcodeproj", "-scheme", "App", "-configuration", "Debug",
        "-destination", "platform=iOS Simulator,id=" + buildDev.udid,
        "-derivedDataPath", dd, "build"
      ], { cwd: ROOT, timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
    }
    // The derived data is reused so the common run stays fast, but a stale
    // Swift Package artifact cache there fails the build for reasons that have
    // nothing to do with the app:
    //   error: There is no Info.plist found at .../Cordova.xcframework/Info.plist
    // A tool that cries wolf stops being read, so a failure gets one clean
    // retry before it is believed.
    let b = build();
    if (!b.ok) {
      console.log("  build failed, retrying once with clean derived data");
      fs.rmSync(dd, { recursive: true, force: true });
      b = build();
    }

    if (!b.ok) {
      fail("xcodebuild failed");
      const tail = b.out.trim().split("\n").filter(l => /error:/i.test(l)).slice(-4);
      for (const l of (tail.length ? tail : b.out.trim().split("\n").slice(-4))) {
        console.log("      " + l.trim().slice(0, 150));
      }
    } else {
      const app = path.join(dd, "Build/Products/Debug-iphonesimulator/App.app");
      if (plist("UIApplicationSceneManifest", path.join(app, "Info.plist")) === null) {
        fail("the BUILT app has no scene manifest", "Xcode may be caching a stale Info.plist");
      } else {
        pass("built app carries the scene manifest");
      }

      const shotDir = path.join(ROOT, "tools/.preflight-shots");
      fs.rmSync(shotDir, { recursive: true, force: true });
      fs.mkdirSync(shotDir, { recursive: true });

      /*
       * Has it drawn anything?
       *
       * The app paints a cream page, #F8F7F5, under a dark green header, and a
       * clean install covers most of that page with an onboarding sheet. So a
       * screen the app has drawn puts a large share of its pixels a long way
       * from cream, while a blank launch leaves cream and the status bar. The
       * status bar is far too small to reach the threshold, which is the point:
       * the blank 1.6 shot scored 0.
       *
       * Far from cream is not the same as drawn, though, so the share is held
       * between two bounds rather than above one. Black is as far from cream as
       * a pixel can get, so a flat black frame scores 100 and a lower bound on
       * its own would wave it through. That is not hypothetical here: the app
       * shows nothing but black for its first seconds while it waits on its
       * first frame, so an early look can land inside that gap and grade the
       * launch placeholder as a perfect render. A real screen is a mixture of
       * cream page, white sheet and dark green header, and lands between the
       * bounds. A screen of any one flat color lands at 0 or at 100.
       *
       * No image library, because the gate should not grow dependencies to
       * check a PNG. sips ships with macOS and writes BMP, which is a header
       * followed by raw rows, and plain Node can read that. Downsampling to a
       * small grid first does the averaging for us and keeps the arithmetic to
       * a few hundred pixels.
       */
      const CREAM = [0xF8, 0xF7, 0xF5];
      const GRID = 16;        // downsample to GRID x GRID before measuring
      const OFF_CREAM = 80;   // per channel, how far from cream reads as drawn
      const DRAWN_PCT = 30;   // share of the grid that has to be that far off
      const DRAWN_MAX = 85;   // above this it is one flat color, not the app
      const BLANK_PCT = 10;   // below this nothing was drawn at all
      const SETTLE = 4;       // seconds before the first look
      const POLL = 2;         // seconds between looks after that
      const BUDGET = 30;      // seconds before a screen is called blank
      const bmpPath = path.join(os.tmpdir(), "ikasi-preflight-probe.bmp");

      // Percent of the shot that is substantially off cream, or null if the
      // image could not be measured at all.
      function drawnPercent(png) {
        fs.rmSync(bmpPath, { force: true });
        const r = sh("sips", ["-z", String(GRID), String(GRID),
          "--setProperty", "format", "bmp", png, "--out", bmpPath]);
        if (!r.ok || !fs.existsSync(bmpPath)) return null;
        const b = fs.readFileSync(bmpPath);
        if (b.length < 54) return null;
        const off = b.readUInt32LE(10);
        const w = b.readInt32LE(18);
        const h = Math.abs(b.readInt32LE(22));
        const bpp = b.readUInt16LE(28);
        if (!w || !h || (bpp !== 24 && bpp !== 32)) return null;
        const stride = Math.floor((bpp * w + 31) / 32) * 4;
        let drawn = 0, total = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = off + y * stride + x * (bpp / 8);
            if (i + 2 >= b.length) continue;
            total++;
            // BMP rows are BGR, not RGB.
            if (Math.max(Math.abs(b[i + 2] - CREAM[0]),
                         Math.abs(b[i + 1] - CREAM[1]),
                         Math.abs(b[i] - CREAM[2])) > OFF_CREAM) drawn++;
          }
        }
        return total ? Math.round((drawn * 100) / total) : null;
      }

      /*
       * Measured over three full matrix runs, eighteen shots, a drawn screen
       * scores 38, 43 or 61 and nothing else. Cream and white score 0, black
       * scores 100.
       *
       * The lower bound sat at 15 and let something through. The home screen
       * paints its skeleton first, a green header over empty placeholder
       * cards with no text in them, and that scores 19. It is a real screen,
       * so the gate called it drawn and stopped looking, which meant a pass
       * that only proved the webview had mounted. On iOS 27 the 17e did that
       * on two runs out of three.
       *
       * So the bar is 30, in the clear gap between the skeleton at 19 and the
       * lowest real screen at 38. Anything below it is still on its way, and
       * the poll keeps looking until the content lands or the budget runs
       * out. If a future device draws a genuine screen under 30, widen the
       * gap rather than lowering the bar back onto the skeleton.
       */
      function isDrawn(d) { return d !== null && d >= DRAWN_PCT && d <= DRAWN_MAX; }

      console.log("\npreflight: launch matrix");
      for (const rt of runtimes) {
        for (const { d, why } of pick(devJson.devices[rt.identifier] || [])) {
          const label = rt.name.padEnd(9) + " " + d.name.padEnd(18) + "(" + why + ")";
          sh("xcrun", ["simctl", "boot", d.udid]);
          const booted = sh("xcrun", ["simctl", "bootstatus", d.udid, "-b"], { timeout: 240000 });
          if (!booted.ok) { warn(label, "could not boot, skipped"); continue; }
          sh("xcrun", ["simctl", "uninstall", d.udid, "com.ikasiandgo.app"]);
          const inst = sh("xcrun", ["simctl", "install", d.udid, app]);
          if (!inst.ok) { warn(label, "install failed, skipped"); continue; }
          const shot = path.join(shotDir, (rt.name + "-" + d.name).replace(/[^\w.-]+/g, "_") + ".png");

          // Launch it, then watch until it draws or the budget runs out.
          function watchLaunch() {
            sh("xcrun", ["simctl", "launch", d.udid, "com.ikasiandgo.app"]);
            execFileSync("/bin/sleep", [String(SETTLE)]);
            let waited = SETTLE, live = false, drawn = null;
            for (;;) {
              // Checked every time round, so an app that dies while we wait is
              // reported as dying rather than as a blank screen.
              live = /ikasiandgo/i.test(
                sh("xcrun", ["simctl", "spawn", d.udid, "launchctl", "list"]).out);
              if (!live) break;
              sh("xcrun", ["simctl", "io", d.udid, "screenshot", "--type=png", shot]);
              drawn = drawnPercent(shot);
              // Keep looking while the score is outside the bounds at either
              // end. Both blankness and the black placeholder are states the app
              // is expected to pass through, so neither one ends the wait early.
              if (drawn === null || isDrawn(drawn) || waited >= BUDGET) break;
              execFileSync("/bin/sleep", [String(POLL)]);
              waited += POLL;
            }
            return { waited, live, drawn };
          }

          /*
           * A screen that never drew gets one relaunch before it is believed,
           * the same courtesy the build itself gets further up.
           *
           * On 2026-11-12 the iPhone 18 Pro Max sat blank for the whole 30
           * seconds on the sixth device of a run, then drew in 8 on the very
           * next launch, same build, same device. Nothing was wrong with the
           * app. A gate that fails a good build stops being read, and a gate
           * nobody reads is how the scene crash shipped three times.
           *
           * A process that died is not retried. That is the crash this file
           * exists to catch, and it gets reported the first time it happens.
           */
          let { waited, live, drawn } = watchLaunch();
          let relaunched = false;
          if (live && drawn !== null && !isDrawn(drawn)) {
            relaunched = true;
            sh("xcrun", ["simctl", "terminate", d.udid, "com.ikasiandgo.app"]);
            ({ waited, live, drawn } = watchLaunch());
          }
          const after = relaunched ? " after a relaunch" : "";

          if (!live) {
            fail(label, "the app did not stay running" + after);
          } else if (drawn === null) {
            warn(label, "running after " + waited + "s, but the screenshot could not be measured");
          } else if (isDrawn(drawn)) {
            pass(label, "drew in " + waited + "s" + after + "  (" + drawn + "% of the screen)");
            // Neither is a failure, but both are the 1.6 bug in slow motion,
            // and the next device or the next runtime may be the one that
            // runs out. A device that only drew the second time is the louder
            // of the two: it spent a whole budget showing a user nothing.
            if (relaunched) {
              warn(label, "drew only on the second launch, the first showed nothing for " +
                BUDGET + "s");
            } else if (waited > BUDGET / 2) {
              warn(label, "took " + waited + "s of the " + BUDGET + "s allowed to draw");
            }
          } else if (drawn > DRAWN_MAX) {
            fail(label, "still one flat dark screen after " + waited + "s" + after + "  (" + drawn +
              "% of the screen, expected at most " + DRAWN_MAX + "%)");
            console.log("      The process is alive and the screen is a single dark color.");
            console.log("      That is the launch placeholder: no first frame ever arrived.");
          } else if (drawn < BLANK_PCT) {
            fail(label, "still blank after " + waited + "s" + after + "  (" + drawn +
              "% of the screen, needs " + DRAWN_PCT + "%)");
            console.log("      The process is alive and drawing nothing. Open the shot below:");
            console.log("      a bare cream screen is a webview that never loaded.");
          } else {
            // Raising the bar past the skeleton made this its own outcome. It
            // is not the blank screen above: something drew, it just never
            // became a screen with any content on it.
            fail(label, "stopped part drawn after " + waited + "s" + after + "  (" + drawn +
              "% of the screen, needs " + DRAWN_PCT + "%)");
            console.log("      The process is alive and the frame is stuck partway. Open the shot");
            console.log("      below: placeholder cards with no text are vocabulary that never came.");
          }
          sh("xcrun", ["simctl", "shutdown", d.udid]);
        }
      }
      console.log("\n  screenshots: tools/.preflight-shots/");
    }
  }
}

/* ------------------------------------------------------------------ verdict */

console.log("");
if (failures) {
  console.log("preflight: " + failures + " failure" + (failures === 1 ? "" : "s") +
    (warnings ? ", " + warnings + " warning" + (warnings === 1 ? "" : "s") : "") +
    ". Do not archive.\n");
  process.exit(1);
}
console.log("preflight: clear to archive " + VERSION + " (" + BUILD + ")" +
  (warnings ? ", with " + warnings + " warning" + (warnings === 1 ? "" : "s") + " above" : "") + ".\n");
