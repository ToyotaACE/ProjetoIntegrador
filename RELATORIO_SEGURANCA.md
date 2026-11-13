# Relatório de Avaliação de Segurança — Toyota ACE

| Campo | Preenchimento |
|---|---|
| **Integrantes (nomes completos)** | ______________________________________ <br> ______________________________________ <br> ______________________________________ <br> ______________________________________ <br> ______________________________________ |
| **Turma** | ______________________ |
| **Semestre** | ______________________ |
| **Disciplina** | Cibersegurança — Projeto Integrador |
| **Data** | ____ / ____ / ________ |
| **Repositório** | https://github.com/ToyotaACE/ProjetoIntegrador |
| **Versão avaliada** | branch `main`, commit `61109bd` |
| **Branch das correções** | `ciberseguranca` (https://github.com/ToyotaACE/ProjetoIntegrador/tree/ciberseguranca) |

---

## 1. Introdução e Justificativa

O **Toyota ACE** é a plataforma desenvolvida pelo grupo no Projeto Integrador para acompanhar a jornada de compra de um veículo Toyota: cadastro e login de clientes, acompanhamento da produção do veículo (com dados de IoT via MQTT), financiamento, agendamento de serviços, loja de acessórios, envio de documentos do veículo em PDF e um painel para vendedores e administradores.

A solução é composta por:

- **API REST** em Java 17 + Spring Boot 3.5 (Spring Web, Spring Data JPA, Flyway, Spring Security Crypto), com banco **PostgreSQL 16**;
- **Dois front-ends web** em React 18 + Vite (área do cliente e área do vendedor);
- **Dois aplicativos mobile** em Expo / React Native (cliente e vendedor);
- **Módulo IoT** com simulador em Python, broker **Mosquitto (MQTT)**, Node-RED, **InfluxDB** e Grafana;
- Publicação em produção na **AWS** (API Gateway).

O sistema armazena e processa **dados pessoais** (nome, e-mail, CPF, telefone, endereço), **dados financeiros** (financiamento e parcelas), **documentos do veículo** e **credenciais de acesso**. Por isso, está sujeito à **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)**, que exige medidas técnicas para proteger esses dados contra acessos não autorizados (art. 46). Além disso, por estar publicado na internet, o sistema fica exposto a varreduras automatizadas e a ataques oportunistas.

Uma avaliação de segurança justifica-se para: (a) identificar falhas antes que sejam exploradas; (b) priorizar correções pelo risco; (c) demonstrar, com evidências, o impacto das falhas mais graves; e (d) registrar as mitigações aplicadas e as planejadas.

---

## 2. Objetivos e Escopo da Avaliação

### 2.1 Objetivos

1. Identificar vulnerabilidades no código-fonte com base no **OWASP Top 10 (2021)**.
2. Executar ferramentas automatizadas de varredura (OWASP ZAP, Wapiti, GoLismero, Nikto e WPScan).
3. Realizar um **teste de invasão manual controlado** nas duas vulnerabilidades mais críticas.
4. Implementar correções que **não interfiram no deploy em produção (AWS)** nem quebrem funcionalidades.
5. Documentar as mitigações implementadas e as planejadas.

### 2.2 Escopo

| Componente | Incluído | Observação |
|---|---|---|
| API Spring Boot (`3semestre/Back-ToyotaACE/Back-Toya`) | ✅ Sim | Foco principal |
| Front-end web do cliente | ✅ Sim | Análise de XSS, armazenamento de sessão e headers |
| Front-end web do vendedor | ✅ Sim | Idem |
| Módulo IoT (Mosquitto, Node-RED, InfluxDB, Grafana) | ⚠️ Parcial | Revisão de configuração e da consulta ao InfluxDB |
| Aplicativos mobile | ⚠️ Parcial | Apenas impacto das alterações da API |
| Infraestrutura AWS | ❌ Não | Fora do escopo; os testes foram feitos em ambiente local |

### 2.3 Ambiente de teste

Todos os testes ativos foram feitos em **ambiente local** (Docker), sem afetar o ambiente de produção:

| Serviço | Endereço |
|---|---|
| API | `http://localhost:8083` |
| Front do cliente | `http://localhost:8080` |
| Front do vendedor | `http://localhost:8081` |
| PostgreSQL | `localhost:5433` |

