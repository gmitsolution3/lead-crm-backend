import { LeadModel } from "../lead/lead.model";
import { SearchGroupModel } from "../searchGroup/searchGroup.model";
import { getTargetForDate, settingsService } from "../settings/settings.service";
import {
  TAdminDashboardResponse,
  TAdminTimeframe,
  TModeratorDashboardResponse,
  TTrendBucket,
} from "./dashboard.types";

interface BucketConfig {
  key: string;
  label: string;
  subLabel: string;
  start: number;
  end: number;
  isCurrent?: boolean;
}

const buildTimeframeBucketConfigs = (
  timeframe: TAdminTimeframe,
  now: Date,
): BucketConfig[] => {
  if (timeframe === "7d") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = start + 86400000 - 1;
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = i === 6;

      return {
        key: `day7_${i}`,
        label: isToday ? "Today" : dayName,
        subLabel: dayLabel,
        start,
        end,
        isCurrent: isToday,
      };
    });
  }

  if (timeframe === "1m") {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const end = start + 86400000 - 1;
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const isToday = i === 29;

      return {
        key: `day30_${i}`,
        label: isToday ? "Today" : `${monthShort} ${dayNum}`,
        subLabel: `${dayNum}`,
        start,
        end,
        isCurrent: isToday,
      };
    });
  }

  if (timeframe === "3m") {
    // 12 Weeks
    return Array.from({ length: 12 }, (_, i) => {
      const daysBackStart = (11 - i) * 7;
      const daysBackEnd = daysBackStart - 6;

      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - daysBackStart);
      const start = new Date(dStart.getFullYear(), dStart.getMonth(), dStart.getDate(), 0, 0, 0, 0).getTime();

      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() - (daysBackEnd > 0 ? daysBackEnd : 0));
      const end = new Date(dEnd.getFullYear(), dEnd.getMonth(), dEnd.getDate(), 23, 59, 59, 999).getTime();

      const isCurrent = i === 11;
      const startFmt = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endFmt = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      return {
        key: `week12_${i}`,
        label: isCurrent ? "This Wk" : `W${i + 1}`,
        subLabel: `${startFmt} - ${endFmt}`,
        start,
        end,
        isCurrent,
      };
    });
  }

  if (timeframe === "6m") {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const start = d.getTime();
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const end = nextMonth.getTime() - 1;

      const monthName = d.toLocaleDateString("en-US", { month: "short" });
      const yearStr = d.getFullYear().toString();
      const isCurrent = i === 5;

      return {
        key: `month6_${i}`,
        label: isCurrent ? `${monthName} (Now)` : monthName,
        subLabel: yearStr,
        start,
        end,
        isCurrent,
      };
    });
  }

  // 1y = 12 Months
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const start = d.getTime();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const end = nextMonth.getTime() - 1;

    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const yearStr = d.getFullYear().toString().slice(-2);
    const isCurrent = i === 11;

    return {
      key: `month12_${i}`,
      label: isCurrent ? `${monthName} (Now)` : monthName,
      subLabel: `'${yearStr}`,
      start,
      end,
      isCurrent,
    };
  });
};

