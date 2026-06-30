export const ITEM_CATEGORIAS = {
  nenhuma: {
    nome: "Nenhuma (Comum)",
    cat: 0,
    desc: "Equipamento comum sem características especiais."
  },
  artefato: {
    nome: "Artefato",
    cat: "Especial",
    desc: "Equipamentos especiais que possuem propriedades únicas e oferecem características ou vantagens além do comum, ajudando os Infectados em sua jornada e tornando suas ações mais eficazes ou estratégicas."
  },
  fragil: {
    nome: "Frágil",
    cat: -1,
    desc: "Característica de Categoria -1. Cai de nível de Qualidade com 1 Pressão a menos; nível 1 se torna Quebrado no próximo uso."
  },
  improvisado: {
    nome: "Improvisado",
    cat: -1,
    desc: "Característica de Categoria -1. Feito com materiais reaproveitados; testes têm –1 Sucesso, que pode ser cancelado investindo uma Adaptação."
  },
  pesado: {
    nome: "Pesado",
    cat: -1,
    desc: "Característica de Categoria -1. Reduz a mobilidade, cancelando 1 Sucesso em testes de movimento ou furtividade; ocupa 2 espaços de inventário."
  },
  uso_unico: {
    nome: "Uso Único",
    cat: -1,
    desc: "Característica de Categoria -1. Funciona apenas uma vez; após o uso, o item quebra ou se esgota completamente."
  },
  agil: {
    nome: "Ágil",
    cat: 1,
    desc: "Característica de Categoria 1. Arma branca balanceada; em ataques substitui Potência por Reação."
  },
  discreto: {
    nome: "Discreto",
    cat: 1,
    desc: "Característica de Categoria 1. Item pequeno ou retrátil, fácil de esconder; não ocupa espaço de inventário e passa despercebido enquanto guardado."
  },
  espacoso: {
    nome: "Espaçoso",
    cat: 1,
    desc: "Característica de Categoria 1. Aumenta em +2 os espaços de Inventário; efeitos podem ser acumulados ao comprar a característica mais de uma vez."
  },
  iluminador: {
    nome: "Iluminador",
    cat: 1,
    desc: "Característica de Categoria 1. Projeta luz proporcional ao nível de qualidade (6 m por nível). Pode perder um nível de qualidade com uso prolongado, com aviso do(a) Assimilador(a); tocha simples ilumina 6 m."
  },
  letal: {
    nome: "Letal",
    cat: 1,
    desc: "Característica de Categoria 1. Arma capaz de causar ferimentos graves. Uma vez por dia, permite trocar uma Adaptação por um Sucesso; uso extra concede +1 Sucesso, mas reduz 1 nível de Qualidade."
  },
  protetivo: {
    nome: "Protetivo",
    cat: 1,
    desc: "Característica de Categoria 1. Permite evitar a perda de 1 Ponto de Saúde uma vez por cena; uso extra é possível sacrificando 1 nível de Qualidade."
  },
  restaurador: {
    nome: "Restaurador",
    cat: 1,
    desc: "Característica de Categoria 1. Alimentos, bebidas ou remédios com 6 usos; cada uso alimenta um personagem por um dia e concede 1 Ponto de Saúde na próxima Recuperação, sem acumular efeitos no mesmo repouso."
  },
  eficiente: {
    nome: "Eficiente",
    cat: 2,
    desc: "Característica de Categoria 2. Item prático e ergonômico; uma vez por dia, permite trocar 1d6 por 1d10 em um teste. Uso extra no mesmo dia reduz 1 nível de Qualidade."
  },
  duravel: {
    nome: "Durável",
    cat: 2,
    desc: "Característica de Categoria 2. Itens reforçados para resistir ao desgaste; requer uma Pressão adicional para reduzir 1 nível de Qualidade."
  },
  adrenalina: {
    nome: "Adrenalina",
    cat: 3,
    desc: "Característica de Categoria 3. Canetas ou injeções que aumentam temporariamente a resistência à dor e cansaço. Cada uso concede 6 Pontos de Saúde até o próximo repouso. Usos adicionais exigem teste de Resolução + Atletismo: sucesso mantém os 6 pontos, falha causa perda de 8 pontos. Após o repouso, cada uso reduz 1 ponto de Determinação."
  },
  armadura: {
    nome: "Armadura",
    cat: 3,
    desc: "Característica de Categoria 3. Veste de proteção que absorve ferimentos. Permite até 3 usos por cena para evitar a perda de 1 Ponto de Saúde por uso. Quando os 3 usos são consumidos na mesma cena, a armadura perde 1 nível de Qualidade."
  },
  explosivo: {
    nome: "Explosivo",
    cat: 4,
    desc: "Característica de Categoria 4. Item projetado para detonação. Ao ser usado, pode ser destruído para causar 4d6 de dano em uma área, atingindo criaturas e estruturas. Sempre possui Uso Único e não acumula pontos de Categoria."
  },
  inflamavel: {
    nome: "Inflamável",
    cat: 4,
    desc: "Característica de Categoria 4. Item capaz de gerar fogo. Pode reduzir 1 nível de Qualidade para incendiar uma área, causando 3d6 de dano de queimadura. Alvos devem investir um Sucesso e uma Adaptação ou recebem 2d6 adicionais no final do turno."
  },
  medicinal: {
    nome: "Medicinal",
    cat: 4,
    desc: "Característica de Categoria 4. Itens médicos ou medicamentosos com 6 usos; cada uso cancela 1 Pressão em testes de Tratamento Médico, limitado à graduação em Medicina. Itens de Uso Único podem cancelar até 2 Pressões em um teste."
  }
};

