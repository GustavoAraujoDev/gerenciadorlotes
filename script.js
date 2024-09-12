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
        
        if (!parcelaValue) {
            alert('Por favor, insira o valor da parcela.');
            return;
        }
        if (!selectedPaymentMethod) {
          alert('Por favor, insira um metodo de pagamento.');
          return;
      }
        const selectedPayment = selectedPaymentMethod.value;
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
             gerarComprovantePagamento(parcelaValue, selectedPayment, comprador, pagamentos);
                alert('Parcela adicionada com sucesso!');
                 
                 showFeedback('Parcela adicionada com sucesso!');
            } catch (error) {
                console.error('Erro ao adicionar parcela:', error);
                alert('Erro ao adicionar a parcela.');
            }
          }
        }
    }

// Função para gerar o comprovante de pagamento em PDF com layout profissional e histórico de pagamentos anteriores
async function gerarComprovantePagamento(parcelaValue, selectedPayment, comprador, pagamentos) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const loteRef = ref(database, `lotes/${loteAtual}`);
        const snapshot = await get(loteRef);
        const loteData = snapshot.val();

    // Adiciona a logo no topo à esquerda
    const logo = 'logo.jpeg'; // Substitua pela sua imagem base64 ou URL da imagem
    doc.addImage(logo, 'JPEG', 10, 10, 40, 20); // Posição x, y, largura, altura

    // Informações da empresa à direita
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Gerenciador de Lotes', 195, 15, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('www.suaempresa.com', 195, 22, { align: 'right' });
    doc.text('(11) 1234-5678', 195, 28, { align: 'right' });
    doc.text('gerenciadorlotes@suaempresa.com', 195, 34, { align: 'right' });

    // Título centralizado do comprovante
    doc.setFontSize(20);
    doc.setFont('Helvetica', 'bold');
    doc.text('Comprovante de Pagamento', 105, 50, { align: 'center' });

    // Caixa ao redor do conteúdo principal
    doc.setLineWidth(0.5);
    doc.rect(10, 60, 190, 150); // Ajusta o tamanho da caixa conforme necessário

    // Informações do comprador e pagamento
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'bold');
    doc.text('Nome do Comprador:', 15, 75);
    doc.text('Lote:', 15, 85);
    doc.text('Valor da Parcela:', 15, 95);
    doc.text('Método de Pagamento:', 15, 105);
    doc.text('Data do Pagamento:', 15, 115);

    // Valores das informações
    doc.setFont('Helvetica', 'normal');

    // Ajuste automático do texto
    function fitText(text, x, y, maxWidth) {
        let fontSize = 12;
        while (doc.getTextWidth(text) > maxWidth && fontSize > 6) {
            fontSize -= 0.5;
            doc.setFontSize(fontSize);
        }
        doc.text(text, x, y);
        doc.setFontSize(12); // Restaura o tamanho da fonte padrão
    }

    fitText(loteData.comprador, 60, 75, 130);
    fitText(loteAtual, 60, 85, 130);
    fitText(`R$ ${parcelaValue}`, 60, 95, 130);
    fitText(`${selectedPayment}`, 63, 105, 130);

    const now = new Date();
    const dataPagamento = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    fitText(dataPagamento, 60, 115, 130);

    // Histórico de pagamentos anteriores
    doc.setFont('Helvetica', 'bold');
    doc.text('Histórico de Pagamentos:', 15, 135);
    doc.setFont('Helvetica', 'normal');

    // Ajuste o layout para o histórico de pagamentos
    let yPos = 145;
    pagamentos.forEach(p => {
        fitText(p, 20, yPos, 180);
        yPos += 10;
    });

    // Linha divisória antes do rodapé
    doc.line(10, yPos + 10, 200, yPos + 10);

    // Rodapé com agradecimento e informações adicionais
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'italic');
    fitText('Obrigado pela sua confiança!', 65, yPos + 20, 180);
    doc.setFont('Helvetica', 'normal');
    fitText('Este é um comprovante oficial.', 65, yPos + 25, 180);
    fitText('Todos os direitos reservados - Gerenciador de Lotes', 65, yPos + 30, 180);

    // Salva o PDF com nome personalizado
    doc.save(`Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`);
     // Alternativa para salvar o PDF em dispositivos móveis
     const pdfBlob = doc.output('blob');
     const pdfUrl = URL.createObjectURL(pdfBlob);
 
     // Cria um link e simula um clique para download
     const link = document.createElement('a');
     link.href = pdfUrl;
     link.download = `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(pdfUrl);
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
