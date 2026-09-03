'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { extendedCuratedProfiles } from './extended-curated-profiles';
import {
  AI_CONFIG_TEMPLATE,
  AiGeneratedProfile,
  AiProviderConfig,
  parseAiProviderConfig,
  requestAiWordAnalysis,
} from './ai-client';

type StudyState = 'unseen' | 'seen' | 'recognizes' | 'active' | 'mastered';
type ProfileQuality = 'curated' | 'ai' | 'dictionary' | 'fallback';
type AiConnection = Omit<AiProviderConfig, 'apiKey'>;

type SourceReference = {
  title?: string;
  source?: string;
  examId?: string;
  createdAt?: string;
  note: string;
  occurrenceCount?: number;
  frequency?: number;
};

type VocabularyWord = {
  word: string;
  meaning: string;
  example: string;
  note: string;
  freq: number;
  sourceRefs?: SourceReference[];
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
  sourceRefs?: SourceReference[];
  studyState: StudyState;
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

const curatedOverrides: Record<string, Partial<ExpertProfile>> = {
  exact: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪɡˈzækt/',
    cefr: 'B2',
    level: '核心输出词',
    value: 78,
    skills: { reading: 80, listening: 70, task1: 72, task2: 68, speaking: 74 },
    coreMeaning: '精确的；完全准确的。',
    definition: 'correct in every detail; precise',
    register: '中性 / 正式',
    topics: ['数据', '研究', '科技'],
    patterns: ['the exact + noun', 'be exact about + noun', 'an exact match/copy'],
    collocations: [
      { phrase: 'exact figure', meaning: '确切数字', use: 'Task 1 数据描述' },
      { phrase: 'exact location', meaning: '确切地点', use: '地图、调查、科技' },
      { phrase: 'exact date', meaning: '确切日期', use: '历史、计划、事件' },
    ],
    distinctions: [
      {
        word: 'precise',
        difference: 'exact 强调结果或细节完全正确；precise 更强调测量、表达或方法严密。',
        rule: '数字、日期、身份等必须完全正确时用 exact；谈测量或表述的严密性时多用 precise。',
      },
    ],
    pitfalls: [
      {
        wrong: 'an exactly number',
        better: 'an exact number',
        why: 'exact 是形容词，修饰名词；exactly 是副词。',
      },
    ],
    writingTip: '数据确实已知时可用 exact figure；数字只是估算时用 approximately，不要制造虚假的精确感。',
    speakingTip: '自然表达为 I cannot remember the exact name/date，而不是刻意堆砌高级词。',
    recall: '“确切数字”怎么说？',
    answer: 'exact figure',
    productionFrame: 'The exact figure was X.',
  },
  argue: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈɑːɡjuː/',
    cefr: 'B2',
    level: '核心输出词',
    value: 86,
    skills: { reading: 85, listening: 65, task1: 18, task2: 94, speaking: 80 },
    coreMeaning: '提出理由来主张某事为真或应当发生。',
    definition: 'to give reasons for believing that something is true or should be done',
    register: '正式 / 学术中性',
    topics: ['政府', '教育', '环境', '社会'],
    patterns: ['argue that + clause', 'argue for/against + noun or -ing', 'It can be argued that + clause'],
    collocations: [
      { phrase: 'argue that + clause', meaning: '论证某一观点', use: 'Task 2 立场展开' },
      { phrase: 'argue for stricter regulation', meaning: '主张更严格监管', use: '政府、环境、媒体' },
      { phrase: 'argue convincingly that', meaning: '有说服力地论证', use: '评价论点或证据' },
    ],
    distinctions: [
      {
        word: 'claim',
        difference: 'claim 只是提出断言；argue 含有给出理由、展开论证的意味。',
        rule: '作文中若后面会解释原因或证据，用 argue 比 claim 更准确。',
      },
    ],
    pitfalls: [
      {
        wrong: 'argue about that public transport should be free',
        better: 'argue that public transport should be free',
        why: 'argue about 常指争吵或讨论某话题；提出有理由的主张用 argue that。',
      },
    ],
    writingTip: '用 argue 引出观点后必须给出原因、例子或机制，否则只是换了一个 say。',
    speakingTip: 'Part 3 可用 I would argue that… 来柔和地表达有依据的个人观点。',
    recall: '“论证政府应采取行动”怎么说？',
    answer: 'argue that governments should act',
    productionFrame: 'It can be argued that X should Y.',
  },
  electronic: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ɪˌlekˈtrɒnɪk/',
    cefr: 'B2',
    level: '实用输出词',
    value: 68,
    skills: { reading: 75, listening: 64, task1: 35, task2: 66, speaking: 68 },
    coreMeaning: '使用电子技术的；以电子形式保存或处理的。',
    definition: 'using electronic technology rather than paper or mechanical processes',
    register: '中性 / 正式',
    topics: ['科技', '商务', '通信', '公共服务'],
    patterns: ['electronic + noun', 'in electronic form', 'electronic rather than paper-based + noun'],
    collocations: [
      { phrase: 'electronic payment', meaning: '电子支付', use: '消费、金融、无现金社会' },
      { phrase: 'electronic records', meaning: '电子记录', use: '医疗、学校、行政' },
      { phrase: 'electronic device', meaning: '电子设备', use: '教育、日常科技' },
    ],
    distinctions: [
      {
        word: 'digital',
        difference: 'electronic 强调电子设备或系统；digital 更强调数字数据、在线形式和数字化处理。',
        rule: '谈设备、支付终端或电子档案可用 electronic；谈信息、平台或线上服务多用 digital。',
      },
    ],
    pitfalls: [
      { wrong: 'electronical devices', better: 'electronic devices', why: '标准形容词是 electronic，没有常用的 electronical。' },
    ],
    writingTip: '用它时说明具体对象，如 electronic records 或 electronic payment，不要泛泛说 electronic technology。',
    speakingTip: '可自然谈个人偏好：I prefer electronic tickets because they are easier to store。',
    recall: '“电子支付”怎么说？',
    answer: 'electronic payment',
    productionFrame: 'Electronic records can reduce administrative costs.',
  },
  eternal: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ɪˈtɜːnl/',
    cefr: 'B2',
    level: '理解优先词',
    value: 31,
    skills: { reading: 54, listening: 28, task1: 5, task2: 18, speaking: 25 },
    coreMeaning: '永恒的；或主观上似乎永无止境的。',
    definition: 'lasting forever, or seeming to last for a very long time',
    register: '文学性 / 正式',
    topics: ['文学', '时间', '宗教', '文化'],
    patterns: ['eternal + abstract noun', 'seem/feel eternal', 'an eternal question/problem'],
    collocations: [
      { phrase: 'eternal life', meaning: '永生', use: '宗教、文学文本' },
      { phrase: 'eternal truth', meaning: '永恒真理', use: '哲学、抽象讨论' },
      { phrase: 'eternal question', meaning: '永恒难题', use: '文化、思想类阅读' },
    ],
    distinctions: [
      { word: 'permanent', difference: 'permanent 指现实中长期或永久不变；eternal 带有“永远”、哲理或文学色彩。', rule: '制度、职位、建筑等实际事物通常用 permanent；哲学或修辞语境才用 eternal。' },
    ],
    pitfalls: [
      { wrong: 'an eternal solution', better: 'a permanent solution', why: '普通实际问题的长期解决方案通常用 permanent；eternal 过于文学化。' },
    ],
    writingTip: '不要把它当作 permanent 的“高级替换”；Task 2 通常无需使用。',
    speakingTip: '可用于轻松夸张：The wait felt eternal，但不宜用于严肃事实判断。',
    recall: '“等待似乎永无止境”怎么说？',
    answer: 'The wait felt eternal.',
    productionFrame: 'The wait felt eternal.',
  },
  effort: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈefət/',
    cefr: 'B1–B2',
    level: '核心输出词',
    value: 82,
    skills: { reading: 76, listening: 72, task1: 22, task2: 83, speaking: 82 },
    coreMeaning: '为实现目标投入的体力、脑力或尝试。',
    definition: 'physical or mental energy used to do something',
    register: '中性 / 正式',
    topics: ['教育', '工作', '政府', '健康'],
    patterns: ['make an effort to do sth', 'put effort into sth', 'a concerted effort to do sth'],
    collocations: [
      { phrase: 'make an effort', meaning: '作出努力', use: '学习、个人行为、政策' },
      { phrase: 'put effort into learning', meaning: '投入精力学习', use: '教育、个人经历' },
      { phrase: 'a concerted effort', meaning: '共同而集中的努力', use: '政府、社区、组织行动' },
    ],
    distinctions: [
      { word: 'attempt', difference: 'effort 强调投入的精力和持续付出；attempt 强调一次尝试或行动。', rule: '谈长期努力用 effort；谈某次试图完成某事用 attempt。' },
    ],
    pitfalls: [
      { wrong: 'do an effort', better: 'make an effort', why: '英语固定搭配是 make an effort。' },
    ],
    writingTip: 'concerted effort 适合多个主体共同采取行动的语境，不要用于单个人的普通努力。',
    speakingTip: '谈学习、运动或习惯改变时，It took a lot of effort 很自然。',
    recall: '“投入精力学习”怎么说？',
    answer: 'put effort into learning',
    productionFrame: 'A concerted effort is needed to X.',
  },
  physical: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈfɪzɪkl/',
    cefr: 'B2',
    level: '核心输出词',
    value: 76,
    skills: { reading: 78, listening: 65, task1: 38, task2: 76, speaking: 75 },
    coreMeaning: '与身体、实体物质或身体活动有关的。',
    definition: 'relating to the body, real objects, or physical activity',
    register: '中性 / 学术中性',
    topics: ['健康', '教育', '科技', '工作'],
    patterns: ['physical + noun', 'physical activity', 'physical and mental + noun'],
    collocations: [
      { phrase: 'physical activity', meaning: '身体活动', use: '健康、运动、教育' },
      { phrase: 'physical health', meaning: '身体健康', use: '医疗、生活方式' },
      { phrase: 'physical contact', meaning: '身体接触', use: '社交、儿童发展、疫情' },
    ],
    distinctions: [
      { word: 'mental', difference: 'physical 关乎身体、实体或运动；mental 关乎思想、心理和认知。', rule: '讨论身体健康、运动、伤害时用 physical；讨论压力、情绪、思维时用 mental。' },
    ],
    pitfalls: [
      { wrong: 'physical exercise activities', better: 'physical activity / exercise', why: 'exercise 本身已表示身体锻炼，和 physical activity 连用会显得重复。' },
    ],
    writingTip: '健康类论证可并列 physical and mental health，但要继续说明具体机制。',
    speakingTip: '谈日常习惯时，I need more physical activity 比笼统说 exercise 更灵活。',
    recall: '“身体活动”怎么说？',
    answer: 'physical activity',
    productionFrame: 'Regular physical activity can improve X.',
  },
  stamp: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/stæmp/',
    cefr: 'B1–B2',
    level: '情境输出词',
    value: 51,
    skills: { reading: 65, listening: 51, task1: 10, task2: 18, speaking: 57 },
    coreMeaning: '邮票；印章或盖上的标记；也可指盖章。',
    definition: 'a small piece of paper for posting mail, or a mark used to show approval',
    register: '中性',
    topics: ['邮政', '行政', '商务', '旅行'],
    patterns: ['put a stamp on + envelope', 'stamp + document + with + mark', 'be stamped with + date/logo'],
    collocations: [
      { phrase: 'postage stamp', meaning: '邮票', use: '邮寄、收藏、历史' },
      { phrase: 'official stamp', meaning: '官方印章', use: '文件、签证、行政' },
      { phrase: 'stamp a document', meaning: '在文件上盖章', use: '办公室、手续办理' },
    ],
    distinctions: [
      { word: 'seal', difference: 'stamp 指邮票或盖出的印记；seal 可指封口物，也可指正式印章或蜡封。', rule: '寄信用 stamp；文件需盖印或封缄时，按实际语境选择 stamp 或 seal。' },
    ],
    pitfalls: [
      { wrong: 'put a stamp in the envelope', better: 'put a stamp on the envelope', why: '邮票贴在信封表面，用 on。' },
    ],
    writingTip: '写作中只在邮政、官方文件等具体语境使用，不要随意套用抽象义。',
    speakingTip: '谈寄明信片或办理手续时可用：I put a stamp on the envelope。',
    recall: '“在信封上贴邮票”怎么说？',
    answer: 'put a stamp on an envelope',
    productionFrame: 'The document must bear an official stamp.',
  },
  ceremony: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈserəməni/',
    cefr: 'B2',
    level: '实用输出词',
    value: 61,
    skills: { reading: 68, listening: 65, task1: 14, task2: 54, speaking: 78 },
    coreMeaning: '为纪念或标志重要事件而举行的正式仪式。',
    definition: 'a formal event held to mark an important occasion',
    register: '中性 / 正式',
    topics: ['文化', '教育', '婚礼', '公共生活'],
    patterns: ['hold a ceremony', 'a ceremony to mark + noun', 'attend/take part in a ceremony'],
    collocations: [
      { phrase: 'opening ceremony', meaning: '开幕式', use: '体育、公共活动、学校' },
      { phrase: 'graduation ceremony', meaning: '毕业典礼', use: '教育、个人经历' },
      { phrase: 'wedding ceremony', meaning: '婚礼仪式', use: '家庭、文化比较' },
    ],
    distinctions: [
      { word: 'celebration', difference: 'ceremony 强调正式流程和仪式性；celebration 泛指庆祝活动，形式更自由。', rule: '有固定程序、致辞或传统礼节时用 ceremony；一般欢庆活动用 celebration。' },
    ],
    pitfalls: [
      { wrong: 'make a ceremony', better: 'hold a ceremony', why: '举办仪式通常搭配 hold。' },
    ],
    writingTip: '讨论文化传承时，说明仪式保存了什么价值或社会联系，而非只说 ceremonies are important。',
    speakingTip: 'Part 2 可用一场毕业或传统仪式作为具体故事，容易补充细节。',
    recall: '“毕业典礼”怎么说？',
    answer: 'graduation ceremony',
    productionFrame: 'The school held a ceremony to mark X.',
  },
  unique: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/juˈniːk/',
    cefr: 'B2',
    level: '核心输出词',
    value: 75,
    skills: { reading: 74, listening: 62, task1: 25, task2: 74, speaking: 80 },
    coreMeaning: '独一无二的；具有其他事物没有的独特特征。',
    definition: 'being the only one of its kind, or having distinctive qualities',
    register: '中性 / 正式',
    topics: ['文化', '旅游', '产品', '身份'],
    patterns: ['unique to + place/group', 'a unique + noun', 'be unique in + -ing'],
    collocations: [
      { phrase: 'unique feature', meaning: '独特特征', use: '地点、产品、制度' },
      { phrase: 'unique cultural heritage', meaning: '独特文化遗产', use: '文化、旅游、保护' },
      { phrase: 'unique opportunity', meaning: '难得的独特机会', use: '教育、职业、经历' },
    ],
    distinctions: [
      { word: 'special', difference: 'unique 强调独一无二或明显有别；special 强调重要、特别或有个人意义。', rule: '能说明某地或群体独有时用 unique to；只是“很特别”时用 special 更稳妥。' },
    ],
    pitfalls: [
      { wrong: 'very unique', better: 'unique / truly unique', why: '按严格语义，unique 已表示独一无二；IELTS 中避免 very unique 更安全。' },
    ],
    writingTip: '最好补充 unique to 哪个地区或群体，使“独特”成为可验证的具体描述。',
    speakingTip: '谈家乡时可说 a tradition unique to my hometown，避免泛泛说 very unique。',
    recall: '“某地独有的传统”怎么说？',
    answer: 'a tradition unique to a place',
    productionFrame: 'This tradition is unique to X.',
  },
  counterpart: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ˈkaʊntəpɑːt/',
    cefr: 'B2',
    level: '阅读优先，谨慎输出',
    value: 58,
    skills: { reading: 78, listening: 44, task1: 38, task2: 60, speaking: 47 },
    coreMeaning: '在另一国家、机构或群体中具有对应角色或功能的人或事物。',
    definition: 'a person or thing with the same role or function in another place or group',
    register: '正式 / 商务',
    topics: ['政府', '商务', '教育', '国际比较'],
    patterns: ['the counterpart of + noun', 'a counterpart in + country/sector', 'meet/talk to a counterpart'],
    collocations: [
      { phrase: 'foreign counterpart', meaning: '外国对应人员', use: '外交、商务、新闻' },
      { phrase: 'government counterpart', meaning: '政府对应官员或部门', use: '国际事务、政策' },
      { phrase: 'counterparts in other countries', meaning: '其他国家的对应对象', use: '跨国比较' },
    ],
    distinctions: [
      { word: 'equivalent', difference: 'counterpart 是另一场景中对应的人、职位或机构；equivalent 泛指价值、功能相等的事物。', rule: '对应的同职人员或部门用 counterpart；可替代的产品、资格或数值用 equivalent。' },
    ],
    pitfalls: [
      { wrong: 'my colleague counterpart', better: 'my counterpart / my counterpart at X', why: 'counterpart 本身已包含“对应同职者”的含义，不必再加 colleague。' },
    ],
    writingTip: '仅在两方确有平行角色时使用，不能把它当作任何“相似事物”的替换词。',
    speakingTip: '工作语境可说 my counterpart in another office，日常对话中通常不必刻意使用。',
    recall: '“另一国的政府对应官员”怎么说？',
    answer: 'a government counterpart in another country',
    productionFrame: 'Their counterparts in X face similar challenges.',
  },
  bother: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈbɒðə/',
    cefr: 'B1–B2',
    level: '口语核心词',
    value: 65,
    skills: { reading: 56, listening: 75, task1: 12, task2: 36, speaking: 85 },
    coreMeaning: '打扰、使烦恼；也可指费心去做某事。',
    definition: 'to annoy or worry someone, or to make the effort to do something',
    register: '非正式 / 中性',
    topics: ['日常生活', '工作', '服务', '人际'],
    patterns: ['bother + someone', 'bother to do sth', 'not bother with + noun'],
    collocations: [
      { phrase: 'bother someone', meaning: '打扰或烦扰某人', use: '礼貌表达、人际互动' },
      { phrase: 'bother to do something', meaning: '费心去做某事', use: '日常评价、习惯' },
      { phrase: 'not bother with something', meaning: '懒得理会或处理某事', use: '口语、个人偏好' },
    ],
    distinctions: [
      { word: 'disturb', difference: 'bother 指烦扰、不便或费心；disturb 更强调打断活动、睡眠或安宁。', rule: '打断睡觉、会议或工作时用 disturb；一般麻烦某人或懒得做时用 bother。' },
    ],
    pitfalls: [
      { wrong: 'I do not bother it', better: 'It does not bother me / I do not bother with it', why: 'bother 通常需要受影响的人作宾语；表示“不想处理”要用 bother with。' },
    ],
    writingTip: 'Task 2 中它偏口语且含义模糊；正式论证可改用 inconvenience、concern 或 discourage。',
    speakingTip: 'Sorry to bother you… 是自然的礼貌开场；I do not bother with… 可描述个人习惯。',
    recall: '“懒得做某事”怎么说？',
    answer: 'not bother to do something',
    productionFrame: 'I do not usually bother to X.',
  },
  thrive: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/θraɪv/',
    cefr: 'C1',
    level: '高价值输出词',
    value: 78,
    skills: { reading: 72, listening: 51, task1: 24, task2: 83, speaking: 65 },
    coreMeaning: '在有利条件下茁壮成长、蓬勃发展或非常成功。',
    definition: 'to grow, develop, or be successful, especially under favourable conditions',
    register: '中性 / 正式',
    topics: ['经济', '教育', '商业', '社区'],
    patterns: ['thrive in + environment', 'thrive on + noun', 'help + noun + thrive'],
    collocations: [
      { phrase: 'local businesses thrive', meaning: '本地企业蓬勃发展', use: '经济、社区、旅游' },
      { phrase: 'thrive in a supportive environment', meaning: '在支持性环境中成长良好', use: '教育、儿童发展、职场' },
      { phrase: 'thrive on competition', meaning: '在竞争中如鱼得水', use: '商业、个人特质' },
    ],
    distinctions: [
      { word: 'survive', difference: 'survive 指在困难中继续存在；thrive 指不仅存在，而且发展得很好。', rule: '强调勉强维持用 survive；强调积极成长、成功或繁荣用 thrive。' },
    ],
    pitfalls: [
      { wrong: 'thrive with competition', better: 'thrive in a competitive environment / thrive on competition', why: '常用搭配是 thrive in + 环境，或 thrive on + 促成因素。' },
    ],
    writingTip: '用它时明确谁在什么条件下 thriving，如 small businesses 或 children，避免空泛。',
    speakingTip: 'I thrive in a structured environment 是自然且有个性的 Part 3 表达。',
    recall: '“在支持性环境中茁壮成长”怎么说？',
    answer: 'thrive in a supportive environment',
    productionFrame: 'Small businesses can thrive when X.',
  },
  tradition: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/trəˈdɪʃn/',
    cefr: 'B1–B2',
    level: '核心输出词',
    value: 80,
    skills: { reading: 80, listening: 69, task1: 16, task2: 82, speaking: 86 },
    coreMeaning: '代代相传的习俗、信念或做法。',
    definition: 'a custom or belief passed from one generation to another',
    register: '中性 / 学术中性',
    topics: ['文化', '家庭', '教育', '旅游'],
    patterns: ['a tradition of + -ing', 'pass down a tradition', 'preserve/maintain a tradition'],
    collocations: [
      { phrase: 'family tradition', meaning: '家庭传统', use: '口语个人经历、家庭话题' },
      { phrase: 'long-standing tradition', meaning: '由来已久的传统', use: '文化、历史、社会' },
      { phrase: 'preserve a tradition', meaning: '保留传统', use: '文化保护、全球化' },
    ],
    distinctions: [
      { word: 'custom', difference: 'tradition 更强调长期传承和文化历史；custom 可指当地、职业或个人的惯常做法。', rule: '涉及世代传承和文化遗产时用 tradition；谈礼仪或普通习惯时可用 custom。' },
    ],
    pitfalls: [
      { wrong: 'a tradition to celebrate the festival', better: 'a tradition of celebrating the festival', why: '描述反复进行的传统活动时，tradition 后通常接 of + -ing。' },
    ],
    writingTip: '不要只说 traditions are important；说明它维系身份、家庭联系或文化记忆的方式。',
    speakingTip: 'Part 2 中用一个家庭传统展开时间、人物和感受，内容会更具体。',
    recall: '“传承家庭传统”怎么说？',
    answer: 'pass down a family tradition',
    productionFrame: 'Many families preserve the tradition of doing X.',
  },
  advertisement: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ədˈvɜːtɪsmənt/',
    cefr: 'B1–B2',
    level: '核心输出词',
    value: 77,
    skills: { reading: 75, listening: 70, task1: 16, task2: 80, speaking: 68 },
    coreMeaning: '用于推广产品、服务或理念的广告。',
    definition: 'a notice, picture, or short film used to promote a product, service, or idea',
    register: '中性 / 正式',
    topics: ['消费', '媒体', '儿童', '商业'],
    patterns: ['an advertisement for + product', 'place/run an advertisement', 'be exposed to advertisements'],
    collocations: [
      { phrase: 'online advertisement', meaning: '网络广告', use: '社交媒体、数字营销' },
      { phrase: 'television advertisement', meaning: '电视广告', use: '媒体、儿童、消费' },
      { phrase: 'misleading advertisement', meaning: '误导性广告', use: '消费者保护、监管' },
    ],
    distinctions: [
      { word: 'commercial', difference: 'advertisement 泛指各种媒介的广告；commercial 常特指电视或广播广告，也可作“商业的”形容词。', rule: '正式写作谈整体广告现象用 advertisement 或 advertising；电视短片可用 commercial。' },
    ],
    pitfalls: [
      { wrong: 'many advertisings', better: 'many advertisements / a great deal of advertising', why: 'advertisement 是可数名词；advertising 是不可数名词，指广告活动或行业。' },
    ],
    writingTip: '讨论广告影响时分清 individual advertisements 与 advertising as an industry。',
    speakingTip: '日常口语中 ad 更自然；正式说明广告类型时再用 advertisement。',
    recall: '“针对儿童的网络广告”怎么说？',
    answer: 'online advertisements aimed at children',
    productionFrame: 'Children are exposed to advertisements for X.',
  },
  intend: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ɪnˈtend/',
    cefr: 'B2',
    level: '实用输出词',
    value: 66,
    skills: { reading: 73, listening: 60, task1: 22, task2: 72, speaking: 72 },
    coreMeaning: '打算做某事；以某人或某目的为目标。',
    definition: 'to have a plan or purpose to do something',
    register: '中性 / 正式',
    topics: ['教育', '职业', '政策', '计划'],
    patterns: ['intend to do sth', 'intend + noun + for + noun', 'be intended to do sth'],
    collocations: [
      { phrase: 'intend to apply for a course', meaning: '打算申请课程', use: '教育、个人计划' },
      { phrase: 'be intended for children', meaning: '旨在供儿童使用', use: '产品、政策、服务' },
      { phrase: 'originally intended to', meaning: '原本打算', use: '计划变化、项目介绍' },
    ],
    distinctions: [
      { word: 'plan', difference: 'intend 强调意图或目的，未必有详细安排；plan 更强调已考虑步骤或安排。', rule: '只有目标或打算时用 intend；已有时间、步骤或安排时用 plan。' },
    ],
    pitfalls: [
      { wrong: 'intend doing something', better: 'intend to do something', why: '表达自己的打算时，intend 后最稳妥的结构是 to + 动词原形。' },
    ],
    writingTip: '政策 is intended to… 表示预期目标，不等于已经证明实际效果。',
    speakingTip: '个人计划中 I intend to… 稍正式；轻松对话里 I am planning to… 更自然。',
    recall: '“该政策旨在减少污染”怎么说？',
    answer: 'The policy is intended to reduce pollution.',
    productionFrame: 'The policy is intended to reduce X.',
  },
  administrative: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ədˈmɪnɪstrətɪv/',
    cefr: 'B2–C1',
    level: '阅读 / Task 2 词',
    value: 64,
    skills: { reading: 77, listening: 45, task1: 37, task2: 69, speaking: 42 },
    coreMeaning: '与组织、机构或政府的日常行政管理有关的。',
    definition: 'relating to the management and organization of a business, institution, or government',
    register: '正式 / 学术',
    topics: ['政府', '教育', '工作', '公共服务'],
    patterns: ['administrative + noun', 'administrative duties', 'reduce administrative costs'],
    collocations: [
      { phrase: 'administrative costs', meaning: '行政成本', use: '政府、企业、数字化' },
      { phrase: 'administrative staff', meaning: '行政人员', use: '学校、公司、医院' },
      { phrase: 'administrative burden', meaning: '行政负担', use: '政策、公共服务、合规' },
    ],
    distinctions: [
      { word: 'managerial', difference: 'administrative 偏手续、记录、组织和支持工作；managerial 偏领导、决策和管理职责。', rule: '谈文书、流程、后台支持时用 administrative；谈领导团队和决策时用 managerial。' },
    ],
    pitfalls: [
      { wrong: 'administrative works', better: 'administrative work / administrative tasks', why: 'work 表示工作内容时通常不可数；具体事项可用 tasks。' },
    ],
    writingTip: '适合讨论电子系统如何减少 paperwork、成本或负担；最好说明减少的是哪类流程。',
    speakingTip: '描述职位时可说 administrative tasks，但日常对话不必强行使用正式词。',
    recall: '“减少行政成本”怎么说？',
    answer: 'reduce administrative costs',
    productionFrame: 'Digital systems can reduce administrative costs.',
  },
  client: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈklaɪənt/',
    cefr: 'B2',
    level: '实用输出词',
    value: 68,
    skills: { reading: 70, listening: 57, task1: 18, task2: 63, speaking: 65 },
    coreMeaning: '接受专业服务或长期业务服务的个人或机构客户。',
    definition: 'a person or organization that uses the services of a professional or business',
    register: '商务 / 正式',
    topics: ['商业', '法律', '医疗', '服务'],
    patterns: ['a client of + company', 'provide services to clients', 'meet client needs'],
    collocations: [
      { phrase: 'client needs', meaning: '客户需求', use: '服务、设计、咨询' },
      { phrase: 'client satisfaction', meaning: '客户满意度', use: '商业、服务质量' },
      { phrase: 'client requirements', meaning: '客户要求', use: '项目、专业服务' },
    ],
    distinctions: [
      { word: 'customer', difference: 'customer 通常购买商品或一般服务；client 通常接受专业、持续或定制化服务。', rule: '律师、设计师、顾问、代理机构服务的对象用 client；商店、餐馆的消费者用 customer。' },
    ],
    pitfalls: [
      { wrong: 'a client in a retail shop', better: 'a customer in a retail shop', why: '普通零售购物者通常称 customer，不称 client。' },
    ],
    writingTip: '使用 client satisfaction 前确认语境是专业或持续服务关系，而非普通零售。',
    speakingTip: '谈工作可用 clients；谈日常购物、咖啡店或超市时多用 customers。',
    recall: '“满足客户需求”怎么说？',
    answer: 'meet client needs',
    productionFrame: 'The firm aims to meet client needs.',
  },
  composition: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ˌkɒmpəˈzɪʃn/',
    cefr: 'B2',
    level: '理解优先词（Task 1 扩展）',
    value: 47,
    skills: { reading: 77, listening: 40, task1: 48, task2: 35, speaking: 32 },
    coreMeaning: '构成、组成方式；也可指音乐或书面作品。',
    definition: 'the way in which something is formed or arranged from its parts',
    register: '学术 / 正式',
    topics: ['科学', '数据', '艺术', '人口'],
    patterns: ['the composition of + noun', 'changes in the composition of + group', 'a musical composition'],
    collocations: [
      { phrase: 'chemical composition', meaning: '化学成分', use: '科学、材料、环境' },
      { phrase: 'age composition of the population', meaning: '人口年龄构成', use: 'Task 1、人口研究' },
      { phrase: 'musical composition', meaning: '音乐作品', use: '艺术、教育、阅读' },
    ],
    distinctions: [
      { word: 'structure', difference: 'composition 强调由哪些成分及比例构成；structure 强调这些部分如何组织和相互连接。', rule: '谈材料、成分或人口构成时用 composition；谈布局、层级或安排时用 structure。' },
    ],
    pitfalls: [
      { wrong: 'the composition is composed by several elements', better: 'the composition consists of several elements / X is composed of several elements', why: 'composed by 通常表示“由某人创作”；表示构成要用 composed of 或 consists of。' },
    ],
    writingTip: 'Task 1 中可用于较正式地概括构成，如 the age composition of the population。',
    speakingTip: '口语里优先理解“构成”和“音乐作品”两义；除艺术话题外不必强行产出。',
    recall: '“人口年龄构成”怎么说？',
    answer: 'the age composition of the population',
    productionFrame: 'The age composition of the population changed over time.',
  },
  status: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈsteɪtəs/',
    cefr: 'B2',
    level: '实用输出词',
    value: 67,
    skills: { reading: 73, listening: 58, task1: 36, task2: 70, speaking: 62 },
    coreMeaning: '社会或职业地位；某事当前的状况、进展或法律身份。',
    definition: 'the social or professional position of someone or the current condition of something',
    register: '中性 / 正式',
    topics: ['社会', '工作', '科技', '公共服务'],
    patterns: ['the status of + noun', 'have/hold + status', 'status as + noun'],
    collocations: [
      { phrase: 'social status', meaning: '社会地位', use: '不平等、职业、消费' },
      { phrase: 'current status', meaning: '当前状态', use: '申请、项目、系统' },
      { phrase: 'legal status', meaning: '法律地位', use: '移民、权利、政策' },
    ],
    distinctions: [
      { word: 'state', difference: 'status 常指社会地位、官方身份或项目进度；state 泛指某人或某物的整体状态。', rule: '谈法律身份、社会地位、订单或申请进度时用 status；谈一般情况或状态时多用 state。' },
    ],
    pitfalls: [
      { wrong: 'the status of the project is completed', better: 'the project is complete / the project has been completed', why: 'status 描述当前状况；completed 更适合描述项目已被完成这一动作或结果。' },
    ],
    writingTip: '不要单独说 status；尽量指出是 social、legal 还是 current status。',
    speakingTip: '查订单或申请时可说 check the status of an application，非常自然。',
    recall: '“法律地位”怎么说？',
    answer: 'legal status',
    productionFrame: 'The legal status of X remains unclear.',
  },
  conversation: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˌkɒnvəˈseɪʃn/',
    cefr: 'B1–B2',
    level: '口语核心词',
    value: 69,
    skills: { reading: 61, listening: 76, task1: 12, task2: 40, speaking: 90 },
    coreMeaning: '两人或多人之间交换想法和信息的交谈。',
    definition: 'a talk between two or more people in which ideas and information are exchanged',
    register: '中性',
    topics: ['人际', '工作', '教育', '科技'],
    patterns: ['have a conversation with + person', 'a conversation about + topic', 'start/keep up a conversation'],
    collocations: [
      { phrase: 'have a conversation', meaning: '进行交谈', use: '日常、工作、人际' },
      { phrase: 'meaningful conversation', meaning: '有意义的交谈', use: '人际关系、科技影响' },
      { phrase: 'strike up a conversation', meaning: '主动攀谈', use: '陌生人、旅行、社交' },
    ],
    distinctions: [
      { word: 'discussion', difference: 'conversation 是较随意的交谈；discussion 更聚焦某议题、分析或决定。', rule: '闲聊和人际互动用 conversation；解决问题或正式讨论用 discussion。' },
    ],
    pitfalls: [
      { wrong: 'make a conversation', better: 'have a conversation / start a conversation', why: 'conversation 常与 have、start、strike up 搭配，不用 make。' },
    ],
    writingTip: 'Task 2 中若强调正式公共交流，discussion 或 dialogue 往往比 conversation 更准确。',
    speakingTip: '用 strike up a conversation 描述旅行或社交经历，比 start talking 更生动。',
    recall: '“与陌生人攀谈”怎么说？',
    answer: 'strike up a conversation with a stranger',
    productionFrame: 'I often strike up a conversation with X.',
  },
  swap: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/swɒp/',
    cefr: 'B1–B2',
    level: '口语实用词',
    value: 55,
    skills: { reading: 57, listening: 66, task1: 12, task2: 28, speaking: 75 },
    coreMeaning: '交换两样东西；用一个事物替换另一个。',
    definition: 'to exchange one thing for another, or replace one thing with another',
    register: '非正式 / 中性',
    topics: ['消费', '日常生活', '环保', '工作'],
    patterns: ['swap A for B', 'swap A with B', 'swap seats/clothes'],
    collocations: [
      { phrase: 'swap seats', meaning: '交换座位', use: '旅行、日常礼貌表达' },
      { phrase: 'swap clothes', meaning: '交换衣物', use: '消费、循环利用、朋友间' },
      { phrase: 'swap A for B', meaning: '用 A 换成 B', use: '习惯、选择、环保' },
    ],
    distinctions: [
      { word: 'exchange', difference: 'swap 较口语，常指直接互换或替换；exchange 更正式，也可用于信息、货币和国际交流。', rule: '日常换座位、换衣物或换选择用 swap；正式系统或抽象交流多用 exchange。' },
    ],
    pitfalls: [
      { wrong: 'swap A to B', better: 'swap A for B', why: '表示用 A 换取或替代 B 时，常用介词 for。' },
    ],
    writingTip: '正式 Task 2 中谈替代方案时通常用 replace 或 exchange；swap 更适合具体例子。',
    speakingTip: 'Could we swap seats? 是非常自然的旅行和日常表达。',
    recall: '“把纸质票换成电子票”怎么说？',
    answer: 'swap paper tickets for electronic tickets',
    productionFrame: 'Many people have swapped X for Y.',
  },
  remind: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/rɪˈmaɪnd/',
    cefr: 'B1–B2',
    level: '核心输出词',
    value: 75,
    skills: { reading: 65, listening: 75, task1: 12, task2: 54, speaking: 84 },
    coreMeaning: '提醒某人做事；使某人想起某人或某物。',
    definition: 'to make someone remember something or think of a similar person or thing',
    register: '中性',
    topics: ['日常生活', '教育', '工作', '科技'],
    patterns: ['remind + person + to do sth', 'remind + person + that + clause', 'remind + person + of + noun'],
    collocations: [
      { phrase: 'remind someone to do something', meaning: '提醒某人做某事', use: '计划、责任、日常安排' },
      { phrase: 'remind someone of an appointment', meaning: '提醒某人预约或约会', use: '工作、医疗、日程' },
      { phrase: 'remind someone that + clause', meaning: '提醒某人某事', use: '说明、通知、规则' },
    ],
    distinctions: [
      { word: 'remember', difference: 'remember 表示自己想起或记得；remind 表示外部的人、事物或系统促使某人想起。', rule: '自己回忆用 remember；请别人或系统发出提示用 remind。' },
    ],
    pitfalls: [
      { wrong: 'remind me to the meeting', better: 'remind me about the meeting / remind me to attend the meeting', why: 'remind 后接名词时用 about/of；接动作时用 to + 动词原形。' },
    ],
    writingTip: '科技话题中写 apps can remind users to… 时，要写清提醒的具体行为。',
    speakingTip: 'Please remind me to… 是实用的日常表达，也可用来谈自己容易忘事。',
    recall: '“提醒我明天打电话”怎么说？',
    answer: 'remind me to call tomorrow',
    productionFrame: 'Please remind me to X.',
  },
  valuable: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈvæljuəbl/',
    cefr: 'B2',
    level: '核心输出词',
    value: 76,
    skills: { reading: 72, listening: 61, task1: 26, task2: 78, speaking: 78 },
    coreMeaning: '有金钱价值的；或非常有用、重要、值得珍视的。',
    definition: 'worth a lot of money or very useful or important',
    register: '中性 / 正式',
    topics: ['教育', '工作', '科技', '资源'],
    patterns: ['valuable + noun', 'valuable for + noun/-ing', 'find/consider + noun + valuable'],
    collocations: [
      { phrase: 'valuable experience', meaning: '宝贵经验', use: '教育、工作、个人成长' },
      { phrase: 'valuable resource', meaning: '宝贵资源', use: '教育、环境、公共服务' },
      { phrase: 'valuable information', meaning: '有价值的信息', use: '研究、科技、决策' },
    ],
    distinctions: [
      { word: 'useful', difference: 'useful 强调实际用途；valuable 强调重要价值、显著益处或金钱价值。', rule: '普通实用功能用 useful；经验、信息、资源或昂贵物品的显著价值用 valuable。' },
    ],
    pitfalls: [
      { wrong: 'valuable to do something', better: 'valuable for doing something / valuable to someone', why: 'valuable 后谈用途常接 for + -ing；谈受益对象可接 to + 人。' },
    ],
    writingTip: '不要空泛地说 valuable；说明它提供了什么信息、技能或长期益处。',
    speakingTip: '谈实习、旅行或建议时，valuable experience 和 valuable advice 都很自然。',
    recall: '“宝贵的工作经验”怎么说？',
    answer: 'valuable work experience',
    productionFrame: 'X provides valuable information about Y.',
  },
};

