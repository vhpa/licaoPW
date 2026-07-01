/**
 * Middleware de validação reutilizável.
 * Retorna 400/403 com mensagem clara.
 */

function erro400(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function erro403(message) {
  const err = new Error(message);
  err.statusCode = 403;
  return err;
}

function validarCamposObrigatorios(obj, campos) {
  for (const campo of campos) {
    if (obj[campo] === undefined || obj[campo] === null || String(obj[campo]).trim() === '') {
      throw erro400(`Campo obrigatório ausente: ${campo}`);
    }
  }
}

function validarCpfDuplicadoPlaceholder() {
  // A verificação de duplicidade depende do JSON.
  // Então ela é feita no controller.
}

function validarEmailFormato(email) {
  const e = String(email || '').trim();
  if (!e.includes('@')) {
    throw erro400('E-mail inválido. Informe um e-mail contendo "@".');
  }

  // Validação mínima: tem @ e algo após @ com ponto.
  // Não é validação RFC completa; serve para o projeto escolar.
  const partes = e.split('@');
  if (partes.length !== 2 || !partes[1].includes('.')) {
    throw erro400('E-mail inválido. Informe um formato minimamente válido.');
  }
}

/**
 * POST /colaboradores
 */
function validarCadastroColaborador(req, res, next) {
  try {
    const body = req.body || {};

    validarCamposObrigatorios(body, [
      'nome',
      'cargo',
      'cpf',
      'email',
      'cep',
      'numero'
    ]);

    validarEmailFormato(body.email);

    // Normalizações: trim
    req.body = {
      ...body,
      nome: String(body.nome).trim(),
      cargo: String(body.cargo).trim(),
      cpf: String(body.cpf).trim(),
      email: String(body.email).trim(),
      cep: String(body.cep).trim(),
      numero: String(body.numero).trim()
    };

    return next();
  } catch (e) {
    return res.status(e.statusCode || 400).json({ message: e.message });
  }
}

/**
 * PUT/PATCH /colaboradores/:id
 * Regras: permitir atualizar apenas cargo e email
 * Bloquear alteração de CPF.
 */
function validarAtualizacaoColaborador(req, res, next) {
  try {
    const body = req.body || {};

    // Bloqueio explícito para tentativa de alteração CPF
    if (Object.prototype.hasOwnProperty.call(body, 'cpf')) {
      throw erro403('Não é permitido alterar o CPF do colaborador.');
    }

    // Aceita apenas cargo e email
    const camposPermitidos = ['cargo', 'email'];
    const chaves = Object.keys(body);
    const camposNaoPermitidos = chaves.filter((k) => !camposPermitidos.includes(k));

    if (camposNaoPermitidos.length > 0) {
      throw erro400(`Campos não permitidos para atualização: ${camposNaoPermitidos.join(', ')}`);
    }

    if (!('cargo' in body) && !('email' in body)) {
      throw erro400('Informe ao menos um campo para atualizar: cargo ou email.');
    }

    const payload = {};

    if ('cargo' in body) {
      if (body.cargo === undefined || body.cargo === null || String(body.cargo).trim() === '') {
        throw erro400('Campo cargo não pode estar vazio.');
      }
      payload.cargo = String(body.cargo).trim();
    }

    if ('email' in body) {
      validarEmailFormato(body.email);
      payload.email = String(body.email).trim();
    }

    req.body = payload;

    return next();
  } catch (e) {
    return res.status(e.statusCode || 400).json({ message: e.message });
  }
}

module.exports = {
  validarCadastroColaborador,
  validarAtualizacaoColaborador
};