---

## 3. Metodologia

A avaliação seguiu cinco etapas:

1. **Reconhecimento:** levantamento da stack, dos pontos de entrada (endpoints REST, formulários, upload de documentos, autenticação, acesso ao banco e integrações externas) e das configurações (`application.properties`, `docker-compose.yml`, `mosquitto.conf`).
2. **Análise estática manual (revisão de código):** leitura de todos os controllers, serviços, entidades, repositórios e configurações do back-end, e das áreas sensíveis dos fronts (autenticação, armazenamento local, renderização de HTML). Cada achado foi classificado em uma categoria do OWASP Top 10 (2021) e recebeu uma severidade:
   - **Alta:** explorável sem autenticação, com impacto direto em confidencialidade ou integridade de dados de vários usuários;
   - **Média:** exige uma condição adicional ou tem impacto limitado;
   - **Baixa:** boa prática ausente, com impacto indireto.
3. **Testes automatizados (DAST):** execução de OWASP ZAP, Wapiti, GoLismero, Nikto e WPScan contra o ambiente local, conforme o guia `GUIA_TESTES_SEGURANCA.md`.
4. **Teste de invasão manual:** exploração controlada das duas vulnerabilidades mais críticas, com requisições HTTP (`curl`) no ambiente local.
5. **Correção e re-teste:** aplicação das correções na branch `ciberseguranca`, compilação com Maven, execução dos testes automatizados existentes e repetição dos testes manuais para confirmar a mitigação e a ausência de regressões.

> As referências de arquivo e linha da seção 4 apontam para a versão avaliada, **antes das correções** (branch `main`, commit `61109bd`).

---

## 4. Resultados

### 4.1 Controles de segurança já existentes

Antes desta avaliação, o grupo já havia implementado os seguintes controles, que foram verificados no código:

| Controle | Onde | Avaliação |
|---|---|---|
| Hash de senha do **cliente** com **BCrypt**, com conversão automática das senhas antigas no primeiro login | `config/PasswordConfig.java`, `ClienteService.java:198,220-227` | 🟢 Adequado |
| Senha do cliente **fora das respostas JSON** (`@JsonProperty(access = WRITE_ONLY)`) | `models/Cliente.java:35` | 🟢 Adequado |
| **Política de senha forte** (8+ caracteres, maiúscula, minúscula, número e símbolo) e validação de e-mail e CPF | `ClienteService.java:36-46, 96-196` | 🟢 Adequado |
| **Token de sessão** do cliente: 256 bits de `SecureRandom`, guardado no banco apenas como hash SHA-256, validade de 12 horas | `services/ClienteSessionService.java` | 🟢 Adequado |
| **Upload de documentos**: exige token; verifica se o veículo pertence ao cliente; aceita só PDF (Content-Type e assinatura `%PDF-`/`%%EOF`); limite de 10 MB; arquivo salvo com nome UUID; proteção contra *path traversal*; nome de exibição sanitizado; download com `nosniff` e CSP `sandbox` | `services/VehicleDocumentService.java`, `controllers/VehicleDocumentController.java` | 🟢 Adequado |

### 4.2 Vulnerabilidades encontradas na análise de código