export const DEFAULT_ITENS_DB = [
  { name: "Taco de Baseball com Pregos", escassez: 0, efeito: "Improvisado – um Sucesso a menos em todos os testes com essa arma e Letal – uma vez por dia pode trocar qualquer Adaptação por Sucesso na jogada.", categorias: ["improvisado", "letal"] },
  { name: "Escudo de Tampa de Barril", escassez: 0, efeito: "Frágil – precisa de uma Pressão a menos para baixar um nível de qualidade e Protetivo – uma vez por cena evita a perda de um Ponto de Saúde.", categorias: ["fragil", "protetivo"] },
  { name: "Barras de Nutrientes Especiais", escassez: 1, efeito: "Restaurador – seis usos, cada uso alimenta por um dia e dá +1 Ponto de Saúde na sua Recuperação, mas tal efeito não se acumula no mesmo dia na mesma personagem. Termina após o sexto uso.", categorias: ["restaurador"] },
  { name: "Escudo Anti-tumulto", escassez: 1, efeito: "Protetivo – uma vez por cena evita a perda de um Ponto de Saúde.", categorias: ["protetivo"] },
  { name: "Faca de Combate", escassez: 1, efeito: "Ágil – ataque armado substitui Potência por Reação.", categorias: ["agil"] },
  { name: "Machado de Guerra", escassez: 1, efeito: "Letal – uma vez por dia pode trocar qualquer número de Adaptação por Sucesso na jogada.", categorias: ["letal"] },
  { name: "Cota de Malha Longa", escassez: 2, efeito: "Armadura – três vezes por combate evita a perda de um Ponto de Saúde e Pesado – cancela um Sucesso em todo teste que envolva pura movimentação ou furtividade e ocupa dois espaços de inventário.", categorias: ["armadura", "pesado"] },
  { name: "Lanterna", escassez: 2, efeito: "Iluminador - 18m e Discreto – não ocupa espaço de inventário e não é percebido enquanto continuar guardado.", categorias: ["iluminador", "discreto"] },
  { name: "Mochila de Acampamento", escassez: 2, efeito: "Espaçoso x2 – 10 espaços de inventário em vez de 6.", categorias: ["espacoso", "espacoso"] },
  { name: "Caneta de Adrenalina", escassez: 3, efeito: "Adrenalina – seis usos; cada uso dá 6 Pontos de Saúde até o próximo repouso e cada uso adicional num dia pede um teste de Resolução + Atletismo para ganhar 6 Pontos de Saúde ou perder 8 Pontos de Saúde.", categorias: ["adrenalina"] },
  { name: "Colete Tático", escassez: 3, efeito: "Armadura – três vezes por combate evita a perda de um Ponto de Saúde.", categorias: ["armadura"] },
  { name: "Escudo Tático", escassez: 3, efeito: "Protetivo – uma vez por cena evita a perda de um Ponto de Saúde e Durável – precisa de uma Pressão adicional para perder um nível de Qualidade.", categorias: ["protetivo", "duravel"] },
  { name: "Katana", escassez: 3, efeito: "Ágil – ataque armado substitui Potência por Reação e Eficiente – Ao fazer um teste com esse item você pode fazer um uso diário para trocar 16 por 11", categorias: ["agil", "eficiente"] }
];

