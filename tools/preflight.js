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
  console.log("\npreflight: simulator launch  (skipped, --quick)");
} else {
  console.log("\npreflight: simulator launch on the newest installed iOS");
  const rt = sh("xcrun", ["simctl", "list", "runtimes", "--json"]);
  let runtime = null;
  if (rt.ok) {
    const all = JSON.parse(rt.out).runtimes
      .filter(r => r.isAvailable && /iOS/.test(r.name))
      .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }));
    runtime = all[all.length - 1] || null;
  }
  if (!runtime) {
    fail("no available iOS simulator runtime found");
  } else {
    const dv = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "--json"]).out);
    const devices = (dv.devices[runtime.identifier] || []).filter(d => d.isAvailable);
    const device = devices.find(d => /iPhone/.test(d.name)) || devices[0];
    if (!device) {
      fail("no device for " + runtime.name);
    } else {
      console.log("  using " + device.name + " on " + runtime.name);
      sh("xcrun", ["simctl", "boot", device.udid]);
      sh("xcrun", ["simctl", "bootstatus", device.udid, "-b"], { timeout: 180000 });
      const dd = path.join(os.tmpdir(), "ikasi-preflight-dd");
      const b = sh("xcodebuild", [
        "-project", "ios/App/App.xcodeproj", "-scheme", "App", "-configuration", "Debug",
        "-destination", "platform=iOS Simulator,id=" + device.udid,
        "-derivedDataPath", dd, "build"
      ], { cwd: ROOT, timeout: 900000 });
      if (!b.ok) {
        fail("xcodebuild failed", "run it by hand to see why");
      } else {
        const app = path.join(dd, "Build/Products/Debug-iphonesimulator/App.app");
        const builtManifest = plist("UIApplicationSceneManifest", path.join(app, "Info.plist"));
        if (builtManifest === null) {
          fail("the BUILT app has no scene manifest", "Xcode may be caching a stale Info.plist");
        } else {
          pass("built app carries the scene manifest");
        }
        sh("xcrun", ["simctl", "uninstall", device.udid, "com.ikasiandgo.app"]);
        sh("xcrun", ["simctl", "install", device.udid, app]);
        sh("xcrun", ["simctl", "launch", device.udid, "com.ikasiandgo.app"]);
        execFileSync("/bin/sleep", ["8"]);
        const live = sh("xcrun", ["simctl", "spawn", device.udid, "launchctl", "list"]);
        if (/ikasiandgo/i.test(live.out)) {
          pass("still running 8s after launch on " + runtime.name);
        } else {
          fail("the app did not stay running on " + runtime.name,
            "this is the iOS 27 launch crash, or a new one");
        }
      }
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
