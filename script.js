let salaId = null;
let esHost = false;
let miNombre = "";

let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;

let palabra = "";
let roles = {};
let tiempo = 180;
let intervalo;

// ---------------- PANTALLAS ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- SALAS ----------------
function generarCodigoSala() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:5}, () => chars[Math.floor(Math.random()*chars.length)]).join("");
}

function crearSala() {
  salaId = generarCodigoSala();
  esHost = true;

  db.collection("salas").doc(salaId).set({
    jugadores: [],
    fase: "inicio"
  });

  codigoActual.textContent = "Código: " + salaId;
  escucharSala();
}

function unirseSala() {
  const codigo = codigoSala.value.trim().toUpperCase();
  if (!codigo) return;

  db.collection("salas").doc(codigo).get().then(doc => {
    if (!doc.exists) return alert("Sala no encontrada");
    salaId = codigo;
    esHost = false;
    codigoActual.textContent = "Sala: " + salaId;
    escucharSala();
  });
}

// ---------------- JUGADORES ----------------
function agregarJugador() {
  if (!salaId) return alert("Creá o uníte a una sala");
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;

  miNombre = nombre;

  db.collection("salas").doc(salaId).update({
    jugadores: firebase.firestore.FieldValue.arrayUnion(nombre)
  });
}

function mostrarJugadores() {
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ---------------- JUEGO ----------------
function iniciarJuego() {
  if (!esHost) return alert("Solo el host inicia");

  const cant = parseInt(cantidadImpostores.value);
  const mezclados = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mezclados.forEach((j,i) => roles[j] = i < cant ? "impostor" : "civil");

  const palabras = categorias[categoriaSeleccionada];
  palabra = palabras[Math.floor(Math.random() * palabras.length)];

  db.collection("salas").doc(salaId).update({
    fase: "roles",
    roles,
    palabra,
    confirmados: []
  });
}

function confirmarRol() {
  db.collection("salas").doc(salaId).update({
    confirmados: firebase.firestore.FieldValue.arrayUnion(miNombre)
  });
}

// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;

  intervalo = setInterval(() => {
    timer.textContent =
      `${String(Math.floor(tiempo/60)).padStart(2,"0")}:${String(tiempo%60).padStart(2,"0")}`;
    if (--tiempo < 0) irAVotacion();
  }, 1000);
}

// ---------------- CHAT ----------------
function enviarMensaje() {
  const texto = mensajeChat.value.trim();
  if (!texto) return;

  db.collection("salas").doc(salaId).collection("chat").add({
    autor: miNombre,
    texto,
    fecha: firebase.firestore.FieldValue.serverTimestamp()
  });

  mensajeChat.value = "";
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  clearInterval(intervalo);
  db.collection("salas").doc(salaId).update({ fase: "votacion", votos: {} });
}

function votar(nombre) {
  db.collection("salas").doc(salaId).update({
    [`votos.${miNombre}`]: nombre
  });
}

// ---------------- RESULTADO ----------------
function mostrarResultado(votos) {
  const conteo = {};
  Object.values(votos).forEach(v => conteo[v] = (conteo[v] || 0) + 1);
  const votado = Object.keys(conteo).sort((a,b)=>conteo[b]-conteo[a])[0];

  const impostores = Object.keys(roles).filter(j => roles[j] === "impostor");

  resultadoTexto.textContent =
    impostores.includes(votado)
      ? "¡Civiles ganaron! 🎉"
      : "¡Impostores ganaron! 😈";

  detalleFinal.textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabra}"`;

  mostrarPantalla("pantallaFinal");
}

// ---------------- FIREBASE LISTENER ----------------
function escucharSala() {
  db.collection("salas").doc(salaId).onSnapshot(doc => {
    const d = doc.data();
    jugadores = d.jugadores || [];
    mostrarJugadores();

    if (d.fase === "roles") {
      palabra = d.palabra;
      roles = d.roles;
      mostrarPantalla("pantallaRol");
      textoRol.textContent =
        roles[miNombre] === "impostor" ? "SOS EL IMPOSTOR 😈" : `PALABRA: ${palabra}`;

      if (esHost && d.confirmados?.length === jugadores.length) {
        db.collection("salas").doc(salaId).update({ fase: "discusion" });
      }
    }

    if (d.fase === "discusion") iniciarDiscusion();

    if (d.fase === "votacion") {
      mostrarPantalla("pantallaVotacion");
      listaVotos.innerHTML = jugadores.map(j =>
        `<div class="voto-card" onclick="votar('${j}')">${j}</div>`
      ).join("");
    }

    if (d.votos && Object.keys(d.votos).length === jugadores.length) {
      mostrarResultado(d.votos);
    }
  });

  db.collection("salas").doc(salaId).collection("chat")
    .orderBy("fecha")
    .onSnapshot(snap => {
      chat.innerHTML = snap.docs.map(d =>
        `<p><b>${d.data().autor}:</b> ${d.data().texto}</p>`
      ).join("");
    });
}

// ---------------- CATEGORÍAS ----------------
db.collection("categorias").onSnapshot(snap => {
  listaCategoriasInicio.innerHTML = "";
  categorias = {};

  snap.forEach(doc => {
    categorias[doc.id] = doc.data().palabras;
    const b = document.createElement("button");
    b.textContent = doc.id;
    b.className = "categoria-btn";
    b.onclick = () => {
      categoriaSeleccionada = doc.id;
      document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
      b.classList.add("activa");
    };
    listaCategoriasInicio.appendChild(b);
  });
});
