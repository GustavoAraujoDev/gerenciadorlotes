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
  const compradorComprimentoElem = document.getElementById(
    "comprador-Comprimento"
  );
  const compradorLarguraElem = document.getElementById("comprador-Largura");
  const compradorParcelasElem = document.getElementById("comprador-parcelas");
  const compradorParcelasRestantesElem = document.getElementById(
    "comprador-parcelasrestantes"
  );
  const valorRestanteElem = document.getElementById("valor-restante"); // Novo campo para valor restante
  const historico = document.getElementById("historico");
  const agrupamentomessage = document.getElementById("agrupamento-message");
  const parcelaInput = document.getElementById("parcela");
  const toggleSelectionButton = document.getElementById("toggle-divisao");

  let loteAtual = null;
  let isSelecting = false;
  let selectedLote = null;

  toggleSelectionButton.addEventListener("click", () => {
    if (!isSelecting) {
      ativarSelecao();
    } else {
      dividirLote();
    }
  });

  function ativarSelecao() {
    isSelecting = true;
    toggleSelectionButton.textContent = "Dividir";

    // Adiciona evento para clicar nas divs e selecionar
    document.querySelectorAll(".lote").forEach((lote) => {
      lote.addEventListener("click", selecionarLotedivisao);
    });
  }

  function selecionarLotedivisao(event) {
    if (selectedLote) {
      // Se já houver uma div selecionada, remove a classe de seleção
      selectedLote.classList.remove("lote-selecionado");
    }
    selectedLote = event.target;
    estilizarLoteSelecionado(selectedLote, true);
  }

  function estilizarLoteSelecionado(lotediv, status) {
    if (!lotediv) {
      toastr.error("lote invalido");
      return;
    }
    switch (status) {
      case true:
        lotediv.style.backgroundColor = "#a1d6ff"; // Cor de fundo para indicar seleção
        lotediv.style.border = "2px solid green"; // Adiciona uma borda
        lotediv.style.color = "black"; // Cor do texto
        break;
      case false:
        lotediv.style.backgroundColor = "#fff"; // Cor original do lotediv
        lotediv.style.border = "none"; // Remove a borda
        lotediv.style.color = "black"; // Cor original do texto
        break;
      case "agrupado":
        lotediv.style.backgroundColor = "#ffcc99"; // Cor original do lotediv
        lotediv.style.border = "none"; // Remove a borda
        lotediv.style.color = "black"; // Cor original do texto
      default:
        break;
    }
  }

  function dividirLote() {
    if (selectedLote) {
      // Criar duas novas divs para substituir a div selecionada
      const newLote1 = document.createElement("div");
      newLote1.classList.add("lote");
      newLote1.textContent = `${loteAtual} A`;

      const newLote2 = document.createElement("div");
      newLote2.classList.add("lote");
      newLote2.textContent = `${loteAtual} B`;

      // Substituir a div original pelas duas novas
      selectedLote.appendChild(newLote1);
      selectedLote.appendChild(newLote2);
      // Limpar a seleção
      selectedLote = null;
      isSelecting = false;
      toggleSelectionButton.textContent = "Ativar Divisão";
    }
  }

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
    // Elemento onde as mensagens serão exibidas
    const overlay = document.getElementById("checkfund");
    const content = document.getElementById("check");

    overlay.style.display = "flex"; // Exibe o indicador de loading
    content.style.display = "block"; // Exibe o indicador de loading

    for (let i = 1; i <= 48; i++) {
      // Referência ao lote no banco de dados
      const loteRef = ref(database, `lotes/${i}`);
      const snapshot = await get(loteRef);
      const loteData = snapshot.val();
      const loteElement = document.querySelector(`[data-lote="${i}"]`);

      if (!loteElement) {
        toastr.warning(`Elemento do lote ${i} não encontrado. `);
        return;
      }

      if (loteData && loteElement.hasAttribute("data-agrupamento")) {
        loteElement.classList.add("agrupadoocupado");
      }
      if (loteData && !loteElement.hasAttribute("data-agrupamento")) {
        loteElement.classList.add("semagrupamentoocupado");
      }
      if (!loteData && !loteElement.hasAttribute("data-agrupamento")) {
        loteElement.classList.add("semagrupamentolivre");
      }
      if (!loteData && loteElement.hasAttribute("data-agrupamento")) {
        loteElement.classList.add("agrupadolivre");
      }
    }

    overlay.style.display = "none";
    content.style.display = "none";
  }

  function checkAgrupStatus(loteAtual) {
    agrupamentomessage.textContent = "Lote não faz parte de nenhum agrupamento"; // Mensagem padrão
    let fund = false;
    const loteElement = document.querySelector(`[data-lote="${loteAtual}"]`);
    const agrupamentoId = loteElement.getAttribute("data-agrupamento");

    // Verifica se o lote atual faz parte de um agrupamento
    if (agrupamentoId) {
      agrupamentomessage.textContent = `O lote ${loteAtual} faz parte do agrupamento ${agrupamentoId}`;
      fund = true;
    }
  }
  // Chama a função para checar o status dos lotes ao carregar a página
  await carregarAgrupamentos();
  await checkLotesStatus();
  limparCampos();
  // Função para abrir o modal de um lote e verificar o status
  async function updateLoteStatus(loteId) {
    const loteRef = ref(database, `lotes/${loteId}`);
    const snapshot = await get(loteRef);
    const loteData = snapshot.val();
    const loteElement = document.querySelector(`[data-lote="${loteId}"]`);
    if (loteData && loteElement.hasAttribute("data-agrupamento")) {
      deleteagrupamentoButton.classList.remove("hidden");
      deleteLoteButton.classList.add("hidden");
    }
    if (loteData && !loteElement.hasAttribute("data-agrupamento")) {
      deleteagrupamentoButton.classList.add("hidden");
      deleteLoteButton.classList.remove("hidden");
    }
    if (!loteData && !loteElement.hasAttribute("data-agrupamento")) {
      deleteagrupamentoButton.classList.add("hidden");
      deleteLoteButton.classList.add("hidden");
    }
    if (!loteData && loteElement.hasAttribute("data-agrupamento")) {
      deleteagrupamentoButton.classList.remove("hidden");
      deleteLoteButton.classList.add("hidden");
    }
    if (loteData) {
      availabilityMessage.textContent = "Este lote já está ocupado.";
      loteForm.classList.add("hidden");
      detailsSection.classList.remove("hidden");
      paymentSection.classList.remove("hidden");

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
    }
  }
  // Função para adicionar um novo comprador ao lote
  async function saveLoteDetailsfull(loteid) {
    const agrupamentosRef = ref(database, "agrupamentos");
    const agrupamentosSnapshot = await get(agrupamentosRef);

    if (agrupamentosSnapshot.exists()) {
      const agrupamentos = agrupamentosSnapshot.val();
      for (const agrupamentoId of Object.keys(agrupamentos)) {
        const agrupamentoData = agrupamentos[agrupamentoId];
        if (agrupamentoData.lotes.includes(loteid)) {
          await Promise.all(
            agrupamentoData.lotes.map(async (id) => {
              await saveLoteDetails(id, true);
            })
          );
          return;
        } else {
          await saveLoteDetails(loteid, false);
        }
      }
    }
  }

  async function saveLoteDetails(lote, isPartOfGrouping) {
    const comprador = document.getElementById("comprador").value;
    const valor = document.getElementById("valor").value;
    const Comprimento = document.getElementById("Comprimento").value;
    const Largura = document.getElementById("Largura").value;
    const numParcelas = document.getElementById("parcelas").value;

    if (!comprador || !valor || !Comprimento || !numParcelas || !Largura) {
      toastr.error("Por favor, preencha todos os detalhes do lote.", "error");
      return;
    }
    if (isPartOfGrouping) {
      const loteRef = ref(database, `lotes/${lote}`);
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
        toastr.success("Comprador adicionado com sucesso!", "sucesso");
        loteForm.classList.add("hidden");
        detailsSection.classList.remove("hidden");
        paymentSection.classList.remove("hidden");
        updateLoteStatus(lote); // Atualiza os detalhes
      } catch (error) {
        toastr.error("Erro ao salvar os detalhes do lote.", "error");
      }
    } else {
      const result = await Swal.fire({
        title: "Adiciocar Comprador ?",
        text: "Deseja Adiciocar Comprador a esse Lote?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2bff00",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, Remover!",
        cancelButtonText: "Cancelar",
        background: "#2f2f2f",
        color: "#fff",
      });
      if (result.isConfirmed) {
        const loteRef = ref(database, `lotes/${lote}`);
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
          toastr.success("Comprador adicionado com sucesso!", "sucesso");
          loteForm.classList.add("hidden");
          detailsSection.classList.remove("hidden");
          paymentSection.classList.remove("hidden");
          updateLoteStatus(lote); // Atualiza os detalhes
        } catch (error) {
          toastr.error("Erro ao salvar os detalhes do lote.", "error");
        }
      }
    }
  }

  async function addParcelafull(lote) {
    const agrupamentosRef = ref(database, "agrupamentos");
    const agrupamentosSnapshot = await get(agrupamentosRef);

    if (agrupamentosSnapshot.exists()) {
      const agrupamentos = agrupamentosSnapshot.val();

      // Usando for...of para iterar sobre as chaves dos agrupamentos
      for (const agrupamentoId of Object.keys(agrupamentos)) {
        const agrupamentoData = agrupamentos[agrupamentoId];

        if (agrupamentoData.lotes.includes(lote)) {
          const result = await Swal.fire({
            title: "Adicionar parcela?",
            text: "Deseja adicionar a parcela para este lote?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2bff00",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, adicionar!",
            cancelButtonText: "Cancelar",
            background: "#2f2f2f",
            color: "#fff",
          });

          if (result.isConfirmed) {
            try {
              await Promise.all(
                agrupamentoData.lotes.map(async (id) => {
                  await addParcelasave(id);
                })
              );
            } catch (error) {
              toastr.error(error);
            }
            return; // Certifique-se de sair da função após adicionar as parcelas
          }
        } else {
          // Se o lote não estiver no agrupamento
          const result = await Swal.fire({
            title: "Adicionar parcela?",
            text: "Deseja adicionar a parcela para este lote?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2bff00",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, adicionar!",
            cancelButtonText: "Cancelar",
            background: "#2f2f2f",
            color: "#fff",
          });

          if (result.isConfirmed) {
            await addParcelasave(lote);
            return; // Certifique-se de sair da função após adicionar a parcela
          }
        }
      }
    }
  }
  // Função para adicionar um pagamento (parcela)
  async function addParcelasave(loteId) {
    const loteRef = ref(database, `lotes/${loteId}`);
    const snapshot = await get(loteRef);
    const loteData = snapshot.val();
    const selectedPaymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    );
    let gerarcomprovantecheck = false;

    const parcelavalue = parcelaInput.value;

    // Cálculo do valor restante
    const valorRestante = calcularValorRestante(loteData);
    // Cálculo do valor restante

    if (!parcelavalue) {
      toastr.error("Por favor, insira o valor da parcela.");
      return;
    }

    if (parcelavalue > valorRestante) {
      toastr.warning(
        `O valor da parcela (R$ ${parcelavalue}) é maior que o valor restante (R$ ${valorRestante}).`,
        "Aviso"
      );
      return; // Impede que a parcela seja adicionada
    }
    if (!selectedPaymentMethod) {
      toastr.error("Por favor, insira um metodo de pagamento.");
      return;
    }
    const selectedPayment = selectedPaymentMethod.value;
    console.log(selectedPayment);

    const now = new Date();
    const pagamento = `R$ ${parcelavalue} - ${selectedPayment} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;

    if (loteAtual) {
      const pagamentosRef = ref(database, `lotes/${loteId}/pagamentos`);
      const snapshot = await get(pagamentosRef);
      const pagamentos = snapshot.val() || [];

      pagamentos.push(pagamento);

      try {
        await set(pagamentosRef, pagamentos);
        historico.innerHTML += `<li>${pagamento}</li>`;
        if (!gerarcomprovantecheck) {
          gerarComprovantePagamento(parcelavalue, selectedPayment, pagamentos);
          gerarcomprovantecheck = true;
        }

        toastr.success("Parcela adicionada com sucesso!");
        updateLoteStatus(loteId);
      } catch (error) {
        toastr.error("Erro ao adicionar a parcela.", error);
      }
    }
  }

  async function gerarComprovantePagamento(
    parcelaValue,
    selectedPayment,
    pagamentos
  ) {
    const { jsPDF } = window.jspdf;

    const loteRef = ref(database, `lotes/${loteAtual}`);
    const snapshot = await get(loteRef);
    const loteData = snapshot.val();

    // Obtenha o elemento da imagem
    const img = document.getElementById("logo");
    const url = new URL(img.src, window.location.origin).href;
    const image = new Image();
    image.src = url;

    // Certifique-se de que a imagem esteja totalmente carregada
    image.crossOrigin = "Anonymous"; // Para evitar problemas de CORS

    image.onload = async function () {
      // Cria um canvas para desenhar a imagem
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Defina as dimensões do canvas conforme a imagem
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;

      // Desenha a imagem no canvas
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      // Converte o canvas em uma URL de dados base64
      const base64Image = canvas.toDataURL("image/jpeg");

      // Cria o documento jsPDF
      const doc = new jsPDF();

      // Configuração do documento
      const pageHeight = 297; // Altura de uma página A4 em mm
      const marginTop = 20;
      const marginBottom = 10;
      let currentY = marginTop; // Posição Y inicial

      // Função para adicionar nova página se necessário
      function checkPageSpace(neededSpace) {
        if (currentY + neededSpace > pageHeight - marginBottom) {
          doc.addPage(); // Adiciona nova página
          currentY = marginTop; // Reseta Y para o topo da nova página
        }
      }

      // Caixa ao redor do conteúdo principal
      function drawContentBox(height) {
        doc.setLineWidth(0.5);
        doc.rect(10, 60, 190, height); // Caixa ajustada conforme necessário
      }

      // Função para ajuste de texto com limite de largura e controle de nova página
      function fitText(text, x, y, maxWidth, lineHeight) {
        const fontSize = 12;
        let adjustedFontSize = fontSize;

        // Reduzir tamanho da fonte até caber na largura máxima
        while (doc.getTextWidth(text) > maxWidth && adjustedFontSize > 6) {
          adjustedFontSize -= 0.5;
          doc.setFontSize(adjustedFontSize);
        }

        // Verificar se há espaço suficiente, senão criar nova página
        checkPageSpace(lineHeight);

        // Inserir o texto na posição atual
        doc.text(text, x, y);

        // Restaurar tamanho original da fonte
        doc.setFontSize(fontSize);
        currentY += lineHeight; // Atualizar Y atual
      }

      // Adiciona a imagem base64 ao PDF
      doc.addImage(base64Image, "JPEG", 10, 5, 40, 40);

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
      doc.text("Comprovante de Pagamento", 105, 55, { align: "center" });

      // Caixa ao redor do conteúdo principal
      doc.setLineWidth(0.3);
      doc.rect(10, 60, 190, 50);

      // Cabeçalhos de informações do comprador e pagamento
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(12);
      fitText("Nome do Comprador:", 15, 65, 130, 10);
      fitText("Lote:", 15, 75, 130, 10);
      fitText("Valor da Parcela:", 15, 85, 130, 10);
      fitText("Método de Pagamento:", 15, 95, 130, 10);
      fitText("Data do Pagamento:", 15, 105, 130, 10);

      // Inserir valores dinâmicos das informações
      doc.setFont("Helvetica", "normal");
      fitText(loteData.comprador, 60, 65, 130, 10);
      fitText(loteAtual, 60, 75, 130, 10);
      fitText(`R$ ${parcelaValue}`, 60, 85, 130, 10);
      fitText(`${selectedPayment}`, 63, 95, 130, 10);

      // Data e hora atuais
      const now = new Date();
      const dataPagamento =
        now.toLocaleDateString() + " " + now.toLocaleTimeString();
      fitText(dataPagamento, 60, 105, 130, 10);

      // Histórico de pagamentos anteriores
      doc.setFont("Helvetica", "bold");
      fitText("Histórico de Pagamentos:", 15, 120, 180, 10);
      doc.setFont("Helvetica", "normal");

      // Layout dinâmico para o histórico de pagamentos
      pagamentos.forEach((p) => {
        fitText(p, 20, currentY, 180, 10); // Verifica e ajusta para nova página se necessário
      });

      // Linha divisória antes do rodapé
      checkPageSpace(20); // Verificar espaço para a linha e o rodapé
      doc.line(10, currentY + 10, 200, currentY + 10);
      currentY += 20; // Mover a posição Y após a linha

      // Rodapé
      doc.setFontSize(10);
      doc.setFont("Helvetica", "italic");
      fitText("Obrigado pela sua confiança!", 65, currentY, 180, 10);
      doc.setFont("Helvetica", "normal");
      fitText("Este é um comprovante oficial.", 65, currentY, 180, 10);
      fitText(
        "Todos os direitos reservados - Gerenciador de Lotes",
        65,
        currentY,
        180,
        10
      );
      const result = await Swal.fire({
        title: "Baixar Comprovante?",
        text: `Você gostaria de baixar o comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2bff00",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, Baixar!",
        cancelButtonText: "Cancelar",
        background: "#2f2f2f",
        color: "#fff",
      });
      if (result.isConfirmed) {
        // Salvando o PDF com um nome significativo
        doc.save(
          `Comprovante_${loteData.comprador}_${loteAtual}_(${dataPagamento}).pdf`
        );
      }
    };

    // Caso a imagem já esteja pré-carregada (cache), dispare o evento onload manualmente
    if (image.complete) {
      image.onload();
    }
  }

  // Função para deletar um lote
  async function deleteLote(deleteid, isPartOfGrouping) {
    // Se o lote faz parte de um agrupamento, deletar sem confirmação
    if (isPartOfGrouping) {
      try {
        const loteRef = ref(database, `lotes/${deleteid}`);
        await remove(loteRef);
        modal.style.display = "none";
        availabilityMessage.textContent = "";
        loteForm.classList.remove("hidden");
        detailsSection.classList.add("hidden");
        paymentSection.classList.add("hidden");
        toastr.success("Lote removido com sucesso!");
      } catch (error) {
        toastr.error(`Erro ao remover lote ${deleteid}.`, error);
        throw error;
      }
    } else {
      const result = await Swal.fire({
        title: "Remover Lotes?",
        text: "Deseja Remover este lote?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#2bff00",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, Remover!",
        cancelButtonText: "Cancelar",
        background: "#2f2f2f",
        color: "#fff",
      });
      if (result.isConfirmed) {
        const loteRef = ref(database, `lotes/${deleteid}`);
        await remove(loteRef);
        modal.style.display = "none";
        availabilityMessage.textContent = "";
        loteForm.classList.remove("hidden");
        detailsSection.classList.add("hidden");
        paymentSection.classList.add("hidden");
        toastr.success("Lote removido com sucesso!");
      }
    }
  }

  async function deleteagrupamento(lote) {
    const agrupamentosRef = ref(database, "agrupamentos");
    const agrupamentosSnapshot = await get(agrupamentosRef);

    if (agrupamentosSnapshot.exists()) {
      const agrupamentos = agrupamentosSnapshot.val();

      // Usando for...of para iterar sobre as chaves dos agrupamentos
      for (const agrupamentoId of Object.keys(agrupamentos)) {
        const agrupamentoData = agrupamentos[agrupamentoId];

        if (agrupamentoData.lotes.includes(lote)) {
          const result = await Swal.fire({
            title: "Remover Agrupamento?",
            text: "Deseja Remover o Agrupamento Deste Lote?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#2bff00",
            cancelButtonColor: "#d33",
            confirmButtonText: "Sim, Remover!",
            cancelButtonText: "Cancelar",
            background: "#2f2f2f",
            color: "#fff",
          });

          if (result.isConfirmed) {
            try {
              await Promise.all(
                agrupamentoData.lotes.map(async (id) => {
                  await deleteLote(id, true);
                  console.log(`deltete lote ${id}`);
                  console.log(deleteLote(id));
                })
              );
              const loteRef = ref(database, `agrupamentos/${agrupamentoId}`);
              await remove(loteRef);
              console.log(`agrup delete ${agrupamentoId}`);
            } catch (error) {
              toastr.error(error);
            }
            return; // Certifique-se de sair da função após adicionar as parcelas
          }
        } else {
          toastr.error(`esse lote nao faz parte de um agrupamento `);
        }
      }
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
      checkAgrupStatus(loteAtual);
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
    saveLoteDetailsfull(loteAtual);
  });

  // Evento para adicionar uma nova parcela
  const addParcelaButton = document.getElementById("add-parcela");
  addParcelaButton.addEventListener("click", (e) => {
    e.preventDefault();
    addParcelafull(loteAtual); // Chama a função passando o ID do lote atual
  });
  // Evento para deletar um lote
  const deleteLoteButton = document.getElementById("delete-lote");
  deleteLoteButton.addEventListener("click", (e) => {
    e.preventDefault();
    deleteLote(loteAtual, false);
  });

  // Evento para deletar um lote
  const deleteagrupamentoButton = document.getElementById("delete-agrupamento");
  deleteagrupamentoButton.addEventListener("click", (e) => {
    e.preventDefault();
    deleteagrupamento(loteAtual);
  });

  let isAgrupamentoAtivado = false;
  let lotesSelecionados = [];
  let agrupamentos = {}; // Para armazenar agrupamentos de lotes

  const toggleAgrupamentoBtn = document.getElementById("toggle-agrupamento");

  toggleAgrupamentoBtn.addEventListener("click", function () {
    if (!isAgrupamentoAtivado) {
      ativarAgrupamento();
    } else {
      confirmarDesativacaoAgrupamento();
    }
  });

  function ativarAgrupamento() {
    isAgrupamentoAtivado = true;
    toggleAgrupamentoBtn.textContent = "Desativar Agrupamento";
    lotesSelecionados = [];
    document.querySelectorAll(".lote").forEach((lote) => {
      lote.addEventListener("click", selecionarLote);
    });
  }

  async function desativarAgrupamento() {
    isAgrupamentoAtivado = false;
    toggleAgrupamentoBtn.textContent = "Ativar Agrupamento";
    document.querySelectorAll(".lote").forEach((lote) => {
      lote.removeEventListener("click", selecionarLote);
    });
    salvarAgrupamento();
    checkLotesStatus();
  }

  function selecionarLote(event) {
    const lote = event.target;
    const loteId = lote.getAttribute("data-lote");
    const agrupamentoId = lote.getAttribute("data-agrupamento");

    // Verifica se o lote já faz parte de um agrupamento
    if (agrupamentoId) {
      toastr.warning(
        `O lote ${loteId} já faz parte do agrupamento ${agrupamentoId}. Não pode ser selecionado.`,
        "Aviso"
      );
      estilizarLoteSelecionado(lote, "agrupado");
      return; // Impede a seleção do lote
    }

    // Verifica se o lote já está selecionado
    if (lotesSelecionados.includes(loteId)) {
      // Se já estiver selecionado, remove da lista e remove a classe de cor
      lotesSelecionados = lotesSelecionados.filter((id) => id !== loteId);
      estilizarLoteSelecionado(lote, false);
    } else {
      // Se não estiver selecionado, adiciona à lista e aplica a classe de cor
      lotesSelecionados.push(loteId);
      estilizarLoteSelecionado(lote, true);
    }
  }
  async function confirmarDesativacaoAgrupamento() {
    const result = await Swal.fire({
      title: "Salvar Agrupamento?",
      text: "Tem certeza que deseja desativar o agrupamento e salvar os lotes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2bff00",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, Salvar!",
      cancelButtonText: "Cancelar",
      background: "#2f2f2f",
      color: "#fff",
    });
    if (result.isConfirmed) {
      desativarAgrupamento();
    }
  }

  async function salvarAgrupamento() {
    if (lotesSelecionados.length > 0) {
      const agrupamentoId = lotesSelecionados; // ID único para o agrupamento
      const agrupamentoData = { lotes: lotesSelecionados };

      // Referência ao banco de dados para salvar o agrupamento
      const agrupamentoRef = ref(database, `agrupamentos/${agrupamentoId}`);

      try {
        // Salva os lotes selecionados no agrupamento no Firebase
        await set(agrupamentoRef, agrupamentoData);

        lotesSelecionados.forEach((loteId) => {
          const lote = document.querySelector(`[data-lote="${loteId}"]`);
          lote.setAttribute("data-agrupamento", agrupamentoId);
          availabilityMessage.textContent = `Agrupamento ${agrupamentoId}`;
          lote.classList.remove("selecionado");
        });
      } catch (error) {
        console.error("Erro ao salvar agrupamento no Firebase:", error);
        toastr.error("Erro ao salvar agrupamento.", "Error");
      }
    } else {
      toastr.error("Nenhum lote foi selecionado para agrupamento.", "Error");
    }
  }

  async function carregarAgrupamentos() {
    const agrupamentosRef = ref(database, "agrupamentos");

    try {
      const agrupamentosSnapshot = await get(agrupamentosRef);
      if (agrupamentosSnapshot.exists()) {
        const agrupamentos = agrupamentosSnapshot.val();

        // Limpa a mensagem antes de adicionar novas informações
        agrupamentomessage.textContent = "";

        // Para cada agrupamento, atribui o data-agrupamento aos lotes correspondentes
        Object.keys(agrupamentos).forEach((agrupamentoId) => {
          const agrupamentoData = agrupamentos[agrupamentoId];

          // Atribui o agrupamentoId a cada lote no agrupamento
          agrupamentoData.lotes.forEach((loteId) => {
            const loteElement = document.querySelector(
              `[data-lote="${loteId}"]`
            );

            // Apenas adiciona a mensagem se o lote existir na página
            if (loteElement) {
              loteElement.setAttribute("data-agrupamento", agrupamentoId);
            }
          });
        });
      }
    } catch (error) {
      console.error("Erro ao carregar agrupamentos:", error);
    }
  }

  function limparCampos() {
    parcelaInput.value = "";
    const radio = document.querySelectorAll(
      'input[name="paymentMethod"]:checked'
    );
    radio.forEach((radio) => (radio.checked = false));
    document.getElementById("comprador").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("Comprimento").value = "";
    document.getElementById("Largura").value = "";
    document.getElementById("parcelas").value = "";
  }
});
