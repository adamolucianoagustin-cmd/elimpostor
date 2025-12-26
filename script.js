let modo = "local";

let jugadores = [];
let categorias = {};
let categoriaSeleccionada = null;

let roles = {};
let palabra = "";

// LOCAL
let ordenRolesLocal = [];
let indiceRolLocal = 0;
let cartaAbierta = false;

// TIMER
let tiempo = 180;
let intervalo;

// ---------------- PANTALLAS ----------------
function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p => p.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- MODO ----------------
function seleccionarModo(m) {
  modo = m;
  jugadores = [];
  listaJugadores.innerHTML = "";
  bloqueOnline.style.display = m === "online" ? "block" : "none";
}

// ---------------- CATEGORÍAS ----------------
db.collection("categorias").onSnapshot(snap => {
  categorias = {};
  listaCategoriasInicio.innerHTML = "";

  snap.forEach(doc => categorias[doc.id] = doc.data().palabras);

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

// ---------------- JUGADORES ----------------
function agregarJugador() {
  const nombre = nombreJugador.value.trim();
  if (!nombre) return;
  jugadores.push(nombre);
  nombreJugador.value = "";
  listaJugadores.innerHTML = jugadores.map(j => `<li>${j}</li>`).join("");
}

// ---------------- INICIAR JUEGO ----------------
function iniciarJuego() {
  const cant = parseInt(cantidadImpostores.value);
  const mix = [...jugadores].sort(() => Math.random() - 0.5);

  roles = {};
  mix.forEach((j,i)=> roles[j] = i < cant ? "impostor" : "civil");

  palabra = categorias[categoriaSeleccionada][
    Math.floor(Math.random() * categorias[categoriaSeleccionada].length)
  ];

  ordenRolesLocal = [...jugadores].sort(() => Math.random() - 0.5);
  indiceRolLocal = 0;

  mostrarCartaJugador();
}

// ---------------- CARTA LOCAL ----------------
function mostrarCartaJugador() {
  cartaAbierta = false;
  mostrarPantalla("pantallaRol");

  const jugador = ordenRolesLocal[indiceRolLocal];
  frenteCarta.textContent = `Le toca a:\n${jugador}`;
  dorsoCarta.textContent = "";

  cartaRol.classList.remove("volteada");

  cartaRol.onclick = () => {
    if (cartaAbierta) return;
    cartaAbierta = true;
    cartaRol.classList.add("volteada");

    dorsoCarta.textContent =
      roles[jugador] === "impostor"
        ? "SOS EL IMPOSTOR 😈"
        : `PALABRA:\n${palabra}`;
  };
}

function confirmarRol() {
  indiceRolLocal++;
  if (indiceRolLocal < ordenRolesLocal.length) {
    mostrarCartaJugador();
  } else {
    iniciarDiscusion();
  }
}

// ---------------- DISCUSIÓN ----------------
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

// ---------------- VOTACIÓN ----------------
function irAVotacion() {
  clearInterval(intervalo);
  mostrarPantalla("pantallaVotacion");

  listaVotos.innerHTML = jugadores.map(j =>
    `<div class="voto-card" onclick="mostrarResultado('${j}')">${j}</div>`
  ).join("");
}

// ---------------- RESULTADO ----------------
function mostrarResultado(votado) {
  const impostores = Object.keys(roles).filter(j => roles[j] === "impostor");

  resultadoTexto.textContent =
    impostores.includes(votado)
      ? "¡Civiles ganaron! 🎉"
      : "¡Impostores ganaron! 😈";

  detalleFinal.textContent =
    `Impostores: ${impostores.join(", ")} | Palabra: "${palabra}"`;

  mostrarPantalla("pantallaFinal");
}

// ---------------- FINAL ----------------
function nuevaRonda() {
  mostrarPantalla("pantallaInicio");
}

function salirInicio() {
  location.reload();
}
