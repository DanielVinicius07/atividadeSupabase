// Configuração do Supabase
const SUPABASE_URL = 'https://tumnhggwnirurbpugldt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bW5oZ2d3bmlydXJicHVnbGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzExMDIsImV4cCI6MjA2MjI0NzEwMn0.jUi3UsqkiZH9WCIwbvxrb-5OxNnqppzKOb2_cSyrse8';

// Inicializar o cliente Supabase - usando o objeto global supabase do CDN
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variável para armazenar os produtos
let produtos = [];

// Função para buscar produtos do Supabase
async function buscarProdutos() {
  try {
    console.log("Iniciando busca de produtos...");
    const { data, error } = await supabaseClient
      .from('produtos')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return;
    }
    
    console.log("Produtos recebidos:", data);
    produtos = data;
    renderizarProdutos();
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }
}

function formataPreco(preco) {
  return preco.toLocaleString('pt-BR', 
  { 
    style: 'currency', 
    currency: 'BRL' 
  })
}

function renderizarProdutos() {
  const produtosContainer = document.getElementById('produtos');

  produtosContainer.innerHTML = '';
  
  if (!produtos || produtos.length === 0) {
    produtosContainer.innerHTML = '<div class="sem-produtos">Nenhum produto encontrado. Verifique se a tabela foi criada e populada no Supabase.</div>';
    return;
  }

  const produtosHTML = produtos.map(produto => {
    const produtoCard = document.createElement('div');
    produtoCard.className = 'produto-card';

    const produtoInfo = document.createElement('div');
    produtoInfo.className = 'produto-info';

    const produtoNome = document.createElement('h3');
    produtoNome.className = 'produto-nome';
    produtoNome.textContent = produto.nome

    const produtoDescricao = document.createElement('p');
    produtoDescricao.className = 'produto-descricao';
    produtoDescricao.textContent = produto.descricao

    const produtoPreco = document.createElement('div');
    produtoPreco.className = 'produto-preco';
    
    if (produto.temDesconto) {
      const precoOriginal = document.createElement('span');
      precoOriginal.className = 'preco-original';
      precoOriginal.textContent = formataPreco(produto.precoOriginal);

      const precoDesconto = document.createElement('span');
      precoDesconto.className = 'preco-desconto';
      precoDesconto.textContent = formataPreco(produto.preco);

      produtoPreco.appendChild(precoOriginal);
      produtoPreco.appendChild(precoDesconto);
    } else {
      produtoPreco.textContent = formataPreco(produto.preco);
    }
    produtoInfo.appendChild(produtoNome);
    produtoInfo.appendChild(produtoDescricao);
    produtoInfo.appendChild(produtoPreco);

    produtoCard.appendChild(produtoInfo);

    return produtoCard;
  });

  produtosHTML.forEach(card => {
    produtosContainer.appendChild(card);
  });
}

// Função para aplicar desconto
async function aplicarDesconto() {
  try {
    console.log("Aplicando desconto...");
    // Primeiro, atualizamos localmente
    produtos.forEach(produto => {
      if (!produto.temDesconto) {
        produto.precoOriginal = produto.preco;
        produto.preco = produto.preco * 0.9;
        produto.temDesconto = true;
      }
    });
    
    // Renderizamos imediatamente para feedback ao usuário
    renderizarProdutos();
    
    // Depois atualizamos no banco de dados
    for (const produto of produtos) {
      console.log(`Atualizando produto ${produto.id} no Supabase...`);
      const { error } = await supabaseClient
        .from('produtos')
        .update({
          preco: produto.preco,
          precoOriginal: produto.precoOriginal,
          temDesconto: produto.temDesconto
        })
        .eq('id', produto.id);
        
      if (error) {
        console.error(`Erro ao atualizar produto ${produto.id}:`, error);
      } else {
        console.log(`Produto ${produto.id} atualizado com sucesso!`);
      }
    }
  } catch (error) {
    console.error('Erro ao aplicar desconto:', error);
  }
}

