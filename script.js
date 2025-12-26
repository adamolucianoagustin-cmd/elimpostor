let salaId = null;
let esHost = false;
let miNombre = "";

let jugadores = [];
let impostores = [];
let palabra = "";
let categorias = {};
let categoriaSeleccionada = null;

let tiempo = 180;
let intervalo;

// ---------------- UTIL ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- SALAS ----------------
function generarCodigoSala() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...Array(5)].map(()=>c[Math.floor(Math.random()*c.length)]).join("");
}

function crearSala() {
  salaId = generarCodigoSala();
  esHost = true;

  db.collection("salas").doc(salaId).set({
    jugadores: [],
    fase: "inicio",
    chat: []
  });

  codigoActual.textContent = "Código: " + salaId;
  escucharSala();
}

function unirseSala() {
  salaId = codigoSala.value.toUpperCase();
  esHost = false;
  codigoActual.textContent = "Sala: " + salaId;
  escucharSala();
}

// ---------------- JUGADORES ----------------
function agregarJugador() {
  miNombre = nombreJugador.value.trim();
  if (!miNombre) return;

  db.collection("salas").doc(salaId).update({
    jugadores: firebase.firestore.FieldValue.arrayUnion(miNombre)
  });
}

function iniciarJuego() {
  if (!esHost) return;

  impostores = [...jugadores].sort(()=>Math.random()-0.5)
    .slice(0, cantidadImpostores.value);

  palabra = categorias[categoriaSeleccionada][Math.floor(Math.random()*categorias[categoriaSeleccionada].length)];

  db.collection("salas").doc(salaId).update({
    fase: "roles",
    impostores,
    palabra
  });
}

// ---------------- ROL ----------------
function mostrarRol() {
  textoRol.textContent = impostores.includes(miNombre)
    ? "SOS EL IMPOSTOR 😈"
    : `PALABRA: ${palabra}`;
}

function confirmarRol() {
  mostrarPantalla("pantallaDiscusion");
}

// ---------------- CHAT ----------------
function enviarMensaje() {
  const msg = mensajeChat.value.trim();
  if (!msg) return;

  db.collection("salas").doc(salaId).update({
    chat: firebase.firestore.FieldValue.arrayUnion(`${miNombre}: ${msg}`)
  });

  mensajeChat.value = "";
}

// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;

  clearInterval(intervalo);
  intervalo = setInterval(()=>{
    timer.textContent =
      `${String(Math.floor(tiempo/60)).padStart(2,"0")}:${String(tiempo%60).padStart(2,"0")}`;
    if(--tiempo<0) irAVotacion();
  },1000);
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  if (!esHost) return;
  db.collection("salas").doc(salaId).update({ fase:"votacion", votos:{} });
}

function votar(nombre) {
  db.collection("salas").doc(salaId).update({
    [`votos.${miNombre}`]: nombre
  });
}

// ---------------- FINAL ----------------
function nuevaRonda() {
  if (!esHost) return;
  db.collection("salas").doc(salaId).update({ fase:"inicio", votos:{} });
}

function volverLobby() {
  mostrarPantalla("pantallaInicio");
}

// ---------------- LISTENER ----------------
function escucharSala() {
  db.collection("salas").doc(salaId).onSnapshot(doc=>{
    const d = doc.data();
    jugadores = d.jugadores || [];
    listaJugadores.innerHTML = jugadores.map(j=>`<li>${j}</li>`).join("");

    if (d.fase==="roles") {
      impostores=d.impostores;
      palabra=d.palabra;
      mostrarPantalla("pantallaRol");
      mostrarRol();
    }

    if (d.fase==="discusion") iniciarDiscusion();
    if (d.fase==="votacion") {
      mostrarPantalla("pantallaVotacion");
      listaVotos.innerHTML = jugadores.map(j=>
        `<div class="voto-card" onclick="votar('${j}')">${j}</div>`
      ).join("");
    }

    if (d.chat) {
      chat.innerHTML = d.chat.map(m=>`<p>${m}</p>`).join("");
    }
  });
}

// ---------------- CATEGORÍAS ----------------
db.collection("categorias").onSnapshot(snap=>{
  categorias={};
  listaCategoriasInicio.innerHTML="";
  snap.forEach(doc=>{
    categorias[doc.id]=doc.data().palabras;
    const b=document.createElement("button");
    b.textContent=doc.id;
    b.onclick=()=>categoriaSeleccionada=doc.id;
    listaCategoriasInicio.appendChild(b);
  });
});
