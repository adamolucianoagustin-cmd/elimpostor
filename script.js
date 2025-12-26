// ====== ESTADO ONLINE ======
let salaId = null;
let esHost = false;
let miNombre = "";

// ====== ESTADO JUEGO ======
let jugadores = [];
let impostores = [];
let palabraSecreta = "";
let categorias = {};
let categoriaSeleccionada = null;

let turnoActual = 0;
let tiempo = 180;
let intervalo = null;

let yaVote = false; // local: evita votar 2 veces

// ====== HELPERS ======
const el = (id) => document.getElementById(id);

function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  el(id).classList.add("activa");
}

function setEstadoSala(texto) {
  el("codigoActual").textContent = texto || "";
}

function actualizarListaJugadores() {
  el("listaJugadores").innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ====== SALAS ======
function generarCodigoSala() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function crearSala() {
  salaId = generarCodigoSala();
  esHost = true;

  db.collection("salas").doc(salaId).set({
    creada: firebase.firestore.FieldValue.serverTimestamp(),
    jugadores: [],
    fase: "inicio",
    categoria: null,
    palabra: null,
    impostores: [],
    turno: 0,
    votos: {},
    resultado: null
  }).then(() => {
    setEstadoSala(`Sala activa: ${salaId} (Host)`);
    escucharSala();
  }).catch(err => {
    alert("Error creando sala: " + err.message);
  });
}

function unirseSala() {
  const codigo = el("codigoSala").value.trim().toUpperCase();
  if (!codigo) return alert("Ingresá un código de sala");

  db.collection("salas").doc(codigo).get().then(doc => {
    if (!doc.exists) return alert("Sala no encontrada");

    salaId = codigo;
    esHost = false;
    setEstadoSala(`Sala activa: ${salaId}`);
    escucharSala();
  }).catch(err => {
    alert("Error uniéndose: " + err.message);
  });
}

// ====== JUGADORES ======
function agregarJugador() {
  if (!salaId) return alert("Primero creá o uníte a una sala");

  const nombre = el("nombreJugador").value.trim();
  if (!nombre) return alert("Escribí tu nombre");

  miNombre = nombre;

  db.collection("salas").doc(salaId).update({
    jugadores: firebase.firestore.FieldValue.arrayUnion(nombre)
  }).then(() => {
    el("nombreJugador").value = "";
  }).catch(err => {
    alert("Error agregando jugador: " + err.message);
  });
}

// ====== CATEGORÍAS ======
function escucharCategorias() {
  db.collection("categorias").onSnapshot(snap => {
    categorias = {};
    const cont = el("listaCategoriasInicio");
    cont.innerHTML = "";

    snap.forEach(doc => {
      categorias[doc.id] = doc.data().palabras || [];
    });

    Object.keys(categorias).forEach(nombre => {
      const b = document.createElement("button");
      b.textContent = nombre;
      b.className = "categoria-btn";
      b.onclick = () => {
        categoriaSeleccionada = nombre;
        document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
        b.classList.add("activa");

        // guardamos selección en sala (para que todos vean misma categoría elegida si quieren)
        if (salaId && esHost) {
          db.collection("salas").doc(salaId).update({ categoria: nombre }).catch(()=>{});
        }
      };
      cont.appendChild(b);
    });
  }, err => {
    alert("Error cargando categorías: " + err.message);
  });
}

// ====== INICIO DEL JUEGO (HOST) ======
function iniciarJuego() {
  if (!salaId) return alert("Primero creá o uníte a una sala");
  if (!esHost) return alert("Solo el host puede iniciar la partida");
  if (jugadores.length < 3) return alert("Mínimo 3 jugadores");
  if (!categoriaSeleccionada) return alert("Elegí una categoría");

  const cant = parseInt(el("cantidadImpostores").value, 10);
  if (cant >= jugadores.length) return alert("Debe haber menos impostores que jugadores");

  const impostoresElegidos = [...jugadores].sort(() => Math.random() - 0.5).slice(0, cant);
  const palabras = categorias[categoriaSeleccionada] || [];
  if (!palabras.length) return alert("Esa categoría no tiene palabras");

  const palabra = palabras[Math.floor(Math.random() * palabras.length)];

  db.collection("salas").doc(salaId).update({
    fase: "roles",
    categoria: categoriaSeleccionada,
    palabra,
    impostores: impostoresElegidos,
    turno: 0,
    votos: {},
    resultado: null
  }).catch(err => alert("Error iniciando juego: " + err.message));
}

// ====== ROLES ======
function mostrarRol() {
  const carta = el("carta");
  const mensaje = el("mensajeRol");
  const dorso = el("cartaDorso");

  carta.classList.remove("volteada");
  mensaje.textContent = "";
  dorso.classList.remove("impostor");

  carta.onclick = () => {
    carta.classList.add("volteada");
    if (impostores.includes(miNombre)) {
      mensaje.textContent = "SOS EL IMPOSTOR 😈";
      dorso.classList.add("impostor");
    } else {
      mensaje.textContent = `PALABRA: ${palabraSecreta}`;
    }
  };
}

function siguienteJugador() {
  if (!esHost) return alert("Solo el host puede avanzar");
  const siguiente = turnoActual + 1;

  if (siguiente < jugadores.length) {
    db.collection("salas").doc(salaId).update({ turno: siguiente }).catch(()=>{});
  } else {
    db.collection("salas").doc(salaId).update({ fase: "discusion", inicioDiscusion: firebase.firestore.FieldValue.serverTimestamp() }).catch(()=>{});
  }
}

// ====== DISCUSIÓN ======
function iniciarDiscusionUI() {
  mostrarPantalla("pantallaDiscusion");
  clearInterval(intervalo);

  // timer local (solo visual); luego lo sincronizamos fino si querés
  tiempo = 180;
  el("timer").textContent = "03:00";

  intervalo = setInterval(() => {
    const m = String(Math.floor(tiempo / 60)).padStart(2, "0");
    const s = String(tiempo % 60).padStart(2, "0");
    el("timer").textContent = `${m}:${s}`;
    tiempo--;
    if (tiempo < 0) clearInterval(intervalo);
  }, 1000);
}

function irAVotacion() {
  if (!esHost) return alert("Solo el host puede ir a votación");
  db.collection("salas").doc(salaId).update({
    fase: "votacion",
    votos: {},
    resultado: null
  }).catch(()=>{});
}

// ====== VOTACIÓN ======
function renderVotacionUI() {
  mostrarPantalla("pantallaVotacion");
  yaVote = false;

  el("textoVotoInfo").textContent = miNombre
    ? `Tu voto queda registrado como: ${miNombre}`
    : "Escribí tu nombre y agregate a la sala antes de votar.";

  const div = el("listaVotos");
  div.innerHTML = "";

  jugadores.forEach(j => {
    const card = document.createElement("div");
    card.className = "voto-card";
    card.textContent = j;

    card.onclick = () => {
      if (!miNombre) return alert("Primero escribí tu nombre y tocá 'Agregarme a la sala'");
      if (yaVote)
