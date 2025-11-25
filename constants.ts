
import { LucideIcon, Factory, Users, Globe, ShoppingBag, Smartphone, Ticket, PieChart, FileText, TrendingUp, BarChart, MessageCircle, UserCheck, Target, List } from 'lucide-react';

export const APP_VERSION = 'v1.2.0';

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
  'Classification': { label: 'Account Classification', icon: FileText, color: 'text-blue-600' },
  'Competitors': { label: 'Competitor & Trends', icon: TrendingUp, color: 'text-purple-600' },
  'Sentiment': { label: 'Sentiment Analysis', icon: BarChart, color: 'text-orange-600' },
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
      importError: "Failed to import file. Please check format."
    },
    analysis: {
      title: "Market Intelligence Analyzer",
      subtitle: "Paste raw text, upload screenshots, or import Excel/CSV comments to extract insights.",
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
      modes: {
        LeadMining: "Value Assessment (High Quality Clients)",
        Identity: "Identity Identification (User vs Biz)",
        Classification: "Account Classification",
        Needs: "Mine Needs & Pain Points",
        Competitors: "Competitors & Trends",
        Sentiment: "Sentiment Analysis",
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
        strategyTitle: "STRATEGIC ACTION PLAN"
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
      importError: "导入失败，请检查文件格式。"
    },
    analysis: {
      title: "市场情报分析器",
      subtitle: "粘贴文本、上传截图或导入评论 Excel/CSV，自动提取价值信息。",
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
      modes: {
        LeadMining: "潜客价值评估 (High Quality Clients)",
        Identity: "客户身份识别 (Identity Identification)",
        Classification: "账号类型分类",
        Needs: "用户痛点与需求挖掘 (Needs Mining)",
        Competitors: "竞品与趋势分析",
        Sentiment: "情感倾向分析",
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
        strategyTitle: "触达行动方案"
      }
    }
  }
};

export const SAMPLE_LEADS = [];
