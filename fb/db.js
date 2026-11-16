/* Общий слой данных: Firebase (боевой) или локальная копия для проверки (?mock).
   API: DB.ready, DB.doc(p).get/set/del/on, DB.col(p).get/on, DB.auth.* */
(function () {
  "use strict";
  const Q = new URLSearchParams(location.search);
  const MOCK = Q.has("mock") || !window.FB_CONFIG;
  const sid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const clean = o => JSON.parse(JSON.stringify(o, (k, v) => v === undefined ? null : v));
  let impl;

  if (!MOCK) {
    const app = firebase.initializeApp(window.FB_CONFIG);
    const fs = firebase.firestore(), auth = firebase.auth();
    try { fs.settings({ignoreUndefinedProperties: true, merge: true}); } catch (e) {}
    const conv = s => s.exists ? Object.assign({id: s.id}, s.data()) : null;
    let creator = null;
    impl = {
      ready: new Promise(res => { const u = auth.onAuthStateChanged(() => { u(); res(); }); }),
      doc: p => ({
        get: () => fs.doc(p).get().then(conv),
        set: (d, merge) => fs.doc(p).set(clean(d), {merge: !!merge}),
        del: () => fs.doc(p).delete(),
        on: (cb, err) => fs.doc(p).onSnapshot(s => cb(conv(s)), e => { console.warn(p, e); err && err(e); })
      }),
      col: p => ({
        get: () => fs.collection(p).get().then(q => q.docs.map(conv)),
        on: (cb, err) => fs.collection(p).onSnapshot(q => cb(q.docs.map(conv)), e => { console.warn(p, e); err && err(e); })
      }),
      auth: {
        user: () => auth.currentUser ? {email: auth.currentUser.email, uid: auth.currentUser.uid, name: auth.currentUser.displayName} : null,
        onChange: cb => auth.onAuthStateChanged(u => cb(u ? {email: u.email, uid: u.uid, name: u.displayName} : null)),
        teacher: async () => { const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt: "select_account"});
          try { await auth.signInWithPopup(p); } catch (e) { if (/popup/.test(e.code || "")) return auth.signInWithRedirect(p); throw e; } },
        student: (email, pw) => auth.signInWithEmailAndPassword(email, pw),
        create: async (email, pw) => {
          if (!creator) creator = firebase.initializeApp(window.FB_CONFIG, "creator");
          await creator.auth().createUserWithEmailAndPassword(email, pw); await creator.auth().signOut();
        },
        out: () => auth.signOut()
      }
    };
  } else {
    /* Локальная копия: документы хранятся как retained-сообщения на локальном MQTT-брокере */
    const url = Q.get("broker") || "ws://localhost:8883/mqtt";
    const cache = new Map(), subs = new Set();
    const c = mqtt.connect(url, {clientId: "mockdb_" + sid(), reconnectPeriod: 1000});
    const emit = () => subs.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    let readyRes; const ready = new Promise(r => readyRes = r);
    c.on("connect", () => { c.subscribe("mockdb/#", {qos: 1}); setTimeout(readyRes, 600); });
    c.on("message", (t, m) => { const p = t.slice(7); const s = m.toString(); if (!s) cache.delete(p); else try { cache.set(p, JSON.parse(s)); } catch (e) {} emit(); });
    const put = (p, d) => new Promise(res => { if (d == null) cache.delete(p); else cache.set(p, d); c.publish("mockdb/" + p, d == null ? "" : JSON.stringify(d), {qos: 1, retain: true}, () => res()); emit(); });
    const docGet = p => cache.has(p) ? Object.assign({id: p.split("/").pop()}, cache.get(p)) : null;
    const colGet = p => { const n = p.split("/").length + 1, out = [];
      cache.forEach((v, k) => { if (k.startsWith(p + "/") && k.split("/").length === n) out.push(Object.assign({id: k.split("/").pop()}, v)); }); return out; };
    const watch = (fn, cb) => { let last = ""; const f = () => { const v = fn(), s = JSON.stringify(v); if (s !== last) { last = s; cb(v); } }; subs.add(f); ready.then(f); return () => subs.delete(f); };
    const AK = "mock_auth_user";
    let user = null; try { user = JSON.parse(localStorage.getItem(AK) || "null"); } catch (e) {}
    const listeners = new Set(); const setUser = u => { user = u; localStorage.setItem(AK, JSON.stringify(u)); listeners.forEach(f => f(u)); };
    impl = {
      ready,
      doc: p => ({
        get: () => ready.then(() => docGet(p)),
        set: (d, merge) => ready.then(() => put(p, merge ? Object.assign({}, cache.get(p) || {}, clean(d)) : clean(d))),
        del: () => put(p, null),
        on: cb => watch(() => docGet(p), cb)
      }),
      col: p => ({ get: () => ready.then(() => colGet(p)), on: cb => watch(() => colGet(p), cb) }),
      auth: {
        user: () => user,
        onChange: cb => { listeners.add(cb); ready.then(() => cb(user)); return () => listeners.delete(cb); },
        teacher: async () => setUser({email: "teacher@mock", uid: "T1", name: "Преподаватель (тест)"}),
        student: async (email, pw) => { await ready; const a = cache.get("__auth/" + email.replace(/[.@]/g, "_"));
          if (!a || a.pw !== pw) { const e = new Error("wrong"); e.code = "auth/wrong-password"; throw e; } setUser({email, uid: "U_" + email, name: ""}); },
        create: async (email, pw) => { await ready; await put("__auth/" + email.replace(/[.@]/g, "_"), {pw}); },
        out: async () => setUser(null)
      }
    };
  }
  impl.mock = MOCK; impl.id = sid;
  impl.now = () => Date.now();
  window.DB = impl;
})();
