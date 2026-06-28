export const CARACTERISTICAS = [
  // 1 Ponto
  {
    id: "agricultor",
    nome: "Agricultor",
    custo: 1,
    requisitoText: "Geografia 1+",
    requisitos: { Geografia: 1 },
    descricao: "Em todas as jogadas do(a) Infectado(a) oriundas de questões agrárias ou biológicas acerca da vida vegetal cultivada pelo ser humano, ganha um Sucesso adicional."
  },
  {
    id: "cavaleiro",
    nome: "Cavaleiro",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todos os testes para conduzir animais de montaria podem transformar uma Adaptação em Sucesso em seu resultado."
  },
  {
    id: "estagio_avancado",
    nome: "Estágio Avançado",
    custo: 1,
    requisitoText: "Apenas na criação inicial",
    requisitos: { criacao: true },
    descricao: "Aumenta em 1 o Nível de Assimilação inicial, aumentando consequentemente em 1 o Nível de Assimilação e reduzindo consequentemente em 1 o Nível de Determinação . Requer aprovação do(a) Assimilador(a) para realizar a rolagem e escolha de Assimilações adicionais."
  },
  {
    id: "investigador_assimilation",
    nome: "Investigador da Assimilação",
    custo: 1,
    requisitoText: "Biologia 1+",
    requisitos: { Biologia: 1 },
    descricao: "Em todo teste relacionado ao entendimento sobre o funcionamento da Assimilação, o(a) Infectado(a) pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "pegada_forte",
    nome: "Pegada Forte",
    custo: 1,
    requisitoText: "Potência 2+",
    requisitos: { Potência: 2 },
    descricao: "Todos os testes envolvendo firmeza para se segurar em algo ou não deixar que uma pessoa ou objeto escape das suas mãos permitem transformar uma Adaptação em um Sucesso em seu resultado."
  },
  {
    id: "piloto",
    nome: "Piloto",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todos os testes para condução de veículos permitem transformar uma Adaptação em um Sucesso em seu resultado."
  },
  {
    id: "punhos_de_ferro",
    nome: "Punhos de Ferro",
    custo: 1,
    requisitoText: "Potência 2+ e Resolução 2+",
    requisitos: { Potência: 2, Resolução: 2 },
    descricao: "Quando usar um Ponto de Determinação para manter um dado adicional realizando ações de combate desarmado, adicionalmente pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "saque_rapido",
    nome: "Saque Rápido",
    custo: 1,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "O(a) Infectado(a) não gasta Adaptação para sacar ou guardar um Equipamento, mesmo quando em Conflito."
  },
  {
    id: "sono_leve",
    nome: "Sono Leve",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Permite ao(à) Infectado(a) fazer um teste de Percepção para não ser surpreendido(a) quando está dormindo."
  },
  {
    id: "trato_animais",
    nome: "Trato com Animais",
    custo: 1,
    requisitoText: "Influência 2+",
    requisitos: { Influência: 2 },
    descricao: "Sempre que fizer alguma jogada para influenciar amistosamente o comportamento de animais pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "viajado",
    nome: "Viajado",
    custo: 1,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Todas as jogadas que envolvem o contato com outras culturas e outros povos permitem anular uma Pressão no resultado."
  },
  // 2 Pontos
  {
    id: "antecedente_marcante",
    nome: "Antecedente Marcante",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Quando o(a) Infectado(a) ativar o seu Evento Marcante adicione um d10 na rolagem, sem alterar a quantidade de dados mantidos."
  },
  {
    id: "aparencia_inofensiva",
    nome: "Aparência Inofensiva",
    custo: 2,
    requisitoText: "Influência 2+",
    requisitos: { Influência: 2 },
    descricao: "Em testes em Conflito, pode gastar Adaptação ou Sucesso para aumentar o custo das ativações de Ameaças que o tenham como alvo no próximo turno. Cada Adaptação ou Sucesso aumenta o custo das ativações em uma Adaptação ou uma Pressão, respectivamente."
  },
  {
    id: "artes_marciais",
    nome: "Artes Marciais",
    custo: 2,
    requisitoText: "Atletismo 2+ e Reação 2+",
    requisitos: { Atletismo: 2, Reação: 2 },
    descricao: "Todo teste que envolva práticas de artes marciais (aplicando ou defendendo golpes) permite remover uma Pressão no resultado."
  },
  {
    id: "atencao_redobrada",
    nome: "Atenção Redobrada",
    custo: 2,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "Sempre que precisar reagir a um perigo súbito (armadilhas, desabamentos, emboscadas), pode transformar um número de Adaptação em Sucesso até o seu valor em Reação."
  },
  {
    id: "atirador_astuto",
    nome: "Atirador Astuto",
    custo: 2,
    requisitoText: "Furtividade 2+",
    requisitos: { Furtividade: 2 },
    descricao: "Em ações que testem pontaria para fazer um ataque, desde que protegido(a) por cobertura onde consiga se esconder, pode transformar uma Adaptação em um Sucesso."
  },
  {
    id: "batedor",
    nome: "Batedor",
    custo: 2,
    requisitoText: "Geografia 2+",
    requisitos: { Geografia: 2 },
    descricao: "Capaz de explorar a Região na metade do tempo Ponto  Ponto de Assimilação encontra marcos geográficos com sucesso em teste de Geografia ou Sobrevivência."
  },
  {
    id: "disciplinado",
    nome: "Disciplinado",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Desde que não perturbado por elemento externo fora de Conflito, pode ignorar uma Pressão se fizer a ação com calma e levar o dobro do tempo."
  },
  {
    id: "dissimulado",
    nome: "Dissimulado",
    custo: 2,
    requisitoText: "Influência 2+ e (Expressão 1+ ou Furtividade 1+)",
    requisitos: { Influência: 2, or: ["Expressão", "Furtividade"] },
    descricao: "Facilidade para se passar por residente de outro Refúgio com vestuário local, obtendo êxito em teste de Expressão ou Furtividade."
  },
  {
    id: "escaldado",
    nome: "Escaldado",
    custo: 2,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "Quando realizar testes de Percepção para notar segundas intenções (pedidos pelo Assimilador), pode transformar uma Adaptação em um Sucesso por teste."
  },
  {
    id: "frugal",
    nome: "Frugal",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Necessita de menos água e comida que o normal (pode ficar o dobro do tempo sem sofrer penalidades). Anula efeitos de aumento de consumo de Assimilações."
  },
  {
    id: "intimidador",
    nome: "Intimidador",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Em testes para intimidar, pode gastar 1 Ponto de Determinação para substituir o valor de Expressão pelo de outro Instinto aprovado (muda a quantidade de dados, não o tipo)."
  },
  {
    id: "maos_leves",
    nome: "Mãos-Leves",
    custo: 2,
    requisitoText: "Reação 2+ e Furtividade 2+",
    requisitos: { Reação: 2, Furtividade: 2 },
    descricao: "Sempre que fizer alguma jogada para roubar ou ocultar objetos à vista das pessoas, pode adicionar uma Adaptação ao resultado."
  },
  {
    id: "memoria_afiada",
    nome: "Memória Afiada",
    custo: 2,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "Todos os testes que tenham relação com a lembrança de alguma informação garantem um Sucesso em seus resultados."
  },
  {
    id: "presenca_encantadora",
    nome: "Presença Encantadora",
    custo: 2,
    requisitoText: "Influência 3+",
    requisitos: { Influência: 3 },
    descricao: "Pode gastar 1 Ponto de Determinação antes de rolar os dados para anular todas as Pressão do resultado do teste em interações sociais."
  },
  {
    id: "reliquia",
    nome: "Relíquia",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Inicia com um Artefato valioso. Não é limitado pela Escassez e pode ser consertado do estado Quebrado. Perder o item causa perda de 1 d."
  },
  {
    id: "sacrificio_heroico",
    nome: "Sacrifício Heroico",
    custo: 2,
    requisitoText: "Nenhum",
    requisitos: {},
    descricao: "Permite sofrer todo o dano físico no lugar de um aliado próximo, uma vez por sessão de jogo."
  },
  {
    id: "sentido_agucado",
    nome: "[Sentido] Aguçado",
    custo: 2,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "Escolha um sentido (visão, audição, etc.). Testes de Percepção que utilizem este sentido ganham um Sucesso adicional."
  },
  // 3 Pontos
  {
    id: "companheiro_animal",
    nome: "Companheiro Animal",
    custo: 3,
    requisitoText: "Sobrevivência 1+",
    requisitos: { Sobrevivência: 1 },
    descricao: "Acompanhado por animal de pequeno/médio porte. Quando o animal auxilia em uma ação, adiciona uma Adaptação ao resultado do teste."
  },
  {
    id: "construtor",
    nome: "Construtor",
    custo: 3,
    requisitoText: "Engenharia 3+",
    requisitos: { Engenharia: 3 },
    descricao: "Realiza Construções de forma eficiente, sem necessidade de testes de Engenharia semanais para obter pontos de obra."
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
    descricao: "Testes de Resolução relacionados com resistência física podem ser realizados com o valor de Potência. Não afeta testes mentais."
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
    descricao: "Pode investir Sucesso do seu resultado para impor penalidade [P] a ataques contra si até que seja pago ou o Conflito se encerre."
  },
  {
    id: "gambiarra",
    nome: "Gambiarra",
    custo: 3,
    requisitoText: "Sagacidade 2+",
    requisitos: { Sagacidade: 2 },
    descricao: "Permite modificar Características de Artefatos (customização de equipamentos)."
  },
  {
    id: "inabalavel",
    nome: "Inabalável",
    custo: 3,
    requisitoText: "Resolução 3+",
    requisitos: { Resolução: 3 },
    descricao: "Em testes de resistência mental/emocional, pode transformar Adaptação em Sucesso uma quantidade de vezes até o valor de Resolução por sessão."
  },
  {
    id: "olhar_minucioso",
    nome: "Olhar Minucioso",
    custo: 3,
    requisitoText: "Percepção 2+",
    requisitos: { Percepção: 2 },
    descricao: "Jogadas de Percepção ou Sagacidade para achar itens novos/escondidos ganham um Sucesso adicional."
  },
  {
    id: "orientacao",
    nome: "Orientação",
    custo: 3,
    requisitoText: "Geografia 2+ ou Sobrevivência 2+",
    requisitos: { or: ["Geografia", "Sobrevivência"], val: 2 },
    descricao: "Dificilmente se perde; testes de Geografia/Sobrevivência para rastreamento ou localização ganham uma Adaptação adicional."
  },
  {
    id: "parkour",
    nome: "Parkour",
    custo: 3,
    requisitoText: "Reação 2+",
    requisitos: { Reação: 2 },
    descricao: "Testes de escalada, pulos, saltos, equilíbrio ou passagens apertadas ganham uma Adaptação adicional."
  },
  {
    id: "primeiros_socorros",
    nome: "Primeiros Socorros",
    custo: 3,
    requisitoText: "Medicina 2+",
    requisitos: { Medicina: 2 },
    descricao: "Sempre que realizar jogadas que visem cuidar de ferimentos e doenças, adiciona um Sucesso em seu resultado."
  },
  {
    id: "racional",
    nome: "Racional",
    custo: 3,
    requisitoText: "Erudição 2+",
    requisitos: { Erudição: 2 },
    descricao: "Testes de Resolução relacionados com resistência mental podem ser realizados com Sagacidade. Não afeta testes físicos."
  },
  {
    id: "recuperacao_rapida",
    nome: "Recuperação Rápida",
    custo: 3,
    requisitoText: "Resolução 2+",
    requisitos: { Resolução: 2 },
    descricao: "Toda vez que ativa a Recuperação de Saúde, regenera dois pontos de Saúde adicionais."
  },
  {
    id: "resiliente",
    nome: "Resiliente",
    custo: 3,
    requisitoText: "Assimilação 2+",
    requisitos: { Assimilação: 2 },
    descricao: "Uma vez por Conflito, ao sofrer dano, pode gastar Pontos de Assimilação para reduzir o dano sofrido na mesma proporção."
  },
  {
    id: "vaso_ruim",
    nome: "Vaso Ruim",
    custo: 3,
    requisitoText: "Resolução 2+",
    requisitos: { Resolução: 2 },
    descricao: "Anula a primeira ativação que levaria à sua morte. Só pode ser usado novamente após cumprir uma Clareza de Propósito."
  },
  // 4 Pontos
  {
    id: "heroi_local",
    nome: "Herói Local",
    custo: 4,
    requisitoText: "Influência 3+",
    requisitos: { Influência: 3 },
    descricao: "Uma vez por arco de história, pode gastar seu Evento Marcante para evitar que o Refúgio perca um nível de Moral."
  },
  {
    id: "macgyver",
    nome: "MacGyver",
    custo: 4,
    requisitoText: "Sagacidade 2+ e Manufaturas 2+",
    requisitos: { Sagacidade: 2, Manufaturas: 2 },
    descricao: "Uma vez por sessão, constrói um Artefato com a característica Improvisado e outra característica nível 1 durando até o fim da cena."
  },
  {
    id: "suporte",
    nome: "Suporte",
    custo: 4,
    requisitoText: "Influência 2+ e Reação 2+",
    requisitos: { Influência: 2, Reação: 2 },
    descricao: "Sempre que usar a ação Ajudar Aliado para transferir Sucesso a outros Infectados, adiciona um Sucesso extra."
  },
  // 5 Pontos
  {
    id: "mira_fatal",
    nome: "Mira Fatal",
    custo: 5,
    requisitoText: "Armas 3+ e (Percepção 3+ ou Reação 3+)",
    requisitos: { Armas: 3, or: ["Percepção", "Reação"], val: 3 },
    descricao: "Em ataques de pontaria, pode gastar 2 Pontos de Determinação para dobrar o número de Sucesso investidos em Neutralização de Ameaça."
  },
  {
    id: "motivar_aliado",
    nome: "Motivar Aliado",
    custo: 5,
    requisitoText: "Expressão 3+",
    requisitos: { Expressão: 3 },
    descricao: "Ao usar Apoiar Aliado, cada Adaptação anula duas Pressão do mesmo aliado. Pode ser ativado até o valor de Influência por sessão."
  }
];
