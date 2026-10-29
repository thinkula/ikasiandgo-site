#!/usr/bin/env node
/*
 * lessons.js
 * ----------
 * One reader for the LESSONS and CHAPTERS arrays in src/App.jsx, shared by
 * check-lessons and check-vocab.
 *
 * Both of them used to carry their own near-identical copy, which drifted:
 * one unescaped string fields and the other did not, one exited 1 when it
 * could not find the array and the other returned nothing and reported the
 * run clean. Worse, both copies walked the brackets with an unbounded loop,
 * so a single unmatched bracket inside lesson prose made the gate hang with
 * no output instead of failing. A gate that hangs is worse than one that
 * fails, and lesson copy does contain brackets.
 *
 * Everything here throws on malformed input, with a message naming what is
 * wrong, so a caller never has to decide what an empty result means.
 */

"use strict";
const fs = require("fs");

function unescape(s) {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
          .replace(/\\(.)/g, "$1");
}

// Walk from just past an opening bracket to its match, counting depth. Bounded
// by the length of the source, so an unbalanced file raises instead of looping.
function matchBracket(src, start, open, close, what) {
  let depth = 1, i = start;
  while (i < src.length) {
    if (src[i] === open) depth++;
    else if (src[i] === close) { depth--; if (depth === 0) return i; }
    i++;
  }
  throw new Error("unbalanced " + open + close + " while reading " + what +
                  ": reached the end of the file with " + depth + " still open");
}

function arrayBody(src, re, what) {
  const open = re.exec(src);
  if (!open) throw new Error("could not find " + what + " in src/App.jsx");
  const from = open.index + open[0].length;
  return src.slice(from, matchBracket(src, from, "[", "]", what));
}

function readLessons(appPath) {
  const src = fs.readFileSync(appPath, "utf8");
  const block = arrayBody(src, /\n(?:var|const)\s+LESSONS\s*=\s*\[/, "the LESSONS array");

  const field = (chunk, name) => {
    const m = new RegExp("\\b" + name + ':"((?:[^"\\\\]|\\\\.)*)"').exec(chunk);
    return m ? unescape(m[1]) : "";
  };

  const lessons = [];
  for (const chunk of block.split(/\n\s*\{\s*\n(?=\s*id:")/)) {
    if (!/\bid:"/.test(chunk)) continue;
    // Each of these is an authoring mistake someone will make while adding a
    // lesson, so say which field is wrong rather than throwing a TypeError.
    const id = /\bid:"([^"]+)"/.exec(chunk);
    if (!id) throw new Error("a lesson has no id");
    const num = /\bnum:(\d+)/.exec(chunk);
    if (!num) throw new Error("lesson " + id[1] + " has no num");
    const w = /wordIds:\[([^\]]*)\]/.exec(chunk);
    if (!w) throw new Error("lesson " + id[1] + " has no wordIds");
    const g = /grammar:\{title:"((?:[^"\\]|\\.)*)",body:"((?:[^"\\]|\\.)*)"\}/.exec(chunk);
    lessons.push({
      id: id[1],
      num: parseInt(num[1], 10),
      pro: /\bpro:true/.test(chunk),
      title: field(chunk, "title"),
      titleEu: field(chunk, "titleEu"),
      blurb: field(chunk, "blurb"),
      intro: field(chunk, "intro"),
      gtitle: g ? unescape(g[1]) : "",
      gbody: g ? unescape(g[2]) : "",
      wordIds: (w[1].match(/"([^"]+)"/g) || []).map(s => s.slice(1, -1)),
    });
  }
  if (!lessons.length) throw new Error("the LESSONS array parsed to zero lessons");
  lessons.sort((a, b) => a.num - b.num);
  return lessons;
}

// The chapter ranges that decide which lessons render. A lesson whose num
// falls in no range draws no card at all; one in two ranges draws two.
function readChapters(appPath) {
  const src = fs.readFileSync(appPath, "utf8");
  const body = arrayBody(src, /\n(?:var|const)\s+CHAPTERS\s*=\s*\[/, "the CHAPTERS array");
  const out = [];
  for (const m of body.matchAll(/\{n:(\d+),name:"((?:[^"\\]|\\.)*)",from:(\d+),to:(\d+)\}/g)) {
    out.push({ n: +m[1], name: unescape(m[2]), from: +m[3], to: +m[4] });
  }
  if (!out.length) throw new Error("the CHAPTERS array parsed to zero chapters");
  return out;
}

module.exports = { readLessons, readChapters, unescape };