Object.assign(curatedOverrides, {
  complex: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈkɒmpleks/',
    cefr: 'B2',
    level: '核心输出词',
    value: 86,
    skills: { reading: 90, listening: 76, task1: 70, task2: 88, speaking: 76 },
    coreMeaning: '复杂的；由多个相互关联部分构成，因而不易理解或处理。',
    definition: 'having many connected parts and therefore difficult to understand or deal with',
    register: '中性 / 学术',
    topics: ['教育', '科技', '社会问题'],
    patterns: ['a complex + noun', 'be too complex for + noun', 'a complex relationship between A and B'],
    collocations: [
      { phrase: 'a complex issue', meaning: '复杂议题', use: 'Task 2 论证' },
      { phrase: 'a complex system', meaning: '复杂系统', use: '科技、社会' },
      { phrase: 'a complex relationship between A and B', meaning: 'A 与 B 的复杂关系', use: '研究分析' },
    ],
    distinctions: [
      { word: 'complicated', difference: 'complex 强调多部分彼此关联；complicated 只强调难懂或难操作。', rule: '系统、关系、过程常用 complex；说明或任务难处理可用 complicated。' },
    ],
    pitfalls: [
      { wrong: 'a complexity problem', better: 'a complex problem', why: 'complexity 是名词；修饰 problem 要用形容词 complex。' },
    ],
    writingTip: '不要只贴上 complex 标签；接着说明涉及哪些因素，论证才完整。',
    speakingTip: '可用 because 补原因：It is complex because it involves several groups.',
    recall: '“复杂的社会问题”怎么说？',
    answer: 'a complex social issue',
    productionFrame: 'X is a complex issue because it involves Y.',
  },
  opposite: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈɒpəzɪt/',
    cefr: 'B1',
    level: '高频基础词',
    value: 70,
    skills: { reading: 86, listening: 76, task1: 58, task2: 67, speaking: 72 },
    coreMeaning: '相反的；相对立的一方或结果。',
    definition: 'completely different from something, or a thing that is completely different',
    register: '中性',
    topics: ['比较', '教育', '社会'],
    patterns: ['the opposite of + noun / -ing', 'be opposite to + noun', 'have the opposite effect'],
    collocations: [
      { phrase: 'the exact opposite', meaning: '恰恰相反', use: '比较、反驳' },
      { phrase: 'the opposite direction', meaning: '相反方向', use: '位置、趋势' },
      { phrase: 'the opposite effect', meaning: '相反效果', use: 'Task 2 因果' },
    ],
    distinctions: [
      { word: 'different', difference: 'different 只表示不同；opposite 表示处在直接相反的两端。', rule: 'increase 与 decrease 这类反向概念用 opposite，不要泛用 different。' },
    ],
    pitfalls: [
      { wrong: 'the opposite with my view', better: 'the opposite of my view / an opposite view', why: 'opposite 常接 of 表示“……的对立面”，或接 to 表示“与……相反”。' },
    ],
    writingTip: '用于比较政策结果时，the opposite effect 比 very different 更精确。',
    speakingTip: '日常回答中 the exact opposite 是自然的强调表达。',
    recall: '“产生相反效果”怎么说？',
    answer: 'have the opposite effect',
    productionFrame: 'This policy may have the opposite effect: Y.',
  },
  however: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/haʊˈevə(r)/',
    cefr: 'B1',
    level: '核心连接词',
    value: 88,
    skills: { reading: 90, listening: 74, task1: 84, task2: 96, speaking: 63 },
    coreMeaning: '然而；引出与前文形成对比或限制的完整观点。',
    definition: 'despite this; used to introduce a statement that contrasts with what was said before',
    register: '正式 / 书面',
    topics: ['议论文', '图表', '比较'],
    patterns: ['However, + independent clause', 'independent clause; however, + independent clause'],
    collocations: [
      { phrase: 'however, this does not mean that ...', meaning: '然而，这并不意味着……', use: '反驳、让步' },
      { phrase: 'however, it should be noted that ...', meaning: '不过，应注意……', use: '限定观点' },
      { phrase: 'however, there are limitations', meaning: '不过，仍有限制', use: '评价方案' },
    ],
    distinctions: [
      { word: 'but', difference: 'but 是并列连词，直接连接成分或分句；however 是连接副词，通常连接两个完整句。', rule: '不要把 But however 连用；用其中一个即可。' },
    ],
    pitfalls: [
      { wrong: 'But however, this is expensive.', better: 'However, this is expensive. / But this is expensive.', why: '两者都表达转折，叠加会重复且不自然。' },
    ],
    writingTip: '每次转折都要有明确逻辑：先承认一点，再说明限制或反面结果。',
    speakingTip: '口语里 but 更自然；however 适合较审慎、结构化的 Part 3 回答。',
    recall: '改错：But however, public transport is costly.',
    answer: 'However, public transport is costly.',
    productionFrame: 'X has clear benefits. However, it can also Y.',
  },
  multinational: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˌmʌltiˈnæʃənəl/',
    cefr: 'B2',
    level: '进阶输出词',
    value: 76,
    skills: { reading: 83, listening: 63, task1: 45, task2: 84, speaking: 66 },
    coreMeaning: '跨国的；在多个国家运营或由多个国籍的人构成的。',
    definition: 'involving or operating in several different countries',
    register: '正式 / 商业',
    topics: ['全球化', '商业', '就业'],
    patterns: ['a multinational + company / corporation', 'a multinational operating in + place', 'work for a multinational'],
    collocations: [
      { phrase: 'a multinational corporation', meaning: '跨国公司', use: '全球化、商业' },
      { phrase: 'multinational operations', meaning: '跨国运营', use: '企业话题' },
      { phrase: 'a multinational workforce', meaning: '多国籍劳动力', use: '职场、迁移' },
    ],
    distinctions: [
      { word: 'international', difference: 'international 泛指国际间的；multinational 特别指企业或团队跨多个国家开展活动。', rule: '说明公司在多国有业务时用 multinational company。' },
    ],
    pitfalls: [
      { wrong: 'A multinational companies can ...', better: 'Multinational companies can ... / A multinational company can ...', why: 'multinational 不改变名词的单复数；冠词和名词形式仍须一致。' },
    ],
    writingTip: '讨论跨国公司时，补充就业、税收或本地企业竞争等具体影响。',
    speakingTip: '谈职业规划可说 work for a multinational company，但要给出原因。',
    recall: '“跨国公司创造就业”怎么说？',
    answer: 'Multinational companies create jobs.',
    productionFrame: 'Multinational companies can create jobs, but may also Y.',
  },
  prohibit: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/prəˈhɪbɪt/',
    cefr: 'B2',
    level: '核心输出词',
    value: 86,
    skills: { reading: 84, listening: 65, task1: 42, task2: 93, speaking: 62 },
    coreMeaning: '禁止；通过法律、规定或权威命令阻止某事发生。',
    definition: 'to officially prevent something from being done, especially by law',
    register: '正式 / 法规',
    topics: ['法律', '公共健康', '环境'],
    patterns: ['prohibit + noun / -ing', 'prohibit sb from + -ing', 'be prohibited by law'],
    collocations: [
      { phrase: 'prohibit smoking in public places', meaning: '禁止在公共场所吸烟', use: '健康政策' },
      { phrase: 'prohibit the sale of X', meaning: '禁止销售 X', use: '监管、消费' },
      { phrase: 'be strictly prohibited', meaning: '被严格禁止', use: '规则、法规' },
    ],
    distinctions: [
      { word: 'ban', difference: 'ban 可作名词或动词；prohibit 是更正式的动词，常见于法律和规章。', rule: '用名词说 a ban on X；用动词说 prohibit X / prohibit doing X。' },
    ],
    pitfalls: [
      { wrong: 'prohibit people to smoke', better: 'prohibit people from smoking', why: 'prohibit 后接人时使用 from + -ing。' },
    ],
    writingTip: '主张禁止前，说明对象、场景和执法可行性，避免泛泛而谈。',
    speakingTip: 'Part 3 可说 smoking should be prohibited in enclosed public spaces。',
    recall: '“禁止人们酒后驾车”怎么说？',
    answer: 'prohibit people from driving after drinking',
    productionFrame: 'Authorities could prohibit X in Y to reduce Z.',
  },
  spouse: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/spaʊs/',
    cefr: 'B2',
    level: '理解优先词',
    value: 61,
    skills: { reading: 80, listening: 62, task1: 48, task2: 55, speaking: 48 },
    coreMeaning: '配偶；已婚者的丈夫或妻子，性别中性且较正式。',
    definition: 'a husband or wife',
    register: '正式 / 法律 / 调查',
    topics: ['家庭', '法律', '人口'],
    patterns: ['a spouse’s + noun', 'husband or wife / spouse', 'a former / surviving spouse'],
    collocations: [
      { phrase: 'a spouse’s income', meaning: '配偶收入', use: '家庭、调查' },
      { phrase: 'a former spouse', meaning: '前配偶', use: '婚姻、法律' },
      { phrase: 'a surviving spouse', meaning: '在世配偶', use: '法律、保险' },
    ],
    distinctions: [
      { word: 'partner', difference: 'spouse 明确指法律婚姻中的配偶；partner 可指未婚伴侣，也可指商业伙伴。', rule: '只有婚姻身份相关时才用 spouse。' },
    ],
    pitfalls: [
      { wrong: 'my spouse are ...', better: 'my spouse is ...', why: 'spouse 是单数可数名词；复数才是 spouses。' },
    ],
    writingTip: '主要作为法律、人口或问卷语境的理解词；普通家庭话题不必刻意替换 husband 或 wife。',
    speakingTip: '谈个人生活时 husband、wife 或 partner 往往更自然。',
    recall: '“配偶收入”怎么说？',
    answer: 'a spouse’s income',
    productionFrame: 'The form asks about a respondent’s spouse and household income.',
  },
  issue: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈɪʃuː/',
    cefr: 'B2',
    level: '多义核心词',
    value: 89,
    skills: { reading: 90, listening: 78, task1: 58, task2: 96, speaking: 83 },
    coreMeaning: '问题、议题；IELTS 中常指值得讨论或需要处理的公共问题。',
    definition: 'an important subject or problem for discussion',
    register: '中性 / 正式',
    topics: ['社会', '住房', '公共健康'],
    patterns: ['the issue of + noun / -ing', 'an issue with + noun', 'address an issue'],
    collocations: [
      { phrase: 'a pressing issue', meaning: '紧迫问题', use: 'Task 2 开头' },
      { phrase: 'address the issue', meaning: '处理该问题', use: '政策、对策' },
      { phrase: 'the issue of housing affordability', meaning: '住房负担能力问题', use: '城市、社会' },
    ],
    distinctions: [
      { word: 'problem', difference: 'issue 可指中性的讨论议题，也可指问题；problem 更明确表示负面困难。', rule: '讨论争议或公共议题用 issue；强调损害和待解决困难用 problem。' },
    ],
    pitfalls: [
      { wrong: 'discuss about this issue', better: 'discuss this issue', why: 'discuss 是及物动词，后面不加 about。' },
    ],
    writingTip: '提出 issue 后立刻明确其成因、影响或立场，避免空泛重复。',
    speakingTip: 'There is an issue with ... 是自然的口语问题说明框架。',
    recall: '“处理一个紧迫问题”怎么说？',
    answer: 'address a pressing issue',
    productionFrame: 'One pressing issue is that X.',
  },
  formal: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈfɔːməl/',
    cefr: 'B2',
    level: '核心输出词',
    value: 77,
    skills: { reading: 76, listening: 66, task1: 63, task2: 81, speaking: 74 },
    coreMeaning: '正式的；符合严肃、职业或制度化场合规范的。',
    definition: 'suitable for serious or official occasions',
    register: '中性 / 正式',
    topics: ['教育', '职场', '沟通'],
    patterns: ['formal + noun', 'in a formal manner', 'be more formal than + noun'],
    collocations: [
      { phrase: 'formal education', meaning: '正规教育', use: '教育话题' },
      { phrase: 'formal training', meaning: '正式培训', use: '就业、技能' },
      { phrase: 'a formal agreement', meaning: '正式协议', use: '商业、法律' },
    ],
    distinctions: [
      { word: 'official', difference: 'official 强调由政府或权威机构认可；formal 强调场合、风格或程序的正式性。', rule: '服装、语言、场合常用 formal；政府声明常用 official。' },
    ],
    pitfalls: [
      { wrong: 'speak formal', better: 'speak formally / use formal language', why: 'formal 是形容词；修饰 speak 要用副词 formally。' },
    ],
    writingTip: '正式写作不等于生僻：优先做到清晰、准确，并避免过多口语缩略形式。',
    speakingTip: '描述活动、服装或沟通风格时，formal 是很自然的词。',
    recall: '“正规教育”怎么说？',
    answer: 'formal education',
    productionFrame: 'Formal education should be complemented by practical experience.',
  },
  plastic: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈplæstɪk/',
    cefr: 'B1',
    level: '核心输出词',
    value: 72,
    skills: { reading: 79, listening: 73, task1: 52, task2: 83, speaking: 78 },
    coreMeaning: '塑料；一种人工合成材料，常用于环境和消费议题。',
    definition: 'a light, strong artificial material that can be made into many different shapes',
    register: '中性',
    topics: ['环境', '消费', '城市生活'],
    patterns: ['plastic + noun', 'be made of plastic', 'reduce the use of plastic'],
    collocations: [
      { phrase: 'single-use plastic', meaning: '一次性塑料制品', use: '环境政策' },
      { phrase: 'plastic waste', meaning: '塑料废弃物', use: '污染、回收' },
      { phrase: 'recycle plastic', meaning: '回收塑料', use: '日常环保' },
    ],
    distinctions: [
      { word: 'plastics', difference: 'plastic 通常是不可数材料；plastics 可指不同种类的塑料或塑料制品。', rule: '泛指材料用 plastic；强调类别或制品时才考虑 plastics。' },
    ],
    pitfalls: [
      { wrong: 'many plastic', better: 'much plastic / many plastic items', why: 'plastic 作材料时通常不可数；可数的是 plastic items 或 bottles。' },
    ],
    writingTip: '环境题中把问题和措施连起来：reduce single-use plastic 并改善收集与回收。',
    speakingTip: '可从自己的购物习惯举例，避免只喊环保口号。',
    recall: '“减少一次性塑料”怎么说？',
    answer: 'reduce single-use plastic',
    productionFrame: 'Reducing single-use plastic would cut X.',
  },
  survey: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈsɜːveɪ/ n.; /səˈveɪ/ v.',
    cefr: 'B2',
    level: 'Task 1 实用词',
    value: 85,
    skills: { reading: 87, listening: 68, task1: 91, task2: 77, speaking: 65 },
    coreMeaning: '调查、问卷研究；也可作动词表示调查或审视。',
    definition: 'a set of questions or an investigation used to collect information about people or opinions',
    register: '中性 / 研究',
    topics: ['研究', '教育', '消费'],
    patterns: ['conduct a survey of / on + noun', 'a survey of + group', 'be surveyed about + topic'],
    collocations: [
      { phrase: 'conduct a survey', meaning: '开展调查', use: '研究、报告' },
      { phrase: 'a nationwide survey', meaning: '全国性调查', use: '社会议题' },
      { phrase: 'survey respondents', meaning: '调查受访者', use: '数据描述' },
    ],
    distinctions: [
      { word: 'questionnaire', difference: 'questionnaire 是题目表；survey 是完整调查过程或其结果。', rule: '报告研究结果用 survey，不要把问卷本身等同于调查。' },
    ],
    pitfalls: [
      { wrong: 'make a survey', better: 'conduct / carry out a survey', why: '英语中进行调查通常搭配 conduct 或 carry out。' },
    ],
    writingTip: '引用调查时交代样本或来源，并避免把相关性直接写成因果关系。',
    speakingTip: '描述学校或消费者调查时，a survey found that ... 很自然。',
    recall: '“一项全国性调查发现……”怎么说？',
    answer: 'A nationwide survey found that ...',
    productionFrame: 'A recent survey of X found that Y.',
  },
  ritual: {
    quality: 'curated',
    confidence: 5,
    ipaUk: '/ˈrɪtʃuəl/',
    cefr: 'C1',
    level: '理解优先词',
    value: 59,
    skills: { reading: 84, listening: 57, task1: 40, task2: 60, speaking: 45 },
    coreMeaning: '仪式；具有固定步骤和象征意义的宗教、文化或社会活动。',
    definition: 'a set of fixed actions performed as part of a religious, cultural, or social ceremony',
    register: '中性 / 文化研究',
    topics: ['文化', '传统', '宗教'],
    patterns: ['a religious / cultural ritual', 'perform a ritual', 'a ritual associated with + noun'],
    collocations: [
      { phrase: 'a religious ritual', meaning: '宗教仪式', use: '文化、宗教' },
      { phrase: 'a traditional ritual', meaning: '传统仪式', use: '节庆、习俗' },
      { phrase: 'perform a ritual', meaning: '举行仪式', use: '文化描述' },
    ],
    distinctions: [
      { word: 'ceremony', difference: 'ceremony 是一个正式活动；ritual 是其中具有固定象征意义的动作或程序。', rule: '描述具体重复做法用 ritual；描述整场典礼用 ceremony。' },
    ],
    pitfalls: [
      { wrong: 'a ritual for celebrate the festival', better: 'a ritual for celebrating the festival', why: 'for 后面接名词或 -ing 形式。' },
    ],
    writingTip: '理解优先；如用于文化题，要说明仪式的具体做法和它维系的意义。',
    speakingTip: '不确定 ritual 是否准确时，日常口语优先用 tradition 或 custom。',
    recall: '“宗教仪式”怎么说？',
    answer: 'a religious ritual',
    productionFrame: 'The ritual is performed to mark X.',
  },
  institution: {
    quality: 'curated',
    confidence: 4,
    ipaUk: '/ˌɪnstɪˈtjuːʃn/',
    cefr: 'B2',
    level: '核心输出词',
    value: 80,
    skills: { reading: 88, listening: 68, task1: 51, task2: 90, speaking: 64 },
    coreMeaning: '机构；也可指社会中稳定、被广泛认可的制度。',
    definition: 'a large important organization, such as a university, bank, or government body',
    register: '正式 / 学术',
    topics: ['教育', '政府', '金融'],
    patterns: ['a public / private institution', 'an educational / financial institution', 'trust in institutions'],
    collocations: [
      { phrase: 'public institutions', meaning: '公共机构', use: '政府、公共服务' },
      { phrase: 'an educational institution', meaning: '教育机构', use: '教育话题' },
      { phrase: 'a financial institution', meaning: '金融机构', use: '经济、银行' },
    ],
    distinctions: [
      { word: 'organization', difference: 'organization 可指任何有组织的团体；institution 强调历史较久、正式且社会认可的机构或制度。', rule: '学校、法院、银行等可用 institution；小型项目团队通常用 organization。' },
    ],
    pitfalls: [
      { wrong: 'an institution for educate children', better: 'an educational institution / an institution for educating children', why: 'for 后接 -ing；educational institution 是最自然的固定表达。' },
    ],
    writingTip: '用于讨论制度责任时很有力，但不要用它泛指任何公司或小团体。',
    speakingTip: '谈大学、银行或公共服务时可自然使用 institution。',
    recall: '“教育机构”怎么说？',
    answer: 'an educational institution',
    productionFrame: 'Public institutions should ensure equal access to Y.',
  },
});