| # | Categoria (OWASP 2021) | Severidade | Arquivo / linha | Evidência | Situação |
|---|---|---|---|---|---|
| V01 | A01 – Controle de acesso quebrado | **Alta** | Todos os controllers, exceto documentos. Ex.: `ClienteController.java:55-97` | O token de sessão só é verificado nas rotas de documentos. `GET /api/clientes` lista todos os clientes com CPF; `PUT` e `DELETE` funcionam para qualquer ID. | Planejada |
| V02 | A01 – Escalada de privilégio | **Alta** | `UsuarioInternoController.java:64-85` (linha 80) | `POST /api/usuarios` aceita `"perfil":"ADMIN"` sem autenticação. | Planejada |
| V03 | A01/A04 – Atribuição em massa (*mass assignment*) | **Alta** | `ClienteService.java:96-200` | O cadastro recebe a entidade inteira. Enviar o `"id"` de outro cliente sobrescreve o e-mail, a senha e o CPF da vítima (o atacante assume a conta) e apaga os veículos dela (`orphanRemoval`). | ✅ **Corrigida** |
| V04 | A03 – Injeção (Flux / InfluxDB) | **Alta** | `IoTService.java:22-26` | O parâmetro `vin` da rota pública `GET /iot/status/{vin}` é inserido na consulta Flux com `.formatted(vin)`, sem validação nem escape. | ✅ **Corrigida** |
| V05 | A02 – Senha de usuário interno em texto puro | **Alta** | `UsuarioInternoController.java:40,79,110` | Senhas de vendedores e administradores gravadas sem hash e comparadas com `equals()`. | Planejada |
| V06 | A02/A04 – Exposição de senha de usuário interno | **Alta** | `models/UsuarioInterno.java:27` | `GET /api/usuarios` devolve a senha de todos os vendedores e administradores. | Planejada |
| V07 | A07 – Credenciais padrão / expostas | **Alta** | `UsuarioInternoSeedConfig.java:21-31`, `Back-Toya/README.md:28-31` | Administrador padrão `adm@toyota.com` com senha `123456`. O README publica o e-mail real de uma pessoa com a senha. | ⚠️ **Parcial** (README corrigido) |
| V08 | A07 – Sem proteção contra força bruta | Média | `ClienteService.login`, `UsuarioInternoController.login` | Não há limite de tentativas. | ✅ **Corrigida** |
| V09 | A07 – Enumeração de usuários | Média | `ClienteService.java:218` | E-mail inexistente responde **404** ("Cliente não encontrado"); senha errada responde **401**. | ✅ **Corrigida** |
| V10 | A07 – Gestão de sessão no navegador | Média | Front cliente `AuthContext.tsx:56`; front vendedor `AppContext.tsx:138` | O token do cliente fica no `localStorage`, acessível a scripts. O vendedor não tem token: a "sessão" é o objeto do usuário, com a senha, salvo no `localStorage`. | Planejada |
| V11 | A02 – Senha antiga aceita como texto | Baixa | `ClienteService.java:223` | A conversão de senhas antigas compara a senha digitada com o valor guardado. Se o banco vazar, o próprio hash funciona como senha. | Planejada |
| V12 | A05 – Headers de segurança ausentes | Média | API (exceto o download de PDF) | Não há `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` nem `Referrer-Policy`. | ✅ **Corrigida na API** |
| V13 | A05 – CORS permissivo | Média | `@CrossOrigin(origins = "*")` em 7 controllers | A anotação sobrepõe a lista restrita de `CorsConfig.java`. | Planejada |
| V14 | A05 – Segredos no código | **Alta** | `application.properties:3`, `docker-compose.yml:9,24` | Senha do PostgreSQL versionada no Git. | Planejada |
| V15 | A05 – Configuração de desenvolvimento | Baixa | `application.properties:9-12` | `show-sql=true`, `ddl-auto=update`, `validate-on-migrate=false`. | ⚠️ **Parcial** (`show-sql` desligado) |
| V16 | A05 – Vazamento de informação em erros | Baixa | `CompraController.java:36`, `ClienteService.java:251-252` | Cliente inexistente na compra gera HTTP 500. Trocar o e-mail para um já existente gera erro 500 com detalhes do banco. | ✅ **Corrigida** |
| V17 | A04 – Regra de negócio no cliente | Média | `CompraController.java:41-45` | Preço e total da compra são enviados pelo navegador. | Planejada |
| V18 | A08 – Integridade de dados IoT (MQTT) | Média | `iot/mosquitto/mosquitto.conf:2` | `allow_anonymous true`: qualquer dispositivo na rede altera o status de produção dos veículos. | Planejada |
| V19 | A09 – Logs e monitoramento insuficientes | Média | Serviços MQTT (`System.out`) | Não há registro de falhas de login, bloqueios ou ações administrativas. | Planejada |

### 4.3 Itens verificados sem vulnerabilidade

