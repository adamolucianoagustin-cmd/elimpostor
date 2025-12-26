let salaId = null;
let esHost = false;
let jugadores = [];
let turnoActual = 0;
let palabraSecreta = "";
let categorias = {};
let categoriaSeleccionada = null;

let impostores = [];
let tiempo = 180;
let intervalo;
let votacionActiva = true;

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
  jugadores.forEach(j => ul.innerHTML += `<li>${j}</li>`);
}

// ---------------- JUEGO ----------------
function iniciarJuego() {
  if (jugadores.length < 3 || !categoriaSeleccionada) {
    alert("Faltan jugadores o categoría");
    return;
  }

  const cant = parseInt(document.getElementById("cantidadImpostores").value);
  impostores = [...jugadores].sort(() => Math.random() - 0.5).slice(0, cant);

  const palabras = categorias[categoriaSeleccionada];
  palabraSecreta = palabras[Math.floor(Math.random() * palabras.length)];

  turnoActual = 0;
  mostrarRol();
  mostrarPantalla("pantallaRol");
}

function mostrarRol() {
  const carta = document.getElementById("carta");
  const mensaje = document.getElementById("mensajeRol");
  const dorso = document.getElementById("cartaDorso");

  carta.classList.remove("volteada");
  dorso.classList.toggle("impostor", impostores.includes(jugadores[turnoActual]));
  mensaje.textContent = "";

  carta.onclick = () => {
    carta.classList.add("volteada");
    mensaje.textContent = impostores.includes(jugadores[turnoActual])
  ? "SOS EL IMPOSTOR 😈"
  : `PALABRA: ${palabraSecreta}`;
  };
}

function siguienteJugador() {
  if (++turnoActual < jugadores.length) mostrarRol();
  else iniciarDiscusion();
}

// ---------------- DISCUSIÓN ----------------
function iniciarDiscusion() {
  mostrarPantalla("pantallaDiscusion");
  tiempo = 180;

  intervalo = setInterval(() => {
    document.getElementById("timer").textContent =
      `${String(Math.floor(tiempo / 60)).padStart(2, "0")}:${String(tiempo-- % 60).padStart(2, "0")}`;
    if (tiempo < 0) irAVotacion();
  }, 1000);
}

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  clearInterval(intervalo);
  votacionActiva = true;
  mostrarPantalla("pantallaVotacion");

  const div = document.getElementById("listaVotos");
  div.innerHTML = "";

  jugadores.forEach(j => {
    const card = document.createElement("div");
    card.className = "voto-card";
    card.textContent = j;

    card.onclick = () => {
      if (!votacionActiva) return;
      votacionActiva = false;
      card.classList.add("activo");
      setTimeout(() => mostrarResultado(j), 600);
    };

    div.appendChild(card);
  });
}

// ---------------- FINAL ----------------
function mostrarResultado(votado) {
  mostrarPantalla("pantallaFinal");

  const gananCiviles = impostores.includes(votado);
  document.getElementById("resultadoTexto").textContent =
    gananCiviles ? "¡Civiles ganaron! 🎉" : "¡Los impostores ganaron! 😈";

  document.getElementById("detalleFinal").textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabraSecreta}"`;
}

function nuevaRonda() {
  iniciarJuego();
}

// ---------------- CATEGORÍAS ----------------
function cargarCategorias() {
  db.collection("categorias").onSnapshot(snap => {
    categorias = {};
    snap.forEach(doc => categorias[doc.id] = doc.data().palabras);

    const div = document.getElementById("listaCategoriasInicio");
    div.innerHTML = "";

    Object.keys(categorias).forEach(c => {
      const b = document.createElement("button");
      b.textContent = c;
      b.className = "categoria-btn";
      b.onclick = () => {
        categoriaSeleccionada = c;
        document.querySelectorAll(".categoria-btn").forEach(x => x.classList.remove("activa"));
        b.classList.add("activa");
      };
      div.appendChild(b);
    });
  });
}

function agregarCategoria() {
  db.collection("categorias").doc(nombreCategoria.value).set({
    palabras: palabrasCategoria.value.split(",").map(p => p.trim())
  });
  nombreCategoria.value = palabrasCategoria.value = "";
}

function abrirCategorias() { mostrarPantalla("pantallaCategorias"); }
function volverInicio() { mostrarPantalla("pantallaInicio"); }

window.onload = cargarCategorias;


