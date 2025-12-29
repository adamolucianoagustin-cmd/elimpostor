// DOM
const nombreJugador = document.getElementById("nombreJugador");
const listaJugadores = document.getElementById("listaJugadores");
const contadorJugadores = document.getElementById("contadorJugadores");
const btnIniciar = document.getElementById("btnIniciar");
const cantidadImpostores = document.getElementById("cantidadImpostores");
const listaCategoriasInicio = document.getElementById("listaCategoriasInicio");

// Pantallas
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}
const irModoLocal = () => mostrarPantalla("pantallaLocal");
const irModoOnline = () => mostrarPantalla("pantallaOnline");
const volverSelector = () => mostrarPantalla("pantallaModo");

// Juego
let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;
let ordenTurnos = [];
let turnoActual = 0;
let palabraSecreta = "";
let roles = {};
let votos = {};
let cartaMostrada = false;

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

// Iniciar juego
function iniciarJuego() {
  palabraSecreta = categorias[categoriaSeleccionada]
    [Math.floor(Math.random() * categorias[categoriaSeleccionada].length)];

  ordenTurnos = [...jugadores].sort(() => Math.random() - 0.5);
  turnoActual = 0;
  votos = {};
  roles = {};

  [...ordenTurnos].sort(() => Math.random() - 0.5)
    .forEach((j, i) => roles[j] = i < cantidadImpostores.value ? "impostor" : "civil");

  mostrarPantallaPasar();
}

// Pasar celular
function mostrarPantallaPasar() {
  document.getElementById("textoPasar").textContent =
    `Ahora toma el celular: ${ordenTurnos[turnoActual]}`;
  mostrarPantalla("pantallaPasar");
}

// Carta con doble toque
function mostrarCarta() {
  const jugador = ordenTurnos[turnoActual];
  document.getElementById("turnoJugador").textContent = jugador;

  const carta = document.getElementById("cartaRol");
  const textoRol = document.getElementById("textoRol");

  textoRol.textContent =
    roles[jugador] === "impostor"
      ? "😈 SOS EL IMPOSTOR"
      : `🧠 PALABRA:\n${palabraSecreta}`;

  carta.classList.remove("volteada");
  cartaMostrada = false;

  const tocarCarta = () => {
    if (!cartaMostrada) {
      carta.classList.add("volteada");
      cartaMostrada = true;
    } else {
      carta.classList.remove("volteada");
      carta.removeEventListener("click", tocarCarta);
      carta.removeEventListener("touchstart", tocarCarta);
      setTimeout(siguienteJugador, 500);
    }
  };

  carta.addEventListener("click", tocarCarta);
  carta.addEventListener("touchstart", tocarCarta);

  mostrarPantalla("pantallaRol");
}

function siguienteJugador() {
  turnoActual++;
  turnoActual >= ordenTurnos.length
    ? iniciarVotacion()
    : mostrarPantallaPasar();
}

// Votación
function iniciarVotacion() {
  mostrarPantalla("pantallaVotacion");
  const cont = document.getElementById("listaVotacion");
  cont.innerHTML = "";
  jugadores.forEach(j => votos[j] = 0);

  jugadores.forEach(votante => {
    const div = document.createElement("div");
    div.className = "voto-card";
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

// Resultado
function mostrarResultado() {
  mostrarPantalla("pantallaResultado");
  document.getElementById("resultadoFinal").innerHTML = `
    ${Object.entries(votos).map(v => `<p>${v[0]}: ${v[1]}</p>`).join("")}
    <hr>
    <strong>Impostores:</strong>
    ${Object.keys(roles).filter(j => roles[j] === "impostor").join(", ")}
  `;
}

