# ✨Repositório dedicado ao **Projeto Integrador** "**Toyota ACE**" | Curso Superior em Análise e Desenvolvimento de Sistemas

<h3>Comandos - Guia Rápido Toyota ACE no Windows </h3> 

## 1. Baixar o Código
Abra o terminal e clone o projeto:
```bash
git clone https://github.com/ToyotaACE/ProjetoIntegrador
```

## 2. Iniciar o Banco de Dados (PostgreSQL)
Abra um terminal (PowerShell), navegue até a pasta do back-end e suba o banco de dados:
```powershell
cd 3semestre\Back-ToyotaACE\Back-Toya
docker compose up -d postgres
```

## 3. Iniciar o Back-end (Spring Boot)
No mesmo terminal, rode o comando abaixo para baixar as dependências e subir a API:
```powershell
.\mvnw.cmd spring-boot:run
```

## 4. Iniciar o Front-end (React/Vite)
Abra um **novo terminal**, navegue até a pasta do front-end, instale as dependências e inicie o projeto:
```powershell
cd 3semestre\front-toyotaACE-cliente\Aplicativo\Front_toyota_ace
npm install
npm run dev
```

## 5. Primeiro Acesso e Dados de Teste
Após criar sua conta na interface (http://localhost:8080/cadastro), abra um **terceiro terminal (PowerShell)** e rode o script abaixo para cadastrar um veículo via API e vincular à sua conta (assumindo que seu `clienteId` é 1):
```powershell
$body = @{
    clienteId = 1; marcaVeiculo = "Toyota"; modeloVeiculo = "Corolla Cross"; anoVeiculo = "2025"
    corVeiculo = "Prata"; placaVeiculo = "ABC1023"; motorVeiculo = "2.0 Hybrid"; combustivelVeiculo = "Flex"
    cambioVeiculo = "CVT"; statusVeiculo = "PEDIDO REALIZADO"; progressoVeiculo = 0; valorTotal = 183000
    valorEntrada = 100000; valorFinanciado = 83000; parcelasTotais = 48; parcelasPagas = 0; parcelasRestantes = 48
    valorParcela = 2200; taxaJuros = 1.5; statusFinanciamento = "ATIVO"; statusGarantia = "ATIVA"
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8083/api/veiculos -ContentType "application/json" -Body $body
```

<img width="1536" height="1024" alt="Guia Rápido Toyota ACE no Windows" src="https://github.com/user-attachments/assets/46aead41-3e14-4b48-b803-4610591b036c" />

<br>

<h3>4º Semestre</h3> 

### 📲 1. Desenvolvimento Mobile
#### Foca na criação e manutenção de aplicativos para dispositivos móveis, garantindo boa usabilidade, performance e consumo eficiente de APIs.
No projeto Toyota ACE, é a frente responsável por criar a interface nativa ou multiplataforma que permite ao cliente (ou gestor) acompanhar o processo de fabricação, logística e entrega do veículo na palma da mão.
##### Docente: Glauco Todesco

<br>

### 💻 2. Desenvolvimento Web
#### Aborda a construção de sistemas para navegadores, envolvendo o desenvolvimento Front-end e Back-end, responsividade e integração de sistemas.
No projeto Toyota ACE, engloba os painéis administrativos e os dashboards de visualização do chão de fábrica e logística, permitindo que a equipe interna gerencie os dados com eficiência através do navegador.
##### Docente: Glauco Todesco

<br>

### 🛡️ 3. Cybersegurança
#### Estuda a proteção de sistemas, redes e dados contra ataques cibernéticos. Envolve criptografia, autenticação segura, testes de vulnerabilidade e adequação à LGPD.
No projeto Toyota ACE, garante que as informações dos clientes, os dados de telemetria da fábrica e o acesso às aplicações (Web e Mobile) estejam protegidos contra interceptações e acessos não autorizados.
##### Docente: Cainã Antunes

<br>

### 📊 4. Gestão de Projetos
#### Foca no planejamento, execução e monitoramento do projeto utilizando metodologias ágeis (como Scrum e Kanban). Envolve a delegação de tarefas, controle de prazos e alinhamento da equipe.
No projeto Toyota ACE, assegura a entrega contínua de valor por meio do acompanhamento rigoroso dos cards e sprints, garantindo que o desenvolvimento Web, Mobile e de Segurança andem em sincronia.
##### Docente: Deivison Takatu

<br>

### 📋 Quadro de Tarefas (Kanban)
O acompanhamento do desenvolvimento e a delegação das atividades de cada disciplina são realizados através do nosso quadro ágil:

🔗 **[[View 1 · KANBAN - Toyota ACE 4° Semestre](#)]**  

Neste quadro, os tickets/cards estão organizados para refletir a delegação clara de responsabilidades nas áreas de **Mobile**, **Web**, **Cyber Segurança** e **Gestão de Projetos**, permitindo rastreabilidade e organização do fluxo de trabalho da equipe.

<br>

### 🫂 Integrantes
| Integrante | Responsabilidades |
| --- | --- |
| **Aline** | Documentação |
| **Cecilia** | Documentação, Frontend, Figma |
| **Graciele** | Documentação |
| **Hebert** | Frontend (web) |
| **Isabelle** | Figma, Backend (mobile) |
| **Isadora** | Documentação, Kanban, Figma, Cibersegurança |
| **Rafael** | Backend (web), Cloud Computing |
| **Rayan** | Frontend (mobile) |
