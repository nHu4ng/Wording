'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type StudyState = 'unseen' | 'seen' | 'recognizes' | 'active' | 'mastered';
type ProfileQuality = 'curated' | 'dictionary' | 'fallback';

type VocabularyWord = {
  word: string;
  meaning: string;
  example: string;
  note: string;
  freq: number;
};

type VocabularyMeta = {
  source?: string;
  examId?: string;
  title?: string;
  createdAt?: string;
};

type VocabularyDocument = {
  words: VocabularyWord[];
  meta?: VocabularyMeta;
};

type SkillScores = {
  reading: number;
  listening: number;
  task1: number;
  task2: number;
  speaking: number;
};

type Collocation = {
  phrase: string;
  meaning: string;
  use: string;
};

type Distinction = {
  word: string;
  difference: string;
  rule: string;
};

type Pitfall = {
  wrong: string;
  better: string;
  why: string;
};

type ExpertProfile = {
  quality: ProfileQuality;
  confidence: number;
  ipaUk?: string;
  ipaUs?: string;
  cefr: string;
  level: string;
  value: number;
  skills: SkillScores;
  coreMeaning: string;
  definition: string;
  register: string;
  topics: string[];
  patterns: string[];
  collocations: Collocation[];
  family: string[];
  distinctions: Distinction[];
  pitfalls: Pitfall[];
  writingTip: string;
  speakingTip: string;
  recall: string;
  answer: string;
  productionFrame: string;
};

type Analysis = ExpertProfile & {
  word: string;
  sourceWord?: VocabularyWord;
  sourceTitle?: string;
  occurrenceCount?: number;
  sourceFrequency?: number;
  priority: number;
  sourceLabel: string;
};

type DictionaryDefinition = {
  definition?: string;
  example?: string;
};

type DictionaryMeaning = {
  partOfSpeech?: string;
  definitions?: DictionaryDefinition[];
};

type DictionaryEntry = {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings?: DictionaryMeaning[];
};

const demoVocabulary: VocabularyDocument = {
  meta: {
    source: 'reading-vocab-selection',
    examId: 'p1-low-106',
    title: 'The Importance of Business Cards 名片的重要性',
    createdAt: '2026-09-02T08:15:41.689Z',
  },
  words: [
    {
      word: 'exact',
      meaning: 'a. 精确的；准确的',
      example:
        'The scientist needed the exact measurements to ensure the experiment would yield accurate results.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 100%',
      freq: 0.9997,
    },
    {
      word: 'argue',
      meaning: 'v. 争论；说服',
      example:
        'Despite their best effort to remain calm, they continued to argue about the best approach to the project.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 100%',
      freq: 0.9981,
    },
    {
      word: 'electronic',
      meaning: 'a. 电子的',
      example:
        'She prefers using electronic books because they are more convenient to carry and can be read on various devices.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 2 次；freq 100%',
      freq: 0.9961,
    },
    {
      word: 'purpose',
      meaning: 'n. 目的，意图；用途，效果 v. 打算，企图，决心',
      example:
        'She approached her new role with a clear sense of purpose, determined to make a meaningful impact on the team.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 99%',
      freq: 0.9928,
    },
    {
      word: 'effort',
      meaning: 'n. 努力，艰难的尝试；成就',
      example: 'IELTS learners often encounter the word effort in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 98%',
      freq: 0.9765,
    },
    {
      word: 'physical',
      meaning: 'a. 身体的，肉体的；物理的，物理学的；物质的，有形的；n. 体检',
      example: 'IELTS learners often encounter the word physical in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 97%',
      freq: 0.9706,
    },
    {
      word: 'exchange',
      meaning: 'v. 交换，调换；交易；兑换；交流；谈话，争论 n. 交换，调换；交易（所）；兑换（率）；交流',
      example: 'IELTS learners often encounter the word exchange in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 5 次；freq 95%',
      freq: 0.9493,
    },
    {
      word: 'unique',
      meaning: 'a. 唯一的，独一无二的；极不寻常的，极好的',
      example:
        'All countries are unique, and different forms of acting have unique characteristics.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 95%',
      freq: 0.9485,
    },
    {
      word: 'counterpart',
      meaning: 'n. 与对方地位相当的人；配对物；副本',
      example: 'IELTS learners often encounter the word counterpart in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 94%',
      freq: 0.9438,
    },
    {
      word: 'thrive',
      meaning: 'vi. 兴旺，繁荣',
      example: 'The heart thrives when blood pressure is normal.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 92%',
      freq: 0.9175,
    },
    {
      word: 'tradition',
      meaning: 'n. 传统；惯例',
      example: 'IELTS learners often encounter the word tradition in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 89%',
      freq: 0.8886,
    },
    {
      word: 'enhance',
      meaning: 'vt. 提高，增强；增进',
      example: 'IELTS learners often encounter the word enhance in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 88%',
      freq: 0.8789,
    },
    {
      word: 'administrative',
      meaning: 'a. 管理的，行政的',
      example: 'IELTS learners often encounter the word administrative in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 86%',
      freq: 0.8596,
    },
    {
      word: 'client',
      meaning: 'n. 委托人；顾客，客户',
      example: 'IELTS learners often encounter the word client in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 86%',
      freq: 0.8557,
    },
    {
      word: 'composition',
      meaning: 'n. 作品；写作，作曲；结构，组成，成分',
      example: 'IELTS learners often encounter the word composition in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 84%',
      freq: 0.8371,
    },
    {
      word: 'promote',
      meaning: 'vt. 促进；提升；促销',
      example: 'IELTS learners often encounter the word promote in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 82%',
      freq: 0.8241,
    },
    {
      word: 'effective',
      meaning: 'a. 有效的，生效的；给人深刻印象的，显著的',
      example: 'IELTS learners often encounter the word effective in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 82%',
      freq: 0.8172,
    },
    {
      word: 'proportion',
      meaning: 'n. 比例；部分；相称',
      example: 'IELTS learners often encounter the word proportion in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 81%',
      freq: 0.8058,
    },
    {
      word: 'correspondence',
      meaning: 'n. 通信，信件；符合，一致；对应',
      example: 'IELTS learners often encounter the word correspondence in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 77%',
      freq: 0.7723,
    },
    {
      word: 'establish',
      meaning: 'vt. 建立；确立；安置，使安居',
      example: 'IELTS learners often encounter the word establish in practice exercises.',
      note:
        '阅读提取：The Importance of Business Cards 名片的重要性；本篇出现 1 次；freq 68%',
      freq: 0.6839,
    },
  ],
};