Object.assign(curatedOverrides, extendedCuratedProfiles);

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

function parseSourceTitle(note: string) {
  const match = note.match(/阅读提取：(.+?)；本篇出现/);
  return match ? match[1] : undefined;
}

function cleanMeaning(value: string) {
  return value
    .replace(/\b(?:n|v|vt|vi|a|ad|adv|prep|conj)\.\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  const normalized = word.toLowerCase();
  const baseProfile = profileMap[normalized] || fallbackProfile(word, meaning);
  const override = curatedOverrides[normalized];
  return override ? ({ ...baseProfile, ...override } as ExpertProfile) : baseProfile;
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

function sourceReferencesFor(
  word: VocabularyWord | undefined,
  fallbackTitle?: string,
) {
  if (!word) return [] as SourceReference[];
  if (word.sourceRefs?.length) return word.sourceRefs;
  return [
    {
      title: parseSourceTitle(word.note) || fallbackTitle,
      note: word.note,
      occurrenceCount: parseOccurrence(word.note),
      frequency: Math.round(word.freq * 100),
    },
  ];
}

function primarySourceReference(references: SourceReference[]) {
  return references.reduce<SourceReference | undefined>(
    (best, candidate) =>
      (candidate.frequency ?? -1) > (best?.frequency ?? -1) ? candidate : best,
    undefined,
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
  const sourceRefs = sourceReferencesFor(word, sourceTitle);
  const primarySource = primarySourceReference(sourceRefs);
  return {
    ...profile,
    word: lemma,
    sourceWord: word,
    sourceTitle: primarySource?.title || sourceTitle,
    occurrenceCount: primarySource?.occurrenceCount,
    sourceFrequency: primarySource?.frequency,
    sourceRefs: sourceRefs.length ? sourceRefs : undefined,
    studyState,
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
    .map((entry) => {
      const note = typeof entry.note === 'string' ? entry.note : '';
      const freq = typeof entry.freq === 'number' ? entry.freq : 0.5;
      return {
        word: entry.word.trim().toLowerCase(),
        meaning: entry.meaning,
        example: typeof entry.example === 'string' ? entry.example : '',
        note,
        freq,
        sourceRefs: [
          {
            title: document.meta?.title || parseSourceTitle(note),
            source: document.meta?.source,
            examId: document.meta?.examId,
            createdAt: document.meta?.createdAt,
            note,
            occurrenceCount: parseOccurrence(note),
            frequency: Math.round(freq * 100),
          },
        ],
      };
    })
    .filter((entry) => entry.word);
  if (!words.length) return null;
  return {
    words: Array.from(new Map(words.map((entry) => [entry.word, entry])).values()),
    meta: document.meta || {},
  };
}

function mergeVocabularyWords(documents: VocabularyDocument[]) {
  const merged = new Map<string, VocabularyWord>();
  documents.flatMap((document) => document.words).forEach((word) => {
    const existing = merged.get(word.word);
    if (!existing) {
      merged.set(word.word, word);
      return;
    }
    const preferred = word.freq > existing.freq ? word : existing;
    merged.set(word.word, {
      ...preferred,
      sourceRefs: [
        ...sourceReferencesFor(existing),
        ...sourceReferencesFor(word),
      ],
    });
  });
  return Array.from(merged.values());
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

function profileFromAi(profile: AiGeneratedProfile): ExpertProfile {
  return {
    ...profile,
    quality: 'ai',
    confidence: 4,
  };
}

function qualityLabel(quality: ProfileQuality) {
  if (quality === 'curated') return '已审校 IELTS 档案';
  if (quality === 'ai') return 'AI 生成 · 建议核验';
  if (quality === 'dictionary') return '词典补全 · 建议核对';
  return '通用分析 · 待核验';
}

function qualityDescription(quality: ProfileQuality) {
  if (quality === 'curated') {
    return '核心义、搭配、易错点和输出建议已按 IELTS 使用场景整理。';
  }
  if (quality === 'ai') {
    return '由你导入的 AI 接口生成；适合做学习起点，但不等同于官方 IELTS 词频、真题出处或人工审校结论。';
  }
  if (quality === 'dictionary') {
    return '英文释义来自在线词典；考试适配度与搭配为学习建议，不等同于真题频率。';
  }
  return '原始文件没有提供足够语境；本卡片明确保留不确定性，适合作为下一步核验清单。';
}

function sourceExampleLabel(example: string) {
  if (!example) return '未提供原始例句';
  if (/IELTS learners often encounter/i.test(example)) return '系统泛化例句';
  return '来源文件提供的例句（未核验）';
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
  const [aiConnection, setAiConnection] = useState<AiConnection | null>(null);
  const [aiConfigError, setAiConfigError] = useState('');
  const [aiConfigMessage, setAiConfigMessage] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const aiConfigFileRef = useRef<HTMLInputElement>(null);
  const aiRuntimeConfigRef = useRef<AiProviderConfig | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('ielts-vocab-study-states');
      if (stored) {
        const savedStates = JSON.parse(stored) as Record<string, StudyState>;
        const restoreTimer = window.setTimeout(() => setStudyStates(savedStates), 0);
        return () => window.clearTimeout(restoreTimer);
      }
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
      curated: analyses.filter((analysis) => analysis.quality === 'curated').length,
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
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setImportError('');
    try {
      const importResults = await Promise.allSettled(
        files.map(async (file) => {
          const document = normalizeDocument(JSON.parse(await file.text()));
          if (!document) throw new Error('unrecognized vocabulary document');
          return document;
        }),
      );
      const parsedDocuments = importResults
        .filter(
          (result): result is PromiseFulfilledResult<VocabularyDocument> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);
      const skippedCount = importResults.length - parsedDocuments.length;

      if (!parsedDocuments.length) {
        setImportError('未识别到有效词表：需要包含 words 数组和每个词的 word、meaning 字段。');
        return;
      }

      const mergedWords = mergeVocabularyWords(parsedDocuments);
      const parsed: VocabularyDocument = {
        words: mergedWords,
        meta:
          parsedDocuments.length === 1
            ? parsedDocuments[0].meta
            : {
                source: 'merged-ielts-vocabulary',
                title: '已合并 ' + parsedDocuments.length + ' 份 IELTS 词表',
              },
      };

      setDocumentData(parsed);
      const featured =
        parsed.words.find((word) => word.word === 'enhance') || parsed.words[0];
      setActiveWord(featured);
      setAdHocAnalysis(null);
      setSearch('');
      setFilter('all');
      setLookupMessage(
        '已导入 ' +
          parsed.words.length +
          ' 个去重词' +
          (parsedDocuments.length > 1 ? '，来自 ' + parsedDocuments.length + ' 份 JSON。' : '。') +
          (skippedCount ? '另有 ' + skippedCount + ' 份无效文件已跳过。' : ''),
      );
      setShowAnswer(false);
    } catch {
      setImportError('这个文件无法解析为 JSON。请确认它是网站导出的原始词汇文件。');
    } finally {
      event.target.value = '';
    }
  }

  async function handleAiConfigImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAiConfigError('');
    try {
      if (file.size > 16 * 1024) {
        throw new Error('配置文件不能超过 16 KB。');
      }
      const importedConfig = parseAiProviderConfig(JSON.parse(await file.text()));
      const { apiKey: ignoredApiKey, ...connection } = importedConfig;
      void ignoredApiKey;
      aiRuntimeConfigRef.current = importedConfig;
      setAiConnection(connection);
      setAiConfigMessage(
        '已就绪：' +
          importedConfig.name +
          ' · ' +
          importedConfig.model +
          '。配置仅保留在本次页面会话中，刷新后需重新导入。',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '配置文件无法读取。';
      setAiConfigError('未导入：' + message);
    } finally {
      event.target.value = '';
    }
  }

  function clearAiConfig() {
    aiRuntimeConfigRef.current = null;
    setAiConnection(null);
    setAiConfigError('');
    setAiConfigMessage('已从当前页面清除 AI 配置。');
  }

  function downloadAiConfigTemplate() {
    const blob = new Blob([AI_CONFIG_TEMPLATE], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'lexiwise-ai-config.template.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleManualLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const rawWord = manualInput.trim();
    if (rawWord.length > 64 || !/^[a-z]+(?:-[a-z]+)*$/i.test(rawWord)) {
      setLookupMessage('请输入单个英文单词；可使用连字符，暂不支持短语或标点。');
      return;
    }
    const word = rawWord.toLowerCase();
    setManualInput(word);
    const imported = documentData.words.find((item) => item.word === word);
    if (imported) {
      chooseWord(imported);
      setLookupMessage('这个词已在当前词表中，已打开它的学习档案。');
      document.getElementById('analysis-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const knownProfile =
      profileMap[word] || curatedOverrides[word]
        ? profileFor(word, '')
        : undefined;
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

    let aiFailureMessage = '';
    const runtimeAiConfig = aiRuntimeConfigRef.current;
    if (runtimeAiConfig) {
      setLookupMessage('正在通过 ' + runtimeAiConfig.name + ' 生成 IELTS 专家分析…');
      try {
        const generatedProfile = profileFromAi(
          await requestAiWordAnalysis(runtimeAiConfig, word),
        );
        const completed = buildAnalysis(
          undefined,
          generatedProfile,
          'unseen',
          undefined,
          '单词查询 · AI 接口 · ' + runtimeAiConfig.name,
        );
        completed.word = word;
        setAdHocAnalysis(completed);
        setLookupMessage(
          '已由 AI 接口生成完整学习档案。请结合原文确认具体语境，不把其中的学习分数当作官方 IELTS 频率。',
        );
        return;
      } catch (error) {
        aiFailureMessage =
          error instanceof Error ? error.message : 'AI 接口未能完成分析。';
        setLookupMessage('AI 接口未完成，正在改用在线词典补全基础信息…');
      }
    }

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
      setLookupMessage(
        aiFailureMessage
          ? 'AI 接口未完成：' + aiFailureMessage + ' 已改用在线词典补全英文释义与发音。'
          : '已补全英文释义与发音。IELTS 适配建议仍标注为待核验。',
      );
    } catch {
      setLookupMessage(
        aiFailureMessage
          ? 'AI 接口未完成：' + aiFailureMessage + ' 在线词典也暂时不可用，已保留待核验学习档案。'
          : '暂时无法连接在线词典，已保留一份待核验学习档案。',
      );
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

  function downloadAllAnalyses() {
    const payload = {
      exportedAt: new Date().toISOString(),
      source: documentData.meta,
      totalWords: documentData.words.length,
      analyses: documentData.words.map((word) =>
        buildAnalysis(
          word,
          profileFor(word.word, word.meaning),
          studyStates[word.word] || 'unseen',
          sourceTitle,
          '批量词表导出',
        ),
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ielts-expert-vocabulary-plan.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const currentStateOption =
    stateOptions.find((option) => option.value === activeState) || stateOptions[0];
  const activeSourceExample = activeAnalysis.sourceWord?.example || '';
  const activeSourceCount = activeAnalysis.sourceRefs?.length || 0;

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
          <a href="#ai-connection">AI 接口</a>
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
            <a className="text-link" href="#ai-connection">
              配置 AI 接口 <span>↓</span>
            </a>
          </div>
          <input
            ref={importRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            multiple
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
            <span className="source-chip">
              {metrics.curated}/{documentData.words.length} 已审校
            </span>
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
            {isLookingUp ? '生成中…' : aiConnection ? 'AI 深度分析' : '深度分析'}
          </button>
        </form>
      </section>

      <section className="ai-connection" id="ai-connection" aria-label="AI 接口配置">
        <div className="ai-connection-heading">
          <span className="section-kicker">BRING YOUR OWN AI</span>
          <h2>导入你的 AI 配置，让新词也能获得完整分析。</h2>
          <p>
            配置文件只在当前浏览器内存中读取，不上传到本站、不写入 GitHub；刷新页面后会自动清除。
          </p>
        </div>
        <div className="ai-connection-actions">
          <div className={aiConnection ? 'ai-config-status ready' : 'ai-config-status'}>
            <i />
            <div>
              <strong>{aiConnection ? '本次会话已连接' : '尚未导入配置'}</strong>
              <span>
                {aiConnection
                  ? aiConnection.name + ' · ' + aiConnection.model + ' · ' + aiConnection.protocol
                  : '导入后，未收录单词将优先调用你的 AI 接口。'}
              </span>
            </div>
          </div>
          <div className="ai-config-buttons">
            <button
              type="button"
              className="dark-button"
              onClick={() => aiConfigFileRef.current?.click()}
            >
              {aiConnection ? '更换配置' : '导入 AI 配置'}
            </button>
            <button type="button" className="config-button" onClick={downloadAiConfigTemplate}>
              ↓ 下载模板
            </button>
            {aiConnection ? (
              <button type="button" className="config-button danger" onClick={clearAiConfig}>
                清除配置
              </button>
            ) : null}
          </div>
        </div>
        <input
          ref={aiConfigFileRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={handleAiConfigImport}
        />
        {aiConfigError ? <p className="config-feedback error">{aiConfigError}</p> : null}
        {!aiConfigError && aiConfigMessage ? (
          <p className="config-feedback success">{aiConfigMessage}</p>
        ) : null}
        <details className="config-format">
          <summary>查看配置文件格式与使用说明</summary>
          <div className="config-format-body">
            <pre>{AI_CONFIG_TEMPLATE}</pre>
            <div>
              <p>
                <code>endpoint</code> 请填完整接口地址；<code>responses</code> 对应 Responses 协议，
                <code>chat-completions</code> 对应兼容 Chat Completions 的接口。
              </p>
              <p>
                接口必须允许浏览器跨域访问（CORS）。密钥不会保存，但会以 Bearer 凭据发送到配置中指定的接口地址。
              </p>
              <p>
                为保护官方项目密钥，请填自己的兼容接口或安全代理地址，不要浏览器直连官方 OpenAI 地址。
              </p>
              <p>请只导入自己信任的配置文件；不要把含真实密钥的配置上传到 GitHub 或分享给他人。</p>
            </div>
          </div>
        </details>
      </section>

      <section className="workbench" id="library">
        <aside className="library-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">VOCABULARY QUEUE</span>
              <h2>本次词表</h2>
            </div>
            <div className="panel-actions">
              <button
                type="button"
                className="import-mini"
                onClick={() => importRef.current?.click()}
              >
                ＋ 导入
              </button>
              <button
                type="button"
                className="import-mini export-all"
                onClick={downloadAllAnalyses}
              >
                ↓ 全表
              </button>
            </div>
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
                  {activeSourceCount > 1
                    ? ' · 收录于 ' + activeSourceCount + ' 份词表'
                    : ''}
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
                    : '这句由导入文件提供；未上传文章正文，无法验证它是否为文章原句或唯一语境义。'}
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
