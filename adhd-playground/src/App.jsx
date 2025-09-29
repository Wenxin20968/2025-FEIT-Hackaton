import React, {useMemo, useRef, useState, useEffect} from "react";

// ★ 必加：把 React 报露到全局，供自由模式模块使用
if (typeof window !== "undefined") {
    window.React = window.React || React;
}

/**
 * ADHD 趣味化量表小游戏（单文件 React 组件）— 模板/自由生成合并版
 * 说明：
 * - 纯前端 Demo，允许在浏览器粘贴 OpenAI API Key（仅本地内存，不上传）。
 * - 新增“自由生成（freeform）”模式：LLM 输出一个可运行的 React 组件（ES Module），并附带 meta.rules 与 explain()。
 * - 生产环境请将 API 调用迁移到后端，建议配合 iframe sandbox 或服务端沙箱。
 */

export default function ADHDPlayground() {
    const [apiKey, setApiKey] = useState("");
    const [rawScale, setRawScale] = useState("");
    const [scaleName, setScaleName] = useState("Untitled Scale");
    const [theme, setTheme] = useState("animals");
    const [customTokens, setCustomTokens] = useState("🐶 🐱 🐰");
    const [status, setStatus] = useState("idle"); // idle | generating | playing | finished
    const [error, setError] = useState("");

    // 新增：玩法模式 + 自由模式代码/错误
    const [mode, setMode] = useState("template"); // "template" | "freeform"
    const [aiGameCode, setAiGameCode] = useState("");
    const [runtimeErr, setRuntimeErr] = useState("");

    const [gameSpec, setGameSpec] = useState(null); // 模板模式：LLM/默认生成的规格
    const [gameResult, setGameResult] = useState(null); // 游戏返回的指标
    const [reportText, setReportText] = useState("");

    // 自由模式：保存 LLM 导出的元信息（规则/标题等） // UPDATE: 新增
    const [freeformMeta, setFreeformMeta] = useState(null);

    const fileInputRef = useRef(null); // 新增：隐藏文件 input 的引用

    const selectedClass =
        "border-orange-500 bg-orange-50 ring-2 ring-orange-400 " +
        "outline-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-orange-400 " +
        "active:outline-none active:ring-0 [-webkit-tap-highlight-color:transparent] transition";

    const unselectedClass =
        "border-slate-200 hover:bg-slate-50 " +
        "outline-none focus:outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-orange-400 " +
        "active:outline-none active:ring-0 [-webkit-tap-highlight-color:transparent] transition";



    // 主题预设
    const themes = [
        {id: "animals", label: "Zoo", defaults: "🐶 🐱 🐰 🐼 🦊 🦁"},
        {id: "plants", label: "Botanical", defaults: "🌱 🌿 🌼 🌷 🌵 🍀"},
        {id: "space", label: "Space", defaults: "🪐 🌟 🚀 👽 🌌 ☄️"},
        {id: "ocean", label: "Ocean", defaults: "🐠 🐳 🐙 🐬 🐚 🦀"},
        {id: "vehicles", label: "Vehicles", defaults: "🚗 🚌 🚲 🚀 🚃 🚁"},
        {id: "custom", label: "Custom", defaults: "⭐️ 💡 🎈"},
    ];

    // —— 解析量表
    const parsedScale = useMemo(() => {
        const text = rawScale.trim();
        if (!text) return {items: [], meta: {}};
        try {
            if (text.startsWith("[") || text.startsWith("{")) {
                const j = JSON.parse(text);
                if (Array.isArray(j)) {
                    return {items: j.map((t, i) => ({id: String(i + 1), text: String(t)})), meta: {fmt: "json-array"}};
                }
                if (Array.isArray(j.items)) {
                    return {
                        items: j.items.map((it, i) => ({
                            id: String(it.id ?? i + 1),
                            text: String(it.text ?? it.question ?? it)
                        })),
                        meta: {fmt: "json-obj"},
                    };
                }
            }
        } catch (_) {
        }
        if (text.includes(",") || text.includes("\n")) {
            const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            const items = lines.map((line, idx) => {
                const parts = line.split(",");
                if (parts.length >= 2) return {
                    id: parts[0].trim() || String(idx + 1),
                    text: parts.slice(1).join(",").trim()
                };
                return {id: String(idx + 1), text: line};
            });
            return {items, meta: {fmt: "csv-or-lines"}};
        }
        return {items: [{id: "1", text}], meta: {fmt: "raw"}};
    }, [rawScale]);

    const selectedTheme = themes.find((t) => t.id === theme) ?? themes[0];

    // 用于自由模式运行时的回退 tokens（不依赖 gameSpec）
    const tokensForPlay = useMemo(() => {
        const list = (theme === "custom" ? customTokens : selectedTheme.defaults)
            .split(/\s+/).map((s) => s.trim()).filter(Boolean);
        return list.length >= 2 ? list.slice(0, 8) : ["🙂", "🙃"];
    }, [theme, customTokens, selectedTheme]);

    function stripBOM(text) {
        return text.replace(/^\uFEFF/, "");
    }

    async function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base = file.name.replace(/\.[^.]+$/, "");
            setScaleName((prev) => (prev && prev !== "Untitled Scale" ? prev : base));
            const reader = new FileReader();
            reader.onload = () => {
                const raw = typeof reader.result === "string" ? reader.result : "";
                setRawScale(stripBOM(raw));
            };
            reader.onerror = () => setError("Failed to read file. Make sure it is JSON/CSV/TXT text.");
            reader.readAsText(file, "utf-8");
        } catch (err) {
            setError(`Read failed: ${(err && err.message) || String(err)}`);
        } finally {
            e.target.value = "";
        }
    }

    // —— 生成（模板 / 自由）
    async function handleGenerateSpec() {
        setError("");
        setRuntimeErr("");
        setGameSpec(null);
        setAiGameCode("");
        setGameResult(null);
        setReportText("");
        setFreeformMeta(null); // UPDATE: 重置

        if (parsedScale.items.length === 0) {
            setError("Please upload or paste scale items first.");
            return;
        }

        setStatus("generating");

        const stimuliTokens = tokensForPlay;
        const safeTokens = stimuliTokens.length >= 2 ? stimuliTokens : ["🙂", "🙃"];

        // 默认规格（Go/No-Go），时长 12s
        const defaultSpec = {
            template: "goNoGo",
            name: `${scaleName || "ADHD Task"} - Go/No-Go`,
            durationSec: 12,
            isiMs: 1000,
            targetRatio: 0.7,
            noGoToken: safeTokens[0] ?? "❌",
            tokens: safeTokens,
            mapping: parsedScale.items.map((it) => ({itemId: it.id, weight: 1})),
            scoring: {
                weights: {commissionErr: 0.5, omissionErr: 0.3, meanRT: 0.2, rtVar: 0.2},
                advisories: [
                    {when: "commissionErr>0.25", text: "Possible difficulty with inhibitory control (No-Go)."},
                    {when: "omissionErr>0.2", text: "Sustained attention may be limited."},
                    {when: "rtVar>180", text: "Reaction time variability is high; attention maintenance may be challenging."},
                ],
            },
        };

        // 无 key：模板/自由都回退到本地模板
        if (!apiKey) {
            setGameSpec(defaultSpec);
            setStatus("playing");
            return;
        }

        try {
            if (mode === "template") {
                const sys =
                    `You are a helpful game designer for pediatric ADHD pre-screening.
Return STRICT JSON ONLY.
Design a short, themed mini-game spec for web.
Allowed templates: "goNoGo", "oddball".
Fields: {
  template, name,
  durationSec(8-20), isiMs(600-1500), targetRatio(0.2-0.8),
  tokens[],
  noGoToken (for goNoGo),
  targetToken (for oddball),
  mapping[{itemId, weight}],
  scoring{weights, advisories[]}
}.
Prefer varying the template from game to game.`;

                const user = {
                    role: "user",
                    content:
                        `Scale name: ${scaleName}.
                        Items: ${parsedScale.items.map((i) => `${i.id}:${i.text}`).join(" | ")}.
                        Theme tokens to use: ${safeTokens.join(" ")}.
                        Requirement: STRICT JSON, no explanations, no Markdown.`,
                };

                const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {role: "system", content: sys},
                            user,
                        ],
                        temperature: 0.3,
                        response_format: {type: "json_object"},
                    }),
                });

                const raw = await resp.text();
                if (!resp.ok) {
                    let msg = raw;
                    try {
                        msg = JSON.parse(raw).error?.message || raw;
                    } catch {
                    }
                    throw new Error(`LLM request failed: ${resp.status}｜${msg}`);
                }
                const data = JSON.parse(raw);
                const text = data.choices?.[0]?.message?.content || "{}";
                const spec = JSON.parse(text);

                const merged = {
                    ...defaultSpec,
                    ...spec,
                    durationSec: Math.min(20, Math.max(8, Number(spec.durationSec || defaultSpec.durationSec))),
                    tokens: Array.isArray(spec.tokens) && spec.tokens.length ? spec.tokens : defaultSpec.tokens,
                };
                merged.isiMs = Math.max(1000, Number(merged.isiMs ?? defaultSpec.isiMs) || defaultSpec.isiMs);

                setGameSpec(merged);
                setStatus("playing");
            } else {
                // === 自由模式：让模型输出完整 ES Module 组件代码 + meta + explain ===
                const sys =
                    `You are a game coder. Output ONLY JavaScript ES Module code for a React component.
Rules:
- Must export default a React component function (no JSX; use React.createElement aliased as: const h = React.createElement).
- Do NOT write any import statements.
- Assume React is available globally: const React = window.React; const { useState, useEffect, useRef } = React.
- The game MUST visibly display a countdown timer (Chinese label ok) and MUST auto-finish within <=20 seconds.
- No network, no eval, no localStorage, no cookies, no timers beyond game lifecycle.
- Props: { onFinish, onCancel, tokens, durationSec } only.
- You MUST also export: 
    export const meta = {
      title: "English Title",
      rules: ["Point 1", "Point 2", "Point 3"],
      scoringNotes: "Brief note on how metrics are computed (English)."
    };
    export function explain(metrics) {
      // metrics: {hitRate, commissionErr, omissionErr, meanRT, rtVar, composite}
      return "Short parent-friendly English summary…";
    }
- The component MUST call onFinish(metrics) within ~durationSec seconds.
- Keep code < 300 lines. Keep UI simple but playable.`;

                const user = {
                    role: "user",
                    content:
                        `Make a kid-friendly mini-game using these theme tokens: ${safeTokens.join(" ")}.
Game should be self-contained, mouse/touch friendly, and finish in ${12} seconds.
Use uploaded scale items (for flavor text or level names): ${parsedScale.items.slice(0, 10).map((i) => i.text).join(" | ")}.
Language: Chinese UI labels.`,
                };

                const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {"Content-Type": "application/json", Authorization: `Bearer ${apiKey}`},
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [{role: "system", content: sys}, user],
                        temperature: 0.5
                    }),
                });

                const raw = await resp.text();
                if (!resp.ok) {
                    let msg = raw;
                    try {
                        msg = JSON.parse(raw).error?.message || raw;
                    } catch {
                    }
                    throw new Error(`LLM request failed: ${resp.status}｜${msg}`);
                }
                const data = JSON.parse(raw);
                const code = data.choices?.[0]?.message?.content?.trim();
                if (!code || !/export\s+default/.test(code)) {
                    throw new Error("Returned content has no valid default-exported component");
                }
                setAiGameCode(code);
                setStatus("playing");
            }
        } catch (e) {
            console.error(e);
            setError(`Generation failed: ${e.message}. Fell back to local default template.`);
            setGameSpec(defaultSpec);
            setStatus("playing");
        }
    }

    // —— 结果解释（模板 & 自由模式回退）
    async function handleExplainResult(metrics) {
        if (!metrics) return;
        if (!apiKey) { // 本地回退
            const msgs = [];
            if (metrics.commissionErr > 0.25) msgs.push("More false taps on No-Go");
            if (metrics.omissionErr > 0.2) msgs.push("Higher misses (possible focus difficulties)");
            if (metrics.rtVar > 180) msgs.push("Larger reaction time variability");
            setReportText(`[Non-diagnostic note] Mini-game suggests: ${msgs.join("; ") || "overall stable performance"}. Please pair with validated scales and professional evaluation for decisions.`);
            return;
        }
        try {
            const sys = `You are a clinician-assistant. Write a short, empathetic, non-diagnostic summary for parents (English), based on Go/No-Go or Oddball metrics. Avoid medical claims.`;
            const u = {
                role: "user",
                content: `Metrics: ${JSON.stringify(metrics)}\nPlease write 2–4 short sentences in English with gentle suggestions, avoiding diagnostic language.`
            };
            const resp = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${apiKey}`},
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [{role: "system", content: sys}, u],
                    temperature: 0.4
                }),
            });
            const raw = await resp.text();
            if (!resp.ok) {
                let msg = raw;
                try {
                    msg = JSON.parse(raw).error?.message || raw;
                } catch {
                }
                throw new Error(`LLM request failed: ${resp.status}｜${msg}`);
            }
            const data = JSON.parse(raw);
            const text = data.choices?.[0]?.message?.content?.trim() || "";
            setReportText(text);
        } catch (e) {
            setReportText(
                `[Local summary] Thanks for playing. Mini-game metrics: commission ${(metrics.commissionErr * 100).toFixed(1)}%, omission ${(metrics.omissionErr * 100).toFixed(1)}%, mean RT ${metrics.meanRT.toFixed(0)}ms. Consider using validated scales and professional evaluation together.`
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#fff8dc] text-slate-800 flex flex-col items-center">
            <header className="text-center px-4 py-6">
                <h1 className="text-2xl md:text-3xl font-bold">ADHD Personalized Fun Check · Game Generator</h1>
                <p className="text-sm text-slate-600 mt-1">For education and pre-screening only; not a medical diagnosis.</p>
            </header>

            <main className="w-full px-4 py-2 md:py-6 flex flex-col gap-8">
                {/* 配置卡片 */}
                {status !== "playing" && (
                    <section className="w-full max-w-5xl mx-auto grid gap-4 md:grid-cols-[2fr_1fr]">
                        {/* 左：量表输入 */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2">Upload or paste scale</h2>

                            {/* 一行：按钮触发上传 + 文件名输入框 */}
                            <div className="flex gap-2 items-center mb-2 mt-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.csv,.txt"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="rounded-lg border px-3 py-2 hover:bg-slate-50"
                                >
                                    Choose file…
                                </button>
                                <input
                                    className="border rounded-lg px-3 py-2 flex-1"
                                    placeholder="Scale name (optional)"
                                    value={scaleName}
                                    onChange={(e) => setScaleName(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 items-center mb-2">
                                <label className="text-xs text-slate-500">Supports JSON / CSV / one item per line</label>
                            </div>

                            <textarea
                                className="w-full h-48 border rounded-xl p-3 font-mono text-sm"
                                placeholder={`Example (one per line):\n1. Finds it hard to sit still in class\n2. Easily distracted, attention hard to sustain\n...`}
                                value={rawScale}
                                onChange={(e) => setRawScale(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                                <span>Parsed items: {parsedScale.items.length}</span>
                                {parsedScale.items.length > 0 && (
                                    <span className="truncate">
                                        Example: {parsedScale.items.slice(0, 3).map((i) => i.text).join(" / ")}
                                        {parsedScale.items.length > 3 ? "..." : ""}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 右：主题 & API Key & 模式 */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2">Choose theme tokens</h2>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                {themes.map((t) => (
                                    <button key={t.id} onClick={() => setTheme(t.id)}
                                            className={`rounded-xl border px-3 py-3 text-center w-full ${theme === t.id ? selectedClass : unselectedClass}`}
                                    >
                                        <div className="text-sm font-medium">{t.label}</div>
                                        <div className="text-lg mt-1">{t.defaults}</div>
                                    </button>
                                ))}
                            </div>

                            {theme === "custom" && (
                                <div className="mt-2">
                                    <label className="text-sm">Custom tokens (space-separated; emoji or words)</label>
                                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={customTokens}
                                           onChange={(e) => setCustomTokens(e.target.value)}/>
                                </div>
                            )}

                            <div className="mt-4">
                                <h3 className="font-semibold mb-1">Mode</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <button
                                        className={`rounded-lg border px-3 py-2 ${mode === "template" ? selectedClass : unselectedClass}`}
                                        onClick={() => setMode("template")}
                                    >Template (stable)
                                    </button>
                                    <button
                                        className={`rounded-lg border px-3 py-2 ${mode === "freeform" ? selectedClass : unselectedClass}`}
                                        onClick={() => setMode("freeform")}
                                    >Freeform (varies)
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Freeform asks the AI to output a complete game React component with “rules” and an “explain” function.
                                </p>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold mb-1">(Optional) Paste your ChatGPT API Key</h3>
                                <input className="w-full border rounded-lg px-3 py-2" type="password"
                                       placeholder="sk-... (kept in local memory only)" value={apiKey}
                                       onChange={(e) => setApiKey(e.target.value)}/>
                                <p className="text-xs text-slate-500 mt-1">You can run without a key: a local default template will be used.</p>
                            </div>

                            <button onClick={handleGenerateSpec}
                                    className="mt-4 w-full rounded-xl bg-sky-600 text-black py-2 font-semibold shadow hover:bg-sky-700"
                                    disabled={status === "generating"}>
                                {status === "generating" ? "Generating…" : "Generate game"}
                            </button>

                            {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
                            {runtimeErr && <p className="text-sm text-rose-600 mt-2">Runtime error: {runtimeErr}</p>}
                        </div>
                    </section>
                )}

                {/* 游戏 & 结果 */}
                {status === "playing" && (
                    <section className="w-full max-w-3xl mx-auto">
                        {mode === "template" ? (
                            gameSpec ? (
                                <GameRunner
                                    spec={gameSpec}
                                    onFinish={(metrics) => {
                                        setGameResult(metrics);
                                        setStatus("finished");
                                        handleExplainResult(metrics); // 模板模式沿用原解释
                                    }}
                                    onCancel={() => setStatus("idle")}
                                />
                            ) : (
                                <p className="text-sm text-rose-600">No template spec available.</p>
                            )
                        ) : aiGameCode ? (
                            <DynamicGameRunner
                                code={aiGameCode}
                                onFinish={(metrics) => {
                                    setGameResult(metrics);
                                    setStatus("finished");
                                }}
                                onCancel={() => setStatus("idle")}
                                fallbackTokens={tokensForPlay}
                                durationSec={12}
                                onError={(msg) => setRuntimeErr(String(msg || "Unknown error"))}
                                onExplainText={(text) => setReportText(text)}           // UPDATE: 接收自由模式解释
                                onMeta={(meta) => setFreeformMeta(meta)}                 // UPDATE: 接收自由模式规则/标题
                                fallbackExplain={(m) => handleExplainResult(m)}          // UPDATE: 缺失 explain 时的回退
                            />
                        ) : (
                            <p className="text-sm text-slate-600">Preparing freeform game…</p>
                        )}
                    </section>
                )}

                {status === "finished" && (
                    <section className="w-full max-w-5xl mx-auto grid gap-4 md:grid-cols-2">
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold">Results</h2>
                            {gameResult ? (
                                <ul className="mt-2 text-sm leading-7">
                                    <li>Hit rate (correct on targets): {(gameResult.hitRate * 100).toFixed(1)}%</li>
                                    <li>Commission errors (tapped on No-Go): {(gameResult.commissionErr * 100).toFixed(1)}%</li>
                                    <li>Omission errors (missed targets): {(gameResult.omissionErr * 100).toFixed(1)}%</li>
                                    <li>Mean reaction time: {gameResult.meanRT.toFixed(0)} ms</li>
                                    <li>RT variability (SD): {gameResult.rtVar.toFixed(0)} ms</li>
                                    <li>Composite score: {gameResult.composite.toFixed(1)} / 100</li>
                                </ul>
                            ) : (
                                <p className="text-sm">No data.</p>
                            )}
                            <div className="mt-4 flex gap-2">
                                <button className="rounded-xl border px-4 py-2 hover:bg-slate-50"
                                        onClick={() => {
                                            setStatus("playing");
                                            setGameResult(null);
                                            setReportText("");
                                        }}>
                                    Play again
                                </button>
                                <button className="rounded-xl border px-4 py-2 hover:bg-slate-50"
                                        onClick={() => {
                                            setStatus("idle");
                                            setGameSpec(null);
                                            setAiGameCode("");
                                            setFreeformMeta(null);
                                        }}>
                                    Back to setup
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold">Interpretation (non-diagnostic)</h2>
                            <p className="text-sm whitespace-pre-wrap mt-2 min-h-24">{reportText || "Generating…"}</p>
                            <p className="text-xs text-slate-500 mt-4">Important: This tool is for playful pre-screening and parent-child interaction. It does not replace clinical diagnosis or professional evaluation.</p>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

/**
 * GameRunner：支持 "goNoGo" 与 "oddball"（模板模式）
 */
function GameRunner({spec, onFinish, onCancel}) {
    const {
        template = "goNoGo",
        name = template === "oddball" ? "Oddball" : "Go/No-Go",
        durationSec = 12,
        isiMs = 1000,
        targetRatio = template === "oddball" ? 0.25 : 0.7,
        tokens = ["🐶", "🐱", "🐰", "🐼"],
        noGoToken = "🐼",
        targetToken,
        scoring = {weights: {commissionErr: 0.5, omissionErr: 0.3, meanRT: 0.2, rtVar: 0.2}},
    } = spec || {};

    const isi = Math.max(1000, Number(isiMs) || 1000);

    const [running, setRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(durationSec);
    const [current, setCurrent] = useState(null);
    const [round, setRound] = useState(0);
    const [shouldTap, setShouldTap] = useState(true);
    const [countdown, setCountdown] = useState(3);

    const totalTrialsRef = useRef(0);
    const targetTrialsRef = useRef(0);
    const nonTargetTrialsRef = useRef(0);
    const hitsRef = useRef(0);
    const commissionsRef = useRef(0);
    const omissionsRef = useRef(0);
    const rtsRef = useRef([]);
    const respondedThisTrialRef = useRef(false);

    // ★ 新增：只维护一条 trial 定时器链 + 结束时间
    const trialTimerRef = useRef(null);
    const endAtRef = useRef(0);
    const finishedRef = useRef(false);

    // 计时器：开场倒计时
    useEffect(() => {
        let cdTimer;
        if (!running) {
            setCountdown(3);
            cdTimer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
            const startT = setTimeout(() => {
                setRunning(true);
                clearInterval(cdTimer);
            }, 3000);
            return () => {
                clearTimeout(startT);
                clearInterval(cdTimer);
            };
        }
    }, [running]);

    // 全局计时
    useEffect(() => {
        if (!running) return;
        endAtRef.current = Date.now() + durationSec * 1000;
        setTimeLeft(durationSec);
        const id = setInterval(() => {
            const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
            setTimeLeft(left);
            if (left <= 0) clearInterval(id);
        }, 250);
        return () => clearInterval(id);
    }, [running, durationSec]);

    // ★ 只在 running=true 时启动一次 trial 链；不依赖 round/timeLeft
    useEffect(() => {
        if (!running) return;

        finishedRef.current = false;

        // ★ 在同一个 effect 里设定结束时间
        endAtRef.current = Date.now() + durationSec * 1000;

        // ★ 硬截止：到点一定结束（双保险）
        const hardStopMs = Math.max(0, endAtRef.current - Date.now() + 20);
        const hardStopTimer = setTimeout(() => {
            if (!finishedRef.current) finish();
        }, hardStopMs);

        const scheduleNext = () => {
            if (finishedRef.current) return;

            // 到时则结束（软检查）
            if (Date.now() >= endAtRef.current) {
                finish();
                return;
            }

            const isTargetTrial = Math.random() < targetRatio;
            let token = "";
            if (template === "goNoGo") {
                const tkPool = tokens.filter((t) => t !== noGoToken);
                token = isTargetTrial
                    ? tkPool[Math.floor(Math.random() * tkPool.length)] || tkPool[0] || "🙂"
                    : noGoToken || "🚫";
                setShouldTap(isTargetTrial);
            } else {
                const tgt = targetToken || tokens[0] || "⭐";
                const standards = tokens.filter((t) => t !== tgt);
                token = isTargetTrial ? tgt : standards[Math.floor(Math.random() * standards.length)] || tgt;
                setShouldTap(isTargetTrial);
            }

            setCurrent({ token, tStart: performance.now() });
            respondedThisTrialRef.current = false;
            totalTrialsRef.current += 1;
            if (isTargetTrial) targetTrialsRef.current += 1; else nonTargetTrialsRef.current += 1;

            clearTimeout(trialTimerRef.current);
            trialTimerRef.current = setTimeout(() => {
                if (!respondedThisTrialRef.current && isTargetTrial) omissionsRef.current += 1;
                scheduleNext();
            }, isi);  // 这里的 isi 是 ≥1000 的那个
        };

        // 启动链
        scheduleNext();

        // 清理
        return () => {
            clearTimeout(trialTimerRef.current);
            clearTimeout(hardStopTimer);   // ★ 别忘了清理硬截止
        };
    }, [running, durationSec, isi, template, targetRatio, tokens, noGoToken, targetToken]);


    function handleTap() {
        if (!current || respondedThisTrialRef.current) return;
        respondedThisTrialRef.current = true;

        const rt = performance.now() - current.tStart;
        if (shouldTap) {
            hitsRef.current += 1;
            rtsRef.current.push(rt);
        } else {
            commissionsRef.current += 1;
        }
    }

    function finish() {
        // 只允许结束一次
        if (finishedRef.current) return;
        finishedRef.current = true;
        clearTimeout(trialTimerRef.current);

        const total = Math.max(1, totalTrialsRef.current);
        const goTrials = Math.max(1, targetTrialsRef.current);
        const noGoTrials = Math.max(1, nonTargetTrialsRef.current);

        const hitRate = hitsRef.current / goTrials;
        const commissionErr = commissionsRef.current / noGoTrials;
        const omissionErr = omissionsRef.current / goTrials;
        const meanRT = rtsRef.current.length ? rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length : 0;
        const rtVar = rtsRef.current.length > 1 ? stddev(rtsRef.current) : 0;

        const normRT = clamp01(1 - meanRT / 800);
        const normVar = clamp01(1 - rtVar / 300);
        const composite = clamp01(
            0.4 * hitRate + 0.6 * (1 - commissionErr) - 0.3 * omissionErr + 0.2 * normRT + 0.2 * normVar - 0.1 * Math.abs(normRT - normVar)
        ) * 100;

        setTimeLeft(0);
        onFinish?.({
            totalTrials: total,
            goTrials,
            noGoTrials,
            hitRate,
            commissionErr,
            omissionErr,
            meanRT,
            rtVar,
            composite,
        });
    }

    return (
        <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">{name}</h2>
                    <p className="text-sm text-slate-500">
                        ~{durationSec}s · {isiMs}ms per stimulus ·{" "}
                        {template === "goNoGo" ? (
                            <>Tip: when you see <span className="font-medium">{spec.noGoToken || "🚫"}</span>, do NOT tap</>
                        ) : (
                            <>Tip: tap ONLY on <span className="font-medium">{spec.targetToken || spec.tokens?.[0] || "⭐"}</span></>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="rounded-xl border px-4 py-2 hover:bg-slate-50" onClick={onCancel}>Back</button>
                </div>
            </div>

            <TemplateCountdownPanel running={running} countdown={countdown}/>

            {running && (
                <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>Time left: {timeLeft}s</span>
                        {template === "goNoGo"
                            ? <span>Remember: do NOT tap {spec.noGoToken || "🚫"}</span>
                            : <span>Remember: tap only {spec.targetToken || spec.tokens?.[0] || "⭐"}</span>}
                    </div>
                    <div className="mt-4 grid place-items-center">
                        <button
                            onClick={handleTap}
                            className="select-none w-56 h-56 flex items-center justify-center rounded-3xl bg-gradient-to-b from-sky-50 to-sky-100 border shadow-inner active:translate-y-[1px]"
                        >
                            <span className="text-[9rem] leading-none">{current?.token ?? ""}</span>
                        </button>
                    </div>
                    <p className="text-center text-slate-500 mt-4">
                        {template === "goNoGo"
                            ? <>Quickly tap the cute items that are NOT {spec.noGoToken || "🚫"}!</>
                            : <>Tap only when you see {spec.targetToken || spec.tokens?.[0] || "⭐"}!</>}
                    </p>
                </div>
            )}
        </div>
    );
}

function TemplateCountdownPanel({running, countdown}) {
    if (running) return null;
    return (
        <div className="mt-6 text-center">
            <p className="text-lg">Get ready…</p>
            <p className="text-5xl mt-2 font-bold">{countdown || 0}</p>
        </div>
    );
}

/**
 * 动态载入自由生成小游戏模块（ES Module 字符串）
 * 约定：
 * - 模块必须 export default 一个 React 组件，并在 ~durationSec 内调用 onFinish(metrics)
 * - 另外必须导出 meta（含 rules）与 explain(metrics)（用于展示规则和结果解释）
 */
function DynamicGameRunner({
                               code, onFinish, onCancel, fallbackTokens, durationSec = 12, onError,
                               onExplainText, onMeta, fallbackExplain
                           }) {
    const [Comp, setComp] = useState(null);
    const [err, setErr] = useState("");
    const [meta, setMeta] = useState(null);            // UPDATE: 保存规则等
    const explainRef = useRef(null);                   // UPDATE: 保存 explain 函数
    const [started, setStarted] = useState(false);     // UPDATE: 规则页“开始游戏”按钮控制


    function normalizeMetrics(raw = {}) {
        const toNum = (v, d = 0) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : d;
        };
        const unit01 = (v) => {
            const n = Number(v);
            if (!Number.isFinite(n)) return null;
            // 兼容百分数：>1 视为百分数
            return n > 1 ? clamp01(n / 100) : clamp01(n);
        };

        // 兼容各种字段命名
        const goTrials = toNum(raw.goTrials, toNum(raw.targets ?? raw.targetTrials, 0));
        const noGoTrials = toNum(raw.noGoTrials, toNum(raw.nontargetTrials ?? raw.standardTrials, 0));
        const hits = toNum(raw.hits ?? raw.correct ?? raw.correctHits, 0);
        const commissions = toNum(raw.commissions ?? raw.falseAlarms ?? raw.falsePositives, 0);
        const omissions = toNum(raw.omissions ?? raw.misses, 0);

        let hitRate = unit01(raw.hitRate);
        if (hitRate === null) hitRate = goTrials > 0 ? clamp01(hits / goTrials) : 0;

        let commissionErr = unit01(raw.commissionErr);
        if (commissionErr === null) commissionErr = noGoTrials > 0 ? clamp01(commissions / noGoTrials) : 0;

        let omissionErr = unit01(raw.omissionErr);
        if (omissionErr === null) omissionErr = goTrials > 0 ? clamp01(omissions / goTrials) : 0;

        const meanRT = toNum(raw.meanRT ?? raw.avgRT ?? raw.meanRt, 0);
        const rtVar = toNum(raw.rtVar ?? raw.sdRT ?? raw.stdRT ?? raw.stdDev, 0);

        // 与模板一致的综合分公式
        const normRT = clamp01(1 - meanRT / 800);
        const normVar = clamp01(1 - rtVar / 300);
        const composite = Number.isFinite(Number(raw.composite))
            ? Number(raw.composite)
            : clamp01(
            0.4 * hitRate +
            0.6 * (1 - commissionErr) -
            0.3 * omissionErr +
            0.2 * normRT +
            0.2 * normVar -
            0.1 * Math.abs(normRT - normVar)
        ) * 100;

        return {
            totalTrials: toNum(raw.totalTrials, goTrials + noGoTrials),
            goTrials,
            noGoTrials,
            hits,
            commissions,
            omissions,
            hitRate,
            commissionErr,
            omissionErr,
            meanRT,
            rtVar,
            composite,
        };
    }

    function stripCodeFences(s = '') {
        return s.replace(/^```[a-z]*\s*/i, '').replace(/```$/i, '').trim();
    }


    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setErr("");
                const cleaned = stripCodeFences(code);

                const bareUse = (name) =>
                    new RegExp(String.raw`(^|[^.\w$])${name}\s*\(`).test(cleaned); // 不是 React.useX(...)
                const declaredUse = (name) =>
                    // 解构或单独声明，= React 或 = window.React 都算已声明
                    new RegExp(
                        String.raw`\b(?:const|let|var)\s*(?:\{[^}]*\b${name}\b[^}]*\}|${name})\s*=\s*(?:window\.)?React\b`
                    ).test(cleaned) ||
                    new RegExp(String.raw`\b(?:const|let|var)\s+${name}\b\s*=`).test(cleaned) ||
                    new RegExp(String.raw`${name}\s*=\s*(?:window\.)?React\.${name}\b`).test(cleaned);


                // 是否需要我们帮忙解构 hooks（模型代码里用到了 useState/useEffect/useRef，但没有自己解构）
                const needsUseState = bareUse("useState") && !declaredUse("useState");
                const needsUseEffect = bareUse("useEffect") && !declaredUse("useEffect");
                const needsUseRef = bareUse("useRef") && !declaredUse("useRef");


                const hookPieces = [];
                if (needsUseState) hookPieces.push("useState");
                if (needsUseEffect) hookPieces.push("useEffect");
                if (needsUseRef) hookPieces.push("useRef");

                // 2) 只在真的用到 h(...) 且没声明过 h 时，才注入 h
                const callsH = /\bh\s*\(/.test(cleaned);
                const hasH = /\b(?:const|let|var)\s+h\s*=/.test(cleaned);
                const needsH = callsH && !hasH;

                // 3) 先注入 hooks（只注入缺的那些），再注入 h；都基于 window.React
                const prologue = [
                    hookPieces.length ? `const { ${hookPieces.join(", ")} } = window.React;` : "",
                    needsH ? "const h = window.React.createElement;" : "",
                ]
                    .filter(Boolean)
                    .join("\n");

                const wrapped = `${prologue}\n${cleaned}`;

                const mod = await importModuleFromString(wrapped);
                if (!mod?.default) throw new Error("Module did not export a default component");

                if (mounted) {
                    setComp(() => mod.default);
                    if (mod.meta && typeof mod.meta === "object") {
                        setMeta(mod.meta);
                        onMeta?.(mod.meta);
                    } else {
                        setMeta(null);
                        onMeta?.(null);
                    }
                    explainRef.current = typeof mod.explain === "function" ? mod.explain : null;
                }
            } catch (e) {
                const msg = e?.message || String(e);
                if (mounted) setErr(msg);
                onError?.(msg);
                console.error("[DynamicGameRunner] Load error:", msg);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [code]);


    // 点击“开始游戏”后才挂载 Comp
    const handleStart = () => setStarted(true);

    // 包装 onFinish：先按自由模块的 explain 解释，否则回退
    const handleFinish = async (metrics) => {
        const safe = normalizeMetrics(metrics || {});
        // 解释逻辑见改动 2）
        await Promise.resolve(fallbackExplain?.(safe));  // 始终走“原来的委婉解释”
        onFinish?.(safe);
    };

    if (err) {
        return (
            <div className="bg-white rounded-2xl shadow p-4">
                <h2 className="font-semibold">Failed to run</h2>
                <p className="text-sm text-rose-600 mt-2">{err}</p>
                <div className="mt-3">
                    <button className="rounded-xl border px-4 py-2 hover:bg-slate-50" onClick={onCancel}>Back</button>
                </div>
            </div>
        );
    }

    // 规则预览页（未开始）
    if (!started) {
        return (
            <div className="bg-white rounded-2xl shadow p-4 text-left">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="font-semibold">{meta?.title || "Freeform Game"}</h2>
                        <p className="text-xs text-slate-500 mt-1">Duration ≤ {durationSec}s</p>
                    </div>
                    <button className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50" onClick={onCancel}>Back</button>
                </div>
                <div className="mt-3">
                    <h3 className="text-sm font-semibold">Rules</h3>
                    {Array.isArray(meta?.rules) && meta.rules.length > 0 ? (
                        <ul className="list-disc pl-6 mt-1 text-sm">
                            {meta.rules.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-600">Follow on-screen instructions; the game ends automatically when time is up.</p>
                    )}
                    {meta?.scoringNotes && <p className="text-xs text-slate-500 mt-2">Scoring notes: {meta.scoringNotes}</p>}
                </div>
                <div className="mt-4">
                    <button
                        className="rounded-xl bg-violet-600 text-white px-4 py-2 font-semibold shadow hover:bg-violet-700"
                        onClick={handleStart}>
                        Start
                    </button>
                </div>
            </div>
        );
    }

    if (!Comp) {
        return <div className="bg-white rounded-2xl shadow p-4 text-sm text-slate-600">Loading game module…</div>;
    }

    // 真正开始后，隐藏“开始”按钮，仅渲染游戏组件
    return (
        <div className="bg-white rounded-2xl shadow p-4">
            <Comp onFinish={handleFinish} onCancel={onCancel} tokens={fallbackTokens} durationSec={durationSec}/>
        </div>
    );
}

// 将字符串作为 ES Module 动态 import
async function importModuleFromString(code) {
    const blob = new Blob([code], {type: "text/javascript"});
    const url = URL.createObjectURL(blob);
    try {
        const mod = await import(/* @vite-ignore */ url);
        return mod;
    } finally {
        URL.revokeObjectURL(url);
    }
}

function clamp01(x) {
    return Math.max(0, Math.min(1, x));
}

function stddev(arr) {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    const v = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1 || 1);
    return Math.sqrt(v);
}
