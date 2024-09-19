import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC2d46W-IGXfP6k8RWHb9hqZPJWLTRjRsU",
  authDomain: "gerenciadorlotes.firebaseapp.com",
  projectId: "gerenciadorlotes",
  storageBucket: "gerenciadorlotes.appspot.com",
  messagingSenderId: "248668218799",
  appId: "1:248668218799:web:123be74080d9918cf1bb5a",
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener("DOMContentLoaded", async () => {
  const modal = document.getElementById("modal");
  const closeBtn = document.querySelector(".close");
  const loteForm = document.getElementById("lote-form");
  const detailsSection = document.getElementById("details-section");
  const paymentSection = document.getElementById("payment-section");
  const loteIdElem = document.getElementById("lote-id");
  const availabilityMessage = document.getElementById("availability-message");
  const compradorNomeElem = document.getElementById("comprador-nome");
  const compradorValorElem = document.getElementById("comprador-valor");
  const compradorComprimentoElem = document.getElementById("comprador-Comprimento");
  const compradorLarguraElem = document.getElementById("comprador-Largura");
  const compradorParcelasElem = document.getElementById("comprador-parcelas");
  const compradorParcelasRestantesElem = document.getElementById("comprador-parcelasrestantes");
  const valorRestanteElem = document.getElementById("valor-restante"); // Novo campo para valor restante
  const historico = document.getElementById("historico");
  const parcelaInput = document.getElementById("parcela");
  let loteAtual = null;

  function calcularValorRestante(loteData) {
    const valorTotal = parseFloat(loteData.valor) || 0;
    const pagamentos = loteData.pagamentos || [];
    const totalPago = pagamentos.reduce(
      (acc, p) => acc + parseFloat(p.replace("R$", "").trim()),
      0
    );
    const valorRestante = valorTotal - totalPago;
    return valorRestante;
  }

  // Função para verificar o status de todos os lotes
  async function checkLotesStatus() {
    for (let i = 1; i <= 7; i++) {
      // Supondo que tenha 7 lotes
      const loteRef = ref(database, `lotes/${i}`);
      const snapshot = await get(loteRef);
      const loteData = snapshot.val();
      const loteElement = document.querySelector(`[data-lote="${i}"]`);

      if (loteData) {
        // Se o lote estiver ocupado, aplica a classe "occupied"
        loteElement.classList.add("occupied");
        loteElement.classList.remove("available");
      } else {
        // Se o lote estiver disponível, aplica a classe "available"
        loteElement.classList.add("available");
        loteElement.classList.remove("occupied");
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
      availabilityMessage.textContent = "Este lote já está ocupado.";
      loteForm.classList.add("hidden");
      detailsSection.classList.remove("hidden");
      paymentSection.classList.remove("hidden");
      deleteLoteButton.classList.remove("hidden")

      compradorNomeElem.textContent = `Nome do Comprador: ${
        loteData.comprador || "N/A"
      }`;
      compradorValorElem.textContent = `Valor do Lote: R$ ${
        loteData.valor || "N/A"
      }`;
      compradorLarguraElem.textContent = `Largura do Lote: ${
        loteData.Largura || "N/A"
      } M`;
      compradorComprimentoElem.textContent = `Comprimento do Lote: ${
        loteData.Comprimento || "N/A"
      } M`;
      compradorParcelasElem.textContent = `Número de Parcelas: ${
        loteData.parcelas || "N/A"
      }`;
      const pagamentos = loteData.pagamentos || [];

      historico.innerHTML = pagamentos.map((p) => `<li>${p}</li>`).join("");

      // Cálculo do valor restante
      const valorRestante = calcularValorRestante(loteData);
      valorRestanteElem.textContent = `Valor Restante: R$ ${valorRestante.toFixed(
        2
      )}`;

      if (valorRestante <= 0) {
        parcelaInput.disabled = true;
      }

      const parcelasRestantes = loteData.parcelas - pagamentos.length;
      compradorParcelasRestantesElem.textContent = `Parcelas Restantes: ${parcelasRestantes}`;
    } else {
      availabilityMessage.textContent = "Este lote está disponível.";
      loteForm.classList.remove("hidden");
      detailsSection.classList.add("hidden");
      paymentSection.classList.add("hidden");

      loteElement.classList.remove("occupied");
      loteElement.classList.add("available");
      deleteLoteButton.classList.add("hidden")
    }
  }

  // Função para adicionar um novo comprador ao lote
  async function saveLoteDetails() {
    const comprador = document.getElementById("comprador").value;
    const valor = document.getElementById("valor").value;
    const Comprimento = document.getElementById("Comprimento").value;
    const Largura = document.getElementById("Largura").value;
    const numParcelas = document.getElementById("parcelas").value;

    if (!comprador || !valor || !Comprimento || !numParcelas || !Largura) {
      alert("Por favor, preencha todos os detalhes do lote.");
      return;
    }

    if (loteAtual) {
      const loteRef = ref(database, `lotes/${loteAtual}`);
      const loteData = {
        comprador,
        valor,
        Comprimento,
        Largura,
        parcelas: numParcelas,
        pagamentos: [], // Inicializa com array vazio
      };

      try {
        await set(loteRef, loteData);
        alert("Comprador adicionado com sucesso!");
        loteForm.classList.add("hidden");
        detailsSection.classList.remove("hidden");
        paymentSection.classList.remove("hidden");
        updateLoteStatus(loteAtual); // Atualiza os detalhes
      } catch (error) {
        console.error("Erro ao salvar o lote:", error);
        alert("Erro ao salvar os detalhes do lote.");
      }
    } else {
      alert("Lote inválido.");
    }
  }

  // Função para adicionar um pagamento (parcela)
  async function addParcela(loteId) {
    const loteRef = ref(database, `lotes/${loteId}`);
  const snapshot = await get(loteRef);
  const loteData = snapshot.val();
  
  // Cálculo do valor restante
  const valorRestante = calcularValorRestante(loteData);
    // Cálculo do valor restante
    const parcelaValue = parcelaInput.value;
    const selectedPaymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    );

    if (!parcelaValue) {
      alert("Por favor, insira o valor da parcela.");
      return;
    }
    if (!selectedPaymentMethod) {
      alert("Por favor, insira um metodo de pagamento.");
      return;
    }
    if (parcelaValue > valorRestante) {
      alert(`O valor da parcela (R$ ${parcelaValue}) é maior que o valor restante (R$ ${valorRestante}).`);
      return; // Impede que a parcela seja adicionada
    }
 
    const selectedPayment = selectedPaymentMethod.value;
    const now = new Date();
    const pagamento = `R$ ${parcelaValue} - ${selectedPayment} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    if (loteAtual) {
      const pagamentosRef = ref(database, `lotes/${loteAtual}/pagamentos`);
      const snapshot = await get(pagamentosRef);
      const pagamentos = snapshot.val() || [];

      pagamentos.push(pagamento);
      if (confirm("Tem certeza de que deseja adicionar essa parcela?")) {
        try {
          await set(pagamentosRef, pagamentos);
          historico.innerHTML += `<li>${pagamento}</li>`;
          parcelaInput.value = "";
          const radio = document.querySelectorAll(
            'input[name="paymentMethod"]:checked'
          );
          radio.forEach((radio) => (radio.checked = false));
          gerarComprovantePagamento(
            parcelaValue,
            selectedPayment,
            comprador,
            pagamentos
          );
          alert("Parcela adicionada com sucesso!");
          updateLoteStatus(loteId);
          showFeedback("Parcela adicionada com sucesso!");
        } catch (error) {
          console.error("Erro ao adicionar parcela:", error);
          alert("Erro ao adicionar a parcela.");
        }
      }
    }
  }

  // Função para gerar o comprovante de pagamento em PDF com layout profissional e histórico de pagamentos anteriores
  async function gerarComprovantePagamento(
    parcelaValue,
    selectedPayment,
    comprador,
    pagamentos
  ) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const loteRef = ref(database, `lotes/${loteAtual}`);
    const snapshot = await get(loteRef);
    const loteData = snapshot.val();
    
    const imageBase64 = "data:image/jpeg;base64,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zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzDgCBCBADTzzzzzzzzzzzzzzzzzzzzziAAAAAAAAADDTzzzzzzzzzzzzzzzzygAAAAAAAAAAAAAADTzzzzzzzzzzzzzzgAAAAAAAAAAAAAAAABDzzzzzzzzzzzzAAAAAAAAAAAAAAAAAAADDzzzzzzzzzzSAAAAACQwwxgxzygAAAAABDzzzzzzzzwgAAAAABTzzyjzzygAAAAAADTzzzzzzyAAAAAAABDDTyjxjDAAAAAAAATzzzzzzwAAAAAAAAABTyjygAAAAAAAAABTzzzzzgAAAAAAAAABTyjygAAAAAAAAADDzzzzwAAAAAAAAAABTyDyQwwAAAAAAAATzzzzyAAAAAAAAAABTxjjzygAAAAAAAABTzzziAAAAAAAAAAAAAACABAAAAAAAAADTzzygAAAAAAAAAAAAAAAAAAAAAAAAAABTzzzgCQBQwwxgwzQzzQiSQwTySQxhQyjTzzyxzwDzwjSDhRQChTRxSgjxSDSDzyhzzzzzTgTTSBQDjBTChDTRTiDjwBQDTSDzzzzxTCCDABADDBACABDBDDCDABACDATzzzzzwAAAAAAAAAAAAAAAAAAAAAAAABzzzzzywAAAAAAAAwwAAAAAAQgAAAAAABTzzzzzzwAAAAAADABwSDCyxSgAAAAAAjzzzzzzzwwAAAAAAAAAAAAAAAAAAAAATzzzzzzzzzgAAAAAAAAAAAAAAAAAAAASTzzzzzzzzzywAAAAAAAAAAAAAAAAAAQTzzzzzzzzzzzygwAAAAAAAAAAAAAAADTzzzzzzzzzzzzzzwwgAAAAAAAAAAABDzzzzzzzzzzzzzzzzzzwQQAAAAAAAACzzzzzzzzzzzzzzzzzzzzzywwwQwxxyzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz/2gAMAwEAAgADAAAAEPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPMIMIEIMFNNPPPPPPPPPPPPPPPPPPPPIMAAAAAAAAAEJPPPPPPPPPPPPPPPPPNEAAAAAAAAAAAAAAHPPPPPPPPPPPPPPLIAAAAAAAAAAA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";  // Carregar a imagem como base64
    doc.addImage(imageBase64, "JPEG", 10, 10, 40, 20);

    // Informações da empresa à direita
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Loteamento Carvoeiro", 195, 15, { align: "right" });
    doc.setFontSize(10);
    doc.setFont("Helvetica", "normal");
    doc.text("www.loteamentocarvoeiro.com", 195, 22, { align: "right" });
    doc.text("(88) 9 9710-9959", 195, 28, { align: "right" });
    doc.text("loteamentocarvoeiro@gmail.com", 195, 34, { align: "right" });

    // Título centralizado do comprovante
    doc.setFontSize(20);
    doc.setFont("Helvetica", "bold");
    doc.text("Comprovante de Pagamento", 105, 50, { align: "center" });

    // Caixa ao redor do conteúdo principal
    doc.setLineWidth(0.5);
    doc.rect(10, 60, 190, 150); // Ajusta o tamanho da caixa conforme necessário

    // Informações do comprador e pagamento
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("Nome do Comprador:", 15, 75);
    doc.text("Lote:", 15, 85);
    doc.text("Valor da Parcela:", 15, 95);
    doc.text("Método de Pagamento:", 15, 105);
    doc.text("Data do Pagamento:", 15, 115);

    // Valores das informações
    doc.setFont("Helvetica", "normal");

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
    const dataPagamento =
      now.toLocaleDateString() + " " + now.toLocaleTimeString();
    fitText(dataPagamento, 60, 115, 130);

    // Histórico de pagamentos anteriores
    doc.setFont("Helvetica", "bold");
    doc.text("Histórico de Pagamentos:", 15, 135);
    doc.setFont("Helvetica", "normal");

    // Ajuste o layout para o histórico de pagamentos
    let yPos = 145;
    pagamentos.forEach((p) => {
      fitText(p, 20, yPos, 180);
      yPos += 10;
    });

    // Linha divisória antes do rodapé
    doc.line(10, yPos + 10, 200, yPos + 10);

    // Rodapé com agradecimento e informações adicionais
    doc.setFontSize(10);
    doc.setFont("Helvetica", "italic");
    fitText("Obrigado pela sua confiança!", 65, yPos + 20, 180);
    doc.setFont("Helvetica", "normal");
    fitText("Este é um comprovante oficial.", 65, yPos + 25, 180);
    fitText(
      "Todos os direitos reservados - Gerenciador de Lotes",
      65,
      yPos + 30,
      180
    );

    const baixar = window.confirm(
      `Você gostaria de baixar o comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf?`
    );
    
    const pdfBlob = new Blob([doc.output()], { type: 'application/pdf' });
    
    // Cria uma URL temporária para o Blob
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    // Cria o link e força o download
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`;
    
    // Adiciona atributos para ajudar na compatibilidade
    link.setAttribute('rel', 'noopener noreferrer');
    link.style.display = 'none';
    document.body.appendChild(link);
    
    if (baixar) {
      // Simula o clique para iniciar o download
      link.click();
    
      saveAs(pdfBlob, `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`);

      // Limpa o link após um curto intervalo
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(pdfUrl);
      }, 1000);
    } else {
      // No Safari, pode ser necessário usar a abordagem do saveAs
      if (window.navigator.msSaveOrOpenBlob) {
        // Para IE
        window.navigator.msSaveOrOpenBlob(pdfBlob, `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`);
      } else {
        // Para outros navegadores que suportam saveAs
        saveAs(pdfBlob, `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`);
      }
    }
  }

