let jugadores = [];
let turnoActual = 0;
let impostorIndex = 0;
let palabraSecreta = "";
let categoriaSeleccionada = null;

const categorias = {
  animales: ["Perro", "Gato", "Elefante", "León", "Tigre"],
  objetos: ["Mesa", "Silla", "Celular", "Llave", "Reloj"],
  futbol: ["Boca", "River", "Barcelona", "Real Madrid", "PSG"]
};

// ---------------- PANTALLAS ----------------

function mostrarPantalla(id) {
  document.querySelectorAll(".pantalla").forEach(p =>
    p.classList.remove("activa")
  );
  document.getElementById(id).classList.add("activa");
}

// ---------------- JUGADORES ----------------

function agregarJugador() {
  const input = document.getElementById("nombreJugador");
  const nombre = input.value.trim();

  if (nombre === "") {
    alert("Escribí un nombre");
    return;
  }

  jugadores.push(nombre);
  input.value = "";
  mostrarJugadores();
}

function mostrarJugadores() {
  const lista = document.getElementById("listaJugadores");
  lista.innerHTML = "";

  jugadores.forEach(j => {
    const li = document.createElement("li");
    li.textContent = j;
    lista.appendChild(li);
  });
}

// ---------------- JUEGO ----------------

function iniciarJuego() {
  if (jugadores.length < 3) {
    alert("Mínimo 3 jugadores");
    return;
  }

  if (!categoriaSeleccionada) {
    alert("Elegí una categoría");
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
  const mensaje = document.getElementById("mensajeRol");
  const carta = document.querySelector(".carta");
  const dorso = document.getElementById("cartaDorso");

  carta.classList.remove("volteada");
  dorso.classList.remove("impostor");
  mensaje.textContent = "";

  carta.onclick = () => {
    carta.classList.add("volteada");

    if (turnoActual === impostorIndex) {
      mensaje.textContent =
        jugadores[turnoActual] + ": SOS EL IMPOSTOR 😈";
      dorso.classList.add("impostor");
    } else {
      mensaje.textContent =
        jugadores[turnoActual] + ": La palabra es → " + palabraSecreta;
    }
  };
}

function siguienteJugador() {
  turnoActual++;

  if (turnoActual >= jugadores.length) {
    alert("¡Todos vieron su rol!");
    mostrarPantalla("pantallaInicio");
  } else {
    mostrarRol();
  }
}

// ---------------- CATEGORÍAS ----------------

function renderizarCategorias() {
  const contenedor = document.getElementById("listaCategoriasInicio");
  contenedor.innerHTML = "";

  for (let nombre in categorias) {
    const btn = document.createElement("button");
    btn.textContent = nombre;
    btn.className = "categoria-btn";
    btn.onclick = () => seleccionarCategoria(nombre, btn);
    contenedor.appendChild(btn);
  }
}

function seleccionarCategoria(nombre, boton) {
  categoriaSeleccionada = nombre;

  document.querySelectorAll(".categoria-btn").forEach(b =>
    b.classList.remove("activa")
  );

  boton.classList.add("activa");
}

function abrirCategorias() {
  mostrarPantalla("pantallaCategorias");
  mostrarCategorias();
}

function volverInicio() {
  mostrarPantalla("pantallaInicio");
}

function agregarCategoria() {
  const nombre = document.getElementById("nombreCategoria").value.trim();
  const palabrasTexto = document.getElementById("palabrasCategoria").value.trim();

  if (nombre === "" || palabrasTexto === "") {
    alert("Completá todos los campos");
    return;
  }

  if (categorias[nombre]) {
    alert("Esa categoría ya existe");
    return;
  }

  categorias[nombre] = palabrasTexto
    .split(",")
    .map(p => p.trim())
    .filter(p => p !== "");

  guardarCategorias();
  mostrarCategorias();
  renderizarCategorias();

  document.getElementById("nombreCategoria").value = "";
  document.getElementById("palabrasCategoria").value = "";
}

function mostrarCategorias() {
  const lista = document.getElementById("listaCategorias");
  lista.innerHTML = "";

  for (let nombre in categorias) {
    const li = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = nombre + " → " + categorias[nombre].join(", ");

    const borrarBtn = document.createElement("button");
    borrarBtn.textContent = "❌";
    borrarBtn.style.marginLeft = "10px";
    borrarBtn.onclick = () => {
      if (confirm("¿Borrar categoría '" + nombre + "'?")) {
        delete categorias[nombre];
        guardarCategorias();
        mostrarCategorias();
        renderizarCategorias();
      }
    };

    li.appendChild(texto);
    li.appendChild(borrarBtn);
    lista.appendChild(li);
  }
}
  

// ---------------- STORAGE ----------------

function guardarCategorias() {
  localStorage.setItem("categorias", JSON.stringify(categorias));
}

function cargarCategorias() {
  const guardadas = localStorage.getItem("categorias");
  if (guardadas) {
    const obj = JSON.parse(guardadas);
    for (let n in obj) categorias[n] = obj[n];
  }
}

window.onload = () => {
  cargarCategorias();
  renderizarCategorias();
};