export const DEFESA_LABELS = [
  "Nenhuma",
  "Linhas e sinos",
  "Cerca de arame farpado",
  "Muro de madeira",
  "Muro de pedra ou tijolo",
  "Complexo prisional",
  "Base militar"
];

export const MORAL_LABELS = [
  "Amotinada",
  "Desiludida",
  "Hesitante",
  "Resoluta",
  "Animada",
  "Empenhada",
  "Exaltada"
];

export const BELIGERANCIA_LABELS = [
  "Pacifista",
  "Mínima",
  "Razoável",
  "Eficiente",
  "Ameaçadora",
  "Terrível",
  "Arrasadora"
];

export const CONSTRUCOES_MODELO = [
  {
    nome: "Boticário",
    nivel: 10,
    consumo: "Plantas 1",
    producao: "Medicamentos 1",
    descricao: "Cada População 1 em uma semana converte Plantas 1 em Medicamentos 1. Requerido para criar Medicamentos."
  },
  {
    nome: "Casa de Costura",
    nivel: 10,
    consumo: "Nenhum",
    producao: "Vestuário +1",
    descricao: "Todo Vestuário produzido ali gera um Vestuário adicional."
  },
  {
    nome: "Centro Comunitário",
    nivel: 10,
    consumo: "Nenhum",
    producao: "Moral +1",
    descricao: "Aumenta em um nível a Moral. Custo = 10 * novo nível de Moral. Tipos: Alambique, Igreja, Museu, Teatro, etc."
  },
  {
    nome: "Coleta de Biomassa",
    nivel: 20,
    consumo: "Trabalho 1",
    producao: "Biomassa 1",
    descricao: "Cada População 1 coleta Biomassa 1 por nível de Recursos Naturais da região (máx 5x). Sonda, Mina, etc."
  },
  {
    nome: "Dormitório",
    nivel: 20,
    consumo: "Nenhum",
    producao: "Teto População",
    descricao: "Aumenta o teto máximo de População em nível igual aos pontos de obra estabelecidos."
  },
  {
    nome: "Fábrica de Munição",
    nivel: 20,
    consumo: "Minerais 1",
    producao: "Munição 1",
    descricao: "Cada População 1 em uma semana converte Minerais 1 em Munição 1."
  },
  {
    nome: "Fábrica para Obras",
    nivel: 20,
    consumo: "Minerais 1",
    producao: "Mat. Constr. 1",
    descricao: "Cada População 1 em uma semana converte Minerais 1 em Materiais de Construção 1."
  },
  {
    nome: "Fonte de Água",
    nivel: 10,
    consumo: "Nenhum",
    producao: "Água constante",
    descricao: "Se houver fartura de Água na região, cria fonte constante que dispensa estocagem de Água."
  },
  {
    nome: "Fortificação",
    nivel: 10,
    consumo: "Trabalho 1 (Guarda)",
    producao: "Defesa +1",
    descricao: "Aumenta em um nível a Defesa, contanto que População 1 fique de guarda. Custo = 10 * novo nível de Defesa."
  },
  {
    nome: "Moinho",
    nivel: 10,
    consumo: "Plantas 1",
    producao: "Alimento (Teto)",
    descricao: "Aumenta o teto de produção de Alimento com Plantas por nível de População igual ao nível do moinho."
  },
  {
    nome: "Oficina de Equipamentos",
    nivel: 10,
    consumo: "Materiais",
    producao: "Itens (Escassez)",
    descricao: "Permite criar itens de nível de Escassez até o nível dessa oficina."
  },
  {
    nome: "Oficina Mecânica",
    nivel: 10,
    consumo: "Peças de veículos",
    producao: "Veículos restaurados",
    descricao: "Permite restaurar veículos usando peças de reposição."
  },
  {
    nome: "Pedreira",
    nivel: 20,
    consumo: "Trabalho 1",
    producao: "Minerais (Região)",
    descricao: "Cada População 1 em uma semana coleta Minerais igual ao nível de Recursos Naturais de minerais."
  },
  {
    nome: "Porto",
    nivel: 20,
    consumo: "População 1 (manut.)",
    producao: "Barcos (Mobilidade)",
    descricao: "Permite embarcações. Requer manutenção semestral de População 1 por nível de Mobilidade."
  },
  {
    nome: "Refeitório",
    nivel: 10,
    consumo: "Plantas / Animais",
    producao: "Alimento (Dobrado)",
    descricao: "Todo Alimento convertido a partir de uma fonte de Plantas ou Animais é dobrado."
  },
  {
    nome: "Refinaria Animal",
    nivel: 10,
    consumo: "Esterco Animal 1",
    producao: "Combustível 1",
    descricao: "Cada População 1 em uma semana usa esterco para produzir Combustível 1 (máx nível de animais, até 10/sem)."
  },
  {
    nome: "Refinaria de Biomassa",
    nivel: 10,
    consumo: "Biomassa 1",
    producao: "Combustível 1",
    descricao: "Cada População 1 em uma semana converte Biomassa 1 em Combustível 1 (máx 10/sem)."
  },
  {
    nome: "Refinaria Vegetal",
    nivel: 10,
    consumo: "Plantas 1",
    producao: "Combustível 1",
    descricao: "Cada População 1 em uma semana converte certas Plantas 1 em Biomassa 1 e depois em Combustível 1 (máx 10/sem)."
  },
  {
    nome: "Reservas Expandidas",
    nivel: 10,
    consumo: "Nenhum",
    producao: "Teto Reserva +10",
    descricao: "Aumenta o teto de Reservas do tipo escolhido (Ex: Armazém, Paiol, Caixa D'Água) em nível igual a pontos de obra."
  },
  {
    nome: "Serraria",
    nivel: 10,
    consumo: "Madeira 1",
    producao: "Mat. Constr. 1",
    descricao: "Cada População 1 em uma semana converte Madeira 1 em Materiais de Construção 1 (máx 10/sem)."
  }
];

