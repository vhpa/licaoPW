const fs = require('fs/promises');
const path = require('path');
const { buscarEnderecoPorCep } = require('../services/viacep.service');



const DATA_FILE = path.join(__dirname, '..', 'data', 'colaboradores.json');


let writeLock = Promise.resolve();

async function lerColaboradores() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    if (e.code === 'ENOENT') return [];

    return [];
  }
}

function salvarColaboradores(colaboradores) {

  writeLock = writeLock.then(async () => {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(colaboradores, null, 2), 'utf8');
  });
  return writeLock;
}

function encontrarPorIdOuCpf(colaboradores, idOuCpf) {
  const key = String(idOuCpf);
  return colaboradores.find((c) => String(c.id) === key || String(c.cpf) === key);
}

function normalizarColaboradorParaSalvar({
  nome,
  cargo,
  cpf,
  email,
  cep,
  numero,
  endereco
}) {
  const id = cpf;

  return {
    id,
    nome,
    cargo,
    cpf,
    email,
    cep: String(cep),
    numero: String(numero),
    endereco: {
      logradouro: endereco.logradouro,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado
    },
    enderecoCompleto: `${endereco.logradouro}, ${numero} - ${endereco.bairro} - ${endereco.cidade}/${endereco.estado}`,
    status: 'Ativo',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
}

async function cadastrar(req, res) {
  const { nome, cargo, cpf, email, cep, numero } = req.body;

  try {
    const colaboradores = await lerColaboradores();

    // Bloqueio duplicado por CPF
    const existe = colaboradores.some((c) => String(c.cpf) === String(cpf));
    if (existe) {
      return res.status(400).json({ message: 'Já existe um colaborador cadastrado com este CPF.' });
    }

    // ViaCEP antes de salvar
    const endereco = await buscarEnderecoPorCep(cep);

    const novo = normalizarColaboradorParaSalvar({
      nome,
      cargo,
      cpf,
      email,
      cep,
      numero,
      endereco
    });

    const atualizado = [...colaboradores, novo];
    await salvarColaboradores(atualizado);

    return res.status(201).json({ message: 'Colaborador cadastrado com sucesso.', colaborador: novo });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ message: e.message || 'Erro ao cadastrar colaborador.' });
  }
}

async function listar(req, res) {
  try {
    const colaboradores = await lerColaboradores();
    const { status } = req.query;

    if (status) {
      return res.json(colaboradores.filter((c) => String(c.status) === String(status)));
    }

    return res.json(colaboradores);
  } catch (e) {
    return res.status(500).json({ message: 'Erro ao listar colaboradores.' });
  }
}

async function buscarPorId(req, res) {
  const { id } = req.params;

  try {
    const colaboradores = await lerColaboradores();
    const encontrado = encontrarPorIdOuCpf(colaboradores, id);

    if (!encontrado) {
      return res.status(404).json({ message: 'Colaborador não encontrado.' });
    }

    return res.json(encontrado);
  } catch (e) {
    return res.status(500).json({ message: 'Erro ao buscar colaborador.' });
  }
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { cargo, email } = req.body;

  try {
    const colaboradores = await lerColaboradores();
    const index = colaboradores.findIndex((c) => String(c.id) === String(id) || String(c.cpf) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Colaborador não encontrado.' });
    }

    const atual = colaboradores[index];

    // Se email foi alterado, revalidar duplicidade básica (opcional, mas útil)
    if (email && String(email) !== String(atual.email)) {
      const emailDuplicado = colaboradores.some((c) => String(c.email).toLowerCase() === String(email).toLowerCase() && String(c.id) !== String(atual.id));
      if (emailDuplicado) {
        return res.status(400).json({ message: 'Já existe outro colaborador com este e-mail.' });
      }
      atual.email = email;
    }

    if (cargo) {
      atual.cargo = cargo;
    }

    atual.atualizadoEm = new Date().toISOString();

    colaboradores[index] = atual;
    await salvarColaboradores(colaboradores);

    return res.json({ message: 'Colaborador atualizado com sucesso.', colaborador: atual });
  } catch (e) {
    const status = e.statusCode || 500;
    return res.status(status).json({ message: e.message || 'Erro ao atualizar colaborador.' });
  }
}

async function softDelete(req, res) {
  const { id } = req.params;

  try {
    const colaboradores = await lerColaboradores();
    const index = colaboradores.findIndex((c) => String(c.id) === String(id) || String(c.cpf) === String(id));

    if (index === -1) {
      return res.status(404).json({ message: 'Colaborador não encontrado.' });
    }

    colaboradores[index].status = 'Inativo';
    colaboradores[index].atualizadoEm = new Date().toISOString();

    await salvarColaboradores(colaboradores);

    return res.json({ message: 'Colaborador desativado (soft delete).', colaborador: colaboradores[index] });
  } catch (e) {
    return res.status(500).json({ message: 'Erro ao desativar colaborador.' });
  }
}

module.exports = {
  cadastrar,
  listar,
  buscarPorId,
  atualizar,
  softDelete
};

