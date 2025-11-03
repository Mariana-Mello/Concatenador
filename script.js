// === Funções utilitárias ===

//==TOGGLE==//
document.addEventListener('DOMContentLoaded', () => {
  inicializarSwitchesTexto();
});

// === Função auxiliar para ocultar todas as áreas de preview ===
function limparPreviews() {
  document.getElementById('previewFiltrado').style.display = 'none';
  document.getElementById('previewInvalid').style.display = 'none';
}

// Formata CPF para xxx.xxx.xxx-xx
function formatarCPF(cpf) {
  cpf = String(cpf).replace(/\D/g, '');
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf; // se incompleto, retorna como está
}

// Converte número serial do Excel para objeto Date (UTC)
function excelDateToJSDate(serial) {
  const utc_days = serial - 25569;
  const ms = utc_days * 86400 * 1000;
  return new Date(ms);
}

// === FUNÇÃO FORMATAR DATA ROBUSTA ===
function formatarData(data) {
  const seletor = document.querySelector('#formatoData');
  let formatoSelecionado = seletor?.value?.toLowerCase() || 'yyyy-mm-dd';

  data = String(data).trim();
  let dateObj = null;

  // 1️⃣ Número → possível data Excel
  if (!isNaN(data) && data !== '') {
    dateObj = excelDateToJSDate(Number(data));
  }
  // 2️⃣ dd/mm/yyyy, dd/mm/yy, dd-mm-yyyy, dd-mm-yy
  else if (/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/.test(data)) {
    const [dia, mes, ano] = data.split(/\/|-/);
    let anoNum = Number(ano);
    if (anoNum < 100) anoNum += anoNum >= 50 ? 1900 : 2000;
    dateObj = new Date(Date.UTC(anoNum, Number(mes) - 1, Number(dia)));
  }
  // 3️⃣ yyyy-mm-dd ou yyyy/mm/dd
  else if (/^\d{4}[\/\-]\d{2}[\/\-]\d{2}$/.test(data)) {
    const [ano, mes, dia] = data.split(/\/|-/);
    dateObj = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  }

  if (!dateObj || isNaN(dateObj.getTime())) return data;

  // 4️⃣ Extrai componentes de forma consistente (UTC)
  let ano = dateObj.getUTCFullYear();
  let mes = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  let dia = String(dateObj.getUTCDate()).padStart(2, '0');
  let hora = String(dateObj.getUTCHours()).padStart(2, '0');
  let min = String(dateObj.getUTCMinutes()).padStart(2, '0');
  let seg = String(dateObj.getUTCSeconds()).padStart(2, '0');

  // 5️⃣ Hora manual (se ativada)
  const toggleHoraManual = document.getElementById('horaManualToggle');
  if (toggleHoraManual && toggleHoraManual.checked) {
    const h = document.getElementById('hora')?.value;
    const m = document.getElementById('minuto')?.value;
    const s = document.getElementById('segundo')?.value;
    if (h !== '') hora = String(h).padStart(2, '0');
    if (m !== '') min = String(m).padStart(2, '0');
    if (s !== '') seg = String(s).padStart(2, '0');
  }

  // 6️⃣ Formatação final
switch (formatoSelecionado) {
  case 'yyyy-mm-dd hh:mm:ss':
    return `${ano}-${mes}-${dia} ${hora}:${min}:${seg}`;
  case 'yyyy-mm-ddthh:mm:ssz':
    return `${ano}-${mes}-${dia}T${hora}:${min}:${seg}Z`;
  case 'dd/mm/yyyy':
    return `${dia}/${mes}/${ano}`;
  case 'dd-mm-yyyy':
    return `${dia}-${mes}-${ano}`;
  default:
    return `${ano}-${mes}-${dia}`;
}
}

// === Controle de exibição dos campos de hora ===
document.addEventListener('DOMContentLoaded', () => {
  const seletorFormato = document.getElementById('formatoData');
  const horaConfigDiv = document.getElementById('horaConfig');
  const toggleHoraManual = document.getElementById('horaManualToggle');
  const inputsHora = document.querySelectorAll('#horaInputs input');

  // Mostrar/esconder div conforme formato de data selecionado
  if (seletorFormato) {
    seletorFormato.addEventListener('change', () => {
      const formato = seletorFormato.value.toLowerCase();
      const precisaHora = ['yyyy-mm-dd hh:mm:ss', 'yyyy-mm-ddthh:mm:ssz'].includes(formato);
      horaConfigDiv.style.display = precisaHora ? 'block' : 'none';
    });
  }

  // Habilitar/desabilitar inputs de hora conforme checkbox
  if (toggleHoraManual) {
    toggleHoraManual.addEventListener('change', () => {
      const ativo = toggleHoraManual.checked;
      inputsHora.forEach(inp => inp.disabled = !ativo);
    });
  }
});

