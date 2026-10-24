# Toyota ACE Backend

Backend Spring Boot para o projeto Toyota ACE Cliente.

## Rodar com Docker

```bash
docker compose up --build
```

Backend: http://localhost:8083
PostgreSQL: localhost:5433

## Rodar localmente

Suba o banco:

```bash
docker compose up postgres
```

Depois rode:

```bash
./mvnw spring-boot:run
```

## Usuário de teste

- Email: nastrisalesisabelle@gmail.com
- Senha: 123456

## Rotas principais

### Clientes/Auth

- POST `/api/clientes/cadastro`
- POST `/api/clientes/login`
- GET `/api/clientes/{email}`
- GET `/api/clientes/id/{id}`
- PUT `/api/clientes/{id}`
- DELETE `/api/clientes/{id}`

### Compatibilidade com frontend atual

- POST `/api/acompanhamento/login`
- GET `/api/acompanhamento/{email}`

### Veículo

- GET `/api/veiculo/{clienteId}`
- GET `/api/veiculo/email/{email}`
- PUT `/api/veiculo/{clienteId}`

### Financiamento

- GET `/api/financiamento/{clienteId}`
- GET `/api/financiamento/email/{email}`
- PUT `/api/financiamento/{clienteId}`

### Agendamentos

- POST `/api/agendamentos`
- GET `/api/agendamentos/cliente/{clienteId}`

### Documentos do veículo

O login de cliente em `POST /api/clientes/login` continua retornando os dados do cliente e acrescenta `accessToken`. Envie-o como `Authorization: Bearer <accessToken>` nas rotas de documentos; o token expira em 12 horas. As rotas verificam se o veículo pertence à conta autenticada.

- GET `/api/veiculos/{vehicleId}/documentos` — lista `{id,nome,tipo,tamanho,dataCriacao}`.
- POST `/api/veiculos/{vehicleId}/documentos` — `multipart/form-data` com `arquivo` (PDF) e `tipo` (`manual` ou `documento`); limite de 10 MiB.
- GET `/api/veiculos/{vehicleId}/documentos/{documentId}/arquivo` — retorna PDF inline; `?download=true` solicita download.
- DELETE `/api/veiculos/{vehicleId}/documentos/{documentId}/arquivo` — exclui o PDF e seus metadados.

Uploads precisam declarar `Content-Type: application/pdf` e passar a validação básica das assinaturas `%PDF-` e `%%EOF`. O nome enviado é sanitizado para exibição; o arquivo é salvo fora de `static` com UUID gerado pelo servidor. Em Docker, os PDFs ficam no volume dedicado `documents_data`, independente do contêiner.

### Revisões

Agendamentos persistem `data` e `tipoServico` como campos distintos; `tipoServico` é texto livre, sem enum/valor canônico fixo. `GET /api/agendamentos/cliente/{clienteId}` já retorna os agendamentos com `data`, `tipoServico` e o cliente associado. Para a regra escolhida, a próxima revisão é um ano após a `data` do agendamento de revisão; não há cálculo paralelo nem campo duplicado de revisão.
