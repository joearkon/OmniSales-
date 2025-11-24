import { LucideIcon, Factory, Users, Globe, ShoppingBag, Smartphone, Ticket } from 'lucide-react';

export const LEAD_TYPES: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  'B2B': { label: 'B2B Partner', icon: Factory, color: 'bg-blue-100 text-blue-700' },
  'B2C': { label: 'Direct Consumer', icon: Users, color: 'bg-green-100 text-green-700' },
  'Distributor': { label: 'Distributor', icon: Globe, color: 'bg-purple-100 text-purple-700' },
  'Brand': { label: 'Private Label Brand', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700' },
  'Social': { label: 'Social / KOL', icon: Smartphone, color: 'bg-rose-100 text-rose-700' },
  'Exhibition': { label: 'Exhibition / Trade Show', icon: Ticket, color: 'bg-teal-100 text-teal-700' },
};

export const TRANSLATIONS = {
  en: {
    navTitle: "OmniSales Intelligence",
    navSubtitle: "Intimate Product Factory Sales Assistant",
    heroTitle: "Find High-Value OEM/ODM Partners",
    heroSubtitle: "Leverage AI to scout distributors, private label brands, and e-commerce sellers suitable for our factory capabilities.",
    searchPlaceholder: "E.g., 'Silicone vibrator brands in Europe', 'Adult toy wholesalers USA'",
    searchButton: "Find Leads",
    scouting: "Scouting...",
    readyToHunt: "Ready to hunt",
    readyToHuntDesc: "Enter your target keywords above to start generating leads.",
    found: "Found",
    partners: "Potential Partners",
    confidence: "AI Confidence: High",
    noLeads: "No leads found. Try broadening your search terms.",
    viewDetails: "View Details & Outreach",
    match: "Match",
    website: "Website",
    companyInfo: "Company Info",
    aiOutreach: "AI Outreach",
    about: "About",
    potentialNeeds: "Potential Needs",
    publicContact: "Public Contact Data",
    sources: "Sources",
    generateScript: "Generate a personalized script to break the ice.",
    generate: "Generate",
    analyzing: "Analyzing lead & drafting message...",
    copySuccess: "Copied!",
    selectOption: "Select options and click Generate to see the magic.",
    targetType: {
        distributor: "Distributors",
        brand: "Private Label Brands",
        b2b: "General B2B",
        b2c: "E-commerce Stores",
        social: "Social Media / KOL (Douyin/Red)",
        exhibition: "Trade Shows / Exhibitors"
    },
    outreach: {
        channel: "Channel",
        tone: "Tone",
        wechat: "WeChat / IM",
        email: "Cold Email",
        phone: "Phone Script",
        professional: "Professional",
        friendly: "Casual & Friendly",
        direct: "Direct & Concise"
    }
  },
  zh: {
    navTitle: "全域销售情报 (OmniSales)",
    navSubtitle: "私密产品工厂销售助手",
    heroTitle: "寻找高价值 OEM/ODM 合作伙伴",
    heroSubtitle: "利用 AI 发掘适合我们工厂能力的经销商、贴牌品牌和电商卖家，覆盖亚洲及全球市场。",
    searchPlaceholder: "例如：'上海成人展参展商名单', '广东情趣内衣工厂代理'",
    searchButton: "寻找客源",
    scouting: "正在全网搜寻 (含展会数据)...",
    readyToHunt: "准备就绪",
    readyToHuntDesc: "在上方输入关键词开始挖掘潜在客户。",
    found: "找到",
    partners: "个潜在合作伙伴",
    confidence: "AI 置信度：高",
    noLeads: "未找到线索。请尝试扩大搜索范围。",
    viewDetails: "查看详情 & 联络",
    match: "匹配度",
    website: "官网/主页",
    companyInfo: "企业信息",
    aiOutreach: "AI 话术生成",
    about: "简介",
    potentialNeeds: "潜在需求",
    publicContact: "公开联系方式",
    sources: "信息来源",
    generateScript: "生成个性化破冰话术。",
    generate: "生成话术",
    analyzing: "正在分析客户并撰写...",
    copySuccess: "已复制!",
    selectOption: "选择选项并点击生成以查看结果。",
    targetType: {
        distributor: "经销商 / 代理商",
        brand: "贴牌品牌方 (Private Label)",
        b2b: "一般 B2B 客户",
        b2c: "电商卖家 / 网店",
        social: "抖音/小红书/微信 (新媒体)",
        exhibition: "展会参展商 (广交会/成人展)"
    },
    outreach: {
        channel: "渠道",
        tone: "语气",
        wechat: "微信 / 即时通讯",
        email: "开发邮件",
        phone: "电话话术",
        professional: "专业正式",
        friendly: "亲切友好",
        direct: "直接高效"
    }
  }
};

export const SAMPLE_LEADS = [];