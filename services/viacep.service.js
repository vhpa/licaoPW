/**
 * Serviço isolado para consumir a API pública ViaCEP.
 */

const VIA_CEP_BASE_URL = 'https://viacep.com.br/ws';


async function buscarEnderecoPorCep(cep) {

  const cepNumerico = String(cep || '').replace(/\D/g, '');

    
  if (cepNumerico.length !== 8) {
    const err = new Error('CEP inválido. Informe um CEP com 8 dígitos.');
    err.statusCode = 400;
    throw err;
  }

  const url = `${VIA_CEP_BASE_URL}/${cepNumerico}/json/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const err = new Error('Falha ao consultar o ViaCEP. Tente novamente mais tarde.');
      err.statusCode = 500;
      throw err;
    }

    const data = await response.json();

    // ViaCEP costuma retornar { erro: true } para CEP não encontrado
    if (data && data.erro) {
      const err = new Error('CEP não encontrado no ViaCEP.');
      err.statusCode = 400;
      throw err;
    }

    // Campos esperados
    // logradouro, bairro, localidade, uf
    return {
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      estado: data.uf,
      cep: cepNumerico
    };
  } catch (e) {
    // Erros de rede ou parse
    if (e.statusCode) throw e;

    const err = new Error('Erro de rede ao consultar o ViaCEP.');
    err.statusCode = 500;
    throw err;
  }
}

module.exports = { buscarEnderecoPorCep };

