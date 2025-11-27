// ======================================
// CONFIGURAÇÕES
// ======================================
const API_USERS = "http://localhost:3000/usuarios";
const API_CRIPTO = "http://localhost:3000/criptomoedas";


// ======================================
// AUTENTICAÇÃO
// ======================================
function getUser() {
  return JSON.parse(sessionStorage.getItem("usuarioLogado"));
}

async function protegerPagina() {
  const isPublic =
    location.pathname.includes("login.html") ||
    location.pathname.includes("cadastro.html") ||
    location.pathname.includes("criar.html");

  const user = getUser();
  if (isPublic) return;
  if (!user) window.location.href = "login.html";
}

function logout() {
  sessionStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
}


// ======================================
// FAVORITOS — sempre strings
// ======================================
function getFavoritos() {
  try {
    const raw = localStorage.getItem("favoritos");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(x => String(x)) : [];
  } catch {
    localStorage.removeItem("favoritos");
    return [];
  }
}

function salvarFavoritos(lista) {
  localStorage.setItem("favoritos", JSON.stringify(lista.map(String)));
}

function toggleFavorito(id) {
  const sid = String(id);
  let favs = getFavoritos();

  if (favs.includes(sid)) {
    favs = favs.filter(f => f !== sid);
  } else {
    favs.push(sid);
  }

  salvarFavoritos(favs);

  montarHome();
  montarFavoritos();
}


