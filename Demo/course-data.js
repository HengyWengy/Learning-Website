module.exports = [
  {
    id: "mpos-walkthrough",
    title: "MPOS 操作流程",
    topic: "系统操作",
    duration: "Local video",
    hasVideo: true,
    mediaFile: "MPOS.mp4",
    description: "学习 MPOS 从客户资料、VCA、Fact Find、Existing Policies 到 Full Quotation 与 Check Completeness 的基本提交流程。",
    contentBlocks: [
      {
        title: "学习重点",
        bullets: [
          "进入 MPOS 后先确认 Customer Management、Proposal Management 和 Resources 等主模块。",
          "建立或搜索客户资料时，要准确填写称呼、姓名、证件类型、证件号码、国籍和地址等资料。",
          "VCA 会确认客户残疾、收入资源、保险经验、语言偏好等适配问题。",
          "Fact Find 会检查现有保单，再进入推荐产品和 Full Quotation。",
          "完成报价后，需要用 Check Completeness 检查资料完整性，才继续后续提交。",
        ],
      },
    ],
    quiz: {
      questions: [
        {
          question: "MPOS 首页主要让顾问进入哪些工作模块？",
          options: ["客户管理、建议书管理和资源", "游戏中心、音乐播放器和相机", "银行转账、股票交易和邮箱", "只可以查看旧保单，不能建立新资料"],
          answerIndex: 0,
        },
        {
          question: "建立客户资料时，为什么证件类型和证件号码要准确？",
          options: ["因为这些资料会影响客户身份识别和后续建议书资料", "因为系统只接受随便输入的测试资料", "因为证件资料不会被用到", "因为填写错误也不会影响提交"],
          answerIndex: 0,
        },
        {
          question: "VCA 页面主要在确认什么？",
          options: ["客户是否适合继续进行建议流程，例如残疾、财务资源、保险经验等", "客户是否要下载影片", "顾问是否已经退出系统", "客户手机有没有安装游戏"],
          answerIndex: 0,
        },
        {
          question: "在 Existing Policies 画面，如果客户没有现有保单，应该怎样处理？",
          options: ["勾选或确认没有现有保单，再继续流程", "随便新增一张不存在的保单", "关闭 MPOS 不继续", "把别人的保单填进去"],
          answerIndex: 0,
        },
        {
          question: "Full Quotation 的主要用途是什么？",
          options: ["选择产品/配套、保额、保费频率和附加利益来生成报价", "更改客户的银行密码", "删除所有客户资料", "下载公司内部文件"],
          answerIndex: 0,
        },
        {
          question: "Waiver 或 Payer Benefits 这类项目通常属于什么？",
          options: ["附加利益或额外保障选项", "客户的证件号码", "顾问的登录密码", "系统语言设定"],
          answerIndex: 0,
        },
        {
          question: "提交前系统提醒使用 Check Completeness，原因是什么？",
          options: ["检查资料和建议流程是否完整，避免遗漏必要步骤", "让客户跳过所有问题", "把影片下载到电脑", "自动批准所有保单"],
          answerIndex: 0,
        },
        {
          question: "MPOS 流程中，Fact Find 的目的最接近哪一项？",
          options: ["了解客户现有情况和需要，再推荐合适产品", "只用来装饰页面", "用来播放音乐", "用来替客户申请社交账号"],
          answerIndex: 0,
        },
      ],
      success: "正确。你已经掌握 MPOS 从客户资料到报价提交的核心流程。",
    },
  },
  {
    id: "will-planning",
    title: "遗嘱与遗产规划",
    topic: "遗产规划",
    duration: "Reading",
    hasVideo: false,
    description: "根据 Will.pptx 的遗产规划蓝图，学习遗嘱的意义、关键人物、遗产执行流程和常见法律瓶颈。",
    contentBlocks: [
      {
        title: "学习重点",
        bullets: [
          "遗嘱是给家人的法律清单和资产分配说明书，不只是最后一封信。",
          "有遗嘱 Testate 可以按个人意愿分配；没有遗嘱 Intestate 则会依法律程序处理，时间和成本通常更高。",
          "五个重点人物包括立遗嘱人、执行人、见证人、监护人和受益人。",
          "执行人负责申请 Grant of Probate、整理资产、处理税务和债务，并按遗嘱分配资产。",
          "遗产执行大致分为文件准备、法律清算和最终分配三个阶段。",
        ],
      },
    ],
    quiz: {
      questions: [
        {
          question: "遗嘱最核心的作用是什么？",
          options: ["清楚表达资产分配和家人安排的法律意愿", "让资产自动消失", "只用来记录生日愿望", "只适合没有家庭的人"],
          answerIndex: 0,
        },
        {
          question: "有遗嘱 Testate 与无遗嘱 Intestate 的主要差别是什么？",
          options: ["有遗嘱按个人意愿处理；无遗嘱会依法律程序和默认规则处理", "无遗嘱一定比有遗嘱更快", "有遗嘱就不需要执行人", "两者完全没有差别"],
          answerIndex: 0,
        },
        {
          question: "遗产规划中的 Testator 是谁？",
          options: ["立遗嘱人，也就是作出遗嘱决定的人", "银行职员", "保险公司", "所有受益人的律师"],
          answerIndex: 0,
        },
        {
          question: "Executor 执行人的主要任务是什么？",
          options: ["处理遗产执行、申请法律文件、清算债务并分配资产", "只负责签一张见证表格", "决定所有受益人必须放弃继承", "负责替客户购买汽车保险"],
          answerIndex: 0,
        },
        {
          question: "见证人 Witness 在遗嘱中为什么重要？",
          options: ["他们证明遗嘱签署过程合法有效", "他们自动获得全部遗产", "他们可以随意更改遗嘱内容", "他们负责缴付所有债务"],
          answerIndex: 0,
        },
        {
          question: "Guardian 监护人主要适用于什么情况？",
          options: ["当父母不在时，安排未成年子女的照顾者", "管理公司销售目标", "替执行人申请贷款", "替见证人领取佣金"],
          answerIndex: 0,
        },
        {
          question: "遗产执行中的清算瓶颈通常包括什么？",
          options: ["整理资产、关闭税务、偿还债务", "下载影片和PDF", "更换手机号码", "重新设计公司标志"],
          answerIndex: 0,
        },
        {
          question: "良好的遗产规划最终希望达到什么？",
          options: ["清晰意愿、正确人选、可预测流程，给家人安心", "让家人完全不知道资产在哪里", "故意制造更多争议", "让所有资产长期冻结"],
          answerIndex: 0,
        },
      ],
      success: "正确。你已经掌握遗嘱规划的关键人物与执行流程。",
    },
  },
  {
    id: "kwsp-epf-tax",
    title: "KWSP/EPF 与扣税重点",
    topic: "税务与退休",
    duration: "Reading",
    hasVideo: false,
    description: "整理 KWSP/EPF 华文资料与 LHDN 截图重点，理解 EPF、自愿缴纳、寿险/家庭 Takaful 和相关税务减免限额。",
    contentBlocks: [
      {
        title: "学习重点",
        bullets: [
          "LHDN 项目 17 是人寿保险和公积金，整体显示 RM7,000 限额。",
          "认可计划的强制性供款或自愿向 EPF 缴纳的供款，截图标示限额为 RM4,000。",
          "人寿保险保费、家庭 Takaful 缴款或额外自愿向 EPF 缴纳的供款，截图标示限额为 RM3,000。",
          "私人退休计划和递延年金属于另一个 RM3,000 限额项目。",
          "教育和医疗保险在截图中属于 RM4,000 限额；SOCSO/EIS 项目显示 RM350 限额。",
        ],
      },
    ],
    quiz: {
      questions: [
        {
          question: "LHDN 截图中，人寿保险和公积金项目整体显示的扣税限额是多少？",
          options: ["RM7,000", "RM350", "RM100,000", "没有任何限额"],
          answerIndex: 0,
        },
        {
          question: "认可计划的强制性供款或向 EPF 缴纳的自愿供款，在截图中标示的限额是多少？",
          options: ["RM4,000", "RM3,000", "RM350", "RM10,000"],
          answerIndex: 0,
        },
        {
          question: "人寿保险保费、家庭 Takaful 或额外自愿 EPF 供款，在截图中标示的限额是多少？",
          options: ["RM3,000", "RM7,000", "RM350", "RM500"],
          answerIndex: 0,
        },
        {
          question: "私人退休计划和递延年金属于哪个限额项目？",
          options: ["RM3,000 限量", "RM7,000 无限量", "RM350 限量", "完全不能扣税"],
          answerIndex: 0,
        },
        {
          question: "教育和医疗保险在截图中对应的限额是多少？",
          options: ["RM4,000", "RM3,000", "RM350", "RM7,000"],
          answerIndex: 0,
        },
        {
          question: "SOCSO/EIS 缴款项目在截图中显示的限额是多少？",
          options: ["RM350", "RM4,000", "RM3,000", "RM7,000"],
          answerIndex: 0,
        },
        {
          question: "税务减免限额应该怎样理解？",
          options: ["它是可申报减免的上限，不代表政府直接退还同等现金", "它代表每个人一定拿到全额现金", "它可以无限叠加不受限制", "它只适用于下载PDF的人"],
          answerIndex: 0,
        },
      ],
      success: "正确。你已经掌握 EPF/寿险相关扣税限额的基本区分。",
    },
  },
  {
    id: "socso-sepcc-script",
    title: "SOCSO/SEPCC 话术流程",
    topic: "客户沟通",
    duration: "Reading",
    hasVideo: false,
    description: "根据 SOCSO 话术图和 SMCC/SEPCC 资料，练习如何用顾问式对话解释 SOCSO 的政府保障、申请对象和常见拒绝处理。",
    contentBlocks: [
      {
        title: "学习重点",
        bullets: [
          "开场先确认公司与负责人身份，再说明自己想了解为什么还没有申请 SOCSO。",
          "客户说没兴趣时，不要硬推，先用福利和政府保障角度引导。",
          "需要分清公司类型和对象，例如 Sdn Bhd、Enterprise、老板本人或员工。",
          "当客户已有私人保险时，要说明 SOCSO 是政府福利/保障，和私人保险保障位置不同。",
          "当客户不懂或犹豫时，先提供简短说明和后续资料，不要让对话变成争吵。",
        ],
      },
    ],
    quiz: {
      questions: [
        {
          question: "SOCSO 话术的开场应该先做什么？",
          options: ["确认公司和负责人身份，再说明来意", "立刻要求客户付款", "直接批评客户没有保障", "先问客户要不要下载文件"],
          answerIndex: 0,
        },
        {
          question: "客户说“没有兴趣”时，较合适的回应是什么？",
          options: ["先理解客户，再用政府福利和保障角度简短解释", "立刻挂电话", "强迫客户马上申请", "告诉客户私人保险全部没用"],
          answerIndex: 0,
        },
        {
          question: "为什么话术中要区分 Sdn Bhd、Enterprise、员工和老板？",
          options: ["因为不同对象和公司形态会影响申请角度与责任说明", "因为只是为了拖延时间", "因为系统不能记录公司名字", "因为所有人答案都一样，不需要区分"],
          answerIndex: 0,
        },
        {
          question: "如果老板说自己已有保险，顾问应强调什么？",
          options: ["SOCSO 是政府保障/福利，和私人保险保障位置不同", "有私人保险就永远不需要任何政府保障", "SOCSO 只保障汽车", "私人保险和 SOCSO 是完全一样的东西"],
          answerIndex: 0,
        },
        {
          question: "话术中提到客户“不懂”时，顾问较好的处理方式是什么？",
          options: ["用简单例子解释，不强硬推销，并留下后续资料", "责怪客户不了解", "马上结束所有沟通", "改讲完全无关的产品"],
          answerIndex: 0,
        },
        {
          question: "SOCSO 沟通中常见的核心价值是什么？",
          options: ["以低成本取得政府相关保障，减少意外/工作风险带来的负担", "保证客户投资一定赚钱", "替客户逃税", "替客户下载影片"],
          answerIndex: 0,
        },
        {
          question: "当客户担心已有公司保险或私人保险重复时，应怎样定位 SOCSO？",
          options: ["作为不同位置的基本保障，不是简单替代私人保险", "完全没有任何作用", "只给没有工作的人使用", "只适合退休人士"],
          answerIndex: 0,
        },
      ],
      success: "正确。你已经掌握 SOCSO/SEPCC 沟通中的身份确认、异议处理与保障定位。",
    },
  },
  {
    id: "protection-map",
    title: "保障架构速记",
    topic: "保险架构",
    duration: "Reading",
    hasVideo: false,
    description: "根据白板笔记，复习 Life、PA、CI 和 Medical Card 的保障定位：死亡/TPD、意外、严重疾病现金给付，以及住院医疗费用。",
    contentBlocks: [
      {
        title: "学习重点",
        bullets: [
          "Life 人寿主要对应死亡、TPD，以及自杀等待期等基本规则。",
          "PA 意外保障主要处理意外死亡、意外残疾比例和意外医疗。",
          "CI 严重疾病围绕 Cancer、Stroke、Kidney Failure、Heart Attack 等重大疾病。",
          "CI 通常根据医生医疗报告确认后，一次性赔付到银行账户，可用于生活费。",
          "Medical Card 医疗卡主要处理住院医疗账单，通常是给医院/医疗费用使用。",
        ],
      },
    ],
    quiz: {
      questions: [
        {
          question: "白板中 Life 人寿保障主要关联什么？",
          options: ["死亡、TPD 和相关等待期规则", "只保障汽车维修", "只保障旅游行李", "只负责下载PDF"],
          answerIndex: 0,
        },
        {
          question: "PA 意外保障的重点是什么？",
          options: ["意外死亡、意外残疾比例和意外医疗", "癌症一次性赔付", "退休金扣税", "遗嘱执行"],
          answerIndex: 0,
        },
        {
          question: "CI 严重疾病保障通常围绕哪些风险？",
          options: ["Cancer、Stroke、Kidney Failure、Heart Attack 等重大疾病", "手机遗失", "汽车刮花", "公司网站设计"],
          answerIndex: 0,
        },
        {
          question: "CI 赔付通常需要什么作为确认依据？",
          options: ["医生/医疗报告提及符合保障的严重疾病", "客户口头说不舒服就一定赔", "只需要下载影片", "不需要任何文件"],
          answerIndex: 0,
        },
        {
          question: "Medical Card 医疗卡主要处理什么？",
          options: ["住院和医疗账单", "遗产分配", "SOCSO 公司开场白", "汽车路税"],
          answerIndex: 0,
        },
        {
          question: "为什么 CI 一次性赔付可以补上 Medical Card 以外的需要？",
          options: ["因为它可用于康复期生活费、债务或收入中断的资金压力", "因为它只能付给医院不能使用", "因为它只保障普通感冒", "因为它不能进银行账户"],
          answerIndex: 0,
        },
      ],
      success: "正确。你已经掌握 Life、PA、CI 和 Medical Card 的定位差别。",
    },
  },
];
