let modo = "local";
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

// ---------- MODO ----------
function seleccionarModo(m) {
  modo = m;
  bloqueOnline.style.display = m === "online" ? "block" : "none";
  cargarCategorias();
}

// ---------- CATEGORÍAS (UNA SOLA FUENTE) ----------
function cargarCategorias() {
  listaCategoriasInicio.innerHTML = "";
  categorias = {};

  db.collection("categorias").onSnapshot(snap => {
    categorias = {};
    listaCategoriasInicio.innerHTML = "";

    snap.forEach(doc => {
      categorias[doc.id] = doc.data().palabras;
    });

    Object.keys(categorias).forEach(c => {
      const b = document.createElement("button");
      b.textContent = c;
      b.className = "categoria-btn";
      b.onclick = () => {
        categoriaSeleccionada = c;
        document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
        b.classList.add("activa");
      };
      listaCategoriasInicio.appendChild(b);
    });
  });
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
  salaId = codigoSala.value.trim().toUpperCase();
  esHost = false;
  escucharSala();
}

// ---------- JUGADORES ----------
function agregarJugador() {
  miNombre = nombreJugador.value.trim();
  if (!miNombre) return;

  if (modo === "local") {
    jugadores.push(miNombre);
    mostrarJugadores();
  } else {
    db.collection("salas").doc(salaId).update({
      jugadores: firebase.firestore.FieldValue.arrayUnion(miNombre)
    });
  }
}

function mostrarJugadores() {
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ---------- JUEGO ----------
function iniciarJuego() {
  const cant = parseInt(cantidadImpostores.value);
  const mix = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mix.forEach((j,i)=> roles[j] = i < cant ? "impostor" : "civil");

  palabra = categorias[categoriaSeleccionada][Math.floor(Math.random()*categorias[categoriaSeleccionada].length)];

  if (modo === "local") {
    mostrarPantalla("pantallaRol");
    textoRol.textContent = roles[miNombre] === "impostor"
      ? "SOS EL IMPOSTOR 😈"
      : `PALABRA: ${palabra}`;
  } else {
    db.collection("salas").doc(salaId).update({
      fase: "roles",
      roles,
      palabra,
      confirmados: []
    });
  }
}

function confirmarRol() {
  if (modo === "local") iniciarDiscusion();
  else {
    db.collection("salas").doc(salaId).update({
      confirmados: firebase.firestore.FieldValue.arrayUnion(miNombre)
    });
  }
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
  if (modo === "local") return;

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
  mostrarPantalla("pantallaVotacion");
  listaVotos.innerHTML = jugadores.map(j =>
    `<div class="voto-card" onclick="votar('${j}',this)">${j}</div>`
  ).join("");
}

function votar(nombre, el) {
  document.querySelectorAll(".voto-card").forEach(v => v.classList.remove("activo"));
  el.classList.add("activo");

  if (modo === "local") {
    mostrarResultado({ [miNombre]: nombre });
  } else {
    db.collection("salas").doc(salaId).update({
      [`votos.${miNombre}`]: nombre
    });
  }
}

// ---------- RESULTADO ----------
function mostrarResultado(votos) {
  const votado = Object.values(votos)[0];
  const impostores = Object.keys(roles).filter(j => roles[j]==="impostor");

  resultadoTexto.textContent =
    impostores.includes(votado) ? "¡Civiles ganaron! 🎉" : "¡Impostores ganaron! 😈";

  detalleFinal.textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabra}"`;

  mostrarPantalla("pantallaFinal");
}

// ---------- NUEVA / SALIR ----------
function nuevaRonda() {
  mostrarPantalla("pantallaInicio");
}

function salirInicio() {
  location.reload();
}

// ---------- ONLINE LISTENERS ----------
function escucharSala() {
  db.collection("salas").doc(salaId).onSnapshot(doc => {
    if (!doc.exists) return;
    const d = doc.data();
    jugadores = d.jugadores || [];
    mostrarJugadores();

    if (d.fase === "roles") {
      mostrarPantalla("pantallaRol");
      textoRol.textContent =
        d.roles[miNombre] === "impostor" ? "SOS EL IMPOSTOR 😈" : `PALABRA: ${d.palabra}`;
    }

    if (d.fase === "discusion") iniciarDiscusion();
    if (d.fase === "votacion") irAVotacion();
  });
}

// cargar categorías al iniciar
cargarCategorias();
