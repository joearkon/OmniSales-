
import { LucideIcon, Factory, Users, Globe, ShoppingBag, Smartphone, Ticket, PieChart, FileText, TrendingUp, BarChart, MessageCircle, UserCheck, Target, List } from 'lucide-react';

export const APP_VERSION = 'v1.3.6';

export const LEAD_TYPES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  'B2B': { label: 'B2B Partner', icon: Factory, color: 'bg-blue-100 text-blue-700' },
  'B2C': { label: 'Direct Consumer', icon: Users, color: 'bg-green-100 text-green-700' },
  'Distributor': { label: 'Distributor', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  'Brand': { label: 'Private Label Brand', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700' },
  'Social': { label: 'Social / KOL', icon: Smartphone, color: 'bg-rose-100 text-rose-700' },
  'Exhibition': { label: 'Exhibition / Trade Show', icon: Ticket, color: 'bg-teal-100 text-teal-700' },
};

export const ANALYSIS_MODES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  'LeadMining': { label: 'Value Assessment (High Quality Clients)', icon: Target, color: 'text-red-600' },
  'Identity': { label: 'Identify Identity (User vs Biz)', icon: UserCheck, color: 'text-indigo-600' },
  'Needs': { label: 'Mine Needs & Pain Points', icon: PieChart, color: 'text-green-600' },
  'Comments': { label: 'Comment Insights', icon: MessageCircle, color: 'text-pink-600' },
};

