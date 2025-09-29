import React, {useMemo, useRef, useState, useEffect} from "react";

// ★ 必加：把 React 暴露到全局，供自由模式模块使用
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
    const [scaleName, setScaleName] = useState("未命名量表");
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

    // 主题预设
    const themes = [
        {id: "animals", label: "小动物", defaults: "🐶 🐱 🐰 🐼 🦊 🦁"},
        {id: "plants", label: "植物园", defaults: "🌱 🌿 🌼 🌷 🌵 🍀"},
        {id: "space", label: "太空", defaults: "🪐 🌟 🚀 👽 🌌 ☄️"},
        {id: "ocean", label: "海洋", defaults: "🐠 🐳 🐙 🐬 🐚 🦀"},
        {id: "vehicles", label: "交通", defaults: "🚗 🚌 🚲 🚀 🚃 🚁"},
        {id: "custom", label: "自定义", defaults: "⭐️ 💡 🎈"},
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
            setScaleName((prev) => (prev && prev !== "未命名量表" ? prev : base));
            const reader = new FileReader();
            reader.onload = () => {
                const raw = typeof reader.result === "string" ? reader.result : "";
                setRawScale(stripBOM(raw));
            };
            reader.onerror = () => setError("读取文件失败，请确认为 JSON/CSV/TXT 文本文件。");
            reader.readAsText(file, "utf-8");
        } catch (err) {
            setError(`读取失败：${(err && err.message) || String(err)}`);
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
            setError("请先上传或粘贴量表内容。");
            return;
        }

        setStatus("generating");

        const stimuliTokens = tokensForPlay;
        const safeTokens = stimuliTokens.length >= 2 ? stimuliTokens : ["🙂", "🙃"];

        // 默认规格（Go/No-Go），时长 12s
        const defaultSpec = {
            template: "goNoGo",
            name: `${scaleName || "ADHD 任务"} - Go/No-Go`,
            durationSec: 12,
            isiMs: 1000,
            targetRatio: 0.7,
            noGoToken: safeTokens[0] ?? "❌",
            tokens: safeTokens,
            mapping: parsedScale.items.map((it) => ({itemId: it.id, weight: 1})),
            scoring: {
                weights: {commissionErr: 0.5, omissionErr: 0.3, meanRT: 0.2, rtVar: 0.2},
                advisories: [
                    {when: "commissionErr>0.25", text: "抑制控制（No-Go）可能存在困难。"},
                    {when: "omissionErr>0.2", text: "持续注意与专注可能不足。"},
                    {when: "rtVar>180", text: "反应时波动较大，可能存在注意维持挑战。"},
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
要求：严格 JSON，不要解释，不要 Markdown。`,
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
                    throw new Error(`LLM 请求失败：${resp.status}｜${msg}`);
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
      title: "中文标题",
      rules: ["要点1", "要点2", "要点3"],       // concise Chinese bullet rules shown BEFORE start
      scoringNotes: "简述如何计算指标（中文）"   // brief note
    };
    export function explain(metrics) {          // return a short Chinese paragraph for parents
      // metrics: {hitRate, commissionErr, omissionErr, meanRT, rtVar, composite}
      return "…";
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
                    throw new Error(`LLM 请求失败：${resp.status}｜${msg}`);
                }
                const data = JSON.parse(raw);
                const code = data.choices?.[0]?.message?.content?.trim();
                if (!code || !/export\s+default/.test(code)) {
                    throw new Error("返回内容不含有效的 default 导出组件");
                }
                setAiGameCode(code);
                setStatus("playing");
            }
        } catch (e) {
            console.error(e);
            setError(`生成失败：${e.message}。已回退到本地默认规格。`);
            setGameSpec(defaultSpec);
            setStatus("playing");
        }
    }

    // —— 结果解释（模板 & 自由模式回退）
    async function handleExplainResult(metrics) {
        if (!metrics) return;
        if (!apiKey) { // 本地回退
            const msgs = [];
            if (metrics.commissionErr > 0.25) msgs.push("No-Go 抑制错误较多");
            if (metrics.omissionErr > 0.2) msgs.push("遗漏率较高（可能专注不足）");
            if (metrics.rtVar > 180) msgs.push("反应时波动偏大");
            setReportText(`【非医疗结论】小游戏显示：${msgs.join("；") || "整体表现稳定"}。建议结合正式量表与专业评估综合判断。`);
            return;
        }
        try {
            const sys = `You are a clinician-assistant. Write a short, empathetic, non-diagnostic summary for parents (Chinese), based on Go/No-Go or Oddball metrics. Avoid medical claims.`;
            const u = {
                role: "user",
                content: `Metrics: ${JSON.stringify(metrics)}\n请用中文，以 2-4 句短段落，避免诊断性词汇，给出温和建议。`
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
                throw new Error(`LLM 请求失败：${resp.status}｜${msg}`);
            }
            const data = JSON.parse(raw);
            const text = data.choices?.[0]?.message?.content?.trim() || "";
            setReportText(text);
        } catch (e) {
            setReportText(
                `【本地摘要】感谢参与。小游戏指标显示：抑制错误 ${(metrics.commissionErr * 100).toFixed(1)}%，遗漏 ${(metrics.omissionErr * 100).toFixed(1)}%，平均反应时 ${metrics.meanRT.toFixed(0)}ms。建议结合正式量表与专业评估。`
            );
        }
    }

    return (
        <div className="min-h-screen bg-[#fff8dc] text-slate-800 flex flex-col items-center">
            <header className="text-center px-4 py-6">
                <h1 className="text-2xl md:text-3xl font-bold">ADHD 个性化趣味检测 · 小游戏生成器</h1>
                <p className="text-sm text-slate-600 mt-1">仅作教育与预筛查辅助展示，不能替代专业诊断。</p>
            </header>

            <main className="w-full px-4 py-10 md:py-16 flex flex-col gap-8">
            {/* 配置卡片 */}
                {status !== "playing" && (
                    <section className="w-full max-w-5xl mx-auto grid gap-4 md:grid-cols-[2fr_1fr]">
                        {/* 左：量表输入 */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2">1) 上传或粘贴量表</h2>
                            <input type="file" accept=".json,.csv,.txt" onChange={handleFileUpload}
                                   className="border rounded-lg px-3 py-2"/>
                            <div className="flex gap-2 items-center mb-2 mt-2">
                                <input className="border rounded-lg px-3 py-2 w-1/2" placeholder="量表名称（可选）"
                                       value={scaleName} onChange={(e) => setScaleName(e.target.value)}/>
                                <label className="text-xs text-slate-500">支持 JSON / CSV / 每行一题</label>
                            </div>
                            <textarea className="w-full h-48 border rounded-xl p-3 font-mono text-sm"
                                      placeholder={`示例（每行一题）：\n1, 在课堂上很难安静坐好\n2, 经常分心，注意力难以维持\n...`}
                                      value={rawScale} onChange={(e) => setRawScale(e.target.value)}/>
                            <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                                <span>已解析条目：{parsedScale.items.length} 条</span>
                                {parsedScale.items.length > 0 && (
                                    <span
                                        className="truncate">示例：{parsedScale.items.slice(0, 3).map((i) => i.text).join(" / ")}{parsedScale.items.length > 3 ? "..." : ""}</span>
                                )}
                            </div>
                        </div>

                        {/* 右：主题 & API Key & 模式 */}
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold mb-2">2) 选择主题元素</h2>
                            <div className="grid grid-cols-2 gap-4 mb-2">
                                {themes.map((t) => (
                                    <button key={t.id} onClick={() => setTheme(t.id)}
                                            className={`rounded-xl border px-3 py-3 text-center w-full ${theme === t.id ? "border-sky-500 bg-sky-50" : "hover:bg-slate-50"}`}>
                                        <div className="text-sm font-medium">{t.label}</div>
                                        <div className="text-lg mt-1">{t.defaults}</div>
                                    </button>
                                ))}
                            </div>

                            {theme === "custom" && (
                                <div className="mt-2">
                                    <label className="text-sm">自定义元素（用空格分隔，支持 emoji / 词语）</label>
                                    <input className="mt-1 w-full border rounded-lg px-3 py-2" value={customTokens}
                                           onChange={(e) => setCustomTokens(e.target.value)}/>
                                </div>
                            )}

                            <div className="mt-4">
                                <h3 className="font-semibold mb-1">玩法模式</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <button
                                        className={`rounded-lg border px-3 py-2 ${mode === "template" ? "border-sky-500 bg-sky-50" : "hover:bg-slate-50"}`}
                                        onClick={() => setMode("template")}>固定模板（稳妥）
                                    </button>
                                    <button
                                        className={`rounded-lg border px-3 py-2 ${mode === "freeform" ? "border-violet-500 bg-violet-50" : "hover:bg-slate-50"}`}
                                        onClick={() => setMode("freeform")}>自由生成（每次不同）
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">自由生成会让 AI 输出完整的小游戏 React
                                    组件，并附带“规则”和“解释函数”。</p>
                            </div>

                            <div className="mt-4">
                                <h3 className="font-semibold mb-1">（可选）粘贴 ChatGPT API Key</h3>
                                <input className="w-full border rounded-lg px-3 py-2" type="password"
                                       placeholder="sk-...（仅用于本地浏览器内存）" value={apiKey}
                                       onChange={(e) => setApiKey(e.target.value)}/>
                                <p className="text-xs text-slate-500 mt-1">未填也可运行：将使用本地默认模板生成小游戏。</p>
                            </div>

                            <button onClick={handleGenerateSpec}
                                    className="mt-4 w-full rounded-xl bg-sky-600 text-white py-2 font-semibold shadow hover:bg-sky-700"
                                    disabled={status === "generating"}>
                                {status === "generating" ? "正在生成…" : "3) 生成小游戏"}
                            </button>

                            {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
                            {runtimeErr && <p className="text-sm text-rose-600 mt-2">运行错误：{runtimeErr}</p>}
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
                                <p className="text-sm text-rose-600">未取得模板规格。</p>
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
                                onError={(msg) => setRuntimeErr(String(msg || "未知错误"))}
                                onExplainText={(text) => setReportText(text)}           // UPDATE: 接收自由模式解释
                                onMeta={(meta) => setFreeformMeta(meta)}                 // UPDATE: 接收自由模式规则/标题
                                fallbackExplain={(m) => handleExplainResult(m)}          // UPDATE: 缺失 explain 时的回退
                            />
                        ) : (
                            <p className="text-sm text-slate-600">正在准备自由生成小游戏…</p>
                        )}
                    </section>
                )}

                {status === "finished" && (
                    <section className="w-full max-w-5xl mx-auto grid gap-4 md:grid-cols-2">
                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold">结果指标</h2>
                            {gameResult ? (
                                <ul className="mt-2 text-sm leading-7">
                                    <li>命中率（目标正确点击）：{(gameResult.hitRate * 100).toFixed(1)}%</li>
                                    <li>误击（不应点却点了）：{(gameResult.commissionErr * 100).toFixed(1)}%</li>
                                    <li>遗漏（应点未点）：{(gameResult.omissionErr * 100).toFixed(1)}%</li>
                                    <li>平均反应时：{gameResult.meanRT.toFixed(0)} ms</li>
                                    <li>反应时波动（SD）：{gameResult.rtVar.toFixed(0)} ms</li>
                                    <li>综合分：{gameResult.composite.toFixed(1)} / 100</li>
                                </ul>
                            ) : (
                                <p className="text-sm">暂无。</p>
                            )}
                            <div className="mt-4 flex gap-2">
                                <button className="rounded-xl border px-4 py-2 hover:bg-slate-50"
                                        onClick={() => {
                                            setStatus("playing");
                                            setGameResult(null);
                                            setReportText("");
                                        }}>
                                    再次游玩
                                </button>
                                <button className="rounded-xl border px-4 py-2 hover:bg-slate-50"
                                        onClick={() => {
                                            setStatus("idle");
                                            setGameSpec(null);
                                            setAiGameCode("");
                                            setFreeformMeta(null);
                                        }}>
                                    返回配置
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow p-4">
                            <h2 className="font-semibold">结果解释（非诊断）</h2>
                            <p className="text-sm whitespace-pre-wrap mt-2 min-h-24">{reportText || "正在生成…"}</p>
                            <p className="text-xs text-slate-500 mt-4">重要声明：本工具仅作为趣味化预筛查与亲子互动的辅助手段，不能替代临床诊断或专业评估。</p>
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
                        时长约 {durationSec}s · 每 {isiMs}ms 刺激一次 ·{" "}
                        {template === "goNoGo" ? (
                            <>提示：看到 <span className="font-medium">{spec.noGoToken || "🚫"}</span> 不要点击</>
                        ) : (
                            <>提示：只有看到 <span
                                className="font-medium">{spec.targetToken || spec.tokens?.[0] || "⭐"}</span> 才点击</>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button className="rounded-xl border px-4 py-2 hover:bg-slate-50" onClick={onCancel}>返回</button>
                </div>
            </div>

            <TemplateCountdownPanel running={running} countdown={countdown}/>

            {running && (
                <div className="mt-6">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>剩余时间：{timeLeft}s</span>
                        {template === "goNoGo"
                            ? <span>提示：看到 {spec.noGoToken || "🚫"} 不要点击</span>
                            : <span>提示：只在 {spec.targetToken || spec.tokens?.[0] || "⭐"} 时点击</span>}
                    </div>
                    <div className="mt-4 grid place-items-center">
                        <button onClick={handleTap}
                                className="select-none w-56 h-56 text-7xl rounded-3xl bg-gradient-to-b from-sky-50 to-sky-100 border shadow-inner active:translate-y-[1px]">
                            <span>{current?.token ?? ""}</span>
                        </button>
                    </div>
                    <p className="text-center text-slate-500 mt-4">
                        {template === "goNoGo" ? <>快速点击非 {spec.noGoToken || "🚫"} 的可爱元素！</>
                            : <>只在看到 {spec.targetToken || spec.tokens?.[0] || "⭐"} 时点击！</>}
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
            <p className="text-lg">准备开始…</p>
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
                if (!mod?.default) throw new Error("模块未导出 default 组件");

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
                <h2 className="font-semibold">运行失败</h2>
                <p className="text-sm text-rose-600 mt-2">{err}</p>
                <div className="mt-3">
                    <button className="rounded-xl border px-4 py-2 hover:bg-slate-50" onClick={onCancel}>返回</button>
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
                        <h2 className="font-semibold">{meta?.title || "自由生成小游戏"}</h2>
                        <p className="text-xs text-slate-500 mt-1">时长 ≤ {durationSec}s</p>
                    </div>
                    <button className="rounded-xl border px-3 py-1 text-sm hover:bg-slate-50" onClick={onCancel}>返回
                    </button>
                </div>
                <div className="mt-3">
                    <h3 className="text-sm font-semibold">规则</h3>
                    {Array.isArray(meta?.rules) && meta.rules.length > 0 ? (
                        <ul className="list-disc pl-6 mt-1 text-sm">
                            {meta.rules.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-600">开始前请根据屏幕提示进行操作；计时到达后自动结束。</p>
                    )}
                    {meta?.scoringNotes && <p className="text-xs text-slate-500 mt-2">评分提示：{meta.scoringNotes}</p>}
                </div>
                <div className="mt-4">
                    <button
                        className="rounded-xl bg-violet-600 text-white px-4 py-2 font-semibold shadow hover:bg-violet-700"
                        onClick={handleStart}>
                        开始游戏
                    </button>
                </div>
            </div>
        );
    }

    if (!Comp) {
        return <div className="bg-white rounded-2xl shadow p-4 text-sm text-slate-600">正在加载小游戏模块…</div>;
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
