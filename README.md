# Assimilação RPG - Gerenciador de Fichas

Este é um gerenciador de fichas interativo e simulador de rolagens 3D para o sistema de RPG **Assimilação**. Desenvolvido com uma interface moderna e responsiva (estilo *glassmorphism* escuro), o aplicativo facilita o controle de atributos, pontos de vida, determinação, pressões e a aquisição de mutações através de uma mecânica inspirada na leitura de cartas de Tarô.

---

## 🚀 Funcionalidades Principais

* **Ficha de Personagem Completa**:
  * Controle intuitivo de **Aptidões** (Instintos, Conhecimentos e Práticas) diretamente clicando nas bolhas (*bubbles*) de nível.
  * Ajuste de aptidões atualiza automaticamente os limites de **Saúde** (calculados com base em Potência e Resolução).
  * Campos de entrada matemática inteligente para **Determinação** e **Assimilação** (aceitando entradas como `+1`, `-2` ou valores absolutos).

* **Simulador de Dados 3D**:
  * Rolador de dados integrado com física realista 3D (suporta dados D6, D10 e D12 personalizados do sistema).
  * Histórico e registro de rolagens detalhado no chat do aplicativo.

* **Painel de Assimilações & Leitura de Tarô**:
  * Aba exclusiva para gerenciar as mutações adquiridas pelo personagem.
  * Modal interativo de sorteio de cartas de mutação inspirado na leitura de Tarô (cartas viradas para baixo com o sigil de Assimilação).
  * O sorteio gera cartas dinamicamente de acordo com os resultados do teste de repouso:
    * **Sucessos [S]**: Cartas de Assimilações Evolutivas.
    * **Adaptações [A]**: Cartas de Assimilações Adaptativas.
    * **Pressões [P]**: Cartas de Assimilações Inoportunas.
  * Suporte para incluir cartas de **Mutações Singulares** (Região dos Paus) durante o sorteio.
  * Validação automática de custos de pressão e aptidão antes de comprar as cartas.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5** & **CSS3 Vanilla** (Estilização personalizada, variáveis CSS e efeitos de vidro/blur).
* **JavaScript Moderno (ES6+)** (Arquitetura modularizada e controle de estado).
* **Three.js** & **Cannon.js** (Motor 3D e física para a renderização realista dos dados).

---

## 💻 Como Executar Localmente

Como o projeto é totalmente estático, você não precisa de nenhum compilador ou banco de dados. Basta ter um servidor web local simples instalado (como o Node.js `serve` ou a extensão Live Server do VS Code).

### Usando o Node.js:
1. Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.
2. Na pasta raiz do projeto, execute:
   ```bash
   npx serve .
   ```
3. Abra o navegador no endereço indicado (geralmente `http://localhost:3000`).

---

## 🌐 Publicação no GitHub Pages

Este projeto está pronto para ser hospedado gratuitamente no GitHub Pages. Para publicar:

1. Faça o push do seu código para um repositório no GitHub:
   ```bash
   git push origin master
   ```
2. No seu repositório no GitHub, acesse **Settings** (Configurações) > **Pages**.
3. Em **Build and deployment**, selecione a branch `master` (ou `main`) e a pasta raiz `/(root)`.
4. Clique em **Save**. Em alguns minutos, seu gerenciador estará online no endereço `https://seu-usuario.github.io/nome-do-repositorio/`.