const getAdminDashboardData = async (
  timeframe: TAdminTimeframe = "7d",
): Promise<TAdminDashboardResponse> => {
  const settings = await settingsService.getSettings();
  const dailyTarget = settings.dailyApproachTarget || 25;
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = startOfToday + 86400000 - 1;
  const startOfYesterday = startOfToday - 86400000;
  const endOfYesterday = startOfToday - 1;

  const bucketConfigs = buildTimeframeBucketConfigs(timeframe, now);

  // Database-driven bucket facets
  const bucketFacets: Record<string, any[]> = {};
  bucketConfigs.forEach((b) => {
    bucketFacets[b.key] = [
      {
        $match: {
          $or: [
            { lastContactedAt: { $gte: b.start, $lte: b.end } },
            {
              status: { $nin: ["uncontacted", null] },
              updatedAt: { $gte: b.start, $lte: b.end },
            },
            {
              "notes.createdAt": { $gte: b.start, $lte: b.end },
            },
          ],
        },
      },
      { $count: "count" },
    ];
  });

  // Run comprehensive MongoDB aggregation pipeline
  const [aggregationResult, totalSearchClusters] = await Promise.all([
    LeadModel.aggregate([
      {
        $facet: {
          // 1. Velocity Today & Yesterday
          todayTouches: [
            {
              $match: {
                $or: [
                  { lastContactedAt: { $gte: startOfToday, $lte: endOfToday } },
                  {
                    status: { $nin: ["uncontacted", null] },
                    updatedAt: { $gte: startOfToday, $lte: endOfToday },
                  },
                  { "notes.createdAt": { $gte: startOfToday, $lte: endOfToday } },
                ],
              },
            },
            { $count: "count" },
          ],
          yesterdayTouches: [
            {
              $match: {
                $or: [
                  { lastContactedAt: { $gte: startOfYesterday, $lte: endOfYesterday } },
                  {
                    status: { $nin: ["uncontacted", null] },
                    updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
                  },
                  { "notes.createdAt": { $gte: startOfYesterday, $lte: endOfYesterday } },
                ],
              },
            },
            { $count: "count" },
          ],

          // 2. High-level KPI Summary
          kpiSummary: [
            {
              $group: {
                _id: null,
                totalLeads: { $sum: 1 },
                verifiedCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$phone", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$email", ""] } }, 0] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                prospectsWithoutWebsite: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$website", ""] },
                          { $eq: ["$website", null] },
                          { $not: ["$website"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                enrichedSocialCount: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: [{ $strLenCP: { $ifNull: ["$facebook", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$instagram", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$linkedin", ""] } }, 0] },
                          { $gt: [{ $strLenCP: { $ifNull: ["$whatsapp", ""] } }, 0] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // 3. Funnel Stages Breakdown
          stageStats: [
            {
              $group: {
                _id: { $ifNull: ["$status", "uncontacted"] },
                count: { $sum: 1 },
              },
            },
          ],

          // 4. Platform Footprint Breakdown
          platformFootprint: [
            {
              $group: {
                _id: { $toLower: { $ifNull: ["$source", "other"] } },
                count: { $sum: 1 },
              },
            },
          ],

          // 5. Dynamic Timeframe Buckets
          ...bucketFacets,

          // 6. Moderator Leaderboard Touches Today
          moderatorTouchesToday: [
            {
              $match: {
                $or: [
                  { lastContactedAt: { $gte: startOfToday, $lte: endOfToday } },
                  { "notes.createdAt": { $gte: startOfToday, $lte: endOfToday } },
                ],
              },
            },
            {
              $group: {
                _id: {
                  $ifNull: [
                    "$lastContactedBy.userId",
                    { $ifNull: ["$assignedTo.userId", "unassigned"] },
                  ],
                },
                name: {
                  $first: {
                    $ifNull: [
                      "$lastContactedBy.name",
                      { $ifNull: ["$assignedTo.name", "Moderator"] },
                    ],
                  },
                },
                email: {
                  $first: {
                    $ifNull: [
                      "$lastContactedBy.email",
                      { $ifNull: ["$assignedTo.email", ""] },
                    ],
                  },
                },
                todayTouches: { $sum: 1 },
              },
            },
          ],

          // 7. Deal Value Pipeline
          dealPipeline: [
            {
              $group: {
                _id: null,
                totalPipelineValue: { $sum: { $ifNull: ["$dealValue", 0] } },
                closedWonValue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "converted"] },
                      { $ifNull: ["$dealValue", 0] },
                      0,
                    ],
                  },
                },
                activeDealsValue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "interested"] },
                      { $ifNull: ["$dealValue", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],

          // 8. Top Performing Search Queries
          topSearchQueries: [
            {
              $group: {
                _id: "$searchQuery",
                totalLeads: { $sum: 1 },
                convertedLeads: {
                  $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
                },
              },
            },
            { $sort: { totalLeads: -1 } },
            { $limit: 5 },
          ],

          // 9. Recent Leads
          recentLeads: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]),
    SearchGroupModel.countDocuments(),
  ]);

  const raw = aggregationResult[0] || {};

  // Velocity Metrics
  const todayTarget = getTargetForDate(startOfToday, settings.targetHistory, dailyTarget);
  const yesterdayTarget = getTargetForDate(startOfYesterday, settings.targetHistory, dailyTarget);
  const todayCount = raw.todayTouches?.[0]?.count || 0;
  const yesterdayCount = raw.yesterdayTouches?.[0]?.count || 0;
  const progressPercent = Math.min(100, Math.round((todayCount / (todayTarget || 1)) * 100));

  // KPI Summary
  const kpiData = raw.kpiSummary?.[0] || {
    totalLeads: 0,
    verifiedCount: 0,
    prospectsWithoutWebsite: 0,
    enrichedSocialCount: 0,
  };
  const totalLeads = kpiData.totalLeads || 0;
  const verifiedCount = kpiData.verifiedCount || 0;
  const conversionRate = Math.round((verifiedCount / (totalLeads || 1)) * 100);
  const prospectsWithoutWebsite = kpiData.prospectsWithoutWebsite || 0;
  const prospectsWithoutWebsitePercent = Math.round(
    (prospectsWithoutWebsite / (totalLeads || 1)) * 100,
  );
  const enrichedSocialCount = kpiData.enrichedSocialCount || 0;
  const enrichedSocialPercent = Math.round(
    (enrichedSocialCount / (totalLeads || 1)) * 100,
  );

  // Funnel Stages
  const stagesMap: Record<string, number> = {
    uncontacted: 0,
    called: 0,
    call_later: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    invalid: 0,
  };
  (raw.stageStats || []).forEach((item: { _id: string; count: number }) => {
    if (stagesMap[item._id] !== undefined) {
      stagesMap[item._id] = item.count;
    } else {
      stagesMap.uncontacted += item.count;
    }
  });

  const contactedCount = totalLeads - stagesMap.uncontacted;
  const activeNegotiation = stagesMap.called + stagesMap.call_later;
  const pipelineDeals = stagesMap.interested + stagesMap.converted;

  // Platform Footprint
  let googleMaps = 0;
  let instagramFacebook = 0;
  let linkedin = 0;
  let otherPlatforms = 0;

  (raw.platformFootprint || []).forEach((item: { _id: string; count: number }) => {
    const src = (item._id || "").toLowerCase();
    if (src.includes("google")) {
      googleMaps += item.count;
    } else if (src.includes("instagram") || src.includes("facebook")) {
      instagramFacebook += item.count;
    } else if (src.includes("linkedin")) {
      linkedin += item.count;
    } else {
      otherPlatforms += item.count;
    }
  });

  // Timeframe Benchmark Configuration
  let periodBenchmark = dailyTarget;
  let benchmarkUnitLabel = "day";
  let title = "7-Day Team Outreach Volume vs. Configured Target Benchmark";
  let description = `Continuous benchmark reference line set to ${dailyTarget} touches/day. Monitor daily team compliance, weekly cadence, and goal attainment.`;

  if (timeframe === "1m") {
    periodBenchmark = dailyTarget;
    benchmarkUnitLabel = "day";
    title = "30-Day Team Outreach Volume & Daily Consistency Trend";
    description = `Tracking day-by-day touches across the past 30 days against the ${dailyTarget}/day benchmark.`;
  } else if (timeframe === "3m") {
    periodBenchmark = dailyTarget * 5;
    benchmarkUnitLabel = "week";
    title = "3-Month Team Outreach Cadence & Weekly Attainment";
    description = `Aggregated across 12 weekly periods against a 5-day weekly target of ${periodBenchmark} touches/week.`;
  } else if (timeframe === "6m") {
    periodBenchmark = dailyTarget * 22;
    benchmarkUnitLabel = "month";
    title = "6-Month Outreach Velocity & Monthly Performance";
    description = `Tracking total monthly touches across the past 6 months against an estimated monthly benchmark of ${periodBenchmark}.`;
  } else if (timeframe === "1y") {
    periodBenchmark = dailyTarget * 22;
    benchmarkUnitLabel = "month";
    title = "1-Year Comprehensive Outreach & Pipeline Growth Trend";
    description = `Full 12-month historical outreach view across the workspace with ${periodBenchmark} touches/month reference benchmark.`;
  }

  // Construct Buckets with Database Counts
  const buckets: TTrendBucket[] = bucketConfigs.map((b) => {
    const count = raw[b.key]?.[0]?.count || 0;

    let bucketTarget = periodBenchmark;
    if (timeframe === "7d" || timeframe === "1m") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget);
    } else if (timeframe === "3m") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget) * 5;
    } else if (timeframe === "6m" || timeframe === "1y") {
      bucketTarget = getTargetForDate(b.start, settings.targetHistory, dailyTarget) * 22;
    }

    const progressPercent = Math.round((count / (bucketTarget || 1)) * 100);
    const metTarget = count >= bucketTarget;

    const unitDesc = timeframe === "7d" || timeframe === "1m" ? "target" : "benchmark";
    const statusDesc = metTarget ? "Target Met" : "Below Target";
    const tooltipText = `${b.label}: ${count} / ${bucketTarget} touches (${progressPercent}% of ${unitDesc} • ${statusDesc})`;

    return {
      key: b.key,
      label: b.label,
      subLabel: b.subLabel,
      count,
      target: bucketTarget,
      progressPercent,
      metTarget,
      isCurrent: b.isCurrent,
      tooltipText,
    };
  });

  const totalTouchpoints = buckets.reduce((acc, b) => acc + b.count, 0);
  const divisor = buckets.length || 1;
  const periodAverage = Math.round((totalTouchpoints / divisor) * 10) / 10;
  const maxBucketValue = Math.max(periodBenchmark * 1.3, ...buckets.map((b) => b.count), ...buckets.map((b) => b.target), 1);

  // Metric pills
  let metric1Label = "Today's Workspace Touches";
  let metric1Value = todayCount;
  let metric1Sub = `${Math.round((todayCount / (todayTarget || 1)) * 100)}% of daily target (${todayCount} / ${todayTarget})`;

  let metric2Label = "Yesterday's Completed";
  let metric2Value = yesterdayCount;
  let metric2Sub =
    yesterdayCount >= yesterdayTarget
      ? `✓ Target met (${yesterdayCount} / ${yesterdayTarget})`
      : `${yesterdayTarget - yesterdayCount} below target (${yesterdayCount} / ${yesterdayTarget})`;

  let metric4Label = `${timeframe.toUpperCase()} Daily Average`;
  let metric4Sub = `Benchmark: ${periodBenchmark} / ${benchmarkUnitLabel}`;

  if (timeframe === "1m") {
    const daysMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Days Target Met (Past 30D)";
    metric1Value = daysMet;
    metric1Sub = `${Math.round((daysMet / 30) * 100)}% consistency rate (${daysMet} / 30 days)`;

    const peakDay = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Outreach Day";
    metric2Value = peakDay ? peakDay.count : 0;
    metric2Sub = peakDay ? `Peak on ${peakDay.label}` : "None recorded";

    metric4Label = "30-Day Daily Average";
    metric4Sub = `Benchmark: ${dailyTarget} / day`;
  } else if (timeframe === "3m") {
    const weeksMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Weeks Quota Achieved";
    metric1Value = weeksMet;
    metric1Sub = `${Math.round((weeksMet / 12) * 100)}% weekly attainment (${weeksMet} / 12 wks)`;

    const peakWk = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Weekly Volume";
    metric2Value = peakWk ? peakWk.count : 0;
    metric2Sub = peakWk ? `${peakWk.subLabel}` : "None recorded";

    metric4Label = "Weekly Outreach Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / week`;
  } else if (timeframe === "6m") {
    const monthsMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Months Quota Achieved";
    metric1Value = monthsMet;
    metric1Sub = `${Math.round((monthsMet / 6) * 100)}% monthly attainment (${monthsMet} / 6 mos)`;

    const peakMo = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Monthly Volume";
    metric2Value = peakMo ? peakMo.count : 0;
    metric2Sub = peakMo ? `${peakMo.label} ${peakMo.subLabel}` : "None recorded";

    metric4Label = "Monthly Outreach Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / month`;
  } else if (timeframe === "1y") {
    const monthsMet = buckets.filter((b) => b.metTarget).length;
    metric1Label = "Months Quota Achieved";
    metric1Value = monthsMet;
    metric1Sub = `${Math.round((monthsMet / 12) * 100)}% annual consistency (${monthsMet} / 12 mos)`;

    const peakYrMo = [...buckets].sort((a, b) => b.count - a.count)[0];
    metric2Label = "Peak Monthly Volume";
    metric2Value = peakYrMo ? peakYrMo.count : 0;
    metric2Sub = peakYrMo ? `${peakYrMo.label} ${peakYrMo.subLabel}` : "None recorded";

    metric4Label = "Annual Monthly Average";
    metric4Sub = `Benchmark: ${periodBenchmark} / month`;
  }

  // Moderator Leaderboard formatting
  const moderatorLeaderboard = (raw.moderatorTouchesToday || []).map(
    (item: { _id: string; name: string; email: string; todayTouches: number }) => {
      const touches = item.todayTouches || 0;
      const pct = Math.min(100, Math.round((touches / dailyTarget) * 100));
      return {
        userId: item._id,
        name: item.name || "Moderator",
        email: item.email || "",
        role: "moderator",
        todayTouches: touches,
        progressPercent: pct,
        isMet: touches >= dailyTarget,
        toGo: Math.max(0, dailyTarget - touches),
      };
    },
  );

  // Deal Pipeline Summary
  const dealsRaw = raw.dealPipeline?.[0] || {};
  const dealPipeline = {
    totalPipelineValue: dealsRaw.totalPipelineValue || 0,
    closedWonValue: dealsRaw.closedWonValue || 0,
    activeDealsValue: dealsRaw.activeDealsValue || 0,
  };

  // Top Search Queries
  const topSearchQueries = (raw.topSearchQueries || []).map(
    (item: { _id: string; totalLeads: number; convertedLeads: number }) => ({
      query: item._id || "Unknown query",
      totalLeads: item.totalLeads || 0,
      convertedLeads: item.convertedLeads || 0,
    }),
  );

  // Recent Leads & Activities
  const recentLeads = raw.recentLeads || [];
  const recentActivities = recentLeads.map((l: any, i: number) => ({
    id: `act-${l.leadId || i}`,
    leadName: l.name,
    searchQuery: l.searchQuery,
    timestamp: l.createdAt,
    action: "captured",
    source: l.source,
  }));

  return {
    timeframe,
    dailyTarget,
    velocity: {
      todayCount,
      yesterdayCount,
      dailyTarget: todayTarget,
      progressPercent,
      isTargetMet: todayCount >= todayTarget,
      differenceFromYesterday: todayCount - yesterdayCount,
    },
    kpiSummary: {
      totalLeads,
      totalSearchClusters,
      verifiedCount,
      conversionRate,
      prospectsWithoutWebsite,
      prospectsWithoutWebsitePercent,
      enrichedSocialCount,
      enrichedSocialPercent,
    },
    funnelStages: {
      uncontacted: stagesMap.uncontacted,
      called: stagesMap.called,
      call_later: stagesMap.call_later,
      interested: stagesMap.interested,
      converted: stagesMap.converted,
      not_interested: stagesMap.not_interested,
      invalid: stagesMap.invalid,
      pipelineDeals,
      contactRate: Math.round((contactedCount / (totalLeads || 1)) * 100),
      activeNegotiationRate: Math.round((activeNegotiation / (totalLeads || 1)) * 100),
      dealProposalRate: Math.round((stagesMap.interested / (totalLeads || 1)) * 100),
      winRate: Math.round((stagesMap.converted / (totalLeads || 1)) * 100),
    },
    platformFootprint: {
      googleMaps,
      instagramFacebook,
      linkedin,
      other: otherPlatforms,
    },
    trendAnalytics: {
      timeframe,
      periodBenchmark,
      benchmarkUnitLabel,
      title,
      description,
      buckets,
      totalTouchpoints,
      periodAverage,
      maxBucketValue,
      metric1Label,
      metric1Value,
      metric1Sub,
      metric2Label,
      metric2Value,
      metric2Sub,
      metric4Label,
      metric4Sub,
    },
    moderatorLeaderboard,
    dealPipeline,
    topSearchQueries,
    recentLeads,
    recentActivities,
  };
};