// ======================================
// GRÁFICO
// ======================================
async function montarGrafico() {
  const canvas = document.getElementById("graficoMarketCap");
  if (!canvas) return;

  try {
    const response = await fetch(API_CRIPTO);
    const data = await response.json();

    new Chart(canvas.getContext("2d"), {
      type: "pie",
      data: {
        labels: data.map(c => c.nome),
        datasets: [{
          data: data.map(c => Number(c.market_cap) || 0)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,  
        plugins: {
          legend: {
            position: 'bottom',  
            labels: {
              color: '#000',
              font: { size: 12 }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error("Erro ao montar gráfico:", err);
  }
}


// ======================================
// CRUD — funções gerais
// ======================================
async function carregarCriptos() {
  try {
    const res = await fetch(API_CRIPTO);
    return await res.json();
  } catch {
    return [];
  }
}

async function novaPostagem(dados) {
  return fetch(API_CRIPTO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}

async function editarPostagem(id, dados) {
  return fetch(`${API_CRIPTO}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados)
  });
}

async function apagarPostagem(id) {
  return fetch(`${API_CRIPTO}/${id}`, { method: "DELETE" });
}


// ======================================
// CRUD DO cadastro.html
// ======================================
function ativarCrudCadastro() {
  const form = document.getElementById("crud-form");
  const select = document.getElementById("crud-operacao");
  const msg = document.getElementById("msg");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const op = select.value;
    const id = document.getElementById("id").value.trim();

    const dados = {
      nome: document.getElementById("nome").value,
      descricao: document.getElementById("descricao").value,
      criador: document.getElementById("criador").value,
      ano_criacao: Number(document.getElementById("ano").value),
      conteudo: document.getElementById("conteudo").value,
      market_cap: Number(document.getElementById("mktc").value)
    };

    try {
      let res;
      if (op === "POST") res = await novaPostagem(dados);
      if (op === "PUT") res = await editarPostagem(id, dados);
      if (op === "DELETE") res = await apagarPostagem(id);

      if (!res.ok) throw new Error("Erro na operação");

      msg.textContent = "Operação realizada com sucesso!";
      form.reset();

    } catch (err) {
      msg.textContent = "Erro: " + err.message;
    }
  });
}


// ======================================
// BUSCA POR NOME
// ======================================
async function buscarCriptosPorNome(nome) {
  const todas = await carregarCriptos();
  if (!nome.trim()) return todas;

  return todas.filter(c =>
    c.nome.toLowerCase().includes(nome.toLowerCase())
  );
}



// ======================================
// HOME
// (agora aceita listaFiltrada para busca)
// ======================================
async function montarHome(listaFiltrada = null) {
  const cards = document.getElementById("cards-container");
  const carousel = document.getElementById("carousel-container");
  if (!cards) return;

  const criptos = listaFiltrada || await carregarCriptos();
  const favoritos = getFavoritos();

  // carrossel
  if (carousel) {
    carousel.innerHTML = "";
    criptos
      .filter(c => c.destaque)
      .slice(0, 3)
      .forEach((item, i) => {
        carousel.innerHTML += `
          <div class="carousel-item ${i === 0 ? "active" : ""}">
            <img src="${item.imagem_principal}" class="d-block w-100">
            <div class="carousel-caption bg-dark bg-opacity-50 rounded">
              <h5>${item.nome}</h5>
              <p>${item.descricao}</p>
            </div>
          </div>`;
      });
  }

  // cards
  cards.innerHTML = criptos.map(item => {
    const sid = String(item.id);
    const heart = favoritos.includes(sid) ? "❤️" : "🤍";

    return `
      <div class="col-md-4 mb-4">
        <div class="bloco p-3 text-center h-100">
          <img src="${item.imagem_principal}" class="w-100 rounded mb-3">
          <div class="d-flex justify-content-between align-items-center">
            <a href="detalhes.html?id=${item.id}" class="text-white text-decoration-none">
              <h4>${item.nome}</h4>
            </a>
            <button class="btn btn-sm" onclick="toggleFavorito('${sid}')">${heart}</button>
          </div>
          <p class="text-muted small">${item.descricao}</p>
        </div>
      </div>`;
  }).join("");
}

// ======================================
// DETALHES
// ======================================
async function montarDetalhes() {
  const container = document.getElementById("detalhe");
  if (!container) return;

  const id = new URLSearchParams(location.search).get("id");
  const lista = await carregarCriptos();
  const item = lista.find(c => String(c.id) === String(id));

  container.innerHTML = item ? `
    <h2>${item.nome}</h2>
    <img src="${item.imagem_principal}" class="w-75 rounded my-3">
    <p><strong>Criador:</strong> ${item.criador}</p>
    <p><strong>Ano:</strong> ${item.ano_criacao}</p>
    <p>${item.conteudo}</p>
  ` : "<p>Item não encontrado.</p>";
}

// ======================================
// FAVORITOS
// ======================================
async function montarFavoritos() {
  const container = document.getElementById("fav-container") || document.getElementById("lista-favoritos");
  if (!container) return;

  const favs = getFavoritos();
  const criptos = await carregarCriptos();

  const filtradas = criptos.filter(c => favs.includes(String(c.id)));

  if (filtradas.length === 0) {
    container.innerHTML = `<p class="text-white">Nenhum favorito ainda.</p>`;
    return;
  }

  container.innerHTML = filtradas.map(c => `
    <div class="bloco p-3 mb-3">
      <h4>${c.nome}</h4>
      <img src="${c.imagem_principal}" class="w-50 rounded my-2">
      <p>${c.descricao}</p>
      <button class="btn btn-sm btn-danger" onclick="toggleFavorito('${c.id}')">Remover</button>
    </div>
  `).join("");
}

// ======================================
// INICIALIZAÇÃO GLOBAL
// ======================================
document.addEventListener("DOMContentLoaded", async () => {
  await protegerPagina();

  montarHome();
  montarDetalhes();
  montarFavoritos();
  montarGrafico();
  ativarCrudCadastro();

  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) btnLogout.addEventListener("click", logout);

  // BUSCA POR NOME
  const inputBusca = document.getElementById("busca");
  const btnBuscar = document.getElementById("btn-buscar");

  if (btnBuscar && inputBusca) {
    btnBuscar.addEventListener("click", async () => {
      const termo = inputBusca.value;
      const filtradas = await buscarCriptosPorNome(termo);
      montarHome(filtradas);
    });

    inputBusca.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        const termo = inputBusca.value;
        const filtradas = await buscarCriptosPorNome(termo);
        montarHome(filtradas);
      }
    });
  }

  // deixar disponível no escopo global
  window.toggleFavorito = toggleFavorito;
  window.logout = logout;
});
