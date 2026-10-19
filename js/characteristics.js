export const CARACTERISTICAS = [
  // 1 Ponto
  {
    id: "agricultor",
    nome: "Agricultor",
    custo: 1,
    requisitoText: "Geografia 1+",
    requisitos: { Geografia: 1 },
    descricao: "Em todas as Jogadas do(a) Infectado(a) oriundas de questões agrárias ou biológicas acerca da vida vegetal comumente cultivadas pelo ser humano, como identificação de grãos, frutos, vegetais, mudas ou pragas agrícolas, o(a) Infectado(a) ganha um Sucesso adicional."
  },
  {
    id: "cavaleiro",
    nome: "Cavaleiro",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todos os testes para conduzir animais de montaria podem transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "estagio_avancado",
    nome: "Estágio Avançado",
    custo: 1,
    requisitoText: "Apenas na criação inicial",
    requisitos: { criacao: true },
    descricao: "Esta Característica só pode ser selecionada na criação da Ficha inicial do(a) Infectado(a). Aumenta em 1 o Nível de Assimilação inicial, reduzindo consequentemente em 1 o Nível de Determinação. O(a) Assimilador(a) deve aprovar o uso desta Característica e, se o fizer, conduzir a rolagem de dados e a escolha de Assimilações adicionais (ver “Evoluindo e Assimilando” – pág. 124)."
  },
  {
    id: "investigador_assimilation",
    nome: "Investigador da Assimilação",
    custo: 1,
    requisitoText: "Biologia 1+",
    requisitos: { Biologia: 1 },
    descricao: "Em todo teste relacionado ao entendimento sobre aspectos biológicos da Assimilação, o(a) Infectado(a) pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "pegada_forte",
    nome: "Pegada Forte",
    custo: 1,
    requisitoText: "Potência 2+",
    requisitos: { Potência: 2 },
    descricao: "Todos os testes do(a) Infectado(a) envolvendo firmeza para se segurar em algo ou não deixar que uma pessoa ou objeto escape das suas mãos permitem transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "piloto",
    nome: "Piloto",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todos os testes para condução de veículos permitem transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "punhos_de_ferro",
    nome: "Punhos de Ferro",
    custo: 1,
    requisitoText: "Potência 2+ e Resolução 2+",
    requisitos: { Potência: 2, Resolução: 2 },
    descricao: "Quando usar um Ponto de Determinação para manter um dado adicional em ações de combate desarmado, o(a) Infectado(a) pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "saque_rapido",
    nome: "Saque Rápido",
    custo: 1,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "O(a) Infectado(a) pode selecionar o Equipamento usado em uma ação depois de ver o resultado da rolagem dos dados."
  },
  {
    id: "sono_leve",
    nome: "Sono Leve",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Esta característica permite ao(à) Infectado(a) fazer um teste que inclua Percepção para não ser surpreendido(a) quando está dormindo."
  },
  {
    id: "trato_animais",
    nome: "Trato com Animais",
    custo: 1,
    requisitoText: "Influência 2+",
    requisitos: { Influência: 2 },
    descricao: "Sempre que o(a) Infectado(a) fizer alguma jogada para influenciar amistosamente o comportamento de um ou mais animais, pode transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "viajado",
    nome: "Viajado",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todas as jogadas do(a) Infectado(a) que envolvem o contato com outras culturas e outros povos permitem anular uma Pressão no seu resultado."
  },
  // 2 Pontos
  {
    id: "antecedente_marcante",
    nome: "Antecedente Marcante",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Quando o(a) Infectado(a) ativar o seu Evento Marcante adicione um dado de dez faces à rolagem, sem alterar a quantidade de dados mantidos."
  },
  {
    id: "aparencia_inofensiva",
    nome: "Aparência Inofensiva",
    custo: 2,
    requisitoText: "Influência 2+",
    requisitos: { Influência: 2 },
    descricao: "Em Conflito, o(a) Infectado(a) pode gastar Adaptação ou Sucesso de seu teste para aumentar o custo das Ativações de Ameaças que o(a) tenham como alvo durante o próximo turno. Cada Adaptação e Sucesso usados aumentam em uma Adaptação e uma Pressão os custos das Ativações, respectivamente."
  },
  {
    id: "artes_marciais",
    nome: "Artes Marciais",
    custo: 2,
    requisitoText: "Atletismo 2+ e Reação 2+",
    requisitos: { Atletismo: 2, Reação: 2 },
    descricao: "Todo teste do(a) Infectado(a) que envolva diretamente práticas de artes marciais (seja aplicando golpes ou se defendendo deles) permite remover uma Pressão no resultado de suas jogadas."
  },
  {
    id: "atencao_redobrada",
    nome: "Atenção Redobrada",
    custo: 2,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "Sempre que um(a) Infectado(a) precisa reagir a um perigo súbito, como uma pedra caindo sobre si, uma armadilha, um ataque surpresa ou outro tipo de emboscada, pode transformar um número de Adaptação em Sucesso equivalente ao seu valor em Reação."
  },
  {
    id: "atirador_astuto",
    nome: "Atirador Astuto",
    custo: 2,
    requisitoText: "Furtividade 2+",
    requisitos: { Furtividade: 2 },
    descricao: "Em ações que testem sua pontaria para fazer um ataque, desde que esteja protegido(a) por uma cobertura onde consiga se esconder, o(a) Infectado(a) pode transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "batedor",
    nome: "Batedor",
    custo: 2,
    requisitoText: "Geografia 2+",
    requisitos: { Geografia: 2 },
    descricao: "O(a) Infectado(a) é capaz de explorar a Região na metade do tempo e consegue encontrar um marco geográfico arbitrado pelo(a) Assimilador(a) caso tenha êxito em teste que inclua Geografia ou Sobrevivência."
  },
  {
    id: "disciplinado",
    nome: "Disciplinado",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Desde que não seja atacado(a) ou perturbado(a) por um elemento externo em uma ação fora de Conflito, pode ignorar uma Pressão no resultado do teste contanto que a execute com calma e leve o dobro do tempo para realizá-la."
  },
  {
    id: "dissimulado",
    nome: "Dissimulado",
    custo: 2,
    requisitoText: "Influência 2+ e (Expressão ou Furtividade 1+)",
    requisitos: { Influência: 2, or: ["Expressão", "Furtividade"] },
    descricao: "O(a) Infectado(a) tem facilidade para se passar por residente local de um outro Refúgio, desde que tenha acesso ao vestuário, se obtiver êxito em um teste que inclua Influência e Expressão ou Influência e Furtividade, a depender da situação. Quanto menor o Refúgio infiltrado, mais Sucesso serão necessários no teste."
  },
  {
    id: "escaldado",
    nome: "Escaldado",
    custo: 2,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "Quando o(a) Infectado(a) realiza qualquer teste que inclua Percepção para notar segundas intenções, pode transformar uma Adaptação em um Sucesso no seu resultado."
  },
  {
    id: "frugal",
    nome: "Frugal",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "A não ser que possua uma Assimilação que diga o contrário, o(a) Infectado(a) necessita de menos água e alimento que o normal, podendo ficar o dobro do tempo sem os mesmos até sofrer alguma penalidade pela falta. Caso adquira alguma Assimilação que exija o dobro de consumo de recursos, o(a) Infectado(a) passa a necessitar do regular. Equilibre essa Característica com outras desvantagens."
  },
  {
    id: "intimidador",
    nome: "Intimidador",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Em todos os testes para intimidar alguém, o(a) Infectado(a) pode gastar um Ponto de Determinação para substituir a quantidade de dados de Expressão pelo valor de um Instinto que deve ser aprovado pelo(a) Assimilador(a) para a ação. Esta característica não muda o tipo de dado rolado, somente a quantidade."
  },
  {
    id: "maos_leves",
    nome: "Mãos-Leves",
    custo: 2,
    requisitoText: "Reação 2+ e Furtividade 2+",
    requisitos: { Reação: 2, Furtividade: 2 },
    descricao: "Sempre que o(a) Infectado(a) fizer alguma jogada para roubar ou ocultar objetos à vista das pessoas, pode adicionar uma Adaptação ao seu resultado."
  },
  {
    id: "memoria_afiada",
    nome: "Memória Afiada",
    custo: 2,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "Todos os testes do(a) Infectado(a) que tenham relação com lembrar alguma informação, garantem a ele(a) um Sucesso em seus resultados."
  },
  {
    id: "presenca_encantadora",
    nome: "Presença Encantadora",
    custo: 2,
    requisitoText: "Influência 3+",
    requisitos: { Influência: 3 },
    descricao: "O(a) Infectado(a) pode gastar um Ponto de Determinação antes de rolar os dados para anular todas as Pressão do resultado do teste em interações sociais."
  },
  {
    id: "reliquia",
    nome: "Relíquia",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "O Artefato inicial do(a) Infectado(a) é um item valioso que ele sempre carrega consigo. Ele não é limitado pelo nível de Escassez arbitrado pelo(a) Assimilador(a) na construção do(a) Infectado(a) e pode ser consertado mesmo quando chega ao nível de qualidade Quebrado, porém guarda vínculo emocional com o(a) Infectado(a) e sua perda causaria perda de todos os Pontos de Determinação se tornando Suscetível."
  },
  {
    id: "sacrificio_heroico",
    nome: "Sacrifício Heroico",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Uma vez por sessão de jogo, o(a) Infectado(a) pode sofrer todo o dano no lugar de um aliado próximo."
  },
  {
    id: "sentido_agucado",
    nome: "[Sentido] Aguçado",
    custo: 2,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "O(a) jogador(a) deve escolher um dos sentidos: visão, audição, tato, paladar e olfato. Todo teste que inclua Percepção para identificar algo com o sentido escolhido permite adicionar um Sucesso ao resultado."
  },
  // 3 Pontos
  {
    id: "companheiro_animal",
    nome: "Companheiro Animal",
    custo: 3,
    requisitoText: "Sobrevivência 1+",
    requisitos: { Sobrevivência: 1 },
    descricao: "O(a) Infectado(a) é acompanhado por um animal de pequeno ou médio porte (como um cão, rato ou pássaro) que pode auxiliá-lo(a) quando possível. Quando seu animal o(a) ajuda a realizar uma ação, ele adiciona uma Adaptação ao resultado do teste."
  },
  {
    id: "construtor",
    nome: "Construtor",
    custo: 3,
    requisitoText: "Engenharia 3+",
    requisitos: { Engenharia: 3 },
    descricao: "O(a) Infectado(a) tem conhecimento para realizar Construções de forma mais eficiente, sem necessidade de testes de Engenharia semanais para obter pontos de obra (pág. 104)."
  },
  {
    id: "contra_ataque",
    nome: "Contra-Ataque",
    custo: 3,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "Após sofrer um ataque em Conflito, o próximo teste do(a) Infectado(a) para Neutralizar aquela Ameaça adiciona um Sucesso ao resultado."
  },
  {
    id: "corpo_grande",
    nome: "Corpo Grande",
    custo: 3,
    requisitoText: "Atletismo 2+",
    requisitos: { Atletismo: 2 },
    descricao: "Todos os testes de Resolução do(a) Infectado(a) que estejam relacionados com resistência física podem ser realizados com Potência. Não afeta os testes mentais ou emocionais de Resolução."
  },
  {
    id: "determinacao_inabalavel",
    nome: "Determinação Inabalável",
    custo: 3,
    requisitoText: "Resolução 3+",
    requisitos: { Resolução: 3 },
    descricao: "Todos os testes relacionados ao Propósito do(a) Infectado(a) permitem transformar uma Adaptação em um Sucesso no resultado."
  },
  {
    id: "esquiva_precisa",
    nome: "Esquiva Precisa",
    custo: 3,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "O(a) Infectado(a) pode investir um ou mais Sucesso do resultado de sua Ação para que ataques contra si sofram a mesma quantidade de Pressão até seja paga ou que se encerre o Conflito."
  },
  {
    id: "gambiarra",
    nome: "Gambiarra",
    custo: 3,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "O(a) Infectado(a) pode mudar Características de Artefatos (pág. 97), mesmo que não esteja em uma Oficina de Equipamentos."
  },
  {
    id: "inabalavel",
    nome: "Inabalável",
    custo: 3,
    requisitoText: "Resolução 3+",
    requisitos: { Resolução: 3 },
    descricao: "O(a) Infectado(a) pode transformar Adaptação em Sucesso em todos os testes que envolvam resistência mental ou emocional, um número de vezes equivalente ao seu valor em Resolução por sessão de jogo."
  },
  {
    id: "olhar_minucioso",
    nome: "Olhar Minucioso",
    custo: 3,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "Todos os testes que incluam Percepção ou Sagacidade para encontrar algo que esteja escondido ou oculto, pode adicionar um Sucesso em seus resultados para investigar."
  },
  {
    id: "orientacao",
    nome: "Orientação",
    custo: 3,
    requisitoText: "Geografia 2+ ou Sobrevivência 2+",
    requisitos: { or: ["Geografia", "Sobrevivência"], val: 2 },
    descricao: "O(a) Infectado(a) dificilmente se perde, portanto todo teste de Geografia ou Sobrevivência para recuperar um rastro ou ter ciência da sua localização permite adicionar uma Adaptação no seu resultado."
  },
  {
    id: "parkour",
    nome: "Parkour",
    custo: 3,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "Sempre que o(a) Infectado(a) realizar testes para escalar, se equilibrar, saltar, correr, fazer acrobacias ou passar por lugares apertados, permite adicionar uma Adaptação no seu resultado."
  },
  {
    id: "primeiros_socorros",
    nome: "Primeiros Socorros",
    custo: 3,
    requisitoText: "Medicina 2+",
    requisitos: { Medicina: 2 },
    descricao: "Sempre que o(a) Infectado(a) realizar jogadas que tenham como objetivo auxiliar nos cuidados de ferimentos e doenças, adiciona um Sucesso no seu resultado."
  },
  {
    id: "racional",
    nome: "Racional",
    custo: 3,
    requisitoText: "Erudição 2+",
    requisitos: { Erudição: 2 },
    descricao: "Todos os testes de Resolução do(a) Infectado(a) que estejam relacionados com resistência mental podem ser realizados com Sagacidade. Não afeta os testes físicos de Resolução."
  },
  {
    id: "recuperacao_rapida",
    nome: "Recuperação Rápida",
    custo: 3,
    requisitoText: "Resolução 2+",
    requisitos: { Resolução: 2 },
    descricao: "Toda vez que o(a) Infectado(a) ativa a Recuperação (pág. 67) sua Saúde Regenera 2 Pontos de Saúde adicionais."
  },
  {
    id: "resiliente",
    nome: "Resiliente",
    custo: 3,
    requisitoText: "Assimilação 2+",
    requisitos: { Assimilação: 2 },
    descricao: "Uma vez por Conflito, ao sofrer dano, o(a) Infectado(a) pode gastar Pontos de Assimilação para reduzir o dano sofrido proporcionalmente ao número de Pontos gastos."
  },
  {
    id: "vaso_ruim",
    nome: "Vaso Ruim",
    custo: 3,
    requisitoText: "Resolução 2+",
    requisitos: { Resolução: 2 },
    descricao: "A primeira ativação que levaria à morte do(a) Infectado(a), o(a) deixa com 1 Ponto de Saúde ao invés disso. Esta característica só poderá ser usada novamente depois que o(a) Infectado(a) cumprir uma Clareza de Propósito (pág. 62)."
  },
  // 4 Pontos
  {
    id: "heroi_local",
    nome: "Herói Local",
    custo: 4,
    requisitoText: "Influência 3+",
    requisitos: { Influência: 3 },
    descricao: "O(a) Infectado(a) é conhecido por um ato heroico que mudou sua história e contribuiu com a comunidade. Uma vez por arco de história, pode gastar seu uso de Evento Marcante para evitar que o Refúgio sofra perda de um nível de Moral (pág. 103)."
  },
  {
    id: "macgyver",
    nome: "MacGyver",
    custo: 4,
    requisitoText: "Sagacidade 2+ e Manufaturas 2+",
    requisitos: { Sagacidade: 2, Manufaturas: 2 },
    descricao: "Uma vez por sessão de jogo, o(a) Infectado(a) pode construir um Artefato com a característica Improvisado (pág. 97) e outra Característica de Equipamento de categoria 1 à sua escolha, usando apenas uma coleção de componentes materiais tirados de onde menos se espera. Este Artefato perdura até o fim da cena."
  },
  {
    id: "suporte",
    nome: "Suporte",
    custo: 4,
    requisitoText: "Influência 2+ e Reação 2+",
    requisitos: { Influência: 2, Reação: 2 },
    descricao: "Sempre que usar a ação Ajudar Aliado para transferir Sucesso a outros Infectados, adicione um Sucesso a mais."
  },
  // 5 Pontos
  {
    id: "mira_fatal",
    nome: "Mira Fatal",
    custo: 5,
    requisitoText: "Armas 3+ e (Percepção ou Reação 3+)",
    requisitos: { Armas: 3, or: ["Percepção", "Reação"], val: 3 },
    descricao: "Em testes de ataque que dependem de pontaria, o(a) Infectado(a) pode gastar 2 Pontos de Determinação para dobrar o número de Sucesso investidos em Neutralizar de Ameaça."
  },
  {
    id: "motivar_aliado",
    nome: "Motivar Aliado",
    custo: 5,
    requisitoText: "Expressão 3+",
    requisitos: { Expressão: 3 },
    descricao: "Sempre que usar a ação Apoiar Aliado, cada Adaptação anula duas Pressão do mesmo aliado. Esta característica pode ser ativada uma quantidade de vezes igual ao seu valor em Influência por sessão de jogo."
  }
];

