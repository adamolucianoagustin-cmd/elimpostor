let salaId = null;
let esHost = false;
let miNombre = "";

let jugadores = [];
let impostores = [];
let palabraSecreta = "";
let categorias = {};
let categoriaSeleccionada = null;

let turnoActual = 0;
let tiempo = 180;
let intervalo;

// ---------------- UTIL ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- SALAS ----------------
function generarCodigoSala() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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
  if (!salaId) return alert("Primero creá o uníte a una sala");
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;

  miNombre = nombre;

  db.collection("salas").doc(salaId).update({
    jugadores: firebase.firestore.FieldValue.arrayUnion(nombre)
  });

  nombreJugador.value = "";
}

function mostrarJugadores() {
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ---------------- JUEGO ----------------
function iniciarJuego() {
  if (!esHost) return alert("Solo el host puede iniciar");

  const cant = parseInt(cantidadImpostores.value);
  impostores = [...jugadores].sort(() => Math.random() - 0.5).slice(0, cant);
  palabraSecreta = categorias[categoriaSeleccionada][Math.floor(Math.random() * categorias[categoriaSeleccionada].length)];

  db.collection("salas").doc(salaId).update({
    fase: "roles",
    impostores,
    palabra: palabraSecreta,
    turno: 0
  });
}

function mostrarRol() {
  carta.classList.remove("volteada");
  cartaDorso.classList.toggle("impostor", impostores.includes(miNombre));
  mensajeRol.textContent = "";

  carta.onclick = () => {
    carta.classList.add("volteada");
    mensajeRol.textContent = impostores.includes(miNombre)
      ? "SOS EL IMPOSTOR 😈"
      : palabraSecreta;
  };
}

function siguienteJugador() {
  if (!esHost) return;

  turnoActual++;
  if (turnoActual < jugadores.length) {
    db.collection("salas").doc(salaId).update({ turno: turnoActual });
  } else {
    db.collection("salas").doc(salaId).update({ fase: "discusion" });
  }
}

// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;

  clearInterval(intervalo);
  intervalo = setInterval(() => {
    timer.textContent =
      `${String(Math.floor(tiempo / 60)).padStart(2, "0")}:${String(tiempo % 60).padStart(2, "0")}`;
    if (--tiempo < 0) irAVotacion();
  }, 1000);
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  if (!esHost) return;
  clearInterval(intervalo);

  db.collection("salas").doc(salaId).update({
    fase: "votacion",
    votos: {}
  });
}

function votar(nombre) {
  db.collection("salas").doc(salaId).update({
    [`votos.${miNombre}`]: nombre
  });
}

function mostrarVotacion() {
  listaVotos.innerHTML = "";

  jugadores.forEach(j => {
    const card = document.createElement("div");
    card.className = "voto-card";
    card.textContent = j;
    card.onclick = () => {
      votar(j);
      card.classList.add("activo");
      document.querySelectorAll(".voto-card").forEach(c => c.onclick = null);
    };
    listaVotos.appendChild(card);
  });
}

// ---------------- RESULTADO ----------------
function mostrarResultado(votos) {
  const conteo = {};
  Object.values(votos).forEach(v => conteo[v] = (conteo[v] || 0) + 1);
  const votado = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0];

  resultadoTexto.textContent = impostores.includes(votado)
    ? "¡Civiles ganaron! 🎉"
    : "¡Impostores ganaron! 😈";

  detalleFinal.textContent = `Impostores: ${impostores.join(", ")} | Palabra: "${palabraSecreta}"`;
  mostrarPantalla("pantallaFinal");
}

// ---------------- FIREBASE LISTENER ----------------
function escucharSala() {
  db.collection("salas").doc(salaId).onSnapshot(doc => {
    if (!doc.exists) return;

    const d = doc.data();
    jugadores = d.jugadores || [];
    mostrarJugadores();

    if (d.fase === "roles") {
      impostores = d.impostores;
      palabraSecreta = d.palabra;
      turnoActual = d.turno;
      mostrarPantalla("pantallaRol");
      mostrarRol();
    }

    if (d.fase === "discusion") iniciarDiscusion();
    if (d.fase === "votacion") {
      mostrarPantalla("pantallaVotacion");
      mostrarVotacion();
    }

    if (d.votos && Object.keys(d.votos).length === jugadores.length) {
      mostrarResultado(d.votos);
    }
  });
}

// ---------------- CATEGORÍAS ----------------
db.collection("categorias").onSnapshot(snap => {
  categorias = {};
  listaCategoriasInicio.innerHTML = "";

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
