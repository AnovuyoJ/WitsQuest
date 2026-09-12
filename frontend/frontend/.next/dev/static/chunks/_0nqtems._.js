(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/OfflineSyncProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>OfflineSyncProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useOfflineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/useOfflineSync.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function OfflineSyncProvider({ children }) {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useOfflineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineSync"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false, {
        fileName: "[project]/components/OfflineSyncProvider.tsx",
        lineNumber: 7,
        columnNumber: 10
    }, this);
}
_s(OfflineSyncProvider, "Wcl/xI8G7WF6L9jheBbh+8cVX6o=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$useOfflineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useOfflineSync"]
    ];
});
_c = OfflineSyncProvider;
var _c;
__turbopack_context__.k.register(_c, "OfflineSyncProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "API_URL",
    ()=>API_URL,
    "apiRequest",
    ()=>apiRequest,
    "getAdminAccess",
    ()=>getAdminAccess
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseClient.ts [app-client] (ecmascript)");
;
const API_URL = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
async function apiRequest(path, method = "GET", body) {
    try {
        const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
        if (error || !session) return {
            data: null,
            error: {
                message: "You must be signed in.",
                status: 401
            }
        };
        const response = await fetch(`${API_URL}/api${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json"
            },
            ...body === undefined ? {} : {
                body: JSON.stringify(body)
            },
            cache: "no-store"
        });
        const result = await response.json();
        if (!response.ok) return {
            data: null,
            error: {
                message: result.message || "Request failed.",
                status: response.status,
                code: result.code
            }
        };
        return {
            data: result,
            error: null
        };
    } catch  {
        return {
            data: null,
            error: {
                message: "Could not reach the server. Try again."
            }
        };
    }
}
async function getAdminAccess() {
    const { data } = await apiRequest("/me");
    return data?.isAdmin === true;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/offlineDb.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cacheChallenge",
    ()=>cacheChallenge,
    "cacheEvents",
    ()=>cacheEvents,
    "deleteAttempt",
    ()=>deleteAttempt,
    "getCachedChallenge",
    ()=>getCachedChallenge,
    "getCachedEvents",
    ()=>getCachedEvents,
    "getUnsyncedAttempts",
    ()=>getUnsyncedAttempts,
    "markAttemptSynced",
    ()=>markAttemptSynced,
    "queueOfflineAttempt",
    ()=>queueOfflineAttempt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$idb$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/idb/build/index.js [app-client] (ecmascript)");
;
let dbPromise = null;
function getDb() {
    if (!dbPromise) {
        dbPromise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$idb$2f$build$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["openDB"])('witsquest-offline', 2, {
            upgrade (db, oldVersion) {
                if (!db.objectStoreNames.contains('events')) {
                    db.createObjectStore('events', {
                        keyPath: 'id'
                    });
                }
                if (!db.objectStoreNames.contains('challenges')) {
                    db.createObjectStore('challenges', {
                        keyPath: 'event_id'
                    });
                }
                if (!db.objectStoreNames.contains('attempts')) {
                    db.createObjectStore('attempts', {
                        keyPath: 'id'
                    });
                }
            }
        });
    }
    return dbPromise;
}
async function cacheEvents(events) {
    const db = await getDb();
    const tx = db.transaction('events', 'readwrite');
    await Promise.all(events.map((event)=>tx.store.put(event)));
    await tx.done;
}
async function getCachedEvents() {
    const db = await getDb();
    return db.getAll('events');
}
async function cacheChallenge(challenge) {
    const db = await getDb();
    await db.put('challenges', challenge);
}
async function getCachedChallenge(eventId) {
    const db = await getDb();
    return db.get('challenges', eventId);
}
async function queueOfflineAttempt(attempt) {
    const db = await getDb();
    await db.put('attempts', {
        ...attempt,
        synced: false
    });
}
async function getUnsyncedAttempts() {
    const db = await getDb();
    const all = await db.getAll('attempts');
    return all.filter((a)=>!a.synced);
}
async function markAttemptSynced(id) {
    const db = await getDb();
    const attempt = await db.get('attempts', id);
    if (attempt) {
        attempt.synced = true;
        await db.put('attempts', attempt);
    }
}
async function deleteAttempt(id) {
    const db = await getDb();
    await db.delete('attempts', id);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/offlineSync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "syncOfflineAttempts",
    ()=>syncOfflineAttempts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineDb$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/offlineDb.ts [app-client] (ecmascript)");
;
;
async function syncOfflineAttempts() {
    const pending = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineDb$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getUnsyncedAttempts"])();
    if (pending.length === 0) return [];
    // Sort oldest-first, so attempts are validated in the order they
    // actually happened.
    pending.sort((a, b)=>a.attemptedAt.localeCompare(b.attemptedAt));
    const results = [];
    for (const attempt of pending){
        const { error } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiRequest"])(`/events/${encodeURIComponent(attempt.eventId)}/submit-answer`, "POST", {
            challengeId: attempt.challengeId,
            answer: attempt.answer,
            attemptedAt: attempt.attemptedAt,
            latitude: attempt.latitude,
            longitude: attempt.longitude
        });
        if (error) {
            results.push({
                attempt,
                success: false,
                message: error.message
            });
            continue;
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineDb$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["markAttemptSynced"])(attempt.id);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineDb$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["deleteAttempt"])(attempt.id); // clean up now that it's confirmed on the server
        results.push({
            attempt,
            success: true
        });
    }
    return results;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/supabaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://leplghszfdvnzxmyimcs.supabase.co");
const supabaseAnonKey = ("TURBOPACK compile-time value", "sb_publishable_DW2oNelI1v1wkwOUdOxDVw_2xjX1jOJ");
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabase = {
    auth: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey).auth
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/useOfflineSync.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useOfflineSync",
    ()=>useOfflineSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/offlineSync.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function useOfflineSync() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useOfflineSync.useEffect": ()=>{
            // Attempt a sync on mount, in case we're already online with
            // leftover queued attempts from earlier.
            if (navigator.onLine) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncOfflineAttempts"])().then({
                    "useOfflineSync.useEffect": (results)=>{
                        if (results.length > 0) {
                            console.log("Offline attempt sync (on load):", results);
                        }
                    }
                }["useOfflineSync.useEffect"]);
            }
            function handleOnline() {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$offlineSync$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["syncOfflineAttempts"])().then({
                    "useOfflineSync.useEffect.handleOnline": (results)=>{
                        if (results.length > 0) {
                            console.log("Offline attempt sync (reconnect):", results);
                        }
                    }
                }["useOfflineSync.useEffect.handleOnline"]);
            }
            window.addEventListener("online", handleOnline);
            return ({
                "useOfflineSync.useEffect": ()=>window.removeEventListener("online", handleOnline)
            })["useOfflineSync.useEffect"];
        }
    }["useOfflineSync.useEffect"], []);
}
_s(useOfflineSync, "OD7bBpZva5O2jO+Puf00hKivP7c=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0nqtems._.js.map