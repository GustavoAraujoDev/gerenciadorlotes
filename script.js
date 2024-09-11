import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getDatabase, ref, set, get, update, remove } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

document.addEventListener('DOMContentLoaded', async () => {
    const modal = document.getElementById('modal');
    const closeBtn = document.querySelector('.close');
    const loteForm = document.getElementById('lote-form');
    const detailsSection = document.getElementById('details-section');
    const paymentSection = document.getElementById('payment-section');
    const loteIdElem = document.getElementById('lote-id');
    const availabilityMessage = document.getElementById('availability-message');
    const compradorNomeElem = document.getElementById('comprador-nome');
    const compradorValorElem = document.getElementById('comprador-valor');
    const compradorTamanhoElem = document.getElementById('comprador-tamanho');
    const compradorParcelasElem = document.getElementById('comprador-parcelas');
    const compradorParcelasRestantesElem = document.getElementById('comprador-parcelasrestantes');
    const valorRestanteElem = document.getElementById('valor-restante'); // Novo campo para valor restante
    const historico = document.getElementById('historico');
    const parcelaInput = document.getElementById('parcela');
    let loteAtual = null;

    function calcularValorRestante(loteData) {
      const valorTotal = parseFloat(loteData.valor) || 0;
      const pagamentos = loteData.pagamentos || [];
      const totalPago = pagamentos.reduce((acc, p) => acc + parseFloat(p.replace('R$', '',).trim()), 0);
      const valorRestante = valorTotal - totalPago;
      return valorRestante;
  }

  // Função para verificar o status de todos os lotes
  async function checkLotesStatus() {
    for (let i = 1; i <= 7; i++) { // Supondo que tenha 7 lotes
        const loteRef = ref(database, `lotes/${i}`);
        const snapshot = await get(loteRef);
        const loteData = snapshot.val();
        const loteElement = document.querySelector(`[data-lote="${i}"]`);

        if (loteData) {
            // Se o lote estiver ocupado, aplica a classe "occupied"
            loteElement.classList.add('occupied');
            loteElement.classList.remove('available');
        } else {
            // Se o lote estiver disponível, aplica a classe "available"
            loteElement.classList.add('available');
            loteElement.classList.remove('occupied');
        }
    }
}

     // Chama a função para checar o status dos lotes ao carregar a página
     await checkLotesStatus();

    // Função para abrir o modal de um lote e verificar o status
    async function updateLoteStatus(loteId) {
        const loteRef = ref(database, `lotes/${loteId}`);
        const snapshot = await get(loteRef);
        const loteData = snapshot.val();
        const loteElement = document.querySelector(`[data-lote="${loteId}"]`);
        if (loteData) {
            availabilityMessage.textContent = 'Este lote já está ocupado.';
            loteForm.classList.add('hidden');
            detailsSection.classList.remove('hidden');
            paymentSection.classList.remove('hidden');

            compradorNomeElem.textContent = `Nome do Comprador: ${loteData.comprador || 'N/A'}`;
            compradorValorElem.textContent = `Valor do Lote: R$ ${(loteData.valor || 'N/A')}`;
            compradorTamanhoElem.textContent = `Tamanho do Lote: ${loteData.tamanho || 'N/A'} M²`;
            compradorParcelasElem.textContent = `Número de Parcelas: ${loteData.parcelas || 'N/A'}`;
            const pagamentos = loteData.pagamentos || [];
           
            historico.innerHTML = pagamentos.map(p => `<li>${p}</li>`).join('');

             // Cálculo do valor restante
             const valorRestante = calcularValorRestante(loteData);
             valorRestanteElem.textContent = `Valor Restante: R$ ${valorRestante.toFixed(2)}`;
            
             const parcelasRestantes = loteData.parcelas - pagamentos.length;
             compradorParcelasRestantesElem.textContent = `Parcelas Restantes: ${parcelasRestantes}`;

        } else {
            availabilityMessage.textContent = 'Este lote está disponível.';
            loteForm.classList.remove('hidden');
            detailsSection.classList.add('hidden');
            paymentSection.classList.add('hidden');

            loteElement.classList.remove('occupied');
            loteElement.classList.add('available');
        }
    }

    // Função para adicionar um novo comprador ao lote
    async function saveLoteDetails() {
        const comprador = document.getElementById('comprador').value;
        const valor = document.getElementById('valor').value;
        const tamanho = document.getElementById('tamanho').value;
        const numParcelas = document.getElementById('parcelas').value;

        if (!comprador || !valor || !tamanho || !numParcelas) {
            alert('Por favor, preencha todos os detalhes do lote.');
            return;
        }

        if (loteAtual) {
            const loteRef = ref(database, `lotes/${loteAtual}`);
            const loteData = {
                comprador,
                valor,
                tamanho,
                parcelas: numParcelas,
                pagamentos: [] // Inicializa com array vazio
            };

            try {
                await set(loteRef, loteData);
                alert('Comprador adicionado com sucesso!');
                loteForm.classList.add('hidden');
                detailsSection.classList.remove('hidden');
                paymentSection.classList.remove('hidden');
                updateLoteStatus(loteAtual); // Atualiza os detalhes
            } catch (error) {
                console.error('Erro ao salvar o lote:', error);
                alert('Erro ao salvar os detalhes do lote.');
            }
        } else {
            alert('Lote inválido.');
        }
    }

    // Função para adicionar um pagamento (parcela)
    async function addParcela() {
        const parcelaValue = parcelaInput.value;
        const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        console.log(selectedPaymentMethod);
        
        if (!parcelaValue) {
            alert('Por favor, insira o valor da parcela.');
            return;
        }
        if (!selectedPaymentMethod) {
          alert('Por favor, insira um metodo de pagamento.');
          return;
      }
        const selectedPayment = selectedPaymentMethod.value;
        console.log(selectedPayment);
        const now = new Date();
        const pagamento = `R$ ${parcelaValue} - ${selectedPayment} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
        

        if (loteAtual) {
            const pagamentosRef = ref(database, `lotes/${loteAtual}/pagamentos`);
            const snapshot = await get(pagamentosRef);
            const pagamentos = snapshot.val() || [];

            pagamentos.push(pagamento);
            if (confirm('Tem certeza de que deseja adicionar essa parcela?')) {
            try {
                await set(pagamentosRef, pagamentos);
                historico.innerHTML += `<li>${pagamento}</li>`;
                parcelaInput.value = '';
                const radio = document.querySelectorAll('input[name="paymentMethod"]:checked');
             radio.forEach(radio => radio.checked = false);
                alert('Parcela adicionada com sucesso!');
                 
                 showFeedback('Parcela adicionada com sucesso!');
            } catch (error) {
                console.error('Erro ao adicionar parcela:', error);
                alert('Erro ao adicionar a parcela.');
            }
          }
        }
    }

    // Função para deletar um lote
    async function deleteLote() {
        if (confirm('Tem certeza de que deseja remover este lote?')) {
            const loteRef = ref(database, `lotes/${loteAtual}`);
            await remove(loteRef);
            modal.style.display = 'none';
            availabilityMessage.textContent = '';
            loteForm.classList.remove('hidden');
            detailsSection.classList.add('hidden');
            paymentSection.classList.add('hidden');
            alert('Lote removido com sucesso!');
        }
    }

    // Eventos de clique nos lotes
    document.querySelectorAll('.lote').forEach(lote => {
        lote.addEventListener('click', (e) => {
            const loteId = e.target.dataset.lote;
            loteIdElem.textContent = loteId;
            loteAtual = loteId;
            updateLoteStatus(loteId);
            modal.style.display = 'flex';
        });
    });

    // Evento para fechar o modal
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Evento para salvar um novo lote
    const saveButton = document.getElementById('save-button');
    saveButton.addEventListener('click', (e) => {
        e.preventDefault();
        saveLoteDetails();
    });

    // Evento para adicionar uma nova parcela
    const addParcelaButton = document.getElementById('add-parcela');
    addParcelaButton.addEventListener('click', addParcela);

    // Evento para deletar um lote
    const deleteLoteButton = document.getElementById('delete-lote');
    deleteLoteButton.addEventListener('click', deleteLote);
});
