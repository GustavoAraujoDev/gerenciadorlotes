  // Importa e inicializa o Firebase
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
  import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

  // Configuração do Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyC2d46W-IGXfP6k8RWHb9hqZPJWLTRjRsU",
    authDomain: "gerenciadorlotes.firebaseapp.com",
    projectId: "gerenciadorlotes",
    storageBucket: "gerenciadorlotes.appspot.com",
    messagingSenderId: "248668218799",
    appId: "1:248668218799:web:123be74080d9918cf1bb5a"
  };

  // Inicializa o Firebase
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  document.addEventListener('DOMContentLoaded', () => {
    const formLote = document.getElementById('formLote');
    const formContainerLote = document.getElementById('formContainerLote');
    const btnMostrarFormularioLote = document.getElementById('btnMostrarFormularioLote');
    const listaLotes = document.getElementById('listaLotes');
    const detalhesLote = document.getElementById('detalhesLote');
    const detalhes = document.getElementById('detalhes');
    const atualizarParcelasInput = document.getElementById('atualizarParcelas');
    const btnAtualizarParcelas = document.getElementById('btnAtualizarParcelas');
    const btnOcultarDetalhes = document.getElementById('btnOcultarDetalhes');
    const modalConfirmacao = document.getElementById('modalConfirmacao');
    const btnConfirmarAtualizacao = document.getElementById('btnConfirmarAtualizacao');
    const btnCancelarAtualizacao = document.getElementById('btnCancelarAtualizacao');
    const closeModal = document.querySelector('.close');

    let loteAtualIndex = null; // Para rastrear o lote selecionado
    let parcelas = 0; // Para armazenar o número total de parcelas do lote atual

    // Mostrar/ocultar o formulário de adicionar lote
    btnMostrarFormularioLote.addEventListener('click', () => {
        formContainerLote.style.display = formContainerLote.style.display === 'none' ? 'block' : 'none';
    });

    // Adicionar um novo lote
    formLote.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nomeLote = document.getElementById('nomeLote').value;
        const comprador = document.getElementById('comprador').value;
        const tamanho = document.getElementById('tamanho').value;
        const valor = document.getElementById('valor').value;
        const parcelas = parseInt(document.getElementById('parcelas').value, 10);
        const parcelasPagas = parseInt(document.getElementById('parcelasPagas').value, 10);

        if (isNaN(parcelas) || isNaN(parcelasPagas)) {
            alert('Por favor, insira valores válidos para parcelas e parcelas pagas.');
            return;
        }

        const parcelasFaltantes = parcelas - parcelasPagas;

        const lote = {
            nomeLote,
            comprador,
            tamanho,
            valor,
            parcelas,
            parcelasPagas,
            parcelasFaltantes
        };

        const newLoteRef = ref(database, 'lotes/' + Date.now());
        await set(newLoteRef, lote);

        formLote.reset();
        formContainerLote.style.display = 'none'; // Esconder o formulário após adicionar
        carregarLotes(); // Atualizar a lista de lotes
    });

    // Carregar lotes do Firebase
    function carregarLotes() {
        const lotesRef = ref(database, 'lotes/');
        onValue(lotesRef, (snapshot) => {
            listaLotes.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const lote = childSnapshot.val();
                const li = document.createElement('li');
                li.textContent = lote.nomeLote;

                // Botão de exclusão
                const btnExcluir = document.createElement('button');
                btnExcluir.textContent = 'Excluir';
                btnExcluir.className = 'btn-excluir';
                btnExcluir.addEventListener('click', (e) => {
                    e.stopPropagation(); // Impede a propagação do evento de clique para a lista
                    excluirLote(childSnapshot.key);
                });

                li.appendChild(btnExcluir);
                li.addEventListener('click', () => exibirDetalhesLote(childSnapshot.key));
                listaLotes.appendChild(li);
            });
        });
    }

    // Exibir detalhes do lote
    function exibirDetalhesLote(key) {
        loteAtualIndex = key; // Armazenar qual lote está sendo visualizado

        const loteRef = ref(database, 'lotes/' + key);
        get(loteRef).then((snapshot) => {
            const lote = snapshot.val();
            parcelas = lote.parcelas; // Atualizar o número total de parcelas
            detalhes.textContent = `
                Nome do Lote: ${lote.nomeLote}
                Comprador: ${lote.comprador}
                Tamanho: ${lote.tamanho} m²
                Valor Total: R$ ${lote.valor}
                Parcelas: ${lote.parcelas}
                Parcelas Pagas: ${lote.parcelasPagas}
                Parcelas Faltantes: ${lote.parcelasFaltantes}
            `;
            detalhesLote.style.display = 'block';
        });
    }

    // Ocultar detalhes do lote
    btnOcultarDetalhes.addEventListener('click', () => {
        detalhesLote.style.display = 'none';
    });

    // Atualizar parcelas pagas
    btnAtualizarParcelas.addEventListener('click', () => {
        modalConfirmacao.style.display = 'block';
    });

    // Confirmar atualização
    btnConfirmarAtualizacao.addEventListener('click', async () => {
        const parcelasPagas = parseInt(atualizarParcelasInput.value, 10);

        if (isNaN(parcelasPagas)) {
            alert('Por favor, insira um número válido para parcelas pagas.');
            return;
        }

        const parcelasFaltantes = parcelas - parcelasPagas;

        const loteRef = ref(database, 'lotes/' + loteAtualIndex);
        await update(loteRef, {
            parcelasPagas: parcelasPagas,
            parcelasFaltantes: parcelasFaltantes
        });

        modalConfirmacao.style.display = 'none';
        detalhesLote.style.display = 'none';
        carregarLotes(); // Atualizar a lista de lotes
    });

    // Cancelar atualização
    btnCancelarAtualizacao.addEventListener('click', () => {
        modalConfirmacao.style.display = 'none';
    });

    // Fechar o modal ao clicar no 'x'
    closeModal.addEventListener('click', () => {
        modalConfirmacao.style.display = 'none';
    });

    // Excluir um lote
    async function excluirLote(key) {
        const loteRef = ref(database, 'lotes/' + key);
        await remove(loteRef);
        carregarLotes(); // Atualizar a lista de lotes
    }

    // Inicializar a carga de lotes
    carregarLotes();
});