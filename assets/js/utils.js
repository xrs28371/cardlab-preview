/* =====================================================================
   CardLab 生产版 · utils：无状态小工具（哈希 / 伪随机 / 格式化 / 转义）。
   估值引擎的哈希与伪随机算法与演示版逐字一致——同一用户名在演示版
   与生产版必须算出同一个结果，这是已验收行为，不许改。
   ===================================================================== */
(function () {
  'use strict';
  window.CL = window.CL || {};

  function $(id) { return document.getElementById(id); }

  function fnv1a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h >>> 0;
  }
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  /* 拼 innerHTML 时转义配置文本，防配置里的引号/尖括号把结构撑坏 */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  /* localStorage 读写一律走这里：隐私模式/禁用时静默失败，不许报错断流 */
  function storeGet(key) {
    try { var v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (e) { console.warn('utils: localStorage 读取失败（' + key + '）：', e && e.message); return null; }
  }
  function storeSet(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn('utils: localStorage 写入失败（' + key + '）：', e && e.message); }
  }

  CL.Utils = {
    $: $, fnv1a: fnv1a, mulberry32: mulberry32, commas: commas,
    esc: esc, storeGet: storeGet, storeSet: storeSet
  };
})();
