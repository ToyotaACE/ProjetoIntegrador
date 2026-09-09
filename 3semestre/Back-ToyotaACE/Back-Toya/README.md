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
