let modo = null; // "local" | "online"
let salaId = null;
let esHost = false;
let miNombre = "";

let jugadores = [];
let roles = {};
let palabra = "";
let confirmados = [];

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
}

// ---------- CATEGORÍAS (FIJAS PARA SIMPLICIDAD) ----------
const categorias = {
  Animales: ["Perro","Gato","Elefante"],
  Objetos: ["Mesa","Silla","Celular"],
  Lugares: ["Playa","Escuela","Hospital"]
};

const listaCategoriasInicio = document.getElementById("listaCategoriasInicio");
let categoriaSeleccionada = null;

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

// ---------- LOCAL ----------
function agregarJugador() {
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;

  if (modo === "local") {
    jugadores.push(nombre);
    mostrarJugadores();
  } else {
    if (!salaId) return alert("Entrá a una sala");
    miNombre = nombre;
    db.collection("salas").doc(salaId).update({
      jugadores: firebase.firestore.FieldValue.arrayUnion(nombre)
    });
  }
  nombreJugador.value = "";
}

function mostrarJugadores() {
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

function iniciarJuego() {
  const cant = parseInt(cantidadImpostores.value);
  const mix = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mix.forEach((j,i)=> roles[j] = i < cant ? "impostor" : "civil");

  palabra = categorias[categoriaSeleccionada][
    Math.floor(Math.random()*categorias[categoriaSeleccionada].length)
  ];

  confirmados = [];
  mostrarPantalla("pantallaRol");
  mostrarRol();
}

function mostrarRol() {
  const jugador = jugadores[confirmados.length];
  textoRol.textContent =
    roles[jugador] === "impostor" ? "SOS EL IMPOSTOR 😈" : `PALABRA: ${palabra}`;
}

function confirmarRol() {
  confirmados.push(true);
  if (confirmados.length < jugadores.length) {
    mostrarRol();
  } else {
    iniciarDiscusion();
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

// ---------- CHAT LOCAL ----------
function enviarMensaje() {
  const texto = mensajeChat.value.trim();
  if (!texto) return;
  chat.innerHTML += `<p><b>${miNombre || "Jugador"}:</b> ${texto}</p>`;
  mensajeChat.value = "";
  chat.scrollTop = chat.scrollHeight;
}

// ---------- VOTACIÓN ----------
function irAVotacion() {
  clearInterval(intervalo);
  mostrarPantalla("pantallaVotacion");

  listaVotos.innerHTML = jugadores.map(j =>
    `<div class="voto-card" onclick="finalizarVoto('${j}',this)">${j}</div>`
  ).join("");
}

function finalizarVoto(jugador) {
  const impostores = Object.keys(roles).filter(j => roles[j]==="impostor");
  resultadoTexto.textContent =
    impostores.includes(jugador) ? "¡Civiles ganaron! 🎉" : "¡Impostores ganaron! 😈";

  detalleFinal.textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabra}"`;

  mostrarPantalla("pantallaFinal");
}

// ---------- RESET ----------
function nuevaRonda() {
  iniciarJuego();
}

function volverInicio() {
  jugadores = [];
  mostrarPantalla("pantallaInicio");
}