// === Leitura de arquivo ===
document.getElementById('fileInput').addEventListener('change', function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  // 👉 Função auxiliar: detecta colunas que têm dados
  function detectarColunasComDados(dados) {
    if (!dados || dados.length === 0) return [];

    const totalColunas = Math.max(...dados.map(l => l.length));
    const colunasComDados = [];

    for (let j = 0; j < totalColunas; j++) {
      const temValor = dados.some(linha => {
        const valor = linha[j];
        return valor !== undefined && valor !== null && String(valor).trim() !== '';
      });

      if (temValor) {
        const colunaNome = String.fromCharCode(65 + j); // A, B, C...
        colunasComDados.push(`{${colunaNome}}`);
      }
    }

    return colunasComDados;
  }

  // 👉 Atualiza visualmente as colunas detectadas
  function atualizarColunasDetectadas(dados) {
    const colunasDiv = document.getElementById('colunas');
    const colunasList = document.getElementById('colunasList');
    
    const colunas = detectarColunasComDados(dados);
    if (colunas.length > 0) {
      colunasList.innerHTML = colunas.map(c => `<span style="margin-right:5px;">${c}</span>`).join('');
      colunasDiv.style.display = 'block';
    } else {
      colunasDiv.style.display = 'none';
    }
  }

  // === Processa CSV ===
  if (file.name.endsWith('.csv')) {
    reader.onload = function (e) {
      const linhas = e.target.result.split(/\r?\n/).filter(l => l.trim() !== '');
      window.dadosPlanilha = linhas.map(l => l.split(/;|,|\t/));
      alert('✅ Arquivo CSV carregado com sucesso!');
      atualizarColunasDetectadas(window.dadosPlanilha);
    };
    reader.readAsText(file, 'utf-8');

  // === Processa XLSX ou ODS ===
  } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.ods')) {
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const primeiraAba = workbook.SheetNames[0];
      const sheet = workbook.Sheets[primeiraAba];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      window.dadosPlanilha = json.filter(linha => linha.some(c => c !== null && c !== ''));
      alert('✅ Arquivo carregado com sucesso!');
      atualizarColunasDetectadas(window.dadosPlanilha);
    };
    reader.readAsArrayBuffer(file);

  } else {
    alert('⚠️ Formato não suportado. Use .csv, .xlsx ou .ods');
  }
});


// === Inicialização: botão de filtrar começa desabilitado ===
const btnFiltrar = document.getElementById('filtrarBtn');
if (btnFiltrar) {
  btnFiltrar.disabled = true; // desativa inicialmente
}

