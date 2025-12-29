// ================= DOM =================
const nombreJugador = document.getElementById("nombreJugador");
const listaJugadores = document.getElementById("listaJugadores");
const contadorJugadores = document.getElementById("contadorJugadores");
const btnIniciar = document.getElementById("btnIniciar");
const cantidadImpostores = document.getElementById("cantidadImpostores");
const listaCategoriasInicio = document.getElementById("listaCategoriasInicio");

// ================= PANTALLAS =================
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}
function irModoLocal() { mostrarPantalla("pantallaLocal"); }
function irModoOnline() { mostrarPantalla("pantallaOnline"); }
function volverSelector() { mostrarPantalla("pantallaModo"); }

// ================= JUEGO LOCAL =================
let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;

let ordenTurnos = [];
let turnoActual = 0;
let palabraSecreta = "";
let roles = {};
let votos = {};

// Categorías
db.collection("categorias").onSnapshot(snap => {
  listaCategoriasInicio.innerHTML = "";
  categorias = {};
  snap.forEach(doc => {
    categorias[doc.id] = doc.data().palabras;
    const b = document.createElement("button");
    b.textContent = doc.id;
    b.onclick = () => {
      categoriaSeleccionada = doc.id;
      validarInicio();
    };
    listaCategoriasInicio.appendChild(b);
  });
});

function agregarJugador() {
  if (!nombreJugador.value) return;
  jugadores.push(nombreJugador.value);
  nombreJugador.value = "";
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
  contadorJugadores.textContent = `Jugadores: ${jugadores.length}`;
  validarInicio();
}

function validarInicio() {
  btnIniciar.disabled =
    jugadores.length < 3 ||
    !categoriaSeleccionada ||
    cantidadImpostores.value >= jugadores.length;
}

// ================= INICIAR =================
function iniciarJuego() {
  palabraSecreta = categorias[categoriaSeleccionada]
    [Math.floor(Math.random() * categorias[categoriaSeleccionada].length)];

  ordenTurnos = [...jugadores].sort(() => Math.random() - 0.5);
  turnoActual = 0;
  roles = {};
  votos = {};

  const mezcla = [...ordenTurnos].sort(() => Math.random() - 0.5);
  mezcla.forEach((j, i) => {
    roles[j] = i < cantidadImpostores.value ? "impostor" : "civil";
  });

  mostrarPantallaPasar();
}

// ================= PASAR CELULAR =================
function mostrarPantallaPasar() {
  const jugador = ordenTurnos[turnoActual];
  document.getElementById("textoPasar").textContent =
    `Ahora toma el celular: ${jugador}`;
  mostrarPantalla("pantallaPasar");
}

function mostrarCarta() {
  const jugador = ordenTurnos[turnoActual];
  document.getElementById("turnoJugador").textContent = jugador;

  const carta = document.getElementById("cartaRol");
  const frente = document.getElementById("frenteCarta");
  const dorso = document.getElementById("dorsoCarta");
  const btn = document.getElementById("btnSiguiente");

  frente.textContent = "Tocá para ver";
  dorso.textContent =
    roles[jugador] === "impostor"
      ? "😈 SOS EL IMPOSTOR"
      : `🧠 PALABRA: ${palabraSecreta}`;

  carta.classList.remove("volteada");
  btn.style.display = "none";

  carta.onclick = () => {
    carta.classList.add("volteada");
    btn.style.display = "block";
    carta.onclick = null;
  };

  mostrarPantalla("pantallaRol");
}

function siguienteJugador() {
  turnoActual++;
  if (turnoActual >= ordenTurnos.length) iniciarVotacion();
  else mostrarPantallaPasar();
}

// ================= VOTACIÓN =================
function iniciarVotacion() {
  mostrarPantalla("pantallaVotacion");
  const cont = document.getElementById("listaVotacion");
  cont.innerHTML = "";
  jugadores.forEach(j => votos[j] = 0);

  jugadores.forEach(votante => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${votante}</strong>`;
    jugadores.filter(j => j !== votante).forEach(v => {
      const b = document.createElement("button");
      b.textContent = v;
      b.onclick = () => {
        votos[v]++;
        div.remove();
        if (!cont.children.length) mostrarResultado();
      };
      div.appendChild(b);
    });
    cont.appendChild(div);
  });
}

// ================= RESULTADO =================
function mostrarResultado() {
  mostrarPantalla("pantallaResultado");
  const res = document.getElementById("resultadoFinal");
  res.innerHTML = `
    ${Object.entries(votos).map(v => `<p>${v[0]}: ${v[1]}</p>`).join("")}
    <hr>
    <strong>Impostores:</strong>
    ${Object.keys(roles).filter(j => roles[j] === "impostor").join(", ")}
  `;
}