| Categoria | Resultado | Justificativa |
|---|---|---|
| A03 – Injeção de SQL | 🟢 OK | As consultas usam Spring Data JPA (*derived queries*, parametrizadas). O único `@Query` (`AgendamentoRepository.java:22`) é JPQL fixo, sem parâmetro do usuário. |
| A03 – Injeção de comando | 🟢 OK | Não há `Runtime.exec` nem `ProcessBuilder`. |
| A03 – XSS | 🟢 OK | O React escapa a saída por padrão. O único `dangerouslySetInnerHTML` (`components/ui/chart.tsx`) usa só a configuração de cores. |
| CSRF | 🟢 Não se aplica | A autenticação usa o header `Authorization: Bearer`, e não cookies; o navegador não envia o token automaticamente. |
| Upload de arquivos | 🟢 OK | Ver seção 4.1. |
| HTTPS em produção | 🟢 OK | A API pública é servida via HTTPS pelo AWS API Gateway. |

### 4.4 Resultados dos testes automatizados

#### OWASP ZAP

[INSERIR PRINT] — resumo de alertas da varredura baseline (front do cliente)

[INSERIR PRINT] — resumo de alertas da varredura ativa (API via proxy)

Principais alertas observados: ______________________________________

#### Wapiti

[INSERIR PRINT] — relatório HTML do Wapiti (front e API)

Principais alertas observados: ______________________________________

#### GoLismero

[INSERIR PRINT] — saída do GoLismero

Observação: ______________________________________

#### Nikto

[INSERIR PRINT] — saída do Nikto contra a API (antes das correções, branch `main`)

[INSERIR PRINT] — saída do Nikto contra a API (depois das correções, branch `ciberseguranca`)

Principais alertas observados: ______________________________________

#### WPScan

[INSERIR PRINT] — saída do WPScan

Resultado: a ferramenta informa que o alvo **não executa WordPress**. O Toyota ACE é construído com React e Spring Boot, portanto o WPScan não se aplica. O print fica registrado como evidência de que a verificação foi feita.

#### Dependências

[INSERIR PRINT] — saída do `npm audit` dos fronts

---

## 5. Discussão — Teste de Invasão Manual

Foram escolhidas as duas vulnerabilidades de maior risco encontradas na análise de código. Os testes foram feitos apenas no ambiente local, com dados fictícios.

### 5.1 Vulnerabilidade 1 — Controle de acesso quebrado: escalada para ADMIN e senhas dos funcionários expostas (V01 + V02 + V05 + V06)

**Onde está:** `UsuarioInternoController.java`, endpoints `GET /api/usuarios` e `POST /api/usuarios`, que não exigem autenticação. O modelo `UsuarioInterno` guarda a senha em texto puro e a devolve no JSON.

**Por que é explorável:** o token de sessão criado pelo grupo é verificado apenas nas rotas de documentos. As rotas de usuários internos aceitam qualquer requisição HTTP direta. Além disso, o campo `perfil` vem de quem faz a requisição, e as senhas não têm hash.

**Impacto / risco:**
- **Confidencialidade:** uma única requisição anônima revela o e-mail e a senha de todos os vendedores e administradores, inclusive para reuso em outros serviços.
- **Escalada de privilégio:** um anônimo cria uma conta ADMIN e passa a controlar o painel de vendedores, com acesso aos dados pessoais de todos os clientes (LGPD).
- **Probabilidade:** alta. Basta conhecer a URL da API, que aparece no código do front.
- **Risco geral:** **Crítico.**

**Demonstração controlada (evidência real, ambiente local):**

```bash
curl http://localhost:8083/api/usuarios
```

Trecho da resposta obtida, sem nenhum login:

```
"email":"adm@toyota.com","senha":"123456"
"email":"vendedor@toyota.com","senha":"123456"
```

Criação de um administrador sem login:

```bash
curl -i -X POST http://localhost:8083/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Pentest","email":"pentest@teste.local","senha":"Teste@123","perfil":"ADMIN"}'
```

Resultado esperado: `HTTP 201 Created` com `"perfil":"ADMIN"`. Com essa conta, é possível entrar no front do vendedor.

[INSERIR PRINT] — resposta de `GET /api/usuarios` com as senhas

[INSERIR PRINT] — resposta 201 da criação do ADMIN

[INSERIR PRINT] — painel de administração acessado com a conta criada