export const CRISE_GATILHOS = {
  populacao: {
    nome: "Crise de População",
    desc: "A População ultrapassou o limite do seu teto."
  },
  defesa: {
    nome: "Crise de Defesa",
    desc: "A Defesa ficou menor que o Perigo da região ou da Beligerância de um refúgio invasor."
  },
  recurso: {
    nome: "Crise de Recursos",
    desc: "Falta um Recurso no seu respectivo consumo. Cada semana consome Água 1, Alimento 1 e Madeira 1 vezes a População; a cada ano consome Medicamentos 1 vezes a População e a cada dois anos consome Vestuário 1 vezes a População."
  },
  custom: {
    nome: "Crise Geral",
    desc: "Gatilho personalizado."
  }
};

export const CRISE_GRAVIDADES = {
  1: {
    grau: 1,
    texto: "Por sorte, os habitantes sobrevivem à Crise sem maiores percalços (0-1 Símbolos)."
  },
  2: {
    grau: 2,
    texto: "Briga interna que cria uma migração de aproximadamente metade da População atual do Refúgio para outro lugar, levando consigo metade dos recursos estocados (2 Símbolos)."
  },
  3: {
    grau: 3,
    texto: "Enfermidade que nenhum remédio do Refúgio consegue tratar, o que tira 1d de todos os testes dos personagens dali até que uma cura seja encontrada. Para remover os destroços por completo será preciso investir População 1 por semana para cada ponto de obra que a construção levou para ser construída (3 Símbolos)."
  },
  4: {
    grau: 4,
    texto: "Criatura assimilada de grande tamanho surge no Refúgio colocando em risco Reservas e Construções a critério do(a) Assimilador(a). Alguém precisa lidar com essa ameaça para não haver também uma perda significativa de População (4 Símbolos)."
  },
  5: {
    grau: 5,
    texto: "Rebelião que divide a População atual do Refúgio em duas facções antagônicas e inconciliáveis que disputam pelo controle do Refúgio (5 Símbolos)."
  },
  6: {
    grau: 6,
    texto: "O Refúgio é atacado por invasores que precisam ser neutralizados para não haver uma perda significativa de População a critério do(a) Assimilador(a). Se os invasores vencerem, caso não queiram ocupar o lugar, eles podem destruir o Refúgio e levar os seus Recursos consigo (6+ Símbolos)."
  }
};