// === Geração da pré-visualização (versão corrigida) ===
document.getElementById('gerarBtn').addEventListener('click', function () {
    limparPreviews(); // 👈 limpa tudo antes de gerar nova visualização
  const template = document.getElementById('template').value;
  const preview = document.getElementById('preview');
  const dados = window.dadosPlanilha || [];

  if (dados.length === 0) {
    preview.textContent = '⚠️ Nenhum dado carregado. Selecione um arquivo primeiro.';
    alert('⚠️ Nenhum dado carregado. Selecione um arquivo primeiro.');
    return;
  }

  let saida = '';

  dados.forEach((linha, i) => {
    let linhaFormatada = template;
    let linhaIncompleta = false;

    // Substitui placeholders para colunas presentes na linha
    linha.forEach((valorRaw, j) => {
      let valor = (valorRaw === undefined || valorRaw === null) ? '' : String(valorRaw).trim();
      const coluna = String.fromCharCode(65 + j); // A, B, C...

      // Regex para detectar placeholder {A} ou {A(TYPE)}
      const regex = new RegExp(`\\{${coluna}(?:\\(([^)]+)\\))?\\}`, 'g');

      linhaFormatada = linhaFormatada.replaceAll(regex, (_, tipo) => {
        tipo = tipo ? tipo.toUpperCase() : 'TEXTO';

        // Se campo vazio → devolve 'null' e marca como incompleto
        if (valor === '') {
          linhaIncompleta = true;
          return `'null' /* ⚠️ Campo vazio */`;
        }

        // Campo preenchido — aplica validações por tipo
        switch (tipo) {
          case 'CPF': {
            const apenasNums = valor.replace(/\D/g, '');
            if (apenasNums.length === 11) return formatarCPF(valor);
            linhaIncompleta = true;
            return `{${coluna} ← ⚠️ CPF incompleto}`;
          }
          case 'DATA': {
            if (valor === '') {
                linhaIncompleta = true;
                return `{${coluna} ← ⚠️ Campo vazio}`;
            }

  const df = formatarData(valor);

  // Valida qualquer formato de data entre os suportados
  const formatosValidos = [
    /^\d{4}-\d{2}-\d{2}$/,                     // YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:MM:SS
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,  // YYYY-MM-DDTHH:MM:SSZ
    /^\d{2}\/\d{2}\/\d{4}$/,                   // dd/MM/yyyy
    /^\d{2}-\d{2}-\d{4}$/                      // dd-MM-yyyy
  ];

  if (formatosValidos.some(r => r.test(df))) {
    return df;
  } else {
    linhaIncompleta = true;
    return `{${coluna} ← ⚠️ Data inválida}`;
  }
}

         case 'TEXTO': {
      // 👉 Aplica a conversão de texto aqui
      const txt = aplicarFormatacaoTexto(valor);
      return `'${txt}'`;
    }

    default:
      return `'${valor}'`;
  }
});
    });

    // Segunda passagem: substitui quaisquer placeholders que sobraram
    // (por exemplo {F(DATA)} quando a linha não tinha coluna F)
    linhaFormatada = linhaFormatada.replace(/\{([A-Z])(?:\(([^\)]*)\))?\}/g, (match, colLetra, tipo) => {
      // Se chegamos aqui, não havia valor para essa coluna na linha
      linhaIncompleta = true;

      // Se tinha tipo CPF ou DATA podemos mostrar aviso específico,
      // mas como está vazio, mostramos 'null' e comentário de campo vazio.
      return `'null' /* ⚠️ Campo vazio */`;
    });

    // Marca a linha se algo ficou incompleto
    if (linhaIncompleta) {
      linhaFormatada += `  ← ⚠️ Linha incompleta (linha ${i + 1})`;
    }

    saida += linhaFormatada + '\n';
  });

  preview.textContent = saida;
    // ✅ Ativa o botão de exportar CSV com base no preview atual
  const btnExportarCSV = document.getElementById('exportPreviewBtn');
  if (btnExportarCSV) {
    btnExportarCSV.disabled = false;
    btnExportarCSV.replaceWith(btnExportarCSV.cloneNode(true));
    const novoBtnExportar = document.getElementById('exportPreviewBtn');

    novoBtnExportar.addEventListener('click', () => {
      exportarCSV(saida, 'preview_completo.csv');
    });
  }

  // ✅ Ativa o botão de filtrar somente após gerar preview
  if (btnFiltrar) btnFiltrar.disabled = false;
const btnFiltrarInvalid = document.getElementById('filtrarBtnInvalid');
if (btnFiltrarInvalid) btnFiltrarInvalid.disabled = false;
});

// === Função utilitária: cria ou atualiza contador dentro de um previewDiv ===
function atualizarContadorLinhas(previewDiv, conteudo) {
  if (!previewDiv) return;

  // garante que o container seja position:relative (pra posicionar o contador)
  const style = window.getComputedStyle(previewDiv);
  if (style.position === 'static') previewDiv.style.position = 'relative';

  // remove contador anterior, se existir
  const antigo = previewDiv.querySelector('.line-count');
  if (antigo) antigo.remove();

  // conta linhas não vazias
  const count = String(conteudo || '')
    .split(/\r?\n/)
    .filter(l => l.trim() !== '').length;

  // cria novo elemento e anexa
  const badge = document.createElement('div');
  badge.className = 'line-count';
  badge.textContent = `${count} ${count === 1 ? 'linha' : 'linhas'}`;
  previewDiv.appendChild(badge);
}

// === Função utilitária: adiciona botão de copiar dentro do preview ===
function adicionarBotaoCopiar(previewDiv, conteudo) {
  if (!previewDiv) return;

  // remove botão anterior se já existir
  const antigo = previewDiv.querySelector('.copy-btn');
  if (antigo) antigo.remove();

  // se não há conteúdo útil (string vazia ou só mensagem), não exibe botão
  const texto = String(conteudo || '').trim();
  if (
    !texto ||
    texto.startsWith('⚠️ Nenhuma linha válida encontrada') ||
    texto.startsWith('✅ Nenhuma linha inválida encontrada')
  ) {
    return; // sai da função — não mostra botão
  }

  // garante que o container seja relative para posicionar o botão
  const style = window.getComputedStyle(previewDiv);
  if (style.position === 'static') previewDiv.style.position = 'relative';

  // cria botão
  const btn = document.createElement('button');
  btn.textContent = 'Copiar';
  btn.className = 'copy-btn';

  // comportamento do clique
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(conteudo);
    btn.textContent = 'Copiado!';
    setTimeout(() => (btn.textContent = 'Copiar'), 1500);
  });

  // adiciona ao preview
  previewDiv.appendChild(btn);
}