const profileMap: Record<string, ExpertProfile> = {
  enhance: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪnˈhɑːns/',
    ipaUs: '/ɪnˈhæns/',
    cefr: 'B2–C1',
    level: '核心输出词',
    value: 88,
    skills: { reading: 83, listening: 58, task1: 46, task2: 94, speaking: 78 },
    coreMeaning: '提高、增强既有事物的质量、效果、价值或吸引力。',
    definition: 'to improve the quality, value, or effectiveness of something',
    register: '正式 / 学术中性',
    topics: ['教育', '科技', '公共服务', '生活质量'],
    patterns: [
      'enhance + noun',
      'enhance + noun + by + -ing',
      'be enhanced by + noun',
    ],
    collocations: [
      {
        phrase: 'enhance the quality of life',
        meaning: '提升生活质量',
        use: '城市、医疗、环境',
      },
      {
        phrase: 'enhance efficiency',
        meaning: '提升效率',
        use: '科技、工作、交通',
      },
      {
        phrase: 'significantly enhance',
        meaning: '显著增强',
        use: '论证效果',
      },
    ],
    family: ['enhancement n.', 'enhanced adj.', 'enhancing adj.'],
    distinctions: [
      {
        word: 'improve',
        difference: 'improve 最通用；enhance 更强调已有事物的质量、价值、效果或吸引力。',
        rule: '谈 quality、effectiveness、appeal、reputation 时优先考虑 enhance。',
      },
      {
        word: 'boost',
        difference: 'boost 偏向快速或明显增加数量、信心、销量等。',
        rule: '谈短期增长用 boost；谈质量或效果提升用 enhance。',
      },
    ],
    pitfalls: [
      {
        wrong: 'enhance people’s life',
        better: 'enhance people’s lives / enhance people’s quality of life',
        why: '个体生活通常用复数 lives；quality of life 是更自然的固定搭配。',
      },
    ],
    writingTip:
      'Task 2 讨论政府投资、教育改革或数字化服务时，用它替换一部分泛化的 improve，前提是宾语确实是“质量/效果”。',
    speakingTip:
      'Part 3 里可用于解释技术或公共设施如何改善日常体验：It has enhanced the convenience of…',
    recall: '“提升教育质量”用 enhance 组成一个英语短语。',
    answer: 'enhance the quality of education',
    productionFrame: 'X can significantly enhance the quality of Y.',
  },
  establish: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪˈstæblɪʃ/',
    ipaUs: '/ɪˈstæblɪʃ/',
    cefr: 'B2',
    level: '核心输出词',
    value: 86,
    skills: { reading: 86, listening: 59, task1: 50, task2: 90, speaking: 68 },
    coreMeaning: '建立、确立或创立一个制度、组织、关系或事实。',
    definition: 'to start or create an organization, system, or relationship',
    register: '正式 / 学术中性',
    topics: ['政府', '教育', '企业', '研究'],
    patterns: [
      'establish + system / institution / relationship',
      'establish that + clause',
      'be established in + year',
    ],
    collocations: [
      { phrase: 'establish a system', meaning: '建立体系', use: '政府、管理' },
      { phrase: 'establish a link', meaning: '建立联系', use: '研究、因果关系' },
      { phrase: 'well-established', meaning: '根深蒂固的', use: '社会、科学' },
    ],
    family: ['establishment n.', 'well-established adj.'],
    distinctions: [
      {
        word: 'build',
        difference: 'build 更具体、可用于实体；establish 更偏制度、关系、事实和正式创立。',
        rule: '抽象制度或研究结论优先用 establish。',
      },
    ],
    pitfalls: [
      {
        wrong: 'establish a good communication',
        better: 'establish good communication / establish effective communication channels',
        why: 'communication 多数情况下不可数；需要强调渠道时用复数 channels。',
      },
    ],
    writingTip:
      '用于“建立监管制度、公共服务体系、长期合作关系”等抽象对象，语域比 set up 更正式。',
    speakingTip:
      '谈新环境适应时可说 establish a routine / establish connections with local people。',
    recall: '“建立有效的监管体系”怎么表达？',
    answer: 'establish an effective regulatory system',
    productionFrame: 'Governments should establish a clear framework for Y.',
  },
  effective: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪˈfektɪv/',
    ipaUs: '/ɪˈfektɪv/',
    cefr: 'B2',
    level: '核心表达词',
    value: 80,
    skills: { reading: 82, listening: 70, task1: 62, task2: 89, speaking: 78 },
    coreMeaning: '有效的；能够达到预期结果的。',
    definition: 'successful in producing the result that is wanted',
    register: '中性 / 正式',
    topics: ['教育', '政策', '健康', '工作'],
    patterns: [
      'be effective in + -ing',
      'an effective way to do sth',
      'prove effective',
    ],
    collocations: [
      { phrase: 'an effective solution', meaning: '有效解决方案', use: 'Task 2 对策' },
      { phrase: 'cost-effective', meaning: '成本效益高的', use: '政府、商业' },
      { phrase: 'highly effective', meaning: '高度有效的', use: '论证加强' },
    ],
    family: ['effect n.', 'effectively adv.', 'effectiveness n.'],
    distinctions: [
      {
        word: 'efficient',
        difference: 'effective 指“达成目标”；efficient 指“用较少时间/资源做好”。',
        rule: '结果是否实现用 effective；资源利用是否节省用 efficient。',
      },
    ],
    pitfalls: [
      {
        wrong: 'a very effectiveness policy',
        better: 'a very effective policy / a policy with high effectiveness',
        why: 'effective 是形容词，effectiveness 是名词。',
      },
    ],
    writingTip:
      '写对策时不要只说 effective；补充“为什么有效”或“对谁有效”，才能形成完整论证。',
    speakingTip:
      '可用在建议和个人经验：The most effective way for me to… is to…',
    recall: '区分“有效”与“高效”：哪个词强调资源利用？',
    answer: 'efficient 强调资源利用；effective 强调达成结果。',
    productionFrame: 'This is an effective way to address Y.',
  },
  promote: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/prəˈməʊt/',
    ipaUs: '/prəˈmoʊt/',
    cefr: 'B2',
    level: '核心输出词',
    value: 84,
    skills: { reading: 80, listening: 66, task1: 58, task2: 91, speaking: 75 },
    coreMeaning: '促进某种发展、观念、活动或产品。',
    definition: 'to encourage or support the development of something',
    register: '中性 / 正式',
    topics: ['健康', '旅游', '教育', '经济'],
    patterns: ['promote + noun', 'promote + -ing', 'be promoted through + noun'],
    collocations: [
      { phrase: 'promote public health', meaning: '促进公共健康', use: '健康政策' },
      { phrase: 'promote sustainable development', meaning: '促进可持续发展', use: '环境' },
      { phrase: 'actively promote', meaning: '积极推动', use: '政府措施' },
    ],
    family: ['promotion n.', 'promotional adj.', 'promoter n.'],
    distinctions: [
      {
        word: 'encourage',
        difference: 'encourage 更常接人或行为；promote 更适合抽象目标、发展和宣传。',
        rule: '讨论政策推动长期目标时优先用 promote。',
      },
    ],
    pitfalls: [
      {
        wrong: 'promote people to exercise',
        better: 'encourage people to exercise / promote exercise',
        why: 'promote 后通常接活动或目标；接人时常有“晋升”义。',
      },
    ],
    writingTip:
      '适合连接政府行动与社会结果：promote public awareness / promote equal opportunities。',
    speakingTip:
      '谈活动或习惯时，promote a healthier lifestyle 比 make people healthy 更自然。',
    recall: '“促进可持续发展”怎么表达？',
    answer: 'promote sustainable development',
    productionFrame: 'The policy could promote more sustainable Y.',
  },
  purpose: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈpɜːpəs/',
    ipaUs: '/ˈpɜːrpəs/',
    cefr: 'B2',
    level: '高频理解词',
    value: 78,
    skills: { reading: 88, listening: 73, task1: 55, task2: 77, speaking: 73 },
    coreMeaning: '目的、意图；最常用框架是 the purpose of / purpose is to。',
    definition: 'the reason for which something is done or made',
    register: '中性',
    topics: ['教育', '工作', '科技', '社会'],
    patterns: ['the purpose of + noun / -ing', 'the purpose is to + verb', 'for the purpose of + -ing'],
    collocations: [
      { phrase: 'serve a purpose', meaning: '发挥作用', use: '物品、政策' },
      { phrase: 'a clear sense of purpose', meaning: '明确的目标感', use: '工作、人生' },
      { phrase: 'for practical purposes', meaning: '从实际角度看', use: '学术讨论' },
    ],
    family: ['purposeful adj.', 'purposely adv.', 'purposeless adj.'],
    distinctions: [
      {
        word: 'aim',
        difference: 'aim 常表示计划或行动目标；purpose 更强调存在或行为背后的理由。',
        rule: '解释“为何要做/存在”的根本原因用 purpose。',
      },
    ],
    pitfalls: [
      {
        wrong: 'the purpose to do this',
        better: 'the purpose of doing this / the purpose is to do this',
        why: 'purpose 后直接接动作时通常用 of + -ing；系动词后用 is to do。',
      },
    ],
    writingTip:
      '图表或流程图介绍可用 The primary purpose of this process is to…，但不要重复堆砌。',
    speakingTip:
      '谈工作选择时 a sense of purpose 是自然且有层次的表达。',
    recall: '补全：The purpose ___ introducing the rule is to improve safety.',
    answer: 'of',
    productionFrame: 'The primary purpose of X is to Y.',
  },
  exchange: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪksˈtʃeɪndʒ/',
    ipaUs: '/ɪksˈtʃeɪndʒ/',
    cefr: 'B2',
    level: '多义核心词',
    value: 82,
    skills: { reading: 88, listening: 73, task1: 68, task2: 77, speaking: 81 },
    coreMeaning: '交换；交流。IELTS 中优先掌握信息、文化与资源交换的抽象义。',
    definition: 'to give something to someone and receive something in return',
    register: '中性',
    topics: ['文化', '教育', '商业', '旅游'],
    patterns: ['exchange A for B', 'exchange A with B', 'an exchange of + noun'],
    collocations: [
      { phrase: 'cultural exchange', meaning: '文化交流', use: '旅游、全球化' },
      { phrase: 'exchange information', meaning: '交换信息', use: '科技、工作' },
      { phrase: 'an exchange of ideas', meaning: '思想交流', use: '教育、团队' },
    ],
    family: ['exchangeable adj.', 'interchange n./v.'],
    distinctions: [
      {
        word: 'replace',
        difference: 'replace 是“用新物替代旧物”；exchange 强调双方互换或兑换。',
        rule: '双方各有所得，或货币/信息互换，用 exchange。',
      },
    ],
    pitfalls: [
      {
        wrong: 'exchange opinions each other',
        better: 'exchange opinions with each other',
        why: 'exchange 后表达对象关系时，需要 with。',
      },
    ],
    writingTip:
      '全球化题可用 cultural exchange，但要解释它如何增进理解，避免只列名词短语。',
    speakingTip:
      'Part 2 描述旅行或国际活动时，用 exchange ideas with local people 很自然。',
    recall: '“思想交流”怎么表达？',
    answer: 'an exchange of ideas',
    productionFrame: 'X enables people to exchange ideas with Y.',
  },
  proportion: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/prəˈpɔːʃn/',
    ipaUs: '/prəˈpɔːrʃn/',
    cefr: 'B2',
    level: 'Task 1 必备词',
    value: 87,
    skills: { reading: 76, listening: 55, task1: 97, task2: 64, speaking: 55 },
    coreMeaning: '比例、占比；用于描述整体中的一部分。',
    definition: 'a part or share of a whole',
    register: '正式 / 数据描述',
    topics: ['图表', '人口', '消费', '教育'],
    patterns: ['the proportion of + plural noun', 'a proportion of + plural noun', 'the proportion ... rose to + figure'],
    collocations: [
      { phrase: 'the proportion of residents', meaning: '居民的比例', use: 'Task 1 人口数据' },
      { phrase: 'a large proportion of', meaning: '很大一部分', use: 'Task 1 / Task 2' },
      { phrase: 'in proportion to', meaning: '与…成比例', use: '正式论述' },
    ],
    family: ['proportional adj.', 'proportionally adv.', 'disproportionate adj.'],
    distinctions: [
      {
        word: 'percentage',
        difference: 'percentage 强调具体百分数；proportion 强调整体中的份额，可带或不带数字。',
        rule: '写具体 35% 可用 percentage；整体组成或比较用 proportion 更灵活。',
      },
    ],
    pitfalls: [
      {
        wrong: 'the proportion of people was increased',
        better: 'the proportion of people increased / the proportion of people who… increased',
        why: '比例本身“上升”，不需要被动；of 后通常需要明确人群。',
      },
    ],
    writingTip:
      'Task 1 中，先用 the proportion of… 明确对象，再补 rose/fell from A to B，避免只报数字。',
    speakingTip:
      '非数据场景不必硬用；自然表达通常比生僻量化更重要。',
    recall: '补全：The proportion ___ students studying abroad rose to 28%.',
    answer: 'of',
    productionFrame: 'The proportion of X rose from A to B.',
  },
  correspondence: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ˌkɒrəˈspɒndəns/',
    ipaUs: '/ˌkɔːrəˈspɑːndəns/',
    cefr: 'C1',
    level: '进阶理解词',
    value: 71,
    skills: { reading: 85, listening: 54, task1: 55, task2: 66, speaking: 43 },
    coreMeaning: '通信、往来；也可指对应关系或一致性。',
    definition: 'communication by letters or email, or a close similarity between two things',
    register: '正式',
    topics: ['商业', '科技', '研究', '历史'],
    patterns: ['correspondence with + person', 'a correspondence between A and B', 'business correspondence'],
    collocations: [
      { phrase: 'business correspondence', meaning: '商务通信', use: '职场、商业' },
      { phrase: 'a close correspondence between', meaning: '密切对应', use: '研究论述' },
      { phrase: 'written correspondence', meaning: '书面往来', use: '正式语境' },
    ],
    family: ['correspond v.', 'corresponding adj.', 'correspondent n.'],
    distinctions: [
      {
        word: 'communication',
        difference: 'communication 最通用；correspondence 更正式，常指书信、邮件或两者对应。',
        rule: '泛指交流用 communication；正式书面往来或对应关系用 correspondence。',
      },
    ],
    pitfalls: [
      {
        wrong: 'correspondence with the two factors',
        better: 'a correspondence between the two factors',
        why: '说“两个因素之间的对应关系”时用 between。',
      },
    ],
    writingTip:
      '不是必需的“高分词”；只有讨论书面沟通或变量对应时才用，准确比复杂重要。',
    speakingTip:
      '口语中通常优先用 emails / keeping in touch，避免刻意使用 correspondence。',
    recall: '“A 和 B 之间的对应关系”怎么表达？',
    answer: 'a correspondence between A and B',
    productionFrame: 'There is a close correspondence between X and Y.',
  },
};

