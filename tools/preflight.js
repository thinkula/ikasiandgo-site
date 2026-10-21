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
    // Any 3-digit number near the word "words" that is not the live count.
    const stale = [...text.matchAll(/(\d{3,4})\s+(?:words|entries)/g)]
      .map(m => parseInt(m[1], 10))
      .filter(n => n !== words && n !== free);
    if (stale.length) {
      fail(f + " quotes a stale count", [...new Set(stale)].join(", ") +
        " (live: " + words + " words, " + free + " free)");
    } else {
      pass(f + " counts agree", words + " words, " + free + " free");
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
    const b = sh("xcodebuild", [
      "-project", "ios/App/App.xcodeproj", "-scheme", "App", "-configuration", "Debug",
      "-destination", "platform=iOS Simulator,id=" + buildDev.udid,
      "-derivedDataPath", dd, "build"
    ], { cwd: ROOT, timeout: 900000 });

    if (!b.ok) {
      fail("xcodebuild failed", "run it by hand to see why");
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
          sh("xcrun", ["simctl", "launch", d.udid, "com.ikasiandgo.app"]);
          execFileSync("/bin/sleep", ["8"]);
          const live = sh("xcrun", ["simctl", "spawn", d.udid, "launchctl", "list"]);
          if (/ikasiandgo/i.test(live.out)) {
            const shot = path.join(shotDir, (rt.name + "-" + d.name).replace(/[^\w.-]+/g, "_") + ".png");
            sh("xcrun", ["simctl", "io", d.udid, "screenshot", shot]);
            pass(label, "running, screenshot saved");
          } else {
            fail(label, "the app did not stay running");
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