// Função para adicionar um novo produto
async function adicionarProduto(nome, descricao, preco) {
  try {
    console.log("Adicionando novo produto...");
    
    // Criar objeto do produto
    const novoProduto = {
      nome: nome,
      descricao: descricao,
      preco: parseFloat(preco),
      precoOriginal: parseFloat(preco),
      temDesconto: false
    };
    
    // Enviar para o Supabase
    const { data, error } = await supabaseClient
      .from('produtos')
      .insert([novoProduto])
      .select();
      
    if (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto. Verifique o console para mais detalhes.');
      return false;
    }
    
    console.log('Produto adicionado com sucesso:', data);
    
    // Atualizar a lista de produtos
    await buscarProdutos();
    
    return true;
  } catch (error) {
    console.error('Erro ao adicionar produto:', error);
    alert('Erro ao adicionar produto. Verifique o console para mais detalhes.');
    return false;
  }
}

// Funções para controlar o formulário
function mostrarFormulario() {
  document.getElementById('formularioProduto').style.display = 'flex';
}

function esconderFormulario() {
  document.getElementById('formularioProduto').style.display = 'none';
  document.getElementById('formProduto').reset();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log("DOM carregado, buscando produtos...");
  buscarProdutos();
  
  // Botão de desconto
  document.getElementById('aplicarDesconto').addEventListener('click', () => {
    console.log("Botão de desconto clicado!");
    aplicarDesconto();
  });
  
  // Botão para mostrar formulário
  document.getElementById('mostrarFormulario').addEventListener('click', () => {
    console.log("Botão de adicionar produto clicado!");
    mostrarFormulario();
  });
  
  // Botão para cancelar formulário
  document.getElementById('cancelarFormulario').addEventListener('click', () => {
    console.log("Botão de cancelar formulário clicado!");
    esconderFormulario();
  });
  
  // Formulário de adicionar produto
  document.getElementById('formProduto').addEventListener('submit', async (event) => {
    event.preventDefault();
    console.log("Formulário de produto enviado!");
    
    const nome = document.getElementById('nomeProduto').value;
    const descricao = document.getElementById('descricaoProduto').value;
    const preco = document.getElementById('precoProduto').value;
    
    const sucesso = await adicionarProduto(nome, descricao, preco);
    
    if (sucesso) {
      esconderFormulario();
    }
  });
});

// Adicionar log para verificar se o script está sendo carregado
console.log("Script de catálogo carregado!");
// Função para adicionar um novo produto - com melhor tratamento de erros
async function adicionarProduto(nome, descricao, preco) {
  try {
    console.log("Adicionando novo produto...");
    console.log("Dados do produto:", { nome, descricao, preco });
    
    // Validar dados
    if (!nome || !descricao || !preco) {
      alert('Todos os campos são obrigatórios!');
      return false;
    }
    
    // Converter preço para número e validar
    const precoNumerico = parseFloat(preco);
    if (isNaN(precoNumerico) || precoNumerico <= 0) {
      alert('O preço deve ser um número positivo!');
      return false;
    }
    
    // Criar objeto do produto
    const novoProduto = {
      nome: nome,
      descricao: descricao,
      preco: precoNumerico,
      precoOriginal: precoNumerico,
      temDesconto: false
    };
    
    console.log("Objeto do produto:", novoProduto);
    console.log("Enviando para o Supabase...");
    
    // Enviar para o Supabase
    const { data, error } = await supabaseClient
      .from('produtos')
      .insert([novoProduto])
      .select();
      
    if (error) {
      console.error('Erro detalhado ao adicionar produto:', error);
      alert(`Erro ao adicionar produto: ${error.message || 'Erro desconhecido'}`);
      return false;
    }
    
    console.log('Produto adicionado com sucesso:', data);
    
    // Atualizar a lista de produtos
    await buscarProdutos();
    
    return true;
  } catch (error) {
    console.error('Exceção ao adicionar produto:', error);
    alert(`Exceção ao adicionar produto: ${error.message || 'Erro desconhecido'}`);
    return false;
  }
}

// Atualizar o event listener do formulário para mostrar mais informações
document.getElementById('formProduto').addEventListener('submit', async (event) => {
  event.preventDefault();
  console.log("Formulário de produto enviado!");
  
  const nome = document.getElementById('nomeProduto').value;
  const descricao = document.getElementById('descricaoProduto').value;
  const preco = document.getElementById('precoProduto').value;
  
  console.log("Valores do formulário:", { nome, descricao, preco });
  
  const sucesso = await adicionarProduto(nome, descricao, preco);
  
  if (sucesso) {
    alert('Produto adicionado com sucesso!');
    esconderFormulario();
  }
});