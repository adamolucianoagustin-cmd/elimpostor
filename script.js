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

// ---------- PANTALLAS ----------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------- SALAS ----------
function generarCodigoSala() {
  return Math.random().toString(36).substring(2,7).toUpperCase();
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

  salaId = codigo;
  esHost = false;
  codigoActual.textContent = "Sala: " + salaId;
  escucharSala();
}

// ---------- JUGADORES ----------
function agregarJugador() {
  if (!salaId) return alert("Entrá a una sala");
  miNombre = nombreJugador.value.trim();
  if (!miNombre) return;

  db.collection("salas").doc(salaId).update({
    jugadores: firebase.firestore.FieldValue.arrayUnion(miNombre)
  });
}

function mostrarJugadores() {
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ---------- JUEGO ----------
function iniciarJuego() {
  if (!esHost) return;

  const cant = parseInt(cantidadImpostores.value);
  const mix = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mix.forEach((j,i)=> roles[j] = i < cant ? "impostor" : "civil");

  palabra = categorias[categoriaSeleccionada][Math.floor(Math.random()*categorias[categoriaSeleccionada].length)];

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

// ---------- DISCUSIÓN ----------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;
  clearInterval(intervalo);

  intervalo = setInterval(() => {
    timer.textContent =
      `${String(Math.floor(tiempo/60)).padStart(2,"0")}:${String(tiempo%60).padStart(2,"0")}`;
    if (--tiempo < 0) irAVotacion();
  }, 1000);
}

// ---------- CHAT ----------
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

// ---------- VOTACIÓN ----------
function irAVotacion() {
  clearInterval(intervalo);
  db.collection("salas").doc(salaId).update({ fase: "votacion", votos: {} });
}

function votar(nombre, el) {
  document.querySelectorAll(".voto-card").forEach(v => v.classList.remove("activo"));
  el.classList.add("activo");

  db.collection("salas").doc(salaId).update({
    [`votos.${miNombre}`]: nombre
  });
}

// ---------- RESULTADO ----------
function mostrarResultado(votos) {
  const conteo = {};
  Object.values(votos).forEach(v => conteo[v] = (conteo[v] || 0) + 1);
  const votado = Object.keys(conteo).sort((a,b)=>conteo[b]-conteo[a])[0];
  const impostores = Object.keys(roles).filter(j => roles[j]==="impostor");

  resultadoTexto.textContent =
    impostores.includes(votado) ? "¡Civiles ganaron! 🎉" : "¡Impostores ganaron! 😈";

  detalleFinal.textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabra}"`;

  mostrarPantalla("pantallaFinal");
}

// ---------- NUEVA RONDA / SALIR ----------
function nuevaRonda() {
  if (!esHost) return;

  db.collection("salas").doc(salaId).update({
    fase: "inicio",
    confirmados: [],
    votos: {}
  });
}

function salirInicio() {
  salaId = null;
  mostrarPantalla("pantallaInicio");
}

// ---------- LISTENERS ----------
function escucharSala() {
  db.collection("salas").doc(salaId).onSnapshot(doc => {
    const d = doc.data();
    jugadores = d.jugadores || [];
    mostrarJugadores();

    if (d.fase === "roles") {
      mostrarPantalla("pantallaRol");
      textoRol.textContent =
        d.roles[miNombre] === "impostor" ? "SOS EL IMPOSTOR 😈" : `PALABRA: ${d.palabra}`;

      if (esHost && d.confirmados?.length === jugadores.length) {
        db.collection("salas").doc(salaId).update({ fase: "discusion" });
      }
    }

    if (d.fase === "discusion") iniciarDiscusion();

    if (d.fase === "votacion") {
      mostrarPantalla("pantallaVotacion");
      listaVotos.innerHTML = jugadores.map(j =>
        `<div class="voto-card" onclick="votar('${j}',this)">${j}</div>`
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
      chat.scrollTop = chat.scrollHeight;
    });
}

// ---------- CATEGORÍAS ----------
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