// === Filtro de linhas corretas ===
if (btnFiltrar) {
  const preview = document.getElementById('preview');
  const previewFiltrado = document.getElementById('previewFiltrado');

  btnFiltrar.addEventListener('click', () => {
    limparPreviews(); // limpa tudo antes de exibir

    const linhas = String(preview.textContent || '').trim().split(/\r?\n/);
    const linhasCorretas = linhas.filter(linha => linha && !/←\s*⚠️/.test(linha));
    const conteudoValidas = linhasCorretas.join('\n');

    previewFiltrado.style.display = 'block';
    previewFiltrado.textContent = linhasCorretas.length
      ? conteudoValidas
      : '⚠️ Nenhuma linha válida encontrada.';

    // 👉 adiciona o contador
    atualizarContadorLinhas(previewFiltrado, conteudoValidas);
    adicionarBotaoCopiar(previewFiltrado, conteudoValidas);
  });
}

// === Filtro de linhas inválidas ===
const btnFiltrarInvalid = document.getElementById('filtrarBtnInvalid');
if (btnFiltrarInvalid) {
  const preview = document.getElementById('preview');
  const previewInvalid = document.getElementById('previewInvalid');

  btnFiltrarInvalid.addEventListener('click', () => {
    limparPreviews(); // limpa tudo antes de exibir

    const linhas = String(preview.textContent || '').trim().split(/\r?\n/);
    const linhasInvalidas = linhas.filter(linha => /←\s*⚠️/.test(linha));
    const conteudoInvalidas = linhasInvalidas.join('\n');

    previewInvalid.style.display = 'block';
    previewInvalid.textContent = linhasInvalidas.length
      ? conteudoInvalidas
      : '✅ Nenhuma linha inválida encontrada.';

    // 👉 adiciona o contador
    atualizarContadorLinhas(previewInvalid, conteudoInvalidas);
    adicionarBotaoCopiar(previewInvalid, conteudoInvalidas);
  });
}
//FUNÇÃO EXPORTAR CHAMADA NA SAÍDA DA PREVIEW
function exportarCSV(conteudo, nomeArquivo = 'export.csv') {
  if (!conteudo || !conteudo.trim()) {
    alert('Nenhum conteúdo disponível para exportar.');
    return;
  }

  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// === Inicializa todos os toggles de formatação de texto ===
function inicializarSwitchesTexto() {
  const switches = [
    'switchLower',
    'switchUpper',
    'switchCapitalize',
    'switchNoSpace',
    'switchTrimExtra',
    'switchCamel',
    'switchPascal',
    'switchSnake',
    'switchKebab'
  ].map(id => document.getElementById(id)).filter(Boolean);

  if (!switches.length) return;

  // Estado global
  window.formatoTexto = null;

  switches.forEach(sw => {
    sw.addEventListener('change', e => {
      if (e.target.checked) {
        // Desativa todos os outros switches
        switches.forEach(other => {
          if (other !== e.target) other.checked = false;
        });
        window.formatoTexto = e.target.id.replace('switch', '').toLowerCase();
        console.log('Formato selecionado:', window.formatoTexto);
      } else {
        window.formatoTexto = null;
        console.log('Nenhuma formatação ativa');
      }
    });
  });
}

// === Aplica a formatação de texto conforme toggle ativo ===
function aplicarFormatacaoTexto(valor) {
  if (typeof valor !== 'string') return valor;

  switch (window.formatoTexto) {
    case 'lower': 
      return valor.toLowerCase();
    case 'upper': 
      return valor.toUpperCase();
    case 'capitalize': 
      // Primeiro tudo para minúsculo, depois primeira letra maiúscula
      return valor.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
    case 'nospace': 
      return valor.replace(/\s+/g, '');
    case 'trimextra': 
      return valor.replace(/\s+/g, ' ').trim();
      case 'camel':
  return valor
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, chr => chr.toLowerCase());
      case 'pascal':
  return valor
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[a-z]/, chr => chr.toUpperCase());
    case 'snake': 
      return valor.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '');
    case 'kebab': 
      return valor.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, '');
    default: 
      return valor;
  }
}









  



