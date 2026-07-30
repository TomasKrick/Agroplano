(function () {
  "use strict";

  var cfg = window.AGROPLANO_CLOUD || {};
  var LIB_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.2/dist/umd/supabase.min.js";
  var BACKEND_APPLICATION_ID = "agroplano-gestion-demo";
  var DB_NAME = "agroplano-demo-cloud-v1";
  var DB_VERSION = 1;
  var WORKSPACE_KEY = "agroplano_demo_cloud_workspace";
  var BOOTSTRAP_MUTATION_KEY = "agroplano_demo_bootstrap_mutation";
  var TAB_ID = (function () {
    try {
      var existing = sessionStorage.getItem("agroplano_demo_cloud_tab_id");
      if (existing) return existing;
      var created = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Date.now()) + Math.random();
      sessionStorage.setItem("agroplano_demo_cloud_tab_id", created);
      return created;
    } catch (_) {
      return String(Date.now()) + Math.random();
    }
  })();

  var client = null;
  var session = null;
  var user = null;
  var workspaces = [];
  var workspaceId = "";
  var workspaceName = "";
  var role = "";
  var documentId = "";
  var currentVersion = 0;
  var currentHash = "";
  var lastRemoteState = null;
  var lastRemoteSerialized = "";
  var dirtyItem = null;
  var inflight = null;
  var conflictRemote = null;
  var multipleLocalDrafts = 0;
  var draftDownloaded = false;
  var realtimeChannel = null;
  var membershipChannel = null;
  var saveTimer = null;
  var applyingRemote = false;
  var appHooks = {};
  var started = false;
  var panelOpen = false;
  var panelReady = false;
  var authSequence = 0;
  var contextGeneration = 0;
  var deferredRealtimeRefresh = false;
  var retryDelayMs = 1000;
  var bootstrapPromise = null;
  var installPrompt = null;
  var statusState = {
    kind: "local",
    text: "Solo en este equipo",
    detail: "La nube todavía no está configurada."
  };

  function configured() {
    return cfg.enabled === true &&
      /^https:\/\//i.test(String(cfg.supabaseUrl || "")) &&
      String(cfg.supabaseAnonKey || "").length > 20;
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.keys(value).sort().reduce(function (result, key) {
        result[key] = canonical(value[key]);
        return result;
      }, {});
    }
    return value;
  }

  function sharedString(value) {
    return JSON.stringify(canonical(value));
  }

  function staleContextError() {
    var error = new Error("La operación pertenece a una sesión anterior");
    error.code = "STALE_CONTEXT";
    return error;
  }

  function assertContext(generation, expectedDocumentId, expectedUserId) {
    if (generation !== contextGeneration ||
        (expectedDocumentId && expectedDocumentId !== documentId) ||
        (expectedUserId && (!user || expectedUserId !== user.id))) {
      throw staleContextError();
    }
  }

  function hasPendingLocalWork() {
    return !!(dirtyItem || inflight || bootstrapPromise);
  }

  function uuid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === "x" ? r : (r & 3 | 8);
      return v.toString(16);
    });
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function humanRole(value) {
    return value === "admin" ? "Administrador" :
      value === "editor" ? "Editor" :
      value === "viewer" ? "Solo lectura" :
      value === "bootstrap" ? "Configuración inicial" : "Sin rol";
  }

  function notify(message) {
    if (typeof appHooks.notify === "function") appHooks.notify(message);
  }

  function setStatus(kind, text, detail) {
    statusState = {
      kind: kind,
      text: text,
      detail: detail || ""
    };
    var chip = document.getElementById("syncStatus");
    if (chip) {
      chip.textContent = text;
      chip.classList.remove("saving", "synced", "cloudOffline", "cloudConflict", "cloudReadonly");
      if (kind === "synced") chip.classList.add("synced");
      if (kind === "saving" || kind === "pending") chip.classList.add("saving");
      if (kind === "offline") chip.classList.add("cloudOffline");
      if (kind === "conflict" || kind === "error") chip.classList.add("cloudConflict");
      if (kind === "readonly") chip.classList.add("cloudReadonly");
      chip.title = detail || text;
      chip.setAttribute("role", "button");
      chip.setAttribute("tabindex", "0");
      chip.setAttribute("aria-label", "Estado de sincronización: " + text);
    }
    renderPanel();
  }

  function setRole(nextRole) {
    role = nextRole || "";
    document.body.dataset.cloudRole = role || "none";
    if (typeof appHooks.onRole === "function") {
      appHooks.onRole(role, user ? {
        id: user.id,
        email: user.email || "",
        displayName: user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name) || ""
      } : null);
    }
  }

  function canEdit() {
    if (!configured()) return true;
    // Durante la apertura no conceder escritura por el solo hecho de tener una
    // sesión: el rol puede ser viewer y todavía no haberse cargado el documento.
    // El modo bootstrap sí necesita editar la base local antes de crear el
    // primer establecimiento, pero únicamente cuando la cuenta no tiene uno.
    if (session && !documentId) {
      return role === "admin" || role === "editor" ||
        (role === "bootstrap" && workspaces.length === 0);
    }
    return role === "admin" || role === "editor";
  }

  function canAdmin() {
    return configured() && role === "admin";
  }

  function isApplyingRemote() {
    return applyingRemote;
  }

  function loadLibrary() {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-agroplano-demo-supabase]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", function () {
          reject(new Error("No se pudo cargar la librería de sincronización"));
        }, { once: true });
        return;
      }
      var script = document.createElement("script");
      script.src = LIB_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.agroPlanoSupabase = "true";
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("No se pudo cargar la librería de sincronización"));
      };
      document.head.appendChild(script);
    });
  }

  function verifyBackendIdentity() {
    if (!client) return Promise.reject(new Error("Conexión no inicializada"));
    return client.rpc("agroplano_backend_identity").then(function (result) {
      if (result.error) {
        var missing = new Error("Este proyecto Supabase no está preparado para AgroPlano. Ejecute su migración en un proyecto nuevo y exclusivo.");
        missing.code = "WRONG_BACKEND";
        missing.cause = result.error;
        throw missing;
      }
      var info = result.data || {};
      if (info.applicationId !== BACKEND_APPLICATION_ID || Number(info.backendSchemaVersion) !== 1) {
        var wrong = new Error("La base configurada pertenece a otra aplicación. No se leyó ni se modificó ningún dato.");
        wrong.code = "WRONG_BACKEND";
        throw wrong;
      }
      return info;
    });
  }

  function openDb() {
    if (!window.indexedDB) return Promise.reject(new Error("IndexedDB no disponible"));
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "key" });
        if (!db.objectStoreNames.contains("cache")) db.createObjectStore("cache", { keyPath: "key" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function fallbackKey(store, key) {
    return "agroplano_demo_cloud_" + store + "_" + key;
  }

  function dbGet(store, key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, "readonly");
        var request = tx.objectStore(store).get(key);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      });
    }).catch(function () {
      try {
        var raw = localStorage.getItem(fallbackKey(store, key));
        return raw ? JSON.parse(raw) : null;
      } catch (_) {
        return null;
      }
    });
  }

  function dbGetAll(store) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, "readonly");
        var request = tx.objectStore(store).getAll();
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error); };
      });
    }).catch(function () {
      var items = [];
      try {
        var prefix = "agroplano_demo_cloud_" + store + "_";
        for (var index = 0; index < localStorage.length; index += 1) {
          var key = localStorage.key(index);
          if (!key || key.indexOf(prefix) !== 0) continue;
          try {
            var parsed = JSON.parse(localStorage.getItem(key));
            if (parsed) items.push(parsed);
          } catch (_) {}
        }
      } catch (_) {}
      return items;
    });
  }

  function dbPut(store, value) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(value);
        tx.oncomplete = function () { resolve(value); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function (primaryError) {
      try {
        localStorage.setItem(fallbackKey(store, value.key), JSON.stringify(value));
        return value;
      } catch (fallbackError) {
        var error = new Error("No hay espacio seguro para guardar el cambio pendiente");
        error.cause = fallbackError || primaryError;
        throw error;
      }
    });
  }

  function dbDelete(store, key) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () {
      try { localStorage.removeItem(fallbackKey(store, key)); } catch (_) {}
    });
  }

  function outboxPrefix() {
    return user && documentId ? user.id + ":" + documentId + ":" : "";
  }

  function newOutboxKey(mutationId) {
    var prefix = outboxPrefix();
    return prefix ? prefix + TAB_ID + ":" + mutationId : "";
  }

  function pendingDrafts() {
    if (!user || !documentId) return Promise.resolve([]);
    return dbGetAll("outbox").then(function (items) {
      return items.filter(function (item) {
        return item && item.userId === user.id && item.documentId === documentId;
      }).sort(function (a, b) {
        return String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || ""));
      });
    });
  }

  function cacheKey() {
    return user && workspaceId && documentId ? user.id + ":" + workspaceId + ":" + documentId : "";
  }

  function cacheDocument(doc) {
    var key = cacheKey();
    if (!key || !doc) return Promise.resolve();
    return dbPut("cache", {
      key: key,
      userId: user.id,
      workspaceId: workspaceId,
      documentId: documentId,
      role: role,
      doc: clone(doc),
      cachedAt: new Date().toISOString()
    });
  }

  function fetchDocument(targetDocumentId) {
    var id = targetDocumentId || documentId;
    if (!client || !id) return Promise.reject(new Error("Documento no abierto"));
    return client.from("app_documents")
      .select("id,workspace_id,doc_key,state,version,schema_version,state_hash,updated_at,updated_by")
      .eq("id", id)
      .single()
      .then(function (result) {
        if (result.error) throw result.error;
        return result.data;
      });
  }

  function applyDocument(doc, options) {
    options = options || {};
    if (!doc || !doc.state) return Promise.resolve();
    documentId = doc.id;
    currentVersion = Number(doc.version || 0);
    currentHash = String(doc.state_hash || "");
    lastRemoteState = clone(doc.state);
    lastRemoteSerialized = sharedString(lastRemoteState);
    return cacheDocument(doc).then(function () {
      if (options.skipApp) return;
      applyingRemote = true;
      try {
        if (typeof appHooks.applyRemote === "function") {
          appHooks.applyRemote(clone(doc.state), {
            workspaceId: workspaceId,
            workspaceName: workspaceName,
            documentId: documentId,
            version: currentVersion,
            role: role,
            updatedAt: doc.updated_at,
            updatedBy: doc.updated_by
          });
        }
      } finally {
        applyingRemote = false;
      }
    });
  }

  function applyDraftState(draftState) {
    if (!draftState || typeof appHooks.applyRemote !== "function") return;
    applyingRemote = true;
    try {
      appHooks.applyRemote(clone(draftState), {
        workspaceId: workspaceId,
        workspaceName: workspaceName,
        documentId: documentId,
        version: currentVersion,
        role: role,
        pending: true
      });
    } finally {
      applyingRemote = false;
    }
  }

  function stopRealtime() {
    if (client && realtimeChannel) client.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  function stopMembershipRealtime() {
    if (client && membershipChannel) client.removeChannel(membershipChannel);
    membershipChannel = null;
  }

  function refreshMembership(source) {
    if (!client || !user) return Promise.resolve(false);
    var expectedUserId = user.id;
    return listWorkspaces().then(function (items) {
      if (!user || user.id !== expectedUserId) return;
      workspaces = items;
      rememberWorkspaces(items);
      var selected = items.find(function (item) { return item.id === workspaceId; });
      if (!selected && !workspaceId && items.length && !bootstrapPromise) {
        selected = chooseWorkspace();
        return openWorkspace(selected.id, { allowPending: true }).then(function () { return true; });
      }
      if (!selected) {
        if (workspaceId) {
          setRole("");
          stopRealtime();
          setStatus("readonly", "Acceso retirado", "La copia local queda visible, pero este usuario ya no puede consultar ni modificar la base compartida.");
          renderPanel();
        }
        return false;
      }
      if (selected.role !== role) {
        setRole(selected.role);
        if (dirtyItem && selected.role === "viewer") {
          setStatus("readonly", "Solo lectura · borrador local", "Un Administrador cambió tu permiso. Descargá el borrador o pedí permiso de edición.");
        } else {
          setStatus(
            selected.role === "viewer" ? "readonly" : "synced",
            selected.role === "viewer" ? "Solo lectura · actualizado" : "Permiso actualizado",
            workspaceName + " · " + humanRole(selected.role) + " · " + source
          );
        }
        renderPanel();
      }
      return true;
    }).catch(function (error) {
      console.warn("No se pudo actualizar el permiso", error);
    });
  }

  function subscribeMembership() {
    stopMembershipRealtime();
    if (!client || !user) return;
    var subscribedUserId = user.id;
    membershipChannel = client.channel("agroplano-demo-membership-" + subscribedUserId)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "workspace_members",
        filter: "user_id=eq." + subscribedUserId
      }, function () {
        if (user && user.id === subscribedUserId && !bootstrapPromise) {
          refreshMembership("actualizado en tiempo real");
        }
      })
      .subscribe();
  }

  function subscribeDocument() {
    stopRealtime();
    if (!client || !documentId) return;
    var subscribedDocumentId = documentId;
    var subscribedGeneration = contextGeneration;
    realtimeChannel = client.channel("agroplano-demo-document-" + subscribedDocumentId)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "app_documents",
        filter: "id=eq." + subscribedDocumentId
      }, function () {
        if (subscribedGeneration === contextGeneration && subscribedDocumentId === documentId) {
          refreshHead("realtime", subscribedDocumentId, subscribedGeneration);
        }
      })
      .subscribe(function (status) {
        if (subscribedGeneration !== contextGeneration || subscribedDocumentId !== documentId) return;
        if (status === "SUBSCRIBED") refreshHead("subscribe", subscribedDocumentId, subscribedGeneration);
        if (status === "CHANNEL_ERROR" && navigator.onLine) {
          setStatus("error", "Conexión inestable", "No se perdió ningún dato. Tocá para reintentar.");
        }
      });
  }

  function refreshHead(source, targetDocumentId, generation) {
    var id = targetDocumentId || documentId;
    var expectedGeneration = generation == null ? contextGeneration : generation;
    var expectedUserId = user && user.id;
    if (!id || !client || !navigator.onLine) return Promise.resolve();
    return fetchDocument(id).then(function (doc) {
      assertContext(expectedGeneration, id, expectedUserId);
      if (Number(doc.version) < currentVersion) return;
      if (Number(doc.version) === currentVersion && sharedString(doc.state) === lastRemoteSerialized) {
        if (!dirtyItem && !inflight && statusState.kind === "pending") {
          setStatus(
            role === "viewer" ? "readonly" : "synced",
            role === "viewer" ? "Solo lectura · actualizado" : "Todo sincronizado",
            workspaceName + " · versión " + currentVersion
          );
        }
        return;
      }
      if (inflight) {
        deferredRealtimeRefresh = true;
        return;
      }
      if (dirtyItem) {
        conflictRemote = doc;
        setStatus(
          "conflict",
          "Necesita atención",
          "Llegó una versión nueva mientras este equipo tenía cambios pendientes."
        );
        return;
      }
      return applyDocument(doc).then(function () {
        setStatus(
          role === "viewer" ? "readonly" : "synced",
          role === "viewer" ? "Solo lectura · actualizado" : "Todo sincronizado",
          "Versión " + currentVersion + " recibida desde " + source + "."
        );
      notify("Cambios de otro equipo actualizados");
      });
    }).catch(function (error) {
      if (error && error.code === "STALE_CONTEXT") return;
      if (!navigator.onLine) {
        setStatus("offline", "Sin internet", "Se muestra la última copia disponible.");
      } else {
        console.warn("No se pudo refrescar el documento", error);
        setStatus("error", "No se pudo actualizar", "La copia local sigue disponible. Tocá para reintentar.");
      }
    });
  }

  function listWorkspaces() {
    if (!client || !user) return Promise.resolve([]);
    return client.from("workspace_members")
      .select("workspace_id,role")
      .eq("user_id", user.id)
      .then(function (memberResult) {
        if (memberResult.error) throw memberResult.error;
        var members = memberResult.data || [];
        if (!members.length) return [];
        var ids = members.map(function (item) { return item.workspace_id; });
        return client.from("workspaces")
          .select("id,name,timezone")
          .in("id", ids)
          .then(function (workspaceResult) {
            if (workspaceResult.error) throw workspaceResult.error;
            var names = {};
            (workspaceResult.data || []).forEach(function (item) { names[item.id] = item; });
            return members.map(function (member) {
              return {
                id: member.workspace_id,
                role: member.role,
                name: names[member.workspace_id] ? names[member.workspace_id].name : "Establecimiento",
                timezone: names[member.workspace_id] ? names[member.workspace_id].timezone : ""
              };
            });
          });
      });
  }

  function chooseWorkspace() {
    var configuredId = String(cfg.workspaceId || "");
    var rememberedId = "";
    try { rememberedId = localStorage.getItem(WORKSPACE_KEY) || ""; } catch (_) {}
    var chosen = workspaces.find(function (item) {
      return item.id === configuredId;
    }) || workspaces.find(function (item) {
      return item.id === rememberedId;
    }) || workspaces[0];
    return chosen || null;
  }

  function openWorkspace(nextWorkspaceId, options) {
    options = options || {};
    if (!options.allowPending && hasPendingLocalWork()) {
      var pendingError = new Error("Hay un cambio pendiente. Sincronizalo o descargá el borrador antes de cambiar de establecimiento.");
      pendingError.code = "PENDING_LOCAL_CHANGES";
      return Promise.reject(pendingError);
    }
    var selected = workspaces.find(function (item) { return item.id === nextWorkspaceId; });
    if (!selected) return Promise.reject(new Error("No tenés acceso a ese establecimiento"));
    var expectedUserId = user && user.id;
    var generation = ++contextGeneration;
    workspaceId = selected.id;
    workspaceName = selected.name;
    setRole(selected.role);
    try { localStorage.setItem(WORKSPACE_KEY, workspaceId); } catch (_) {}
    stopRealtime();
    documentId = "";
    currentVersion = 0;
    currentHash = "";
    lastRemoteState = null;
    lastRemoteSerialized = "";
    dirtyItem = null;
    inflight = null;
    conflictRemote = null;
    multipleLocalDrafts = 0;
    draftDownloaded = false;
    deferredRealtimeRefresh = false;
    setStatus("saving", "Abriendo " + workspaceName + "…", "Leyendo la versión compartida.");

    return client.from("app_documents")
      .select("id,workspace_id,doc_key,state,version,schema_version,state_hash,updated_at,updated_by")
      .eq("workspace_id", workspaceId)
      .eq("doc_key", String(cfg.documentKey || "main"))
      .single()
      .then(function (result) {
        assertContext(generation, "", expectedUserId);
        if (result.error) throw result.error;
        var doc = result.data;
        documentId = doc.id;
        currentVersion = Number(doc.version || 0);
        currentHash = String(doc.state_hash || "");
        lastRemoteState = clone(doc.state);
        lastRemoteSerialized = sharedString(lastRemoteState);
        return pendingDrafts().then(function (items) {
          assertContext(generation, doc.id, expectedUserId);
          multipleLocalDrafts = items.length;
          var pending = items[0] || null;
          dirtyItem = pending;
          subscribeDocument();
          if (pending) {
            applyDraftState(pending.state);
            if (items.length > 1) {
              conflictRemote = doc;
              return cacheDocument(doc).then(function () {
                setStatus(
                  "conflict",
                  "Necesita atención",
                  "Hay " + items.length + " borradores locales de distintas pestañas. Descargalos antes de continuar."
                );
              });
            }
            if (Number(pending.baseVersion) !== currentVersion) {
              conflictRemote = doc;
              return cacheDocument(doc).then(function () {
                setStatus(
                  "conflict",
                  "Necesita atención",
                  "Este equipo tiene cambios basados en la versión " +
                    pending.baseVersion + " y la nube está en la " + currentVersion + "."
                );
              });
            }
            return cacheDocument(doc).then(function () {
              setStatus(
                navigator.onLine ? "pending" : "offline",
                navigator.onLine ? "Sincronizando cambio pendiente…" : "Sin internet · 1 cambio pendiente",
                "El cambio queda guardado en este equipo hasta que el servidor lo acepte."
              );
              if (navigator.onLine) flushOutbox();
            });
          }
          return applyDocument(doc).then(function () {
            assertContext(generation, doc.id, expectedUserId);
            setStatus(
              role === "viewer" ? "readonly" : "synced",
              role === "viewer" ? "Solo lectura · actualizado" : "Todo sincronizado",
              workspaceName + " · versión " + currentVersion + " · " + humanRole(role)
            );
          });
        });
      }).catch(function (error) {
        if (error && error.code === "STALE_CONTEXT") return;
        assertContext(generation, "", expectedUserId);
        var rememberedDocument = documentId;
        if (!rememberedDocument) {
          try { rememberedDocument = localStorage.getItem("agroplano_demo_document_" + workspaceId) || ""; } catch (_) {}
          documentId = rememberedDocument;
        }
        var key = cacheKey();
        if (!key) throw error;
        return dbGet("cache", key).then(function (cached) {
          assertContext(generation, documentId, expectedUserId);
          if (!cached || !cached.doc || cached.userId !== user.id) throw error;
          setRole(cached.role || selected.role);
          return applyDocument(cached.doc).then(function () {
            return pendingDrafts();
          }).then(function (items) {
            assertContext(generation, documentId, expectedUserId);
            multipleLocalDrafts = items.length;
            dirtyItem = items[0] || null;
            if (dirtyItem) {
              applyDraftState(dirtyItem.state);
              if (items.length > 1 || Number(dirtyItem.baseVersion) !== currentVersion) {
                conflictRemote = cached.doc;
                setStatus("conflict", "Necesita atención", "Hay borradores locales que deben revisarse antes de reconectar.");
              } else {
                setStatus("offline", "Sin internet · 1 cambio pendiente", "El borrador local fue recuperado y se enviará al reconectar.");
              }
            } else {
              setStatus("offline", "Sin internet · copia local", "Última copia: " + (cached.cachedAt || "sin fecha"));
            }
          });
        });
      }).then(function () {
        if (generation !== contextGeneration) return;
        if (documentId) {
          try { localStorage.setItem("agroplano_demo_document_" + workspaceId, documentId); } catch (_) {}
        }
        renderPanel();
      });
  }

  function workspaceCacheKey() {
    return user ? "agroplano_demo_cloud_workspaces_" + user.id : "";
  }

  function rememberWorkspaces(items) {
    var key = workspaceCacheKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        userId: user.id,
        items: items,
        cachedAt: new Date().toISOString()
      }));
    } catch (_) {}
  }

  function cachedWorkspaces() {
    var key = workspaceCacheKey();
    if (!key) return [];
    try {
      var cached = JSON.parse(localStorage.getItem(key) || "null");
      return cached && cached.userId === user.id && Array.isArray(cached.items) ? cached.items : [];
    } catch (_) {
      return [];
    }
  }

  function handleSession(nextSession) {
    var sequence = ++authSequence;
    var generation = ++contextGeneration;
    session = nextSession || null;
    user = session ? session.user : null;
    clearTimeout(saveTimer);
    saveTimer = null;
    stopRealtime();
    stopMembershipRealtime();
    documentId = "";
    currentVersion = 0;
    currentHash = "";
    lastRemoteState = null;
    lastRemoteSerialized = "";
    dirtyItem = null;
    inflight = null;
    conflictRemote = null;
    multipleLocalDrafts = 0;
    draftDownloaded = false;
    deferredRealtimeRefresh = false;
    retryDelayMs = 1000;

    if (!session) {
      workspaces = [];
      workspaceId = "";
      workspaceName = "";
      setRole("");
      document.body.classList.add("cloud-auth-required");
      panelOpen = true;
      setStatus("error", "Ingresá para sincronizar", "Los datos compartidos están protegidos por usuario.");
      return Promise.resolve();
    }

    document.body.classList.remove("cloud-auth-required");
    setRole("bootstrap");
    subscribeMembership();
    setStatus("saving", "Conectando…", "Buscando tus establecimientos.");
    if (typeof appHooks.onIdentity === "function") {
      appHooks.onIdentity(user.email || "Usuario");
    }
    return listWorkspaces().then(function (items) {
      if (sequence !== authSequence || generation !== contextGeneration) return;
      workspaces = items;
      rememberWorkspaces(items);
      if (!workspaces.length) {
        workspaceId = "";
        workspaceName = "";
        setRole("bootstrap");
        panelOpen = true;
        setStatus(
          "pending",
          "Falta crear el establecimiento",
          "Si sos la persona responsable, creá la base. Si no, salí y avisale al Administrador."
        );
        return;
      }
      var selected = chooseWorkspace();
      return openWorkspace(selected.id, { allowPending: true });
    }).catch(function (error) {
      if (sequence !== authSequence) return;
      var offlineItems = cachedWorkspaces();
      if (offlineItems.length) {
        workspaces = offlineItems;
        var selected = chooseWorkspace();
        if (selected) return openWorkspace(selected.id, { allowPending: true });
      }
      console.error("No se pudo abrir la nube", error);
      panelOpen = true;
      setStatus("error", "No se pudo conectar", error.message || "Revisá la configuración.");
    });
  }

  function signIn(email, password) {
    if (!client) return Promise.reject(new Error("Nube no disponible"));
    setStatus("saving", "Ingresando…", "Verificando usuario.");
    return client.auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "")
    }).then(function (result) {
      if (result.error) throw result.error;
      return result.data;
    });
  }

  function sendMagicLink(email) {
    if (!client) return Promise.reject(new Error("Nube no disponible"));
    var redirect = location.origin + location.pathname;
    return client.auth.signInWithOtp({
      email: String(email || "").trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirect
      }
    }).then(function (result) {
      if (result.error) throw result.error;
      notify("Te enviamos un enlace de ingreso");
      setStatus("pending", "Revisá tu correo", "Abrí el enlace en este mismo navegador.");
    });
  }

  function signOut() {
    if (!client) return Promise.resolve();
    if (hasPendingLocalWork()) {
      panelOpen = true;
      setStatus(
        "pending",
        "Hay un cambio pendiente",
        "Sincronizalo o descargá el borrador antes de cerrar sesión."
      );
      var error = new Error("Hay un cambio pendiente; no se cerró la sesión");
      error.code = "PENDING_LOCAL_CHANGES";
      return Promise.reject(error);
    }
    return client.auth.signOut().then(function () {
      document.body.classList.add("cloud-auth-required");
      panelOpen = true;
    });
  }

  function createWorkspace(name) {
    if (bootstrapPromise) return bootstrapPromise;
    if (!client || !user) return Promise.reject(new Error("Primero ingresá"));
    if (workspaces.length) return Promise.reject(new Error("La cuenta ya tiene un establecimiento"));
    var initial = typeof appHooks.getSharedState === "function" ? appHooks.getSharedState() : null;
    if (!initial) return Promise.reject(new Error("No se pudo preparar la base local"));
    var mutationId = "";
    try {
      mutationId = localStorage.getItem(BOOTSTRAP_MUTATION_KEY) || "";
      if (!mutationId) {
        mutationId = uuid();
        localStorage.setItem(BOOTSTRAP_MUTATION_KEY, mutationId);
      }
    } catch (_) {
      mutationId = uuid();
    }
    setStatus("saving", "Creando base compartida…", "No cierres esta pantalla.");
    var generation = contextGeneration;
    var expectedUserId = user.id;
    var created = null;
    bootstrapPromise = client.rpc("create_workspace_with_state", {
      p_name: String(name || "Establecimiento Demostración").trim(),
      p_initial_state: initial,
      p_schema_version: Number(initial.schemaVersion),
      p_mutation_id: mutationId,
      p_device_id: typeof appHooks.getDeviceId === "function" ? appHooks.getDeviceId() : "",
      p_app_version: typeof appHooks.getAppVersion === "function" ? appHooks.getAppVersion() : ""
    }).then(function (result) {
      if (result.error) throw result.error;
      assertContext(generation, "", expectedUserId);
      created = result.data || {};
      if (!created.workspaceId) throw new Error("La base fue creada pero el servidor no devolvió su identificador");
      workspaces = [{
        id: created.workspaceId,
        role: created.role || "admin",
        name: String(name || "Establecimiento Demostración").trim() || "Establecimiento Demostración",
        timezone: "America/Argentina/Buenos_Aires"
      }];
      rememberWorkspaces(workspaces);
      return openWorkspace(created.workspaceId, { allowPending: true });
    }).then(function () {
      try { localStorage.removeItem(BOOTSTRAP_MUTATION_KEY); } catch (_) {}
      notify("Establecimiento Demostración quedó conectado");
    }).finally(function () {
      bootstrapPromise = null;
    });
    return bootstrapPromise;
  }

  function setMemberByEmail(email, nextRole) {
    if (!canAdmin()) return Promise.reject(new Error("Se requiere rol Administrador"));
    return client.rpc("set_workspace_member_by_email", {
      p_workspace_id: workspaceId,
      p_email: String(email || "").trim(),
      p_role: nextRole
    }).then(function (result) {
      if (result.error) throw result.error;
      notify("Permiso actualizado");
      return result.data;
    });
  }

  function queueSave(sharedState, options) {
    options = options || {};
    if (applyingRemote || !configured()) return Promise.resolve({ status: "local" });
    if (!session || !documentId) {
      setStatus(
        session ? "pending" : "error",
        session ? "Base todavía no compartida" : "Ingresá para sincronizar",
        "El cambio quedó guardado en este equipo."
      );
      return Promise.resolve({ status: "local_only" });
    }
    if (!canEdit()) {
      setStatus("readonly", "Solo lectura", "Tu usuario puede consultar pero no modificar.");
      notify("Tu usuario es de solo lectura");
      return Promise.resolve({ status: "forbidden" });
    }

    var serialized = sharedString(sharedState);
    if (!dirtyItem && !inflight && serialized === lastRemoteSerialized) {
      return Promise.resolve({ status: "noop" });
    }
    if (dirtyItem && sharedString(dirtyItem.state) === serialized) {
      return Promise.resolve({ status: "queued" });
    }

    draftDownloaded = false;
    if (!dirtyItem || (inflight && dirtyItem.mutationId === inflight.mutationId)) {
      var mutationId = uuid();
      var key = newOutboxKey(mutationId);
      if (!key) return Promise.resolve({ status: "local_only" });
      dirtyItem = {
        key: key,
        userId: user.id,
        workspaceId: workspaceId,
        documentId: documentId,
        mutationId: mutationId,
        baseVersion: inflight ? null : currentVersion,
        state: clone(sharedState),
        schemaVersion: Number(sharedState.schemaVersion),
        action: options.action || "edit",
        note: options.note || "Cambio desde la aplicación",
        createdAt: new Date().toISOString(),
        status: "pending"
      };
    } else {
      dirtyItem.state = clone(sharedState);
      dirtyItem.schemaVersion = Number(sharedState.schemaVersion);
      dirtyItem.action = options.action || dirtyItem.action || "edit";
      dirtyItem.note = options.note || dirtyItem.note || "Cambio desde la aplicación";
      dirtyItem.status = "pending";
      dirtyItem.updatedAt = new Date().toISOString();
    }

    return dbPut("outbox", dirtyItem).then(function () {
      if (!navigator.onLine) {
        setStatus("offline", "Sin internet · 1 cambio pendiente", "Se enviará automáticamente al reconectar.");
        return { status: "queued" };
      }
      setStatus("pending", "Cambio pendiente…", "Guardado en este equipo; falta confirmación del servidor.");
      retryDelayMs = 1000;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(flushOutbox, options.immediate ? 0 : 900);
      return { status: "queued" };
    }).catch(function (error) {
      setStatus("error", "No se pudo asegurar el cambio", "Exportá un JSON ahora. " + (error.message || ""));
      panelOpen = true;
      notify("No hay espacio seguro para guardar el cambio pendiente");
      return { status: "storage_error", error: error };
    });
  }

  function commitItem(item) {
    return client.rpc("commit_app_state", {
      p_document_id: item.documentId,
      p_expected_version: item.baseVersion,
      p_state: item.state,
      p_schema_version: item.schemaVersion,
      p_mutation_id: item.mutationId,
      p_action: item.action || "edit",
      p_note: item.note || "",
      p_device_id: typeof appHooks.getDeviceId === "function" ? appHooks.getDeviceId() : "",
      p_app_version: typeof appHooks.getAppVersion === "function" ? appHooks.getAppVersion() : ""
    }).then(function (result) {
      if (result.error) throw result.error;
      return result.data;
    });
  }

  function contextIsCurrent(generation, expectedDocumentId, expectedUserId) {
    return generation === contextGeneration &&
      expectedDocumentId === documentId &&
      !!user && expectedUserId === user.id;
  }

  function currentRemoteEnvelope() {
    if (!documentId || !lastRemoteState) return null;
    return {
      id: documentId,
      workspace_id: workspaceId,
      doc_key: String(cfg.documentKey || "main"),
      state: clone(lastRemoteState),
      version: currentVersion,
      state_hash: currentHash
    };
  }

  function isTransientSyncError(error) {
    var message = String(error && (error.message || error.details || error.hint) || error || "");
    var code = String(error && error.code || "");
    var status = Number(error && (error.status || error.statusCode) || 0);
    return !navigator.onLine ||
      /fetch|network|timeout|timed out|connection|offline|abort|temporar/i.test(message) ||
      status >= 500 || code === "57014" || /^PGRST0/.test(code) || code === "REMOTE_BEHIND";
  }

  function isTerminalSyncError(error) {
    var code = String(error && error.code || "");
    return code === "22023" || code === "23505" || code === "42501" || code === "P0002";
  }

  function acceptedVersion(result) {
    var value = result && (result.committedVersion != null ? result.committedVersion : result.version);
    return Number(value == null ? currentVersion : value);
  }

  function flushOutbox() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (inflight || !dirtyItem || !client || !documentId) return Promise.resolve();
    if (!navigator.onLine) {
      setStatus("offline", "Sin internet · 1 cambio pendiente", "Se enviará automáticamente al reconectar.");
      return Promise.resolve();
    }
    if (!canEdit()) {
      setStatus("readonly", "Solo lectura · borrador local", "Descargá el borrador o pedí permiso a un Administrador.");
      return Promise.resolve();
    }
    if (conflictRemote || dirtyItem.status === "conflict") {
      setStatus("conflict", "Necesita atención", "Descargá el borrador antes de usar la versión de la nube.");
      return Promise.resolve();
    }

    var sent = clone(dirtyItem);
    if (sent.baseVersion == null) sent.baseVersion = currentVersion;
    var sentDocumentId = sent.documentId;
    var sentUserId = sent.userId;
    var generation = contextGeneration;
    var shouldRetry = false;
    var commitWasAccepted = false;
    var committedVersion = null;
    var reportedCurrentVersion = null;
    var acceptedStateHash = "";
    inflight = sent;
    setStatus("saving", "Guardando en la nube…", "Versión base " + sent.baseVersion + ".");

    return commitItem(sent).then(function (result) {
      var resultStatus = result && result.status;
      if (!contextIsCurrent(generation, sentDocumentId, sentUserId)) {
        if (resultStatus === "ok" || resultStatus === "noop" || resultStatus === "already_committed") {
          return dbDelete("outbox", sent.key);
        }
        return;
      }
      if (resultStatus === "conflict" || resultStatus === "schema_mismatch") {
        return fetchDocument(sentDocumentId).then(function (remote) {
          assertContext(generation, sentDocumentId, sentUserId);
          conflictRemote = remote;
          currentVersion = Number(remote.version || currentVersion);
          currentHash = String(remote.state_hash || currentHash);
          lastRemoteState = clone(remote.state);
          lastRemoteSerialized = sharedString(lastRemoteState);
          var newerDraft = dirtyItem && dirtyItem.mutationId !== sent.mutationId;
          if (dirtyItem) dirtyItem.status = "conflict";
          if (!newerDraft && dirtyItem) dirtyItem.baseVersion = sent.baseVersion;
          return cacheDocument(remote).then(function () {
            if (newerDraft) {
              return dbDelete("outbox", sent.key).then(function () {
                return dbPut("outbox", dirtyItem);
              });
            }
            return dirtyItem ? dbPut("outbox", dirtyItem) : Promise.resolve();
          });
        }).then(function () {
          setStatus(
            "conflict",
            "Necesita atención",
            resultStatus === "schema_mismatch" ?
              "La aplicación y la base tienen versiones incompatibles." :
              "Otra persona guardó primero. Nada fue pisado."
          );
          panelOpen = true;
          renderPanel();
        });
      }

      if (resultStatus !== "ok" && resultStatus !== "noop" && resultStatus !== "already_committed") {
        var unknownResult = new Error("El servidor devolvió un resultado de guardado desconocido");
        unknownResult.code = "UNKNOWN_COMMIT_RESULT";
        throw unknownResult;
      }

      commitWasAccepted = true;
      committedVersion = acceptedVersion(result);
      reportedCurrentVersion = Number(result.currentVersion == null ? committedVersion : result.currentVersion);
      acceptedStateHash = String(result.stateHash || "");
      return fetchDocument(sentDocumentId).then(function (remote) {
        assertContext(generation, sentDocumentId, sentUserId);
        if (Number(remote.version) < committedVersion) {
          var behind = new Error("La lectura todavía no refleja el guardado confirmado");
          behind.code = "REMOTE_BEHIND";
          throw behind;
        }

        var remoteIsOwnCommit = Number(remote.version) === committedVersion &&
          sharedString(remote.state) === sharedString(sent.state);
        var newerDraft = dirtyItem && dirtyItem.mutationId !== sent.mutationId;

        return applyDocument(remote, { skipApp: remoteIsOwnCommit || newerDraft }).then(function () {
          return dbDelete("outbox", sent.key);
        }).then(function () {
          if (remoteIsOwnCommit && newerDraft) {
            conflictRemote = null;
            dirtyItem.baseVersion = committedVersion;
            dirtyItem.status = "pending";
            multipleLocalDrafts = 1;
            return dbPut("outbox", dirtyItem).then(function () {
              retryDelayMs = 1000;
              shouldRetry = true;
              setStatus("pending", "Guardando el siguiente cambio…", "La versión anterior ya fue confirmada.");
            });
          }

          if (!remoteIsOwnCommit && newerDraft) {
            conflictRemote = remote;
            dirtyItem.status = "conflict";
            multipleLocalDrafts = 1;
            return dbPut("outbox", dirtyItem).then(function () {
              setStatus(
                "conflict",
                "Necesita atención",
                "La nube volvió a cambiar antes de confirmar el borrador más nuevo. Nada fue pisado."
              );
              panelOpen = true;
              renderPanel();
            });
          }

          dirtyItem = null;
          conflictRemote = null;
          multipleLocalDrafts = 0;
          retryDelayMs = 1000;
          setStatus(
            role === "viewer" ? "readonly" : "synced",
            role === "viewer" ? "Solo lectura · actualizado" : "Todo sincronizado",
            workspaceName + " · versión " + currentVersion
          );
          if (!remoteIsOwnCommit) notify("Se incorporó una versión más nueva de la nube");
        });
      });
    }).catch(function (error) {
      if (error && error.code === "STALE_CONTEXT") return;
      console.warn("El cambio quedó pendiente", error);
      if (commitWasAccepted) {
        var acceptedCleanup = dbDelete("outbox", sent.key);
        if (!contextIsCurrent(generation, sentDocumentId, sentUserId)) return acceptedCleanup;
        if (dirtyItem && dirtyItem.mutationId !== sent.mutationId) {
          dirtyItem.baseVersion = committedVersion;
          dirtyItem.status = "pending";
          acceptedCleanup = acceptedCleanup.then(function () { return dbPut("outbox", dirtyItem); });
          shouldRetry = true;
          setStatus("pending", "Guardado; verificando el siguiente cambio…", "El servidor confirmó la versión anterior.");
        } else {
          dirtyItem = null;
          multipleLocalDrafts = 0;
          currentVersion = Math.max(currentVersion, Number(committedVersion || 0));
          lastRemoteState = clone(sent.state);
          lastRemoteSerialized = sharedString(lastRemoteState);
          var newerVersionReported = Number(committedVersion || 0) < Number(reportedCurrentVersion || 0);
          if (!newerVersionReported) currentHash = acceptedStateHash || currentHash;
          setStatus(
            newerVersionReported ? "pending" : "synced",
            newerVersionReported ? "Guardado; verificando…" : "Todo sincronizado",
            newerVersionReported ?
              "El servidor confirmó el cambio y avisó que hay una versión más nueva." :
              workspaceName + " · versión " + currentVersion
          );
          acceptedCleanup = acceptedCleanup.then(function () {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () { refreshHead("verificación"); }, retryDelayMs);
          });
        }
        return acceptedCleanup;
      }

      var persistence = Promise.resolve();
      if (dirtyItem && dirtyItem.mutationId === sent.mutationId) {
        dirtyItem.status = isTerminalSyncError(error) ? "conflict" : "pending";
        persistence = dbPut("outbox", dirtyItem).catch(function (storageError) {
          console.error("No se pudo conservar el borrador", storageError);
        });
      }
      if (isTransientSyncError(error)) {
        shouldRetry = true;
        setStatus(
          navigator.onLine ? "pending" : "offline",
          navigator.onLine ? "Conexión inestable · 1 cambio pendiente" : "Sin internet · 1 cambio pendiente",
          "Se reintentará automáticamente."
        );
      } else if (String(error.code || "") === "42501" || /permiso|permission|rol/i.test(String(error.message || ""))) {
        conflictRemote = currentRemoteEnvelope();
        panelOpen = true;
        setStatus("readonly", "Cambio no autorizado", "El borrador sigue en este equipo.");
        listWorkspaces().then(function (items) {
          workspaces = items;
          var selected = chooseWorkspace();
          if (selected) setRole(selected.role);
        });
      } else if (isTerminalSyncError(error)) {
        conflictRemote = currentRemoteEnvelope();
        panelOpen = true;
        setStatus("conflict", "El borrador necesita revisión", error.message || "Descargalo antes de continuar.");
      } else {
        panelOpen = true;
        setStatus("error", "No se pudo sincronizar", error.message || "Tocá para reintentar.");
      }
      return persistence;
    }).finally(function () {
      if (inflight && inflight.mutationId === sent.mutationId) inflight = null;
      if (contextIsCurrent(generation, sentDocumentId, sentUserId) &&
          dirtyItem && !conflictRemote && navigator.onLine && shouldRetry) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(flushOutbox, retryDelayMs);
        retryDelayMs = Math.min(retryDelayMs * 2, 60000);
      } else if (contextIsCurrent(generation, sentDocumentId, sentUserId) &&
          deferredRealtimeRefresh && !dirtyItem && navigator.onLine) {
        deferredRealtimeRefresh = false;
        refreshHead("actualización diferida");
      }
    });
  }

  function useRemoteVersion() {
    if (!documentId) return Promise.resolve();
    if (inflight) return Promise.reject(new Error("Esperá a que termine el guardado en curso"));
    if (dirtyItem && !draftDownloaded) {
      return Promise.reject(new Error("Primero descargá todos los borradores pendientes"));
    }
    var expectedDocumentId = documentId;
    var expectedUserId = user && user.id;
    var generation = contextGeneration;
    return fetchDocument(expectedDocumentId).then(function (remote) {
      assertContext(generation, expectedDocumentId, expectedUserId);
      return pendingDrafts().then(function (items) {
        assertContext(generation, expectedDocumentId, expectedUserId);
        return Promise.all(items.map(function (item) { return dbDelete("outbox", item.key); }));
      }).then(function () {
        assertContext(generation, expectedDocumentId, expectedUserId);
        dirtyItem = null;
        conflictRemote = null;
        multipleLocalDrafts = 0;
        draftDownloaded = false;
        inflight = null;
        return applyDocument(remote);
      }).then(function () {
        setStatus(
          role === "viewer" ? "readonly" : "synced",
          role === "viewer" ? "Solo lectura · actualizado" : "Todo sincronizado",
          "Se usó la versión " + currentVersion + " de la nube."
        );
        notify("Se cargó la versión compartida");
      });
    });
  }

  function restoreRemoteState() {
    if (lastRemoteState && documentId) {
      applyingRemote = true;
      try {
        if (typeof appHooks.applyRemote === "function") {
          appHooks.applyRemote(clone(lastRemoteState), {
            workspaceId: workspaceId,
            workspaceName: workspaceName,
            documentId: documentId,
            version: currentVersion,
            role: role
          });
        }
      } finally {
        applyingRemote = false;
      }
      setStatus("readonly", "Solo lectura · sin cambios", "Se restauró la versión compartida.");
      return Promise.resolve();
    }
    return useRemoteVersion();
  }

  function downloadDraft() {
    if (!dirtyItem || !dirtyItem.state) return Promise.resolve();
    return pendingDrafts().then(function (items) {
      if (!items.length) items = [dirtyItem];
      var payload = {
        format: "agroplano-demo-pending-drafts-v1",
        exportedAt: new Date().toISOString(),
        workspaceId: workspaceId,
        workspaceName: workspaceName,
        documentId: documentId,
        remoteVersion: currentVersion,
        latestState: clone(items[0].state),
        drafts: items.map(function (item) {
          return {
            mutationId: item.mutationId,
            baseVersion: item.baseVersion,
            action: item.action,
            note: item.note,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            tabId: String(item.key || "").split(":").slice(-2, -1)[0] || "",
            state: clone(item.state)
          };
        })
      };
      var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      var link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "AgroPlano_Demo_borradores_no_sincronizados_" + new Date().toISOString().slice(0, 10) + ".json";
      link.click();
      setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
      draftDownloaded = true;
      multipleLocalDrafts = items.length;
      renderPanel();
    });
  }

  function ensurePanel() {
    if (panelReady) return;
    panelReady = true;
    var style = document.createElement("style");
    style.textContent =
      ".cloud-auth-required .app{filter:blur(8px);pointer-events:none;user-select:none}" +
      ".cloudModal{position:fixed;inset:0;z-index:1200;background:rgba(20,24,18,.55);display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow:auto}" +
      ".cloudModal[hidden]{display:none}" +
      ".cloudCard{width:min(620px,100%);background:#fffdf7;border:1px solid #d8d0bd;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden;color:#1d2019}" +
      ".cloudHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:18px 20px;border-bottom:1px solid #e8e1d2;background:#f9f5eb}" +
      ".cloudHead h2{font-family:Georgia,serif;margin:0;font-size:25px}.cloudHead p{margin:4px 0 0;color:#66705f;font-size:13px}" +
      ".cloudBody{padding:18px 20px}.cloudGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.cloudWide{grid-column:1/-1}" +
      ".cloudBox{border:1px solid #e8e1d2;border-radius:12px;padding:12px;background:#fff}.cloudBox.warn{border-left:5px solid #b47a25}.cloudBox.danger{border-left:5px solid #9e3328}" +
      ".cloudMeta{display:grid;grid-template-columns:130px 1fr;gap:6px 10px;font-size:13px}.cloudMeta b{color:#66705f}" +
      ".cloudActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.cloudHelp{color:#66705f;font-size:12px;line-height:1.45;margin-top:10px}" +
      ".cloudStatusDot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#b47a25;margin-right:7px}.cloudStatusDot.synced{background:#2f7d3a}.cloudStatusDot.error{background:#9e3328}" +
      ".syncChip.cloudOffline:before{background:#b47a25}.syncChip.cloudConflict:before{background:#9e3328}.syncChip.cloudReadonly:before{background:#435d71}" +
      "body[data-cloud-role=viewer] .cloudWriteControl{opacity:.55;cursor:not-allowed}" +
      "@media(max-width:620px){.cloudGrid{grid-template-columns:1fr}.cloudWide{grid-column:auto}.cloudCard{border-radius:14px}.cloudBody,.cloudHead{padding:15px}}";
    document.head.appendChild(style);

    var modal = document.createElement("div");
    modal.id = "cloudModal";
    modal.className = "cloudModal";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "cloudTitle");
    modal.addEventListener("click", function (event) {
      if (event.target === modal && session) {
        panelOpen = false;
        renderPanel();
      }
    });
    modal.addEventListener("click", handlePanelClick);
    modal.addEventListener("submit", handlePanelSubmit);
    modal.addEventListener("change", handlePanelChange);
    document.body.appendChild(modal);

    var chip = document.getElementById("syncStatus");
    if (chip) {
      chip.addEventListener("click", function () {
        panelOpen = true;
        renderPanel();
      });
      chip.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          panelOpen = true;
          renderPanel();
        }
      });
    }
  }

  function renderPanel() {
    if (!panelReady) return;
    var modal = document.getElementById("cloudModal");
    if (!modal) return;
    var required = configured() && !session;
    modal.hidden = !(panelOpen || required);
    if (modal.hidden) return;

    var closeButton = session ?
      '<button type="button" class="ghost" data-cloud-action="close">Cerrar ✕</button>' : "";
    var statusClass = statusState.kind === "synced" || statusState.kind === "readonly" ? "synced" :
      statusState.kind === "error" || statusState.kind === "conflict" ? "error" : "";
    var html =
      '<div class="cloudCard">' +
        '<div class="cloudHead"><div><h2 id="cloudTitle">Datos compartidos</h2>' +
        '<p><span class="cloudStatusDot ' + statusClass + '"></span>' + esc(statusState.text) + '</p></div>' +
        closeButton + '</div><div class="cloudBody">';

    if (!configured()) {
      html +=
        '<div class="cloudBox warn"><b>Ahora funciona sólo en este equipo.</b>' +
        '<p class="cloudHelp">Para compartir entre computadoras, configurá Supabase en app/config.js y ejecutá la migración SQL. No pegues una clave service_role.</p></div>' +
        '<div class="cloudActions"><a href="../docs/PUESTA_EN_MARCHA.md" target="_blank">Abrir puesta en marcha</a></div>';
    } else if (!session) {
      html +=
        '<form data-cloud-form="login"><div class="cloudGrid">' +
        '<div class="cloudWide"><label for="cloudEmail">Correo</label><input id="cloudEmail" name="email" type="email" autocomplete="username" required placeholder="persona@empresa.com"></div>' +
        '<div class="cloudWide"><label for="cloudPassword">Contraseña</label><input id="cloudPassword" name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña"></div>' +
        '</div><div class="cloudActions"><button class="primary" type="submit">Ingresar</button>' +
        '<button type="button" data-cloud-action="magic">Enviar enlace por correo</button></div>' +
        '<p class="cloudHelp">Sólo pueden ingresar cuentas creadas por la empresa. El enlace por correo no crea usuarios nuevos.</p></form>';
    } else if (!workspaces.length) {
      html +=
        '<div class="cloudBox warn"><b>Primera configuración</b>' +
        '<p class="cloudHelp">Esto creará el establecimiento y subirá la estructura y los datos que ves en este equipo. Antes, exportá un JSON de respaldo y verificá que sea la base correcta.</p></div>' +
        '<form data-cloud-form="create"><div class="cloudWide"><label for="cloudWorkspaceName">Nombre</label>' +
        '<input id="cloudWorkspaceName" name="name" value="Establecimiento Demostración" required maxlength="120"></div>' +
        '<div class="cloudActions"><button class="primary" type="submit">Crear base compartida</button>' +
        '<button type="button" data-cloud-action="signout">Salir</button></div></form>';
    } else {
      var workspaceOptions = workspaces.map(function (item) {
        return '<option value="' + esc(item.id) + '"' + (item.id === workspaceId ? " selected" : "") + '>' +
          esc(item.name + " · " + humanRole(item.role)) + '</option>';
      }).join("");
      html +=
        '<div class="cloudGrid"><div class="cloudWide"><label for="cloudWorkspace">Establecimiento</label>' +
        '<select id="cloudWorkspace" data-cloud-workspace>' + workspaceOptions + '</select></div>' +
        '<div class="cloudBox"><div class="cloudMeta"><b>Usuario</b><span>' + esc(user.email || "Sin correo") + '</span>' +
        '<b>Permiso</b><span>' + esc(humanRole(role)) + '</span><b>Versión</b><span>' + esc(currentVersion || "—") + '</span></div></div>' +
        '<div class="cloudBox"><b>' + esc(statusState.text) + '</b><p class="cloudHelp">' + esc(statusState.detail) + '</p></div></div>' +
        '<div class="cloudActions"><button type="button" data-cloud-action="sync">Sincronizar ahora</button>' +
        (installPrompt ? '<button type="button" data-cloud-action="install">Instalar en esta computadora</button>' : "") +
        '<button type="button" data-cloud-action="signout">Salir</button></div>';

      if (conflictRemote && dirtyItem) {
        var draftCount = Math.max(1, Number(multipleLocalDrafts || 0));
        html +=
          '<div class="cloudBox danger" style="margin-top:14px"><b>Hay versiones distintas</b>' +
          '<p class="cloudHelp">La nube está en la versión ' + esc(conflictRemote.version) +
          ' y este equipo conserva ' + esc(draftCount) + (draftCount === 1 ? ' borrador' : ' borradores') +
          '. Nada fue reemplazado automáticamente. La descarga incluye todos los borradores completos; para conservar una parte, volvé a registrarla sobre la versión de la nube.</p>' +
          '<div class="cloudActions"><button type="button" data-cloud-action="download">1. Descargar todos los borradores</button>' +
          '<button type="button" class="primary" data-cloud-action="use-remote"' + (draftDownloaded ? "" : " disabled") + '>2. Usar versión de la nube</button>' +
          '</div></div>';
      }

      if (canAdmin()) {
        html +=
          '<details style="margin-top:14px"><summary><b>Administrar usuarios</b></summary>' +
          '<form data-cloud-form="member" class="cloudBox" style="margin-top:8px"><div class="cloudGrid">' +
          '<div><label for="cloudMemberEmail">Correo ya creado</label><input id="cloudMemberEmail" name="email" type="email" required></div>' +
          '<div><label for="cloudMemberRole">Permiso</label><select id="cloudMemberRole" name="role">' +
          '<option value="editor">Editor</option><option value="viewer">Solo lectura</option><option value="admin">Administrador</option></select></div></div>' +
          '<div class="cloudActions"><button type="submit">Agregar o cambiar permiso</button></div>' +
          '<p class="cloudHelp">Primero creá la cuenta en Supabase Authentication. Un Administrador puede modificar datos y usuarios; un Editor modifica datos; Solo lectura no guarda.</p></form></details>';
      }
    }

    html += '</div></div>';
    modal.innerHTML = html;
  }

  function handlePanelSubmit(event) {
    var form = event.target.closest("[data-cloud-form]");
    if (!form) return;
    event.preventDefault();
    var data = new FormData(form);
    var type = form.dataset.cloudForm;
    if (type === "login") {
      signIn(data.get("email"), data.get("password")).catch(function (error) {
        setStatus("error", "No se pudo ingresar", error.message || "Revisá correo y contraseña.");
      });
    }
    if (type === "create") {
      if (!confirm("¿Confirmás que la estructura y los datos visibles en este equipo son la base correcta?")) return;
      createWorkspace(data.get("name")).catch(function (error) {
        setStatus("error", "No se pudo crear", error.message || "Revisá la migración.");
      });
    }
    if (type === "member") {
      setMemberByEmail(data.get("email"), data.get("role")).then(function () {
        form.reset();
      }).catch(function (error) {
        setStatus("error", "No se pudo actualizar el usuario", error.message || "Revisá que la cuenta exista.");
      });
    }
  }

  function handlePanelClick(event) {
    var button = event.target.closest("[data-cloud-action]");
    if (!button) return;
    var action = button.dataset.cloudAction;
    if (action === "close") {
      panelOpen = false;
      renderPanel();
    } else if (action === "signout") {
      signOut().catch(function (error) {
        if (!error || error.code !== "PENDING_LOCAL_CHANGES") {
          setStatus("error", "No se pudo salir", error && error.message || "Intentá nuevamente.");
        }
      });
    } else if (action === "sync") {
      refreshMembership("consulta manual").then(function (hasAccess) {
        if (!hasAccess) return;
        if (dirtyItem) flushOutbox();
        else refreshHead("manual");
      });
    } else if (action === "magic") {
      var input = document.getElementById("cloudEmail");
      if (!input || !input.value.trim()) {
        setStatus("error", "Escribí tu correo", "Lo necesitamos para enviarte el enlace.");
      } else {
        sendMagicLink(input.value).catch(function (error) {
          setStatus("error", "No se pudo enviar", error.message || "Revisá el correo.");
        });
      }
    } else if (action === "download") {
      downloadDraft().catch(function (error) {
        draftDownloaded = false;
        setStatus("error", "No se pudo descargar", error.message || "No descartes los borradores.");
      });
    } else if (action === "use-remote") {
      if (confirm("¿Descartar el borrador de este equipo y usar la versión compartida?")) {
        useRemoteVersion().catch(function (error) {
          setStatus("error", "No se pudo recuperar la nube", error.message || "Intentá nuevamente.");
        });
      }
    } else if (action === "install" && installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.finally(function () {
        installPrompt = null;
        renderPanel();
      });
    }
  }

  function handlePanelChange(event) {
    var select = event.target.closest("[data-cloud-workspace]");
    if (!select || select.value === workspaceId) return;
    if (hasPendingLocalWork()) {
      select.value = workspaceId;
      panelOpen = true;
      setStatus(
        "pending",
        "Hay un cambio pendiente",
        "Sincronizalo o descargá el borrador antes de cambiar de establecimiento."
      );
      return;
    }
    openWorkspace(select.value).catch(function (error) {
      select.value = workspaceId;
      setStatus("error", "No se pudo cambiar", error.message);
    });
  }

  function registerPwa() {
    if ("serviceWorker" in navigator && /^https?:$/i.test(location.protocol)) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("./sw.js").catch(function (error) {
          console.warn("Service worker no disponible", error);
        });
      });
    }
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      installPrompt = event;
      renderPanel();
    });
  }

  function start(hooks) {
    if (started) return Promise.resolve();
    started = true;
    appHooks = hooks || {};
    ensurePanel();
    registerPwa();

    window.addEventListener("offline", function () {
      setStatus(
        dirtyItem ? "offline" : "offline",
        dirtyItem ? "Sin internet · 1 cambio pendiente" : "Sin internet · copia local",
        dirtyItem ? "Se enviará al reconectar." : "Podés consultar la última copia."
      );
    });
    window.addEventListener("online", function () {
      refreshMembership("reconexión").then(function (hasAccess) {
        if (!hasAccess) return;
        if (dirtyItem) flushOutbox();
        else refreshHead("reconexión");
      });
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && navigator.onLine && session) {
        refreshMembership("volver a la aplicación").then(function (hasAccess) {
          if (!hasAccess) return;
          if (dirtyItem) flushOutbox();
          else refreshHead("volver a la aplicación");
        });
      }
    });

    if (!configured()) {
      document.body.classList.remove("cloud-auth-required");
      setStatus("local", "Solo en este equipo", "Configurá la nube para compartir entre computadoras.");
      return Promise.resolve();
    }

    document.body.classList.add("cloud-auth-required");
    setStatus("saving", "Preparando ingreso…", "Cargando la conexión segura.");
    return loadLibrary().then(function () {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return verifyBackendIdentity();
    }).then(function () {
      client.auth.onAuthStateChange(function (event, nextSession) {
        setTimeout(function () {
          var nextUser = nextSession && nextSession.user;
          var sameUser = !!(user && nextUser && user.id === nextUser.id);
          if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED" ||
              (sameUser && documentId && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))) {
            session = nextSession || session;
            user = nextUser || user;
            if (user && typeof appHooks.onIdentity === "function") {
              appHooks.onIdentity(user.email || "Usuario");
            }
            return;
          }
          if (!nextSession && !session) return;
          handleSession(nextSession);
        }, 0);
      });
      return client.auth.getSession();
    }).then(function (result) {
      if (result.error) throw result.error;
      return handleSession(result.data.session);
    }).catch(function (error) {
      panelOpen = true;
      setStatus("error", "Nube no disponible", error.message || "Revisá app/config.js.");
    });
  }

  window.AgroPlanoCloud = {
    start: start,
    queueSave: queueSave,
    flush: flushOutbox,
    openPanel: function () { panelOpen = true; renderPanel(); },
    isConfigured: configured,
    isApplyingRemote: isApplyingRemote,
    canEdit: canEdit,
    canAdmin: canAdmin,
    matchesRemote: function (sharedState) {
      return !!lastRemoteSerialized && sharedString(sharedState) === lastRemoteSerialized;
    },
    restoreRemoteState: restoreRemoteState,
    getRole: function () { return role; },
    getStatus: function () { return clone(statusState); },
    getEnvelope: function () {
      return {
        workspaceId: workspaceId,
        workspaceName: workspaceName,
        documentId: documentId,
        version: currentVersion,
        role: role,
        user: user ? { id: user.id, email: user.email || "" } : null,
        pending: !!dirtyItem,
        conflict: !!conflictRemote
      };
    },
    _test: {
      uuid: uuid,
      configured: configured,
      humanRole: humanRole,
      sharedString: sharedString
    }
  };
})();
