# Guia de Testes Automatizados de Segurança — Toyota ACE

Guia para executar as ferramentas de varredura contra o sistema em execução.
Cada resultado deve ser capturado (print) e inserido no `RELATORIO_SEGURANCA.md`
nos campos marcados com `[INSERIR PRINT]`.

> **Autorização:** execute somente contra o ambiente local abaixo ou contra um
> ambiente de propriedade do grupo com autorização explícita. A URL da AWS
> (`https://le42wmnr99.execute-api.us-east-1.amazonaws.com/prod/api`) só deve ser
> usada se a conta for do grupo — varreduras ativas geram tráfego e custo.

---

## 0. Preparar o ambiente local

```bash
# 1) Banco + API (porta 8083)
cd 3semestre/Back-ToyotaACE/Back-Toya
docker compose up --build

# 2) Front do cliente (porta 8080)
cd 3semestre/front-toyotaACE-cliente/Aplicativo/Front_toyota_ace
npm install
echo VITE_API_URL=http://localhost:8083/api > .env.local
npm run dev

# 3) Front do vendedor (vai subir na 8081, pois a 8080 já estará ocupada)
cd 3semestre/Toyota-ACE-Vendedor/Toyota-ACE-Vendedor/Aplicativo/Front_toyota_ace
npm install
echo VITE_API_URL=http://localhost:8083/api > .env.local
npm run dev
```

Alvos usados abaixo:

| Variável | Valor |
|---|---|
| `API` | `http://localhost:8083` |
| `FRONT_CLIENTE` | `http://localhost:8080` |
| `FRONT_VENDEDOR` | `http://localhost:8081` |

Dentro de containers Docker (ZAP, WPScan), troque `localhost` por
`host.docker.internal` (Docker Desktop no Windows/Mac).

Antes de começar, cadastre um cliente de teste pelo front (ex.: `teste@teste.com`)
para que as listagens da API retornem dados.

---

## 1. OWASP ZAP

### 1.1 Varredura passiva (baseline) — front do cliente

```bash
docker run --rm -v "%cd%:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable ^
  zap-baseline.py -t http://host.docker.internal:8080 -r zap-baseline-front.html
```

(No Git Bash/Linux, troque `"%cd%"` por `"$(pwd)"` e `^` por `\`.)

### 1.2 Varredura ativa (full scan) — front do cliente

```bash
docker run --rm -v "%cd%:/zap/wrk:rw" -t ghcr.io/zaproxy/zaproxy:stable ^
  zap-full-scan.py -t http://host.docker.internal:8080 -r zap-full-front.html
```

### 1.3 API via proxy (modo gráfico) — recomendado

A API não tem página/OpenAPI, então o ZAP precisa "ver" as chamadas:

1. Abra o ZAP Desktop → *Tools > Options > Network > Local Servers/Proxies* → porta **8090**
   (a 8080 já está com o front).
2. Abra o navegador pelo botão **Manual Explore** do ZAP com `http://localhost:8080`.
3. Faça login, abra Dashboard, Financiamento, Agendamento, Perfil e Loja.
4. No painel *Sites*, clique com o botão direito em `http://localhost:8083` → **Attack > Active Scan**.
5. *Report > Generate Report* → HTML.

**O que observar:**
- Alertas de **headers ausentes**: `Content-Security-Policy`, `X-Frame-Options`/anti-clickjacking,
  `X-Content-Type-Options`, `Strict-Transport-Security`.
- **CORS** permissivo (`Access-Control-Allow-Origin: *`).
- **Information Disclosure** — respostas JSON contendo o campo `senha`.
- **Application Error Disclosure** em respostas 500.
- **SQL Injection** (esperado: não encontrado — a API usa Spring Data JPA).

`[INSERIR PRINT]` — resumo de alertas do ZAP (front e API).

---

## 2. Wapiti

```bash
pip install wapiti3

# Front do cliente
wapiti -u http://localhost:8080/ -f html -o ./wapiti-front

# API — informar pontos de partida, pois a API não tem links navegáveis
wapiti -u http://localhost:8083/api/ --scope folder ^
  -s http://localhost:8083/api/clientes ^
  -s http://localhost:8083/api/usuarios ^
  -s http://localhost:8083/api/agendamentos ^
  -s http://localhost:8083/api/veiculos/1 ^
  -s http://localhost:8083/api/compras/cliente/1 ^
  -f html -o ./wapiti-api
```

**O que observar:** módulos `http_headers` / `csp` / `cookieflags` (headers de segurança
faltando), `sql` / `exec` / `xss` (esperado: sem achados), `methods` (métodos HTTP
permitidos, ex.: `PUT`/`DELETE` sem autenticação).

`[INSERIR PRINT]` — relatório HTML do Wapiti.

---

## 3. GoLismero

> GoLismero é um projeto antigo (Python 2.7, sem manutenção). Rode em uma VM Kali
> antiga ou em um container com Python 2.7. Se não conseguir instalar, registre no
> relatório que a ferramenta foi descontinuada e cite a tentativa.

```bash
git clone https://github.com/golismero/golismero.git
cd golismero
pip2 install -r requirements.txt

python2 golismero.py scan http://localhost:8083 -o golismero-api.html
python2 golismero.py scan http://localhost:8080 -o golismero-front.html
```

**O que observar:** fingerprint do servidor (Tomcat/Spring), portas e serviços,
headers ausentes, e se ele integra resultados do Nikto (plugin `nikto` se instalado).

`[INSERIR PRINT]` — saída/relatório do GoLismero.

---

## 4. Nikto

```bash
# Kali / Linux:  sudo apt install nikto
nikto -h http://localhost:8083 -o nikto-api.html -Format htm
nikto -h http://localhost:8080 -o nikto-front.html -Format htm
```

**O que observar:**
- `The anti-clickjacking X-Frame-Options header is not present`
- `The X-Content-Type-Options header is not set`
- Métodos HTTP permitidos (`OPTIONS`, `PUT`, `DELETE`)
- Páginas de erro padrão (Whitelabel Error Page do Spring)

`[INSERIR PRINT]` — saída do Nikto.

---

## 5. WPScan

```bash
docker run -it --rm wpscanteam/wpscan --url http://host.docker.internal:8080 --enumerate vp
```

**O que observar / resultado esperado:** a mensagem
`Scan Aborted: The remote website is up, but does not seem to be running WordPress.`
O Toyota ACE é React + Spring Boot, portanto a ferramenta **não se aplica**. Registre
o print como evidência de que a verificação foi feita e o resultado é negativo.

`[INSERIR PRINT]` — saída do WPScan.

---

## 6. Antes x depois

Depois que as correções da branch `cecilia-ciberseguranca` forem aplicadas, repita
o ZAP (1.3) e o Nikto (4) contra a API e guarde os prints "depois" para a seção
de Conclusão do relatório.
