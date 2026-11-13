# Registro de Correções de Segurança — Toyota ACE

> Documento que registra **tudo o que foi feito e alterado** na avaliação de segurança.
> Repositório: https://github.com/ToyotaACE/ProjetoIntegrador
> Versão de partida: `main`, commit `61109bd` ("Merge pull request #41 from ToyotaACE/frontend")
> Branch com as correções: **`ciberseguranca`** (https://github.com/ToyotaACE/ProjetoIntegrador/tree/ciberseguranca)
> Relatório completo da avaliação: `RELATORIO_SEGURANCA.md`

---

## 1. Resumo

| Item | Situação |
|---|---|
| Arquivos de código alterados | 4 (Java) + `application.properties` + `README.md` |
| Arquivos de código criados | 3 (Java) + 3 arquivos de teste |
| Vulnerabilidades corrigidas | 7 ajustes no código (achados V03, V04, V08, V09, V12 e V16) + correções parciais de V07 (README) e V15 (`show-sql`) |
| Testes automatizados novos | 17 (3 arquivos) |
| Impacto no deploy da AWS | **Nenhum.** Não há variável de ambiente nova, migração de banco nem mudança nos fronts ou nos apps |
| Compilação (`mvnw clean package`) | ✅ OK |
| Testes automatizados | ✅ 22 de 22 passaram (17 novos + 5 do grupo) |
| Testes manuais das correções | ✅ 7 de 7 confirmados |
| Enviado ao GitHub | ✅ Branch `ciberseguranca` |

### Commits da branch

| Commit | Tipo | Descrição |
|---|---|---|
| `5e971ad` | fix | Ajustes de segurança no back-end (os 7 ajustes da seção 2) |
| `4f7081a` | test | Testes do limite de tentativas de login |
| `01544f7` | test | Testes da validação do VIN contra injeção Flux |
| `4c3db59` | test | Testes de segurança do cadastro e login de clientes |
| `5c1faa4` | docs | Remoção das credenciais reais do README do back-end |
| `893a864` | config | Log de SQL do Hibernate desligado |
| (3 últimos) | docs | Guia de testes, relatório e este registro |

---

## 2. Os 7 ajustes de segurança

| # | Ajuste | Vulnerabilidade (OWASP 2021) | Arquivo(s) |
|---|---|---|---|
| 1 | Headers de segurança em todas as respostas da API | A05 – Configuração insegura (V12) | `config/HeadersSegurancaFilter.java` (novo) |
| 2 | Login do cliente responde sempre 401, com a mesma mensagem | A07 – Enumeração de usuários (V09) | `services/ClienteService.java` |
| 3 | Bloqueio de 15 minutos após 5 erros de senha (HTTP 429), para clientes e usuários internos | A07 – Força bruta (V08) | `services/TentativasLoginService.java` (novo), `ClienteService.java`, `UsuarioInternoController.java` |
| 4 | Cadastro ignora `id` e `veiculos` enviados no JSON | A01/A04 – Atribuição em massa / sequestro de conta (V03) | `services/ClienteService.java` |
| 5 | Trocar o e-mail para um já existente responde 409 | A05 – Vazamento de informação em erro (V16) | `services/ClienteService.java` |
| 6 | Erro de banco vira mensagem genérica; compra com cliente inexistente responde 404 | A05 – Vazamento de informação em erro (V16) | `config/TratadorErros.java` (novo), `controllers/CompraController.java` |
| 7 | Validação do VIN antes da consulta ao InfluxDB | A03 – Injeção Flux (V04) | `services/IoTService.java` |

Todos os caminhos são relativos a `3semestre/Back-ToyotaACE/Back-Toya/src/main/java/br/com/toyota/toyota_backend/`.

---

## 3. Alterações detalhadas

### 3.1 `config/HeadersSegurancaFilter.java` (novo)

Filtro executado em toda requisição. Ele adiciona os headers abaixo à resposta:

| Header | Valor | Protege contra |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | O navegador interpretar a resposta como outro tipo de arquivo |
| `X-Frame-Options` | `DENY` | *Clickjacking* (a API ser exibida dentro de um iframe) |
| `Referrer-Policy` | `no-referrer` | Vazamento da URL em links |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'` | Execução de scripts e carregamento de recursos em respostas da API |
| `Cache-Control` | `no-store` | Dados pessoais guardados em cache do navegador ou de proxies |

O download de PDF continua definindo a sua própria CSP (`sandbox`), que já existia.

### 3.2 `services/TentativasLoginService.java` (novo)

Conta as falhas de login por conta. Funcionamento:
- Cada conta tem uma chave: `cliente:<email>` ou `usuario:<email>`.
- Na 5ª falha dentro de 15 minutos, as próximas tentativas recebem **HTTP 429** "Muitas tentativas de login. Tente novamente em 15 minutos."
- Um login correto zera o contador.
- Passados 15 minutos, o bloqueio expira sozinho.
- O controle fica em memória: se o back-end reiniciar, o contador zera.

### 3.3 `config/TratadorErros.java` (novo)

Captura `DataIntegrityViolationException`, o erro do banco para dado duplicado ou inválido. Em vez de devolver HTTP 500 com o texto do PostgreSQL (nomes de tabela e constraint), responde:

```json
{ "status": 409, "error": "Conflict", "message": "Não foi possível salvar: dado duplicado ou inválido." }
```

O campo `message` mantém o mesmo formato que os fronts já leem.

### 3.4 `services/ClienteService.java` (alterado)

**Construtor:** passa a receber o `TentativasLoginService`.

**Cadastro (ajuste 4):** depois de gerar o hash da senha, antes de salvar:

```diff
         cliente.setSenha(passwordEncoder.encode(cliente.getSenha()));

+        // 8. SEGURANÇA: IMPEDIR SOBRESCREVER OUTRO CLIENTE
+        // Ignora "id" e "veiculos" enviados no JSON (mass assignment)
+        cliente.setId(null);
+        cliente.setVeiculos(new ArrayList<>());
+
         return clienteRepository.save(cliente);
```

**Login (ajustes 2 e 3):**

```diff
-        Cliente cliente = buscarPorEmail(email);
+        // Segurança: limite de tentativas contra força bruta
+        String chave = "cliente:" + email.trim().toLowerCase();
+        tentativasLoginService.verificarBloqueio(chave);

-        boolean senhaValida = passwordEncoder.matches(senha, cliente.getSenha());
+        // Segurança: e-mail inexistente responde igual a senha errada (401)
+        Cliente cliente = clienteRepository.findByEmail(email).orElse(null);
+
+        boolean senhaValida = cliente != null
+                && passwordEncoder.matches(senha, cliente.getSenha());

-        if (!senhaValida && cliente.getSenha().equals(senha)) {
+        if (cliente != null && !senhaValida && cliente.getSenha().equals(senha)) {
             ...
         if (!senhaValida) {
+            tentativasLoginService.registrarFalha(chave);
             throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha incorretos");
         }
+        tentativasLoginService.registrarSucesso(chave);
         return cliente;
```

A conversão automática de senhas antigas, criada pelo grupo, foi mantida.

**Atualizar cliente (ajuste 5):**

```diff
-        if (dados.getEmail() != null)
+        // Segurança: e-mail duplicado responde 409 em vez de erro 500 com detalhes do banco
+        if (dados.getEmail() != null && !dados.getEmail().equals(cliente.getEmail())) {
+            if (clienteRepository.existsByEmail(dados.getEmail())) {
+                throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
+            }
             cliente.setEmail(dados.getEmail());
+        }
```

### 3.5 `controllers/UsuarioInternoController.java` (alterado, ajuste 3)

```diff
-        UsuarioInterno usuario = usuarioRepository.findByEmail(email)
-                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "E-mail ou senha inválidos."));
-
-        if (!usuario.getSenha().equals(senha)) {
+        // Segurança: limite de tentativas contra força bruta
+        String chave = "usuario:" + email;
+        tentativasLoginService.verificarBloqueio(chave);
+
+        UsuarioInterno usuario = usuarioRepository.findByEmail(email).orElse(null);
+
+        if (usuario == null || !usuario.getSenha().equals(senha)) {
+            tentativasLoginService.registrarFalha(chave);
             throw new ResponseStatusException(UNAUTHORIZED, "E-mail ou senha inválidos.");
         }
         ...
+        tentativasLoginService.registrarSucesso(chave);
         return ResponseEntity.ok(usuario);
```

O construtor passa a receber o `TentativasLoginService`.

### 3.6 `controllers/CompraController.java` (alterado, ajuste 6)

```diff
         Cliente cliente = clienteRepository.findById(request.getClienteId())
-                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));
+                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente não encontrado"));
```

### 3.7 `services/IoTService.java` (alterado, ajuste 7)

```diff
+    // Segurança: o VIN/chassi só pode ter letras e números,
+    // impedindo injeção na consulta Flux (InfluxDB)
+    private static final Pattern VIN_PATTERN = Pattern.compile("^[A-Za-z0-9]{1,40}$");
 ...
     public List<String> buscarEtapas(final String vin) {
+        if (vin == null || !VIN_PATTERN.matcher(vin).matches()) {
+            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "VIN inválido. Use apenas letras e números.");
+        }
+
         final String flux = """
               ...
               |> filter(fn: (r) => r["vin"] == "%s")
             """.formatted(vin);
```

Os chassis gerados pelo sistema (`9BR` + 14 caracteres) e VINs reais têm só letras e números, então continuam aceitos.

---

### 3.8 Testes automatizados (novos)

Pasta: `3semestre/Back-ToyotaACE/Back-Toya/src/test/java/br/com/toyota/toyota_backend/services/`. Os testes usam JUnit 5 e Mockito e não precisam de banco de dados.

| Arquivo | Testes | O que garante |
|---|---|---|
| `TentativasLoginServiceTest.java` | 4 | Sem bloqueio com 4 falhas; 429 na 5ª; login com sucesso zera o contador; bloqueio de uma conta não afeta outras |
| `IoTServiceTest.java` | 8 | VIN nulo, vazio, com aspas, com operador Flux, com espaço, com hífen, com caminho ou com 41+ caracteres → 400, antes de consultar o InfluxDB |
| `ClienteServiceSegurancaTest.java` | 5 | Cadastro ignora `id` e `veiculos` e grava a senha com hash; 401 com a mesma mensagem para e-mail inexistente e senha errada; 429 após 5 falhas; 409 com e-mail duplicado, sem salvar |

Para rodar:

```bash
cd 3semestre/Back-ToyotaACE/Back-Toya
./mvnw test -Dtest='TentativasLoginServiceTest,IoTServiceTest,ClienteServiceSegurancaTest,ClienteSessionServiceTest,VehicleDocumentServiceTest'
```

### 3.9 `README.md` do back-end (alterado)

A seção "Usuário de teste" publicava o e-mail real de uma pessoa com a senha `123456`. Ela foi substituída por instruções de como cadastrar um usuário de teste local. Os dados continuam no histórico do Git, então a pessoa deve trocar a senha.

### 3.10 `application.properties` (alterado)

```diff
-spring.jpa.show-sql=true
-spring.jpa.properties.hibernate.format_sql=true
+spring.jpa.show-sql=false
+spring.jpa.properties.hibernate.format_sql=false
```

As consultas SQL deixam de ser impressas no log da aplicação. O comportamento da API não muda.

---

## 4. Testes executados (ambiente local, 13/11/2026)

### 4.1 Testes das correções

| # | Teste | Antes | Depois |
|---|---|---|---|
| 1 | `curl -I /api/agendamentos` | Sem headers de segurança | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Content-Security-Policy` e `Cache-Control` presentes |
| 2 | Login com e-mail inexistente | 404 "Cliente não encontrado" | **401** "E-mail ou senha incorretos" |
| 3 | 6 logins errados seguidos (cliente) | `401` sempre | `401 401 401 401 401` **`429`** |
| 3 | 6 logins errados seguidos (vendedor) | `401` sempre | `401 401 401 401 401` **`429`** |
| 4 | Cadastro com `"id": 4` (cliente existente) | Sobrescreve o cliente 4 | Cria o cliente **5**; o cliente 4 fica **inalterado** |
| 5 | `PUT /api/clientes/5` com o e-mail do cliente 4 | 500 com detalhes do banco | **409** "E-mail já cadastrado" |
| 6 | `POST /api/compras` com `clienteId` inexistente | 500 | **404** "Cliente não encontrado" |
| 7 | `GET /iot/status/x" or r["vin"] != "` | Texto injetado na consulta Flux | **400** "VIN inválido. Use apenas letras e números." |

### 4.2 Testes de regressão (nada parou de funcionar)

| Teste | Resultado |
|---|---|
| `mvnw clean package` | ✅ Compilou |
| 22 testes automatizados (17 novos + `ClienteSessionServiceTest` e `VehicleDocumentServiceTest`) | ✅ Passaram |
| Migrações Flyway V2, V3 e V4 | ✅ Aplicadas |
| Login correto do cliente | ✅ 200, com `accessToken` |
| Senha errada do cliente | ✅ 401 |
| Login do vendedor padrão | ✅ 200 |
| Documentos sem token | ✅ 401 (proteção do grupo mantida) |
| Front do cliente (`localhost:8080`) e do vendedor (`localhost:8081`) | ✅ Carregam e usam a API local |
| Back-end conectado ao MQTT, recebendo mensagens do simulador | ✅ "CONECTADO MQTT" |

Os clientes de teste criados (ids 4 e 5) foram apagados depois dos testes.

---

## 5. O que NÃO foi alterado

| Item | Por quê |
|---|---|
| Fronts web e apps mobile | Nenhuma alteração; o formato das requisições e respostas continua igual |
| Banco de dados / migrações | Nenhuma migração nova |
| `docker-compose.yml`, `.env`, variáveis de ambiente | Nenhuma variável nova; o deploy na AWS não muda. No `application.properties`, só o log de SQL foi desligado |
| CORS, senhas de usuários internos, autenticação das demais rotas | Exigem mudanças na AWS, nos fronts ou no banco; ficaram como mitigação planejada (seção 6.2 do relatório) |

---

## 6. Problemas encontrados que já existiam (não causados pelas correções)

| Problema | Onde | Efeito |
|---|---|---|
| Cliente do InfluxDB criado sem a organização (`org`) | `config/InfluxConfig.java` | `GET /iot/status/{vin}` responde 500 mesmo com um VIN válido |
| Endereço do MQTT fixo no código (`tcp://mqtt:1883`), ignorando a variável `MQTT_BROKER` | `services/MqttConsumerService.java:39` | O back-end só recebe as mensagens do simulador se estiver na mesma rede Docker da IoT |
| App mobile do vendedor preenche a senha do cliente a partir da resposta da API | `mobile-vendedor/app-mobile/app/(tabs)/clientes.tsx:188` | Como a API não devolve mais a senha (mudança do grupo), editar um cliente pelo app exige uma senha nova |

---

## 7. Alterações feitas só na máquina local (fora do Git)

| O quê | Por quê |
|---|---|
| Remoto `origin` passou a apontar para `ToyotaACE/ProjetoIntegrador`, e o vínculo com o repositório antigo foi removido | Pedido da integrante |
| `main` local sincronizada com `origin/main` (`61109bd`) | Pedido da integrante |
| Branch antiga renomeada para `ciberseguranca-antiga` | Guarda o trabalho feito sobre o código antigo |
| `.env.local` nos dois fronts com `VITE_API_URL=http://localhost:8083/api` | Fazer os fronts usarem a API local com as correções; o arquivo é ignorado pelo Git |
| `npm install` nos dois fronts | Instalar dependências; a alteração gerada no `package-lock.json` foi desfeita |
| Container `toyota_backend` ligado à rede Docker `iot_default` | Contornar o endereço MQTT fixo no código (seção 6) sem alterar o código |

---

## 8. Como rodar o projeto completo localmente

```bash
# 1) IoT: MQTT, simulador, Node-RED, InfluxDB, Grafana
cd 3semestre/iot
docker compose up --build -d

# 2) Banco + API
cd ../Back-ToyotaACE/Back-Toya
docker compose up --build -d
docker network connect iot_default toyota_backend   # para o back-end achar o "mqtt"
docker restart toyota_backend

# 3) Front do cliente
cd ../../front-toyotaACE-cliente/Aplicativo/Front_toyota_ace
npm install
npx vite --port 8080

# 4) Front do vendedor (outro terminal)
cd 3semestre/Toyota-ACE-Vendedor/Toyota-ACE-Vendedor/Aplicativo/Front_toyota_ace
npm install
npx vite --port 8081
```

| Serviço | Endereço | Acesso |
|---|---|---|
| Front do cliente | http://localhost:8080 | Cadastre um cliente (CPF com 11 números e senha forte) |
| Front do vendedor | http://localhost:8081 | `vendedor@toyota.com` / `123456` (credencial padrão local) |
| API | http://localhost:8083 | — |
| Node-RED | http://localhost:1880 | — |
| InfluxDB | http://localhost:8086 | `admin` / `admin123` (definido no `iot/docker-compose.yml`) |
| Grafana | http://localhost:3000 | `admin` / `admin` (padrão da imagem; pede troca no primeiro acesso) |

---

## 9. Próximos passos recomendados

1. Revisar a branch `ciberseguranca` e abrir um Pull Request para a `main`: https://github.com/ToyotaACE/ProjetoIntegrador/pull/new/ciberseguranca
2. Pedir que a pessoa cujo e-mail estava no `Back-Toya/README.md` troque a senha, porque os dados continuam no histórico do Git.
3. Trocar a senha `123456` dos usuários padrão no ambiente da AWS.
4. Próxima etapa (exige mudanças na AWS, nos fronts e no banco): exigir token em todas as rotas, adotar BCrypt nos usuários internos, restringir o CORS e mover os segredos para variáveis de ambiente.
