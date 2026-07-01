# API de Gestão de Colaboradores e Benefícios (ETEC - Web III)

API REST em **Node.js + Express** para simular um RH de uma startup.

## Funcionalidades
- Cadastrar colaboradores (com endereço preenchido via **ViaCEP**)
- Listar colaboradores (com filtro por status)
- Buscar por ID/CPF
- Atualizar colaborador (somente **cargo** e **email**)
- Desativar colaborador (**soft delete**), alterando `status` para `Inativo`
- Persistência em arquivo local `data/colaboradores.json` (sem banco de dados)

---

## Requisitos
- Node.js 18+

---

## Instalação
```bash
npm install
```

## Execução
### Modo desenvolvimento
```bash
npm run dev
```

### Modo produção
```bash
npm start
```

A API subirá em:
- `http://localhost:3000`

---

## Estrutura do projeto
- `server.js`: configuração do Express e rotas
- `routes/colaboradores.routes.js`: endpoints
- `controllers/colaboradores.controller.js`: regras de negócio + acesso ao JSON
- `middlewares/validacao.middleware.js`: validações reutilizáveis
- `services/viacep.service.js`: consumo da ViaCEP
- `data/colaboradores.json`: persistência

---

## Divisão de Responsabilidades

| Gabriel Deboni | Rotas | Implementação das regras de negócio: CRUD de colaboradores, atualização permitida (cargo/email), soft delete e persistência no `colaboradores.json`. |
| Vitor Hugo Pedroso de Almeida | Service/ViaCEP + Middlewares + Controllers | Consumidor do ViaCEP (`viacep.service.js`) + validações reutilizáveis no `validacao.middleware.js`, validações de CPF duplicado e montagem das respostas/erros conforme regras do enunciado. |


---

## Endpoints

### Healthcheck
**GET /**
- Resposta: `{ ok: true, service: "API de Gestão..." }`

---

### 1) Cadastrar colaborador
**POST /colaboradores**

#### Body esperado (JSON)
```json
{
  "nome": "Maria Silva",
  "cargo": "Analista",
  "cpf": "12345678900",
  "email": "maria@email.com",
  "cep": "01001000",
  "numero": "123"
}
```

#### Como testar (Insomnia/Postman/Thunder Client)
- Method: `POST`
- URL: `http://localhost:3000/colaboradores`
- Body: `raw` -> `JSON`

#### Respostas (exemplos)
- `201`
```json
{
  "message": "Colaborador cadastrado com sucesso.",
  "colaborador": {
    "id": "12345678900",
    "nome": "Maria Silva",
    "cargo": "Analista",
    "cpf": "12345678900",
    "email": "maria@email.com",
    "cep": "01001000",
    "numero": "123",
    "endereco": {
      "logradouro": "Praça da Sé",
      "bairro": "Sé",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "enderecoCompleto": "Praça da Sé, 123 - Sé - São Paulo/SP",
    "status": "Ativo"
  }
}
```
- `400` (ex.: CPF duplicado)
```json
{ "message": "Já existe um colaborador cadastrado com este CPF." }
```

---

### 2) Listar colaboradores
**GET /colaboradores**

#### Query opcional
- `?status=Ativo` ou `?status=Inativo`

#### Como testar
- Method: `GET`
- URL: `http://localhost:3000/colaboradores?status=Ativo`

#### Resposta (exemplo)
`200`
```json
[
  { "id": "12345678900", "status": "Ativo", "nome": "Maria Silva" }
]
```

---

### 3) Buscar por ID (ou CPF)
**GET /colaboradores/:id**

- `:id` pode ser o `id` (CPF) ou o CPF do colaborador

#### Como testar
- Method: `GET`
- URL: `http://localhost:3000/colaboradores/12345678900`

#### Respostas
- `200`: colaborador encontrado
- `404`:
```json
{ "message": "Colaborador não encontrado." }
```

---

### 4) Atualizar colaborador (cargo/email)
**PUT /colaboradores/:id**

#### Regras
- Atualiza apenas `cargo` e/ou `email`
- Enviar `cpf` retorna `403`

#### Body esperado
```json
{
  "cargo": "Coordenador",
  "email": "novo@email.com"
}
```

#### Como testar
- Method: `PUT`
- URL: `http://localhost:3000/colaboradores/12345678900`
- Body: `raw` -> `JSON`

#### Respostas
- `200`: sucesso
- `403` (tentativa de alterar CPF)
```json
{ "message": "Não é permitido alterar o CPF do colaborador." }
```
- `400` (email inválido)
```json
{ "message": "E-mail inválido. Informe um e-mail contendo \"@\"." }
```

---

### 5) Soft delete (desativar)
**DELETE /colaboradores/:id**

#### Como testar
- Method: `DELETE`
- URL: `http://localhost:3000/colaboradores/12345678900`

#### Respostas
- `200`:
```json
{ "message": "Colaborador desativado (soft delete).", "colaborador": { "status": "Inativo" } }
```
- `404`:
```json
{ "message": "Colaborador não encontrado." }
```

---





