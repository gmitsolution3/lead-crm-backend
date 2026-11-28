export type TAdminTimeframe = "7d" | "1m" | "3m" | "6m" | "1y";

export interface TTrendBucket {
  key: string;
  label: string;
  subLabel: string;
  count: number;
  target: number;
  progressPercent: number;
  metTarget: boolean;
  isCurrent?: boolean;
  tooltipText: string;
}

export interface TAdminDashboardResponse {
  timeframe: TAdminTimeframe;
  dailyTarget: number;
  perModeratorTarget: number;
  moderatorCount: number;
  velocity: {
    todayCount: number;
    yesterdayCount: number;
    dailyTarget: number;
    progressPercent: number;
    isTargetMet: boolean;
    differenceFromYesterday: number;
  };
  kpiSummary: {
    totalLeads: number;
    totalSearchClusters: number;
    verifiedCount: number;
    conversionRate: number;
    prospectsWithoutWebsite: number;
    prospectsWithoutWebsitePercent: number;
    enrichedSocialCount: number;
    enrichedSocialPercent: number;
  };
  funnelStages: {
    uncontacted: number;
    called: number;
    call_later: number;
    interested: number;
    converted: number;
    not_interested: number;
    invalid: number;
    pipelineDeals: number;
    contactRate: number;
    activeNegotiationRate: number;
    dealProposalRate: number;
    winRate: number;
  };
  platformFootprint: {
    googleMaps: number;
    instagramFacebook: number;
    linkedin: number;
    other: number;
  };
  trendAnalytics: {
    timeframe: TAdminTimeframe;
    periodBenchmark: number;
    benchmarkUnitLabel: string;
    title: string;
    description: string;
    buckets: TTrendBucket[];
    totalTouchpoints: number;
    periodAverage: number;
    maxBucketValue: number;
    metric1Label: string;
    metric1Value: number;
    metric1Sub: string;
    metric2Label: string;
    metric2Value: number;
    metric2Sub: string;
    metric4Label: string;
    metric4Sub: string;
  };
  moderatorLeaderboard: {
    userId: string;
    name: string;
    email: string;
    role: string;
    todayTouches: number;
    attemptsToday: number;
    meaningfulContactsToday: number;
    qualifiedToday: number;
    convertedToday: number;
    reachRate: number;
    targets: {
      dailyCallTarget: number;
      dailyContactTarget: number;
      dailyQualifiedTarget: number;
      dailyConversionTarget: number;
      isCustom: boolean;
    };
    progressPercent: number;
    isMet: boolean;
    toGo: number;
  }[];
  dealPipeline: {
    totalPipelineValue: number;
    closedWonValue: number;
    activeDealsValue: number;
  };
  topSearchQueries: {
    query: string;
    totalLeads: number;
    convertedLeads: number;
  }[];
  recentLeads: any[];
  recentActivities: any[];
}

export interface TModeratorDashboardResponse {
  dailyTarget: number;
  kpiStats: {
    dailyTarget: number;
    dailyCallTarget: number;
    dailyQualifiedTarget: number;
    dailyConversionTarget: number;
    isCustomTarget: boolean;
    todayCount: number;
    moderatorTodayCount: number;
    attemptsToday: number;
    qualifiedToday: number;
    convertedToday: number;
    reachRate: number;
    yesterdayCount: number;
    remainingToGo: number;
    progressPercent: number;
    isTargetMet: boolean;
    calledToday: number;
    interestedToday: number;
    interestedOnlyToday: number;
    callLaterToday: number;
    notInterestedToday: number;
    invalidToday: number;
  };
  stageStats: {
    uncontacted: number;
    called: number;
    call_later: number;
    interested: number;
    converted: number;
    not_interested: number;
    invalid: number;
  };
  totalLeads: number;
  todayFollowUps: any[];
  hotProspects: any[];
  recentLeads: any[];
}
