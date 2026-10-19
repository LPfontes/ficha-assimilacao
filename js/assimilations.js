export const ASSIMILACOES = {
  evolutivas: {
    suit: "Sucesso",
    suitSymbol: "♥",
    nome: "Assimilações Evolutivas",
    descricao: "Desenvolvem o corpo sem deformidades ou dor, ampliando habilidades naturais.",
    cartas: [
      {
        carta: "Ás de Copas",
        nome: "Assimilação Sensitiva",
        descricao: "O(a) Infectado(a) desenvolve uma percepção intuitiva para criaturas assimiladas e eventos futuros, navegando pelas tensões do ambiente usando o sexto sentido.",
        mutações: [
          { cost: "1 Sucesso", name: "Sensibilidade", desc: "Gasta um Ponto de Determinação para sentir a presença de criaturas assimiladas em até 30 metros pelo restante da cena." },
          { cost: "2 Sucessos", name: "Consciência", desc: "Mantenha um dado adicional sempre que o(a) Infectado(a) realizar um teste que inclua Percepção." },
          { cost: "3 Sucessos", name: "Discernimento", desc: "Adicione Adaptação à face de um dado mantido que já tenha pelo menos Adaptação em testes de Ação do(a) Infectado(a)." },
          { cost: "4 Sucessos", name: "Presciência", req: 3, desc: "3+ Nível de Assimilação: No começo da sessão, o(a) jogador(a) rola dois dados do tipo que escolher, anotando o resultado para substituí-los por quaisquer dados do mesmo tipo rolados posteriormente por qualquer pessoa ao longo da sessão de jogo, incluindo o(a) Assimilador(a), uma vez cada dado." },
          { cost: "5 Sucessos", name: "Complicar", req: 5, desc: "5+ Nível de Assimilação: Sempre que alguém realizar um teste na presença do(a) Infectado(a), você pode gastar um Ponto de Determinação para escolher um dado para ser rolado novamente, substituindo o resultado anterior." },
          { cost: "6 Sucessos", name: "Vidência", req: 7, desc: "7+ Nível de Assimilação: O(a) Infectado(a) consegue prever Crises (pág. 106). No momento em que seria ativada, o(a) Assimilador(a) adia o seu efeito em até 24 horas, dando oportunidade para o(a) Infectado(a) adotar contramedidas efetivas que possam cancelá-la antes que aconteça." }
        ]
      },
      {
        carta: "2 de Copas",
        nome: "Assimilação Reativa",
        descricao: "Os reflexos do(a) Infectado(a) se tornam cada vez mais precisos, reagindo de forma instintiva e assertiva a perigos ou situações inusitadas.",
        mutações: [
          { cost: "1 Sucesso", name: "Ligeiro", desc: "Recebe um ponto em Reação – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Rápido", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Reação, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Preciso", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Reação, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Alígero", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Reação, substitua qualquer quantidade de Adaptação por Sucesso no resultado." },
          { cost: "5 Sucessos", name: "Hábil", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Reação, você adiciona um Sucesso ao resultado. Pode ser ativado em conjunto com Rápido, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Celeridade", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Reação, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "3 de Copas",
        nome: "Assimilação Sensorial",
        descricao: "Os sentidos do(a) Infectado(a) atingem níveis extraordinários, captando detalhes com precisão.",
        mutações: [
          { cost: "1 Sucesso", name: "Perceptivo", desc: "Recebe um ponto em Percepção – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Alerta", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Percepção, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Detalhista", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Percepção, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Meticuloso", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Percepção, substitua qualquer quantidade de Adaptação por Sucesso no resultado." },
          { cost: "5 Sucessos", name: "Arguto", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Percepção, você adiciona Sucesso ao resultado. Pode ser ativado com Alerta, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Intuitivo", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Percepção, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "4 de Copas",
        nome: "Assimilação Vigorosa",
        descricao: "A resiliência física e mental do(a) Infectado(a) é reforçada. Corpo e mente são capazes de resistir a Pressões e traumas.",
        mutações: [
          { cost: "1 Sucesso", name: "Resoluto", desc: "Recebe um ponto em Resolução – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Resistente", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Firme", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Vigoroso", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, você pode substituir qualquer número de Adaptação no resultado por Sucesso." },
          { cost: "5 Sucessos", name: "Persistente", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Resistente, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Inabalável", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Resolução, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "5 de Copas",
        nome: "Assimilação Persuasiva",
        descricao: "O carisma e a influência do(a) Infectado(a) se ampliam de forma sensível, facilitando a comunicação e o convencimento, além de ampliar seu magnetismo e sua autoridade.",
        mutações: [
          { cost: "1 Sucesso", name: "Influente", desc: "Recebe um ponto em Influência – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Persuasivo", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Convincente", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Magnético", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, você pode substituir qualquer número de Adaptação no resultado por Sucesso." },
          { cost: "5 Sucessos", name: "Carismático", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, adicione Sucesso ao resultado. Pode ser ativado com Persuasivo, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Majestoso", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "6 de Copas",
        nome: "Assimilação Brutal",
        descricao: "A capacidade do(a) Infectado(a) em empregar força bruta e gerar aceleração é aumentada, alcançando proeza física sobre-humana.",
        mutações: [
          { cost: "1 Sucesso", name: "Forte", desc: "Recebe um ponto em Potência – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Robusto", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Pujante", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Potente", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, você pode substituir qualquer número de Adaptação no resultado por Sucesso." },
          { cost: "5 Sucessos", name: "Agressivo", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Robusto, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Devastador", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Potência, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "7 de Copas",
        nome: "Assimilação Perspicaz",
        descricao: "O raciocínio e a cognição do(a) Infectado(a) são aprimorados, despertando sua genialidade, revelando conexões ocultas, padrões complexos e soluções brilhantes.",
        mutações: [
          { cost: "1 Sucesso", name: "Sagaz", desc: "Recebe um ponto em Sagacidade – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Mente Assimilada", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, você pode usar um Ponto de Assimilação para adicionar Sucesso ao resultado." },
          { cost: "3 Sucessos", name: "Perfeccionista", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, anule Pressão no resultado." },
          { cost: "4 Sucessos", name: "Solerte", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, você pode substituir qualquer número de Adaptação no resultado por Sucesso." },
          { cost: "5 Sucessos", name: "Potência Mental", req: 5, desc: "5+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, adicione Sucesso ao resultado. Pode ser ativado em conjunto com Mente Assimilada, acumulando os efeitos." },
          { cost: "6 Sucessos", name: "Genialidade", req: 7, desc: "7+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste que inclua Sagacidade, substitua todos os d6 por d10 na pilha de dados." }
        ]
      },
      {
        carta: "8 de Copas",
        nome: "Assimilação Regenerativa",
        descricao: "A capacidade regenerativa do corpo do(a) Infectado(a) é ampliada além dos limites humanos.",
        mutações: [
          { cost: "1 Sucesso", name: "Resistente", desc: "Ignora a penalidade do Nível de Saúde 4 (Laceração)." },
          { cost: "2 Sucessos", name: "Resiliente", desc: "Pode se Regenerar sem ajuda médica mesmo quando reduzido ao Nível de Saúde 2 (Debilitação) no Tempo de Recuperação de uma semana." },
          { cost: "3 Sucessos", name: "Vigoroso", desc: "Recebe um Ponto de Saúde adicional em cada Nível de Saúde." },
          { cost: "4 Sucessos", name: "Restauração", req: 3, desc: "3+ Nível de Assimilação: Ao concluir uma Recuperação, dobre os Pontos de Saúde Regenerados." },
          { cost: "5 Sucessos", name: "Recuperação", req: 5, desc: "5+ Nível de Assimilação: Regenera uma quantidade de Pontos de Saúde igual à soma de Resolução e Potência após cada cena." },
          { cost: "6 Sucessos", name: "Reintegração", req: 7, desc: "7+ Nível de Assimilação: É capaz de se Regenerar completamente em apenas um dia desde que não perca seu último Ponto de Saúde, incluindo partes perdidas do corpo e sequelas ou cicatrizes." }
        ]
      },
      {
        carta: "9 de Copas",
        nome: "Assimilação Silvestre",
        descricao: "A conexão do(a) Infectado(a) com a natureza se aprofunda, concedendo habilidades extraordinárias que podem curar, comandar animais ou até modificar ambientes vivos.",
        mutações: [
          { cost: "1 Sucesso", name: "Sintonia Natural", desc: "Recebe um ponto em Biologia – pode ultrapassar o limite máximo." },
          { cost: "2 Sucessos", name: "Cura Verde", desc: "Pode gastar um Ponto de Determinação para reavivar toda vegetação morta ou severamente danificada que esteja a até cinco metros, restaurando seu estado saudável original." },
          { cost: "3 Sucessos", name: "Fotossíntese", desc: "Realiza fotossíntese completa que o torna esverdeado. Não precisa consumir alimentos. Basta o consumo habitual de água, contato direto com o solo e exposição à luz solar por duas horas diárias." },
          { cost: "4 Sucessos", name: "Animalismo", req: 3, desc: "3+ Nível de Assimilação: Sempre que o(a) Infectado(a) realizar um teste para influenciar o comportamento de animais, adicione dois Sucessos ao resultado." },
          { cost: "5 Sucessos", name: "Refúgio Natural", req: 5, desc: "5+ Nível de Assimilação: Estabelece um Refúgio Vivo em áreas naturais que equivale a um Refúgio de Nível 4 (pág. 110) e se fortalece com a presença contínua do(a) Infectado(a). Plantas e animais adaptam o ambiente para conforto, proteção e recuperação. Leve em consideração a Região em que se encontra ao investir os pontos de Refúgio." },
          { cost: "6 Sucessos", name: "Gênese", req: 7, desc: "7+ Nível de Assimilação: Gaste todos seus Pontos de Assimilação para fazer com que a flora e fauna locais cresçam violentamente em um raio de um quilômetro por ponto gasto. Enquanto durar a cena, as plantas e animais se movem e obedecem à vontade do(a) Infectado(a). Qualquer teste da flora ou fauna rola 2 dados para cada Ponto de Assimilação gasto na ativação e mantém dois dados." }
        ]
      },
      {
        carta: "10 de Copas",
        nome: "Assimilação Opressora",
        descricao: "A presença do(a) Infectado(a) deixa seus rivais acuados, hesitantes e mais suscetíveis à dominância.",
        mutações: [
          { cost: "1 Sucesso", name: "Aproveitador", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Influência, adicione Adaptação ao resultado se o alvo estiver em posição de inferioridade ou dúvida." },
          { cost: "2 Sucessos", name: "Sugestão", desc: "Gaste um Ponto de Assimilação para forçar um alvo hesitante a seguir uma sugestão simples, sem colocá-lo em risco e sem machucar pessoas importantes para ele." },
          { cost: "3 Sucessos", name: "Condicionamento", desc: "Após um teste bem-sucedido que inclua Influência, o(a) Infectado(a) pode repetir a mesma frase ou comando para outro alvo da cena repetindo o resultado sem rolar novo teste." },
          { cost: "4 Sucessos", name: "Imposição", req: 3, desc: "3+ Nível de Assimilação: Mantenha um dado adicional em testes que incluam Influência em locais pacíficos." },
          { cost: "5 Sucessos", name: "Mesmerizar", req: 5, desc: "5+ Nível de Assimilação: Ao obter dois Sucessos ou mais em um teste que inclua Influência, pode impor uma condição narrativa ao alvo até o fim da cena – como intimidação, obediência, silêncio, vergonha ou outra condição que interfira no comportamento." },
          { cost: "6 Sucessos", name: "Dominância", req: 7, desc: "7+ Nível de Assimilação: Adiciona seus pontos de ExPressão à Defesa de seu Refúgio." }
        ]
      },
      {
        carta: "Valete de Copas",
        nome: "Assimilação Esguia",
        descricao: "A motricidade do(a) Infectado(a) é adaptada para interagir de forma mais eficiente com o ambiente à sua volta, auxiliando a ocultação.",
        mutações: [
          { cost: "1 Sucesso", name: "Infiltrador", desc: "Sempre que o(a) Infectado(a) realizar um teste que inclua Furtividade em ambiente urbano ou construído, adicione Sucesso ao resultado." },
          { cost: "2 Sucessos", name: "Pulso Sombrio", desc: "Gaste um Ponto de Assimilação para anular o resultado em um teste que inclua Furtividade. Role novamente e mantenha o novo resultado uma vez por teste." },
          { cost: "3 Sucessos", name: "Esguio", desc: "Após executar Ação de Fuga do Conflito, se o(a) Infectado(a) não for o único alvo viável de uma ativação de Ameaça, outro alvo deve ser escolhido." },
          { cost: "4 Sucessos", name: "Subterfúgio", req: 3, desc: "3+ Nível de Assimilação: O(a) Infectado(a) só precisa de Sucesso para ter êxito em qualquer teste que inclua Furtividade fora de Conflito." },
          { cost: "5 Sucessos", name: "Auxílio das Sombras", req: 5, desc: "5+ Nível de Assimilação: O(a) Infectado(a) adiciona Adaptação à face de cada dado de Furtividade mantido — dados mantidos de outras Aptidões na mesma rolagem não recebem este benefício." },
          { cost: "6 Sucessos", name: "Ofuscação", req: 7, desc: "7+ Nível de Assimilação: O(a) Infectado(a) adiciona Sucesso à face de todos os dados em testes que incluam Furtividade." }
        ]
      },
      {
        carta: "Dama de Copas",
        nome: "Assimilação Indomável",
        descricao: "A perseverança do(a) Infectado(a) supera os seus limites, permitindo que continue lutando mesmo nas condições mais adversas.",
        mutações: [
          { cost: "1 Sucesso", name: "Fôlego Raro", desc: "Adiciona Sucesso ao resultado em testes que incluam Atletismo com esforço contínuo – resistência, natação, escalada, etc." },
          { cost: "2 Sucessos", name: "Perseverança", desc: "Gaste um Ponto de Assimilação para manter clareza e força de vontade até o fim da cena ao entrar no Estado Suscetível (pág. 59), permitindo ao(à) Infectado(a) continuar usando Ponto de Determinação, mesmo que com isso reduza o Nível de Determinação e tenha que usar os pontos do Nível seguinte." },
          { cost: "3 Sucessos", name: "Disposição", desc: "Sempre que realizar um teste que inclua Atletismo, mantenha um dado adicional." },
          { cost: "4 Sucessos", name: "Obstinação", req: 3, desc: "3+ Nível de Assimilação: Ao obter dois Sucessos ou mais em um teste de Atletismo, Restaura um Ponto de Determinação no fim da cena. Máximo de um ponto por cena." },
          { cost: "5 Sucessos", name: "Irredutível", req: 5, desc: "5+ Nível de Assimilação: Gaste dois Pontos de Determinação para ignorar qualquer penalidade decorrente da redução do Nível de Saúde na rodada." },
          { cost: "6 Sucessos", name: "Intrépido", req: 7, desc: "7+ Nível de Assimilação: O(a) Infectado(a) é imune a qualquer efeito que geraria penalidades externas ou o impediria de agir normalmente." }
        ]
      },
      {
        carta: "Rei de Copas",
        nome: "Assimilação Primordial",
        descricao: "O DNA do(a) Infectado(a) integra a mais pura essência da Assimilação, permitindo-o interagir com a própria força evolutiva e com a Assimilação presente nos seres à sua volta.",
        mutações: [
          { cost: "1 Sucesso", name: "Primal", desc: "O primeiro Ponto de Assimilação utilizado pelo(a) Infectado(a) em cada cena de Conflito é gratuito." },
          { cost: "2 Sucessos", name: "Supressor", desc: "Gaste um Ponto de Assimilação para anular Pressão no resultado de qualquer teste do(a) Infectado(a) em Conflito." },
          { cost: "3 Sucessos", name: "Subjugar", desc: "Em cenas de Conflito, quando investe pontos em Neutralizar Ameaça, se o(a) Infectado(a) tem maior Nível de Assimilação que o alvo, aumente em dois Sucessos o resultado." },
          { cost: "4 Sucessos", name: "Proeza", req: 3, desc: "3+ Nível de Assimilação: Gasta dois Pontos de Assimilação para substituir o nível no Instinto selecionado para o teste pelo seu Nível de Assimilação para definir a pilha de dados rolados." },
          { cost: "5 Sucessos", name: "Sinergia", req: 5, desc: "5+ Nível de Assimilação: Consegue pagar custos de Ponto de Assimilação utilizados por aliados." },
          { cost: "6 Sucessos", name: "Poder Inesgotável", req: 7, desc: "7+ Nível de Assimilação: Não gasta Ponto de Assimilação para as próprias ativações, incluindo para Agir por Instinto." }
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
        carta: "Ás de Ouros",
        nome: "Assimilação Anatômica",
        descricao: "O(a) Infectado(a) sofre transformações físicas profundas, moldando seu corpo para combate e deslocamento, porém distorce a alimentação e a motricidade fina.",
        mutações: [
          { cost: "1 Adptação", name: "Presas Aumentadas", desc: "Gasta um Ponto de Determinação para usar a característica Letal (pág. 98) ao morder. Depois de ingerir carne crua, ignora o custo pelas próximas 4 horas." },
          { cost: "2 Adptações", name: "Nadadeiras", desc: "Gasta um Ponto de Assimilação para se deslocar debaixo d´água na velocidade normal. Perde um nível em Furtividade (mínimo 0)." },
          { cost: "3 Adptações", name: "Guelras", desc: "Guelras funcionais se formam nas laterais do pescoço, permitindo respirar debaixo d’água, porém consome o dobro de água." },
          { cost: "4 Adptações", name: "Braços Alongados", req: 3, desc: "3+ Nível de Assimilação: Os braços do(a) Infectado(a) se alongam, aumentando seu alcance. Quando investe pontos em Neutralizar Ameaça, o alvo perde Pressão no resultado do turno seguinte. Perde um nível em Manufaturas (mínimo 0)." },
          { cost: "5 Adptações", name: "Poder de Carga", req: 5, desc: "5+ Nível de Assimilação: O tronco e os membros permitem carregar o triplo da carga normal e dobra os pontos investidos em Neutralização de Ameaça. Perde permanentemente todos os níveis em Manufaturas." },
          { cost: "6 Adptações", name: "Alado", req: 7, desc: "7+ Nível de Assimilação: Desenvolve asas de queratina orgânica capazes de voo pleno. Ações de Fuga recebem dois Sucessos adicionais. A estrutura das asas impede o uso de coletes, mochilas ou vestimentas que cubram os ombros ou o tórax." }
        ]
      },
      {
        carta: "2 de Ouros",
        nome: "Assimilação Cutânea",
        descricao: "A pele do(a) Infectado(a) ganha novas capacidades, auxiliando ao mesmo tempo que dificulta sua interação com o ambiente.",
        mutações: [
          { cost: "1 Adptação", name: "Pele Aderente", desc: "A pele do(a) Infectado(a) passa a transpirar com substâncias adesivas e mutáveis. Pode aderir a superfícies verticais e se mover por paredes ou tetos sem testes que incluam Atletismo. Contudo, resultados em testes de Fuga correndo são reduzidos em um Sucesso." },
          { cost: "2 Adptações", name: "Pele Ajustável", desc: "A pele se ajusta à iluminação do ambiente, tornando o(a) Infectado(a) mais difícil de perceber em áreas escuras ou em sombras. Mantenha um dado a mais em testes que incluam Furtividade em baixa luz. Sofre penalidade de um Sucesso em testes que incluam ExPressão sob luz direta." },
          { cost: "3 Adptações", name: "Sentir Vibrações", desc: "A epiderme se torna altamente sensível, permitindo detectar vibrações e Pressões em superfícies. Adicione Sucesso em testes que incluam Percepção tátil. Estímulos inesperados causam reações abruptas, reduzindo em um Sucesso testes que incluam Reação." },
          { cost: "4 Adptações", name: "Cheiro Nocivo", req: 3, desc: "3+ Nível de Assimilação: Pelo custo de um Ponto de Assimilação, a pele do(a) Infectado(a) libera compostos químicos que geram uma Pressão a seres vivos pelo restante da cena, aumentando em Pressão o custo de ativações ou anulando Sucesso em testes, conforme o caso. O odor liberado provoca uma redução de um Sucesso em testes sociais do(a) Infectado(a) e do atacante afetado por 2 cenas, contando a cena em que foi usado." },
          { cost: "5 Adptações", name: "Mudar Corpo", req: 5, desc: "5+ Nível de Assimilação: O(a) Infectado(a) pode controlar pequenas alterações de cor, calor ou textura em sua pele. Gaste um Ponto de Assimilação para adicionar dois Sucessos em um teste que inclua Furtividade, disfarce ou atuação corporal por cena. Roupas que cobrem o tronco anulam o efeito." },
          { cost: "6 Adptações", name: "Sentir o Ar", req: 7, desc: "7+ Nível de Assimilação: A pele se torna um sistema de absorção sensorial completo. O(a) Infectado(a) detecta sinais elétricos, variações de temperatura e vibrações em um raio de 3 quilômetros. Pode ignorar testes que incluam Percepção em situações em que a informação seja tátil, auditiva ou sísmica. A pele queima sob sol direto, levando à perda de três Pontos de Saúde por hora exposta sem proteção." }
        ]
      },
      {
        carta: "3 de Ouros",
        nome: "Assimilação Camaleônica",
        descricao: "O(a) Infectado(a) desenvolve camuflagem natural, se ajusta ao ambiente e aos outros, mas adquire sensibilidades e tem algumas percepções afetadas.",
        mutações: [
          { cost: "1 Adptação", name: "Camaleônico", desc: "A pigmentação da pele do(a) Infectado(a) pode se fundir ao ambiente. Adicione Sucesso em testes que incluam Furtividade ao se manter imóvel. Perde um Ponto de Determinação sempre que sofre queimaduras de sol, mesmo que suaves." },
          { cost: "2 Adptações", name: "Mudar o Rosto", desc: "O(a) Infectado(a) pode tensionar músculos e deslocar cartilagens menores para alterar parcialmente o formato do rosto. Mantém 1 dado adicional em testes para se disfarçar. Contudo, sofre penalidade de um Sucesso em testes que incluam Percepção quando o sentido testado for audição." },
          { cost: "1 Sucesso e 2 Adptações", name: "Camuflagem", desc: "O corpo do(a) Infectado(a) passa a reagir reflexivamente a padrões visuais externos para se ocultar. Os dados de Furtividade são substituídos por d10." },
          { cost: "2 Adptações e 2 Pressões", name: "Visão Periférica", req: 3, desc: "3+ Nível de Assimilação: Os olhos do(a) Infectado(a) saltam levemente para fora das órbitas aumentando a visão periférica e podem se virar em direções distintas. Recebe um ponto em Percepção que pode ultrapassar o limite máximo e reduz a visão de profundidade, sofrendo uma penalidade de Adaptação em testes de pontaria que incluam Atletismo ou Armas." },
          { cost: "4 Adptações e 1 Pressão", name: "Malemolência", req: 5, desc: "5+ Nível de Assimilação: O corpo do(a) Infectado(a) passa a reagir a alterações emocionais, adaptando sua aparência inconscientemente ao seu humor no momento. O(a) Infectado(a) adiciona dois Sucessos em interações sociais, exceto quando está tentando esconder informações, situação em que sofre penalidade de Pressão adicional." },
          { cost: "2 Sucessos e 4 Adptações", name: "Invisibilidade", req: 7, desc: "7+ Nível de Assimilação: O(a) Infectado(a) consegue gastar um Ponto de Assimilação para ficar completamente invisível pelo restante da cena. O(a) Infectado(a) não pode voltar a ficar visível antes disso mesmo que deseje." }
        ]
      },
      {
        carta: "4 de Ouros",
        nome: "Assimilação Escamosa",
        descricao: "Escamas cobrem o corpo do(a) Infectado(a), fortalecendo sua resistência mas atrapalhando a maneira que reage aos seus arredores.",
        mutações: [
          { cost: "1 Adptação", name: "Escamoso", desc: "Escamas reduzem em um o dano cortante sofrido. Perde Sucesso em testes que incluam ExPressão com pessoas não Assimiladas que desconhecem Assimilações." },
          { cost: "2 Adptações", name: "Escalador", desc: "Escamas surgem nas mãos e pés. Anda ou escala superfícies ásperas, mantendo um dado adicional em testes que incluam Atletismo. Perde Sucesso em testes de Furtividade em ambientes urbanos." },
          { cost: "2 Adptações e 1 Pressão", name: "Escorregadio", desc: "As escamas se deslocam e se adaptam melhorando a locomoção em superfícies instáveis ou escorregadias. Ao tentar manter estabilidade mantém um dado adicional. Troca de pele a cada mês, sofrendo dano dobrado por 24 horas após a troca." },
          { cost: "3 Adptações e 1 Pressão", name: "Escamas Reativas", req: 3, desc: "3+ Nível de Assimilação: As escamas se endurecem e podem retaliar ao toque, causando 1 de dano em quem o atacar ou adiciona Sucesso para Neutralização da Ameaça, conforme o caso. O toque se torna áspero, adicionando Pressão a manifestações táteis de afeto." },
          { cost: "1 Sucesso e 4 Adptações", name: "Evasão Natural", req: 5, desc: "5+ Nível de Assimilação: O corpo se adapta para reagir a ataques e deslocamento. Se alvejado, o(a) Infectado(a) causa duas Pressões ao atacante, aumentando em duas Pressões o custo de suas ativações ou anulando dois Sucessos do resultado, conforme o caso." },
          { cost: "2 Sucessos e 4 Adptações", name: "Imunidade ao Calor", req: 7, desc: "7+ Nível de Assimilação: As escamas se aprimoram e são capazes de absorver calor ou luminosidade. O(a) Infectado(a) é imune a qualquer dano térmico (fogo, calor, abrasão...), mas se torna reluzente sob iluminação artificial, sofre uma penalidade de dois Sucessos em testes de Furtividade nesse contexto." }
        ]
      },
      {
        carta: "5 de Ouros",
        nome: "Assimilação Óssea",
        descricao: "Mutações no sistema ósseo do(a) Infectado(a), alterando sua estrutura e composição para exceder os limites do ser humano comum, porém a peculiaridade de sua anatomia traz novos desafios.",
        mutações: [
          { cost: "1 Adptação", name: "Ossos Reativos", desc: "Espículos ósseos brotam da pele. Sempre que sofre dano de um golpe corpo a corpo, causa um ponto de dano ao agressor. Contudo, sofre uma penalidade de Sucesso em testes que incluam ExPressão com as protuberâncias expostas." },
          { cost: "2 Adptações", name: "Maleabilidade", desc: "As articulações do(a) Infectado(a) se tornam hipermóveis, capazes de se dobrarem em ângulos incomuns. Mantenha um dado adicional em testes que incluam Furtividade. Contudo, sofre penalidade de Sucesso em testes que incluam Atletismo que envolvam postura ou equilíbrio." },
          { cost: "1 Sucesso e 2 Adptações", name: "Lâminas Ósseas", desc: "O corpo projeta lâminas ósseas nos antebraços ou joelhos. Adiciona Sucesso em testes de ataque corpo a corpo com Armas ou Atletismo. Contudo, adiciona Pressão ao resultado de testes com Medicina ou Biologia usados no corpo do(a) Infectado(a)." },
          { cost: "3 Adptações e 1 Pressão", name: "Presas de Mamute", req: 3, desc: "3+ Nível de Assimilação: O(a) Infectado(a) cria presas de mamute. Em Conflito adiciona Sucesso e reduz uma Adaptação no resultado de testes para Neutralizar Ameaça." },
          { cost: "2 Sucessos e 3 Adptações", name: "Exoesqueleto", req: 5, desc: "5+ Nível de Assimilação: Por três Pontos de Assimilação o(a) Infectado(a) pode, até o final da cena, estender e projetar seus ossos para fora do corpo, fazendo a função de exoesqueleto. Fontes de dano cortante ou perfurante (incluindo balas de armas de fogo de até médio calibre) são ignoradas nesse tempo, período em que o(a) Infectado(a) não pode mover sua mandíbula, impossibilitado de falar." },
          { cost: "2 Sucessos e 4 Adptações", name: "Gigante", req: 7, desc: "7+ Nível de Assimilação: Por quatro Pontos de Assimilação, o(a) Infectado(a) pode dobrar de tamanho, ganhando força e agilidade sobre-humanas até o fim da cena. Todas os testes físicos do(a) Infectado(a) mantém dois dados adicionais, mas adiciona Pressão a todos os testes com Furtividade e/ou Percepção durante o efeito." }
        ]
      },
      {
        carta: "6 de Ouros",
        nome: "Assimilação Gastrointestinal",
        descricao: "O sistema digestivo do(a) Infectado(a) pode consumir ampla variedade de nutrientes, mas exclui a dieta humana, o prazer na alimentação e pode gerar desconfortos.",
        mutações: [
          { cost: "1 Adptação", name: "Saliva Ácida", desc: "O sistema digestivo do(a) Infectado(a) pode consumir qualquer matéria orgânica. O odor de seus ácidos estomacais causa desconforto, gerando uma penalidade de Adaptação em testes que incluam Influência." },
          { cost: "2 Adptações", name: "Ruminante", desc: "Estômago segmentado permite ao(à) Infectado(a) armazenar alimento para até uma semana, mas precisa ruminar após cada refeição." },
          { cost: "3 Adptações", name: "Estômago Restaurador", desc: "Regenera um Ponto de Saúde por refeição completa, mas não consegue comer comida processada." },
          { cost: "4 Adptações", name: "Jato Ácido", req: 3, desc: "3+ Nível de Assimilação: O(a) Infectado(a) pode gastar um Ponto de Assimilação e um Sucesso de seu resultado em Ação para expelir ácido digestivo em um alvo, causando uma Pressão, aumentando em Pressão o custo de suas ativações ou reduzindo em Sucesso os resultados obtidos em testes, conforme o caso. Este efeito dura uma rodada por Nível de Assimilação do(a) Infectado(a). A saliva do(a) Infectado(a) é ácida e causa queimaduras, mesmo quando não há intenção." },
          { cost: "5 Adptações", name: "Imunidade à Intoxicação", req: 5, desc: "5+ Nível de Assimilação: O(a) Infectado(a) não sofre nenhum tipo de intoxicação ou envenenamento, porém não sente prazer em refeições, mesmo que especiais – o(a) Infectado(a) não Restaura Determinação comendo algo raro ou que goste muito, como para outros personagens." },
          { cost: "6 Adptações", name: "Glutão", req: 7, desc: "7+ Nível de Assimilação: O(a) Infectado(a) pode se alimentar de qualquer coisa que consiga mastigar e engolir. Se ficar um dia inteiro sem comer sofre grave desconforto estomacal e perde um Ponto de Determinação por hora." }
        ]
      },
      {
        carta: "7 de Ouros",
        nome: "Assimilação Respiratória",
        descricao: "Aprimora o controle respiratório permitindo que o(a) Infectado(a) sobreviva em ambientes hostis, mas perturba a comunicação e amplifica reações sensoriais.",
        mutações: [
          { cost: "1 Adptação", name: "Pulmão Grosso", desc: "Respira ar rarefeito, fumaça ou detritos sem penalidades, mas adiciona Pressão em testes que incluam Furtividade, pois sua respiração é ruidosa." },
          { cost: "1 Sucesso e 1 Adptação", name: "Fôlego Estendido", desc: "Prende a respiração por até 5 minutos sem realizar testes. Odores fortes ou ataques ao olfato resultam em perda de um Ponto de Determinação." },
          { cost: "2 Adptações e 1 Pressão", name: "Sopro Poderoso", desc: "Gasta um Ponto de Assimilação para expirar com grande Pressão torácica. Empurra três metros ou cobre de poeira uma Ameaça, mesmo sem causar dano, adicionando dois Sucessos para Fuga no Conflito. Sempre fala de forma estrondosa, reduz Adaptação de seus testes sociais com Furtividade que envolvam a voz, como sussurrar ou falar discretamente." },
          { cost: "4 Adptações", name: "Fôlego Inumano", req: 3, desc: "3+ Nível de Assimilação: Com uma inspiração profunda aumenta sua tolerância ao estresse físico. Pode Agir por Instinto sem custo de Assimilação. Sofre penalidade de um dado mantido em testes que envolvam Conhecimentos até o final da cena." },
          { cost: "5 Adptações", name: "Fôlego Reparador", req: 5, desc: "5+ Nível de Assimilação: O controle respiratório restaura o equilíbrio psicológico. Ao perder Ponto de Determinação pode perder Ponto de Assimilação no lugar – se aplica apenas para perda, não para usos ativos de Determinação." },
          { cost: "2 Sucessos e 4 Adptações", name: "Fôlego Infinito", req: 7, desc: "7+ Nível de Assimilação: Pulmões do(a) Infectado(a) evoluem. O(a) Infectado(a) sobrevive sem ar por tempo indefinido. Dobra qualquer efeito de veneno ou intoxicação por vias aéreas." }
        ]
      },
      {
        carta: "8 de Ouros",
        nome: "Assimilação Termorreguladora",
        descricao: "O corpo do(a) Infectado(a) regula calor com precisão letal, alterando o ambiente ao redor, mas exige cautela com toques, desgastes e equilíbrio térmico.",
        mutações: [
          { cost: "1 Adptação", name: "Resistência Térmica", desc: "Temperatura corporal controlada. Frio ou calor moderados não o afetam, mas sua sudorese é constante e ácida, provocando irritação em quem o toca. Contato físico prolongado com outra personagem (ex: imobilizações, transporte ou socorro) o faz adicionar Pressão em todo teste até o fim da cena (não cumulativo)." },
          { cost: "2 Adptações", name: "Conduzir Calor", desc: "O(a) Infectado(a) absorve parte do calor do ambiente. Aquece objetos ou pessoas ao toque, impede hipotermia de personagens ou reduz a temperatura de alimentos. Sua Regeneração de Pontos de Saúde é reduzida pela metade sem fontes de calor para absorver." },
          { cost: "1 Sucesso e 2 Adptações", name: "Gerar Calor", desc: "Libera pulsos de calor. Gastar um Ponto de Assimilação aumenta a temperatura ambiente, penalizando em Sucesso por fatiga todos os presentes na cena nos testes que incluam Resolução ou Potência. Ou aumentam em Pressão o custo das Ativações de Ameaça." },
          { cost: "1 Sucesso e 3 Adptações", name: "Sangue Quente", req: 3, desc: "3+ Nível de Assimilação: O sangue aquece e acelera a circulação, melhorando reflexos. Gastar um Ponto de Assimilação permite manter dois dados adicionais em testes que incluam Reação. Isso sobrecarrega o corpo fazendo-o perder um Ponto de Determinação em ações físicas até o fim da cena." },
          { cost: "1 Sucesso e 4 Adptações", name: "Exala Vapor", req: 5, desc: "5+ Nível de Assimilação: O(a) Infectado(a) emite vapor constante, ofuscando a visão dos adversários. Ataques de longo alcance que mirem alvos na área sofrem duas Pressões, aumentando em duas Pressões o custo de ativações ou perdendo dois Sucessos dos resultados, conforme o caso. Ataques de longo alcance a partir da área afetada também sofrem duas Pressões." },
          { cost: "6 Adptações", name: "Esquentar/Esfriar Região", req: 7, desc: "7+ Nível de Assimilação: O controle e conversão de temperatura atingem seu ápice. Gastando todos os Pontos de Assimilação, pode-se alterar a temperatura de toda uma Região. Cada Ponto de Assimilação investido dessa maneira altera a temperatura em 3 graus Celsius (3°C) para mais ou para menos." }
        ]
      },
      {
        carta: "9 de Ouros",
        nome: "Assimilação Neural",
        descricao: "O(a) Infectado(a) gera sinapses hiperativas que decifram padrões e ameaças com precisão inumana, à custa do descanso, do afeto e da criatividade espontânea.",
        mutações: [
          { cost: "1 Adptação", name: "Pulso Mental", desc: "A resposta cognitiva do(a) Infectado(a) se aprimora. Ao gastar um Ponto de Assimilação pode repetir um teste que inclua Conhecimentos, mantendo o segundo resultado. Contudo, a sobrecarga sensorial causa insônia — sua Recuperação não Restaura Determinação se não estiver em ambiente isolado, silencioso e escuro por um descanso de ao menos 6 horas." },
          { cost: "2 Adptações", name: "Prever Dano", desc: "Reflexos involuntários que o fazem prever padrões repetitivos. Ao ser alvejado por um segundo efeito danoso, reduz o dano sofrido em um ponto. Perde um Ponto de Determinação se estímulos visuais ou sonoros simultâneos estão em cena." },
          { cost: "1 Sucesso e 2 Adptações", name: "Prever Ameaça", desc: "O cérebro está tão acelerado que antecipa e atrapalha uma Ameaça durante o Conflito. Em seu turno, gaste um Ponto de Assimilação e escolha Reação ou Sagacidade como o Instinto da rolagem. Role seu teste e reserve os resultados: cada Sucesso pode anular Pressão e cada Adaptação pode anular outra no resultado da Ameaça. Sua Ação se resolve antes da Ameaça com os pontos restantes, se houver." },
          { cost: "4 Adptações", name: "Sintonia Mental", req: 3, desc: "3+ Nível de Assimilação: Prevê possíveis falhas em Ações de outros Infectados. Gastar um Ponto de Assimilação adiciona Adaptação ao resultado do teste de um aliado fora de Conflito dando-lhe conselhos. As previsões tornam a convivência difícil, gerando penalidade de Pressão nos testes que incluam Influência ou ExPressão." },
          { cost: "1 Sucesso e 4 Adptações", name: "Visão Mental", req: 5, desc: "5+ Nível de Assimilação: Ao obter dois Sucessos ou mais em um teste de Conhecimento, permite adquirir uma informação vital sobre o tema em questão. Essa informação é confiável e válida por toda a campanha. A lógica reduz a plasticidade dos pensamentos — recebe Pressão adicional em rolagens criativas ou improvisadas." },
          { cost: "2 Sucessos e 4 Adptações", name: "Visão Verdadeira", req: 7, desc: "7+ Nível de Assimilação: O cérebro alcança hiperconectividade dando acesso a informações do ambiente e dos próprios instintos. Permite pedir uma informação oculta ao(à) Assimilador(a) por cena gastando Pontos de Assimilação e não precisa de testes. Profundidade, precisão e relevância da informação da Aventura aumentam a cada ponto gasto." }
        ]
      },
      {
        carta: "10 de Ouros",
        nome: "Assimilação Cardiovascular",
        descricao: "O(a) Infectado(a) consegue controlar seu coração ao extremo, melhorando sua resposta a crises, porém pode passar por instabilidades ao longo do dia.",
        mutações: [
          { cost: "1 Adptação", name: "Sangue Frio", desc: "A circulação se adapta a situações de risco extremo. Não sofre penalidades em situações de tensão, medo ou risco. Sofre penalidade de Adaptação em testes que incluam Manufaturas pela sensibilidade reduzida." },
          { cost: "2 Adptações", name: "Transe", desc: "A circulação controlada permite Restaurar o dobro da quantidade normal de Pontos de Determinação em toda Recuperação em que o(a) Infectado(a) tiver sua Saúde completa." },
          { cost: "1 Sucesso e 2 Adptações", name: "Sangue Furioso", desc: "O sangue retece os músculos com força explosiva. Gaste um Ponto de Assimilação para manter dois dados adicionais em testes que incluam Potência ou Atletismo. Perde um Ponto de Saúde no fim da rodada." },
          { cost: "4 Adptações", name: "Fingir Morte", req: 3, desc: "3+ Nível de Assimilação: Reduz o fluxo sanguíneo quase parando o coração por até 5 minutos. Uma dieta pobre em ferro considera as penalidades de Nível de Saúde como um Nível inferior." },
          { cost: "4 Adptações e 1 Pressão", name: "Sangue Regenerativo", req: 5, desc: "5+ Nível de Assimilação: O fluxo sanguíneo direcionado permite regeneração localizada. Ao gastar um Ponto de Determinação mantém um dado adicional e Regenera um Ponto de Saúde. Quando o fizer, o(a) Infectado(a) não pode anular Pressão em seus resultados de nenhuma forma." },
          { cost: "2 Sucessos e 4 Adptações", name: "Sangue Potente", req: 7, desc: "7+ Nível de Assimilação: O sistema cardiovascular entra em estado de hiperfluxo. Gaste todos os Pontos de Assimilação para manter um dado adicional por ponto gasto em Ações físicas pelo restante da cena." }
        ]
      },
      {
        carta: "Valete de Ouros",
        nome: "Assimilação Fitomórfica",
        descricao: "Fusão com o mundo vegetal transforma o corpo do(a) Infectado(a) em raiz, escudo e fonte de cura, desde que jamais perca o contato com o solo.",
        mutações: [
          { cost: "1 Adptação", name: "Sintonia Verde", desc: "O(a) Infectado(a) sente a vida vegetal ao seu redor. Ao gastar um Ponto de Assimilação sente a presença, tipo e condição de plantas num raio de 30 metros, desde que esteja descalço ou com os pés nus no solo." },
          { cost: "2 Adptações", name: "Casca Grossa", desc: "Casca vegetal se forma sobre a epiderme, aumentando em um a Resolução (pode ultrapassar o limite máximo). Sofre dano dobrado de queimadura (incluindo fogo, calor extremo, frio extremo ou ácido)." },
          { cost: "3 Adptações", name: "Fotorreceptores", desc: "Pelos corporais se tornam folhas e passa a realizar fotossíntese. Não precisa consumir alimentos. Basta o consumo habitual de água, contato direto com o solo e exposição à luz solar por duas horas diárias. Perde um Ponto de Determinação ao final do dia se não fizer." },
          { cost: "4 Adptações", name: "Raízes", req: 3, desc: "3+ Nível de Assimilação: Ao repousar, de seu corpo nascem finas raízes por onde se extrai água e nutrientes do solo mantendo estabilidade mesmo em terrenos difíceis. Dormir sem contato direto com o solo impede de Restaurar Determinação." },
          { cost: "5 Adptações", name: "Curar o Solo", req: 5, desc: "5+ Nível de Assimilação: Reduza um Nível de Saúde completo para nutrir um bioma local, regenerando parte da flora: remove contaminações e restaura o solo criando conexão permanente e um vínculo emocional com o local. Testemunhar a degradação de um bioma conectado causa perda de um Ponto de Determinação." },
          { cost: "6 Adptações", name: "Cura Comunal", req: 7, desc: "7+ Nível de Assimilação: O corpo assume propriedades vegetais. Gaste dois Pontos de Assimilação para converter o terreno num raio de 20 metros em um ambiente regenerativo. Aliados que tocarem o solo Regeneram um Ponto de Saúde por rodada durante a cena. Mortos nesse ambiente fazem suas raízes se espalharem criando nova vegetação local com o dobro da biodiversidade original — uma marca permanente de sua existência." }
        ]
      },
      {
        carta: "Dama de Ouros",
        nome: "Assimilação Quimiorreceptora",
        descricao: "O olfato do(a) Infectado(a) evolui, possibilitando que leia rastros, mentiras e histórias químicas, mas torna o mundo um tormento sensorial.",
        mutações: [
          { cost: "1 Adptação", name: "Faro Apurado", desc: "O olfato sofre mutações e se expandem por receptores epidérmicos. Identifica substâncias químicas simples e percebe odores em níveis residuais, incluindo feromônios, álcool ou putrefação. Essa sensibilidade causa desconforto e perda de um Ponto de Determinação se passar mais de 5 minutos exposto a odores intensos." },
          { cost: "2 Adptações", name: "Farejar Toxinas", desc: "O organismo distingue compostos orgânicos detectando agentes tóxicos ou contaminantes antes de ingeri-los, tocá-los ou inalá-los. Essa sensibilidade impede o consumo de comidas com cheiro acentuado, inclusive preparos bem temperados. Ingerir esses alimentos nas últimas 12 horas impede a Restauração de Determinação." },
          { cost: "1 Sucesso e 2 Adptações", name: "Farejar Rastros", desc: "Analisa rastros e identifica marcadores químicos residuais. Ao testar Furtividade, Sobrevivência ou Engenharia, adicione dois Sucessos ao analisar um local onde algo foi movido. Testes que incluam Percepção sofrem penalidade de Adaptação em novos ambientes, pois essas informações novas reduzem a atenção em outras coisas." },
          { cost: "3 Adptações e 1 Pressão", name: "Farejar Sentimentos", req: 3, desc: "3+ Nível de Assimilação: Detecta alterações hormonais, percebendo medo, desejo, repulsa, hesitação ou mentira baseado em alterações químicas. Gasta um Ponto de Assimilação para detectar nuances ou intenções emocionais do alvo. Adicione seus dados de Percepção a testes que incluam ExPressão ou Influência com este alvo. Sofre penalidade de Pressão em testes do mesmo tipo se realizados com mais de 5 pessoas no ambiente pela mistura de odores." },
          { cost: "5 Adptações", name: "Secreções", req: 5, desc: "5+ Nível de Assimilação: Desenvolve secreções cutâneas. Pode “marcar” uma trilha, objeto ou personagem para seguir o odor pelas próximas 24h, mesmo sem linha de visão e a longas distâncias que pode ser notado por criaturas com faro apurado, penalizando em dois Sucessos testes que incluam Furtividade contra essas criaturas." },
          { cost: "4 Adptações e 2 Pressões", name: "Farejar Psicometria", req: 7, desc: "7+ Nível de Assimilação: O sistema quimiorreceptor se integra completamente com sua função cognitiva. Gaste três Pontos de Assimilação para “ler” o estado químico de qualquer área, estrutura, objeto ou cadáver, recebe uma revelação precisa do(a) Assimilador(a) sobre o passado do alvo — inclusive fatores biológicos ocultos, não revelados em testes convencionais. Essa conexão e a percepção que tudo se degrada gera penalidade de duas Adaptações em testes que incluam Resolução." }
        ]
      },
      {
        carta: "Rei de Ouros",
        nome: "Assimilação Metabólica",
        descricao: "Um metabolismo fora de controle gera força, cura e resistência, mas cobra energia constante e consome o corpo do(a) Infectado(a) de dentro para fora.",
        mutações: [
          { cost: "1 Adptação", name: "Metabolismo Acelerado", desc: "O metabolismo opera de forma acelerada. Ao Regenerar Pontos de Saúde, Regenera um ponto adicional. Precisa consumir o triplo de calorias diárias ou perde um Ponto de Saúde por dia." },
          { cost: "1 Adptação e 1 Pressão", name: "Metabolismo Afiado", desc: "Converte gordura e músculos em energia. Mantém um dado adicional em Ações de Reação, Potência ou Resolução física. Penalidade de Pressão adicional em testes que envolvam Conhecimentos." },
          { cost: "1 Sucesso e 2 Adptações", name: "Metabolismo Regenerativo", desc: "Gaste dois Pontos de Determinação para acelerar a Recuperação. Regenera quatro Pontos de Saúde e sofre penalidade de um Sucesso em testes físicos até o final da cena. Pode ser ativada uma vez por cena e não funciona em Conflito." },
          { cost: "2 Adptações e 2 Pressões", name: "Imunidade Metabólica", req: 3, desc: "3+ Nível de Assimilação: Resiste a condições extremas (hipóxia, envenenamento leve, temperaturas), tornando-o imune a elas. Necessidade permanente de ingestão de sais e eletrólitos, não consumi-los diariamente gera uma penalidade cumulativa de Adaptação por dia em todos os testes." },
          { cost: "5 Adptações", name: "Metabolismo Eficiente", req: 5, desc: "5+ Nível de Assimilação: Induz breves surtos hormonais que o tornam mais eficiente. Gaste dois Pontos de Assimilação para manter dois dados adicionais em teste físico. Após a Ação, perde um Ponto de Saúde para cada Pressão mantida no resultado." },
          { cost: "6 Adptações", name: "Metabolizar Instintos", req: 7, desc: "7+ Nível de Assimilação: Atinge domínio total sobre sua fisiologia. Gaste todos os Pontos de Assimilação e distribua da maneira que preferir entre Potência, Reação e/ou Resolução. O nível desses Instintos não pode ultrapassar seu Nível de Assimilação. Sofre dano de um Ponto de Saúde por rodada até que desative o efeito." }
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
        carta: "Ás de Espadas",
        nome: "Assimilação Atrofiante",
        mutações: [
          { cost: "1 Pressão", name: "Rigidez Muscular", desc: "Processo degenerativo muscular. Penaliza em ADAPTAÇÃO em testes de Potência." },
          { cost: "2 Pressões", name: "Rigidez Articular", desc: "Sempre que realizar teste de Potência ou Atletismo em corrida/escalada/natação, sofre penalidade de SUCESSO." },
          { cost: "3 Pressões", name: "Nervos Atrofiados", desc: "Atinge nervos periféricos. Testes de Reação para estímulos rápidos sofrem penalidade de SUCESSO." },
          { cost: "4 Pressões", name: "Digestão Ineficaz", desc: "Precisa comer 3x por hora. Porções maiores causam regurgitação e perda de Determinação e vida." },
          { cost: "5 Pressões", name: "Atrofia Muscular", desc: "Falhar em testes de Potência/Resolução causa um ponto de dano por Pressão mantida." },
          { cost: "6 Pressões", name: "Falência", desc: "Fragiliza todo o corpo. Todo dano físico e todas as penalidades de vida (S) são dobrados." }
        ]
      },
      {
        carta: "2 de Espadas",
        nome: "Assimilação Neuropática",
        descricao: "Nervos disparam sinais confusos. Dor fantasma, tremores e reflexos tardios tornam o corpo do(a) Infectado(a) uma marionete de si mesmo.",
        mutações: [
          { cost: "1 Pressão", name: "Debilidade", desc: "A Assimilação danifica o equilíbrio elétrico dos neurônios motores do(a) Infectado(a). Sempre que realizar testes que incluam Atletismo, sofre uma penalidade de Sucesso no resultado." },
          { cost: "2 Pressões", name: "Inabilidade", desc: "A degeneração nervosa reduz a adaptabilidade do controle motor fino. Sempre que o(a) Infectado(a) realizar testes que incluam Manufaturas, Erudição ou ExPressão, sofre uma penalidade de Adaptação no resultado." },
          { cost: "3 Pressões", name: "Tremores", desc: "A instabilidade neuromuscular gera tremores involuntários sob estresse. Perde um Ponto de Determinação adicional por Pressão mantida em qualquer teste." },
          { cost: "4 Pressões", name: "Desorientação", desc: "A neuropatia afeta o senso de orientação espacial. Sempre que o(a) Infectado(a) realizar testes que incluam Percepção ou Sobrevivência envolvendo distância ou direção, sofre uma penalidade de dois Sucessos." },
          { cost: "5 Pressões", name: "Fragilidade", desc: "A progressão da falha neural compromete a resistência corporal, amplificando a percepção da dor. Sempre que o(a) Infectado(a) sofrer dano físico direto, perde um Ponto de Determinação. Caso o dano reduza seu Nível de Saúde, perde dois Pontos de Determinação." },
          { cost: "6 Pressões", name: "Inaptidão", desc: "A falência nervosa atinge estágio crítico. Durante Conflitos, todas as Ações do(a) Infectado(a) sofrem penalidade de Sucesso e Adaptação." }
        ]
      },
      {
        carta: "3 de Espadas",
        nome: "Assimilação Devoradora",
        descricao: "O metabolismo exige alimento constante; se negado, devora as reservas internas, corroendo a carne, a paciência e o foco do(a) Infectado(a).",
        mutações: [
          { cost: "1 Pressão", name: "Coeficiente Calórico", desc: "A Assimilação altera o metabolismo do(a) Infectado(a), exigindo constante ingestão de matéria orgânica. Sempre que passar mais de quatro horas sem comer, sofre uma penalidade de Sucesso em todos os testes até saciar a fome." },
          { cost: "2 Pressões", name: "Ignorância", desc: "A necessidade alimentar afeta a cognição. Se estiver há mais de duas horas sem comer, o(a) Infectado(a) sofre uma penalidade de Sucesso sempre que realizar testes que incluam Conhecimentos." },
          { cost: "3 Pressões", name: "Desarticulação", desc: "O instinto predatório se intensifica. Se estiver há mais de duas horas sem comer, o(a) Infectado(a) sofre uma penalidade de Pressão adicional em qualquer teste que inclua Influência." },
          { cost: "4 Pressões", name: "Apetite Corrosivo", desc: "A degradação física avança. O(a) Infectado(a) perde um Ponto de Saúde se passar mais de seis horas sem ingerir porção maior que cem gramas de alimento orgânico. Perde um ponto adicional a cada hora sem se alimentar depois das seis primeiras." },
          { cost: "5 Pressões", name: "Apetite Vacilante", desc: "A assimilação do sistema digestivo atinge estágio crítico de ineficiência no consumo alimentar. Se o(a) Infectado(a) ficar um dia inteiro (24 horas) sem comer, perde todos os seus Pontos de Determinação, se tornando Suscetível." },
          { cost: "6 Pressões", name: "Ânsia Terrível", desc: "O controle sobre o apetite enfraquece. Caso não tenha se alimentado por duas cenas inteiras, o(a) Infectado(a) perde o controle para a fome desde o início da terceira cena. Se isso acontecer, qualquer Ação que o(a) Infectado(a) tentar que não vise exclusivamente a ingestão de matéria orgânica será rolada com Resolução como o Instinto selecionado. O(a) Infectado(a) perde um Ponto de Determinação para cada Nível de Assimilação sempre que o fizer. Após saciar a fome o(a) Infectado(a) volta para o controle do(a) jogador(a) e precisa lidar com as consequências de seus atos." }
        ]
      },
      {
        carta: "4 de Espadas",
        nome: "Assimilação Secretora",
        descricao: "Glândulas hiperativas liberam fluidos e odores; funcionam como defesa instintiva, mas denunciam a presença do(a) Infectado(a) e afastam seus aliados.",
        mutações: [
          { cost: "1 Pressão", name: "Mal Odor", desc: "O corpo do(a) Infectado(a) passa a secretar constantemente uma substância pegajosa e de odor forte, mesmo em repouso. Sempre que o(a) Infectado(a) realizar testes que incluam ExPressão em ambientes fechados ou com pouca ventilação, sofre uma penalidade de Sucesso." },
          { cost: "2 Pressões", name: "Inchaço Debilitante", desc: "A pele do(a) Infectado(a) acumula gordura e umidade, tornando difícil o manuseio de objetos delicados. Sempre que realizar testes que incluam Manufaturas ou Armas para manipular armas de fogo, sofre penalidade de Sucesso." },
          { cost: "3 Pressões", name: "Escorregadio", desc: "A secreção constante forma um filme escorregadio em sua pele, comprometendo equilíbrio e tração. Sempre que realizar testes que incluam Atletismo em superfícies instáveis ou escorregadias, sofre uma penalidade de Sucesso." },
          { cost: "4 Pressões", name: "Fragilidade Térmica", desc: "A presença da secreção interfere na regulação térmica. Sempre que o(a) Infectado(a) estiver em ambientes extremos (calor ou frio intensos), dobre a penalidade aplicada." },
          { cost: "5 Pressões", name: "Inflamável", desc: "A secreção do corpo do(a) Infectado(a) se torna inflamável, fazendo com que qualquer contato com fogo cause um ponto de dano à Saúde para cada Ponto de Assimilação restante do(a) Infectado(a) e zerando esses pontos, deixando-o livre da secreção pelo restante da cena." },
          { cost: "6 Pressões", name: "Bufotoxina", desc: "A secreção de seu corpo é tóxica. Qualquer toque causa 1 de dano. Dormir no mesmo cômodo fechado que o(a) Infectado(a) exige de qualquer outra personagem um teste de Resolução com Medicina que tenha pelo menos dois Sucessos ou perde um Nível de Saúde completo." }
        ]
      },
      {
        carta: "5 de Espadas",
        nome: "Assimilação Calcificante",
        descricao: "Placas endurecidas formam ossos rígidos; roubam mobilidade, impondo rigidez crescente, atrapalhando a agilidade do(a) Infectado(a).",
        mutações: [
          { cost: "1 Pressão", name: "Endurecido", desc: "A Assimilação endurece ligamentos e tendões de forma irregular. Sempre que o(a) Infectado(a) realizar testes que incluam Furtividade ou Atletismo em ações que exijam leveza ou equilíbrio, sofre uma penalidade de Adaptação." },
          { cost: "2 Pressões", name: "Descoordenado", desc: "Pequenas formações ósseas irregulares se acumulam em articulações e regiões móveis. Sempre que o(a) Infectado(a) realizar qualquer Ação com múltiplos movimentos corporais sucessivos – saltar e correr, atacar e se mover, levantar e atirar (...) – sofre penalidade de Sucesso por ação adicional, além dos custos normais da Ação." },
          { cost: "3 Pressões", name: "Hesitante", desc: "A calcificação avança para a coluna, limitando movimentação. Sempre que o(a) Infectado(a) realizar testes para Fuga, cancele metade dos Sucessos mantidos, arredondando para cima." },
          { cost: "4 Pressões", name: "Travado", desc: "A progressão da Assimilação causa episódios de travamento articular. A cada Pressão mantida em testes de Potência ou Reação em Conflito, aumente no mesmo valor a quantidade de Sucessos necessários para a Fuga do(a) Infectado(a)." },
          { cost: "5 Pressões", name: "Combalido", desc: "As articulações do(a) Infectado(a) se tornaram tão rígidas que todos seus testes físicos substituem os d10 que seriam rolados por d6." },
          { cost: "6 Pressões", name: "Condrocalcinose", desc: "A calcificação atinge grau tão severo que o(a) Infectado(a) sofre uma penalidade de três Pressões adicionais em todos os testes físicos." }
        ]
      },
      {
        carta: "6 de Espadas",
        nome: "Assimilação Fotossensível",
        descricao: "Luz e claridade tornam-se agressivas. Pele e olhos ardem, empurrando o(a) Infectado(a) para sombras e isolamento.",
        mutações: [
          { cost: "1 Pressão", name: "Visão Sensível", desc: "A Assimilação altera a pigmentação e sensibilidade dos olhos do(a) Infectado(a), tornando-os incapazes de se adaptar bem à claridade. Sempre que o(a) Infectado(a) estiver exposto à luz intensa, sofre penalidade de Adaptação em testes que incluam Percepção." },
          { cost: "2 Pressões", name: "Pele de Vampiro", desc: "A sensibilidade começa a reagir negativamente à radiação solar. Sempre que o(a) Infectado(a) passar mais de trinta minutos sob luz solar direta, perde um Ponto de Determinação e um Ponto de Saúde." },
          { cost: "3 Pressões", name: "Enxaqueca", desc: "A fotossensibilidade provoca enxaquecas severas. Sempre que o(a) Infectado(a) passar uma cena inteira em local iluminado, não Restaura Determinação em sua próxima Recuperação." },
          { cost: "4 Pressões", name: "Visão Sensível", desc: "As pupilas do(a) Infectado(a) não conseguem mais se adaptar rapidamente. Sempre que sair de um ambiente escuro para um iluminado ou vice-versa, sofre uma penalidade de dois Sucessos em todos os testes nas primeiras rodadas." },
          { cost: "5 Pressões", name: "Visão Curta", desc: "A Assimilação afeta a percepção de contraste e profundidade. O(a) Infectado(a) sofre penalidade permanente de Sucesso em todos os testes de ataque de longo alcance." },
          { cost: "6 Pressões", name: "Visão Noturna", desc: "O(a) Infectado(a) só é capaz de enxergar na ausência total de luz. Qualquer luz é capaz de ofuscá-lo, forçando-o a fazer qualquer teste com o Instinto de Percepção e impondo penalidade de dois Sucessos ao resultado." }
        ]
      },
      {
        carta: "7 de Espadas",
        nome: "Assimilação Litodérmica",
        descricao: "A pele se transforma em uma mistura metálica, enfraquecendo sua resistência, atrapalhando suas interações e, em última instância, afetando até mesmo o sangue do(a) Infectado(a).",
        mutações: [
          { cost: "1 Pressão", name: "Afasta Animais", desc: "A infecção mineral se intensifica, alterando a bioquímica superficial da pele do(a) Infectado(a). Um odor ferroso passa a exalar de seu corpo, provocando reações defensivas nos animais ao redor. Qualquer teste que envolva interação com animais sofre uma penalidade de Sucesso." },
          { cost: "2 Pressões", name: "Ossos Frágeis", desc: "Cristais minerais começam a se formar nos ossos do(a) Infectado(a), criando saliências visíveis em partes do corpo. Essas formações comprometem a flexibilidade e a capacidade de absorção de impactos da pele, fazendo com que todo dano de impacto contra o(a) Infectado(a) seja aumentado em um ponto." },
          { cost: "3 Pressões", name: "Eletrossensível", desc: "As estruturas cristalinas tornam-se um condutor elétrico e comprometem o funcionamento das glândulas sudoríparas, dificultando a regulação térmica. Sempre que o(a) Infectado(a) sofrer dano elétrico, o valor do dano é dobrado. Sempre que sofrer dano por calor ou queimadura, perde também um Ponto de Determinação." },
          { cost: "4 Pressões", name: "Carapaça Disforme", desc: "As formações minerais atravessam a derme, provocando dor contínua e extrema sensibilidade ao contato rígido. O(a) Infectado(a) não pode usar peças de vestuário estruturadas ou armaduras rígidas — como coletes, trajes de contenção ou qualquer equipamento similar. Além disso, caso não durma sobre uma superfície macia, sua próxima Recuperação não terá efeito." },
          { cost: "5 Pressões", name: "Muco Oxidante", desc: "O corpo do(a) Infectado(a) passa a liberar resíduos oxidados pelas formações minerais, secretando um muco que enferruja qualquer equipamento ou artefato metálico em contato com o corpo do(a) Infectado(a) por uma cena completa, reduzindo um nível de Qualidade. Adicionalmente, sempre que estiver segurando um equipamento metálico que não seja um Artefato e gastar um Ponto de Assimilação, qualquer Pressão mantida no resultado reduz um nível de Qualidade do equipamento." },
          { cost: "6 Pressões", name: "Fígado Estragado", desc: "A infecção mineral é Assimilada ao sangue, sobrecarregando o fígado. O(a) Infectado(a) precisa fazer tratamento semanal com sangria ou desenvolverá cirrose hepática. Caso desenvolva a doença o(a) Infectado(a) perde um Nível de Saúde por semana até que faça um transplante de fígado que exige tratamento cirúrgico com o teste de Medicina de pelo menos cinco Sucessos." }
        ]
      },
      {
        carta: "8 de Espadas",
        nome: "Assimilação Entorpecida",
        descricao: "Os sentidos se arrastam, amortecidos. Proteção contra a dor que embota a reação do(a) Infectado(a) e distorce sua orientação.",
        mutações: [
          { cost: "1 Pressão", name: "Agorafobia", desc: "A Assimilação afeta as conexões entre os nervos ópticos e o cérebro. O(a) Infectado(a) sofre percepção distorcida de movimento e contraste em ambientes amplos ou abertos. Sempre que realizar testes que incluam Percepção em áreas externas ou grandes espaços, sofre penalidade de Sucesso." },
          { cost: "2 Pressões", name: "Sensibilidade Auditiva", desc: "A audição do(a) Infectado(a) se torna aguda e sensível. Qualquer som repentino ou alto pode provocar vertigem ou desorientação. Sempre que estiver exposto a ruídos intensos (explosões, sirenes, gritos), perde um Ponto de Determinação." },
          { cost: "3 Pressões", name: "Sentidos Sobrecarregados", desc: "Os sentidos do(a) Infectado(a) se sobrecarregam ao mesmo tempo. Se sofrer simultaneamente exposição a múltiplos estímulos sensoriais intensos, sofre uma penalidade de Sucesso em todas as Ações." },
          { cost: "4 Pressões", name: "Desorientação Aguda", desc: "O desgaste nos sentidos faz com que o(a) Infectado(a) sofra uma penalidade de Pressão adicional ao resultado de testes que incluam Percepção ou Reação." },
          { cost: "5 Pressões", name: "Devaneios", desc: "O cérebro passa a gerar alucinações táteis, visuais e sonoras espontâneas. Uma vez por sessão de jogo, em momentos de grande tensão, o(a) Assimilador(a) pode introduzir um estímulo falso, dificultando a Ação do(a) Infectado(a), com isso reduzindo em dois Sucessos o resultado do teste. O(a) Assimilador(a) deve descrever a cena com as ilusões da alucinação e em seguida o que de fato aconteceu." },
          { cost: "6 Pressões", name: "Dessensibilização Aguda", desc: "O(a) Infectado(a) perde 85% de todos os sentidos, perdendo todos os níveis em Percepção na Ficha de Infectados, ficando com zero. Esses níveis não podem ser comprados novamente e só retornam se forem anuladas todas as Pressões dessa mutação através de Clareza de Propósito. Toda rolagem que inclua Percepção só será feita se houver outra Aptidão selecionada fornecendo dados para a rolagem, do contrário é falha automática." }
        ]
      },
      {
        carta: "9 de Espadas",
        nome: "Assimilação Aberrante",
        descricao: "Tecidos e órgãos redundantes surgem sem harmonia. Aumentam o consumo e reduzem a eficiência da fisiologia do(a) Infectado(a).",
        mutações: [
          { cost: "1 Pressão", name: "Anomorfia", desc: "O corpo do(a) Infectado(a) desenvolve órgãos e tecidos desnecessários em uma busca desesperada por evolução. A má formação afeta um de seus Instintos à escolha do(a) jogador(a), reduzindo em um ponto o Instinto escolhido na Ficha de Infectados. Escolha um Instinto no qual tenha pelo menos dois pontos." },
          { cost: "2 Pressões", name: "Pernas Disformes", desc: "Má formação nas pernas causa perda de mobilidade. Em cada Conflito, remova o primeiro Sucesso que investir em Fuga." },
          { cost: "3 Pressões", name: "Hipersensibilidade", desc: "A Assimilação afeta as terminações nervosas, tornando-as hipersensíveis ao toque. Sempre que o(a) Infectado(a) for tocado firmemente ou sofrer dano, perde um Ponto de Determinação." },
          { cost: "4 Pressões", name: "Recuperação Debilitada", desc: "Os órgãos redundantes drenam recursos fisiológicos. Sempre que o(a) Infectado(a) ativar uma Recuperação, restaura apenas metade dos Pontos de Saúde e Pontos de Determinação, arredondado para cima." },
          { cost: "5 Pressões", name: "Descoordenação", desc: "Certas partes do corpo começam a operar de forma autônoma e não coordenada com o resto do organismo. Sempre que o(a) Infectado(a) obtiver dois Sucessos ou mais em um teste, um dos Sucessos se transformará em Pressão, representando um espasmo, bloqueio ou conflito interno." },
          { cost: "6 Pressões", name: "Aberração", desc: "O corpo do(a) Infectado(a) se torna completamente irreconhecível, mudando completamente a aparência e a voz do(a) Infectado(a) para um aspecto de aberração retorcida e mal formada, podendo afetar até mesmo o número de membros, à escolha do(a) Assimilador(a)." }
        ]
      },
      {
        carta: "10 de Espadas",
        nome: "Assimilação Hipersensível",
        descricao: "O mundo é áspero e invasivo, especialmente ao(à) Infectado(a) que sofre de hipersensibilidade. Dor ou ruídos intensos podem ser particularmente agressivos.",
        mutações: [
          { cost: "1 Pressão", name: "Vulnerabilidade a Dor", desc: "O sistema nervoso do(a) Infectado(a) se torna excessivamente responsivo a estímulos externos. Sempre que sofrer dano físico, mesmo que mínimo, o(a) Infectado(a) sofre também uma penalidade de Sucesso no próximo teste que incluir Potência, Reação ou Resolução." },
          { cost: "2 Pressões", name: "Vulnerabilidade Emocional", desc: "A sensibilidade se expande para o campo emocional. Sempre que o(a) Infectado(a) receber uma crítica, provocação ou escárnio (mesmo que narrativamente leve), sofre uma penalidade de Adaptação em todos os testes pelo restante da cena." },
          { cost: "3 Pressões", name: "Dor Degradante", desc: "O limiar de dor do(a) Infectado(a) se reduz drasticamente. Toda vez que sofrer dano físico por ataque corpo a corpo ou queda, perde um Ponto de Determinação." },
          { cost: "4 Pressões", name: "Sensibilidade Radical", desc: "Estímulos ambientais se tornam insuportáveis. Em cenas com barulho intenso, temperatura extrema ou iluminação incômoda, o(a) Infectado(a) sofre uma penalidade de dois Sucessos em todos os testes com Conhecimentos ou ExPressão." },
          { cost: "5 Pressões", name: "Recuperação Sensível", desc: "A hipersensibilidade nervosa impede o descanso reparador. Recuperações perdem 50% de eficácia caso o repouso não aconteça em ambiente controlado (ruídos reduzidos, luz baixa e temperatura amena). Essa limitação se acumula com outras penalidades de Recuperação." },
          { cost: "6 Pressões", name: "Sensibilidade Extrema", desc: "O sistema nervoso entra em colapso ao ser exposto a múltiplos estímulos simultâneos. Sempre que houver três ou mais fontes de estímulo (danos, ruídos, cheiros, calor...), o(a) Infectado(a) perde imediatamente um Ponto de Saúde e um Ponto de Determinação e não pode manter mais do que um dado em qualquer teste feito até o fim da cena." }
        ]
      },
      {
        carta: "Valete de Espadas",
        nome: "Assimilação Mioclônica",
        descricao: "Espasmos e tiques rompem o controle. Movimentos erráticos minam a sutileza e inviabilizam a precisão do(a) Infectado(a).",
        mutações: [
          { cost: "1 Pressão", name: "Espasmos Involuntários", desc: "O corpo do(a) Infectado(a) responde com movimentos bruscos a estímulos banais. Sempre que o(a) jogador(a) obtiver qualquer Pressão em uma rolagem, o(a) Assimilador(a) pode narrar um pequeno espasmo ou reação involuntária, como um susto, chute leve ou se virar bruscamente." },
          { cost: "2 Pressões", name: "Aflição Grave", desc: "Os impulsos se intensificam em situações de tensão. Sempre que o(a) Infectado(a) estiver em uma Cena de Conflito, sofre uma penalidade de Sucesso em qualquer Ação que requeira controle corporal — incluindo recarga de armas, furtividade ou evitar armadilhas." },
          { cost: "3 Pressões", name: "Movimentos Involuntários", desc: "A Assimilação gera impulsos sem relação com o ambiente. Ao entrar em uma nova cena, o(a) Assimilador(a) deve escolher aleatoriamente um dos membros do corpo (braço, perna, pescoço etc.), que será afetado por movimentos involuntários. Durante essa cena, o(a) Infectado(a) sofre penalidade de Pressão em qualquer ação que dependa daquele membro." },
          { cost: "4 Pressões", name: "Barulhos Involuntários", desc: "O corpo passa a responder a não-estímulos. Em qualquer situação de calma ou silêncio absoluto, o(a) Infectado(a) é compelido a emitir sons involuntários (como estalar a língua, ranger os dentes, bater os dedos ou emitir ruídos com a garganta), o que anula automaticamente qualquer tentativa de surpresa, camuflagem ou emboscada." },
          { cost: "5 Pressões", name: "Agitação Constante", desc: "A Assimilação interfere na rotina motora. O(a) Infectado(a) não consegue permanecer imóvel por mais de um minuto, mesmo que queira. Sempre que for necessário repousar ou aguardar em posição, ele perde um Ponto de Determinação por minuto." },
          { cost: "6 Pressões", name: "Debilidade Extrema", desc: "A compulsão se torna debilitante. Em qualquer teste físico, o(a) Infectado(a) sofre penalidade de Sucesso, além de Pressão adicional. Além disso, deve descartar imediatamente a face de dado com maior número de Sucessos após cada rolagem." }
        ]
      },
      {
        carta: "Dama de Espadas",
        nome: "Assimilação Disfásica",
        descricao: "A fala se rompe em falhas e sons truncados. Pensamento rápido, mas voz irregular, distante da comunicação habitual.",
        mutações: [
          { cost: "1 Pressão", name: "Desvio de Fala", desc: "O(a) Infectado(a) passa a sofrer lapsos de linguagem em momentos de tensão. Sempre que rolar qualquer Pressão em uma ação que envolva comunicação verbal, o(a) Assimilador(a) pode narrar um erro de fala — troca de palavras, gagueira ou silêncio repentino — que compromete a ação ou exige retratação." },
          { cost: "2 Pressões", name: "Fala Debilitada", desc: "A Assimilação desorganiza o acesso à linguagem em situações sociais. Sempre que o(a) Infectado(a) realizar testes que incluam ExPressão ou Influência em diálogo com personagens do(a) Assimilador(a), sofre uma penalidade de Sucesso se tentar formular frases complexas ou expor argumentos longos." },
          { cost: "3 Pressões", name: "Memória Debilitada", desc: "O distúrbio afeta a memória verbal. O(a) Infectado(a) não consegue repetir corretamente instruções ou relatos com mais de uma frase. Sempre que tentar transmitir informação recebida ou repassar mensagens, o conteúdo é truncado, invertido ou alterado. O(a) Assimilador(a) decide como a informação chega ao destino." },
          { cost: "4 Pressões", name: "Fala Simplificada", desc: "A Assimilação afeta a articulação vocal. O(a) Infectado(a) não consegue pronunciar corretamente palavras que envolvam nomes próprios, números ou conceitos técnicos. Em testes envolvendo Engenharia, Medicina ou qualquer Conhecimento, sofre penalidade de dois Sucessos se a comunicação verbal estiver envolvida." },
          { cost: "5 Pressões", name: "Letra Ilegível", desc: "O distúrbio se alastra para a linguagem escrita. Toda vez que o(a) Infectado(a) tentar se comunicar por escrito, símbolos se confundem, letras se embaralham, e a mensagem não é compreendida — exceto se for entregue pessoalmente junto a um teste de Influência ou ExPressão com, no mínimo, dois Sucessos." },
          { cost: "6 Pressões", name: "Fala Incompreensível", desc: "O colapso da linguagem é completo. O(a) Infectado(a) perde a capacidade de produzir fala compreensível durante as cenas de Conflito ou mesmo em situação de narrativa fluida que envolvam grande tensão. Se limita a emitir sons desconexos, sílabas soltas ou palavras trocadas. Todas as ações que dependam de comunicação verbal devem ser substituídas por mímica, desenhos ou sofrer penalidade de duas Pressões adicionais. A fala normal retorna apenas fora de cena ou com ajuda externa, como outro(a) Infectado(a) de intérprete através de um teste bem-sucedido de Influência." }
        ]
      },
      {
        carta: "Rei de Espadas",
        nome: "Assimilação Terminal",
        descricao: "A vitalidade se esgota lentamente. Capacidades desaparecem enquanto a Assimilação toma o corpo do(a) Infectado(a) por completo.",
        mutações: [
          { cost: "1 Pressão", name: "Pressão Estendida", desc: "O corpo do(a) Infectado(a) começa a exibir falhas de funcionamento. Sempre que sofrer uma penalidade por Pressão, essa penalidade persiste por uma cena adicional, mesmo que a causa original tenha desaparecido." },
          { cost: "2 Pressões", name: "Recuperação Sofrida", desc: "A recuperação do organismo se torna ineficaz. Sempre que Regenerar qualquer quantidade de Saúde, o(a) Infectado(a) sofre 1 ponto de dano direto antes da Recuperação." },
          { cost: "3 Pressões", name: "Pressão por Fracasso", desc: "A Assimilação desregula respostas motoras e cognitivas. Sempre que o(a) Infectado(a) falhar em um teste (não mantiver qualquer Sucesso), sofre penalidade de Pressão no próximo teste — acumula se persistir falhando." },
          { cost: "4 Pressões", name: "Aptidões Arruinadas", desc: "Aptidões começam a se desintegrar. No início de cada cena, o(a) Assimilador(a) escolhe aleatoriamente uma Aptidão do(a) Infectado(a) (Instinto, Conhecimento ou Prática). Todas as rolagens envolvendo essa Aptidão são tratadas como se não tivesse nenhum nível até o final da cena." },
          { cost: "5 Pressões", name: "Determinação Hesitante", desc: "O corpo perde consistência nas respostas. Sempre que o(a) Infectado(a) usar um Ponto de Determinação para manter dados adicionais, ele deve descartar automaticamente Sucesso ou Adaptação do resultado, escolhido pelo(a) Assimilador(a)." },
          { cost: "6 Pressões", name: "Inaptidão Extrema", desc: "O colapso corporal é inevitável. Todos os testes do(a) Infectado(a) sofrem penalidade de duas Pressões e ele perde permanentemente um ponto de uma Aptidão base (à escolha do(a) Assimilador(a)). Esta perda permanece até que esta mutação seja anulada. Uma Aptidão pode ser reduzida a 0 desta forma, impossibilitando qualquer teste associado a ela." }
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
        descricao: "Tecidos lenhosos e raízes internas permitem ao(à) Infectado(a) regenerar-se em meio a árvores, mas longe de vegetação seu corpo definha, exigindo contato com solo fértil.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Embaúba", desc: "A cada hora imóvel com os pés ou mãos em contato direto com vegetação viva ou solo úmido, entra em estado de simbiose e Regenera um Ponto de Saúde. Dobra todo dano sofrido nesse período. Sofrer dano interrompe o efeito." },
          { cost: "1 Sucesso e 1 Pressão", name: "Eucalyptus", desc: "Se for reduzido aos Níveis de Saúde 1 ou 2, o(a) Infectado(a) pode optar por permanecer imóvel por 6 horas em contato com solo fértil para habilitar sua Recuperação como se estivesse no Nível de Saúde 3. Se for interrompido durante o processo, qualquer teste de Medicina para viabilizar a Recuperação receberá Pressão adicional no resultado." },
          { cost: "1 Adptação e 1 Pressão", name: "Araucária", desc: "Se passar mais de 24 horas sem contato direto com vegetação viva ou solo fértil, o(a) Infectado(a) sofre uma penalidade de Sucesso em todo teste que inclua Sobrevivência até restabelecer esse contato por pelo menos 1 hora." }
        ]
      },
      {
        carta: "2 de Paus",
        nome: "Assimilação da Campina",
        descricao: "O corpo do(a) Infectado(a) se adapta ao campo aberto: postura baixa, movimentos ágeis e percepção aguçada pelo vento e vibrações do solo, garantindo vigilância constante em áreas planas.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Alecrim", desc: "Durante o dia, enquanto estiver exposto à luz solar direta por pelo menos 1 hora, pode gastar um Ponto de Determinação para dispensar a necessidade de alimentação e água por 24 horas. Esse efeito não se acumula e é anulado por ambientes sem luz natural (interiores, subsolo ou neblina densa)." },
          { cost: "1 Sucesso e 1 Pressão", name: "Cágado", desc: "A epiderme do(a) Infectado(a) se torna parcialmente transparente para otimizar a absorção solar. Enquanto exposto ao sol, Recupera um Ponto de Saúde por cena automaticamente. Contudo, sofre um d10 de dano adicional de ataques baseados em calor ou luz intensa (como fogo, laser ou clarões bioluminescentes)." },
          { cost: "1 Adptação e 1 Pressão", name: "Maria-da-campina", desc: "A pele fotossintética do(a) Infectado(a) não tolera bem a ausência de luz natural. A cada dia passado sem exposição direta ao sol (ou fonte equivalente), sofre uma penalidade de Sucesso em testes de Resolução até que a exposição seja restabelecida por ao menos 1 hora." }
        ]
      },
      {
        carta: "3 de Paus",
        nome: "Assimilação do Cerrado",
        descricao: "Casca grossa protege o(a) Infectado(a) contra lesões e aridez. O organismo armazena água em reservas internas e consegue se recuperar após longos períodos de calor intenso e seca.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Tatu-canastra", desc: "Enquanto estiver sob sol forte ou clima seco, você recebe um ponto de dano a menos de ataques físicos. Esse bônus se perde se estiver em clima úmido, submerso ou sob chuva intensa." },
          { cost: "1 Sucesso e 1 Pressão", name: "Mandacaru", desc: "Sempre que sofrer dois ou mais pontos de dano em um mesmo ataque, a camada externa de sua carapaça se fragmenta em estilhaços, ferindo quem estiver em alcance corpo a corpo. O atacante sofre um ponto de dano direto, mas você também sofre uma penalidade de Sucesso em testes de Reação até a carapaça regenerar (o que só ocorre após o fim da cena)." },
          { cost: "1 Adptação e 1 Pressão", name: "Lobo-guará", desc: "Sua anatomia reage mal à umidade. Sempre que entrar em contato prolongado com água (chuva intensa, submersão, clima encharcado), sofre uma penalidade de Sucesso em testes que incluam Potência ou Furtividade até se secar completamente." }
        ]
      },
      {
        carta: "4 de Paus",
        nome: "Assimilação da Colina",
        descricao: "Músculos e tendões do(a) Infectado(a) se avolumam para ganhar força. A resistência se prolonga em terrenos inclinados e o corpo aprende a economizar energia durante subidas íngremes.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Caxinguelê", desc: "Ignora penalidades por terreno inclinado, escorregadio ou irregular durante deslocamentos e escaladas. Sempre que investir Sucesso em Fuga, adicione Sucesso. Além disso, não pode ser derrubado ou desequilibrado por meios físicos, a menos que o ataque cause dano." },
          { cost: "1 Sucesso e 1 Pressão", name: "Porco-do-mato", desc: "Recebe Sucesso adicional em testes que incluam Atletismo ao correr, saltar ou escalar, mas sofre a penalidade de Pressão adicional em testes que incluam Furtividade devido à rigidez dos movimentos." },
          { cost: "1 Adptação e 1 Pressão", name: "Jabuti-piranga", desc: "Em ambientes planos ou excessivamente nivelados (ambientes urbanos, corredores, pisos industriais), sofre menos Sucesso em testes que incluam Reação até deixar o local ou se adaptar por uma cena inteira." }
        ]
      },
      {
        carta: "5 de Paus",
        nome: "Assimilação Desértica",
        descricao: "Suor e metabolismo se adaptam à baixa umidade e a temperaturas extremas. O(a) Infectado(a) consome quantidades reduzidas de água e desenvolve outras maneiras de se proteger.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Suculenta", desc: "Pode permanecer até 5 dias sem consumir água sem sofrer penalidades." },
          { cost: "1 Sucesso e 1 Pressão", name: "Diabo-espinhoso", desc: "O corpo libera secreções que irritam olhos e mucosas. Agressores corpo a corpo sofrem 1 de dano ou Sucesso adicional em neutralização da Ameaça. Toda Pressão mantida pelo resto da cena causa 1 de dano a um aliado próximo." },
          { cost: "1 Adptação e 1 Pressão", name: "Esquilo Terrestre", desc: "Passa a cavar buracos para dormir em segurança, perde um Ponto de Determinação se não dormir em uma toca." }
        ]
      },
      {
        carta: "6 de Paus",
        nome: "Assimilação Florestal",
        descricao: "O corpo do(a) Infectado(a) aprimora seu equilíbrio e sua capacidade de se esgueirar em terrenos densos. Visão e audição se adaptam à penumbra e a movimentação entre árvores é quase imperceptível aos predadores.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Morcego-narigudo", desc: "Passa a ignorar penalidades por baixa luminosidade natural, incluindo crepúsculo, sombra densa ou penumbra. Esse efeito não se aplica à escuridão total nem à ausência de luz artificial." },
          { cost: "1 Sucesso e 1 Pressão", name: "Sucuri", desc: "Os sons são absorvidos pela pele. Recebe Adaptação adicional em testes que incluem Furtividade ao se mover em vegetação densa, mas sofre Pressão em testes que incluem ExPressão, pois a vocalização do(a) Infectado(a) se torna abafada e pouco audível." },
          { cost: "1 Adptação e 1 Pressão", name: "Rato-do-mato", desc: "Ao sair abruptamente de ambiente sombreado para um muito iluminado, sofre uma penalidade de Sucesso em testes que incluem Percepção por 1 cena, devido à saturação do nervo óptico." }
        ]
      },
      {
        carta: "7 de Paus",
        nome: "Assimilação do Manguezal",
        descricao: "Poros filtram sal e membros se adaptam ao lodo. O(a) Infectado(a) respira e se move em áreas encharcadas, resistindo a infecções típicas de ambientes lamacentos.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Mangue-vermelho", desc: "Pode consumir água salobra ou salina sem qualquer prejuízo." },
          { cost: "1 Sucesso e 1 Pressão", name: "Caramujo-do-mangue", desc: "Consegue respirar parcialmente pela pele em ambientes alagadiços, permanecendo submerso por até 10 minutos. No entanto, a pele do(a) Infectado(a) torna-se vulnerável, sofrendo um ponto de dano adicional contra ataques físicos." },
          { cost: "1 Adptação e 1 Pressão", name: "Sururu", desc: "Ao passar mais de 6 horas em ambientes secos (ambiente urbano, cerrado, alta montanha), a pele começa a rachar. Sofre uma penalidade de Sucesso em testes que incluam Reação até ser reidratado por imersão ou umidade ambiental." }
        ]
      },
      {
        carta: "8 de Paus",
        nome: "Assimilação Marinha",
        descricao: "Pulmões e músculos se adaptam à Pressão e correntes marinhas. O(a) Infectado(a) nada com eficiência e tolera longas imersões, explorando o oceano sem risco de colapso.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Toninha", desc: "Você se move duas vezes mais rápido na água do que um humano comum, e não precisa testar Atletismo para nadar, exceto em tempestades ou redemoinhos. Dobre todos os Sucessos investidos em Fuga nadando." },
          { cost: "1 Sucesso e 1 Pressão", name: "Biguá", desc: "Tem Sucesso adicional em testes que incluem Atletismo na água ou areia fofa, e adiciona Pressão em testes que incluem Manufaturas, pois a motricidade fina dos dedos foi comprometida." },
          { cost: "1 Adptação e 1 Pressão", name: "Tartaruga-aruanã", desc: "Sempre que estiver correndo ou saltando em pisos rígidos (metal, concreto, pedra), sofre Pressão em testes que incluem Potência, devido ao formato instável das extremidades." }
        ]
      },
      {
        carta: "9 de Paus",
        nome: "Assimilação da Montanha",
        descricao: "O sangue engrossa e a circulação se ajusta. O(a) Infectado(a) suporta ar rarefeito e frio intenso, mantendo energia e estabilidade mesmo em grandes altitudes.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Urubu-Rei", desc: "Não sofre qualquer penalidade por altitudes elevadas ou ar rarefeito, mesmo acima de 3000m. Pode manter esforço físico moderado por mais tempo sem fadiga." },
          { cost: "1 Sucesso e 1 Pressão", name: "Calango-bandeira", desc: "Pode prender a respiração por até 10 minutos mesmo em movimento, mas em climas quentes e secos perde Adaptação em testes de Influência ou ExPressão, devido à rouquidão." },
          { cost: "1 Adptação e 1 Pressão", name: "Tucanuçu", desc: "Ao passar mais de 1 hora em ambientes abafados ou com alta umidade, tem a Sagacidade reduzida em um (mínimo 0), como se estivesse em constante mal-estar leve." }
        ]
      },
      {
        carta: "10 de Paus",
        nome: "Assimilação do Pântano",
        descricao: "Pele e pulmões toleram gases e microrganismos da água estagnada. O(a) Infectado(a) detecta movimentos sutis no brejo, usando o terreno alagado como proteção natural.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Guaiamu", desc: "Ignora penalidades de movimento em terrenos encharcados ou instáveis. Pode atravessar até 2 metros de profundidade de água ou lama sem necessidade de teste." },
          { cost: "1 Sucesso e 1 Pressão", name: "Garça-azul", desc: "Possui Sucesso adicional em testes que incluem Furtividade ao caminhar sobre lama ou folhas alagadas, pois seus passos não fazem barulho. Contudo, sofre Pressão adicional em testes que incluam Reação em ambientes fechados, onde o alongamento das pernas prejudica o equilíbrio." },
          { cost: "1 Adptação e 1 Pressão", name: "Sapo-cururu", desc: "Se for derrubado ou sofrer queda, deve fazer um teste de Potência ou irá sofrer um ponto de dano adicional de todos os ataques até o fim da cena, por instabilidade nas articulações." }
        ]
      },
      {
        carta: "Valete de Paus",
        nome: "Assimilação da Caatinga",
        descricao: "O organismo do(a) Infectado(a) aprende a reduzir funções em longos períodos secos, desperta com chuvas ocasionais e protege-se de predadores com pele espessa e pontiaguda.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Rola-bosta", desc: "Reduz em um ponto todo dano cortante ou perfurante sofrido por fontes naturais (espinhos, facas, garras). Esse efeito não se aplica a armas de fogo ou ataques energéticos." },
          { cost: "1 Sucesso e 1 Pressão", name: "Asa-branca", desc: "A pele do(a) Infectado(a) o protege contra insolação e exposição solar extrema por até 2 cenas, mesmo sem abrigo ou água. Tem Influência reduzida em um (mínimo 0), devido à aparência enrijecida e aspecto vítreo." },
          { cost: "1 Adptação e 1 Pressão", name: "Teiú", desc: "Em ambientes úmidos ou com pouca circulação de ar, acumula calor corporal, sofrendo uma penalidade de Sucesso em testes que incluem Reação após 2 horas." }
        ]
      },
      {
        carta: "Dama de Paus",
        nome: "Assimilação Subterrânea",
        descricao: "Visão perde relevância entre os sentidos. Pele e ouvido detectam vibrações e correntes de ar em túneis. O(a) Infectado(a) se orienta no escuro e resiste a confinamento e baixa oxigenação.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Tatu-canastra", desc: "Detecta movimentos ou presenças num raio de 10 metros se estiver tocando o chão com as mãos ou pés descalços, mesmo na escuridão. Não identifica outros detalhes, somente a intensidade e a distância." },
          { cost: "1 Sucesso e 1 Pressão", name: "Coruja-buraqueira", desc: "Recebe Sucesso adicional em testes que incluem Percepção para identificar sons abafados ou ecos subterrâneos, mas sofre Pressão adicional em testes que incluem Reação relacionados a ruídos altos repentinos (tiros, explosões), por conta do sistema auditivo hipersensível." },
          { cost: "1 Adptação e 1 Pressão", name: "Morcego-de-cauda-livre", desc: "Ambientes com múltiplos sons sobrepostos (máquinas, motores, grandes multidões) te sobrecarregam. Tem a Sagacidade reduzida em um (mínimo 0) nesses locais até que se isole." }
        ]
      },
      {
        carta: "Rei de Paus",
        nome: "Assimilação da Tundra",
        descricao: "O metabolismo do(a) Infectado(a) regula calor em ambientes gélidos. Seu sangue não congela e seu corpo suporta longos períodos em torpor, reduzindo desgaste no frio extremo.",
        mutações: [
          { cost: "1 Adptação e 1 Sucesso", name: "Líquen-de-mapa", desc: "Não sofre penalidades por frio intenso ou neve, mesmo abaixo de –20°C. Pode dormir ao relento sem risco de congelamento ou exaustão térmica." },
          { cost: "1 Sucesso e 1 Pressão", name: "Marmota-alpina", desc: "Pode entrar voluntariamente em estado de torpor por até 12 horas, reduzindo consumo de oxigênio e estabilizando ferimentos (não morre por sangramento nesse estado). Contudo, ao sair do torpor, a Potência é reduzida em um (mínimo 0) até o próximo descanso." },
          { cost: "1 Adptação e 1 Pressão", name: "Husky siberiano", desc: "Os pelos de todo o corpo crescem muito formando uma proteção contra o frio. Em ambientes quentes sofre Pressão adicional em testes que incluam Atletismo." }
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