// Função para carregar a imagem como base64
async function loadImageAsBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

  // Função para deletar um lote
  async function deleteLote() {
    if (confirm("Tem certeza de que deseja remover este lote?")) {
      const loteRef = ref(database, `lotes/${loteAtual}`);
      await remove(loteRef);
      modal.style.display = "none";
      availabilityMessage.textContent = "";
      loteForm.classList.remove("hidden");
      detailsSection.classList.add("hidden");
      paymentSection.classList.add("hidden");
      alert("Lote removido com sucesso!");
    }
  }

  // Eventos de clique nos lotes
  document.querySelectorAll(".lote").forEach((lote) => {
    lote.addEventListener("click", (e) => {
      const loteId = e.target.dataset.lote;
      loteIdElem.textContent = loteId;
      loteAtual = loteId;
      updateLoteStatus(loteId);
      modal.style.display = "flex";
    });
  });

  // Evento para fechar o modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Evento para salvar um novo lote
  const saveButton = document.getElementById("save-button");
  saveButton.addEventListener("click", (e) => {
    e.preventDefault();
    saveLoteDetails();
  });

  // Evento para adicionar uma nova parcela
  const addParcelaButton = document.getElementById("add-parcela");
  addParcelaButton.addEventListener("click",  (e) => {
    e.preventDefault();
    addParcela(loteAtual); // Chama a função passando o ID do lote atual
  });
  // Evento para deletar um lote
  const deleteLoteButton = document.getElementById("delete-lote");
  deleteLoteButton.addEventListener("click", deleteLote);
});