const stateOptions: Array<{ value: StudyState; label: string; hint: string }> = [
  { value: 'unseen', label: '未学习', hint: '先建立核心义和搭配' },
  { value: 'seen', label: '看过', hint: '需要巩固词义' },
  { value: 'recognizes', label: '看得懂', hint: '转向搭配与造句' },
  { value: 'active', label: '能输出', hint: '保持真实语境练习' },
  { value: 'mastered', label: '已掌握', hint: '仅保留间隔复习' },
];

const scoreLabels: Array<{ key: keyof SkillScores; label: string }> = [
  { key: 'reading', label: '阅读' },
  { key: 'listening', label: '听力' },
  { key: 'task1', label: '写作 T1' },
  { key: 'task2', label: '写作 T2' },
  { key: 'speaking', label: '口语' },
];

function parseOccurrence(note: string) {
  const match = note.match(/本篇出现\s*(\d+)\s*次/);
  return match ? Number(match[1]) : undefined;
}

function cleanMeaning(value: string) {
  return value
    .replace(/\b(?:n|v|vt|vi|a|ad|adv|prep|conj)\.\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectPartOfSpeech(meaning: string) {
  const tags: string[] = [];
  if (/\b(?:vt|vi|v)\./i.test(meaning)) tags.push('动词');
  if (/\bn\./i.test(meaning)) tags.push('名词');
  if (/\b(?:a|adj)\./i.test(meaning)) tags.push('形容词');
  if (/\b(?:ad|adv)\./i.test(meaning)) tags.push('副词');
  return tags.length ? tags.join(' / ') : '词性待核验';
}

function genericPatterns(word: string, meaning: string) {
  if (/\b(?:vt|vi|v)\./i.test(meaning)) {
    return [word + ' + noun', word + ' + noun + by + -ing', 'be ' + word + 'ed by + noun'];
  }
  if (/\bn\./i.test(meaning)) {
    return ['the ' + word + ' of + noun', 'a/an + adjective + ' + word, word + ' + preposition'];
  }
  return [word + ' + noun', 'be + ' + word, 'more / less + ' + word];
}

function genericCollocations(word: string, meaning: string): Collocation[] {
  const isVerb = /\b(?:vt|vi|v)\./i.test(meaning);
  const isNoun = /\bn\./i.test(meaning);
  if (isVerb) {
    return [
      { phrase: 'effectively ' + word, meaning: '有效地…', use: '论证加强' },
      { phrase: word + ' public awareness', meaning: '与公共意识相关', use: '社会、教育' },
      { phrase: word + ' long-term outcomes', meaning: '与长期结果相关', use: 'Task 2' },
    ];
  }
  if (isNoun) {
    return [
      { phrase: 'a significant ' + word, meaning: '显著的…', use: '正式论述' },
      { phrase: word + ' in society', meaning: '社会中的…', use: '社会话题' },
      { phrase: 'the role of ' + word, meaning: '…的作用', use: 'Task 2' },
    ];
  }
  return [
    { phrase: 'highly ' + word, meaning: '高度…', use: '正式语境' },
    { phrase: word + ' for society', meaning: '对社会…', use: 'Task 2' },
    { phrase: word + ' in practice', meaning: '在实践中…', use: '论证' },
  ];
}

function fallbackProfile(word: string, originalMeaning: string): ExpertProfile {
  const semanticWeight = Math.min(10, Math.round(word.length / 1.6));
  const value = Math.min(82, 62 + semanticWeight);
  const pos = detectPartOfSpeech(originalMeaning);
  return {
    quality: 'fallback',
    confidence: 2,
    cefr: word.length >= 9 ? 'B2–C1（估计）' : 'B1–B2（估计）',
    level: '待核验档案',
    value,
    skills: {
      reading: Math.min(90, value + 8),
      listening: Math.max(45, value - 12),
      task1: Math.max(42, value - 10),
      task2: Math.min(84, value + 3),
      speaking: Math.max(48, value - 5),
    },
    coreMeaning: cleanMeaning(originalMeaning) || '需要结合词典和上下文确认核心义。',
    definition: 'This entry needs a verified dictionary definition before high-stakes use.',
    register: '待结合语境核验',
    topics: ['导入文章主题', '通用学术表达'],
    patterns: genericPatterns(word, originalMeaning),
    collocations: genericCollocations(word, originalMeaning),
    family: ['建议通过词典补全词族'],
    distinctions: [
      {
        word: '近义词',
        difference: '该词尚未进入本地已审校词库，不能可靠生成近义词替换建议。',
        rule: '先确认词性与语境义，再决定是否用于写作或口语输出。',
      },
    ],
    pitfalls: [
      {
        wrong: '直接把原始中译逐字翻成英语句子',
        better: '先掌握一个句型和一个经过核验的搭配',
        why: '原始 JSON 的释义和例句有时混合词性或是泛化模板。',
      },
    ],
    writingTip:
      '先把它作为阅读理解词；在确认词性、搭配和语域前，不建议为了“高级”而强行写入作文。',
    speakingTip:
      '如需在口语中使用，优先选择自己能够自然解释并能接上具体例子的语境。',
    recall: '用词典确认 ' + word + ' 最适合 IELTS 的核心义和一个搭配。',
    answer: '确认后再加入主动输出词库。',
    productionFrame: 'Use ' + word + ' only after verifying its natural collocation.',
  };
}

function profileFor(word: string, meaning: string) {
  return profileMap[word.toLowerCase()] || fallbackProfile(word, meaning);
}

function priorityFor(
  word: VocabularyWord | undefined,
  profile: ExpertProfile,
  studyState: StudyState,
) {
  const sourceScore = word ? Math.round(word.freq * 100) : 58;
  const stateGap: Record<StudyState, number> = {
    unseen: 20,
    seen: 15,
    recognizes: 9,
    active: 3,
    mastered: -8,
  };
  return Math.max(
    25,
    Math.min(99, Math.round(profile.value * 0.55 + sourceScore * 0.25 + stateGap[studyState])),
  );
}

function buildAnalysis(
  word: VocabularyWord | undefined,
  profile: ExpertProfile,
  studyState: StudyState,
  sourceTitle?: string,
  sourceLabel = '单词查询',
): Analysis {
  const lemma = word?.word || '';
  return {
    ...profile,
    word: lemma,
    sourceWord: word,
    sourceTitle,
    occurrenceCount: word ? parseOccurrence(word.note) : undefined,
    sourceFrequency: word ? Math.round(word.freq * 100) : undefined,
    priority: priorityFor(word, profile, studyState),
    sourceLabel,
  };
}

function normalizeDocument(value: unknown): VocabularyDocument | null {
  if (!value || typeof value !== 'object') return null;
  const document = value as VocabularyDocument;
  if (!Array.isArray(document.words)) return null;
  const words = document.words
    .filter(
      (entry) =>
        entry &&
        typeof entry.word === 'string' &&
        typeof entry.meaning === 'string',
    )
    .map((entry) => ({
      word: entry.word.trim().toLowerCase(),
      meaning: entry.meaning,
      example: typeof entry.example === 'string' ? entry.example : '',
      note: typeof entry.note === 'string' ? entry.note : '',
      freq: typeof entry.freq === 'number' ? entry.freq : 0.5,
    }))
    .filter((entry) => entry.word);
  if (!words.length) return null;
  return {
    words: Array.from(new Map(words.map((entry) => [entry.word, entry])).values()),
    meta: document.meta || {},
  };
}

function profileFromDictionary(word: string, entries: DictionaryEntry[]): ExpertProfile {
  const entry = entries[0];
  const meanings = entry?.meanings || [];
  const primary = meanings[0];
  const firstDefinition = primary?.definitions?.[0];
  const definition = firstDefinition?.definition || 'Dictionary definition unavailable.';
  const pos = primary?.partOfSpeech || 'word';
  const phonetic =
    entry?.phonetic ||
    entry?.phonetics?.find((candidate) => candidate.text)?.text ||
    undefined;
  const base = fallbackProfile(word, pos + '. ' + definition);

  return {
    ...base,
    quality: 'dictionary',
    confidence: 3,
    ipaUk: phonetic,
    cefr: '待词库审校',
    level: '词典补全档案',
    coreMeaning:
      '已取得英语词典释义；中文释义、IELTS 适配度与搭配建议仍需结合具体语境确认。',
    definition,
    register: '词典补全 · 语域待核验',
    topics: ['单词查询', '建议补充原文语境'],
    patterns: [
      word + ' as a ' + pos,
      ...base.patterns.slice(0, 2),
    ],
    collocations: base.collocations,
    pitfalls: [
      {
        wrong: '把自动补全档案直接当作精确的 IELTS 高频结论',
        better: '把它作为首轮理解，再在原句中确认词义与搭配',
        why: '公共词典提供释义，但不提供你的文章语境或真实考试频率。',
      },
    ],
  };
}

function qualityLabel(quality: ProfileQuality) {
  if (quality === 'curated') return '已审校 IELTS 档案';
  if (quality === 'dictionary') return '词典补全 · 建议核对';
  return '通用分析 · 待核验';
}

function qualityDescription(quality: ProfileQuality) {
  if (quality === 'curated') {
    return '核心义、搭配、易错点和输出建议已按 IELTS 使用场景整理。';
  }
  if (quality === 'dictionary') {
    return '英文释义来自在线词典；考试适配度与搭配为学习建议，不等同于真题频率。';
  }
  return '原始文件没有提供足够语境；本卡片明确保留不确定性，适合作为下一步核验清单。';
}

function sourceExampleLabel(example: string) {
  if (!example) return '未提供原始例句';
  if (/IELTS learners often encounter/i.test(example)) return '系统泛化例句';
  return '来源例句';
}

export default function Home() {
  const [documentData, setDocumentData] = useState<VocabularyDocument>(demoVocabulary);
  const [activeWord, setActiveWord] = useState<VocabularyWord | undefined>(
    demoVocabulary.words[11],
  );
  const [adHocAnalysis, setAdHocAnalysis] = useState<Analysis | null>(null);
  const [studyStates, setStudyStates] = useState<Record<string, StudyState>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'priority' | 'output' | 'review'>('all');
  const [manualInput, setManualInput] = useState('');
  const [importError, setImportError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('ielts-vocab-study-states');
      if (stored) setStudyStates(JSON.parse(stored) as Record<string, StudyState>);
    } catch {
      // Local progress is optional; the learning surface still works without it.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'ielts-vocab-study-states',
        JSON.stringify(studyStates),
      );
    } catch {
      // Ignore browsers that block local storage.
    }
  }, [studyStates]);

  const sourceTitle =
    documentData.meta?.title || '未命名词表';

  const activeState: StudyState =
    activeWord ? studyStates[activeWord.word] || 'unseen' : 'unseen';

  const activeAnalysis = adHocAnalysis
    ? adHocAnalysis
    : buildAnalysis(
        activeWord,
        profileFor(activeWord?.word || '', activeWord?.meaning || ''),
        activeState,
        sourceTitle,
        '已导入词表',
      );

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return documentData.words
      .filter((word) => {
        const state = studyStates[word.word] || 'unseen';
        const profile = profileFor(word.word, word.meaning);
        const priority = priorityFor(word, profile, state);
        const matchesSearch =
          !keyword ||
          word.word.includes(keyword) ||
          word.meaning.toLowerCase().includes(keyword);
        const matchesFilter =
          filter === 'all' ||
          (filter === 'priority' && priority >= 74) ||
          (filter === 'output' && profile.skills.task2 >= 78) ||
          (filter === 'review' && state !== 'mastered');
        return matchesSearch && matchesFilter;
      })
      .sort((left, right) => {
        const leftProfile = profileFor(left.word, left.meaning);
        const rightProfile = profileFor(right.word, right.meaning);
        return (
          priorityFor(
            right,
            rightProfile,
            studyStates[right.word] || 'unseen',
          ) -
          priorityFor(
            left,
            leftProfile,
            studyStates[left.word] || 'unseen',
          )
        );
      });
  }, [documentData.words, filter, search, studyStates]);

  const metrics = useMemo(() => {
    const analyses = documentData.words.map((word) =>
      buildAnalysis(
        word,
        profileFor(word.word, word.meaning),
        studyStates[word.word] || 'unseen',
        sourceTitle,
      ),
    );
    return {
      priority: analyses.filter((analysis) => analysis.priority >= 74).length,
      output: analyses.filter((analysis) => analysis.skills.task2 >= 78).length,
      mastered: documentData.words.filter(
        (word) => studyStates[word.word] === 'mastered',
      ).length,
    };
  }, [documentData.words, sourceTitle, studyStates]);

  function chooseWord(word: VocabularyWord) {
    setAdHocAnalysis(null);
    setActiveWord(word);
    setShowAnswer(false);
    setLookupMessage('');
  }

  function setStudyState(nextState: StudyState) {
    if (!activeWord) return;
    setStudyStates((previous) => ({ ...previous, [activeWord.word]: nextState }));
  }

  function speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportError('');
    try {
      const parsed = normalizeDocument(JSON.parse(await file.text()));
      if (!parsed) {
        setImportError('未识别到有效词表：需要包含 words 数组和每个词的 word、meaning 字段。');
        return;
      }
      setDocumentData(parsed);
      const featured =
        parsed.words.find((word) => word.word === 'enhance') || parsed.words[0];
      setActiveWord(featured);
      setAdHocAnalysis(null);
      setSearch('');
      setFilter('all');
      setLookupMessage('已导入 ' + parsed.words.length + ' 个词。');
      setShowAnswer(false);
    } catch {
      setImportError('这个文件无法解析为 JSON。请确认它是网站导出的原始词汇文件。');
    } finally {
      event.target.value = '';
    }
  }

  async function handleManualLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const word = manualInput.trim().toLowerCase().replace(/[^a-z-]/g, '');
    if (!word) {
      setLookupMessage('请输入一个英文单词。');
      return;
    }
    setManualInput(word);
    const imported = documentData.words.find((item) => item.word === word);
    if (imported) {
      chooseWord(imported);
      setLookupMessage('这个词已在当前词表中，已打开它的学习档案。');
      document.getElementById('analysis-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const knownProfile = profileMap[word];
    if (knownProfile) {
      setActiveWord(undefined);
      const knownAnalysis = buildAnalysis(
        undefined,
        knownProfile,
        'unseen',
        undefined,
        '单词查询 · 本地已审校词库',
      );
      knownAnalysis.word = word;
      setAdHocAnalysis(knownAnalysis);
      setLookupMessage('已从本地已审校词库生成档案。');
      setShowAnswer(false);
      document.getElementById('analysis-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const provisional = buildAnalysis(
      undefined,
      fallbackProfile(word, ''),
      'unseen',
      undefined,
      '单词查询 · 正在核对词典',
    );
    provisional.word = word;
    setActiveWord(undefined);
    setAdHocAnalysis(provisional);
    setIsLookingUp(true);
    setLookupMessage('正在用公开英语词典补全释义与发音…');
    setShowAnswer(false);
    document.getElementById('analysis-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const response = await fetch(
        'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(word),
      );
      if (!response.ok) throw new Error('lookup failed');
      const entries = (await response.json()) as DictionaryEntry[];
      const dictionaryProfile = profileFromDictionary(word, entries);
      const completed = buildAnalysis(
        undefined,
        dictionaryProfile,
        'unseen',
        undefined,
        '单词查询 · 在线词典补全',
      );
      completed.word = word;
      setAdHocAnalysis(completed);
      setLookupMessage('已补全英文释义与发音。IELTS 适配建议仍标注为待核验。');
    } catch {
      setLookupMessage('暂时无法连接在线词典，已保留一份待核验学习档案。');
    } finally {
      setIsLookingUp(false);
    }
  }

  function restoreDemo() {
    setDocumentData(demoVocabulary);
    setActiveWord(demoVocabulary.words[11]);
    setAdHocAnalysis(null);
    setLookupMessage('已恢复示例词表。');
    setShowAnswer(false);
  }

  function downloadAnalysis() {
    const payload = {
      exportedAt: new Date().toISOString(),
      source: activeAnalysis.sourceLabel,
      article: activeAnalysis.sourceTitle,
      analysis: activeAnalysis,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = activeAnalysis.word + '-ielts-analysis.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const currentStateOption =
    stateOptions.find((option) => option.value === activeState) || stateOptions[0];
  const activeSourceExample = activeAnalysis.sourceWord?.example || '';

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Lexiwise IELTS 首页">
          <span className="brand-mark">L</span>
          <span>
            <strong>lexiwise</strong>
            <small>IELTS VOCAB LAB</small>
          </span>
        </a>
        <nav className="topnav" aria-label="主导航">
          <a href="#library">词表工作台</a>
          <a href="#analysis-panel">专家档案</a>
          <a href="#how-it-works">分析标准</a>
        </nav>
        <button className="quiet-button" type="button" onClick={restoreDemo}>
          恢复示例
        </button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse-dot" />
            从“看过”到“用对”的 IELTS 词汇系统
          </div>
          <h1>
            不只收词，
            <em>把每个词练成</em>
            你的表达。
          </h1>
          <p>
            导入练习网站导出的 JSON，得到按 IELTS 阅读、写作和口语场景组织的词汇档案。
            也可以随时查询一个新词，并看见分析的可信度边界。
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => importRef.current?.click()}
            >
              导入我的词汇 JSON
              <span>→</span>
            </button>
            <a className="text-link" href="#analysis-panel">
              查看专家档案 <span>↓</span>
            </a>
          </div>
          <input
            ref={importRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
          />
          {importError ? <p className="feedback error">{importError}</p> : null}
          {!importError && lookupMessage ? (
            <p className="feedback success">{lookupMessage}</p>
          ) : null}
        </div>

        <aside className="hero-scorecard" aria-label="学习状态概览">
          <div className="scorecard-header">
            <span>THIS SET</span>
            <span className="source-chip">已载入</span>
          </div>
          <div className="scorecard-title">
            <div>
              <small>当前词表</small>
              <strong>{documentData.words.length}</strong>
              <span>个词</span>
            </div>
            <div className="progress-orbit" aria-hidden="true">
              <span>{metrics.mastered}</span>
              <small>已掌握</small>
            </div>
          </div>
          <div className="metric-grid">
            <div>
              <span>优先攻克</span>
              <strong>{metrics.priority}</strong>
            </div>
            <div>
              <span>可用于 T2</span>
              <strong>{metrics.output}</strong>
            </div>
            <div>
              <span>来源文章</span>
              <strong className="article-code">
                {documentData.meta?.examId || 'LOCAL'}
              </strong>
            </div>
          </div>
          <div className="source-title">{sourceTitle}</div>
        </aside>
      </section>

      <section className="lookup-strip" aria-label="单词查询">
        <div>
          <span className="section-kicker">ONE WORD, FULL PLAN</span>
          <h2>查一个词，也给你一套可执行的学习方案。</h2>
        </div>
        <form className="lookup-form" onSubmit={handleManualLookup}>
          <label className="visually-hidden" htmlFor="word-search">
            输入英文单词
          </label>
          <input
            id="word-search"
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="输入一个英文单词，例如 enhance"
            autoComplete="off"
          />
          <button className="dark-button" type="submit" disabled={isLookingUp}>
            {isLookingUp ? '核对中…' : '深度分析'}
          </button>
        </form>
      </section>

      <section className="workbench" id="library">
        <aside className="library-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">VOCABULARY QUEUE</span>
              <h2>本次词表</h2>
            </div>
            <button
              type="button"
              className="import-mini"
              onClick={() => importRef.current?.click()}
            >
              ＋ 导入
            </button>
          </div>
          <div className="library-context">
            <span className="context-dot" />
            {sourceTitle}
          </div>
          <label className="filter-search">
            <span aria-hidden="true">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜单词或中文义"
            />
          </label>
          <div className="filter-row" aria-label="词表筛选">
            {[
              ['all', '全部'],
              ['priority', '优先'],
              ['output', 'T2 输出'],
              ['review', '待复习'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'filter active' : 'filter'}
                onClick={() =>
                  setFilter(value as 'all' | 'priority' | 'output' | 'review')
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="list-meta">
            <span>{filteredWords.length} 个结果</span>
            <span>按学习优先级排序</span>
          </div>
          <div className="word-list">
            {filteredWords.map((word) => {
              const state = studyStates[word.word] || 'unseen';
              const profile = profileFor(word.word, word.meaning);
              const priority = priorityFor(word, profile, state);
              const isActive = activeWord?.word === word.word && !adHocAnalysis;
              return (
                <button
                  key={word.word}
                  type="button"
                  className={isActive ? 'word-row selected' : 'word-row'}
                  onClick={() => chooseWord(word)}
                >
                  <span className="word-row-main">
                    <strong>{word.word}</strong>
                    <small>{cleanMeaning(word.meaning)}</small>
                  </span>
                  <span className="word-row-score">
                    <b>{priority}</b>
                    <small>{stateOptions.find((item) => item.value === state)?.label}</small>
                  </span>
                </button>
              );
            })}
            {!filteredWords.length ? (
              <div className="empty-list">没有匹配的词，换个关键词试试。</div>
            ) : null}
          </div>
        </aside>

        <article className="analysis-panel" id="analysis-panel">
          <div className="analysis-topline">
            <span className={'quality-pill ' + activeAnalysis.quality}>
              <i />
              {qualityLabel(activeAnalysis.quality)}
            </span>
            <span>{activeAnalysis.sourceLabel}</span>
          </div>

          <div className="word-identity">
            <div>
              <div className="word-heading">
                <h2>{activeAnalysis.word}</h2>
                <button
                  type="button"
                  className="sound-button"
                  onClick={() => speakWord(activeAnalysis.word)}
                  aria-label={'朗读 ' + activeAnalysis.word}
                >
                  ◖))
                </button>
              </div>
              <div className="pronunciation-line">
                <span>{activeAnalysis.ipaUk || '发音待词典补全'}</span>
                {activeAnalysis.ipaUs ? <span>US {activeAnalysis.ipaUs}</span> : null}
                <span className="pos-label">{activeAnalysis.cefr}</span>
                <span className="pos-label">{activeAnalysis.level}</span>
              </div>
              <p className="core-meaning">{activeAnalysis.coreMeaning}</p>
              <p className="definition">{activeAnalysis.definition}</p>
            </div>
            <div className="priority-card">
              <span>你的学习优先级</span>
              <strong>{activeAnalysis.priority}</strong>
              <small>/ 100</small>
              <div className="priority-meter">
                <span style={{ width: activeAnalysis.priority + '%' }} />
              </div>
              <em>词汇价值 {activeAnalysis.value}</em>
            </div>
          </div>

          <div className="quality-note">
            <span>分析可信度 {activeAnalysis.confidence}/5</span>
            <p>{qualityDescription(activeAnalysis.quality)}</p>
          </div>

          <section className="quick-grid">
            <div className="quick-card emphasis">
              <span className="card-label">30 秒掌握</span>
              <h3>优先记住这个句型</h3>
              <p className="production-frame">{activeAnalysis.productionFrame}</p>
              <div className="tag-row">
                {activeAnalysis.topics.map((topic) => (
                  <span key={topic}>{topic}</span>
                ))}
              </div>
            </div>
            <div className="quick-card">
              <span className="card-label">语域</span>
              <h3>{activeAnalysis.register}</h3>
              <p>先确认语域，再决定它是否适合放进你的写作或口语答案。</p>
            </div>
            <div className="quick-card skill-card">
              <span className="card-label">考试适配</span>
              <div className="skill-bars">
                {scoreLabels.map(({ key, label }) => (
                  <div key={key}>
                    <span>{label}</span>
                    <i>
                      <b style={{ width: activeAnalysis.skills[key] + '%' }} />
                    </i>
                    <strong>{activeAnalysis.skills[key]}</strong>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="detail-section">
            <div className="section-title-row">
              <div>
                <span className="section-kicker">USE IT ACCURATELY</span>
                <h3>搭配与句型</h3>
              </div>
              <span className="hint">先学 1 个句型 + 2 个搭配</span>
            </div>
            <div className="pattern-list">
              {activeAnalysis.patterns.map((pattern) => (
                <code key={pattern}>{pattern}</code>
              ))}
            </div>
            <div className="collocation-grid">
              {activeAnalysis.collocations.map((collocation) => (
                <div className="collocation-card" key={collocation.phrase}>
                  <strong>{collocation.phrase}</strong>
                  <span>{collocation.meaning}</span>
                  <small>{collocation.use}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="detail-section dual-section">
            <div>
              <div className="section-title-row compact">
                <div>
                  <span className="section-kicker">DO NOT CONFUSE</span>
                  <h3>近义词怎么选</h3>
                </div>
              </div>
              <div className="distinction-list">
                {activeAnalysis.distinctions.map((item) => (
                  <div key={item.word}>
                    <strong>{item.word}</strong>
                    <p>{item.difference}</p>
                    <small>安全选择：{item.rule}</small>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="section-title-row compact">
                <div>
                  <span className="section-kicker">COMMON TRAP</span>
                  <h3>中国学习者易错点</h3>
                </div>
              </div>
              <div className="pitfall-list">
                {activeAnalysis.pitfalls.map((pitfall) => (
                  <div key={pitfall.wrong}>
                    <p>
                      <del>{pitfall.wrong}</del>
                      <span>→</span>
                      <ins>{pitfall.better}</ins>
                    </p>
                    <small>{pitfall.why}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="detail-section transfer-section">
            <div className="transfer-copy">
              <span className="section-kicker">MOVE IT INTO THE EXAM</span>
              <h3>别只认识，把它迁移到输出里。</h3>
              <p>
                优秀词汇不是“更难”，而是能在对的题目、对的搭配和对的语域里稳定出现。
              </p>
            </div>
            <div className="transfer-tips">
              <div>
                <span>WRITING</span>
                <p>{activeAnalysis.writingTip}</p>
              </div>
              <div>
                <span>SPEAKING</span>
                <p>{activeAnalysis.speakingTip}</p>
              </div>
            </div>
          </section>

          <section className="practice-card">
            <div>
              <span className="section-kicker">ACTIVE RECALL</span>
              <h3>{activeAnalysis.recall}</h3>
              {showAnswer ? (
                <p className="answer">答案：{activeAnalysis.answer}</p>
              ) : (
                <button
                  type="button"
                  className="answer-button"
                  onClick={() => setShowAnswer(true)}
                >
                  显示答案
                </button>
              )}
            </div>
            <div className="study-actions">
              {activeWord ? (
                <label className="state-select">
                  <span>掌握状态</span>
                  <select
                    value={activeState}
                    onChange={(event) => setStudyState(event.target.value as StudyState)}
                  >
                    {stateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <small>{currentStateOption.hint}</small>
                </label>
              ) : (
                <div className="state-select static">
                  <span>掌握状态</span>
                  <strong>暂未加入词表</strong>
                  <small>导入含该词的 JSON 后可追踪进度</small>
                </div>
              )}
              <button type="button" className="export-button" onClick={downloadAnalysis}>
                导出该词档案
              </button>
            </div>
          </section>

          {activeAnalysis.sourceWord ? (
            <section className="source-section">
              <div>
                <span className="section-kicker">SOURCE TRACE</span>
                <h3>来源与语境边界</h3>
                <p>
                  来自《{activeAnalysis.sourceTitle}》
                  {activeAnalysis.occurrenceCount
                    ? ' · 本篇出现 ' + activeAnalysis.occurrenceCount + ' 次'
                    : ''}
                  {activeAnalysis.sourceFrequency
                    ? ' · 导出频率 ' + activeAnalysis.sourceFrequency + '%'
                    : ''}
                </p>
              </div>
              <div className="source-quote">
                <span>{sourceExampleLabel(activeSourceExample)}</span>
                <p>{activeSourceExample || '未提供来源例句。'}</p>
                <small>
                  {sourceExampleLabel(activeSourceExample) === '系统泛化例句'
                    ? '此句不是文章原句，因此上方学习建议以通用 IELTS 用法为准。'
                    : '未上传文章正文时，系统不会把当前分析误标为“本文唯一语境义”。'}
                </small>
              </div>
            </section>
          ) : null}
        </article>
      </section>

      <section className="method-section" id="how-it-works">
        <div>
          <span className="section-kicker">ANALYSIS STANDARD</span>
          <h2>一个词，不只是一行中文释义。</h2>
        </div>
        <div className="method-grid">
          <article>
            <b>01</b>
            <h3>先分清价值与优先级</h3>
            <p>词本身的 IELTS 价值，不等于你现在最该学它。系统会把来源频率与掌握缺口分开看。</p>
          </article>
          <article>
            <b>02</b>
            <h3>再把“懂”变成“会用”</h3>
            <p>每张卡优先给一个句型、两个搭配、一个避坑点和一项主动回忆任务。</p>
          </article>
          <article>
            <b>03</b>
            <h3>诚实标明证据强度</h3>
            <p>本地审校、词典补全与待核验分析会被清楚标注，避免把不完整来源伪装成专家结论。</p>
          </article>
        </div>
      </section>

      <footer>
        <span>LEXIWISE · IELTS VOCAB LAB</span>
        <span>为真实输出而学，而不只是收藏单词。</span>
      </footer>
    </main>
  );
}
