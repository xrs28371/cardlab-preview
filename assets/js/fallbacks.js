/* =====================================================================
   CardLab 生产版 · fallbacks：配置拉取失败时的内置兜底（页面永远能跑）。
   内容与演示版 v4 的兜底逐字一致（pack 路径已同步生产目录结构）；
   FALLBACK_I18N 与 config/i18n.json 同源。正常路径永远走 config 文件，
   这里只是保险丝，不许在这里改文案——改 config。
   ===================================================================== */
(function () {
  'use strict';
  window.CL = window.CL || {};
  CL.FALLBACK = {
 "site": {
  "site": {
   "name": "卡片工场",
   "nameEn": "CARDLAB",
   "slogan": "只生产值得截图发群的卡片",
   "trustLine": "不登录 · 不授权 · 不存你的信息"
  },
  "tools": [
   {
    "id": "x-value",
    "no": "01",
    "name": "X 价值计算器",
    "desc": "输入一个用户名，算出它值多少杯咖啡",
    "status": "live",
    "batch": "首发",
    "cta": "开始估值",
    "inputPlaceholder": "输入用户名",
    "trustLine": "不登录 · 不授权 · 不存你的用户名",
    "fineprint": "估值公式纯属虚构，图一乐。",
    "pack": "config/packs/valuation.json",
    "template": "x-value",
    "engine": "assets/js/engines/x-value.js",
    "view": "single"
   }
  ]
 },
 "packs": {
  "x-value": {
   "tool": "x-value",
   "min": 800,
   "max": 9800000,
   "exponent": 0.7,
   "coffeePrice": 5,
   "currency": "$",
   "equivUnit": "杯咖啡",
   "analysisMs": 1500,
   "analysisTexts": [
    "正在假装连线 X 数据库…",
    "正在翻看你的黑历史推文…",
    "正在计算围观群众数量…",
    "正在生成你的身价…"
   ],
   "tiers": [
    {
     "id": "high",
     "label": "赛博顶流大户",
     "min": 1000000
    },
    {
     "id": "mid",
     "label": "群里的气氛担当",
     "min": 60000
    },
    {
     "id": "low",
     "label": "赛博纯路人",
     "min": 0
    }
   ],
   "copies": {
    "high": [
     "发条推文的功夫，把普通人半年的社保都赚出来了。",
     "平时在群里潜水装死，原来是在闷声干大事。",
     "建议直接截图甩给甲方，问他们懂不懂行情。",
     "这身价，路过的品牌方看你一眼都觉得高攀了。"
    ],
    "mid": [
     "赚了点小钱但不敢告诉亲戚，最尴尬的身价区间。",
     "群里发言终于有人接茬了，这就是排面。",
     "离财富自由还差点意思，但咖啡已经敢点大杯加浓缩了。",
     "这身价，发红包都得手抖一下。"
    ],
    "low": [
     "账号里最值钱的，是你那点所剩无几的幽默感。",
     "属于在赛博世界做慈善，天天免费给平台贡献活跃度。",
     "就这三瓜两枣的身价，天天还操心世界局势。",
     "连赛博难民都算不上，充其量是个路过的吃瓜群众。"
    ]
   },
   "card": {
    "label": "估值身价",
    "watermarkName": "卡片工场 CARDLAB",
    "note": "估值纯属虚构 · 娱乐而已"
   }
  }
 }
};
  CL.FALLBACK_EN = {
 "site": {
  "site": {
   "name": "CardLab",
   "nameEn": "CARDLAB",
   "slogan": "We only make cards worth screenshotting and sharing",
   "trustLine": "No sign-up · No login · Nothing about you is stored"
  },
  "tools": [
   {
    "id": "x-value",
    "no": "01",
    "name": "X Value Calculator",
    "desc": "Type in a username — see what it's worth in cups of coffee",
    "status": "live",
    "batch": "Launch",
    "cta": "Calculate value",
    "inputPlaceholder": "Enter a username",
    "trustLine": "No sign-up · No login · Your username is never stored",
    "fineprint": "The valuation formula is completely made up. Just for fun.",
    "pack": "config/packs/valuation.en.json",
    "template": "x-value",
    "engine": "assets/js/engines/x-value.js",
    "view": "single"
   },
   {
    "id": "career-test",
    "no": "02",
    "name": "Career Personality Roast",
    "desc": "10 either-or questions that reveal your work persona",
    "status": "soon",
    "batch": "Launch",
    "pack": null,
    "template": null
   },
   {
    "id": "stance",
    "no": "03",
    "name": "Hot Take Machine",
    "desc": "When something trends, tap to pick a side and get your card",
    "status": "soon",
    "batch": "Launch",
    "pack": null,
    "template": null
   },
   {
    "id": "group-vote",
    "no": "04",
    "name": "Group Chat Vote Ender",
    "desc": "Settle the argument your group chat can't — one vote decides",
    "status": "later",
    "batch": "Wave 2",
    "pack": null,
    "template": null
   },
   {
    "id": "flower",
    "no": "05",
    "name": "Digital Bouquet",
    "desc": "Send flowers that never wilt — they unlock when opened",
    "status": "later",
    "batch": "Wave 2",
    "pack": null,
    "template": null
   },
   {
    "id": "fake-ai",
    "no": "06",
    "name": "Human Pretending to Be AI",
    "desc": "Real humans, timed answers — see who can pass as a bot",
    "status": "later",
    "batch": "Review-gated",
    "pack": null,
    "template": null
   }
  ]
 },
 "packs": {
  "x-value": {
   "tool": "x-value",
   "min": 800,
   "max": 9800000,
   "exponent": 0.7,
   "coffeePrice": 5,
   "currency": "$",
   "equivUnit": "cups of coffee",
   "analysisMs": 1500,
   "analysisTexts": [
    "Pretending to connect to the X database…",
    "Digging through your old posts…",
    "Counting the lurkers…",
    "Calculating your worth…"
   ],
   "tiers": [
    {
     "id": "high",
     "label": "Cyber Whale",
     "min": 1000000
    },
    {
     "id": "mid",
     "label": "Group Chat MVP",
     "min": 60000
    },
    {
     "id": "low",
     "label": "Cyber Passerby",
     "min": 0
    }
   ],
   "copies": {
    "high": [
     "One post from you earns what takes most people half a year.",
     "All that lurking in group chats — turns out you were quietly building an empire.",
     "Screenshot this and send it to your clients. They'll get the picture.",
     "Brands walk past you and feel out of their league."
    ],
    "mid": [
     "Decent money, but you wouldn't tell your family. The awkward middle.",
     "People actually reply to you in group chats now. That's clout.",
     "Not quite financial freedom, but a large coffee with an extra shot is no longer a big decision.",
     "This is the kind of net worth that makes your hand shake before sending a big gift."
    ],
    "low": [
     "The most valuable thing on your account is what's left of your sense of humor.",
     "You're doing charity work for the platform — free engagement, every single day.",
     "Net worth: pocket change. Opinions on world affairs: priceless.",
     "Not even a cyber refugee — just a passerby with a front-row seat."
    ]
   },
   "card": {
    "label": "ESTIMATED WORTH",
    "watermarkName": "CardLab CARDLAB",
    "note": "Made-up numbers · Just for fun"
   }
  }
 }
};
  CL.FALLBACK_I18N = {
 "income": {
  "url": "https://earnway.art",
  "blogUrl": "https://earnway.art/blog/generating-ad-revenue-google-trending-keywords-earnway-art",
  "refBase": "https://earnway.art",
  "refPath": "/register.php?ref=",
  "commissionNote": ""
 },
 "ui": {
  "en": {
   "againBtn": "‹ Test another",
   "defaultCta": "Start",
   "formErrorEmpty": "Enter a username first — anyone's will do",
   "formErrorNoPack": "This tool is still in the works. Check back soon.",
   "homeFoot": "One input · One result · One card. That's it.",
   "incomeBtn": "Go to earnway.art →",
   "incomeText": "The basics here — creating, valuing, and sharing cards — are available without registration. If you wish to earn \"EW/ART\" reward points, or generate passive income through daily tasks on earnway.art, you must register on the platform; identity verification (KYC) is required for withdrawals. This integration is an optional value-add and does not interfere with the core experience.",
   "incomeTitle": "Want reward points and passive income?",
   "liveTag": "Try it",
   "pageTitle": "CardLab · X Value Calculator",
   "saveBtn": "Save image",
   "saveFailed": "Failed — tap to retry",
   "saveGenerating": "Generating…",
   "saveHintDesktop": "Downloaded · you can also long-press or right-click to save",
   "saveHintMobile": "Long-press the image to save it",
   "saveCloseLabel": "Close",
   "saveOpenImage": "Open full image to save",
   "qrError": "Referral link too long — QR code failed. Shorten the referral code and try again.",
   "toggleLabel": "中文",
   "langToggleLabel": "Switch to Chinese",
   "toolNoTpl": "Tool {no} · {batch}",
   "incomeBlog": "Core business: generating ad revenue with trending keywords",
   "backLabel": "Back",
   "cardAlt": "Your result card",
   "cardRefLabel": "Join via my link:",
   "refLabel": "Referrer",
   "refYes": "I have a referrer",
   "refNo": "No referrer",
   "refPlaceholder": "Referral code or referrer's link",
   "refNote": "Share this link. When someone registers and tops up EW, you earn automatically.",
   "refLinkHint": "That looks like a short link — the referral code is hidden after the redirect, so this tool can't read it. Paste the original referral link (…register.php?ref=CODE) or the 10-character referral code itself.",
   "soonTag": "Coming soon",
   "toolRefTitle": "Have a referrer? Add their code — your card will carry their referral link",
   "quizProgress": "Question {n} of {total}",
   "stanceVotedTitle": "You already picked a side",
   "stanceViewCard": "See my card",
   "stanceTotalVotes": "{total} votes so far",
   "stanceMineTag": "You",
   "skeletonTag": "In prep",
   "skeletonNotice": "This tool takes real user text, so it stays closed until its moderation setup — keyword filter, report button and ban warning — is in place. The configuration skeleton below is ready; the launch gate is the moderation plan, which needs the employer’s sign-off.",
   "skeletonPlanTitle": "Planned mechanics (straight from the config)"
  },
  "zh": {
   "againBtn": "‹ 再测一个",
   "defaultCta": "开始",
   "formErrorEmpty": "先填一个用户名，随便谁的都行",
   "formErrorNoPack": "这个工具还在准备中，过几天再来",
   "homeFoot": "一个输入框 · 一个结果 · 一张卡片，够了。",
   "incomeBtn": "前往 earnway.art →",
   "incomeText": "本站的基础功能——做卡、估值、分享——都不用注册，打开就能玩。如果想赚 EW/ART 奖励积分，或者通过 earnway.art 的每日任务获得被动收入，需要先在平台注册；提现时要完成 KYC 身份验证。这个集成只是一个可选的增值项，不会干扰核心体验。",
   "incomeTitle": "想赚奖励积分和被动收入？",
   "liveTag": "立即测",
   "pageTitle": "卡片工场 · X 价值计算器",
   "saveBtn": "保存图片",
   "saveFailed": "生成失败，再点一次",
   "saveGenerating": "正在生成…",
   "saveHintDesktop": "已下载 · 也可以长按或右键保存这张图",
   "saveHintMobile": "长按图片，保存到相册",
   "saveCloseLabel": "关闭",
   "saveOpenImage": "打开大图保存",
   "qrError": "推荐链接过长，二维码生成失败，请缩短推荐码后重试",
   "toggleLabel": "EN",
   "langToggleLabel": "切换到英文",
   "toolNoTpl": "工具 {no} · {batch}",
   "incomeBlog": "核心业务说明：靠趋势关键词赚广告收入",
   "backLabel": "返回",
   "cardAlt": "你的结果卡片",
   "cardRefLabel": "通过我的链接加入：",
   "refLabel": "推荐人",
   "refYes": "有推荐人",
   "refNo": "没有推荐人",
   "refPlaceholder": "输入推荐码，或粘贴推荐人链接",
   "refNote": "分享这条链接。有人通过它注册并充值 EW，你就能自动获得佣金。",
   "refLinkHint": "粘贴的是短链接：跳转后推荐码被藏起来，本工具读不到。请粘贴原始推荐链接（…register.php?ref=推荐码），或直接粘贴 10 位推荐码。",
   "soonTag": "即将上线",
   "toolRefTitle": "有推荐人？填上推荐码，你生成的卡就会带上他的推荐链接",
   "quizProgress": "第 {n} / {total} 题",
   "stanceVotedTitle": "你已经表过态了",
   "stanceViewCard": "看我的卡片",
   "stanceTotalVotes": "已有 {total} 人表态",
   "stanceMineTag": "你",
   "skeletonTag": "筹备中",
   "skeletonNotice": "这个工具要接收真人输入，必须先把内容审核兜底（关键词过滤＋举报按钮＋封禁警告）落实才会开放。下方配置骨架已备好；上线闸门是审核方案，待雇主确认。",
   "skeletonPlanTitle": "计划玩法（直接来自配置）"
  }
 }
};

  // Tool ⑥ fallback mirrors its maintained bilingual config; M1 fallbacks stay intact.
  var fakeaiFallbacks = {
  "zh": {
    "tool": {
      "batch": "第二波",
      "desc": "真人限时答题，看看能有多像机器人",
      "fineprint": "规则调侃，仅供娱乐；不代表 AI 检测结果。",
      "id": "fakeai",
      "name": "真人假装 AI",
      "no": "06",
      "pack": "config/packs/fakeai.json",
      "status": "live",
      "template": "fakeai",
      "trustLine": "纯客户端 · 不上传答案",
      "engine": "assets/js/engines/fakeai.js",
      "view": "fakeai",
      "cta": "开始伪装"
    },
    "pack": {
      "tool": "fakeai",
      "questionsPack": "config/fakeai-questions.json",
      "markersPack": "config/fakeai-markers.json",
      "blocklistPack": "config/fakeai-blocklist.json",
      "ui": {
        "intro": "你有 60 秒假装 AI。回答问题，别让真人味露馅。",
        "start": "开始伪装",
        "submit": "提交判定",
        "answer": "你的 AI 式回答",
        "next": "再来一题",
        "export": "导出失败报告卡",
        "report": "匿名举报",
        "reported": "举报已发送。",
        "reportError": "举报未发送，请稍后重试。",
        "blocked": "请换一种友善的表达再提交。",
        "invalid": "请输入 1–300 字（按 Unicode 码点计）。",
        "loading": "正在准备测试单…",
        "error": "题库暂时不可用，请重试。",
        "retry": "重试",
        "warning": "请勿输入辱骂或敏感内容，违规内容会被拦截。答案仅留在此页面；刷新即清空。",
        "high": "可疑地像 AI",
        "mid": "半人半机",
        "low": "当场露馅：你是真人",
        "timeout": "伪装失败：响应超时",
        "breakdown": "基础 40 ＋ AI 标记 {ai}×20 − 真人标记 {human}×15 ＝ {score}（范围 0–100）",
        "timedOut": "60 秒已到，本轮直接失败、得分 0。未提交的草稿不进入报告。",
        "elapsed": "用时",
        "score": "AI 味得分",
        "empty": "（无已提交答案）",
        "question": "本轮题目",
        "reportTitle": "AI 失败报告",
        "note": "规则调侃，仅供娱乐；不代表 AI 检测结果。"
      },
      "card": {
        "label": "AI 失败报告",
        "watermarkName": "CARDLAB",
        "note": "规则调侃，仅供娱乐；不代表 AI 检测结果。"
      }
    }
  },
  "en": {
    "tool": {
      "batch": "Wave two",
      "desc": "Real humans, timed answers — see who can pass as a bot",
      "fineprint": "A rule-based joke for fun, not an AI detector.",
      "id": "fakeai",
      "name": "Human Pretending to Be AI",
      "no": "06",
      "pack": "config/packs/fakeai.en.json",
      "status": "live",
      "template": "fakeai",
      "trustLine": "Client only · answers never uploaded",
      "engine": "assets/js/engines/fakeai.js",
      "view": "fakeai",
      "cta": "Start pretending"
    },
    "pack": {
      "tool": "fakeai",
      "questionsPack": "config/fakeai-questions.json",
      "markersPack": "config/fakeai-markers.json",
      "blocklistPack": "config/fakeai-blocklist.json",
      "ui": {
        "intro": "You have 60 seconds to pretend to be AI. Answer the prompt without giving your humanity away.",
        "start": "Start pretending",
        "submit": "Judge my answer",
        "answer": "Your AI-style answer",
        "next": "Next prompt",
        "export": "Export failure report",
        "report": "Report anonymously",
        "reported": "Report sent.",
        "reportError": "Report could not be sent. Please retry.",
        "blocked": "Please rephrase your answer kindly before submitting.",
        "invalid": "Enter 1–300 characters (Unicode code points).",
        "loading": "Preparing your test sheet…",
        "error": "The prompts could not load. Please retry.",
        "retry": "Retry",
        "warning": "Abusive or sensitive language is blocked. Answers stay on this page and disappear on refresh.",
        "high": "Suspiciously AI-like",
        "mid": "Half human, half machine",
        "low": "Caught: definitely human",
        "timeout": "Disguise failed: timed out",
        "breakdown": "Base 40 + AI markers {ai}×20 − human markers {human}×15 = {score} (clamped to 0–100)",
        "timedOut": "60 seconds elapsed: automatic failure, score 0. Unsubmitted drafts stay off the report.",
        "elapsed": "Time taken",
        "score": "AI flavour score",
        "empty": "(No submitted answer)",
        "question": "This round’s prompt",
        "reportTitle": "AI failure report",
        "note": "A rule-based joke for fun, not an AI detector."
      },
      "card": {
        "label": "AI failure report",
        "watermarkName": "CARDLAB",
        "note": "A rule-based joke for fun, not an AI detector."
      }
    }
  }
};
  [CL.FALLBACK, CL.FALLBACK_EN].forEach(function (fallback, i) {
    var entry = fakeaiFallbacks[i ? "en" : "zh"];
    fallback.site.tools = fallback.site.tools.filter(function (t) { return t.no !== "06"; }).concat([entry.tool]);
    delete fallback.packs["fake-ai"];
    fallback.packs.fakeai = entry.pack;
  });
})();