**Mitigação proposta (planejada):**
- Estender o token de sessão, que já existe para o cliente, aos usuários internos.
- Proteger todas as rotas com Spring Security, exigir o perfil ADMIN nas rotas `/api/usuarios` e verificar o dono do recurso nas rotas de cliente.
- Aplicar BCrypt e `WRITE_ONLY` também em `UsuarioInterno`, como o grupo já fez em `Cliente`.
- Remover a senha fixa do usuário padrão. As credenciais do README já foram removidas (commit `c89d4f0`).

Essas mudanças exigem alterar os fronts e os apps do vendedor e migrar o banco de produção, por isso foram planejadas para uma próxima etapa, para não interromper o ambiente publicado na AWS.

### 5.2 Vulnerabilidade 2 — Sequestro de conta por atribuição em massa no cadastro (V03)

**Onde está:** `ClienteController.cadastrar` recebe a entidade `Cliente` inteira (`@RequestBody Cliente`), e `ClienteService.cadastrar` (`ClienteService.java:96-200`) a salva sem limpar o campo `id`.

**Por que é explorável:** no Spring Data JPA, quando a entidade já tem `id`, o método `save()` faz um *merge*, ou seja, **atualiza** o registro existente em vez de criar um novo. As validações de e-mail e CPF duplicados conferem apenas os dados novos do atacante, não o `id`. Assim, um cadastro com o `id` de outra pessoa substitui os dados dela pelos do atacante.

**Impacto / risco:**
- **Sequestro de conta:** o atacante define o próprio e-mail e senha na conta da vítima e passa a entrar como ela, com acesso a financiamento, agendamentos e documentos.
- **Perda de dados:** a lista de veículos da vítima é substituída por uma lista vazia, e o `orphanRemoval` apaga os veículos do banco.
- **Pré-requisito:** apenas conhecer um `id` de cliente, que é sequencial (1, 2, 3…) e aparece em `GET /api/clientes`.
- **Risco geral:** **Alto.**

**Demonstração controlada:**

Antes da correção (branch `main`):

```bash
# 1) Ver o cliente vítima (ex.: id 1)
curl http://localhost:8083/api/clientes/id/1

# 2) "Cadastrar" enviando o id da vítima
curl -X POST http://localhost:8083/api/clientes/cadastro \
  -H "Content-Type: application/json" \
  -d '{"id":1,"nome":"Invasor","email":"invasor@teste.local","senha":"Invasor@123","cpf":"99999999999"}'

# 3) Ver o cliente 1 de novo: nome, e-mail e CPF agora são do invasor
curl http://localhost:8083/api/clientes/id/1
```

[INSERIR PRINT] — cliente 1 antes do ataque

[INSERIR PRINT] — cliente 1 depois do ataque, com os dados do invasor (branch `main`)

Depois da correção (branch `ciberseguranca`), **evidência real, ambiente local:**

```
Cliente A criado:  {"id":4,"nome":"Teste A","email":"a24849@teste.local",...}

POST /api/clientes/cadastro com {"id":4,"nome":"Invasor",...}
Resposta:          {"id":5,"nome":"Invasor","email":"b24849@teste.local",...}

Cliente 4 depois:  {"id":4,"nome":"Teste A","email":"a24849@teste.local",...}
```

O ataque passou a criar um cliente **novo** (id 5), e a conta da vítima (id 4) ficou intacta.

[INSERIR PRINT] — mesmo teste na branch `ciberseguranca`

**Mitigação implementada:** o serviço de cadastro descarta o `id` e a lista de `veiculos` vindos do JSON (`cliente.setId(null)` e `cliente.setVeiculos(new ArrayList<>())`). Como reforço planejado, o ideal é receber um DTO próprio de cadastro (`CadastroClienteRequest`), contendo apenas os campos permitidos.

---

## 6. Conclusão

A avaliação mostrou que o grupo já havia adotado **bons controles** na área do cliente: hash BCrypt, política de senha forte, token de sessão seguro e um fluxo de upload de PDF bem protegido. O sistema também está **protegido contra injeção de SQL e XSS**. Os riscos mais graves continuam concentrados em **controle de acesso** e nos **usuários internos**: as rotas que não são de documentos continuam públicas, e as senhas de vendedores e administradores seguem em texto puro e expostas pela API. A avaliação também encontrou uma **injeção na consulta ao InfluxDB** e uma falha de **atribuição em massa** que permitia sequestrar contas.

