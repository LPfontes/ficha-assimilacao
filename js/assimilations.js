export const ASSIMILACOES = {
  evolutivas: {
    suit: "Sucesso",
    suitSymbol: "♥",
    nome: "Assimilações Evolutivas",
    descricao: "Desenvolvem o corpo sem deformidades ou dor, ampliando habilidades naturais.",
    cartas: [
      {
        carta: "Ás de Sucesso",
        nome: "Assimilação Sensitiva",
        mutações: [
          { cost: "1 sucesso", name: "Sensibilidade", desc: "Gasta 1 Ponto de Determinação para sentir a presença de criaturas assimiladas em até 30m pela cena." },
          { cost: "2 sucessos", name: "Consciência", desc: "Mantenha um dado adicional em qualquer teste que inclua Percepção." },
          { cost: "3 sucessos", name: "Discernimento", desc: "Adicione Adaptação a um dado mantido que já possua Adaptação nos testes de Ação." },
          { cost: "4 sucessos", name: "Presciência", req: 3, desc: "3+ Ponto de Assimilação: No início da sessão, rola 2 dados Ponto de Determinação substitui por rolagens da mesa posteriormente." },
          { cost: "5 sucessos", name: "Complicar", req: 5, desc: "5+ Ponto de Assimilação: Gasta 1 Ponto de Determinação para fazer alguém rolar novamente um dado." },
          { cost: "6 sucessos", name: "Vidência", req: 7, desc: "7+ Ponto de Assimilação: Prevê Crises, permitindo ao Assimilador adiar seu efeito por até 24h para contra-medidas." }
        ]
      },
      {
        carta: "2 de Sucesso",
        nome: "Assimilação Reativa",
        mutações: [
          { cost: "1 sucesso", name: "Ligeiro", desc: "Recebe +1 ponto em Reação (pode ultrapassar o limite máximo)." },
          { cost: "2 sucessos", name: "Rápido", desc: "Sempre que realizar teste com Reação, pode gastar 1 Ponto de Determinação para adicionar Sucesso." },
          { cost: "3 sucessos", name: "Preciso", desc: "Sempre que realizar teste com Reação, anula as Pressão do resultado." },
          { cost: "4 sucessos", name: "Alígero", req: 3, desc: "3+ Ponto de Assimilação: Sempre que realizar teste com Reação, substitui as Adaptação por Sucesso." },
          { cost: "5 sucessos", name: "Hábil", req: 5, desc: "5+ Ponto de Assimilação: +1 Sucesso em testes de Reação (acumula com Rápido)." },
          { cost: "6 sucessos", name: "Celeridade", req: 7, desc: "7+ Ponto de Assimilação: Substitui todos os d6 por d10 (ou 6 por 1) na pilha de Reação." }
        ]
      },
      {
        carta: "3 de Sucesso",
        nome: "Assimilação Sensorial",
        mutações: [
          { cost: "1 sucesso", name: "Perceptivo", desc: "Recebe +1 ponto em Percepção (pode ultrapassar o limite máximo)." },
          { cost: "2 sucessos", name: "Alerta", desc: "Sempre que realizar teste com Percepção, pode usar 1 Ponto de Determinação para adicionar Sucesso." },
          { cost: "3 sucessos", name: "Detalhista", desc: "Sempre que realizar teste com Percepção, anula as Pressão do resultado." },
          { cost: "4 sucessos", name: "Meticuloso", req: 3, desc: "3+ Ponto de Assimilação: Sempre que realizar teste com Percepção, substitui as Adaptação por Sucesso." },
          { cost: "5 sucessos", name: "Arguto", req: 5, desc: "5+ Ponto de Assimilação: +1 Sucesso em testes de Percepção (acumula com Alerta)." },
          { cost: "6 sucessos", name: "Intuitivo", req: 7, desc: "7+ Ponto de Assimilação: Substitui todos os d6 por d10 (ou 6 por 1) na pilha de Percepção." }
        ]
      },
      {
        carta: "4 de Sucesso",
        nome: "Assimilação Vigorosa",
        mutações: [
          { cost: "1 sucesso", name: "Resoluto", desc: "Recebe um ponto em Resolução – pode ultrapassar o limite máximo." },
          { cost: "2 sucessos", name: "Resistente", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, você pode usar um Ponto de Determinação para adicionar Sucesso ao resultado." },
          { cost: "3 sucessos", name: "Firme", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, anule Pressão no resultado." },
          { cost: "4 sucessos", name: "Vigoroso", req: 3, desc: "3+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, você pode substituir qualquer quantidade de Adaptação no resultado por Sucesso." },
          { cost: "5 sucessos", name: "Persistente", req: 5, desc: "5+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Resistente, acumulando os efeitos." },
          { cost: "6 sucessos", name: "Inabalável", req: 7, desc: "7+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, substitua todos os 6 por 1 na pilha de dados." }
        ]
      },
      {
        carta: "5 de Sucesso",
        nome: "Assimilação Persuasiva",
        mutações: [
          { cost: "1 sucesso", name: "Influente", desc: "Recebe um ponto em Influência – pode ultrapassar o limite máximo." },
          { cost: "2 sucessos", name: "Persuasivo", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, você pode usar um Ponto de Determinação para adicionar Sucesso ao resultado." },
          { cost: "3 sucessos", name: "Convincente", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, anule Pressão no resultado." },
          { cost: "4 sucessos", name: "Magnético", req: 3, desc: "3+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, você pode substituir qualquer quantidade de Adaptação no resultado por Sucesso." },
          { cost: "5 sucessos", name: "Carismático", req: 5, desc: "5+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, adicione Sucesso ao resultado. Pode ser ativado com Persuasivo, acumulando os efeitos." },
          { cost: "6 sucessos", name: "Majestoso", req: 7, desc: "7+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, substitua todos os 6 por 1 na pilha de dados." }
        ]
      },
      {
        carta: "6 de Sucesso",
        nome: "Assimilação Brutal",
        mutações: [
          { cost: "1 sucesso", name: "Forte", desc: "Recebe um ponto em Potência – pode ultrapassar o limite máximo." },
          { cost: "2 sucessos", name: "Robusto", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, você pode usar um Ponto de Determinação para adicionar Sucesso ao resultado." },
          { cost: "3 sucessos", name: "Pujante", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, anule Pressão no resultado." },
          { cost: "4 sucessos", name: "Potente", req: 3, desc: "3+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, você pode substituir qualquer quantidade de Adaptação no resultado por Sucesso." },
          { cost: "5 sucessos", name: "Agressivo", req: 5, desc: "5+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Robusto, acumulando os efeitos." },
          { cost: "6 sucessos", name: "Devastador", req: 7, desc: "7+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, substitua todos os 6 por 1 na pilha de dados." }
        ]
      },
      {
        carta: "7 de Sucesso",
        nome: "Assimilação Perspicaz",
        mutações: [
          { cost: "1 sucesso", name: "Sagaz", desc: "Recebe um ponto em Sagacidade – pode ultrapassar o limite máximo." },
          { cost: "2 sucessos", name: "Mente Assimilada", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, você pode usar um Ponto de Determinação para adicionar Sucesso ao resultado." },
          { cost: "3 sucessos", name: "Perfeccionista", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, anule Pressão no resultado." },
          { cost: "4 sucessos", name: "Solerte", req: 3, desc: "3+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, você pode substituir qualquer quantidade de Adaptação no resultado por Sucesso." },
          { cost: "5 sucessos", name: "Potência Mental", req: 5, desc: "5+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Mente Assimilada, acumulando os efeitos." },
          { cost: "6 sucessos", name: "Genialidade", req: 7, desc: "7+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, substitua todos os 6 por 1 na pilha de dados." }
        ]
      },
      {
        carta: "8 de Sucesso",
        nome: "Assimilação Regenerativa",
        mutações: [
          { cost: "1 sucesso", name: "Resistente", desc: "Ignora a penalidade do S 4 (Laceração)." },
          { cost: "2 sucessos", name: "Resiliente", desc: "Pode se Regenerar sem ajuda médica mesmo quando reduzido ao S 2 (Debilitação) no Tempo de Recuperação de uma semana." },
          { cost: "3 sucessos", name: "Vigoroso", desc: "Recebe um ponto de vida adicional em cada Nível de Gravidade." },
          { cost: "4 sucessos", name: "Restauração", req: 3, desc: "3+ Ponto de Assimilação: Ao concluir uma Recuperação, dobre os pontos de vida Regenerados." },
          { cost: "5 sucessos", name: "Recuperação", req: 5, desc: "5+ Ponto de Assimilação: Regenera uma quantidade de pontos de vida igual à soma de Resolução Ponto de Determinação Potência após cada cena." },
          { cost: "6 sucessos", name: "Reintegração", req: 7, desc: "7+ Ponto de Assimilação: É capaz de se regenerar completamente em apenas um dia desde que não perca seu último ponto de vida, incluindo partes perdidas do corpo Ponto de Determinação sequelas ou cicatrizes." }
        ]
      },
      {
        carta: "9 de Sucesso",
        nome: "Assimilação Silvestre",
        mutações: [
          { cost: "1 sucesso", name: "Sintonia Natural", desc: "Recebe um ponto em Biologia – pode ultrapassar o limite máximo." },
          { cost: "2 sucessos", name: "Cura Verde", desc: "Pode gastar um Ponto de Determinação para reavivar toda vegetação morta ou severamente danificada que esteja a até cinco metros, restaurando seu estado saudável original." },
          { cost: "3 sucessos", name: "Fotossíntese", desc: "Realiza fotossíntese completa que o torna esverdeado. Não precisa consumir alimentos. Basta o consumo habitual de água, contato direto com o solo Ponto de Determinação exposição à luz solar por duas horas diárias." },
          { cost: "4 sucessos", name: "Animalismo", req: 3, desc: "3+ Ponto de Assimilação: Sempre que o(a) Infectado(a) realizar um teste para influenciar o comportamento de animais, adicione 2 Sucessos ao resultado." },
          { cost: "5 sucessos", name: "Refúgio Natural", req: 5, desc: "5+ Ponto de Assimilação: Estabelece um Refúgio Vivo em áreas naturais que equivale a um Refúgio de Nível 4 Ponto de Determinação se fortalece com a presença contínua do(a) Infectado(a)." },
          { cost: "6 sucessos", name: "Gênese", req: 7, desc: "7+ Ponto de Assimilação: Gaste todos seus Ponto de Determinação para flora e fauna locais crescerem violentamente em raio de 1km por Ponto de Determinação gasto, obedecendo à sua vontade." }
        ]
      },
      {
        carta: "10 de Sucesso",
        nome: "Assimilação Opressora",
        mutações: [
          { cost: "1 sucesso", name: "Aproveitador", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, adicione Adaptação ao resultado se o alvo estiver em posição de inferioridade ou dúvida." },
          { cost: "2 sucessos", name: "Sugestão", desc: "Gaste um Ponto de Determinação para forçar um alvo hesitante a seguir uma sugestão simples, sem colocá-lo em risco." },
          { cost: "3 sucessos", name: "Condicionamento", desc: "Após um teste bem-sucedido que inclua Influência, o(a) Infectado(a) pode repetir a mesma frase ou comando para outro alvo da cena repetindo o resultado sem rolar novo teste." },
          { cost: "4 sucessos", name: "Imposição", req: 3, desc: "3+ Ponto de Assimilação: Mantenha um dado adicional em testes que incluam Influência em locais pacíficos." },
          { cost: "5 sucessos", name: "Mesmerizar", req: 5, desc: "5+ Ponto de Assimilação: Ao obter 2 Sucessos ou mais em um teste que inclua Influência, pode impor uma condição narrativa ao alvo até o fim da cena." },
          { cost: "6 sucessos", name: "Dominância", req: 7, desc: "7+ Ponto de Assimilação: Adiciona seus pontos de Expressão à Defesa de seu Refúgio." }
        ]
      },
      {
        carta: "Valete de Sucesso",
        nome: "Assimilação Esguia",
        mutações: [
          { cost: "1 sucesso", name: "Infiltrador", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Furtividade em ambiente urbano ou construído, adicione um Sucesso ao resultado." },
          { cost: "2 sucessos", name: "Pulso Sombrio", desc: "Gaste um Ponto de Determinação para anular o resultado em um teste que inclua Furtividade. Role novamente Ponto de Determinação mantenha o novo resultado uma vez por teste." },
          { cost: "3 sucessos", name: "Esguio", desc: "Após executar Ação de Fuga do Conflito, se o(a) Infectado(a) não for o único alvo viável de uma ativação de Ameaça, outro alvo deve ser escolhido." },
          { cost: "4 sucessos", name: "Subterfúgio", req: 3, desc: "3+ Ponto de Assimilação: O(a) Infectado(a) só precisa de um Sucesso para ter êxito em qualquer teste que inclua Furtividade fora de Conflito." },
          { cost: "5 sucessos", name: "Auxílio das Sombras", req: 5, desc: "5+ Ponto de Assimilação: O(a) Infectado(a) adiciona Adaptação à face de cada dado de Furtividade mantido." },
          { cost: "6 sucessos", name: "Ofuscação", req: 7, desc: "7+ Ponto de Assimilação: O(a) Infectado(a) adiciona Sucesso à face de todos os dados em testes que incluam Furtividade." }
        ]
      },
      {
        carta: "Dama de Sucesso",
        nome: "Assimilação Indomável",
        mutações: [
          { cost: "1 sucesso", name: "Fôlego Raro", desc: "Adiciona Sucesso ao resultado em testes que incluam Atletismo com esforço contínuo – resistência, natação, escalada, etc." },
          { cost: "2 sucessos", name: "Perseverança", desc: "Gaste um Ponto de Determinação para manter clareza e força de vontade ao entrar no Estado Suscetível, permitindo usar Determinação do nível seguinte." },
          { cost: "3 sucessos", name: "Disposição", desc: "Sempre que realizar um teste que inclua Atletismo, mantenha um dado adicional." },
          { cost: "4 sucessos", name: "Obstinação", req: 3, desc: "3+ Ponto de Assimilação: Ao obter 2 ou mais em um teste de Atletismo, restaura um Ponto de Determinação no fim da cena." },
          { cost: "5 sucessos", name: "Irredutível", req: 5, desc: "5+ Ponto de Assimilação: Gaste dois Ponto de Determinação para ignorar qualquer penalidade decorrente da redução do atributo físico na rodada." },
          { cost: "6 sucessos", name: "Intrépido", req: 7, desc: "7+ Ponto de Assimilação: O(a) Infectado(a) é imune a qualquer efeito que geraria penalidades externas ou o impediria de agir normalmente." }
        ]
      },
      {
        carta: "Rei de Sucesso",
        nome: "Assimilação Primordial",
        mutações: [
          { cost: "1 sucesso", name: "Primal", desc: "O primeiro Ponto de Determinação utilizado pelo(a) Infectado(a) em cada cena de Conflito é gratuito." },
          { cost: "2 sucessos", name: "Supressor", desc: "Gaste um Ponto de Determinação para anular Pressão no resultado de qualquer teste do(a) Infectado(a) em Conflito." },
          { cost: "3 sucessos", name: "Subjugar", desc: "Em cenas de Conflito, quando investe pontos em Neutralizar Ameaça, se o(a) Infectado(a) tem maior Ponto de Determinação que o alvo, aumente em dois Sucessos o resultado." },
          { cost: "4 sucessos", name: "Proeza", req: 3, desc: "3+ Ponto de Assimilação: Gasta dois Ponto de Determinação para substituir o nível no Instinto selecionado para o teste pelo seu Ponto de Determinação para definir a pilha de dados rolados." },
          { cost: "5 sucessos", name: "Sinergia", req: 5, desc: "5+ Ponto de Assimilação: Consegue pagar custos de Ponto de Determinação utilizados por aliados." },
          { cost: "6 sucessos", name: "Poder Inesgotável", req: 7, desc: "7+ Ponto de Assimilação: Não gasta Ponto de Determinação para as próprias ativações." }
        ]
      }
    ]
  },
  adaptativas: {
    suit: "Adaptação",
    suitSymbol: "♦",
    nome: "Assimilações Adaptativas",
    descricao: "Vantagens adaptativas físicas com algumas consequências estéticas ou fisiológicas secundárias.",
    cartas: [
      {
        carta: "Ás de Adaptação",
        nome: "Assimilação Anatômica",
        mutações: [
          { cost: "1 adptação", name: "Presas Aumentadas", desc: "Gasta um Ponto de Determinação para usar a característica Letal ao morder. Depois de ingerir carne crua, ignora o custo pelas próximas 4 horas." },
          { cost: "2 adptações", name: "Nadadeiras", desc: "Gasta um e para se deslocar debaixo d'água na velocidade normal. Perde um nível em Furtividade (mínimo 0)." },
          { cost: "3 adptações", name: "Guelras", desc: "Guelras funcionais se formam nas laterais do pescoço, permitindo respirar debaixo d’água, porém consome o dobro de água." },
          { cost: "4 adptações", name: "Braços Alongados", req: 3, desc: "3+ Ponto de Assimilação: Os braços se alongam. Quando investe em Neutralizar Ameaça, o alvo perde Pressão no turno seguinte. Perde um nível em Manufaturas (mínimo 0)." },
          { cost: "5 adptações", name: "Poder de carga", req: 5, desc: "5+ Ponto de Assimilação: Permite carregar o triplo da carga normal e dobra os pontos investidos em Neutralização de Ameaça. Perde permanentemente todos os níveis em Manufaturas." },
          { cost: "6 adptações", name: "Alado", req: 7, desc: "7+ Ponto de Assimilação: Asas de queratina permitem voo pleno. Ações de Fuga recebem 2 Sucessos adicionais. Impede o uso de coletes, mochilas ou vestimentas nos ombros/tórax." }
        ]
      },
      {
        carta: "2 de Adaptação",
        nome: "Assimilação Cutânea",
        mutações: [
          { cost: "1 adptação", name: "Pele Aderente", desc: "Transpira substâncias adesivas. Pode se mover por paredes/tetos sem testes de Atletismo. Resultados em testes de Fuga correndo são reduzidos em um Sucesso." },
          { cost: "2 adptações", name: "Pele Ajustável", desc: "Mantenha um dado a mais em Furtividade em baixa luz. Sofre penalidade de um Sucesso em testes de Expressão sob luz direta." },
          { cost: "3 adptações", name: "Sentir Vibrações", desc: "Epiderme altamente sensível. Adicione um Sucesso em testes de Percepção tátil. Estímulos inesperados reduzem em um Sucesso testes de Reação." },
          { cost: "4 adptações", name: "Cheiro Nocivo", req: 3, desc: "3+ Ponto de Assimilação: Libera compostos que geram Pressão a seres vivos pelo restante da cena. Provoca redução de um Sucesso em testes sociais do Infectado por 2 cenas." },
          { cost: "5 adptações", name: "Mudar Corpo", req: 5, desc: "5+ Ponto de Assimilação: Gaste um e para adicionar 2 Sucessos em um teste de Furtividade, disfarce ou atuação. Roupas no tronco anulam o efeito." },
          { cost: "6 adptações", name: "Sentir o Ar", req: 7, desc: "7+ Ponto de Assimilação: Detecta sinais elétricos, calor e vibrações em raio de 3km. A pele queima sob sol direto, levando à perda de 3 pontos de vida por hora." }
        ]
      },
      {
        carta: "3 de Adaptação",
        nome: "Assimilação Camaleônica",
        mutações: [
          { cost: "1 adptação", name: "Camaleônico", desc: "Pigmentação se funde ao ambiente. Adicione um Sucesso em Furtividade ao se manter imóvel. Perde um Ponto de Determinação se sofrer queimadura de sol." },
          { cost: "2 adptações", name: "Mudar o Rosto", desc: "Altera parcialmente o formato do rosto. Mantém 1 dado adicional em testes de disfarce. Sofre penalidade de um Sucesso em Percepção auditiva." },
          { cost: "1 sucesso e 2 adptações", name: "Camuflagem", desc: "Reage reflexivamente a padrões visuais para se ocultar. Os dados de Furtividade são substituídos por 2." },
          { cost: "2 adptações e 2 pressões", name: "Visão Periférica", req: 3, desc: "3+ Ponto de Assimilação: Olhos saltam aumentando visão. +1 em Percepção (pode ultrapassar o limite). Sofre penalidade de Adaptação em testes de pontaria." },
          { cost: "2 adptações e 1 pressão", name: "Malemolência", req: 5, desc: "5+ Ponto de Assimilação: Adiciona 2 Sucessos em interações sociais. Se tentar esconder informações, sofre penalidade de Pressão adicional." },
          { cost: "2 sucessos e 4 adptações", name: "Invisibilidade", req: 7, desc: "7+ Ponto de Assimilação: Gasta um e para ficar completamente invisível pelo restante da cena. Não pode voltar a ficar visível antes do fim da cena." }
        ]
      },
      {
        carta: "4 de Adaptação",
        nome: "Assimilação Escamosa",
        mutações: [
          { cost: "1 adptação", name: "Escamoso", desc: "Reduz em 1 o dano cortante sofrido. Perde um Sucesso em testes de Expressão com pessoas não Assimiladas que desconhecem mutações." },
          { cost: "2 adptações", name: "Escalador", desc: "Anda/escala superfícies ásperas mantendo um dado adicional em Atletismo. Perde um Sucesso em Furtividade em ambientes urbanos." },
          { cost: "2 adptações e 1 pressão", name: "Escorregadio", desc: "Mantém um dado adicional para manter estabilidade. Troca de pele mensalmente, sofrendo dano dobrado por 24 horas após a troca." },
          { cost: "3 adptações e 1 pressão", name: "Escamas Reativas", req: 3, desc: "3+ Ponto de Assimilação: Escamas retaliam ao toque, causando 1 de dano a agressores ou adiciona um Sucesso para Neutralizar Ameaça. Adiciona Pressão a contatos táteis de afeto." },
          { cost: "1 sucesso e 4 adptações", name: "Evasão Natural", req: 5, desc: "5+ Ponto de Assimilação: Se alvejado, causa duas Pressões ao atacante, aumentando em duas Pressões o custo de suas ativações ou anulando 2 Sucessos." },
          { cost: "2 sucessos e 4 adptações", name: "Imunidade ao Calor", req: 7, desc: "7+ Ponto de Assimilação: Imune a dano térmico, mas se torna reluzente sob luz artificial, sofrendo penalidade de 2 Sucessos em Furtividade." }
        ]
      },
      {
        carta: "5 de Adaptação",
        nome: "Assimilação Óssea",
        mutações: [
          { cost: "1 adptação", name: "Ossos Reativos", desc: "Espículos ósseos brotam da pele. Causa 1 de dano a agressores corpo a corpo. Penalidade de um Sucesso em Expressão se expostos." },
          { cost: "2 adptações", name: "Maleabilidade", desc: "Articulações hipermóveis. Mantenha um dado adicional em Furtividade. Penalidade de um Sucesso em Atletismo de postura/equilíbrio." },
          { cost: "1 sucesso e 2 adptações", name: "Lâminas Ósseas", desc: "Lâminas nos antebraços/joelhos. Adiciona um Sucesso a ataques corpo a corpo. Adiciona Pressão a testes de Medicina/Biologia em si mesmo." },
          { cost: "3 adptações e 1 pressão", name: "Presas de Mamute", req: 3, desc: "3+ Ponto de Assimilação: Em Conflito, adiciona um Sucesso e reduz uma Adaptação no resultado de testes para Neutralizar Ameaça." },
          { cost: "2 sucessos e 3 adptações", name: "Exoesqueleto", req: 5, desc: "5+ Ponto de Assimilação: Por 3 Pontos de Determinação, projeta ossos como armadura até o fim da cena, ignorando dano cortante/perfurante (incluindo balas de médio calibre). Fica sem falar." },
          { cost: "2 sucessos e 4 adptações", name: "Gigante", req: 7, desc: "7+ Ponto de Assimilação: Por 4 Pontos de Determinação, dobra de tamanho. Testes físicos mantêm 2 dados adicionais, mas adiciona Pressão em Furtividade e Percepção." }
        ]
      },
      {
        carta: "6 de Adaptação",
        nome: "Assimilação Gastrointestinal",
        mutações: [
          { cost: "1 adptação", name: "Saliva Ácida", desc: "Consome qualquer matéria orgânica. Odor de ácidos gera penalidade de Adaptação em testes de Influência." },
          { cost: "2 adptações", name: "Ruminante", desc: "Estômago segmentado permite armazenar comida por uma semana, mas precisa ruminar após cada refeição." },
          { cost: "3 adptações", name: "Estômago Restaurador", desc: "Regenera um ponto de vida por refeição completa, mas não come comida processada." },
          { cost: "4 adptações", name: "Jato Ácido", req: 3, desc: "3+ Ponto de Assimilação: Gasta um Ponto de Determinação e um Sucesso para expelir ácido, impondo Pressão ao alvo (aumenta custos em Pressão ou reduz resultados). Saliva ácida queima ao toque." },
          { cost: "5 adptações", name: "Imunidade à Intoxicação", req: 5, desc: "5+ Ponto de Assimilação: Não sofre intoxicação ou envenenamento, mas refeições não restauram Determinação." },
          { cost: "6 adptações", name: "Glutão", req: 7, desc: "7+ Ponto de Assimilação: Come qualquer coisa mastigável. Ficar um dia sem comer causa desconforto e perda de 1 Ponto de Determinação por hora." }
        ]
      },
      {
        carta: "7 de Adaptação",
        nome: "Assimilação Respiratória",
        mutações: [
          { cost: "1 adptação", name: "Pulmão Grosso", desc: "Respira fumaça/detritos sem penalidades. Adiciona Pressão em Furtividade por respiração ruidosa." },
          { cost: "1 sucesso e 1 adptação", name: "Fôlego Estendido", desc: "Prende a respiração por 5 minutos. Odores fortes causam perda de 1 Ponto de Determinação." },
          { cost: "2 adptações e 1 pressão", name: "Sopro Poderoso", desc: "Gasta um e para expirar forte, empurrando Ameaças e dando 2 Sucessos para Fuga. Fala estrondosa reduz Adaptação em testes sociais com Furtividade." },
          { cost: "4 adptações", name: "Fôlego Inumano", req: 3, desc: "3+ Ponto de Assimilação: Com inspiração profunda, pode Agir por Instinto sem custo de Assimilação. Sofre penalidade de um dado mantido em Conhecimentos." },
          { cost: "5 adptações", name: "Fôlego Reparador", req: 5, desc: "5+ Ponto de Assimilação: Ao perder Determinação, pode perder um Ponto de Assimilação no lugar (apenas para perdas, não usos ativos)." },
          { cost: "2 sucessos e 4 adptações", name: "Fôlego Infinito", req: 7, desc: "7+ Ponto de Assimilação: Sobrevive sem ar indefinidamente. Dobra o efeito de venenos ou intoxicação por vias aéreas." }
        ]
      },
      {
        carta: "8 de Adaptação",
        nome: "Assimilação Termorreguladora",
        mutações: [
          { cost: "1 adptação", name: "Resistência Térmica", desc: "Imune a frio/calor moderados. Sudorese ácida constante. Contato físico faz aliados adicionarem Pressão a testes até o fim da cena." },
          { cost: "2 adptações", name: "Conduzir Calor", desc: "Absorve calor, impedindo hipotermia de aliados. Regeneração de vida reduzida pela metade sem fontes de calor." },
          { cost: "1 sucesso e 2 adptações", name: "Gerar Calor", desc: "Gasta um e para aumentar temperatura, penalizando presentes em um Sucesso em Resolução/Potência ou adiciona Pressão a Ativações de Ameaça." },
          { cost: "1 sucesso e 3 adptações", name: "Sangue Quente", req: 3, desc: "3+ Ponto de Assimilação: Gasta um e para manter 2 dados adicionais em Reação, mas perde um Ponto de Determinação em ações físicas na cena." },
          { cost: "1 sucesso e 4 adptações", name: "Exala Vapor", req: 5, desc: "5+ Ponto de Assimilação: Emite vapor, ofuscando visão (ataques na área sofrem duas Pressões, aumentando custos em duas Pressões ou perdendo 2 Sucessos)." },
          { cost: "6 adptações", name: "Esquentar/Esfriar Região", req: 7, desc: "7+ Ponto de Assimilação: Gastando todos os e, altera temperatura de uma região em 3°C por ponto investido." }
        ]
      },
      {
        carta: "9 de Adaptação",
        nome: "Assimilação Neural",
        mutações: [
          { cost: "1 adptação", name: "Pulso Mental", desc: "Gasta um e para repetir teste de Conhecimentos. Sobrecarga causa insônia: só restaura Determinação em ambiente totalmente isolado." },
          { cost: "2 adptações", name: "Prever Dano", desc: "Reduz dano sofrido em 1 ponto em ataques repetidos. Perde um Ponto de Determinação se estímulos visuais/sonoros simultâneos ocorrerem." },
          { cost: "1 sucesso e 2 adptações", name: "Prever Ameaça", desc: "Gasta um e em Reação/Sagacidade para agir antes da Ameaça; Sucessos/Adaptações anulam Pressões/resultados da Ameaça." },
          { cost: "4 adptações", name: "Sintonia Mental", req: 3, desc: "3+ Ponto de Assimilação: Gasta um e para dar Adaptação a aliado fora de Conflito. Gera penalidade de Pressão em Influência/Expressão do Infectado." },
          { cost: "1 sucesso e 4 adptações", name: "Visão Mental", req: 5, desc: "5+ Ponto de Assimilação: Ao obter 2 Sucessos em Conhecimento, ganha informação vital sobre o tema. Recebe Pressão adicional em rolagens criativas/improvisadas." },
          { cost: "2 sucessos e 4 adptações", name: "Visão Verdadeira", req: 7, desc: "7+ Ponto de Assimilação: Pede informação oculta ao Assimilador sem testes, gastando Pontos de Assimilação. Precisão aumenta com e gasto." }
        ]
      },
      {
        carta: "10 de Adaptação",
        nome: "Assimilação Cardiovascular",
        mutações: [
          { cost: "1 adptação", name: "Sangue Frio", desc: "Imune a penalidades por tensão, medo ou risco. Penalidade de Adaptação em testes de Manufaturas pela sensibilidade reduzida." },
          { cost: "2 adptações", name: "Transe", desc: "Restaura o dobro de Determinação em Recuperações se estiver com vida completa." },
          { cost: "1 sucesso e 2 adptações", name: "Sangue Furioso", desc: "Gasta um e para manter 2 dados adicionais em Potência/Atletismo, mas perde 1 ponto de vida no fim da rodada." },
          { cost: "4 adptações", name: "Fingir Morte", req: 3, desc: "3+ Ponto de Assimilação: Quase para o coração por 5 minutos. Dieta pobre em ferro piora penalidades de vida como se fosse um nível inferior." },
          { cost: "4 adptações e 1 pressão", name: "Sangue Regenerativo", req: 5, desc: "5+ Ponto de Assimilação: Gasta um Ponto de Determinação para manter dado adicional e regenerar um ponto de vida. Não pode anular Pressões nesse teste." },
          { cost: "2 sucessos e 4 adptações", name: "Sangue Potente", req: 7, desc: "7+ Ponto de Assimilação: Gasta todos os e para manter um dado adicional por ponto gasto em ações físicas pelo restante da cena." }
        ]
      },
      {
        carta: "Valete de Adaptação",
        nome: "Assimilação Fitomórfica",
        mutações: [
          { cost: "1 adptação", name: "Sintonia Verde", desc: "Sente vida vegetal num raio de 30m gastando um e, desde que descalço no solo." },
          { cost: "2 adptações", name: "Casca Grossa", desc: "+1 em Resolução (pode ultrapassar o limite). Sofre dano de queimadura dobrado." },
          { cost: "3 adptações", name: "Fotorreceptores", desc: "Pelos viram folhas e faz fotossíntese. Não precisa comer, apenas água, solo e 2h de sol diárias (ou perde um Ponto de Determinação)." },
          { cost: "4 adptações", name: "Raízes", req: 3, desc: "3+ Ponto de Assimilação: Cria raízes ao repousar para extrair água. Dormir sem contato direto com o solo impede restaurar Determinação." },
          { cost: "5 adptações", name: "Curar o Solo", req: 5, desc: "5+ Ponto de Assimilação: Reduz um nível de vida completo para nutrir um bioma. Vislumbrar sua degradação causa perda de 1 Ponto de Determinação." },
          { cost: "6 adptações", name: "Cura Comunal", req: 7, desc: "7+ Ponto de Assimilação: Gasta dois e para fazer o solo regenerar 1 ponto de vida por rodada a aliados na cena." }
        ]
      },
      {
        carta: "Dama de Adaptação",
        nome: "Assimilação Quimiorreceptora",
        mutações: [
          { cost: "1 adptação", name: "Faro Apurado", desc: "Identifica compostos químicos e feromônios. Odores intensos por 5 minutos causam desconforto e perda de 1 Ponto de Determinação." },
          { cost: "2 adptações", name: "Farejar Toxinas", desc: "Detecta toxinas antes de tocá-las/ingeri-las. Impede comer pratos temperados/com cheiro sob pena de não restaurar Determinação." },
          { cost: "1 sucesso e 2 adptações", name: "Farejar Rastros", desc: "Adiciona 2 Sucessos em testes de Furtividade/Sobrevivência/Engenharia analisando locais alterados. Percepção sofre penalidade de Adaptação." },
          { cost: "3 adptações e 1 pressão", name: "Farejar Sentimentos", req: 3, desc: "3+ Ponto de Assimilação: Gasta um e para detectar emoções/mentiras. Adiciona Percepção a Expressão/Influência. Penalidade de Pressão se mais de 5 pessoas." },
          { cost: "5 adptações", name: "Secreções", req: 5, desc: "5+ Ponto de Assimilação: CUTÂNEA. Marca trilha ou alvo por 24h. Seguir o odor penaliza em 2 Sucessos testes de Furtividade contra farejadores." },
          { cost: "4 adptações e 2 pressões", name: "Farejar Psicometria", req: 7, desc: "7+ Ponto de Assimilação: Gaste 3 e para ler o estado químico de área/objeto/cadáver, revelando fatos biológicos ocultos. Penalidade de 2 Adaptações em Resolução." }
        ]
      },
      {
        carta: "Rei de Adaptação",
        nome: "Assimilação Metabólica",
        mutações: [
          { cost: "1 adptação", name: "Metabolismo Acelerado", desc: "Ao regenerar pontos de vida, recupera um ponto adicional. Precisa do triplo de calorias diárias ou perde 1 ponto de vida por dia." },
          { cost: "1 adptação e 1 pressão", name: "Metabolismo Afiado", desc: "Mantém dado adicional em Reação/Potência/Resolução física. Penalidade de Pressão em Conhecimentos." },
          { cost: "1 sucesso e 2 adptações", name: "Metabolismo Regenerativo", desc: "Gaste dois Ponto de Determinação para regenerar 4 pontos de vida. Sofre penalidade de um Sucesso em testes físicos na cena (não em Conflito)." },
          { cost: "2 adptações e 2 pressões", name: "Imunidade Metabólica", req: 3, desc: "3+ Ponto de Assimilação: Imune a hipóxia/intoxicação leve. Sem ingestão diária de eletrólitos sofre penalidade cumulativa de Adaptação por dia." },
          { cost: "5 adptações", name: "Metabolismo Eficiente", req: 5, desc: "5+ Ponto de Assimilação: Gaste dois e para manter 2 dados adicionais em teste físico. Perde 1 ponto de vida para cada Pressão mantida." },
          { cost: "6 adptações", name: "Metabolizar Instintos", req: 7, desc: "7+ Ponto de Assimilação: Gaste todos os e para elevar Potência/Reação/Resolução ao seu nível de Assimilação. Sofre dano de 1 ponto de vida por rodada." }
        ]
      }
    ]
  },
  inoportunas: {
    suit: "Pressão",
    suitSymbol: "♠",
    nome: "Assimilações Inoportunas",
    descricao: "Mutações inconvenientes que geram deformações visíveis, peso na mente ou perda de controle.",
    cartas: [
      {
        carta: "Ás de Pressão",
        nome: "Assimilação Atrofiante",
        mutações: [
          { cost: "1 pressão", name: "Rigidez Muscular", desc: "Processo degenerativo muscular. Penaliza em Adaptação em testes de Potência." },
          { cost: "2 pressões", name: "Rigidez Articular", desc: "Sempre que realizar teste de Potência ou Atletismo em corrida/escalada/natação, sofre penalidade de Sucesso." },
          { cost: "3 pressões", name: "Nervos Atrofiados", desc: "Atinge nervos periféricos. Testes de Reação para estímulos rápidos sofrem penalidade de Sucesso." },
          { cost: "4 pressões", name: "Digestão Ineficaz", desc: "Precisa comer 3x por hora. Porções maiores causam regurgitação e perda de Determinação e vida." },
          { cost: "5 pressões", name: "Atrofia Muscular", desc: "Falhar em testes de Potência/Resolução causa um ponto de dano por Pressão mantida." },
          { cost: "6 pressões", name: "Falência", desc: "Fragiliza todo o corpo. Todo dano físico e todas as penalidades de vida (S) são dobrados." }
        ]
      },
      {
        carta: "2 de Pressão",
        nome: "Assimilação Neuropática",
        mutações: [
          { cost: "1 pressão", name: "Debilidade", desc: "Sempre que realizar testes que incluam Atletismo, sofre penalidade de Sucesso no resultado." },
          { cost: "2 pressões", name: "Inabilidade", desc: "Sempre que realizar testes de Manufaturas/Erudição/Expressão, sofre penalidade de Adaptação." },
          { cost: "3 pressões", name: "Tremores", desc: "Tremores sob estresse. Perde um Ponto de Determinação adicional por Pressão mantida em qualquer teste." },
          { cost: "4 pressões", name: "Desorientação", desc: "Testes de Percepção ou Sobrevivência envolvendo distância ou direção sofrem penalidade de 2 Sucessos." },
          { cost: "5 pressões", name: "Fragilidade", desc: "Amplifica dor física. Perde um Ponto de Determinação ao sofrer dano físico (dois se o dano reduzir a vida)." },
          { cost: "6 pressões", name: "Inaptidão", desc: "Em Conflitos, todas as ações do Infectado sofrem penalidade de Sucesso e Adaptação." }
        ]
      },
      {
        carta: "3 de Pressão",
        nome: "Assimilação Devoradora",
        mutações: [
          { cost: "1 pressão", name: "Coeficiente Calórico", desc: "Se passar mais de 4 horas sem comer, sofre penalidade de Sucesso em todos os testes." },
          { cost: "2 pressões", name: "Ignorância", desc: "Se estiver sem comer por 2 horas, sofre penalidade de Sucesso em testes de Conhecimentos." },
          { cost: "3 pressões", name: "Desarticulação", desc: "Falta de comida gera penalidade de Pressão em testes de Influência." },
          { cost: "4 pressões", name: "Apetite Corrosivo", desc: "Perde 1 ponto de vida se passar 6h sem ingerir comida orgânica. -1 por hora após isso." },
          { cost: "5 pressões", name: "Apetite Vacilante", desc: "Ficar 24h sem comer zera todos os seus pontos de Determinação, tornando-o Suscetível." },
          { cost: "6 pressões", name: "Ânsia Terrível", desc: "Fome extrema tira o controle. Ações sem ser para comer usam Resolução e custam Determinação por nível de mutação." }
        ]
      },
      {
        carta: "4 de Pressão",
        nome: "Assimilação Secretora",
        mutações: [
          { cost: "1 pressão", name: "Mau Odor", desc: "Secreta substância de odor forte. Testes de Expressão em locais fechados sofrem penalidade de Sucesso." },
          { cost: "2 pressões", name: "Inchaço Debilitante", desc: "Dificulta manuseio delicado. Testes de Manufaturas/Armas para armas de fogo sofrem penalidade de Sucesso." },
          { cost: "3 pressões", name: "Escorregadio", desc: "Secreção escorregadia compromete equilíbrio. Testes de Atletismo em locais instáveis sofrem penalidade de Sucesso." },
          { cost: "4 pressões", name: "Fragilidade Térmica", desc: "Dobra as penalidades térmicas ambientais por calor ou frio intensos." },
          { cost: "5 pressões", name: "Inflamável", desc: "Contato com fogo causa 1 de dano por ponto de Assimilação restante, zerando os pontos mas limpando a secreção." },
          { cost: "6 pressões", name: "Bufotoxina", desc: "Secreção altamente tóxica. Toques causam 1 de dano. Dormir no mesmo cômodo de outros exige testes." }
        ]
      },
      {
        carta: "5 de Pressão",
        nome: "Assimilação Calcificante",
        mutações: [
          { cost: "1 pressão", name: "Endurecido", desc: "Endurece ligamentos. Testes de Furtividade ou Atletismo de leveza/equilíbrio sofrem penalidade de Adaptação." },
          { cost: "2 pressões", name: "Descoordenado", desc: "Ações físicas complexas sucessivas sofrem penalidade de Sucesso por ação adicional." },
          { cost: "3 pressões", name: "Hesitante", desc: "Coluna rígida limita movimento. Cancele metade dos Sucessos mantidos em testes para Fuga." },
          { cost: "4 pressões", name: "Travado", desc: "Articulações travam. Pressões mantidas em Potência/Reação aumentam os Sucessos necessários para Fuga." },
          { cost: "5 pressões", name: "Combalido", desc: "Testes físicos substituem os rolagens críticas de 1 por falhas de 6." },
          { cost: "6 pressões", name: "Condrocalcinose", desc: "Calcificação severa. Sofre penalidade de 3 Pressões em todos os testes físicos." }
        ]
      },
      {
        carta: "6 de Pressão",
        nome: "Assimilação Fotossensível",
        mutações: [
          { cost: "1 pressão", name: "Visão Sensível", desc: "Luz intensa gera penalidade de Adaptação em testes que incluam Percepção." },
          { cost: "2 pressões", name: "Pele de Vampiro", desc: "Luz solar direta causa perda de 1 Ponto de Determinação e 1 ponto de vida a cada 30 minutos." },
          { cost: "3 pressões", name: "Enxaqueca", desc: "Luz constante gera enxaqueca. Passar a cena sob luz impede restaurar Determinação." },
          { cost: "4 pressões", name: "Pupilas Sensíveis", desc: "Transição rápido de iluminação gera penalidade de 2 Sucessos nas primeiras rodadas." },
          { cost: "5 pressões", name: "Visão Curta", desc: "Redução de contraste gera penalidade de um Sucesso em ataques de longo alcance." },
          { cost: "6 pressões", name: "Visão Noturna", desc: "Só enxerga no escuro total. Qualquer luz ofusca, impondo penalidade de 2 Sucessos em Percepção." }
        ]
      },
      {
        carta: "7 de Pressão",
        nome: "Assimilação Litodérmica",
        mutações: [
          { cost: "1 pressão", name: "Afasta Animais", desc: "Odor ferroso mineral. Qualquer teste de interação com animais sofre penalidade de Sucesso." },
          { cost: "2 pressões", name: "Ossos Frágeis", desc: "Formações minerais nos ossos reduzem amortecimento. Todo dano de impacto sofrido aumenta em 1." },
          { cost: "3 pressões", name: "Eletrossensível", desc: "Danos elétricos são dobrados. Danos por calor ou queimaduras causam perda extra de Determinação." },
          { cost: "4 pressões", name: "Carapaça Disforme", desc: "Impedimento de usar armaduras rígidas/coletes. Dormir sem superfície macia impede recuperação." },
          { cost: "5 pressões", name: "Muco Oxidante", desc: "Muco oxida metais. Contato por uma cena reduz Qualidade de itens metálicos." },
          { cost: "6 pressões", name: "Fígado Estragado", desc: "Sangria semanal obrigatória ou cirrose causa perda de vida até transplante de fígado (teste Medicina 5 Sucessos)." }
        ]
      },
      {
        carta: "8 de Pressão",
        nome: "Assimilação Entorpecida",
        mutações: [
          { cost: "1 pressão", name: "Agorafobia", desc: "Percepção distorcida em locais abertos. Testes de Percepção em áreas externas sofrem penalidade de Sucesso." },
          { cost: "2 pressões", name: "Sensibilidade Auditiva", desc: "Sons intensos causam vertigem e perda de 1 Ponto de Determinação." },
          { cost: "3 pressões", name: "Sentidos Sobrecarregados", desc: "Estímulos sensoriais múltiplos intensos causam penalidade de um Sucesso em todas as ações." },
          { cost: "4 pressões", name: "Desorientação Aguda", desc: "Penalidade de Pressão adicional ao resultado de testes de Percepção ou Reação." },
          { cost: "5 pressões", name: "Devaneios", desc: "Alucinações induzidas pelo Narrador reduzem em 2 Sucessos o resultado do teste." },
          { cost: "6 pressões", name: "Dessensibilização Aguda", desc: "Perda de 85% dos sentidos (Percepção na ficha vira 0). Testes sem outra aptidão aliada falham automaticamente." }
        ]
      },
      {
        carta: "9 de Pressão",
        nome: "Assimilação Aberrante",
        mutações: [
          { cost: "1 pressão", name: "Anomorfia", desc: "Desenvolve tecidos redundantes. Reduz em 1 ponto um Instinto base de valor inicial 2+." },
          { cost: "2 pressões", name: "Pernas Disformes", desc: "Perda de mobilidade em pernas. Em conflito, remova o primeiro Sucesso investido em Fuga." },
          { cost: "3 pressões", name: "Hipersensibilidade", desc: "Sensibilidade extrema ao toque. Ser tocado ou sofrer dano físico custa 1 Ponto de Determinação." },
          { cost: "4 pressões", name: "Recuperação Debilitada", desc: "Órgãos redundantes drenam energia. Recuperações restauram apenas metade da vida e Determinação." },
          { cost: "5 pressões", name: "Descoordenação", desc: "Partes operam de forma autônoma. Ao obter 2 Sucessos em testes, um deles vira Pressão." },
          { cost: "6 pressões", name: "Aberração", desc: "Aparência e voz completamente retorcidas e deformadas, podendo alterar membros." }
        ]
      },
      {
        carta: "10 de Pressão",
        nome: "Assimilação Hipersensível",
        mutações: [
          { cost: "1 pressão", name: "Vulnerabilidade a Dor", desc: "Qualquer dano sofrido impõe penalidade de um Sucesso no próximo teste físico." },
          { cost: "2 pressões", name: "Vulnerabilidade Emocional", desc: "Críticas ou escárnios geram penalidade de Adaptação em todos os testes na cena." },
          { cost: "3 pressões", name: "Dor Degradante", desc: "Limiar de dor reduzido. Sofrer dano por combate ou queda causa perda de 1 Ponto de Determinação." },
          { cost: "4 pressões", name: "Sensibilidade Radical", desc: "Estímulos ambientais geram penalidade de 2 Sucessos em Conhecimentos ou Expressão." },
          { cost: "5 pressões", name: "Recuperação Sensível", desc: "Recuperações perdem metade da eficácia sem repouso em local escuro, silencioso e ameno." },
          { cost: "6 pressões", name: "Sensibilidade Extrema", desc: "Multiplicidade de estímulos causa perda imediata de Determinação/vida e limita testes a 1 dado." }
        ]
      },
      {
        carta: "Valete de Pressão",
        nome: "Assimilação Mioclônica",
        mutações: [
          { cost: "1 pressão", name: "Espasmos Involuntários", desc: "Obter Pressões em testes pode fazer o Narrador introduzir espasmos físicos na narrativa." },
          { cost: "2 pressões", name: "Aflição Grave", desc: "Conflito gera penalidade de um Sucesso em qualquer ação fina de controle corporal." },
          { cost: "3 pressões", name: "Movimentos Involuntários", desc: "A cada cena, um membro sofre espasmos, gerando Pressão em ações com ele." },
          { cost: "4 pressões", name: "Barulhos Involuntários", desc: "Calma gera ruídos involuntários do Infectado, impossibilitando surpresas ou camuflagem." },
          { cost: "5 pressões", name: "Agitação Constante", desc: "Incapaz de ficar imóvel por mais de um minuto. Repousar estático drena Determinação por minuto." },
          { cost: "6 pressões", name: "Debilidade Extrema", desc: "Testes físicos sofrem penalidade de Sucesso e Pressão. Descarta maior face de Sucesso obtido." }
        ]
      },
      {
        carta: "Dama de Pressão",
        nome: "Assimilação Disfásica",
        mutações: [
          { cost: "1 pressão", name: "Desvio de Fala", desc: "Pressões em comunicação verbal resultam em gagueira, lapsos ou erros que comprometem a cena." },
          { cost: "2 pressões", name: "Fala Debilitada", desc: "Testes de Expressão/Influência em falas complexas sofrem penalidade de um Sucesso." },
          { cost: "3 pressões", name: "Memória Debilitada", desc: "Incapaz de relatar instruções com mais de uma frase sem truncá-las e alterá-las." },
          { cost: "4 pressões", name: "Fala Simplificada", desc: "Não pronuncia termos técnicos/nomes. Testes de conhecimentos verbais sofrem penalidade de 2 Sucessos." },
          { cost: "5 pressões", name: "Letra Ilegível", desc: "Linguagem escrita ininteligível a menos que acompanhada de teste social (2 Sucessos)." },
          { cost: "6 pressões", name: "Fala Incompreensível", desc: "Perda total da fala em tensão. Apenas sílabas soltas. Testes verbais sofrem penalidade de 2 Pressões." }
        ]
      },
      {
        carta: "Rei de Pressão",
        nome: "Assimilação Terminal",
        mutações: [
          { cost: "1 pressão", name: "Pressão Estendida", desc: "Penalidades de Pressão duram por mais uma cena após o término de sua causa original." },
          { cost: "2 pressões", name: "Recuperação Sofrida", desc: "Regenerar qualquer quantidade de vida causa 1 ponto de dano direto imediatamente antes." },
          { cost: "3 pressões", name: "Pressão por Fracasso", desc: "Falhar em testes (sem manter Sucessos) gera penalidade de Pressão no teste seguinte (cumulativo)." },
          { cost: "4 pressões", name: "Aptidões Arruinadas", desc: "Uma aptidão aleatória na cena é tratada como nível 0 (não fornece dados)." },
          { cost: "5 pressões", name: "Determinação Hesitante", desc: "Gastar Determinação força descarte de Sucesso/Adaptação à escolha do Narrador." },
          { cost: "6 pressões", name: "Inaptidão Extrema", desc: "Todos os testes sofrem penalidade de 2 Pressões. Reduz permanentemente em 1 uma aptidão base." }
        ]
      }
    ]
  },
  singulares: {
    suit: "Paus",
    suitSymbol: "♣",
    nome: "Assimilações Singulares",
    descricao: "Mutações adaptadas a ambientes específicos onde o Infectado se desenvolveu.",
    cartas: [
      {
        carta: "Ás de Paus",
        nome: "Assimilação do Bosque",
        mutações: [
          { cost: "1 singular", name: "BA — Embaúba", desc: "A cada hora imóvel com os pés ou mãos em contato direto com vegetação viva ou solo úmido, entra em estado de simbiose e Regenera um s. Dobra todo dano sofrido nesse período. Sofrer dano interrompe o efeito." },
          { cost: "2 singulares", name: "AC — Eucalyptus", desc: "Se for reduzido aos S 1 ou 2, o(a) Infectado(a) pode optar por permanecer imóvel por 6 horas em contato com solo fértil para habilitar sua Recuperação como se estivesse no S 3. Se for interrompido durante o processo, qualquer teste de Medicina para viabilizar a Recuperação receberá C adicional no resultado." },
          { cost: "3 singulares", name: "BC — Araucária", desc: "Se passar mais de 24 horas sem contato direto com vegetação viva ou solo fértil, o(a) Infectado(a) sofre uma penalidade de A em todo teste que inclua Sobrevivência até restabelecer esse contato por pelo menos 1 hora." }
        ]
      },
      {
        carta: "2 de Paus",
        nome: "Assimilação da Campina",
        mutações: [
          { cost: "1 singular", name: "BA — Alecrim", desc: "Durante o dia, enquanto estiver exposto à luz solar direta por pelo menos 1 hora, pode gastar um d para dispensar a necessidade de alimentação e água por 24 horas. Esse efeito não se acumula e é anulado por ambientes sem luz natural (interiores, subsolo ou neblina densa)." },
          { cost: "2 singulares", name: "AC — Cágado", desc: "A epiderme do(a) Infectado(a) se torna parcialmente transparente para otimizar a absorção solar. Enquanto exposto ao sol, Recupera um s por cena automaticamente. Contudo, sofre um 1 de ataques baseados em calor ou luz intensa (como fogo, laser ou clarões bioluminescentes)." },
          { cost: "3 singulares", name: "BC — Maria-da-campina", desc: "A pele fotossintética do(a) Infectado(a) não tolera bem a ausência de luz natural. A cada dia passado sem exposição direta ao sol (ou fonte equivalente), sofre uma penalidade de A em testes de Resolução até que a exposição seja restabelecida por ao menos 1 hora." }
        ]
      },
      {
        carta: "3 de Paus",
        nome: "Assimilação do Cerrado",
        mutações: [
          { cost: "1 singular", name: "BA — Tatu-canastra", desc: "Enquanto estiver sob sol forte ou clima seco, você recebe um ponto de dano a menos de ataques físicos. Esse bônus se perde se estiver em clima úmido, submerso ou sob chuva intensa." },
          { cost: "2 singulares", name: "AC — Mandacaru", desc: "Sempre que sofrer dois ou mais pontos de dano em um mesmo ataque, a camada externa de sua carapaça se fragmenta em estilhaços, ferindo quem estiver em alcance corpo a corpo. O atacante sofre um ponto de dano direto, mas você também sofre uma penalidade de A em testes de Reação até a carapaça regenerar (o que só ocorre após o fim da cena)." },
          { cost: "3 singulares", name: "BC — Lobo-guará", desc: "Sua anatomia reage mal à umidade. Sempre que entrar em contato prolongado com água (chuva intensa, submersão, clima encharcado), sofre uma penalidade de A em testes que incluam Potência ou Furtividade até se secar completamente." }
        ]
      },
      {
        carta: "4 de Paus",
        nome: "Assimilação da Colina",
        mutações: [
          { cost: "1 singular", name: "BA — Caxinguelê", desc: "Ignora penalidades por terreno inclinado, escorregadio ou irregular durante deslocamentos e escaladas. Sempre que investir A em Fuga, adicione A. Além disso, não pode ser derrubado ou desequilibrado por meios físicos, a menos que o ataque cause dano." },
          { cost: "2 singulares", name: "AC — Porco-do-mato", desc: "Recebe A adicional em testes que incluam Atletismo ao correr, saltar ou escalar, mas sofre a penalidade de C adicional em testes que incluam Furtividade devido à rigidez dos movimentos." },
          { cost: "3 singulares", name: "BC — Jabuti-piranga", desc: "Em ambientes planos ou excessivamente nivelados (ambientes urbanos, corredores, pisos industriais), sofre menos A em testes que incluam Reação até deixar o local ou se adaptar por uma cena inteira." }
        ]
      },
      {
        carta: "5 de Paus",
        nome: "Assimilação Desértica",
        mutações: [
          { cost: "1 singular", name: "BA — Suculenta", desc: "Pode permanecer até 5 dias sem consumir água sem sofrer penalidades." },
          { cost: "2 singulares", name: "AC — Diabo-espinhoso", desc: "O corpo libera secreções que irritam olhos e mucosas. Agressores corpo a corpo sofrem 1 de dano ou A adicional em neutralização da Ameaça. Toda C mantida pelo resto da cena causa 1 de dano a um aliado próximo." },
          { cost: "3 singulares", name: "BC — Esquilo Terrestre", desc: "Passa a cavar buracos para dormir em segurança, perde um d se não dormir em uma toca." }
        ]
      },
      {
        carta: "6 de Paus",
        nome: "Assimilação Florestal",
        mutações: [
          { cost: "1 singular", name: "BA — Morcego-narigudo", desc: "Passa a ignorar penalidades por baixa luminosidade natural, incluindo crepúsculo, sombra densa ou penumbra. Esse efeito não se aplica à escuridão total nem à ausência de luz artificial." },
          { cost: "2 singulares", name: "AC — Sucuri", desc: "Os sons são absorvidos pela pele. Recebe B adicional em testes que incluem Furtividade ao se mover em vegetação densa, mas sofre C em testes que incluem Expressão, pois a vocalização do(a) Infectado(a) se torna abafada e pouco audível." },
          { cost: "3 singulares", name: "BC — Rato-do-mato", desc: "Ao sair abruptamente de ambiente sombreado para um muito iluminado, sofre uma penalidade de A em testes que incluem Percepção por 1 cena, devido à saturação do nervo óptico." }
        ]
      },
      {
        carta: "7 de Paus",
        nome: "Assimilação do Manguezal",
        mutações: [
          { cost: "1 singular", name: "BA — Mangue-vermelho", desc: "Pode consumir água salobra ou salina sem qualquer prejuízo." },
          { cost: "2 singulares", name: "AC — Caramujo-do-mangue", desc: "Consegue respirar parcialmente pela pele em ambientes alagadiços, permanecendo submerso por até 10 minutos. No entanto, a pele do(a) Infectado(a) torna-se vulnerável, sofrendo um ponto de dano adicional contra ataques físicos." },
          { cost: "3 singulares", name: "BC — Sururu", desc: "Ao passar mais de 6 horas em ambientes secos (ambiente urbano, cerrado, alta montanha), a pele começa a rachar. Sofre uma penalidade de A em testes que incluam Reação até ser reidratado por imersão ou umidade ambiental." }
        ]
      },
      {
        carta: "8 de Paus",
        nome: "Assimilação Marinha",
        mutações: [
          { cost: "1 singular", name: "BA — Toninha", desc: "Você se move duas vezes mais rápido na água do que um humano comum, e não precisa testar Atletismo para nadar, exceto em tempestades ou redemoinhos. Dobre todos os A investidos em Fuga nadando." },
          { cost: "2 singulares", name: "AC — Biguá", desc: "Tem A adicional em testes que incluem Atletismo na água ou areia fofa, e adiciona C em testes que incluem Manufaturas, pois a motricidade fina dos dedos foi comprometida." },
          { cost: "3 singulares", name: "BC — Tartaruga-aruanã", desc: "Sempre que estiver correndo ou saltando em pisos rígidos (metal, concreto, pedra), sofre C em testes que incluem Potência, devido ao formato instável das extremidades." }
        ]
      },
      {
        carta: "9 de Paus",
        nome: "Assimilação da Montanha",
        mutações: [
          { cost: "1 singular", name: "BA — Urubu-Rei", desc: "Não sofre qualquer penalidade por altitudes elevadas ou ar rarefeito, mesmo acima de 3000m. Pode manter esforço físico moderado por mais tempo sem fadiga." },
          { cost: "2 singulares", name: "AC — Calango-bandeira", desc: "Pode prender a respiração por até 10 minutos mesmo em movimento, mas em climas quentes e secos perde B em testes de Influência ou Expressão, devido à rouquidão." },
          { cost: "3 singulares", name: "BC — Tucanuçu", desc: "Ao passar mais de 1 hora em ambientes abafados ou com alta umidade, tem a Sagacidade reduzida em um (mínimo 0), como se estivesse em constante mal-estar leve." }
        ]
      },
      {
        carta: "10 de Paus",
        nome: "Assimilação do Pântano",
        mutações: [
          { cost: "1 singular", name: "BA — Guaiamu", desc: "Ignora penalidades de movimento em terrenos encharcados ou instáveis. Pode atravessar até 2 metros de profundidade de água ou lama sem necessidade de teste." },
          { cost: "2 singulares", name: "AC — Garça-azul", desc: "Possui A adicional em testes que incluem Furtividade ao caminhar sobre lama ou folhas alagadas, pois seus passos não fazem barulho. Contudo, sofre C adicional em testes que incluam Reação em ambientes fechados, onde o alongamento das pernas prejudica o equilíbrio." },
          { cost: "3 singulares", name: "BC — Sapo-cururu", desc: "Se for derrubado ou sofrer queda, deve fazer um teste de Potência ou irá sofrer um ponto de dano adicional de todos os ataques até o fim da cena, por instabilidade nas articulações." }
        ]
      },
      {
        carta: "Valete de Paus",
        nome: "Assimilação da Caatinga",
        mutações: [
          { cost: "1 singular", name: "BA — Rola-bosta", desc: "Reduz em um ponto todo dano cortante ou perfurante sofrido por fontes naturais (espinhos, facas, garras). Esse efeito não se aplica a armas de fogo ou ataques energéticos." },
          { cost: "2 singulares", name: "AC — Asa-branca", desc: "A pele do(a) Infectado(a) o protege contra insolação e exposição solar extrema por até 2 cenas, mesmo sem abrigo ou água. Tem Influência reduzida em um (mínimo 0), devido à aparência enrijecida e aspectou vítreo." },
          { cost: "3 singulares", name: "BC — Teiú", desc: "Em ambientes úmidos ou com pouca circulação de ar, acumula calor corporal, sofrendo uma penalidade de A em testes que incluem Reação após 2 horas." }
        ]
      },
      {
        carta: "Dama de Paus",
        nome: "Assimilação Subterrânea",
        mutações: [
          { cost: "1 singular", name: "BA — Tatu-canastra", desc: "Detecta movimentos ou presenças num raio de 10 metros se estiver tocando o chão com as mãos ou pés descalços, mesmo na escuridão. Não identifica outros detalhes, somente a intensidade e a distância." },
          { cost: "2 singulares", name: "AC — Coruja-buraqueira", desc: "Recebe A adicional em testes que incluem Percepção para identificar sons abafados ou ecos subterrâneos, mas sofre C adicional em testes que incluem Reação relacionados a ruídos altos repentinos (tiros, explosões), por conta do sistema auditivo hipersensível." },
          { cost: "3 singulares", name: "BC — Morcego-de-cauda-livre", desc: "Ambientes com múltiplos sons sobrepostos (máquinas, motores, grandes multidões) te sobrecarregam. Tem a Sagacidade reduzida em um (mínimo 0) nesses locais até que se isole." }
        ]
      },
      {
        carta: "Rei de Paus",
        nome: "Assimilação da Tundra",
        mutações: [
          { cost: "1 singular", name: "BA — Líquen-de-mapa", desc: "Não sofre penalidades por frio intenso ou neve, mesmo abaixo de –20°C. Pode dormir ao relento sem risco de congelamento ou exaustão térmica." },
          { cost: "2 singulares", name: "AC — Marmota-alpina", desc: "Pode entrar voluntariamente em estado de torpor por até 12 horas, reduzindo consumo de oxigênio e de estabilizando ferimentos (não morre por sangramento nesse estado). Contudo, ao sair do torpor, a Potência é reduzida em um (mínimo 0) até o próximo descanso." },
          { cost: "3 singulares", name: "BC — Husky siberiano", desc: "Os pelos de todo o corpo crescem muito formando uma proteção contra o frio. Em ambientes quentes sofre C adicional em testes que incluam Atletismo." }
        ]
      }
    ]
  }
};

// Programmatic Unique IDs for all mutations/abilities
Object.entries(ASSIMILACOES).forEach(([suitKey, suitData]) => {
  if (suitData && suitData.cartas) {
    suitData.cartas.forEach((card) => {
      if (card && card.mutações) {
        card.mutações.forEach((mut, idx) => {
          // Generate a clean, unique identifier: e.g. "evolutivas_as_de_sucesso_1"
          const suitId = suitKey;
          const cardId = card.carta.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
            .replace(/[^a-z0-9]/g, "_");
          mut.id = `${suitId}_${cardId}_${idx + 1}`;
        });
      }
    });
  }
});