export const CRM_STATUSES = {
  'New': { label: 'New', color: 'bg-blue-100 text-blue-800' },
  'Contacted': { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  'Qualified': { label: 'Qualified', color: 'bg-green-100 text-green-800' },
  'Lost': { label: 'Lost', color: 'bg-slate-100 text-slate-500' },
};

export const TRANSLATIONS = {
  en: {
    navTitle: "OmniSales Intelligence",
    navSubtitle: "Intimate Product Factory Sales Assistant",
    nav: {
      marketIntel: "Market Intelligence",
      crm: "CRM Pipeline"
    },
    errors: {
      apiKeyMissing: "API Key is missing.",
      vercelDesc: "If you are deploying on Vercel, please set Environment Variable:",
      vercelTip: "Vercel requires 'VITE_' prefix for frontend exposure.",
      fileEmpty: "File appears empty.",
      columnMissing: "Could not identify 'Content' column.",
      parseFail: "Failed to parse file.",
      invalidJson: "Invalid JSON: Expected an array.",
      emptyCSV: "Empty CSV file.",
      unsupportedFile: "Unsupported file type. Use .json or .csv."
    },
    common: {
      generatedAt: "Generated at",
      selectAll: "Select All",
      copyInfo: "Copy Info"
    },
    settings: {
        title: "Factory Brain Settings",
        desc: "Feed your company info to AI for personalized outreach scripts.",
        tabs: {
            basic: "Basic Info",
            products: "Product Library",
            knowledge: "Knowledge Base"
        },
        name: "Factory/Company Name",
        products: "Core Products Summary",
        productsPlaceholder: "e.g., Private Care Gel, Probiotic Wash, Tightening Mask...",
        advantages: "Core Advantages (USPs)",
        advantagesPlaceholder: "e.g., FDA Certified, 100k Clean Room, Patented Formula...",
        policy: "Cooperation Policy",
        policyPlaceholder: "e.g., Low MOQ (500pcs), Free Design...",
        
        // Enriched Fields
        certifications: "Certifications",
        certPlaceholder: "e.g., ISO22716, GMPC, FDA, CE...",
        capacity: "Production Capacity",
        capacityPlaceholder: "e.g., 500k units/day, 10 Production Lines...",
        targetMarkets: "Target Markets",
        marketsPlaceholder: "e.g., USA, EU, Southeast Asia...",
        keyClients: "Success Stories / Key Clients",
        clientsPlaceholder: "e.g., Served 50+ Amazon Top Sellers...",
        website: "Website",
        websitePlaceholder: "e.g., www.omnifactory.com",

        // Product Library
        addProduct: "Add Product",
        prodName: "Product Name",
        prodSKU: "SKU / Model",
        prodPoints: "Selling Points / Features",
        prodMOQ: "MOQ",
        noProducts: "No products added yet. Add specific products for precise AI recommendations.",

        knowledgeBase: "Extended Knowledge (Manuals/Docs)",
        knowledgePlaceholder: "Paste your product manuals, brand story, or detailed certificates here...",
        upload: "Asset Upload",
        uploadDesc: "Upload factory photos, certificates, or product images (Max 5)",
        save: "Save Configuration",
        saved: "Saved!",
        import: "Import Config",
        export: "Export Config",
        importSuccess: "Configuration loaded successfully!",
        importError: "Invalid configuration file."
    },
    crm: {
      title: "CRM Lead Management",
      subtitle: "Manage, filter, and export your lead pipeline.",
      empty: "No leads saved yet. Analyze market data and add leads here.",
      status: "Status",
      statuses: {
        new: "New",
        contacted: "Contacted",
        qualified: "Qualified",
        lost: "Lost"
      },
      stats: {
        total: "Total Leads",
        highPotential: "High Potential",
        contacted: "Contacted",
        rate: "Contact Rate"
      },
      bulk: {
        selected: "Selected",
        delete: "Delete",
        addTag: "Add Tag",
        placeholder: "Tag name..."
      },
      sorting: {
        sortBy: "Sort By",
        dateDesc: "Date (Newest)",
        valueHigh: "Value (High to Low)",
        outreach: "Outreach (Opp. First)"
      },
      notes: "Notes",
      emptyNote: "Click to add private notes...",
      searchPlaceholder: "Search leads, notes, tags...",
      tags: "Tags",
      addTag: "Add Tag",
      save: "Save",
      delete: "Delete",
      deleteConfirm: "Are you sure you want to delete {count} leads?",
      copySuccess: "Lead info copied to clipboard!",
      added: "Added to CRM",
      import: "Import Data",
      exportCSV: "Export CSV",
      exportJSON: "Export Backup (JSON)",
      importSuccess: "Successfully imported leads.",
      importError: "Failed to import file. Please check format.",
      csvHeaders: ['ID', 'Account Name', 'Platform', 'Type', 'Value Category', 'Status', 'Notes', 'Tags', 'Context', 'Added At'],
      
      // Deep Analysis
      deepAnalyze: "Deep Persona Analysis",
      analyzed: "Analyzed"
    },
    deepAnalysis: {
        title: "Deep Persona Agent",
        subtitle: "Upload homepage screenshots or paste profile info to build a 360° user portrait.",
        uploadTip: "Upload screenshots of their Homepage / Recent Posts",
        textTip: "Or paste their Bio / Recent Post Content here",
        analyzing: "Profiling...",
        analyze: "Start Profiling",
        resultTitle: "Persona Report",
        visualEvidence: "Sherlock's Deductions (Visual Clues)",
        psychology: "Psychological Profile",
        buyingLogic: "Buying Logic",
        painPoints: "Hidden Pain Points",
        spendingPower: "Spending Power",
        match: "Product Match",
        whyFit: "Why it fits",
        approach: "Engagement Strategy",
        openingLine: "Killer Opener",
        tone: "Recommended Tone",
        copy: "Copy Opener",
        copied: "Copied!"
    },
    analysis: {
      title: "Market Intelligence Analyzer",
      subtitle: "Paste raw text, upload screenshots, or import Excel/CSV comments to extract insights.",
      inputTip: "💡 Tip: For best results, paste comments in the format 'User Name | Comment Content | Date'. If importing Excel, ensure headers like 'Content' and 'User Name' are present.",
      proTip: {
        title: "Pro Tip",
        desc1: "You can upload screenshots of WeChat conversations, Xiaohongshu posts, or Douyin comments.",
        desc2: "For bulk analysis, use the Import Excel/CSV button to upload comment exports from data platforms."
      },
      placeholder: "Paste content here (e.g., account profiles, post comments, article text)...",
      analyzeBtn: "Analyze Data",
      analyzing: "AI is analyzing...",
      uploadTitle: "Upload Screenshots",
      uploadDesc: "Drag & drop images (JPG, PNG) here, or click to select.",
      uploadCSV: "Import Excel/CSV",
      csvDesc: "Supports .xlsx, .xls, .csv",
      parsing: "Parsing...",
      remove: "Remove",
      exportCSV: "Export to Excel (CSV)",
      exportTxt: "Export Report (Text)",
      csvHeaders: {
        category: "Category",
        item: "Item",
        detail: "Detail/Percentage",
        content: "Content",
        metric: "Metric",
        value: "Value"
      },
      modes: {
        LeadMining: "Value Assessment (High Quality Clients)",
        Identity: "Identify Identity (User vs Biz)",
        Needs: "Mine Needs & Pain Points",
        Comments: "Comment Insights"
      },
      results: {
        platform: "Platform",
        account: "Account",
        type: "Type",
        business: "Core Business",
        features: "Features",
        contact: "Contact Clues",
        coreNeeds: "Core User Needs",
        painPoints: "Main Pain Points",
        preferences: "Consumption Preferences",
        competitor: "Brand",
        pros: "Pros",
        cons: "Cons",
        target: "Target Audience",
        trends: "Market Trends",
        sentiment: "Sentiment Breakdown",
        keywords: "Top Keywords",
        userPersonas: "User Personas",
        commonQuestions: "Common Questions",
        purchaseMotivations: "Purchase Drivers",
        concerns: "Hesitations / Concerns",
        identity: "Identity",
        desc: "Need / Business Description",
        valueCategory: "Value Category",
        reason: "Assessment Reason",
        action: "Suggested Action",
        genStrategy: "Generate Action Plan",
        strategyLoading: "Designing Strategy...",
        diagnosis: "Problem Diagnosis",
        advice: "Nursing Advice",
        recommendation: "Recommended Product",
        scripts: "Outreach Scripts",
        friendly: "Friendly / Resonance",
        professional: "Professional / Value",
        concise: "Concise / Private Domain Hook",
        privateDomain: "Private Domain Tip",
        leadType: "Category",
        addToCRM: "Add to CRM",
        exportStrategy: "Export Strategy",
        reportTitle: "MARKET INTELLIGENCE REPORT",
        strategyTitle: "STRATEGIC ACTION PLAN",
        generated: "Generated",
        outreachStatus: "Outreach Status",
        statuses: {
            likelyUncontacted: "Likely Uncontacted",
            likelyContacted: "Likely Contacted",
            unknown: "Unknown"
        },
        filters: {
            all: "All",
            recent: "Recent (<3 Months)",
            stale: "Old (>3 Months)",
            leadType: "Lead Type",
            platform: "Platform",
            selectType: "Select Type",
            selectPlatform: "Select Platform"
        },
        date: "Date"
      }
    }
  },
  zh: {
    navTitle: "全域销售情报 (OmniSales)",
    navSubtitle: "私密产品工厂销售助手",
    nav: {
      marketIntel: "市场情报 (Market Intelligence)",
      crm: "CRM 客户管理"
    },
    errors: {
      apiKeyMissing: "未检测到 API Key。",
      vercelDesc: "如果您部署在 Vercel，请设置环境变量：",
      vercelTip: "Vercel 前端环境变量需要 'VITE_' 前缀。",
      fileEmpty: "文件内容为空。",
      columnMissing: "无法识别 'Content' (评论内容) 列。",
      parseFail: "文件解析失败。",
      invalidJson: "无效的 JSON：需要数组格式。",
      emptyCSV: "CSV 文件为空。",
      unsupportedFile: "不支持的文件类型，请使用 .json 或 .csv。"
    },
    common: {
      generatedAt: "生成时间",
      selectAll: "全选",
      copyInfo: "复制信息"
    },
    settings: {
        title: "工厂大脑设置 (Factory Brain)",
        desc: "投喂您的工厂/公司信息，AI 将为您生成专属的“带货”话术。",
        tabs: {
            basic: "基本信息",
            products: "产品库 (Product Library)",
            knowledge: "扩展知识库"
        },
        name: "工厂/公司名称",
        products: "核心产品线摘要",
        productsPlaceholder: "例如：私密凝胶、益生菌洗液、紧致贴膜...",
        advantages: "核心优势 (USP)",
        advantagesPlaceholder: "例如：FDA认证、十万级净化车间、独家草本配方...",
        policy: "合作/招商政策",
        policyPlaceholder: "例如：低起订量(500支起)、免费设计包装...",
        
        // Enriched Fields
        certifications: "资质认证",
        certPlaceholder: "例如：ISO22716, GMPC, FDA, CE认证...",
        capacity: "产能规模",
        capacityPlaceholder: "例如：日产30万支，拥有10条全自动生产线...",
        targetMarkets: "目标/优势市场",
        marketsPlaceholder: "例如：欧美市场、东南亚、国内私域/电商...",
        keyClients: "成功案例/合作品牌",
        clientsPlaceholder: "例如：服务过50+亚马逊Top卖家，国内某知名连锁...",
        website: "公司官网",
        websitePlaceholder: "例如：www.omnifactory.com",

        // Product Library
        addProduct: "添加产品",
        prodName: "产品名称",
        prodSKU: "SKU / 规格型号",
        prodPoints: "核心卖点 (AI参考)",
        prodMOQ: "起订量",
        noProducts: "暂无产品。请添加具体产品以便 AI 进行精准推荐。",

        knowledgeBase: "扩展知识 (手册/文档)",
        knowledgePlaceholder: "在此粘贴您的详细产品手册、品牌故事或资质证书描述...",
        upload: "资产上传",
        uploadDesc: "上传工厂实景、资质证书或产品图 (最多5张)",
        save: "保存配置",
        saved: "已保存！",
        import: "导入配置",
        export: "导出配置",
        importSuccess: "配置加载成功！",
        importError: "无效的配置文件。"
    },
    crm: {
      title: "CRM 客户管理看板",
      subtitle: "管理、筛选及导出您的客户漏斗。",
      empty: "暂无客户。请在市场情报中分析并添加客户。数据已自动保存至本地。",
      status: "跟进状态",
      statuses: {
        new: "新客户",
        contacted: "已跟进",
        qualified: "意向强烈",
        lost: "已流失"
      },
      stats: {
        total: "客户总数",
        highPotential: "高潜客户",
        contacted: "已跟进",
        rate: "跟进率"
      },
      bulk: {
        selected: "已选择",
        delete: "批量删除",
        addTag: "添加标签",
        placeholder: "输入标签名..."
      },
      sorting: {
        sortBy: "排序方式",
        dateDesc: "发布时间 (由新到旧)",
        valueHigh: "价值等级 (由高到低)",
        outreach: "触达机会 (未触达优先)"
      },
      notes: "备注",
      emptyNote: "点击添加私密备注...",
      searchPlaceholder: "搜索客户名、备注、标签...",
      tags: "客户标签",
      addTag: "添加标签",
      save: "保存",
      delete: "删除",
      deleteConfirm: "确定要删除 {count} 位客户吗？",
      copySuccess: "客户信息已复制到剪贴板！",
      added: "已添加",
      import: "导入数据",
      exportCSV: "导出 Excel",
      exportJSON: "导出备份 (JSON)",
      importSuccess: "成功导入客户数据。",
      importError: "导入失败，请检查文件格式。",
      csvHeaders: ['ID', '账号名', '平台', '类型', '价值等级', '状态', '备注', '标签', '上下文', '添加时间'],
      
      // Deep Analysis
      deepAnalyze: "深度画像探针",
      analyzed: "已深度分析"
    },
    deepAnalysis: {
        title: "深度画像探针 (Persona Agent)",
        subtitle: "上传客户主页截图或粘贴资料，生成360°全息画像。",
        uploadTip: "上传对方主页/作品截图 (支持多张)",
        textTip: "或在此粘贴对方主页简介/最近作品内容",
        analyzing: "AI 侧写中...",
        analyze: "开始侧写",
        resultTitle: "用户全息画像报告",
        visualEvidence: "福尔摩斯时刻 (视觉证据)",
        psychology: "消费心理侧写",
        buyingLogic: "购买逻辑",
        painPoints: "隐形痛点",
        spendingPower: "预估消费力",
        match: "产品匹配度",
        whyFit: "匹配理由",
        approach: "破冰攻单策略",
        openingLine: "必杀开场白",
        tone: "建议语态",
        copy: "复制话术",
        copied: "已复制"
    },
    analysis: {
      title: "市场情报分析器",
      subtitle: "粘贴文本、上传截图或导入评论 Excel/CSV，自动提取价值信息。",
      inputTip: "💡 提示：为获得最佳分析结果，请以“用户名 | 评论内容 | 时间”的格式粘贴。导入 Excel 时，请确保包含“评论内容”、“评论人”等列。",
      proTip: {
        title: "使用技巧",
        desc1: "您可以上传微信聊天记录、小红书笔记或抖音评论的截图。",
        desc2: "如需批量分析，请使用“导入 Excel/CSV”按钮上传数据平台的评论导出文件。"
      },
      placeholder: "在此粘贴内容（例如：账号简介列表、帖子评论区内容、文章正文）...",
      analyzeBtn: "开始智能分析",
      analyzing: "AI 正在分析中...",
      uploadTitle: "上传截图",
      uploadDesc: "拖放图片 (JPG, PNG) 到此处。",
      uploadCSV: "导入 Excel/CSV",
      csvDesc: "支持 .xlsx, .xls, .csv",
      parsing: "解析中...",
      remove: "移除",
      exportCSV: "导出 Excel (CSV)",
      exportTxt: "导出文本报告 (Text)",
      csvHeaders: {
        category: "类别",
        item: "项目",
        detail: "详情/占比",
        content: "内容",
        metric: "指标",
        value: "数值"
      },
      modes: {
        LeadMining: "潜客价值评估 (High Quality Clients)",
        Identity: "客户身份识别 (Identity Identification)",
        Needs: "用户痛点与需求挖掘 (Needs Mining)",
        Comments: "评论深度分析"
      },
      results: {
        platform: "平台",
        account: "账号名",
        type: "类型",
        business: "核心业务",
        features: "产品/服务特点",
        contact: "联系方式线索",
        coreNeeds: "核心需求 (按频率)",
        painPoints: "主要痛点 (含占比)",
        preferences: "消费偏好 (含占比)",
        competitor: "竞品品牌",
        pros: "优势",
        cons: "劣势",
        target: "目标人群",
        trends: "市场趋势",
        sentiment: "情感占比",
        keywords: "高频关键词",
        userPersonas: "潜在用户画像",
        commonQuestions: "高频提问",
        purchaseMotivations: "购买动机",
        concerns: "购买顾虑",
        identity: "身份类型",
        desc: "需求 / 业务描述",
        valueCategory: "价值等级",
        reason: "评估理由",
        action: "建议动作",
        genStrategy: "生成触达行动方案",
        strategyLoading: "正在设计话术...",
        diagnosis: "问题诊断 (专家形象)",
        advice: "护理建议",
        recommendation: "推荐产品类型",
        scripts: "破冰话术库",
        friendly: "亲切共鸣型 (适合评论区)",
        professional: "专业价值型 (适合私信)",
        concise: "私域引流钩子 (适合转化)",
        privateDomain: "私域转化公式建议",
        leadType: "客户归类",
        addToCRM: "添加至 CRM",
        exportStrategy: "导出行动方案",
        reportTitle: "市场情报分析报告",
        strategyTitle: "触达行动方案",
        generated: "生成时间",
        outreachStatus: "触达状态预判",
        statuses: {
            likelyUncontacted: "大概率未触达 (机会大)",
            likelyContacted: "可能已被触达 (竞对)",
            unknown: "无法判断"
        },
        filters: {
            all: "全部时间",
            recent: "近期 (<3个月)",
            stale: "陈旧 (>3个月)",
            leadType: "客户类型",
            platform: "平台来源",
            selectType: "选择类型",
            selectPlatform: "选择平台"
        },
        date: "发布时间"
      }
    }
  }
};

export const SAMPLE_LEADS = [];