const getModeratorDashboardData = async (
  userId?: string,
): Promise<TModeratorDashboardResponse> => {
  const settings = await settingsService.getSettings();
  const dailyTarget = settings.dailyApproachTarget || 25;
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = startOfToday + 86400000 - 1;
  const startOfYesterday = startOfToday - 86400000;
  const endOfYesterday = startOfToday - 1;

  // Moderator attribution match
  const moderatorMatch: any = {
    $or: [
      { lastContactedAt: { $gte: startOfToday, $lte: endOfToday } },
      {
        status: { $nin: ["uncontacted", null] },
        updatedAt: { $gte: startOfToday, $lte: endOfToday },
      },
      { "notes.createdAt": { $gte: startOfToday, $lte: endOfToday } },
    ],
  };

  if (userId) {
    moderatorMatch.$and = [
      {
        $or: [
          { "lastContactedBy.userId": userId },
          { "assignedTo.userId": userId },
          { "notes.createdBy.userId": userId },
        ],
      },
    ];
  }

  const [aggregationResult] = await LeadModel.aggregate([
    {
      $facet: {
        // 1. Stage Counts
        stageStats: [
          {
            $group: {
              _id: { $ifNull: ["$status", "uncontacted"] },
              count: { $sum: 1 },
            },
          },
        ],

        // 2. Today's Touches Across Workspace
        todayTouchesAll: [
          {
            $match: {
              $or: [
                { lastContactedAt: { $gte: startOfToday, $lte: endOfToday } },
                {
                  status: { $nin: ["uncontacted", null] },
                  updatedAt: { $gte: startOfToday, $lte: endOfToday },
                },
                { "notes.createdAt": { $gte: startOfToday, $lte: endOfToday } },
              ],
            },
          },
          { $count: "count" },
        ],

        // 3. Yesterday's Touches Across Workspace
        yesterdayTouchesAll: [
          {
            $match: {
              $or: [
                { lastContactedAt: { $gte: startOfYesterday, $lte: endOfYesterday } },
                {
                  status: { $nin: ["uncontacted", null] },
                  updatedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
                },
                { "notes.createdAt": { $gte: startOfYesterday, $lte: endOfYesterday } },
              ],
            },
          },
          { $count: "count" },
        ],

        // 4. Moderator-Specific Today Touches
        moderatorTodayTouches: [
          { $match: moderatorMatch },
          { $count: "count" },
        ],

        // 5. Today's Touchpoint Breakdown
        todayTouchBreakdown: [
          { $match: moderatorMatch },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],

        // 6. Today's Due Follow-Up Calls
        todayFollowUps: [
          {
            $match: {
              followUpDate: { $lte: endOfToday, $ne: null },
              status: { $nin: ["converted", "not_interested", "invalid"] },
            },
          },
          { $sort: { followUpDate: 1 } },
          { $limit: 20 },
        ],

        // 7. Priority Uncontacted Hot Prospects
        hotProspects: [
          {
            $match: {
              status: "uncontacted",
              phone: { $exists: true, $ne: "" },
              $or: [{ website: "" }, { website: null }, { website: { $exists: false } }],
            },
          },
          { $limit: 4 },
        ],

        // 8. Recent Leads
        recentLeads: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
        ],
      },
    },
  ]);

  const raw = aggregationResult || {};

  // Stage Stats
  const stageStats: Record<string, number> = {
    uncontacted: 0,
    called: 0,
    call_later: 0,
    interested: 0,
    converted: 0,
    not_interested: 0,
    invalid: 0,
  };
  (raw.stageStats || []).forEach((item: { _id: string; count: number }) => {
    if (stageStats[item._id] !== undefined) {
      stageStats[item._id] = item.count;
    } else {
      stageStats.uncontacted += item.count;
    }
  });

  const todayTarget = getTargetForDate(startOfToday, settings.targetHistory, dailyTarget);
  const todayCount = raw.todayTouchesAll?.[0]?.count || 0;
  const yesterdayCount = raw.yesterdayTouchesAll?.[0]?.count || 0;
  const moderatorTodayCount = raw.moderatorTodayTouches?.[0]?.count || todayCount;
  const remainingToGo = Math.max(0, todayTarget - moderatorTodayCount);
  const progressPercent = Math.min(100, Math.round((moderatorTodayCount / (todayTarget || 1)) * 100));

  // Touchpoint Breakdown
  let calledToday = 0;
  let interestedToday = 0;
  let callLaterToday = 0;

  (raw.todayTouchBreakdown || []).forEach((item: { _id: string; count: number }) => {
    if (item._id === "called") calledToday += item.count;
    if (item._id === "interested" || item._id === "converted") interestedToday += item.count;
    if (item._id === "call_later") callLaterToday += item.count;
  });

  // Enrich Follow-Ups with real-time indicators
  const nowMs = Date.now();
  const todayFollowUps = (raw.todayFollowUps || []).map((lead: any) => {
    const ts = Number(lead.followUpDate);
    const isOverdue = ts < nowMs;
    const isDueNow = Math.abs(ts - nowMs) <= 1000 * 60 * 30; // within 30 min
    const callNotes = lead.notes || [];
    const lastCallNote = callNotes[callNotes.length - 1] || null;

    return {
      lead,
      followUpTs: ts,
      isOverdue,
      isDueNow,
      lastCallNote,
    };
  });

  const totalLeads = Object.values(stageStats).reduce((acc, curr) => acc + curr, 0);

  return {
    dailyTarget: todayTarget,
    kpiStats: {
      dailyTarget: todayTarget,
      todayCount,
      moderatorTodayCount,
      yesterdayCount,
      remainingToGo,
      progressPercent,
      isTargetMet: moderatorTodayCount >= todayTarget,
      calledToday,
      interestedToday,
      callLaterToday,
    },
    stageStats: {
      uncontacted: stageStats.uncontacted,
      called: stageStats.called,
      call_later: stageStats.call_later,
      interested: stageStats.interested,
      converted: stageStats.converted,
      not_interested: stageStats.not_interested,
      invalid: stageStats.invalid,
    },
    totalLeads,
    todayFollowUps,
    hotProspects: raw.hotProspects || [],
    recentLeads: raw.recentLeads || [],
  };
};

export const dashboardService = {
  getAdminDashboardData,
  getModeratorDashboardData,
};
