let jugadores = [];
let turnoActual = 0;
let impostorIndex = 0;
let palabraSecreta = "";
let categoriaSeleccionada = null;
let categorias = {};

let tiempo = 180;
let intervalo;
let votos = {};

// ---------------- PANTALLAS ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- JUGADORES ----------------
function agregarJugador() {
  const input = document.getElementById("nombreJugador");
  if (!input.value.trim()) return;
  jugadores.push(input.value.trim());
  input.value = "";
  mostrarJugadores();
}

function mostrarJugadores() {
  const ul = document.getElementById("listaJugadores");
  ul.innerHTML = "";
  jugadores.forEach(j => {
    const li = document.createElement("li");
    li.textContent = j;
    ul.appendChild(li);
  });
}

// ---------------- JUEGO ----------------
function iniciarJuego() {
  if (jugadores.length < 3 || !categoriaSeleccionada) {
    alert("Faltan jugadores o categoría");
    return;
  }

  const palabras = categorias[categoriaSeleccionada];
  palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)];
  impostorIndex = Math.floor(Math.random() * jugadores.length);
  turnoActual = 0;

  mostrarRol();
  mostrarPantalla("pantallaRol");
}

function mostrarRol() {
  const carta = document.querySelector(".carta");
  const mensaje = document.getElementById("mensajeRol");
  const dorso = document.getElementById("cartaDorso");

  carta.classList.remove("volteada");
  dorso.classList.remove("impostor");
  mensaje.textContent = "";

  carta.onclick = () => {
    carta.classList.add("volteada");
    if (turnoActual === impostorIndex) {
      mensaje.textContent = jugadores[turnoActual] + ": SOS EL IMPOSTOR 😈";
      dorso.classList.add("impostor");
    } else {
      mensaje.textContent = jugadores[turnoActual] + ": " + palabraSecreta;
    }
  };
}

function siguienteJugador() {
  if (turnoActual < jugadores.length - 1) {
    turnoActual++;
    mostrarRol();
  } else {
    iniciarDiscusion();
  }
}


// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;
  actualizarTimer();

  intervalo = setInterval(() => {
    tiempo--;
    actualizarTimer();
    if (tiempo <= 0) irAVotacion();
  }, 1000);
}

function actualizarTimer() {
  const m = String(Math.floor(tiempo / 60)).padStart(2, "0");
  const s = String(tiempo % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${m}:${s}`;
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  clearInterval(intervalo);
  mostrarPantalla("pantallaVotacion");
  votos = {};
  renderizarVotos();
}

function renderizarVotos() {
  const div = document.getElementById("listaVotos");
  div.innerHTML = "";

  jugadores.forEach(j => {
    const btn = document.createElement("button");
    btn.textContent = j;
    btn.onclick = () => votar(j);
    div.appendChild(btn);
  });
}

function votar(jugador) {
  votos[jugador] = (votos[jugador] || 0) + 1;
  if (Object.values(votos).reduce((a, b) => a + b, 0) >= jugadores.length) {
    mostrarResultado();
  }
}

// ---------------- FINAL ----------------
function mostrarResultado() {
  mostrarPantalla("pantallaFinal");

  const ganador = Object.keys(votos).reduce((a, b) =>
    votos[a] > votos[b] ? a : b
  );

  const impostor = jugadores[impostorIndex];
  document.getElementById("resultadoTexto").textContent =
    ganador === impostor ? "¡Civiles ganaron!" : "¡El impostor ganó!";

  document.getElementById("detalleFinal").textContent =
    `El impostor era ${impostor}. La palabra era "${palabraSecreta}".`;
}

function nuevaRonda() {
  iniciarJuego();
}

// ---------------- CATEGORÍAS (FIREBASE) ----------------
function cargarCategorias() {
  db.collection("categorias").onSnapshot(snap => {
    categorias = {};
    snap.forEach(doc => categorias[doc.id] = doc.data().palabras);
    renderizarCategorias();
  });
}

function renderizarCategorias() {
  const div = document.getElementById("listaCategoriasInicio");
  div.innerHTML = "";
  for (let c in categorias) {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.className = "categoria-btn";
    btn.onclick = () => categoriaSeleccionada = c;
    div.appendChild(btn);
  }
}

function agregarCategoria() {
  const n = nombreCategoria.value.trim();
  const p = palabrasCategoria.value.trim();
  if (!n || !p) return;
  db.collection("categorias").doc(n).set({
    palabras: p.split(",").map(x => x.trim())
  });
  nombreCategoria.value = "";
  palabrasCategoria.value = "";
}

function abrirCategorias() {
  mostrarPantalla("pantallaCategorias");
}

function volverInicio() {
  mostrarPantalla("pantallaInicio");
}

window.onload = cargarCategorias;