Seguindo a orientação de não alterar tudo, foram implementadas correções que **não interferem no deploy na AWS e não quebram funcionalidades**. As correções estruturais ficaram documentadas como planejadas.

### 6.1 Mitigações implementadas (branch `ciberseguranca`)

Commits da branch, em ordem:

| Commit | Descrição |
|---|---|
| `9d5347b` | Ajustes de segurança no back-end (os 7 ajustes da tabela abaixo) |
| `5559844` | Testes do limite de tentativas de login |
| `6fc862c` | Testes da validação do VIN contra injeção Flux |
| `b8549fb` | Testes de segurança do cadastro e login de clientes |
| `c89d4f0` | Remoção das credenciais reais do README do back-end |
| `38a98bc` | Log de SQL do Hibernate desligado |
| (3 últimos) | Guia de testes, este relatório e o registro das correções |

| Achado | Mitigação implementada | Arquivo(s) | Verificação (ambiente local) |
|---|---|---|---|
| V03 | O cadastro ignora `id` e `veiculos` enviados no JSON | `services/ClienteService.java` | Cadastro com `"id": 4` criou o cliente 5; o cliente 4 ficou inalterado |
| V04 | Validação do VIN (somente letras e números, até 40 caracteres) antes de montar a consulta Flux; caso contrário, HTTP 400 | `services/IoTService.java` | `GET /iot/status/x" or r["vin"] != "` → **400** "VIN inválido" |
| V12 | Filtro que adiciona `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` e `Cache-Control: no-store` | `config/HeadersSegurancaFilter.java` (novo) | Os 5 headers aparecem em `curl -I /api/agendamentos` |
| V09 | O login do cliente responde **401** com a mesma mensagem para e-mail inexistente e para senha errada | `services/ClienteService.java` | E-mail inexistente → 401 (antes 404); senha errada → 401; login correto → 200 com `accessToken` |
| V08 | Limite de **5 tentativas** por conta, com bloqueio de **15 minutos** (HTTP 429), para clientes e usuários internos | `services/TentativasLoginService.java` (novo), `ClienteService.java`, `UsuarioInternoController.java` | Cliente: `401 401 401 401 401 429`; vendedor: `401 401 401 401 401 429` |
| V16 | Trocar o e-mail para um já existente responde **409** | `services/ClienteService.java` | `PUT /api/clientes/5` com e-mail duplicado → 409 "E-mail já cadastrado" |
| V16 | Erros de integridade do banco viram mensagem genérica; cliente inexistente na compra → **404** | `config/TratadorErros.java` (novo), `controllers/CompraController.java` | `POST /api/compras` com cliente inexistente → 404 (antes 500) |
| V07 | README do back-end sem o e-mail e a senha reais publicados | `Back-Toya/README.md` | Credenciais removidas |
| V15 | `show-sql` e `format_sql` desligados (as consultas SQL não vão mais para o log) | `application.properties` | Configuração revisada |

**Testes automatizados criados** (JUnit 5 + Mockito, sem banco de dados):

| Arquivo | Testes | O que garante |
|---|---|---|
| `TentativasLoginServiceTest` | 4 | Bloqueio após 5 falhas (429), zera o contador após sucesso, contas independentes |
| `IoTServiceTest` | 8 | VINs com aspas, operadores Flux, espaços, hífen, caminhos, nulos, vazios ou com mais de 40 caracteres são rejeitados com 400 antes de consultar o InfluxDB |
| `ClienteServiceSegurancaTest` | 5 | Cadastro ignora `id` e `veiculos`; 401 idêntico para e-mail inexistente e senha errada; 429 após 5 falhas; 409 com e-mail duplicado |

**Teste de regressão:**
- O back-end compilou com `mvnw clean package`.
- Os **22 testes automatizados** (17 novos e 5 já existentes do grupo, `ClienteSessionServiceTest` e `VehicleDocumentServiceTest`) passaram.
- As migrações Flyway V2 a V4 foram aplicadas.
- O login do cliente (com emissão de token) e do vendedor continuou funcionando.
- A rota de documentos continuou exigindo token (401 sem token).
- Os dois fronts web foram executados localmente apontando para a API corrigida.

[INSERIR PRINT] — headers de segurança na resposta da API (depois)

[INSERIR PRINT] — resposta 429 após cinco tentativas de login

[INSERIR PRINT] — front do cliente e do vendedor funcionando após as correções

**Observação funcional encontrada durante os testes (não relacionada às correções):**
- A rota `/iot/status/{vin}` responde HTTP 500 mesmo com um VIN válido, porque o `InfluxConfig.java` cria o cliente do InfluxDB sem informar a organização (`org`).
- O app mobile do vendedor ainda tenta preencher a senha do cliente a partir da resposta da API (`clientes.tsx:188`). Como a API não devolve mais esse campo, editar um cliente pelo app passa a exigir uma senha nova.

### 6.2 Mitigações planejadas

| Achado | Mitigação planejada | Motivo de não ter sido aplicada agora |
|---|---|---|
| V01, V02, V10 | Exigir token em todas as rotas (Spring Security), token também para usuários internos, autorização por perfil e verificação do dono do recurso | Exige mudanças nos fronts e nos apps |
| V05, V06, V07, V11 | BCrypt e `WRITE_ONLY` em `UsuarioInterno`, seed sem senha fixa, conversão de senhas antigas por script único em vez de aceitar texto puro no login | Migração do banco de produção; impacto no app do vendedor |
| V13 | Remover `@CrossOrigin("*")` e configurar as origens por variável de ambiente | Exige configurar os domínios de produção na AWS |
| V14, V15 | Segredos em variáveis de ambiente / AWS Secrets Manager, troca das senhas expostas no histórico do Git, `ddl-auto=validate` | Exige configuração no ambiente da AWS |
| V17 | Preço calculado no servidor e Bean Validation nos DTOs | Altera a regra de negócio |
| V18 | Mosquitto com usuário, senha e ACL; senhas no Node-RED e no Grafana | Configuração da infraestrutura IoT |
| V19 | Logs estruturados (SLF4J) com eventos de segurança e monitoramento (ex.: CloudWatch) | Baixa prioridade nesta etapa |
| — | Regra *rate-based* no AWS WAF como reforço contra força bruta | Configuração da AWS |

Como próximo passo, recomenda-se priorizar a **extensão do token de sessão a todas as rotas e aos usuários internos**, junto com o **hash BCrypt das senhas internas**. Essas duas medidas eliminam a vulnerabilidade crítica demonstrada na seção 5.1.

---

## 7. Referências

- OWASP Foundation. **OWASP Top 10:2021**. Disponível em: https://owasp.org/Top10/
- OWASP Foundation. **Application Security Verification Standard (ASVS) 4.0**. Disponível em: https://owasp.org/www-project-application-security-verification-standard/
- OWASP Foundation. **Password Storage Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP Foundation. **Authentication Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP Foundation. **REST Security Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- OWASP Foundation. **HTTP Security Response Headers Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- OWASP Foundation. **Mass Assignment Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html
- OWASP Foundation. **Injection Prevention Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html
- OWASP Foundation. **File Upload Cheat Sheet**. Disponível em: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- MITRE. **Common Weakness Enumeration (CWE)**: CWE-284, CWE-269, CWE-915, CWE-943, CWE-256, CWE-307, CWE-204, CWE-798, CWE-209. Disponível em: https://cwe.mitre.org/
- BRASIL. **Lei nº 13.709, de 14 de agosto de 2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)**. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- OWASP ZAP. **Documentação**. Disponível em: https://www.zaproxy.org/docs/
- Wapiti. **Documentação**. Disponível em: https://wapiti-scanner.github.io/
- Nikto. **Repositório oficial**. Disponível em: https://github.com/sullo/nikto
- GoLismero. **Repositório oficial**. Disponível em: https://github.com/golismero/golismero
- WPScan. **Repositório oficial**. Disponível em: https://github.com/wpscanteam/wpscan
- InfluxData. **Flux documentation**. Disponível em: https://docs.influxdata.com/flux/
- Spring. **Spring Security Reference — Password Storage**. Disponível em: https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html
- MDN Web Docs. **HTTP headers**. Disponível em: https://developer.mozilla.org/docs/Web/HTTP/Headers
